import { z } from "zod"
import { env } from "@/lib/env"
import { fetchJson } from "@/providers/http"
import { getOrFetch } from "@/providers/provider-cache"
import type { ProviderName } from "@/providers/types"

const PROVIDER: ProviderName = "twelve_data"
const BASE_URL = "https://api.twelvedata.com"
const STOCKS_CACHE_KEY = "twelve_data:stocks_list"
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
}

const isCommonStock = (type: string | undefined): boolean => {
  if (!type) {
    return true
  }

  const normalized = type.toLowerCase()
  return normalized.includes("common stock") || normalized === "stock"
}

const mapStockEntry = (entry: {
  symbol: string
  name: string
}): StockCatalogEntry => ({
  symbol: entry.symbol.toUpperCase(),
  name: entry.name,
  assetType: "stock",
  source: "twelve_data",
  providerSymbol: entry.symbol.toUpperCase(),
})

export const fetchStocksListRaw = async (): Promise<StockCatalogEntry[]> => {
  const url = new URL(`${BASE_URL}/stocks`)
  url.searchParams.set("apikey", env.TWELVE_DATA_API_KEY)

  const data = await fetchJson(url.toString(), stocksListSchema, PROVIDER)

  if (!data.data || data.data.length === 0) {
    throw new Error(data.message ?? "No stocks returned from Twelve Data")
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
    entries.push(mapStockEntry(row))
  }

  return entries.sort((left, right) => left.symbol.localeCompare(right.symbol))
}

export const listStockCatalogEntries = async (): Promise<StockCatalogEntry[]> =>
  getOrFetch(STOCKS_CACHE_KEY, PROVIDER, STOCKS_CACHE_TTL_SECONDS, fetchStocksListRaw)
