import { eq } from "drizzle-orm"
import { db } from "@/db/client"
import { alertEvents } from "@/db/schema"
import {
  buildAlertMessage,
  doesRuleMatchSnapshot,
  getRuleTargetSector,
  isRuleWithinCooldown,
  parseSnapshotScore,
  prioritizeAlertRules,
} from "@/lib/alerts/evaluation"
import { makeAlertEventKey } from "@/lib/alerts/event-keys"
import {
  countGlobalSentAlertsInLastMinute,
  getAlertRuleForUser,
  getExistingAlertEventKeys,
  getLastSentAlertAtByRuleIds,
  getLatestSnapshotForRule,
  getSnapshotsByIds,
  listEnabledAlertRules,
  listEnabledRulesForSnapshots,
  listRetryableAlertEvents,
  resolveLatestSnapshotForRule,
} from "@/lib/alerts/queries"
import type { AlertRuleWithAsset } from "@/lib/alerts/types"
import { env } from "@/lib/env"
import {
  getLatestSectorSnapshotsForAssets,
  type ScoreSnapshotRecord,
} from "@/lib/scores/snapshots"
import { markTelegramDisconnected } from "@/lib/telegram/link-chat"
import { getUserTelegramChatIds } from "@/lib/telegram/queries"
import { sendTelegramMessage, TelegramSendError } from "@/providers/telegram"
import {
  createAlertRunSummary,
  mergeAlertRunSummaries,
  type AlertRunSummary,
} from "@/jobs/types"
import type { SectorName } from "@/scoring/types"

type AlertCandidate = {
  rule: AlertRuleWithAsset
  snapshot: ScoreSnapshotRecord
}

type AlertEvaluationPrefetch = {
  existingEventKeys: Set<string>
  lastSentAtByRuleId: Map<string, Date>
  chatIdByUserId: Map<string, string | null>
  sectorSnapshotsByAssetId: Map<string, Record<SectorName, ScoreSnapshotRecord | null>>
}

const buildAlertEvaluationPrefetch = async (
  candidates: AlertCandidate[]
): Promise<AlertEvaluationPrefetch> => {
  if (candidates.length === 0) {
    return {
      existingEventKeys: new Set(),
      lastSentAtByRuleId: new Map(),
      chatIdByUserId: new Map(),
      sectorSnapshotsByAssetId: new Map(),
    }
  }

  const pairs = candidates.map((candidate) => ({
    alertRuleId: candidate.rule.id,
    scoreSnapshotId: candidate.snapshot.id,
  }))
  const ruleIdsWithCooldown = [
    ...new Set(
      candidates
        .filter((candidate) => candidate.rule.cooldownMinutes > 0)
        .map((candidate) => candidate.rule.id)
    ),
  ]
  const userIds = [...new Set(candidates.map((candidate) => candidate.rule.userId))]
  const assetIds = [...new Set(candidates.map((candidate) => candidate.rule.assetId))]

  const [existingEventKeys, lastSentAtByRuleId, chatIdByUserId, sectorSnapshotsByAssetId] =
    await Promise.all([
      getExistingAlertEventKeys(pairs),
      getLastSentAlertAtByRuleIds(ruleIdsWithCooldown),
      getUserTelegramChatIds(userIds),
      getLatestSectorSnapshotsForAssets(assetIds),
    ])

  return {
    existingEventKeys,
    lastSentAtByRuleId,
    chatIdByUserId,
    sectorSnapshotsByAssetId,
  }
}

const recordAlertEvent = async (input: {
  rule: AlertRuleWithAsset
  snapshot: ScoreSnapshotRecord
  message: string
  telegramStatus: "sent" | "failed" | "skipped_rate_limited"
  telegramError?: string
  sentAt?: Date
}): Promise<boolean> => {
  const triggeredValue = parseSnapshotScore(input.snapshot.score) ?? 0

  const rows = await db
    .insert(alertEvents)
    .values({
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
    .onConflictDoNothing({
      target: [alertEvents.alertRuleId, alertEvents.scoreSnapshotId],
    })
    .returning({ id: alertEvents.id })

  return rows.length > 0
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

const getSectorSnapshotsForCandidate = (
  candidate: AlertCandidate,
  prefetch: AlertEvaluationPrefetch
): Record<SectorName, ScoreSnapshotRecord | null> => {
  return (
    prefetch.sectorSnapshotsByAssetId.get(candidate.rule.assetId) ?? {
      macro: null,
      relativity: null,
      volume: null,
      composite: null,
    }
  )
}

const processCandidate = async (
  candidate: AlertCandidate,
  summary: AlertRunSummary,
  userSentCounts: Map<string, number>,
  globalSentRemaining: { value: number },
  prefetch: AlertEvaluationPrefetch
): Promise<void> => {
  const { rule, snapshot } = candidate
  const eventKey = makeAlertEventKey(rule.id, snapshot.id)

  if (prefetch.existingEventKeys.has(eventKey)) {
    summary.skippedDuplicate += 1
    return
  }

  const now = new Date()

  if (
    isRuleWithinCooldown(
      rule.cooldownMinutes,
      prefetch.lastSentAtByRuleId.get(rule.id),
      now
    )
  ) {
    summary.skippedCooldown += 1
    return
  }

  const chatId = prefetch.chatIdByUserId.get(rule.userId) ?? null

  if (!chatId) {
    summary.skippedNoTelegram += 1
    return
  }

  const sectorSnapshots = getSectorSnapshotsForCandidate(candidate, prefetch)
  const userSent = userSentCounts.get(rule.userId) ?? 0

  if (userSent >= env.MAX_ALERTS_PER_USER_PER_RUN) {
    const message = buildAlertMessage({
      assetSymbol: rule.asset.symbol,
      rule,
      snapshot,
      sectorSnapshots,
    })

    const inserted = await recordAlertEvent({
      rule,
      snapshot,
      message,
      telegramStatus: "skipped_rate_limited",
      telegramError: "Per-user alert cap reached for this scoring run",
    })

    if (!inserted) {
      summary.skippedDuplicate += 1
      return
    }

    summary.skippedRateLimited += 1
    return
  }

  if (globalSentRemaining.value <= 0) {
    const message = buildAlertMessage({
      assetSymbol: rule.asset.symbol,
      rule,
      snapshot,
      sectorSnapshots,
    })

    const inserted = await recordAlertEvent({
      rule,
      snapshot,
      message,
      telegramStatus: "skipped_rate_limited",
      telegramError: "Global Telegram per-minute cap reached",
    })

    if (!inserted) {
      summary.skippedDuplicate += 1
      return
    }

    summary.skippedRateLimited += 1
    return
  }

  const message = buildAlertMessage({
    assetSymbol: rule.asset.symbol,
    rule,
    snapshot,
    sectorSnapshots,
  })

  try {
    await sendTelegramMessage({ chatId, text: message })

    const inserted = await recordAlertEvent({
      rule,
      snapshot,
      message,
      telegramStatus: "sent",
      sentAt: now,
    })

    if (!inserted) {
      summary.skippedDuplicate += 1
      return
    }

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
    const key = makeAlertEventKey(candidate.rule.id, candidate.snapshot.id)

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
  const prefetch = await buildAlertEvaluationPrefetch(uniqueCandidates)

  for (const candidate of uniqueCandidates) {
    await processCandidate(candidate, summary, userSentCounts, globalSentRemaining, prefetch)
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

  if (rules.length === 0) {
    return []
  }

  const assetIds = [...new Set(rules.map((rule) => rule.assetId))]
  const sectorSnapshotsByAssetId = await getLatestSectorSnapshotsForAssets(assetIds)
  const matching: AlertCandidate[] = []

  for (const rule of rules) {
    const sectorSnapshots = sectorSnapshotsByAssetId.get(rule.assetId)

    if (!sectorSnapshots) {
      continue
    }

    const snapshot = resolveLatestSnapshotForRule(rule, sectorSnapshots)

    if (!snapshot || !doesRuleMatchSnapshot(rule, snapshot)) {
      continue
    }

    matching.push({ rule, snapshot })
  }

  const existingEventKeys = await getExistingAlertEventKeys(
    matching.map((candidate) => ({
      alertRuleId: candidate.rule.id,
      scoreSnapshotId: candidate.snapshot.id,
    }))
  )

  const snapshotIds: string[] = []

  for (const candidate of matching) {
    const eventKey = makeAlertEventKey(candidate.rule.id, candidate.snapshot.id)

    if (existingEventKeys.has(eventKey)) {
      continue
    }

    snapshotIds.push(candidate.snapshot.id)
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
  const userIds = [...new Set(retryableEvents.map((event) => event.userId))]
  const chatIdByUserId = await getUserTelegramChatIds(userIds)

  for (const event of retryableEvents) {
    const chatId = chatIdByUserId.get(event.userId) ?? null

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
