import { eq } from "drizzle-orm"
import { db } from "@/db/client"
import { assets } from "@/db/schema"
import { resolveBenchmarkSymbol } from "@/lib/assets/benchmark"
import { getCatalogEntryBySymbol } from "@/lib/assets/catalog-queries"
import { getAssetBySymbol } from "@/lib/assets/queries"
import {
  resolveCryptoAssetBySymbol,
  resolveStockAssetBySymbol,
} from "@/lib/assets/resolve-assets"
import type { AssetDto } from "@/lib/assets/types"

export const ensureAsset = async (symbol: string): Promise<AssetDto | null> => {
  const normalized = symbol.trim().toUpperCase()

  if (!normalized) {
    return null
  }

  const existing = await getAssetBySymbol(normalized)

  if (existing) {
    if (existing.resolutionStatus === "needs_review") {
      if (existing.assetType === "crypto") {
        await resolveCryptoAssetBySymbol(normalized)
      } else {
        await resolveStockAssetBySymbol(normalized)
      }

      return getAssetBySymbol(normalized)
    }

    return existing
  }

  const catalogEntry = await getCatalogEntryBySymbol(normalized)

  if (!catalogEntry) {
    return null
  }

  const now = new Date()
  const benchmarkSymbol = resolveBenchmarkSymbol(catalogEntry.symbol, catalogEntry.assetType)

  const inserted = await db
    .insert(assets)
    .values({
      symbol: catalogEntry.symbol,
      name: catalogEntry.name,
      assetType: catalogEntry.assetType,
      providerSymbol: catalogEntry.assetType === "stock" ? catalogEntry.symbol : null,
      providerName: catalogEntry.assetType === "stock" ? "twelve_data" : null,
      quoteAsset: catalogEntry.assetType === "crypto" ? "USDT" : null,
      exchange: catalogEntry.assetType === "stock" ? catalogEntry.exchange : null,
      benchmarkSymbol,
      resolutionStatus: "needs_review",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing()
    .returning({ id: assets.id })

  if (inserted.length === 0) {
    const raced = await getAssetBySymbol(normalized)

    if (!raced) {
      return null
    }

    return raced
  }

  if (catalogEntry.assetType === "crypto") {
    await resolveCryptoAssetBySymbol(normalized)
  } else {
    await resolveStockAssetBySymbol(normalized)
  }

  return getAssetBySymbol(normalized)
}
