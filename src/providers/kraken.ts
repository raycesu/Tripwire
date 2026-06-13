import { z } from "zod"
import { normalizeWeeklyOhlcvCandles, VOLUME_CANDLE_COUNT } from "@/scoring/candles"
import { fetchJson } from "@/providers/http"
import { getOrFetch } from "@/providers/provider-cache"
import type {
  ProviderName,
  WeeklyOhlcvCandle,
  WeeklyOhlcvResult,
} from "@/providers/types"
import { ProviderError } from "@/providers/types"

const PROVIDER: ProviderName = "kraken"
const BASE_URL = "https://api.kraken.com/0/public"
const ASSET_PAIRS_CACHE_KEY = "kraken:asset_pairs"
const ASSETS_CACHE_KEY = "kraken:assets"
const CACHE_TTL_SECONDS = 86_400
const WEEKLY_INTERVAL_MINUTES = 10_080

const krakenResponseSchema = <T extends z.ZodType>(resultSchema: T) =>
  z.object({
    error: z.array(z.string()),
    result: resultSchema,
  })

const assetsSchema = krakenResponseSchema(
  z.record(
    z.string(),
    z.object({
      altname: z.string(),
      status: z.string().optional(),
    })
  )
)

const assetPairsSchema = krakenResponseSchema(
  z.record(
    z.string(),
    z.object({
      altname: z.string(),
      base: z.string(),
      quote: z.string(),
      status: z.string(),
    })
  )
)

const ohlcRowSchema = z.array(z.union([z.string(), z.number()]))
const ohlcRowsSchema = z.array(ohlcRowSchema)

const ohlcSchema = krakenResponseSchema(
  z.record(z.string(), z.union([ohlcRowsSchema, z.number()]))
)

type KrakenAssets = z.infer<typeof assetsSchema>["result"]
type KrakenAssetPairs = z.infer<typeof assetPairsSchema>["result"]

export type UsdtPairEntry = {
  baseSymbol: string
  providerSymbol: string
  pairKey: string
}

const BASE_SYMBOL_ALIASES: Record<string, string> = {
  XBT: "BTC",
}

let usdtPairIndex: Map<string, UsdtPairEntry> | null = null
let usdtPairByProviderSymbol: Map<string, UsdtPairEntry> | null = null

const normalizeBaseSymbol = (altname: string): string => {
  const upper = altname.toUpperCase()
  return BASE_SYMBOL_ALIASES[upper] ?? upper
}

type KrakenApiResponse = {
  error: string[]
}

const fetchKrakenPublic = async <T extends KrakenApiResponse>(
  path: string,
  schema: z.ZodType<T>
): Promise<T> => {
  const data = await fetchJson(`${BASE_URL}${path}`, schema, PROVIDER)

  if (data.error.length > 0) {
    throw new ProviderError(PROVIDER, data.error.join(", "))
  }

  return data
}

export const getAssets = async (): Promise<KrakenAssets> =>
  getOrFetch(ASSETS_CACHE_KEY, PROVIDER, CACHE_TTL_SECONDS, async () => {
    const response = await fetchKrakenPublic("/Assets", assetsSchema)
    return response.result
  })

export const getAssetPairs = async (): Promise<KrakenAssetPairs> =>
  getOrFetch(ASSET_PAIRS_CACHE_KEY, PROVIDER, CACHE_TTL_SECONDS, async () => {
    const response = await fetchKrakenPublic("/AssetPairs", assetPairsSchema)
    return response.result
  })

const buildUsdtPairIndex = async (): Promise<Map<string, UsdtPairEntry>> => {
  const [assets, pairs] = await Promise.all([getAssets(), getAssetPairs()])
  const index = new Map<string, UsdtPairEntry>()
  const byProviderSymbol = new Map<string, UsdtPairEntry>()

  for (const [pairKey, pair] of Object.entries(pairs)) {
    if (pair.status !== "online" || pair.quote !== "USDT") {
      continue
    }

    const baseAsset = assets[pair.base]

    if (!baseAsset || baseAsset.status === "disabled") {
      continue
    }

    const baseSymbol = normalizeBaseSymbol(baseAsset.altname)
    const providerSymbol = pair.altname.toUpperCase()
    const entry: UsdtPairEntry = {
      baseSymbol,
      providerSymbol,
      pairKey,
    }

    index.set(baseSymbol, entry)
    byProviderSymbol.set(providerSymbol, entry)
    byProviderSymbol.set(pairKey, entry)
  }

  usdtPairByProviderSymbol = byProviderSymbol
  return index
}

const loadUsdtPairIndex = async (): Promise<Map<string, UsdtPairEntry>> => {
  if (usdtPairIndex) {
    return usdtPairIndex
  }

  usdtPairIndex = await buildUsdtPairIndex()
  return usdtPairIndex
}

export const resolveUsdtPair = async (baseSymbol: string): Promise<UsdtPairEntry | null> => {
  const index = await loadUsdtPairIndex()
  return index.get(baseSymbol.toUpperCase()) ?? null
}

export const hasActiveUsdtPair = async (baseSymbol: string): Promise<boolean> => {
  const pair = await resolveUsdtPair(baseSymbol)
  return pair !== null
}

export const hasActiveUsdtPairByProviderSymbol = async (
  providerSymbol: string
): Promise<boolean> => {
  await loadUsdtPairIndex()
  const normalized = providerSymbol.toUpperCase()
  return usdtPairByProviderSymbol?.has(normalized) ?? false
}

export type UsdtBaseCatalogEntry = {
  symbol: string
  name: string
  providerSymbol: string
  source: "kraken"
}

export const listTradableUsdtBases = async (): Promise<UsdtBaseCatalogEntry[]> => {
  const index = await loadUsdtPairIndex()

  return Array.from(index.values())
    .map((entry) => ({
      symbol: entry.baseSymbol,
      name: entry.baseSymbol,
      providerSymbol: entry.providerSymbol,
      source: "kraken" as const,
    }))
    .sort((left, right) => left.symbol.localeCompare(right.symbol))
}

const mapOhlcToCandle = (row: (string | number)[]): WeeklyOhlcvCandle => {
  const openTime = new Date(Number(row[0]) * 1000)
  const closeTime = new Date(openTime.getTime() + 7 * 24 * 60 * 60 * 1000 - 1)

  return {
    openTime,
    closeTime,
    open: Number(row[1]),
    high: Number(row[2]),
    low: Number(row[3]),
    close: Number(row[4]),
    volume: Number(row[6]),
  }
}

export const getWeeklyOhlcvRaw = async (
  providerSymbol: string,
  limit: number
): Promise<WeeklyOhlcvCandle[]> => {
  await loadUsdtPairIndex()
  const normalized = providerSymbol.toUpperCase()
  const pairEntry =
    usdtPairByProviderSymbol?.get(normalized) ??
    (await resolveUsdtPair(normalized.replace(/USDT$/, "")))

  if (!pairEntry) {
    throw new ProviderError(PROVIDER, `No Kraken USDT pair found for ${providerSymbol}`)
  }

  const url = new URL(`${BASE_URL}/OHLC`)
  url.searchParams.set("pair", pairEntry.pairKey)
  url.searchParams.set("interval", String(WEEKLY_INTERVAL_MINUTES))

  const response = await fetchKrakenPublic(url.pathname + url.search, ohlcSchema)
  const pairValue = response.result[pairEntry.pairKey]
  const pairRows = Array.isArray(pairValue) ? pairValue : []

  if (pairRows.length === 0) {
    throw new ProviderError(PROVIDER, `No weekly OHLC returned for ${pairEntry.providerSymbol}`)
  }

  const candles = pairRows.map(mapOhlcToCandle)

  if (candles.length <= limit) {
    return candles
  }

  return candles.slice(-limit)
}

export const fetchWeeklyOhlcv = async (
  providerSymbol: string,
  minCount = VOLUME_CANDLE_COUNT
): Promise<WeeklyOhlcvResult> => {
  try {
    const raw = await getWeeklyOhlcvRaw(providerSymbol, minCount + 1)
    const normalized = normalizeWeeklyOhlcvCandles(raw, {
      excludeInProgress: true,
      minCount,
    })

    if (!normalized.ok) {
      return {
        ok: false,
        nullReason: normalized.nullReason,
        message: normalized.message,
        provider: PROVIDER,
      }
    }

    await loadUsdtPairIndex()
    const pairEntry = usdtPairByProviderSymbol?.get(providerSymbol.toUpperCase())

    return {
      ok: true,
      candles: normalized.candles,
      sourceMetadata: {
        provider: PROVIDER,
        providerSymbol: pairEntry?.providerSymbol ?? providerSymbol.toUpperCase(),
        fetchedAt: new Date().toISOString(),
        candleCount: normalized.candles.length,
        interval: "1w",
      },
    }
  } catch (error) {
    const message =
      error instanceof ProviderError ? error.message : "Failed to fetch Kraken OHLCV"

    return {
      ok: false,
      nullReason: "provider_error",
      message,
      provider: PROVIDER,
    }
  }
}

export const resetKrakenCache = (): void => {
  usdtPairIndex = null
  usdtPairByProviderSymbol = null
}
