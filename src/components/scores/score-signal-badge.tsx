import { cn } from "@/lib/utils"
import { getScoreToneColorClasses } from "@/lib/scores/colors"
import {
  getScoreInterpretation,
  getScoreToneFromString,
} from "@/lib/scores/labels"
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

  return (
    <span
        className={cn(
          "inline-flex max-w-full items-center rounded-full border px-2 py-0.5 text-[11px] font-medium leading-tight",
          getScoreToneColorClasses(tone),
          label === "Crowded / Overheated" && "whitespace-nowrap",
          className
        )}
    >
      {label}
    </span>
  )
}
