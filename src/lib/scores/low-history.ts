export type LowHistoryMeta = {
  lowHistory: boolean
  candleCount: number | null
}

export const getLowHistoryMeta = (
  components: Record<string, unknown> | null | undefined
): LowHistoryMeta => {
  if (!components) {
    return {
      lowHistory: false,
      candleCount: null,
    }
  }

  const candleCount =
    typeof components.candle_count === "number" && Number.isFinite(components.candle_count)
      ? components.candle_count
      : null

  return {
    lowHistory: components.low_history === true,
    candleCount,
  }
}

export const formatEarlyHistoryBadge = (candleCount: number | null): string => {
  if (candleCount === null) {
    return "Early history"
  }

  return `Early history · ${candleCount}w`
}
