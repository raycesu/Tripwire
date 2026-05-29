import { and, eq } from "drizzle-orm"
import { db } from "@/db/client"
import { alertRules, assets, watchlistItems } from "@/db/schema"
import { ensureAsset } from "@/lib/assets/ensure-asset"
import { getAssetBySymbol } from "@/lib/assets/queries"

export type WatchlistMutationResult =
  | { ok: true; assetId: string }
  | { ok: false; code: "NOT_FOUND" | "INACTIVE" | "DUPLICATE" | "UNSUPPORTED" }

export const addToWatchlist = async (
  userId: string,
  symbol: string
): Promise<WatchlistMutationResult> => {
  const ensured = await ensureAsset(symbol)
  const asset = ensured ?? (await getAssetBySymbol(symbol))

  if (!asset) {
    return { ok: false, code: "NOT_FOUND" }
  }

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

export const getAssetIdBySymbol = async (symbol: string): Promise<string | null> => {
  const row = await db.query.assets.findFirst({
    where: eq(assets.symbol, symbol.toUpperCase()),
    columns: { id: true },
  })

  return row?.id ?? null
}
