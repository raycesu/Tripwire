import { eq } from "drizzle-orm"
import { db } from "@/db/client"
import { alertEvents } from "@/db/schema"
import {
  buildAlertMessage,
  doesRuleMatchSnapshot,
  getRuleTargetSector,
  parseSnapshotScore,
  prioritizeAlertRules,
} from "@/lib/alerts/evaluation"
import {
  countGlobalSentAlertsInLastMinute,
  getAlertRuleForUser,
  getLastSentAlertAt,
  getLatestSnapshotForRule,
  getSnapshotsByIds,
  hasAlertEventForSnapshot,
  listEnabledAlertRules,
  listEnabledRulesForSnapshots,
  listRetryableAlertEvents,
} from "@/lib/alerts/queries"
import type { AlertRuleWithAsset } from "@/lib/alerts/types"
import { env } from "@/lib/env"
import { getLatestSectorSnapshots, type ScoreSnapshotRecord } from "@/lib/scores/snapshots"
import { markTelegramDisconnected } from "@/lib/telegram/link-chat"
import { getUserTelegramChatId } from "@/lib/telegram/queries"
import { sendTelegramMessage, TelegramSendError } from "@/providers/telegram"
import {
  createAlertRunSummary,
  mergeAlertRunSummaries,
  type AlertRunSummary,
} from "@/jobs/types"

type AlertCandidate = {
  rule: AlertRuleWithAsset
  snapshot: ScoreSnapshotRecord
}

const isWithinCooldown = async (
  rule: AlertRuleWithAsset,
  now: Date
): Promise<boolean> => {
  if (rule.cooldownMinutes <= 0) {
    return false
  }

  const lastSent = await getLastSentAlertAt(rule.id)

  if (!lastSent) {
    return false
  }

  const cooldownMs = rule.cooldownMinutes * 60_000
  return now.getTime() - lastSent.getTime() < cooldownMs
}

const recordAlertEvent = async (input: {
  rule: AlertRuleWithAsset
  snapshot: ScoreSnapshotRecord
  message: string
  telegramStatus: "sent" | "failed" | "skipped_rate_limited"
  telegramError?: string
  sentAt?: Date
}): Promise<void> => {
  const triggeredValue = parseSnapshotScore(input.snapshot.score) ?? 0

  await db.insert(alertEvents).values({
    alertRuleId: input.rule.id,
    userId: input.rule.userId,
    assetId: input.rule.assetId,
    scoreSnapshotId: input.snapshot.id,
    triggeredValue: String(triggeredValue),
    message: input.message,
    telegramStatus: input.telegramStatus,
    telegramError: input.telegramError ?? null,
    sentAt: input.sentAt ?? null,
  })
}

const buildCandidates = (
  rules: AlertRuleWithAsset[],
  snapshotsById: Map<string, ScoreSnapshotRecord>
): AlertCandidate[] => {
  const candidates: AlertCandidate[] = []

  for (const rule of rules) {
    const targetSector = getRuleTargetSector(rule)

    for (const snapshot of snapshotsById.values()) {
      if (snapshot.assetId !== rule.assetId) {
        continue
      }

      if (snapshot.sector !== targetSector) {
        continue
      }

      if (!doesRuleMatchSnapshot(rule, snapshot)) {
        continue
      }

      candidates.push({ rule, snapshot })
    }
  }

  return candidates
}

const processCandidate = async (
  candidate: AlertCandidate,
  summary: AlertRunSummary,
  userSentCounts: Map<string, number>,
  globalSentRemaining: { value: number }
): Promise<void> => {
  const { rule, snapshot } = candidate

  if (await hasAlertEventForSnapshot(rule.id, snapshot.id)) {
    summary.skippedDuplicate += 1
    return
  }

  const now = new Date()

  if (await isWithinCooldown(rule, now)) {
    summary.skippedCooldown += 1
    return
  }

  const chatId = await getUserTelegramChatId(rule.userId)

  if (!chatId) {
    summary.skippedNoTelegram += 1
    return
  }

  const userSent = userSentCounts.get(rule.userId) ?? 0

  if (userSent >= env.MAX_ALERTS_PER_USER_PER_RUN) {
    const sectorSnapshots = await getLatestSectorSnapshots(rule.assetId)
    const message = buildAlertMessage({
      assetSymbol: rule.asset.symbol,
      rule,
      snapshot,
      sectorSnapshots,
    })

    await recordAlertEvent({
      rule,
      snapshot,
      message,
      telegramStatus: "skipped_rate_limited",
      telegramError: "Per-user alert cap reached for this scoring run",
    })

    summary.skippedRateLimited += 1
    return
  }

  if (globalSentRemaining.value <= 0) {
    const sectorSnapshots = await getLatestSectorSnapshots(rule.assetId)
    const message = buildAlertMessage({
      assetSymbol: rule.asset.symbol,
      rule,
      snapshot,
      sectorSnapshots,
    })

    await recordAlertEvent({
      rule,
      snapshot,
      message,
      telegramStatus: "skipped_rate_limited",
      telegramError: "Global Telegram per-minute cap reached",
    })

    summary.skippedRateLimited += 1
    return
  }

  const sectorSnapshots = await getLatestSectorSnapshots(rule.assetId)
  const message = buildAlertMessage({
    assetSymbol: rule.asset.symbol,
    rule,
    snapshot,
    sectorSnapshots,
  })

  try {
    await sendTelegramMessage({ chatId, text: message })

    await recordAlertEvent({
      rule,
      snapshot,
      message,
      telegramStatus: "sent",
      sentAt: now,
    })

    userSentCounts.set(rule.userId, userSent + 1)
    globalSentRemaining.value -= 1
    summary.sent += 1
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    await recordAlertEvent({
      rule,
      snapshot,
      message,
      telegramStatus: "failed",
      telegramError: errorMessage,
    })

    summary.failed += 1
    summary.errors.push({
      ruleId: rule.id,
      assetSymbol: rule.asset.symbol,
      message: errorMessage,
    })

    if (error instanceof TelegramSendError && error.kind === "permanent") {
      const status = error.permanentKind === "blocked" ? "blocked" : "invalid_chat"
      await markTelegramDisconnected(rule.userId, status, errorMessage)
    }
  }
}

export const evaluateAlerts = async (input: {
  freshSnapshotIds: string[]
}): Promise<AlertRunSummary> => {
  const summary = createAlertRunSummary()

  if (input.freshSnapshotIds.length === 0) {
    return summary
  }

  const snapshots = await getSnapshotsByIds(input.freshSnapshotIds)
  const snapshotsById = new Map(snapshots.map((snapshot) => [snapshot.id, snapshot]))
  const assetIds = [...new Set(snapshots.map((snapshot) => snapshot.assetId))]
  const rules = await listEnabledRulesForSnapshots(assetIds)
  const candidates = buildCandidates(rules, snapshotsById)

  const seenRuleSnapshot = new Set<string>()
  const uniqueCandidates: AlertCandidate[] = []

  for (const candidate of candidates) {
    const key = `${candidate.rule.id}:${candidate.snapshot.id}`

    if (seenRuleSnapshot.has(key)) {
      continue
    }

    seenRuleSnapshot.add(key)
    uniqueCandidates.push(candidate)
  }

  uniqueCandidates.sort((a, b) => {
    const priority = prioritizeAlertRules([a.rule, b.rule])

    if (priority[0]?.id === a.rule.id) {
      return -1
    }

    if (priority[0]?.id === b.rule.id) {
      return 1
    }

    return 0
  })

  const globalSentCount = await countGlobalSentAlertsInLastMinute()
  const globalSentRemaining = {
    value: Math.max(0, env.MAX_TELEGRAM_MESSAGES_PER_MINUTE - globalSentCount),
  }
  const userSentCounts = new Map<string, number>()

  for (const candidate of uniqueCandidates) {
    await processCandidate(candidate, summary, userSentCounts, globalSentRemaining)
  }

  return summary
}

export const evaluateInitialMatch = async (ruleId: string): Promise<AlertRunSummary> => {
  const rule = await db.query.alertRules.findFirst({
    where: (fields, { eq: eqOp }) => eqOp(fields.id, ruleId),
    with: { asset: { columns: { symbol: true, name: true } } },
  })

  if (!rule || !rule.isEnabled) {
    return createAlertRunSummary()
  }

  const ruleWithAsset = rule as AlertRuleWithAsset
  const snapshot = await getLatestSnapshotForRule(ruleWithAsset)

  if (!snapshot || !doesRuleMatchSnapshot(ruleWithAsset, snapshot)) {
    return createAlertRunSummary()
  }

  return evaluateAlerts({ freshSnapshotIds: [snapshot.id] })
}

export const evaluateInitialMatchForUser = async (
  userId: string,
  ruleId: string
): Promise<AlertRunSummary> => {
  const rule = await getAlertRuleForUser(userId, ruleId)

  if (!rule) {
    return createAlertRunSummary()
  }

  return evaluateInitialMatch(ruleId)
}

export const collectUnsentMatchingSnapshotIds = async (): Promise<string[]> => {
  const rules = await listEnabledAlertRules()
  const snapshotIds: string[] = []

  for (const rule of rules) {
    const snapshot = await getLatestSnapshotForRule(rule)

    if (!snapshot || !doesRuleMatchSnapshot(rule, snapshot)) {
      continue
    }

    if (await hasAlertEventForSnapshot(rule.id, snapshot.id)) {
      continue
    }

    snapshotIds.push(snapshot.id)
  }

  return [...new Set(snapshotIds)]
}

const retryFailedAlertDeliveries = async (): Promise<AlertRunSummary> => {
  const summary = createAlertRunSummary()
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000)
  const retryableEvents = await listRetryableAlertEvents({ since, limit: 100 })

  const globalSentCount = await countGlobalSentAlertsInLastMinute()
  const globalSentRemaining = {
    value: Math.max(0, env.MAX_TELEGRAM_MESSAGES_PER_MINUTE - globalSentCount),
  }
  const userSentCounts = new Map<string, number>()

  for (const event of retryableEvents) {
    const chatId = await getUserTelegramChatId(event.userId)

    if (!chatId) {
      summary.skippedNoTelegram += 1
      continue
    }

    const userSent = userSentCounts.get(event.userId) ?? 0

    if (userSent >= env.MAX_ALERTS_PER_USER_PER_RUN) {
      summary.skippedRateLimited += 1
      continue
    }

    if (globalSentRemaining.value <= 0) {
      summary.skippedRateLimited += 1
      continue
    }

    const now = new Date()

    try {
      await sendTelegramMessage({ chatId, text: event.message })

      await db
        .update(alertEvents)
        .set({
          telegramStatus: "sent",
          telegramError: null,
          sentAt: now,
        })
        .where(eq(alertEvents.id, event.id))

      userSentCounts.set(event.userId, userSent + 1)
      globalSentRemaining.value -= 1
      summary.sent += 1
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"

      await db
        .update(alertEvents)
        .set({
          telegramStatus: "failed",
          telegramError: errorMessage,
        })
        .where(eq(alertEvents.id, event.id))

      summary.failed += 1
      summary.errors.push({
        ruleId: event.alertRuleId,
        assetSymbol: event.rule.asset.symbol,
        message: errorMessage,
      })

      if (error instanceof TelegramSendError && error.kind === "permanent") {
        const status = error.permanentKind === "blocked" ? "blocked" : "invalid_chat"
        await markTelegramDisconnected(event.userId, status, errorMessage)
      }
    }
  }

  return summary
}

export const runEvaluateAlertsRetry = async (): Promise<{ alertSummary: AlertRunSummary }> => {
  const catchUpIds = await collectUnsentMatchingSnapshotIds()
  const catchUpSummary = await evaluateAlerts({ freshSnapshotIds: catchUpIds })
  const retrySummary = await retryFailedAlertDeliveries()

  return {
    alertSummary: mergeAlertRunSummaries(catchUpSummary, retrySummary),
  }
}
