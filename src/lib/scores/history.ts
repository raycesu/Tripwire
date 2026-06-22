import type { scoreSnapshots } from "@/db/schema"
import { computeIsStale } from "@/scoring/staleness"
import type { Cadence, SectorName } from "@/scoring/types"
import type { ScoreHistoryPoint } from "@/lib/scores/types"

export const mapRowToScoreHistoryPoint = (
  row: typeof scoreSnapshots.$inferSelect,
  sector: SectorName | "composite"
): ScoreHistoryPoint | null => {
  const numeric = row.score !== null ? Number(row.score) : NaN

  if (Number.isNaN(numeric)) {
    return null
  }

  const cadence = row.cadence as Cadence

  return {
    validForDate: row.validForDate,
    score: numeric,
    computedAt: row.computedAt,
    isStale: computeIsStale(sector as SectorName, cadence, row.computedAt),
  }
}
