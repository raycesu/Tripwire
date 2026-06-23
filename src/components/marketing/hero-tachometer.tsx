"use client"

import { cn } from "@/lib/utils"
import { scoreToOklch } from "@/lib/scores/colors"
import { formatScore } from "@/lib/scores/labels"
import {
  buildArcSegments,
  describeArcSegmentPath,
  isSegmentFilledToScore,
  scoreToArcPoint,
} from "@/lib/scores/gauge-math"

type HeroTachometerProps = {
  animatedScore: number
  targetScore: number
  centerTextOpacity: number
  symbol: string
  className?: string
}

const CX = 100
const CY = 98
const OUTER_RADIUS = 74
const INNER_RADIUS = 53
const SEGMENT_COUNT = 24
const SEGMENT_GAP_DEG = 1.4
const DIAMETER_LABEL_Y_OFFSET = 4
const DIAMETER_LABEL_GAP = 10
const SCORE_BASELINE_Y = CY
const INTERPRETATION_FONT_SIZE = "8px"
const SCORE_FONT_SIZE = "12px"

const ARC_LABEL_FILL = "oklch(0.72 0.008 270)"
const TRACK_STROKE = "oklch(1 0 0 / 8%)"
const ARC_GLOW = "oklch(0.72 0.008 270 / 45%)"
const INACTIVE_SEGMENT_OPACITY = 0.2
const STRONG_OPPORTUNITY_FILL = "oklch(0.65 0.24 25)"

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
  const formatCoord = (value: number) => value.toFixed(2)
  return `M ${formatCoord(start.x)} ${formatCoord(start.y)} A ${radius} ${radius} 0 0 1 ${formatCoord(end.x)} ${formatCoord(end.y)}`
}

const getDiameterLabelPosition = (score: number, xOffset: number) => {
  const point = scoreToArcPoint(score, CX, CY, OUTER_RADIUS)
  return { x: point.x + xOffset, y: point.y + DIAMETER_LABEL_Y_OFFSET }
}

export const HeroTachometer = ({
  animatedScore,
  targetScore,
  centerTextOpacity,
  symbol,
  className,
}: HeroTachometerProps) => {
  const formattedTargetScore = formatScore(targetScore.toFixed(2))

  const lastFilledSegmentIndex = ARC_SEGMENTS.reduce((lastIndex, segment, index) => {
    return isSegmentFilledToScore(segment.midScore, animatedScore) ? index : lastIndex
  }, -1)

  const ariaLabel = `${symbol} composite score ${formattedTargetScore}, Strong Opportunity`

  return (
    <div className={cn("relative flex w-full flex-col items-center", className)}>
      <svg
        viewBox="0 16 200 96"
        className="h-auto w-full"
        role="img"
        aria-label={ariaLabel}
      >
        <defs>
          <filter id="heroSegmentGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="heroArcGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path
          d={describeArc(-2, 2, OUTER_RADIUS)}
          fill="none"
          stroke={TRACK_STROKE}
          strokeWidth={1.5}
        />

        {ARC_SEGMENTS.map((segment, index) => {
          const color = scoreToOklch(segment.midScore)
          const isFilled = isSegmentFilledToScore(segment.midScore, animatedScore)
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
              filter={isLeadingEdge ? "url(#heroSegmentGlow)" : "none"}
            />
          )
        })}

        <path
          d={describeArc(-2, 2, OUTER_RADIUS)}
          fill="none"
          stroke={ARC_GLOW}
          strokeWidth={1}
          filter="url(#heroArcGlow)"
        />

        {DIAMETER_LABELS.map(({ score, label, textAnchor, xOffset }) => {
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
        })}

        <text textAnchor="middle" opacity={centerTextOpacity}>
          <tspan
            x={CX}
            y={SCORE_BASELINE_Y - 24}
            fill={STRONG_OPPORTUNITY_FILL}
            className="font-sans font-semibold"
            style={{ fontSize: INTERPRETATION_FONT_SIZE }}
          >
            Strong
          </tspan>
          <tspan
            x={CX}
            y={SCORE_BASELINE_Y - 14}
            fill={STRONG_OPPORTUNITY_FILL}
            className="font-sans font-semibold"
            style={{ fontSize: INTERPRETATION_FONT_SIZE }}
          >
            Opportunity
          </tspan>
          <tspan
            x={CX}
            y={SCORE_BASELINE_Y}
            fill="oklch(0.58 0.008 270)"
            className="font-mono font-medium tabular-nums"
            style={{ fontSize: SCORE_FONT_SIZE }}
          >
            {formattedTargetScore}
          </tspan>
        </text>
      </svg>
    </div>
  )
}
