import { cn } from "@/lib/utils"
import {
  formatScore,
  getScoreColorClasses,
  getScoreInterpretation,
  getScoreToneFromString,
} from "@/lib/scores/labels"

type ScoreChipProps = {
  score: string | null
  size?: "sm" | "md" | "lg"
  showInterpretation?: boolean
  className?: string
}

const sizeClasses = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
  lg: "px-3 py-1.5 text-lg font-semibold",
} as const

export const ScoreChip = ({
  score,
  size = "md",
  showInterpretation = false,
  className,
}: ScoreChipProps) => {
  const tone = getScoreToneFromString(score)
  const toneClasses = tone ? getScoreColorClasses(tone) : "border-border bg-muted/40 text-muted-foreground"
  const numeric = score !== null ? Number(score) : NaN
  const interpretation =
    !Number.isNaN(numeric) && showInterpretation ? getScoreInterpretation(numeric) : null

  return (
    <div className={cn("inline-flex flex-col gap-0.5", className)}>
      <span
        className={cn(
          "inline-flex items-center rounded-md border font-mono font-medium tabular-nums",
          sizeClasses[size],
          toneClasses
        )}
      >
        {formatScore(score)}
      </span>
      {interpretation ? (
        <span className="text-xs text-muted-foreground">{interpretation}</span>
      ) : null}
    </div>
  )
}
