import { and, eq, inArray, lt, notInArray, sql } from "drizzle-orm"
import { db } from "@/db/client"
import { assetCatalog, assets } from "@/db/schema"
import {
  mapBinanceBasesToCatalog,
  mapKrakenBasesToCatalog,
  mergeCryptoCatalogEntries,
  type CryptoCatalogEntry,
} from "@/lib/assets/build-crypto-catalog"
import { logInfo } from "@/lib/logging/logger"
import * as binanceUs from "@/providers/binance-us"
import * as kraken from "@/providers/kraken"
import { listStockCatalogEntries, type StockCatalogEntry } from "@/providers/twelve-data-symbols"

const UPSERT_BATCH_SIZE = 500

export type CatalogSyncSummary = {
  cryptoCount: number
  stockCount: number
  totalUpserted: number
  prunedCatalogCount: number
  prunedAssetCount: number
}

type CatalogRow = {
  symbol: string
  name: string
  assetType: "crypto" | "stock"
  source: string
  providerSymbol: string
  exchange: string | null
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
    exchange: null,
    syncedAt,
  })),
  ...stockEntries.map((entry) => ({
    symbol: entry.symbol,
    name: entry.name,
    assetType: entry.assetType,
    source: entry.source,
    providerSymbol: entry.providerSymbol,
    exchange: entry.exchange,
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
        exchange: sql`excluded.exchange`,
        syncedAt: sql`excluded.synced_at`,
      },
    })
}

const pruneStaleCatalogRows = async (syncedAt: Date): Promise<number> => {
  const deleted = await db
    .delete(assetCatalog)
    .where(lt(assetCatalog.syncedAt, syncedAt))
    .returning({ symbol: assetCatalog.symbol, assetType: assetCatalog.assetType })

  return deleted.length
}

export const pruneOrphanedStockAssets = async (
  stockSymbols: string[]
): Promise<number> => {
  const normalizedSymbols = [...new Set(stockSymbols.map((symbol) => symbol.toUpperCase()))]

  const orphanedRows =
    normalizedSymbols.length === 0
      ? await db
          .select({ symbol: assets.symbol })
          .from(assets)
          .where(eq(assets.assetType, "stock"))
      : await db
          .select({ symbol: assets.symbol })
          .from(assets)
          .where(
            and(eq(assets.assetType, "stock"), notInArray(assets.symbol, normalizedSymbols))
          )

  if (orphanedRows.length === 0) {
    return 0
  }

  const orphanedSymbols = orphanedRows.map((row) => row.symbol)

  logInfo({
    event: "catalog_prune_orphaned_stock_assets",
    symbols: orphanedSymbols,
    count: orphanedSymbols.length,
  })

  const deleted = await db
    .delete(assets)
    .where(and(eq(assets.assetType, "stock"), inArray(assets.symbol, orphanedSymbols)))
    .returning({ symbol: assets.symbol })

  return deleted.length
}

export const buildCryptoCatalog = async (): Promise<CryptoCatalogEntry[]> => {
  const [usBases, krakenBases] = await Promise.all([
    binanceUs.listTradableUsdtBases(),
    kraken.listTradableUsdtBases(),
  ])

  return mergeCryptoCatalogEntries(
    mapBinanceBasesToCatalog(usBases),
    mapKrakenBasesToCatalog(krakenBases)
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

  const prunedCatalogCount = await pruneStaleCatalogRows(syncedAt)
  const prunedAssetCount = await pruneOrphanedStockAssets(stockEntries.map((entry) => entry.symbol))

  return {
    cryptoCount: cryptoEntries.length,
    stockCount: stockEntries.length,
    totalUpserted: rows.length,
    prunedCatalogCount,
    prunedAssetCount,
  }
}
