import { formatScoreNumber } from "@/scoring/thresholds"
import type { SectorScoreResult, SectorSnapshotInput } from "@/scoring/types"

export type CompositeSectorSnapshots = {
  macro: SectorSnapshotInput | null
  relativity: SectorSnapshotInput | null
  volume: SectorSnapshotInput | null
}

const parseScore = (score: string | null): number | null => {
  if (score === null) {
    return null
  }

  const numeric = Number(score)

  if (!Number.isFinite(numeric)) {
    return null
  }

  return numeric
}

const readCandleCount = (components: Record<string, unknown> | null | undefined): number | null => {
  if (!components) {
    return null
  }

  const value = components.candle_count

  return typeof value === "number" && Number.isFinite(value) ? value : null
}

const isSectorLowHistory = (snapshot: SectorSnapshotInput): boolean =>
  snapshot.componentsJson?.low_history === true

export const computeComposite = (
  snapshots: CompositeSectorSnapshots
): SectorScoreResult => {
  const sectors = [
    { name: "macro" as const, snapshot: snapshots.macro },
    { name: "relativity" as const, snapshot: snapshots.relativity },
    { name: "volume" as const, snapshot: snapshots.volume },
  ]

  const missing = sectors.filter((entry) => entry.snapshot === null)
  const invalid = sectors.filter(
    (entry) =>
      entry.snapshot !== null &&
      (entry.snapshot.isNull || entry.snapshot.isStale)
  )

  if (missing.length > 0 || invalid.length > 0) {
    return {
      score: null,
      isNull: true,
      nullReason: "insufficient_valid_sectors",
      components: {
        missing_sectors: missing.map((entry) => entry.name),
        invalid_sectors: invalid.map((entry) => ({
          sector: entry.name,
          is_null: entry.snapshot?.isNull ?? true,
          is_stale: entry.snapshot?.isStale ?? false,
          null_reason: entry.snapshot?.nullReason ?? "missing",
        })),
      },
    }
  }

  const scores = sectors.map((entry) => {
    const numeric = parseScore(entry.snapshot!.score)
    return { name: entry.name, score: numeric, snapshot: entry.snapshot! }
  })

  if (scores.some((entry) => entry.score === null)) {
    return {
      score: null,
      isNull: true,
      nullReason: "insufficient_valid_sectors",
      components: {
        error: "One or more sector scores could not be parsed",
      },
    }
  }

  const average =
    scores.reduce((sum, entry) => sum + (entry.score as number), 0) / scores.length

  const lowHistorySectors = scores
    .filter((entry) => isSectorLowHistory(entry.snapshot))
    .map((entry) => entry.name)
  const lowHistory = lowHistorySectors.length > 0
  const candleCounts = scores
    .map((entry) => readCandleCount(entry.snapshot.componentsJson))
    .filter((value): value is number => value !== null)
  const candleCount = candleCounts.length > 0 ? Math.min(...candleCounts) : null

  return {
    score: average,
    isNull: false,
    nullReason: null,
    components: {
      included_sectors: scores.map((entry) => entry.name),
      macro: {
        score: scores.find((entry) => entry.name === "macro")?.score,
        computed_at: snapshots.macro?.computedAt.toISOString(),
        low_history: snapshots.macro ? isSectorLowHistory(snapshots.macro) : false,
      },
      relativity: {
        score: scores.find((entry) => entry.name === "relativity")?.score,
        computed_at: snapshots.relativity?.computedAt.toISOString(),
        low_history: snapshots.relativity ? isSectorLowHistory(snapshots.relativity) : false,
        candle_count: readCandleCount(snapshots.relativity?.componentsJson),
      },
      volume: {
        score: scores.find((entry) => entry.name === "volume")?.score,
        computed_at: snapshots.volume?.computedAt.toISOString(),
        low_history: snapshots.volume ? isSectorLowHistory(snapshots.volume) : false,
        candle_count: readCandleCount(snapshots.volume?.componentsJson),
      },
      formatted_score: formatScoreNumber(average),
      ...(lowHistory
        ? {
            low_history: true,
            low_history_sectors: lowHistorySectors,
            ...(candleCount !== null ? { candle_count: candleCount } : {}),
          }
        : {}),
    },
  }
}
