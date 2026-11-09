import { cn } from "@/lib/utils"
import { getScoreToneColorClasses } from "@/lib/scores/colors"
import {
  getScoreInterpretation,
  getScoreToneFromString,
} from "@/lib/scores/labels"
import { formatEarlyHistoryBadge } from "@/lib/scores/low-history"
import { parseScoreValue } from "@/lib/scores/gauge-math"
import type { ScoreSnapshotView } from "@/lib/scores/types"

type ScoreSignalBadgeProps = {
  snapshot: ScoreSnapshotView | null
  className?: string
}

export const ScoreSignalBadge = ({ snapshot, className }: ScoreSignalBadgeProps) => {
  const isUnavailable = !snapshot || snapshot.isNull
  const numericScore =
    snapshot && !snapshot.isNull ? parseScoreValue(snapshot.score) : null
  const tone = snapshot && !snapshot.isNull ? getScoreToneFromString(snapshot.score) : null

  if (isUnavailable || numericScore === null || !tone) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full border border-silver/30 bg-silver/10 px-2 py-0.5 text-[11px] font-medium text-silver-dim",
          className
        )}
      >
        Unavailable
      </span>
    )
  }

  const label = getScoreInterpretation(numericScore)
  const earlyHistoryLabel = snapshot.lowHistory
    ? formatEarlyHistoryBadge(snapshot.candleCount)
    : null

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-tight",
        getScoreToneColorClasses(tone),
        label === "Crowded / Overheated" && "whitespace-nowrap",
        className
      )}
      title={earlyHistoryLabel ?? undefined}
      aria-label={earlyHistoryLabel ? `${label}, ${earlyHistoryLabel}` : label}
    >
      <span>{label}</span>
      {earlyHistoryLabel ? (
        <span className="text-[9px] font-medium tracking-wider opacity-80">
          · {snapshot.candleCount != null ? `${snapshot.candleCount}w` : "Early"}
        </span>
      ) : null}
    </span>
  )
}
