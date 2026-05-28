import type { WeeklyOhlcvCandle } from "@/providers/types"

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

export const wilderRsi = (closes: number[], period = 14): number[] => {
  if (closes.length < period + 1) {
    return []
  }

  const rsiValues: number[] = []
  let avgGain = 0
  let avgLoss = 0

  for (let index = 1; index <= period; index += 1) {
    const change = closes[index] - closes[index - 1]

    if (change >= 0) {
      avgGain += change
    } else {
      avgLoss += Math.abs(change)
    }
  }

  avgGain /= period
  avgLoss /= period

  const firstRsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)
  rsiValues.push(firstRsi)

  for (let index = period + 1; index < closes.length; index += 1) {
    const change = closes[index] - closes[index - 1]
    const gain = change > 0 ? change : 0
    const loss = change < 0 ? Math.abs(change) : 0

    avgGain = (avgGain * (period - 1) + gain) / period
    avgLoss = (avgLoss * (period - 1) + loss) / period

    const rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)
    rsiValues.push(rsi)
  }

  return rsiValues
}

export const latestRsi = (closes: number[], period = 14): number | null => {
  const rsiOutput = wilderRsi(closes, period)

  if (rsiOutput.length === 0) {
    return null
  }

  return rsiOutput[rsiOutput.length - 1]
}

export const getLatestCompletedClose = (candles: WeeklyOhlcvCandle[]): number | null => {
  if (candles.length === 0) {
    return null
  }

  return candles[candles.length - 1].close
}
