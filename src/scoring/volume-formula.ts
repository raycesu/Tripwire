import type { WeeklyOhlcvCandle } from "@/providers/types"
import { VOLUME_CANDLE_COUNT } from "@/scoring/candles"
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
  const volRecent = mean(volumes.slice(27, 30))
  const volPrior = mean(volumes.slice(24, 27))

  if (volPrior === 0) {
    return 0
  }

  const volSlope = (volRecent - volPrior) / volPrior
  return clamp(volSlope * -3, -1, 1)
}

export const computePContext = (candles: WeeklyOhlcvCandle[]): number => {
  const closes = candles.map((candle) => candle.close)
  const window = closes.slice(20, 30)
  const low10w = Math.min(...window)
  const high10w = Math.max(...window)
  const range = high10w - low10w

  if (range === 0) {
    return 0
  }

  const rangePosition = (closes[29] - low10w) / range
  return clamp(1 - rangePosition * 2, -1, 1)
}

export const computeDecelFactor = (candles: WeeklyOhlcvCandle[]): number => {
  const closes = candles.map((candle) => candle.close)

  if (closes[27] === 0 || closes[25] === 0) {
    return 1
  }

  const momentumRecent = (closes[29] - closes[27]) / closes[27]
  const momentumPrior = (closes[27] - closes[25]) / closes[25]

  return clamp(1 + (momentumPrior - momentumRecent), 0.5, 1.5)
}

export const computeVolumeFromCandles = (candles: WeeklyOhlcvCandle[]): SectorScoreResult => {
  if (candles.length < VOLUME_CANDLE_COUNT) {
    return {
      score: null,
      isNull: true,
      nullReason: "insufficient_candles",
      components: {
        error: `Need ${VOLUME_CANDLE_COUNT} completed weekly candles, got ${candles.length}`,
      },
    }
  }

  const normalized = candles.slice(-VOLUME_CANDLE_COUNT)
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
    },
  }
}
