import { and, desc, eq } from "drizzle-orm"
import { db } from "@/db/client"
import { assets, scoreSnapshots, watchlistItems } from "@/db/schema"
import { toAssetDto, type AssetDto } from "@/lib/assets/types"
import { computeIsStale } from "@/scoring/staleness"
import type { Cadence, SectorName } from "@/scoring/types"

export const listActiveAssets = async (): Promise<AssetDto[]> => {
  const rows = await db.query.assets.findMany({
    where: eq(assets.isActive, true),
    orderBy: [assets.assetType, assets.symbol],
  })

  return rows.map(toAssetDto)
}

export const getAssetBySymbol = async (symbol: string): Promise<AssetDto | null> => {
  const normalized = symbol.toUpperCase()
  const row = await db.query.assets.findFirst({
    where: eq(assets.symbol, normalized),
  })

  if (!row) {
    return null
  }

  return toAssetDto(row)
}

export type ScoreSnapshotDto = {
  id: string
  sector: string
  score: string | null
  isNull: boolean
  nullReason: string | null
  isStale: boolean
  componentsJson: Record<string, unknown> | null
  computedAt: Date
  cadence: string
}

export const getLatestSnapshotsByAssetId = async (
  assetId: string
): Promise<ScoreSnapshotDto[]> => {
  const rows = await db
    .select()
    .from(scoreSnapshots)
    .where(eq(scoreSnapshots.assetId, assetId))
    .orderBy(desc(scoreSnapshots.computedAt))

  const latestBySector = new Map<string, ScoreSnapshotDto>()

  for (const row of rows) {
    if (latestBySector.has(row.sector)) {
      continue
    }

    const sector = row.sector as SectorName
    const cadence = row.cadence as Cadence
    const isStale = computeIsStale(sector, cadence, row.computedAt)

    latestBySector.set(row.sector, {
      id: row.id,
      sector: row.sector,
      score: row.score,
      isNull: row.isNull,
      nullReason: row.nullReason,
      isStale,
      componentsJson: row.componentsJson as Record<string, unknown> | null,
      computedAt: row.computedAt,
      cadence: row.cadence,
    })
  }

  return Array.from(latestBySector.values())
}

export const getWatchlistAssetIdsForUser = async (userId: string): Promise<Set<string>> => {
  const items = await db.query.watchlistItems.findMany({
    where: eq(watchlistItems.userId, userId),
    columns: { assetId: true },
  })

  return new Set(items.map((item) => item.assetId))
}

export const isAssetOnWatchlist = async (userId: string, assetId: string): Promise<boolean> => {
  const row = await db.query.watchlistItems.findFirst({
    where: and(eq(watchlistItems.userId, userId), eq(watchlistItems.assetId, assetId)),
  })

  return Boolean(row)
}
