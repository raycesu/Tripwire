import { desc, eq, inArray } from "drizzle-orm"
import { db } from "@/db/client"
import { assets, watchlistItems } from "@/db/schema"
import { toAssetDto, type AssetDto } from "@/lib/assets/types"
import type { WatchlistEntryDto } from "@/lib/watchlist/types"

export const listUserWatchlist = async (userId: string): Promise<WatchlistEntryDto[]> => {
  const rows = await db.query.watchlistItems.findMany({
    where: eq(watchlistItems.userId, userId),
    with: { asset: true },
    orderBy: [desc(watchlistItems.createdAt)],
  })

  return rows.map((row) => ({
    id: row.id,
    assetId: row.assetId,
    createdAt: row.createdAt,
    asset: toAssetDto(row.asset),
  }))
}

export const listDistinctWatchlistAssets = async (): Promise<AssetDto[]> => {
  const items = await db.query.watchlistItems.findMany({
    columns: { assetId: true },
  })

  const assetIds = [...new Set(items.map((item) => item.assetId))]

  if (assetIds.length === 0) {
    return []
  }

  const rows = await db.query.assets.findMany({
    where: inArray(assets.id, assetIds),
    orderBy: [assets.assetType, assets.symbol],
  })

  return rows.filter((row) => row.isActive).map(toAssetDto)
}

export const countUserWatchlist = async (userId: string): Promise<number> => {
  const items = await db.query.watchlistItems.findMany({
    where: eq(watchlistItems.userId, userId),
    columns: { id: true },
  })

  return items.length
}
