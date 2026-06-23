"use client"

import { cn } from "@/lib/utils"
import { getScoreTextColorClass, SCORE_TRACK_GRADIENT } from "@/lib/scores/colors"
import { formatScore } from "@/lib/scores/labels"
import { scoreToNormalizedPosition } from "@/lib/scores/gauge-math"

type HeroSectorBarsProps = {
  animatedScore: number
  className?: string
}

const SECTORS = ["Macro", "Relativity", "Volume"] as const

const formatAnimatedScore = (score: number): string => {
  return formatScore(score.toFixed(2))
}

export const HeroSectorBars = ({ animatedScore, className }: HeroSectorBarsProps) => {
  return (
    <div className={cn("flex min-w-0 flex-1 flex-col justify-center gap-3", className)}>
      {SECTORS.map((label) => {
        const percent = scoreToNormalizedPosition(animatedScore) * 100
        const formattedScore = formatAnimatedScore(animatedScore)

        return (
          <div key={label} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium capitalize text-silver-dim">{label}</span>
              <span
                className={cn(
                  "font-mono text-xs tabular-nums",
                  getScoreTextColorClass(animatedScore)
                )}
              >
                {formattedScore}
              </span>
            </div>

            <div
              className="relative h-4 w-full overflow-hidden rounded-full border border-silver/15 bg-black/40"
              role="img"
              aria-label={`${label}: ${formattedScore}`}
            >
              <div
                className="absolute inset-0"
                style={{
                  background: SCORE_TRACK_GRADIENT,
                  clipPath: `inset(0 ${100 - percent}% 0 0 round 9999px)`,
                }}
                aria-hidden="true"
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
