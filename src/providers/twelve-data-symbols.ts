import { z } from "zod"
import {
  getAllowlistEntryByMicCode,
  STOCK_EXCHANGE_ALLOWLIST,
} from "@/lib/assets/stock-exchange-allowlist"
import { mergeStockCatalogEntries } from "@/lib/assets/merge-stock-catalog"
import { env } from "@/lib/env"
import { fetchTwelveDataJson } from "@/providers/twelve-data-fetch"
import { getOrFetch } from "@/providers/provider-cache"
import type { ProviderName } from "@/providers/types"

const PROVIDER: ProviderName = "twelve_data"
const BASE_URL = "https://api.twelvedata.com"
const STOCKS_CACHE_KEY = "twelve_data:stocks_list:us_exchanges_v2"
const STOCKS_CACHE_TTL_SECONDS = 86_400

const stocksListSchema = z.object({
  status: z.string().optional(),
  data: z
    .array(
      z.object({
        symbol: z.string(),
        name: z.string(),
        type: z.string().optional(),
        exchange: z.string().optional(),
        country: z.string().optional(),
      })
    )
    .optional(),
  message: z.string().optional(),
})

export type StockCatalogEntry = {
  symbol: string
  name: string
  assetType: "stock"
  source: "twelve_data"
  providerSymbol: string
  exchange: string
  micCode: string
}

type RawStockRow = {
  symbol: string
  name: string
  type?: string
  exchange?: string
}

const isCommonStock = (type: string | undefined): boolean => {
  if (!type) {
    return true
  }

  const normalized = type.toLowerCase()
  return normalized.includes("common stock") || normalized === "stock"
}

const mapStockEntry = (
  entry: RawStockRow,
  allowlistEntry: { micCode: string; exchangeName: string }
): StockCatalogEntry => ({
  symbol: entry.symbol.toUpperCase(),
  name: entry.name,
  assetType: "stock",
  source: "twelve_data",
  providerSymbol: entry.symbol.toUpperCase(),
  exchange: entry.exchange?.toUpperCase() ?? allowlistEntry.exchangeName,
  micCode: allowlistEntry.micCode,
})

const fetchStocksForMic = async (micCode: string): Promise<StockCatalogEntry[]> => {
  const allowlistEntry = getAllowlistEntryByMicCode(micCode)

  if (!allowlistEntry) {
    return []
  }

  const url = new URL(`${BASE_URL}/stocks`)
  url.searchParams.set("apikey", env.TWELVE_DATA_API_KEY)
  url.searchParams.set("exchange", allowlistEntry.exchangeName)
  url.searchParams.set("type", "Common Stock")

  const data = await fetchTwelveDataJson(url.toString(), stocksListSchema)

  if (!data.data || data.data.length === 0) {
    if (data.message) {
      throw new Error(`Twelve Data stocks fetch failed for ${allowlistEntry.label}: ${data.message}`)
    }

    return []
  }

  const seen = new Set<string>()
  const entries: StockCatalogEntry[] = []

  for (const row of data.data) {
    if (!isCommonStock(row.type)) {
      continue
    }

    const symbol = row.symbol.toUpperCase()

    if (seen.has(symbol)) {
      continue
    }

    seen.add(symbol)
    entries.push(mapStockEntry(row, allowlistEntry))
  }

  return entries
}

export const fetchStocksListRaw = async (): Promise<StockCatalogEntry[]> => {
  const entriesByExchange = await Promise.all(
    STOCK_EXCHANGE_ALLOWLIST.map((entry) => fetchStocksForMic(entry.micCode))
  )

  return mergeStockCatalogEntries(entriesByExchange)
}

export const listStockCatalogEntries = async (): Promise<StockCatalogEntry[]> =>
  getOrFetch(STOCKS_CACHE_KEY, PROVIDER, STOCKS_CACHE_TTL_SECONDS, fetchStocksListRaw)
