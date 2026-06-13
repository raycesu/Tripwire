import type { AssetDto } from "@/lib/assets/types"
import {
  fetchBenchmarkWeeklyOhlcv,
  fetchWeeklyOhlcvFromDto,
} from "@/providers/market-data"
import type { SourceMetadata, WeeklyOhlcvResult } from "@/providers/types"
import {
  normalizeWeeklyOhlcvCandles,
  RSI_MIN_CANDLE_COUNT,
} from "@/scoring/candles"
import { clamp, latestRsi } from "@/scoring/indicators"
import { formatScoreNumber } from "@/scoring/thresholds"
import type { SectorScoreResult } from "@/scoring/types"

const RELATIVITY_DIVISOR = 8

const nullResult = (nullReason: string, components: Record<string, unknown> = {}): SectorScoreResult => ({
  score: null,
  isNull: true,
  nullReason,
  components,
})

export const resolveBenchmarkSymbol = (asset: AssetDto): string => {
  if (asset.benchmarkSymbol) {
    return asset.benchmarkSymbol
  }

  if (asset.assetType === "crypto") {
    return "BTC"
  }

  return "SPY"
}

const computeRsiFromOhlcv = async (
  fetchResult: Awaited<ReturnType<typeof fetchWeeklyOhlcvFromDto>>
): Promise<{ rsi: number | null; sourceMetadata?: SourceMetadata; validForDate?: Date }> => {
  if (!fetchResult.ok) {
    return { rsi: null }
  }

  const normalized = normalizeWeeklyOhlcvCandles(fetchResult.candles, {
    excludeInProgress: true,
    minCount: RSI_MIN_CANDLE_COUNT,
  })

  if (!normalized.ok) {
    return { rsi: null }
  }

  const closes = normalized.candles.map((candle) => candle.close)
  const rsi = latestRsi(closes, 14)
  const lastCandle = normalized.candles[normalized.candles.length - 1]

  return {
    rsi,
    sourceMetadata: fetchResult.sourceMetadata,
    validForDate: lastCandle?.closeTime,
  }
}

export type RelativityInput = {
  asset: AssetDto
  benchmarkRsi?: number | null
  weeklyOhlcv?: WeeklyOhlcvResult
}

export const computeRelativity = async ({
  asset,
  benchmarkRsi: cachedBenchmarkRsi,
  weeklyOhlcv,
}: RelativityInput): Promise<SectorScoreResult> => {
  if (asset.resolutionStatus === "unsupported") {
    return nullResult("unsupported_asset", { symbol: asset.symbol })
  }

  const benchmarkSymbol = resolveBenchmarkSymbol(asset)
  const assetType = asset.assetType === "stock" ? "stock" : "crypto"

  const assetOhlcv =
    weeklyOhlcv ?? (await fetchWeeklyOhlcvFromDto(asset, RSI_MIN_CANDLE_COUNT))

  if (!assetOhlcv.ok) {
    return nullResult(assetOhlcv.nullReason, { error: assetOhlcv.message })
  }

  const assetNormalized = normalizeWeeklyOhlcvCandles(assetOhlcv.candles, {
    excludeInProgress: true,
    minCount: RSI_MIN_CANDLE_COUNT,
  })

  if (!assetNormalized.ok) {
    return nullResult(assetNormalized.nullReason, { error: assetNormalized.message })
  }

  const assetCloses = assetNormalized.candles.map((candle) => candle.close)
  const assetRsi = latestRsi(assetCloses, 14)

  if (assetRsi === null) {
    return nullResult("insufficient_candles", { error: "Could not compute asset weekly RSI" })
  }

  let benchmarkRsi = cachedBenchmarkRsi ?? null

  if (benchmarkRsi === null || benchmarkRsi === undefined) {
    const benchmarkOhlcv = await fetchBenchmarkWeeklyOhlcv(benchmarkSymbol, assetType)

    if (!benchmarkOhlcv.ok) {
      return nullResult(benchmarkOhlcv.nullReason, {
        error: benchmarkOhlcv.message,
        benchmark_symbol: benchmarkSymbol,
      })
    }

    const benchmarkComputed = await computeRsiFromOhlcv(benchmarkOhlcv)
    benchmarkRsi = benchmarkComputed.rsi
  }

  if (benchmarkRsi === null) {
    return nullResult("insufficient_candles", {
      error: "Could not compute benchmark weekly RSI",
      benchmark_symbol: benchmarkSymbol,
    })
  }

  const relativityIndex = benchmarkRsi - assetRsi
  const score = clamp(relativityIndex / RELATIVITY_DIVISOR, -2, 2)
  const lastCandle = assetNormalized.candles[assetNormalized.candles.length - 1]

  return {
    score,
    isNull: false,
    nullReason: null,
    validForDate: lastCandle?.closeTime,
    sourceMetadata: assetOhlcv.sourceMetadata,
    components: {
      asset_rsi: assetRsi,
      benchmark_symbol: benchmarkSymbol,
      benchmark_rsi: benchmarkRsi,
      relativity_index: relativityIndex,
      score,
      formatted_score: formatScoreNumber(score),
    },
  }
}
