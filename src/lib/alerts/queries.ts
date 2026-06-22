import { and, desc, eq, gte, inArray, or, sql } from "drizzle-orm"
import { db } from "@/db/client"
import { alertEvents, alertRules, scoreSnapshots } from "@/db/schema"
import type { AlertEventDto, AlertRuleWithAsset } from "@/lib/alerts/types"
import { parseAlertMessageSectorScores } from "@/lib/alerts/evaluation"
import { formatRuleLabel, parseAlertOperator } from "@/lib/alerts/types"
import { resolveCompositeRecord } from "@/lib/scores/resolve-composite"
import type { ScoreSnapshotRecord } from "@/lib/scores/snapshots"
import { getLatestSectorSnapshots } from "@/lib/scores/snapshots"
import { getRuleTargetSector } from "@/lib/alerts/evaluation"
import { makeAlertEventKey, type AlertEventKeyPair } from "@/lib/alerts/event-keys"
import { computeIsStale } from "@/scoring/staleness"
import type { Cadence, SectorName } from "@/scoring/types"

export { makeAlertEventKey, type AlertEventKeyPair } from "@/lib/alerts/event-keys"

export const listAlertEventsForUser = async (
  userId: string,
  options: { limit?: number } = {}
): Promise<AlertEventDto[]> => {
  const limit = options.limit ?? 50

  const rows = await db.query.alertEvents.findMany({
    where: eq(alertEvents.userId, userId),
    orderBy: [desc(alertEvents.createdAt)],
    limit,
    with: {
      alertRule: true,
      asset: {
        columns: { symbol: true, name: true, assetType: true },
      },
    },
  })

  return rows.map((row) => {
    const rule = row.alertRule

    return {
      id: row.id,
      assetSymbol: row.asset.symbol,
      assetName: row.asset.name,
      ruleLabel: formatRuleLabel({
        scope: (rule.scope as "composite" | "sector") ?? "composite",
        sector: (rule.sector as import("@/scoring/types").SectorName | null) ?? null,
        operator: parseAlertOperator(rule.operator),
        threshold: Number(rule.threshold),
      }),
      triggeredValue: Number(row.triggeredValue),
      sectorScores: parseAlertMessageSectorScores(row.message),
      message: row.message,
      telegramStatus: row.telegramStatus,
      telegramError: row.telegramError,
      sentAt: row.sentAt,
      createdAt: row.createdAt,
    }
  })
}

export const countActiveAlertRules = async (userId: string): Promise<number> => {
  const rules = await db.query.alertRules.findMany({
    where: and(eq(alertRules.userId, userId), eq(alertRules.isEnabled, true)),
    columns: { id: true },
  })

  return rules.length
}

export const listAlertRulesForUser = async (userId: string): Promise<AlertRuleWithAsset[]> => {
  const rows = await db.query.alertRules.findMany({
    where: eq(alertRules.userId, userId),
    with: {
      asset: {
        columns: { symbol: true, name: true, assetType: true },
      },
    },
    orderBy: [desc(alertRules.createdAt)],
  })

  return rows as AlertRuleWithAsset[]
}

export const getAlertRuleForUser = async (
  userId: string,
  ruleId: string
): Promise<AlertRuleWithAsset | null> => {
  const row = await db.query.alertRules.findFirst({
    where: and(eq(alertRules.id, ruleId), eq(alertRules.userId, userId)),
    with: {
      asset: {
        columns: { symbol: true, name: true, assetType: true },
      },
    },
  })

  return (row as AlertRuleWithAsset | undefined) ?? null
}

export const getSnapshotsByIds = async (ids: string[]): Promise<ScoreSnapshotRecord[]> => {
  if (ids.length === 0) {
    return []
  }

  const rows = await db.select().from(scoreSnapshots).where(inArray(scoreSnapshots.id, ids))

  return rows.map((row) => {
    const sector = row.sector as SectorName
    const cadence = row.cadence as Cadence

    return {
      id: row.id,
      assetId: row.assetId,
      sector,
      score: row.score,
      isNull: row.isNull,
      nullReason: row.nullReason,
      isStale: computeIsStale(sector, cadence, row.computedAt),
      componentsJson: row.componentsJson as Record<string, unknown> | null,
      sourceMetadataJson: row.sourceMetadataJson as ScoreSnapshotRecord["sourceMetadataJson"],
      computedAt: row.computedAt,
      validForDate: row.validForDate,
      cadence,
    }
  })
}

export const getLatestSnapshotForRule = async (
  rule: Pick<typeof alertRules.$inferSelect, "assetId" | "scope" | "sector">
): Promise<ScoreSnapshotRecord | null> => {
  const snapshots = await getLatestSectorSnapshots(rule.assetId)
  return resolveLatestSnapshotForRule(rule, snapshots)
}

export const getExistingAlertEventKeys = async (
  pairs: AlertEventKeyPair[]
): Promise<Set<string>> => {
  if (pairs.length === 0) {
    return new Set()
  }

  const rows = await db
    .select({
      alertRuleId: alertEvents.alertRuleId,
      scoreSnapshotId: alertEvents.scoreSnapshotId,
    })
    .from(alertEvents)
    .where(
      or(
        ...pairs.map((pair) =>
          and(
            eq(alertEvents.alertRuleId, pair.alertRuleId),
            eq(alertEvents.scoreSnapshotId, pair.scoreSnapshotId)
          )
        )
      )
    )

  return new Set(
    rows.map((row) => makeAlertEventKey(row.alertRuleId, row.scoreSnapshotId))
  )
}

export const hasAlertEventForSnapshot = async (
  alertRuleId: string,
  scoreSnapshotId: string
): Promise<boolean> => {
  const keys = await getExistingAlertEventKeys([{ alertRuleId, scoreSnapshotId }])
  return keys.has(makeAlertEventKey(alertRuleId, scoreSnapshotId))
}

export const countGlobalSentAlertsInLastMinute = async (): Promise<number> => {
  const oneMinuteAgo = new Date(Date.now() - 60_000)

  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(alertEvents)
    .where(
      and(eq(alertEvents.telegramStatus, "sent"), gte(alertEvents.sentAt, oneMinuteAgo))
    )

  return rows[0]?.count ?? 0
}

export const getLastSentAlertAtByRuleIds = async (
  ruleIds: string[]
): Promise<Map<string, Date>> => {
  if (ruleIds.length === 0) {
    return new Map()
  }

  const rows = await db
    .select({
      alertRuleId: alertEvents.alertRuleId,
      sentAt: alertEvents.sentAt,
    })
    .from(alertEvents)
    .where(
      and(inArray(alertEvents.alertRuleId, ruleIds), eq(alertEvents.telegramStatus, "sent"))
    )
    .orderBy(desc(alertEvents.sentAt))

  const lastSentByRuleId = new Map<string, Date>()

  for (const row of rows) {
    if (!row.sentAt || lastSentByRuleId.has(row.alertRuleId)) {
      continue
    }

    lastSentByRuleId.set(row.alertRuleId, row.sentAt)
  }

  return lastSentByRuleId
}

export const getLastSentAlertAt = async (alertRuleId: string): Promise<Date | null> => {
  const map = await getLastSentAlertAtByRuleIds([alertRuleId])
  return map.get(alertRuleId) ?? null
}

export const resolveLatestSnapshotForRule = (
  rule: Pick<typeof alertRules.$inferSelect, "assetId" | "scope" | "sector">,
  sectorSnapshots: Record<SectorName, ScoreSnapshotRecord | null>
): ScoreSnapshotRecord | null => {
  const sector = getRuleTargetSector(rule)

  if (sector === "composite") {
    return resolveCompositeRecord(
      sectorSnapshots.composite,
      sectorSnapshots.macro,
      sectorSnapshots.relativity,
      sectorSnapshots.volume
    )
  }

  return sectorSnapshots[sector]
}

export const listEnabledRulesForSnapshots = async (
  snapshotAssetIds: string[]
): Promise<AlertRuleWithAsset[]> => {
  if (snapshotAssetIds.length === 0) {
    return []
  }

  const rows = await db.query.alertRules.findMany({
    where: and(eq(alertRules.isEnabled, true), inArray(alertRules.assetId, snapshotAssetIds)),
    with: {
      asset: {
        columns: { symbol: true, name: true, assetType: true },
      },
    },
  })

  return rows as AlertRuleWithAsset[]
}

export const listEnabledAlertRules = async (): Promise<AlertRuleWithAsset[]> => {
  const rows = await db.query.alertRules.findMany({
    where: eq(alertRules.isEnabled, true),
    with: {
      asset: {
        columns: { symbol: true, name: true, assetType: true },
      },
    },
  })

  return rows as AlertRuleWithAsset[]
}

export type RetryableAlertEventRow = {
  id: string
  alertRuleId: string
  userId: string
  message: string
  telegramStatus: string
  rule: AlertRuleWithAsset
}

export const listRetryableAlertEvents = async (input: {
  since: Date
  limit: number
}): Promise<RetryableAlertEventRow[]> => {
  const rows = await db.query.alertEvents.findMany({
    where: and(
      or(
        eq(alertEvents.telegramStatus, "failed"),
        eq(alertEvents.telegramStatus, "skipped_rate_limited")
      ),
      gte(alertEvents.createdAt, input.since)
    ),
    orderBy: [desc(alertEvents.createdAt)],
    limit: input.limit,
    with: {
      alertRule: {
        with: {
          asset: {
            columns: { symbol: true, name: true, assetType: true },
          },
        },
      },
    },
  })

  return rows
    .filter((row) => row.alertRule?.isEnabled)
    .map((row) => ({
      id: row.id,
      alertRuleId: row.alertRuleId,
      userId: row.userId,
      message: row.message,
      telegramStatus: row.telegramStatus,
      rule: row.alertRule as AlertRuleWithAsset,
    }))
}
