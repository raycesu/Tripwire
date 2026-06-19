export const SCORE_MIN = -2
export const SCORE_MAX = 2

export const parseScoreValue = (score: string | null): number | null => {
  if (score === null) {
    return null
  }

  const numeric = Number(score)

  if (Number.isNaN(numeric)) {
    return null
  }

  return numeric
}

export const clampScore = (score: number): number => {
  return Math.min(SCORE_MAX, Math.max(SCORE_MIN, score))
}

/** Maps score -2..+2 to normalized 0..1 (0 = left/overheated, 0.5 = center, 1 = right/opportunity). */
export const scoreToNormalizedPosition = (score: number): number => {
  const clamped = clampScore(score)
  return (clamped - SCORE_MIN) / (SCORE_MAX - SCORE_MIN)
}

/** Maps normalized 0..1 to needle angle in degrees (180° = left, 0° = right). */
export const normalizedToNeedleAngle = (normalized: number): number => {
  const clamped = Math.min(1, Math.max(0, normalized))
  return 180 - clamped * 180
}

export const scoreToNeedleAngle = (score: number): number => {
  return normalizedToNeedleAngle(scoreToNormalizedPosition(score))
}

/** SVG arc point on a semicircle from left (-2) to right (+2). */
export const scoreToArcPoint = (
  score: number,
  centerX: number,
  centerY: number,
  radius: number
): { x: number; y: number } => {
  const angleDeg = scoreToNeedleAngle(score)
  const angleRad = (angleDeg * Math.PI) / 180
  return {
    x: centerX + radius * Math.cos(angleRad),
    y: centerY - radius * Math.sin(angleRad),
  }
}

/** Inverse of scoreToNeedleAngle: 180° = -2, 0° = +2. */
export const angleToScore = (angleDeg: number): number => {
  const normalized = (180 - angleDeg) / 180
  return SCORE_MIN + normalized * (SCORE_MAX - SCORE_MIN)
}

export type ArcSegment = {
  startAngle: number
  endAngle: number
  midScore: number
}

export type BuildArcSegmentsOptions = {
  segmentCount: number
  gapDeg?: number
}

const polarToCartesian = (
  centerX: number,
  centerY: number,
  radius: number,
  angleDeg: number
): { x: number; y: number } => {
  const angleRad = (angleDeg * Math.PI) / 180
  return {
    x: centerX + radius * Math.cos(angleRad),
    y: centerY - radius * Math.sin(angleRad),
  }
}

/** Returns segment metadata for a full 180° arc from left (-2) to right (+2). */
export const buildArcSegments = ({
  segmentCount,
  gapDeg = 0,
}: BuildArcSegmentsOptions): ArcSegment[] => {
  const segments: ArcSegment[] = []
  const spanPerSegment = 180 / segmentCount
  const halfGap = gapDeg / 2

  for (let i = 0; i < segmentCount; i++) {
    const rawStart = 180 - i * spanPerSegment
    const rawEnd = 180 - (i + 1) * spanPerSegment
    const startAngle = rawStart - halfGap
    const endAngle = rawEnd + halfGap
    const midAngle = (startAngle + endAngle) / 2

    segments.push({
      startAngle,
      endAngle,
      midScore: angleToScore(midAngle),
    })
  }

  return segments
}

/** SVG path for one trapezoidal arc block between inner and outer radii. */
export const describeArcSegmentPath = (
  centerX: number,
  centerY: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number
): string => {
  const outerStart = polarToCartesian(centerX, centerY, outerRadius, startAngle)
  const outerEnd = polarToCartesian(centerX, centerY, outerRadius, endAngle)
  const innerEnd = polarToCartesian(centerX, centerY, innerRadius, endAngle)
  const innerStart = polarToCartesian(centerX, centerY, innerRadius, startAngle)
  const largeArc = Math.abs(endAngle - startAngle) > 180 ? 1 : 0

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 0 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 1 ${innerStart.x} ${innerStart.y}`,
    "Z",
  ].join(" ")
}

/** True when a segment lies on the filled arc from the left (-2) up to the current score. */
export const isSegmentFilledToScore = (midScore: number, score: number): boolean => {
  return midScore <= clampScore(score)
}
