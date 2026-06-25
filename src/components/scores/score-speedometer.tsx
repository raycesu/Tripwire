import { cn } from "@/lib/utils"
import { WATCHLIST_SCORE_GAUGE_CLASS } from "@/components/dashboard/watchlist-table-layout"
import {
  scoreToOklch,
} from "@/lib/scores/colors"
import {
  formatScore,
  getScoreInterpretation,
  getScoreToneFromString,
} from "@/lib/scores/labels"
import {
  buildArcSegments,
  describeArcSegmentPath,
  isSegmentFilledToScore,
  parseScoreValue,
  scoreToArcPoint,
  scoreToNormalizedPosition,
} from "@/lib/scores/gauge-math"
import type { ScoreSnapshotView } from "@/lib/scores/types"

type ScoreSpeedometerProps = {
  snapshot: ScoreSnapshotView | null
  symbol?: string
  className?: string
  variant?: "default" | "inline"
  size?: "default" | "large"
}

const GAUGE_SIZE_CLASS = {
  default: "h-auto w-full max-w-[240px] -mb-1",
  large: "h-auto w-full max-w-[360px] -mb-1",
} as const

const GAUGE_VIEWBOX = {
  default: "0 4 200 108",
  large: "0 20 200 92",
} as const

const CX = 100
const CY = 98
const OUTER_RADIUS = 74
const INNER_RADIUS = 53
const SEGMENT_COUNT = 24
const SEGMENT_GAP_DEG = 1.4
const DIAMETER_LABEL_Y_OFFSET = 4
const DIAMETER_LABEL_GAP = 10
const SCORE_BASELINE_Y = CY
const LABEL_ABOVE_SCORE_OFFSET = 16

const ARC_LABEL_FILL = "oklch(0.72 0.008 270)"
const TRACK_STROKE = "oklch(1 0 0 / 8%)"
const ARC_GLOW = "oklch(0.72 0.008 270 / 45%)"
const INACTIVE_SEGMENT_OPACITY = 0.2

const INTERPRETATION_FILL: Record<string, string> = {
  strong_opportunity: "oklch(0.65 0.24 25)",
  opportunity: "oklch(0.58 0.18 25)",
  neutral: "oklch(0.72 0.008 270)",
  caution: "oklch(0.52 0.008 270)",
  overheated: "oklch(0.42 0.01 270)",
}

const DIAMETER_LABELS = [
  { score: -2, label: "-2", textAnchor: "end" as const, xOffset: -DIAMETER_LABEL_GAP },
  { score: 2, label: "2", textAnchor: "start" as const, xOffset: DIAMETER_LABEL_GAP },
] as const

const ARC_SEGMENTS = buildArcSegments({
  segmentCount: SEGMENT_COUNT,
  gapDeg: SEGMENT_GAP_DEG,
})

const describeArc = (startScore: number, endScore: number, radius: number): string => {
  const start = scoreToArcPoint(startScore, CX, CY, radius)
  const end = scoreToArcPoint(endScore, CX, CY, radius)
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${end.x} ${end.y}`
}

const getDiameterLabelPosition = (score: number, xOffset: number) => {
  const point = scoreToArcPoint(score, CX, CY, OUTER_RADIUS)
  return { x: point.x + xOffset, y: point.y + DIAMETER_LABEL_Y_OFFSET }
}

const getInterpretationFill = (tone: ReturnType<typeof getScoreToneFromString>): string => {
  if (!tone) {
    return INTERPRETATION_FILL.neutral
  }

  return INTERPRETATION_FILL[tone]
}

const getInlineScoreFill = (
  numericScore: number | null,
  isUnavailable: boolean
): string => {
  if (isUnavailable || numericScore === null) {
    return "oklch(0.52 0.008 270)"
  }

  if (numericScore >= 1.5) {
    return "oklch(0.65 0.24 25)"
  }

  if (numericScore >= 1) {
    return "oklch(0.58 0.18 25)"
  }

  return "oklch(0.72 0.008 270)"
}

const getInlineScoreFontSize = (formattedScore: string): number => {
  if (formattedScore.length <= 4) {
    return 26
  }

  if (formattedScore.length <= 5) {
    return 23
  }

  return 20
}

const InlineCenterReadout = ({
  formattedScore,
  numericScore,
  isUnavailable,
}: {
  formattedScore: string
  numericScore: number | null
  isUnavailable: boolean
}) => {
  const fill = getInlineScoreFill(numericScore, isUnavailable)
  const isHighlight = numericScore !== null && numericScore >= 1
  const fontSize = isUnavailable ? 20 : getInlineScoreFontSize(formattedScore)

  if (isUnavailable) {
    return (
      <text
        x={CX}
        y={SCORE_BASELINE_Y - 6}
        textAnchor="middle"
        fill={fill}
        className="font-mono font-medium tabular-nums"
        style={{ fontSize: `${fontSize}px` }}
      >
        —
      </text>
    )
  }

  return (
    <text
      x={CX}
      y={SCORE_BASELINE_Y - 6}
      textAnchor="middle"
      fill={fill}
      className={cn("font-mono tabular-nums", isHighlight ? "font-semibold" : "font-medium")}
      style={{ fontSize: `${fontSize}px` }}
    >
      {formattedScore}
    </text>
  )
}

const CenterReadout = ({
  interpretation,
  formattedScore,
  tone,
  isUnavailable,
}: {
  interpretation: string
  formattedScore: string
  tone: ReturnType<typeof getScoreToneFromString>
  isUnavailable: boolean
}) => {
  const labelFill = isUnavailable ? "oklch(0.52 0.008 270)" : getInterpretationFill(tone)
  const isLongLabel = interpretation === "Crowded / Overheated"

  if (isUnavailable) {
    return (
      <text
        x={CX}
        y={SCORE_BASELINE_Y - 6}
        textAnchor="middle"
        fill={labelFill}
        className="font-sans text-[11px] font-semibold"
        style={{ fontSize: "11px" }}
      >
        Unavailable
      </text>
    )
  }

  if (isLongLabel) {
    return (
      <text textAnchor="middle">
        <tspan
          x={CX}
          y={SCORE_BASELINE_Y - 28}
          fill={labelFill}
          className="font-sans text-[9px] font-semibold"
          style={{ fontSize: "9px" }}
        >
          Crowded /
        </tspan>
        <tspan
          x={CX}
          y={SCORE_BASELINE_Y - 16}
          fill={labelFill}
          className="font-sans text-[9px] font-semibold"
          style={{ fontSize: "9px" }}
        >
          Overheated
        </tspan>
        <tspan
          x={CX}
          y={SCORE_BASELINE_Y}
          fill="oklch(0.58 0.008 270)"
          className="font-mono text-[12px] font-medium tabular-nums"
          style={{ fontSize: "12px" }}
        >
          {formattedScore}
        </tspan>
      </text>
    )
  }

  return (
    <text textAnchor="middle">
      <tspan
        x={CX}
        y={SCORE_BASELINE_Y - LABEL_ABOVE_SCORE_OFFSET}
        fill={labelFill}
        className="font-sans text-[11px] font-semibold"
        style={{ fontSize: "11px" }}
      >
        {interpretation}
      </tspan>
      <tspan
        x={CX}
        y={SCORE_BASELINE_Y}
        fill="oklch(0.58 0.008 270)"
        className="font-mono text-[13px] font-medium tabular-nums"
        style={{ fontSize: "13px" }}
      >
        {formattedScore}
      </tspan>
    </text>
  )
}

export const ScoreSpeedometer = ({
  snapshot,
  symbol,
  className,
  variant = "default",
  size = "default",
}: ScoreSpeedometerProps) => {
  const isInline = variant === "inline"
  const isUnavailable = !snapshot || snapshot.isNull
  const numericScore = snapshot && !snapshot.isNull ? parseScoreValue(snapshot.score) : null
  const isStale = snapshot?.isStale ?? false

  const interpretation =
    numericScore !== null ? getScoreInterpretation(numericScore) : "Unavailable"
  const formattedScore = snapshot && !snapshot.isNull ? formatScore(snapshot.score) : "—"
  const tone = snapshot && !snapshot.isNull ? getScoreToneFromString(snapshot.score) : null

  const ariaLabel = symbol
    ? `${symbol} composite score ${formattedScore}, ${interpretation}${isStale ? ", stale" : ""}`
    : `Composite score ${formattedScore}, ${interpretation}${isStale ? ", stale" : ""}`

  const lastFilledSegmentIndex =
    !isUnavailable && numericScore !== null
      ? ARC_SEGMENTS.reduce((lastIndex, segment, index) => {
          return isSegmentFilledToScore(segment.midScore, numericScore) ? index : lastIndex
        }, -1)
      : -1

  return (
    <div
      className={cn(
        "relative flex flex-col items-center",
        isStale && !isUnavailable && "opacity-75",
        isInline && cn(WATCHLIST_SCORE_GAUGE_CLASS, "shrink-0"),
        className
      )}
    >
      <svg
        viewBox={isInline ? GAUGE_VIEWBOX.default : GAUGE_VIEWBOX[size]}
        className={cn(isInline ? WATCHLIST_SCORE_GAUGE_CLASS : GAUGE_SIZE_CLASS[size])}
        role="img"
        aria-label={ariaLabel}
      >
        <defs>
          <filter id="segmentGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="arcGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="centerFill" cx="50%" cy="85%" r="55%">
            <stop offset="0%" stopColor="oklch(0.14 0.005 270 / 60%)" />
            <stop offset="100%" stopColor="oklch(0.08 0 0 / 0%)" />
          </radialGradient>
        </defs>

        {/* Subtle inner fill behind center readout */}
        <circle cx={CX} cy={CY} r={INNER_RADIUS - 4} fill="url(#centerFill)" />

        {/* Background track arc */}
        <path
          d={describeArc(-2, 2, OUTER_RADIUS)}
          fill="none"
          stroke={TRACK_STROKE}
          strokeWidth={1.5}
        />

        {/* Segmented arc blocks — filled cumulatively from -2 (left) to current score */}
        {ARC_SEGMENTS.map((segment, index) => {
          const color = scoreToOklch(segment.midScore)
          const isFilled =
            !isUnavailable &&
            numericScore !== null &&
            isSegmentFilledToScore(segment.midScore, numericScore)
          const isLeadingEdge = index === lastFilledSegmentIndex

          return (
            <path
              key={index}
              d={describeArcSegmentPath(
                CX,
                CY,
                INNER_RADIUS,
                OUTER_RADIUS,
                segment.startAngle,
                segment.endAngle
              )}
              fill={color}
              opacity={isFilled ? 1 : INACTIVE_SEGMENT_OPACITY}
              filter={isLeadingEdge ? "url(#segmentGlow)" : undefined}
            />
          )
        })}

        {/* Outer arc glow */}
        <path
          d={describeArc(-2, 2, OUTER_RADIUS)}
          fill="none"
          stroke={ARC_GLOW}
          strokeWidth={1}
          filter="url(#arcGlow)"
        />

        {/* Scale labels beside diameter endpoints */}
        {!isInline
          ? DIAMETER_LABELS.map(({ score, label, textAnchor, xOffset }) => {
              const pos = getDiameterLabelPosition(score, xOffset)
              return (
                <text
                  key={score}
                  x={pos.x}
                  y={pos.y}
                  textAnchor={textAnchor}
                  fill={ARC_LABEL_FILL}
                  className="font-mono text-[10px] font-semibold tabular-nums"
                  style={{ fontSize: "10px" }}
                >
                  {label}
                </text>
              )
            })
          : null}

        {isInline ? (
          <InlineCenterReadout
            formattedScore={formattedScore}
            numericScore={numericScore}
            isUnavailable={isUnavailable}
          />
        ) : (
          <CenterReadout
            interpretation={interpretation}
            formattedScore={formattedScore}
            tone={tone}
            isUnavailable={isUnavailable}
          />
        )}
      </svg>

      {!isInline ? (
        <div className="flex flex-col items-center gap-0.5 text-center">
          {isUnavailable && snapshot?.nullReason ? (
            <span className="max-w-[200px] text-xs text-muted-foreground">{snapshot.nullReason}</span>
          ) : null}
          {isStale && !isUnavailable ? (
            <span className="text-[10px] font-medium uppercase tracking-wider text-amber-400/90">
              Stale
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

/** Exported for tests / tube positioning reuse */
export const getScorePercentPosition = (score: string | null): number | null => {
  const value = parseScoreValue(score)
  if (value === null) return null
  return scoreToNormalizedPosition(value) * 100
}
