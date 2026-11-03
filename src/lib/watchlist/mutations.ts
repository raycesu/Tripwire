import { and, eq } from "drizzle-orm"
import { db } from "@/db/client"
import { alertRules, assets, watchlistItems } from "@/db/schema"
import { ensureAsset } from "@/lib/assets/ensure-asset"
import type { AssetType } from "@/lib/assets/types"

export type WatchlistMutationResult =
  | { ok: true; assetId: string }
  | { ok: false; code: "NOT_FOUND" | "INACTIVE" | "DUPLICATE" | "UNSUPPORTED" | "AMBIGUOUS" }

export const addToWatchlist = async (
  userId: string,
  symbol: string,
  assetType?: AssetType
): Promise<WatchlistMutationResult> => {
  const ensured = await ensureAsset(symbol, assetType)

  if (ensured.status === "ambiguous") {
    return { ok: false, code: "AMBIGUOUS" }
  }

  if (ensured.status === "missing") {
    return { ok: false, code: "NOT_FOUND" }
  }

  const asset = ensured.asset

  if (!asset.isActive) {
    return { ok: false, code: "INACTIVE" }
  }

  if (asset.resolutionStatus === "unsupported") {
    return { ok: false, code: "UNSUPPORTED" }
  }

  const existing = await db.query.watchlistItems.findFirst({
    where: and(eq(watchlistItems.userId, userId), eq(watchlistItems.assetId, asset.id)),
  })

  if (existing) {
    return { ok: false, code: "DUPLICATE" }
  }

  await db.insert(watchlistItems).values({
    userId,
    assetId: asset.id,
  })

  return { ok: true, assetId: asset.id }
}

export const removeFromWatchlist = async (
  userId: string,
  assetId: string
): Promise<{ ok: boolean; code?: "NOT_FOUND" }> => {
  const existing = await db.query.watchlistItems.findFirst({
    where: and(eq(watchlistItems.userId, userId), eq(watchlistItems.assetId, assetId)),
  })

  if (!existing) {
    return { ok: false, code: "NOT_FOUND" }
  }

  // neon-http driver does not support db.transaction — run sequentially
  await db
    .delete(watchlistItems)
    .where(and(eq(watchlistItems.userId, userId), eq(watchlistItems.assetId, assetId)))

  await db
    .update(alertRules)
    .set({ isEnabled: false, updatedAt: new Date() })
    .where(and(eq(alertRules.userId, userId), eq(alertRules.assetId, assetId)))

  return { ok: true }
}

export const getAssetIdBySymbol = async (
  symbol: string,
  assetType: AssetType
): Promise<string | null> => {
  const row = await db.query.assets.findFirst({
    where: and(eq(assets.symbol, symbol.toUpperCase()), eq(assets.assetType, assetType)),
    columns: { id: true },
  })

  return row?.id ?? null
}
