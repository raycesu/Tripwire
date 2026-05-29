import { sql } from "drizzle-orm"
import { db } from "@/db/client"
import { assetCatalog } from "@/db/schema"
import {
  mapBinanceBasesToCatalog,
  mergeCryptoCatalogEntries,
  type CryptoCatalogEntry,
} from "@/lib/assets/build-crypto-catalog"
import * as binanceGlobal from "@/providers/binance"
import * as binanceUs from "@/providers/binance-us"
import { listStockCatalogEntries, type StockCatalogEntry } from "@/providers/twelve-data-symbols"

const UPSERT_BATCH_SIZE = 500

export type CatalogSyncSummary = {
  cryptoCount: number
  stockCount: number
  totalUpserted: number
}

type CatalogRow = {
  symbol: string
  name: string
  assetType: "crypto" | "stock"
  source: string
  providerSymbol: string
  syncedAt: Date
}

const toCatalogRows = (
  cryptoEntries: CryptoCatalogEntry[],
  stockEntries: StockCatalogEntry[],
  syncedAt: Date
): CatalogRow[] => [
  ...cryptoEntries.map((entry) => ({
    symbol: entry.symbol,
    name: entry.name,
    assetType: entry.assetType,
    source: entry.source,
    providerSymbol: entry.providerSymbol,
    syncedAt,
  })),
  ...stockEntries.map((entry) => ({
    symbol: entry.symbol,
    name: entry.name,
    assetType: entry.assetType,
    source: entry.source,
    providerSymbol: entry.providerSymbol,
    syncedAt,
  })),
]

const upsertCatalogBatch = async (batch: CatalogRow[]): Promise<void> => {
  if (batch.length === 0) {
    return
  }

  await db
    .insert(assetCatalog)
    .values(batch)
    .onConflictDoUpdate({
      target: [assetCatalog.symbol, assetCatalog.assetType],
      set: {
        name: sql`excluded.name`,
        source: sql`excluded.source`,
        providerSymbol: sql`excluded.provider_symbol`,
        syncedAt: sql`excluded.synced_at`,
      },
    })
}

export const buildCryptoCatalog = async (): Promise<CryptoCatalogEntry[]> => {
  const [globalBases, usBases] = await Promise.all([
    binanceGlobal.listTradableUsdtBases(),
    binanceUs.listTradableUsdtBases(),
  ])

  return mergeCryptoCatalogEntries(
    mapBinanceBasesToCatalog(globalBases),
    mapBinanceBasesToCatalog(usBases)
  )
}

export const syncAssetCatalog = async (): Promise<CatalogSyncSummary> => {
  const syncedAt = new Date()
  const [cryptoEntries, stockEntries] = await Promise.all([
    buildCryptoCatalog(),
    listStockCatalogEntries(),
  ])

  const rows = toCatalogRows(cryptoEntries, stockEntries, syncedAt)

  for (let index = 0; index < rows.length; index += UPSERT_BATCH_SIZE) {
    const batch = rows.slice(index, index + UPSERT_BATCH_SIZE)
    await upsertCatalogBatch(batch)
  }

  return {
    cryptoCount: cryptoEntries.length,
    stockCount: stockEntries.length,
    totalUpserted: rows.length,
  }
}
