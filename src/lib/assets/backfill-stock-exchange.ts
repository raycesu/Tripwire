import { eq } from "drizzle-orm"
import { db } from "@/db/client"
import { assets } from "@/db/schema"
import { getCatalogEntryBySymbol } from "@/lib/assets/catalog-queries"
import type { AssetDto } from "@/lib/assets/types"

export const backfillStockExchangeFromCatalog = async (
  asset: AssetDto
): Promise<AssetDto> => {
  if (asset.assetType !== "stock" || asset.exchange) {
    return asset
  }

  const catalogEntry = await getCatalogEntryBySymbol(asset.symbol, "stock")
  const exchange = catalogEntry?.exchange?.trim()

  if (!exchange) {
    return asset
  }

  const now = new Date()

  await db
    .update(assets)
    .set({
      exchange,
      updatedAt: now,
    })
    .where(eq(assets.id, asset.id))

  return {
    ...asset,
    exchange,
  }
}

export const finalizeAssetDto = async (asset: AssetDto | null): Promise<AssetDto | null> => {
  if (!asset) {
    return null
  }

  return backfillStockExchangeFromCatalog(asset)
}
