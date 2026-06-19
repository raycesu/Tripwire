import { cn } from "@/lib/utils"
import { formatScore, getScoreColorClasses, getScoreToneFromString } from "@/lib/scores/labels"
import type { ScoreSnapshotView } from "@/lib/scores/types"

type SectorMiniIndicatorProps = {
  label: string
  snapshot: ScoreSnapshotView | null
}

export const SectorMiniIndicator = ({ label, snapshot }: SectorMiniIndicatorProps) => {
  const title = snapshot
    ? snapshot.isNull
      ? `${label}: ${snapshot.nullReason ?? "unavailable"}`
      : `${label}: ${formatScore(snapshot.score)}${snapshot.isStale ? " (stale)" : ""}`
    : `${label}: no data`

  if (!snapshot || snapshot.isNull) {
    return (
      <span
        title={title}
        className="inline-flex size-6 items-center justify-center rounded border border-white/25 bg-white/8 text-[10px] font-medium uppercase text-white/45"
        aria-label={title}
      >
        —
      </span>
    )
  }

  const tone = getScoreToneFromString(snapshot.score)
  const colorClasses = tone
    ? getScoreColorClasses(tone)
    : "border-white/25 bg-white/8 text-white/50"

  return (
    <span
      title={title}
      className={cn(
        "inline-flex size-6 items-center justify-center rounded border text-[9px] font-mono font-medium",
        colorClasses,
        snapshot.isStale && "opacity-60"
      )}
      aria-label={title}
    >
      {snapshot.score !== null
        ? (() => {
            const n = Math.round(Number(snapshot.score))
            return n > 0 ? `+${n}` : `${n}`
          })()
        : "—"}
    </span>
  )
}
