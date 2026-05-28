import type { Cadence, SectorName } from "@/scoring/types"

const MACRO_STALE_MS = 36 * 60 * 60 * 1000
const WEEKLY_STALE_MS = 8 * 24 * 60 * 60 * 1000

export const computeIsStale = (
  sector: SectorName,
  cadence: Cadence,
  computedAt: Date,
  referenceTime: Date = new Date()
): boolean => {
  const ageMs = referenceTime.getTime() - computedAt.getTime()

  if (sector === "macro" || cadence === "daily") {
    return ageMs > MACRO_STALE_MS
  }

  if (sector === "relativity" || sector === "volume" || cadence === "weekly") {
    return ageMs > WEEKLY_STALE_MS
  }

  return false
}

export const getUtcMidnight = (date: Date = new Date()): Date => {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}
