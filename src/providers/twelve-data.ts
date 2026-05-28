import { z } from "zod"
import { env } from "@/lib/env"
import { normalizeWeeklyOhlcvCandles, VOLUME_CANDLE_COUNT } from "@/scoring/candles"
import { fetchJson } from "@/providers/http"
import type { ProviderName, WeeklyOhlcvCandle, WeeklyOhlcvResult } from "@/providers/types"
import { ProviderError } from "@/providers/types"

const PROVIDER: ProviderName = "twelve_data"
const BASE_URL = "https://api.twelvedata.com"

const timeSeriesSchema = z.object({
  status: z.string().optional(),
  values: z
    .array(
      z.object({
        datetime: z.string(),
        open: z.string(),
        high: z.string(),
        low: z.string(),
        close: z.string(),
        volume: z.string().optional(),
      })
    )
    .optional(),
  message: z.string().optional(),
  code: z.number().optional(),
})

type TwelveDataBar = {
  datetime: string
  open: string
  high: string
  low: string
  close: string
  volume?: string
}

const mapValueToCandle = (value: TwelveDataBar): WeeklyOhlcvCandle => {
  const openTime = new Date(value.datetime)
  const closeTime = new Date(openTime.getTime() + 6 * 24 * 60 * 60 * 1000)

  return {
    openTime,
    closeTime,
    open: Number(value.open),
    high: Number(value.high),
    low: Number(value.low),
    close: Number(value.close),
    volume: Number(value.volume ?? 0),
  }
}

export const getWeeklyTimeSeriesRaw = async (
  symbol: string,
  outputSize: number
): Promise<WeeklyOhlcvCandle[]> => {
  const url = new URL(`${BASE_URL}/time_series`)
  url.searchParams.set("symbol", symbol)
  url.searchParams.set("interval", "1week")
  url.searchParams.set("outputsize", String(outputSize + 1))
  url.searchParams.set("apikey", env.TWELVE_DATA_API_KEY)

  const data = await fetchJson(url.toString(), timeSeriesSchema, PROVIDER)

  if (!data.values || data.values.length === 0) {
    throw new ProviderError(
      PROVIDER,
      data.message ?? `No weekly candles returned for ${symbol}`
    )
  }

  return data.values.map(mapValueToCandle)
}

export const fetchWeeklyOhlcv = async (
  providerSymbol: string,
  minCount = VOLUME_CANDLE_COUNT
): Promise<WeeklyOhlcvResult> => {
  try {
    const raw = await getWeeklyTimeSeriesRaw(providerSymbol, minCount)
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
      error instanceof ProviderError ? error.message : "Failed to fetch Twelve Data OHLCV"

    return {
      ok: false,
      nullReason: "provider_error",
      message,
      provider: PROVIDER,
    }
  }
}
