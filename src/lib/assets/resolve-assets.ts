import { eq } from "drizzle-orm"
import { db } from "@/db/client"
import { assets } from "@/db/schema"
import { resolveCryptoSymbol } from "@/providers/crypto-resolver"

const CRYPTO_SYMBOLS = ["BTC", "ETH", "SOL", "HYPE", "ZEC"] as const
const STOCK_SYMBOLS = ["MSTR", "TSLA", "NVDA", "COIN"] as const

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

export const resolveStockAssets = async (): Promise<ResolveAssetResult[]> => {
  const results: ResolveAssetResult[] = []
  const now = new Date()

  for (const symbol of STOCK_SYMBOLS) {
    const row = await db.query.assets.findFirst({
      where: eq(assets.symbol, symbol),
    })

    if (!row) {
      continue
    }

    await db
      .update(assets)
      .set({
        providerName: "twelve_data",
        providerSymbol: symbol,
        resolutionStatus: "resolved",
        unsupportedReason: null,
        updatedAt: now,
      })
      .where(eq(assets.id, row.id))

    results.push({
      symbol,
      resolutionStatus: "resolved",
      providerName: "twelve_data",
      unsupportedReason: null,
    })
  }

  return results
}

export const resolveAllSeedAssets = async (): Promise<ResolveAssetResult[]> => {
  const cryptoResults: ResolveAssetResult[] = []

  for (const symbol of CRYPTO_SYMBOLS) {
    const result = await resolveCryptoAssetBySymbol(symbol)

    if (result) {
      cryptoResults.push(result)
    }
  }

  const stockResults = await resolveStockAssets()
  return [...cryptoResults, ...stockResults]
}
