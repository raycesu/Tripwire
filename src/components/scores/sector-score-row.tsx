import { FreshnessBadges } from "@/components/scores/freshness-badges"
import { ScoreChip } from "@/components/scores/score-chip"
import { formatComputedAt } from "@/lib/scores/labels"

type SectorScoreRowProps = {
  sector: string
  score: string | null
  isNull: boolean
  nullReason: string | null
  isStale: boolean
  cadence: string
  computedAt: Date
}

export const SectorScoreRow = ({
  sector,
  score,
  isNull,
  nullReason,
  isStale,
  cadence,
  computedAt,
}: SectorScoreRowProps) => {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <span className="font-medium capitalize">{sector}</span>
        <p className="mt-1 text-xs text-muted-foreground">
          {cadence} · computed {formatComputedAt(computedAt)} UTC
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {isNull ? (
          <FreshnessBadges
            isNull={isNull}
            nullReason={nullReason}
            isStale={isStale}
            cadence={cadence}
          />
        ) : (
          <ScoreChip score={score} size="sm" />
        )}
        {!isNull ? (
          <FreshnessBadges
            isNull={isNull}
            nullReason={nullReason}
            isStale={isStale}
            cadence={cadence}
          />
        ) : null}
      </div>
    </div>
  )
}
