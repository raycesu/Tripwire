import { z } from "zod"
import { normalizeWeeklyOhlcvCandles, VOLUME_CANDLE_COUNT } from "@/scoring/candles"
import { fetchJson } from "@/providers/http"
import { getOrFetch } from "@/providers/provider-cache"
import type { ProviderName, WeeklyOhlcvCandle, WeeklyOhlcvResult } from "@/providers/types"
import { ProviderError } from "@/providers/types"

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

type ExchangeInfoSymbol = z.infer<typeof exchangeInfoSchema>["symbols"][number]

export const mapBinanceKlineToCandle = (kline: (string | number)[]): WeeklyOhlcvCandle => ({
  openTime: new Date(Number(kline[0])),
  open: Number(kline[1]),
  high: Number(kline[2]),
  low: Number(kline[3]),
  close: Number(kline[4]),
  volume: Number(kline[5]),
  closeTime: new Date(Number(kline[6])),
})

const isActiveUsdtSpot = (entry: ExchangeInfoSymbol): boolean =>
  entry.status === "TRADING" && entry.quoteAsset === "USDT" && entry.symbol.endsWith("USDT")

export type BinanceSpotSource = "binance_us" | "binance_global"

export type BinanceUsdtBase<TSource extends BinanceSpotSource = BinanceSpotSource> = {
  symbol: string
  name: string
  providerSymbol: string
  source: TSource
}

type BinanceSpotClientConfig<TSource extends BinanceSpotSource> = {
  provider: ProviderName
  baseUrl: string
  exchangeInfoCacheKey: string
  source: TSource
  failureMessage: string
}

export const createBinanceSpotClient = <TSource extends BinanceSpotSource>(
  config: BinanceSpotClientConfig<TSource>
) => {
  let activeUsdtSymbols: Set<string> | null = null

  const getExchangeInfo = async () =>
    getOrFetch(config.exchangeInfoCacheKey, config.provider, EXCHANGE_INFO_TTL_SECONDS, async () =>
      fetchJson(`${config.baseUrl}/api/v3/exchangeInfo`, exchangeInfoSchema, config.provider)
    )

  const loadActiveUsdtSymbols = async (): Promise<Set<string>> => {
    if (activeUsdtSymbols) {
      return activeUsdtSymbols
    }

    const info = await getExchangeInfo()
    activeUsdtSymbols = new Set(
      info.symbols.filter(isActiveUsdtSpot).map((entry) => entry.symbol)
    )

    return activeUsdtSymbols
  }

  const hasActiveUsdtPair = async (symbol: string): Promise<boolean> => {
    const symbols = await loadActiveUsdtSymbols()
    return symbols.has(symbol.toUpperCase())
  }

  const listTradableUsdtBases = async (): Promise<Array<BinanceUsdtBase<TSource>>> => {
    const info = await getExchangeInfo()

    return info.symbols
      .filter(isActiveUsdtSpot)
      .map((entry) => ({
        symbol: entry.baseAsset.toUpperCase(),
        name: entry.baseAsset.toUpperCase(),
        providerSymbol: entry.symbol,
        source: config.source,
      }))
      .sort((left, right) => left.symbol.localeCompare(right.symbol))
  }

  const getWeeklyKlinesRaw = async (
    providerSymbol: string,
    limit: number
  ): Promise<WeeklyOhlcvCandle[]> => {
    const url = new URL(`${config.baseUrl}/api/v3/klines`)
    url.searchParams.set("symbol", providerSymbol)
    url.searchParams.set("interval", "1w")
    url.searchParams.set("limit", String(limit))

    const data = await fetchJson(url.toString(), z.array(klineSchema), config.provider)
    return data.map(mapBinanceKlineToCandle)
  }

  const fetchWeeklyOhlcv = async (
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
          provider: config.provider,
        }
      }

      return {
        ok: true,
        candles: normalized.candles,
        sourceMetadata: {
          provider: config.provider,
          providerSymbol,
          fetchedAt: new Date().toISOString(),
          candleCount: normalized.candles.length,
          interval: "1w",
        },
      }
    } catch (error) {
      const message = error instanceof ProviderError ? error.message : config.failureMessage

      return {
        ok: false,
        nullReason: "provider_error",
        message,
        provider: config.provider,
      }
    }
  }

  const resetCache = (): void => {
    activeUsdtSymbols = null
  }

  return {
    getExchangeInfo,
    loadActiveUsdtSymbols,
    hasActiveUsdtPair,
    listTradableUsdtBases,
    getWeeklyKlinesRaw,
    fetchWeeklyOhlcv,
    resetCache,
  }
}
