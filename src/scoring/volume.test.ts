import { describe, expect, it } from "vitest"
import type { WeeklyOhlcvCandle } from "@/providers/types"
import {
  computeDecelFactor,
  computePContext,
  computeRsiGate,
  computeVTrend,
  computeVolumeFromCandles,
} from "@/scoring/volume-formula"

const buildCandles = (): WeeklyOhlcvCandle[] => {
  return Array.from({ length: 30 }, (_, index) => {
    const openTime = new Date(Date.UTC(2024, 0, 1 + index * 7))
    const closeTime = new Date(Date.UTC(2024, 0, 7 + index * 7))
    const close = 100 - index * 0.5
    const volume = 1000 - index * 10

    return {
      openTime,
      closeTime,
      open: close,
      high: close + 1,
      low: close - 1,
      close,
      volume,
    }
  })
}

describe("computeRsiGate", () => {
  it("uses fallback gate when RSI is null", () => {
    expect(computeRsiGate(null)).toBe(0.6)
  })

  it("applies the 45-50 dead zone", () => {
    expect(computeRsiGate(47)).toBe(0.6)
  })

  it("amplifies oversold setups", () => {
    expect(computeRsiGate(30)).toBe(1.5)
  })
})

describe("computeVTrend", () => {
  it("returns 0 when prior volume mean is zero", () => {
    const candles = buildCandles().map((candle, index) =>
      index >= 24 && index <= 26 ? { ...candle, volume: 0 } : candle
    )

    expect(computeVTrend(candles)).toBe(0)
  })
})

describe("computePContext", () => {
  it("returns +1 at the 10-week low", () => {
    const candles = buildCandles()
    const lastClose = candles[29].close

    for (let index = 20; index <= 28; index += 1) {
      candles[index] = { ...candles[index], close: lastClose + 10 }
    }

    candles[29] = { ...candles[29], close: lastClose }

    expect(computePContext(candles)).toBe(1)
  })
})

describe("computeDecelFactor", () => {
  it("returns 1 when denominator closes are zero", () => {
    const candles = buildCandles()
    candles[25] = { ...candles[25], close: 0 }
    candles[27] = { ...candles[27], close: 0 }

    expect(computeDecelFactor(candles)).toBe(1)
  })
})

describe("computeVolumeFromCandles", () => {
  it("returns null when fewer than 30 candles", () => {
    const result = computeVolumeFromCandles(buildCandles().slice(0, 20))

    expect(result.isNull).toBe(true)
    expect(result.nullReason).toBe("insufficient_candles")
  })

  it("produces a bounded score for valid candles", () => {
    const result = computeVolumeFromCandles(buildCandles())

    expect(result.isNull).toBe(false)
    expect(result.score).not.toBeNull()
    expect(result.score!).toBeGreaterThanOrEqual(-2)
    expect(result.score!).toBeLessThanOrEqual(2)
  })
})
