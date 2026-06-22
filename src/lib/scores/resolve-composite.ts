import type { ScoreSnapshotView } from "@/lib/scores/types"
import type { ScoreSnapshotRecord } from "@/lib/scores/snapshots"
import { computeComposite } from "@/scoring/composite"
import { computeIsStale } from "@/scoring/staleness"
import { formatScoreNumber } from "@/scoring/thresholds"
import type { Cadence, SectorName, SectorSnapshotInput } from "@/scoring/types"

type SectorSnapshots = {
  macro: ScoreSnapshotView | null
  relativity: ScoreSnapshotView | null
  volume: ScoreSnapshotView | null
}

const toSectorInput = (snapshot: ScoreSnapshotView): SectorSnapshotInput => ({
  sector: snapshot.sector as SectorName,
  score: snapshot.score,
  isNull: snapshot.isNull,
  nullReason: snapshot.nullReason,
  isStale: snapshot.isStale,
  computedAt: snapshot.computedAt,
  cadence: snapshot.cadence as Cadence,
})

const toRecordInput = (snapshot: ScoreSnapshotRecord): SectorSnapshotInput => ({
  sector: snapshot.sector,
  score: snapshot.score,
  isNull: snapshot.isNull,
  nullReason: snapshot.nullReason,
  isStale: snapshot.isStale,
  computedAt: snapshot.computedAt,
  cadence: snapshot.cadence,
})

export const resolveCompositeForDisplay = (
  stored: ScoreSnapshotView | null,
  sectors: SectorSnapshots
): ScoreSnapshotView | null => {
  const result = computeComposite({
    macro: sectors.macro ? toSectorInput(sectors.macro) : null,
    relativity: sectors.relativity ? toSectorInput(sectors.relativity) : null,
    volume: sectors.volume ? toSectorInput(sectors.volume) : null,
  })

  if (result.isNull) {
    if (!stored) {
      return null
    }

    return {
      ...stored,
      score: null,
      isNull: true,
      nullReason: result.nullReason ?? "insufficient_valid_sectors",
      isStale: false,
    }
  }

  if (!stored) {
    return null
  }

  const cadence = stored.cadence as Cadence
  const isStale = computeIsStale("composite", cadence, stored.computedAt)

  return {
    ...stored,
    score: formatScoreNumber(result.score as number),
    isNull: false,
    nullReason: null,
    isStale,
  }
}

export const resolveCompositeRecord = (
  stored: ScoreSnapshotRecord | null,
  macro: ScoreSnapshotRecord | null,
  relativity: ScoreSnapshotRecord | null,
  volume: ScoreSnapshotRecord | null
): ScoreSnapshotRecord | null => {
  const result = computeComposite({
    macro: macro ? toRecordInput(macro) : null,
    relativity: relativity ? toRecordInput(relativity) : null,
    volume: volume ? toRecordInput(volume) : null,
  })

  if (result.isNull) {
    if (!stored) {
      return null
    }

    return {
      ...stored,
      score: null,
      isNull: true,
      nullReason: result.nullReason ?? "insufficient_valid_sectors",
      isStale: false,
    }
  }

  if (!stored) {
    return null
  }

  const isStale = computeIsStale("composite", stored.cadence, stored.computedAt)

  return {
    ...stored,
    score: formatScoreNumber(result.score as number),
    isNull: false,
    nullReason: null,
    isStale,
  }
}
