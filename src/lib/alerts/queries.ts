import { and, desc, eq, gte, inArray, sql } from "drizzle-orm"
import { db } from "@/db/client"
import { alertEvents, alertRules, scoreSnapshots } from "@/db/schema"
import type { AlertRuleWithAsset } from "@/lib/alerts/types"
import type { ScoreSnapshotRecord } from "@/lib/scores/snapshots"
import { getLatestSectorSnapshots } from "@/lib/scores/snapshots"
import { getRuleTargetSector } from "@/lib/alerts/evaluation"
import type { SectorName } from "@/scoring/types"

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
        columns: { symbol: true, name: true },
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
        columns: { symbol: true, name: true },
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

  return rows.map((row) => ({
    id: row.id,
    assetId: row.assetId,
    sector: row.sector as SectorName,
    score: row.score,
    isNull: row.isNull,
    nullReason: row.nullReason,
    isStale: row.isStale,
    componentsJson: row.componentsJson as Record<string, unknown> | null,
    sourceMetadataJson: row.sourceMetadataJson as ScoreSnapshotRecord["sourceMetadataJson"],
    computedAt: row.computedAt,
    validForDate: row.validForDate,
    cadence: row.cadence as ScoreSnapshotRecord["cadence"],
  }))
}

export const getLatestSnapshotForRule = async (
  rule: Pick<typeof alertRules.$inferSelect, "assetId" | "scope" | "sector">
): Promise<ScoreSnapshotRecord | null> => {
  const sector = getRuleTargetSector(rule)
  const snapshots = await getLatestSectorSnapshots(rule.assetId)

  return snapshots[sector]
}

export const hasAlertEventForSnapshot = async (
  alertRuleId: string,
  scoreSnapshotId: string
): Promise<boolean> => {
  const existing = await db.query.alertEvents.findFirst({
    where: and(
      eq(alertEvents.alertRuleId, alertRuleId),
      eq(alertEvents.scoreSnapshotId, scoreSnapshotId)
    ),
    columns: { id: true },
  })

  return Boolean(existing)
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

export const getLastSentAlertAt = async (alertRuleId: string): Promise<Date | null> => {
  const row = await db.query.alertEvents.findFirst({
    where: and(eq(alertEvents.alertRuleId, alertRuleId), eq(alertEvents.telegramStatus, "sent")),
    orderBy: [desc(alertEvents.sentAt)],
    columns: { sentAt: true },
  })

  return row?.sentAt ?? null
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
        columns: { symbol: true, name: true },
      },
    },
  })

  return rows as AlertRuleWithAsset[]
}
