import { describe, expect, it } from "vitest"
import {
  normalizeWeeklyOhlcvCandles,
  resampleDailyToWeeklyCloses,
  VOLUME_CANDLE_COUNT,
} from "@/scoring/candles"
import type { WeeklyOhlcvCandle } from "@/providers/types"

const buildCandle = (index: number, inProgress = false): WeeklyOhlcvCandle => {
  const openTime = new Date(Date.UTC(2024, 0, 1 + index * 7))
  const closeTime = inProgress
    ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    : new Date(Date.UTC(2024, 0, 7 + index * 7))

  return {
    openTime,
    closeTime,
    open: 100 + index,
    high: 101 + index,
    low: 99 + index,
    close: 100 + index,
    volume: 1000 + index,
  }
}

describe("normalizeWeeklyOhlcvCandles", () => {
  it("drops the in-progress weekly candle", () => {
    const raw = Array.from({ length: 32 }, (_, index) =>
      buildCandle(index, index === 31)
    )

    const result = normalizeWeeklyOhlcvCandles(raw, {
      excludeInProgress: true,
      minCount: VOLUME_CANDLE_COUNT,
    })

    expect(result.ok).toBe(true)

    if (result.ok) {
      expect(result.candles.length).toBe(31)
      expect(result.candles[result.candles.length - 1].closeTime.getTime()).toBeLessThanOrEqual(
        Date.now()
      )
    }
  })

  it("dedupes candles with the same open time", () => {
    const first = buildCandle(0)
    const duplicate = { ...first, close: 999 }
    const rest = Array.from({ length: 29 }, (_, index) => buildCandle(index + 1))
    const raw = [first, duplicate, ...rest]

    const result = normalizeWeeklyOhlcvCandles(raw, { minCount: 28 })

    expect(result.ok).toBe(true)

    if (result.ok) {
      expect(result.candles.length).toBe(30)
      expect(result.candles[0].close).toBe(999)
    }
  })

  it("returns insufficient_candles when below minimum", () => {
    const raw = Array.from({ length: 10 }, (_, index) => buildCandle(index))
    const result = normalizeWeeklyOhlcvCandles(raw, { minCount: 28 })

    expect(result.ok).toBe(false)

    if (!result.ok) {
      expect(result.nullReason).toBe("insufficient_candles")
    }
  })
})

describe("resampleDailyToWeeklyCloses", () => {
  it("keeps the last trading day per calendar week", () => {
    const daily = [
      { date: "2024-01-02", close: 10 },
      { date: "2024-01-03", close: 11 },
      { date: "2024-01-04", close: 12 },
      { date: "2024-01-08", close: 20 },
      { date: "2024-01-09", close: 21 },
    ]

    const weekly = resampleDailyToWeeklyCloses(daily)

    expect(weekly).toHaveLength(2)
    expect(weekly[0].close).toBe(12)
    expect(weekly[1].close).toBe(21)
  })
})
