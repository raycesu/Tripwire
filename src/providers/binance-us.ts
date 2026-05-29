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

const PROVIDER: ProviderName = "binance_us"
const BASE_URL = "https://api.binance.us"
const EXCHANGE_INFO_CACHE_KEY = "binance_us:exchange_info"
const EXCHANGE_INFO_TTL_SECONDS = 86_400

const exchangeInfoSchema = z.object({
  symbols: z.array(
    z.object({
      symbol: z.string(),
      status: z.string(),
      quoteAsset: z.string(),
      baseAsset: z.string(),
    })
  ),
})

const klineSchema = z.array(z.union([z.string(), z.number()]))

type ExchangeInfo = z.infer<typeof exchangeInfoSchema>

let activeUsdtSymbols: Set<string> | null = null

const mapKlineToCandle = (kline: (string | number)[]): WeeklyOhlcvCandle => ({
  openTime: new Date(Number(kline[0])),
  open: Number(kline[1]),
  high: Number(kline[2]),
  low: Number(kline[3]),
  close: Number(kline[4]),
  volume: Number(kline[5]),
  closeTime: new Date(Number(kline[6])),
})

export const getExchangeInfo = async (): Promise<ExchangeInfo> =>
  getOrFetch(EXCHANGE_INFO_CACHE_KEY, PROVIDER, EXCHANGE_INFO_TTL_SECONDS, async () =>
    fetchJson(`${BASE_URL}/api/v3/exchangeInfo`, exchangeInfoSchema, PROVIDER)
  )

export const loadActiveUsdtSymbols = async (): Promise<Set<string>> => {
  if (activeUsdtSymbols) {
    return activeUsdtSymbols
  }

  const info = await getExchangeInfo()
  activeUsdtSymbols = new Set(
    info.symbols
      .filter(
        (entry) =>
          entry.status === "TRADING" && entry.quoteAsset === "USDT" && entry.symbol.endsWith("USDT")
      )
      .map((entry) => entry.symbol)
  )

  return activeUsdtSymbols
}

export const hasActiveUsdtPair = async (symbol: string): Promise<boolean> => {
  const symbols = await loadActiveUsdtSymbols()
  return symbols.has(symbol.toUpperCase())
}

export type UsdtBaseCatalogEntry = {
  symbol: string
  name: string
  providerSymbol: string
  source: "binance_us"
}

export const listTradableUsdtBases = async (): Promise<UsdtBaseCatalogEntry[]> => {
  const info = await getExchangeInfo()

  return info.symbols
    .filter(
      (entry) =>
        entry.status === "TRADING" && entry.quoteAsset === "USDT" && entry.symbol.endsWith("USDT")
    )
    .map((entry) => ({
      symbol: entry.baseAsset.toUpperCase(),
      name: entry.baseAsset.toUpperCase(),
      providerSymbol: entry.symbol,
      source: "binance_us" as const,
    }))
    .sort((left, right) => left.symbol.localeCompare(right.symbol))
}

export const getWeeklyKlinesRaw = async (
  providerSymbol: string,
  limit: number
): Promise<WeeklyOhlcvCandle[]> => {
  const url = new URL(`${BASE_URL}/api/v3/klines`)
  url.searchParams.set("symbol", providerSymbol)
  url.searchParams.set("interval", "1w")
  url.searchParams.set("limit", String(limit))

  const data = await fetchJson(url.toString(), z.array(klineSchema), PROVIDER)
  return data.map(mapKlineToCandle)
}

export const fetchWeeklyOhlcv = async (
  providerSymbol: string,
  minCount = VOLUME_CANDLE_COUNT
): Promise<WeeklyOhlcvResult> => {
  try {
    const raw = await getWeeklyKlinesRaw(providerSymbol, minCount + 1)
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

    return {
      ok: true,
      candles: normalized.candles,
      sourceMetadata: {
        provider: PROVIDER,
        providerSymbol,
        fetchedAt: new Date().toISOString(),
        candleCount: normalized.candles.length,
        interval: "1w",
      },
    }
  } catch (error) {
    const message =
      error instanceof ProviderError ? error.message : "Failed to fetch Binance US OHLCV"

    return {
      ok: false,
      nullReason: "provider_error",
      message,
      provider: PROVIDER,
    }
  }
}

export const resetBinanceUsCache = (): void => {
  activeUsdtSymbols = null
}
