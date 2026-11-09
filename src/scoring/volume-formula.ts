import type { WeeklyOhlcvCandle } from "@/providers/types"
import {
  EARLY_HISTORY_MIN_CANDLES,
  VOLUME_CANDLE_COUNT,
  buildLowHistoryComponents,
} from "@/scoring/candles"
import { clamp, latestRsi } from "@/scoring/indicators"
import { formatScoreNumber } from "@/scoring/thresholds"
import type { SectorScoreResult } from "@/scoring/types"

const V_TREND_WEIGHT = 0.6
const P_CONTEXT_WEIGHT = 0.4

const mean = (values: number[]): number => {
  if (values.length === 0) {
    return 0
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export const computeRsiGate = (rsi: number | null): number => {
  if (rsi === null) {
    return 0.6
  }

  if (rsi < 35) {
    return 1.5
  }

  if (rsi < 45) {
    return 1.2
  }

  if (rsi < 50) {
    return 0.6
  }

  if (rsi < 65) {
    return 0.8
  }

  return 0.5
}

export const computeVTrend = (candles: WeeklyOhlcvCandle[]): number => {
  const volumes = candles.map((candle) => candle.volume)
  const count = volumes.length

  if (count < 6) {
    return 0
  }

  const volRecent = mean(volumes.slice(count - 3, count))
  const volPrior = mean(volumes.slice(count - 6, count - 3))

  if (volPrior === 0) {
    return 0
  }

  const volSlope = (volRecent - volPrior) / volPrior
  return clamp(volSlope * -3, -1, 1)
}

export const computePContext = (candles: WeeklyOhlcvCandle[]): number => {
  const closes = candles.map((candle) => candle.close)
  const count = closes.length

  if (count === 0) {
    return 0
  }

  const windowSize = Math.min(10, count)
  const window = closes.slice(count - windowSize, count)
  const lowWindow = Math.min(...window)
  const highWindow = Math.max(...window)
  const range = highWindow - lowWindow

  if (range === 0) {
    return 0
  }

  const rangePosition = (closes[count - 1] - lowWindow) / range
  return clamp(1 - rangePosition * 2, -1, 1)
}

export const computeDecelFactor = (candles: WeeklyOhlcvCandle[]): number => {
  const closes = candles.map((candle) => candle.close)
  const count = closes.length

  if (count < 5) {
    return 1
  }

  const latest = closes[count - 1]
  const mid = closes[count - 3]
  const prior = closes[count - 5]

  if (mid === 0 || prior === 0) {
    return 1
  }

  const momentumRecent = (latest - mid) / mid
  const momentumPrior = (mid - prior) / prior

  return clamp(1 + (momentumPrior - momentumRecent), 0.5, 1.5)
}

export const computeVolumeFromCandles = (candles: WeeklyOhlcvCandle[]): SectorScoreResult => {
  if (candles.length < EARLY_HISTORY_MIN_CANDLES) {
    return {
      score: null,
      isNull: true,
      nullReason: "insufficient_candles",
      components: {
        error: `Need at least ${EARLY_HISTORY_MIN_CANDLES} completed weekly candles, got ${candles.length}`,
      },
    }
  }

  const useCount = Math.min(candles.length, VOLUME_CANDLE_COUNT)
  const normalized = candles.slice(-useCount)
  const closes = normalized.map((candle) => candle.close)
  const rsiNow = latestRsi(closes, 14)
  const vTrend = computeVTrend(normalized)
  const pContext = computePContext(normalized)
  const gate = computeRsiGate(rsiNow)
  const decelFactor = computeDecelFactor(normalized)
  const raw = vTrend * V_TREND_WEIGHT + pContext * P_CONTEXT_WEIGHT
  const score = clamp(raw * gate * decelFactor * 2, -2, 2)
  const lastCandle = normalized[normalized.length - 1]

  return {
    score,
    isNull: false,
    nullReason: null,
    validForDate: lastCandle.closeTime,
    components: {
      v_trend: vTrend,
      p_context: pContext,
      rsi_now: rsiNow,
      gate,
      decel_factor: decelFactor,
      raw,
      score,
      formatted_score: formatScoreNumber(score),
      ...buildLowHistoryComponents(normalized.length, VOLUME_CANDLE_COUNT),
    },
  }
}
