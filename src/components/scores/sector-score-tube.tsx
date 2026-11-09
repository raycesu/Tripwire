import { cn } from "@/lib/utils"
import {
  getScoreTextColorClass,
  SCORE_TRACK_GRADIENT_INLINE,
} from "@/lib/scores/colors"
import { formatScore } from "@/lib/scores/labels"
import { formatEarlyHistoryBadge } from "@/lib/scores/low-history"
import { parseScoreValue, scoreToNormalizedPosition } from "@/lib/scores/gauge-math"
import type { ScoreSnapshotView } from "@/lib/scores/types"

export const WATCHLIST_SECTOR_BAR_WIDTH_PX = 130
export const WATCHLIST_SECTOR_TUBE_WIDTH_PX = 188

const sectorBarTrackClassName =
  "relative shrink-0 overflow-hidden rounded-full bg-black/40 shadow-[inset_0_0_0_0.5px_oklch(1_0_0/12%)]"

type SectorScoreTubeProps = {
  label: string
  snapshot: ScoreSnapshotView | null
  className?: string
  labelAction?: React.ReactNode
  children?: React.ReactNode
  layout?: "default" | "compact" | "table"
}

export const SectorScoreTube = ({
  label,
  snapshot,
  className,
  labelAction,
  children,
  layout = "default",
}: SectorScoreTubeProps) => {
  const isUnavailable = !snapshot || snapshot.isNull
  const numericScore = snapshot && !snapshot.isNull ? parseScoreValue(snapshot.score) : null
  const isStale = snapshot?.isStale ?? false
  const isLowHistory = snapshot?.lowHistory ?? false
  const earlyHistoryLabel = isLowHistory
    ? formatEarlyHistoryBadge(snapshot?.candleCount ?? null)
    : null
  const formattedScore = snapshot && !snapshot.isNull ? formatScore(snapshot.score) : "—"

  const percent =
    numericScore !== null ? scoreToNormalizedPosition(numericScore) * 100 : null

  const ariaLabel = snapshot
    ? snapshot.isNull
      ? `${label}: ${snapshot.nullReason ?? "unavailable"}`
      : `${label}: ${formattedScore}${isLowHistory ? `, ${earlyHistoryLabel}` : ""}${isStale ? ", stale" : ""}`
    : `${label}: no data`

  const isTableLayout = layout === "table"
  const isInlineBarLayout = layout === "compact" || isTableLayout

  const scoreElement = (
    <div className="flex shrink-0 items-center gap-0.5">
      {isLowHistory && !isUnavailable && isInlineBarLayout ? (
        <span
          className="max-w-[72px] truncate text-[8px] font-medium uppercase tracking-wider text-amber-400/90"
          title={earlyHistoryLabel ?? undefined}
        >
          Early
        </span>
      ) : null}
      {isStale && !isUnavailable && !isLowHistory && isInlineBarLayout ? (
        <span className="text-[8px] font-medium uppercase tracking-wider text-amber-400/90">
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
      {labelAction}
    </div>
  )

  const barElement = (
    <div
      className={cn(
        sectorBarTrackClassName,
        isInlineBarLayout ? "h-4" : "h-4 w-full",
        (isUnavailable || percent === null) && "bg-black/50"
      )}
      style={
        isInlineBarLayout
          ? { width: `${WATCHLIST_SECTOR_BAR_WIDTH_PX}px`, minWidth: `${WATCHLIST_SECTOR_BAR_WIDTH_PX}px` }
          : undefined
      }
      role="img"
      aria-label={ariaLabel}
    >
      {!isUnavailable && percent !== null ? (
        <div
          className="absolute inset-0"
          style={{
            background: SCORE_TRACK_GRADIENT_INLINE,
            clipPath: `inset(0 ${100 - percent}% 0 0 round 9999px)`,
          }}
          aria-hidden="true"
        />
      ) : null}
    </div>
  )

  if (layout === "compact") {
    return (
      <div
        className={cn("flex flex-col gap-1.5", isStale && !isUnavailable && "opacity-75", className)}
      >
        <div className="flex min-w-0 items-center gap-1.5">
          {barElement}
          {scoreElement}
        </div>
        {children}
      </div>
    )
  }

  if (layout === "table") {
    return (
      <div
        className={cn(
          "flex w-full min-w-0 items-center gap-1.5",
          isStale && !isUnavailable && "opacity-75",
          className
        )}
      >
        {barElement}
        {scoreElement}
        {children}
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-1.5", isStale && !isUnavailable && "opacity-75", className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium capitalize text-silver-dim">{label}</span>
          {labelAction}
        </div>
        <div className="flex items-center gap-1.5">
          {isLowHistory && !isUnavailable ? (
            <span className="text-[9px] font-medium tracking-wider text-amber-400/90">
              {earlyHistoryLabel}
            </span>
          ) : null}
          {isStale && !isUnavailable && !isLowHistory ? (
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

      {barElement}

      {children}
    </div>
  )
}
