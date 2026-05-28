import type { DailyPricePoint, NullReason, WeeklyOhlcvCandle } from "@/providers/types"

export const VOLUME_CANDLE_COUNT = 30
export const RSI_MIN_CANDLE_COUNT = 28

export type NormalizeWeeklyOptions = {
  excludeInProgress?: boolean
  minCount?: number
}

export type NormalizeWeeklySuccess = {
  ok: true
  candles: WeeklyOhlcvCandle[]
}

export type NormalizeWeeklyFailure = {
  ok: false
  nullReason: NullReason
  message: string
}

export type NormalizeWeeklyResult = NormalizeWeeklySuccess | NormalizeWeeklyFailure

const getWeekKey = (date: Date): string => {
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = utc.getUTCDay() || 7
  utc.setUTCDate(utc.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1))
  const weekNumber = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7)
  return `${utc.getUTCFullYear()}-W${weekNumber}`
}

export const normalizeWeeklyOhlcvCandles = (
  raw: WeeklyOhlcvCandle[],
  options: NormalizeWeeklyOptions = {}
): NormalizeWeeklyResult => {
  const { excludeInProgress = true, minCount = RSI_MIN_CANDLE_COUNT } = options
  const now = Date.now()

  const sorted = [...raw].sort((left, right) => left.openTime.getTime() - right.openTime.getTime())

  const deduped: WeeklyOhlcvCandle[] = []

  for (const candle of sorted) {
    const last = deduped[deduped.length - 1]

    if (last && last.openTime.getTime() === candle.openTime.getTime()) {
      deduped[deduped.length - 1] = candle
      continue
    }

    deduped.push(candle)
  }

  let candles = deduped

  if (excludeInProgress && candles.length > 0) {
    const last = candles[candles.length - 1]

    if (last.closeTime.getTime() > now) {
      candles = candles.slice(0, -1)
    }
  }

  if (candles.length < minCount) {
    return {
      ok: false,
      nullReason: "insufficient_candles",
      message: `Need at least ${minCount} completed weekly candles, got ${candles.length}`,
    }
  }

  return { ok: true, candles }
}

export const resampleDailyToWeeklyCloses = (dailyPoints: DailyPricePoint[]): DailyPricePoint[] => {
  const sorted = [...dailyPoints].sort((left, right) => left.date.localeCompare(right.date))
  const byWeek = new Map<string, DailyPricePoint>()

  for (const point of sorted) {
    const weekKey = getWeekKey(new Date(`${point.date}T00:00:00.000Z`))
    byWeek.set(weekKey, point)
  }

  return Array.from(byWeek.values()).sort((left, right) => left.date.localeCompare(right.date))
}

export const dailyPointsToWeeklyCandles = (dailyPoints: DailyPricePoint[]): WeeklyOhlcvCandle[] => {
  const weeklyCloses = resampleDailyToWeeklyCloses(dailyPoints)

  return weeklyCloses.map((point) => {
    const openTime = new Date(`${point.date}T00:00:00.000Z`)
    const closeTime = new Date(openTime.getTime() + 6 * 24 * 60 * 60 * 1000)

    return {
      openTime,
      closeTime,
      open: point.close,
      high: point.close,
      low: point.close,
      close: point.close,
      volume: 0,
    }
  })
}
