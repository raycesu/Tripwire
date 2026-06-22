import { and, desc, eq, inArray } from "drizzle-orm"
import { db } from "@/db/client"
import { scoreSnapshots } from "@/db/schema"
import { resolveCompositeForDisplay } from "@/lib/scores/resolve-composite"
import { mapRowToScoreHistoryPoint } from "@/lib/scores/history"
import type { AssetSnapshotsSummary, ScoreHistoryPoint, ScoreSnapshotView } from "@/lib/scores/types"
import { computeIsStale } from "@/scoring/staleness"
import type { Cadence, SectorName } from "@/scoring/types"

export { mapRowToScoreHistoryPoint } from "@/lib/scores/history"

const DEFAULT_HISTORY_LIMIT = 90

const mapRowToView = (row: typeof scoreSnapshots.$inferSelect): ScoreSnapshotView => {
  const sector = row.sector as SectorName | "composite"
  const cadence = row.cadence as Cadence
  const isStale = computeIsStale(sector as SectorName, cadence, row.computedAt)

  return {
    id: row.id,
    sector,
    score: row.score,
    isNull: row.isNull,
    nullReason: row.nullReason,
    isStale,
    componentsJson: row.componentsJson as Record<string, unknown> | null,
    computedAt: row.computedAt,
    validForDate: row.validForDate,
    cadence,
  }
}

export const getScoreHistory = async (
  assetId: string,
  sector: SectorName | "composite" = "composite",
  limit = DEFAULT_HISTORY_LIMIT
): Promise<ScoreHistoryPoint[]> => {
  const rows = await db
    .select()
    .from(scoreSnapshots)
    .where(
      and(
        eq(scoreSnapshots.assetId, assetId),
        eq(scoreSnapshots.sector, sector),
        eq(scoreSnapshots.isNull, false)
      )
    )
    .orderBy(desc(scoreSnapshots.validForDate))
    .limit(limit)

  const points: ScoreHistoryPoint[] = []

  for (const row of rows) {
    const point = mapRowToScoreHistoryPoint(row, sector)

    if (point) {
      points.push(point)
    }
  }

  return points.reverse()
}

const buildSummaryFromSnapshots = (
  assetId: string,
  snapshots: ScoreSnapshotView[]
): AssetSnapshotsSummary => {
  const bySector = new Map<string, ScoreSnapshotView>()

  for (const snapshot of snapshots) {
    if (!bySector.has(snapshot.sector)) {
      bySector.set(snapshot.sector, snapshot)
    }
  }

  const macro = bySector.get("macro") ?? null
  const relativity = bySector.get("relativity") ?? null
  const volume = bySector.get("volume") ?? null
  const storedComposite = bySector.get("composite") ?? null
  const composite = resolveCompositeForDisplay(storedComposite, { macro, relativity, volume })

  const all = [composite, macro, relativity, volume].filter(
    (entry): entry is ScoreSnapshotView => entry !== null
  )

  const lastComputedAt =
    all.length === 0
      ? null
      : all.reduce((latest, entry) =>
          entry.computedAt > latest ? entry.computedAt : latest
        , all[0]!.computedAt)

  return {
    assetId,
    composite,
    macro,
    relativity,
    volume,
    lastComputedAt,
  }
}

export const getLatestSnapshotsForAsset = async (
  assetId: string
): Promise<AssetSnapshotsSummary> => {
  const rows = await db
    .select()
    .from(scoreSnapshots)
    .where(eq(scoreSnapshots.assetId, assetId))
    .orderBy(desc(scoreSnapshots.computedAt))

  const latestBySector = new Map<string, ScoreSnapshotView>()

  for (const row of rows) {
    if (latestBySector.has(row.sector)) {
      continue
    }

    latestBySector.set(row.sector, mapRowToView(row))
  }

  return buildSummaryFromSnapshots(assetId, Array.from(latestBySector.values()))
}

export const getLatestSnapshotsForAssets = async (
  assetIds: string[]
): Promise<Map<string, AssetSnapshotsSummary>> => {
  if (assetIds.length === 0) {
    return new Map()
  }

  const rows = await db
    .select()
    .from(scoreSnapshots)
    .where(inArray(scoreSnapshots.assetId, assetIds))
    .orderBy(desc(scoreSnapshots.computedAt))

  const latestByAssetAndSector = new Map<string, Map<string, ScoreSnapshotView>>()

  for (const row of rows) {
    const assetMap = latestByAssetAndSector.get(row.assetId) ?? new Map<string, ScoreSnapshotView>()

    if (!latestByAssetAndSector.has(row.assetId)) {
      latestByAssetAndSector.set(row.assetId, assetMap)
    }

    if (assetMap.has(row.sector)) {
      continue
    }

    assetMap.set(row.sector, mapRowToView(row))
  }

  const result = new Map<string, AssetSnapshotsSummary>()

  for (const assetId of assetIds) {
    const sectorMap = latestByAssetAndSector.get(assetId)
    const snapshots = sectorMap ? Array.from(sectorMap.values()) : []
    result.set(assetId, buildSummaryFromSnapshots(assetId, snapshots))
  }

  return result
}
