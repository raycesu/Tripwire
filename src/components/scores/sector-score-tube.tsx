"use client"

import { cn } from "@/lib/utils"
import {
  getScoreTextColorClass,
  SCORE_TRACK_GRADIENT,
} from "@/lib/scores/colors"
import { formatScore } from "@/lib/scores/labels"
import { parseScoreValue, scoreToNormalizedPosition } from "@/lib/scores/gauge-math"
import type { ScoreSnapshotView } from "@/lib/scores/types"

type SectorScoreTubeProps = {
  label: string
  snapshot: ScoreSnapshotView | null
  className?: string
  labelAction?: React.ReactNode
  children?: React.ReactNode
}

export const SectorScoreTube = ({
  label,
  snapshot,
  className,
  labelAction,
  children,
}: SectorScoreTubeProps) => {
  const isUnavailable = !snapshot || snapshot.isNull
  const numericScore = snapshot && !snapshot.isNull ? parseScoreValue(snapshot.score) : null
  const isStale = snapshot?.isStale ?? false
  const formattedScore = snapshot && !snapshot.isNull ? formatScore(snapshot.score) : "—"

  const percent =
    numericScore !== null ? scoreToNormalizedPosition(numericScore) * 100 : null

  const ariaLabel = snapshot
    ? snapshot.isNull
      ? `${label}: ${snapshot.nullReason ?? "unavailable"}`
      : `${label}: ${formattedScore}${isStale ? ", stale" : ""}`
    : `${label}: no data`

  return (
    <div className={cn("flex flex-col gap-1.5", isStale && !isUnavailable && "opacity-75", className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium capitalize text-silver-dim">{label}</span>
          {labelAction}
        </div>
        <div className="flex items-center gap-1.5">
          {isStale && !isUnavailable ? (
            <span className="text-[9px] font-medium uppercase tracking-wider text-amber-400/90">
              Stale
            </span>
          ) : null}
          <span
            className={cn(
              "font-mono text-xs tabular-nums",
              numericScore !== null ? getScoreTextColorClass(numericScore) : "text-silver-dim"
            )}
          >
            {formattedScore}
          </span>
        </div>
      </div>

      <div
        className="relative h-4 w-full overflow-hidden rounded-full border border-silver/15 bg-black/40"
        role="img"
        aria-label={ariaLabel}
      >
        {!isUnavailable && percent !== null ? (
          <div
            className="absolute inset-0"
            style={{
              background: SCORE_TRACK_GRADIENT,
              clipPath: `inset(0 ${100 - percent}% 0 0 round 9999px)`,
            }}
            aria-hidden="true"
          />
        ) : null}
      </div>

      {children}
    </div>
  )
}
