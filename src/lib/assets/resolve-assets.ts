import { eq, inArray } from "drizzle-orm"
import { db } from "@/db/client"
import { assets } from "@/db/schema"
import { getCatalogEntryBySymbol } from "@/lib/assets/catalog-queries"
import { resolveCryptoSymbol } from "@/providers/crypto-resolver"

export type ResolveAssetResult = {
  symbol: string
  resolutionStatus: string
  providerName: string | null
  unsupportedReason: string | null
}

export const resolveCryptoAssetBySymbol = async (
  symbol: string
): Promise<ResolveAssetResult | null> => {
  const row = await db.query.assets.findFirst({
    where: eq(assets.symbol, symbol.toUpperCase()),
  })

  if (!row || row.assetType !== "crypto") {
    return null
  }

  const resolution = await resolveCryptoSymbol(row.symbol)
  const now = new Date()

  if (resolution.ok) {
    await db
      .update(assets)
      .set({
        providerName: resolution.providerName,
        providerSymbol: resolution.providerSymbol,
        quoteAsset: resolution.quoteAsset,
        resolutionStatus: "resolved",
        unsupportedReason: null,
        updatedAt: now,
      })
      .where(eq(assets.id, row.id))

    return {
      symbol: row.symbol,
      resolutionStatus: "resolved",
      providerName: resolution.providerName,
      unsupportedReason: null,
    }
  }

  await db
    .update(assets)
    .set({
      providerName: null,
      providerSymbol: null,
      quoteAsset: "USDT",
      resolutionStatus: "unsupported",
      unsupportedReason: resolution.unsupportedReason,
      updatedAt: now,
    })
    .where(eq(assets.id, row.id))

  return {
    symbol: row.symbol,
    resolutionStatus: "unsupported",
    providerName: null,
    unsupportedReason: resolution.unsupportedReason,
  }
}

export const resolveStockAssetBySymbol = async (
  symbol: string
): Promise<ResolveAssetResult | null> => {
  const row = await db.query.assets.findFirst({
    where: eq(assets.symbol, symbol.toUpperCase()),
  })

  if (!row || row.assetType !== "stock") {
    return null
  }

  const now = new Date()
  const catalogEntry = await getCatalogEntryBySymbol(row.symbol, "stock")

  await db
    .update(assets)
    .set({
      providerName: "twelve_data",
      providerSymbol: row.symbol,
      exchange: catalogEntry?.exchange ?? row.exchange,
      resolutionStatus: "resolved",
      unsupportedReason: null,
      updatedAt: now,
    })
    .where(eq(assets.id, row.id))

  return {
    symbol: row.symbol,
    resolutionStatus: "resolved",
    providerName: "twelve_data",
    unsupportedReason: null,
  }
}

export const resolveAssetsBySymbols = async (
  symbols: string[]
): Promise<ResolveAssetResult[]> => {
  const normalized = [...new Set(symbols.map((symbol) => symbol.toUpperCase()))]
  const results: ResolveAssetResult[] = []

  if (normalized.length === 0) {
    return results
  }

  const rows = await db.query.assets.findMany({
    where: inArray(assets.symbol, normalized),
  })

  for (const row of rows) {
    if (row.assetType === "crypto") {
      const result = await resolveCryptoAssetBySymbol(row.symbol)

      if (result) {
        results.push(result)
      }
    } else if (row.assetType === "stock") {
      const result = await resolveStockAssetBySymbol(row.symbol)

      if (result) {
        results.push(result)
      }
    }
  }

  return results
}

export const resolvePendingAssets = async (): Promise<ResolveAssetResult[]> => {
  const rows = await db.query.assets.findMany({
    where: eq(assets.resolutionStatus, "needs_review"),
  })

  return resolveAssetsBySymbols(rows.map((row) => row.symbol))
}

/** @deprecated Use resolvePendingAssets or resolveAssetsBySymbols */
export const resolveAllSeedAssets = async (): Promise<ResolveAssetResult[]> =>
  resolvePendingAssets()
