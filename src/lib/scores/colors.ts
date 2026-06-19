import { clampScore } from "@/lib/scores/gauge-math"

type ScoreTone =
  | "strong_opportunity"
  | "opportunity"
  | "neutral"
  | "caution"
  | "overheated"

type OklchColor = {
  l: number
  c: number
  h: number
}

export const SCORE_COLOR_STOPS: Record<number, OklchColor> = {
  [-2]: { l: 0.38, c: 0.01, h: 270 },
  0: { l: 0.62, c: 0.008, h: 270 },
  2: { l: 0.58, c: 0.22, h: 25 },
}

const formatOklch = ({ l, c, h }: OklchColor): string => `oklch(${l} ${c} ${h})`

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t

const interpolateSilverStops = (from: OklchColor, to: OklchColor, t: number): OklchColor => {
  if (t <= 0) return from
  if (t >= 1) return to

  return {
    l: lerp(from.l, to.l, t),
    c: lerp(from.c, to.c, t),
    h: from.h,
  }
}

/** Gray → red without passing through magenta/blue (hue stays on red axis; low chroma reads as gray). */
const interpolateGrayToRed = (from: OklchColor, to: OklchColor, t: number): OklchColor => {
  if (t <= 0) return from
  if (t >= 1) return to

  return {
    l: lerp(from.l, to.l, t),
    c: lerp(from.c, to.c, t),
    h: to.h,
  }
}

/** Maps score -2..+2 to a continuous silver-gray → red OKLCH color. */
export const scoreToOklch = (score: number): string => {
  const clamped = clampScore(score)

  if (clamped <= 0) {
    const t = (clamped - -2) / 2
    return formatOklch(interpolateSilverStops(SCORE_COLOR_STOPS[-2], SCORE_COLOR_STOPS[0], t))
  }

  const t = clamped / 2
  return formatOklch(interpolateGrayToRed(SCORE_COLOR_STOPS[0], SCORE_COLOR_STOPS[2], t))
}

/** CSS linear-gradient for full -2..+2 track (left = dark silver, right = red). */
export const SCORE_TRACK_GRADIENT =
  "linear-gradient(to right, var(--score-silver-dark), var(--score-silver-mid) 50%, var(--score-red-bright))"

export const getScoreToneColorClasses = (tone: ScoreTone): string => {
  switch (tone) {
    case "strong_opportunity":
      return "border-[oklch(0.65_0.24_25/60%)] bg-[oklch(0.58_0.22_25/20%)] text-[oklch(0.65_0.24_25)] shadow-[0_0_12px_oklch(0.58_0.22_25/25%)]"
    case "opportunity":
      return "border-[oklch(0.55_0.14_25/50%)] bg-[oklch(0.55_0.14_25/15%)] text-[oklch(0.58_0.18_25)]"
    case "neutral":
      return "border-silver/30 bg-silver/10 text-silver-dim"
    case "caution":
      return "border-[oklch(0.48_0.01_270/45%)] bg-[oklch(0.48_0.01_270/12%)] text-[oklch(0.52_0.008_270)]"
    case "overheated":
      return "border-[oklch(0.38_0.01_270/55%)] bg-[oklch(0.38_0.01_270/18%)] text-[oklch(0.42_0.01_270)] shadow-[0_0_10px_oklch(0.38_0.01_270/20%)]"
  }
}

export const getScoreTextColorClass = (score: number): string => {
  if (score < 0) {
    return "text-silver"
  }
  if (score === 0) {
    return "text-silver-dim"
  }
  if (score >= 1.5) {
    return "text-[oklch(0.65_0.24_25)]"
  }
  if (score >= 1) {
    return "text-[oklch(0.58_0.18_25)]"
  }
  return "text-[oklch(0.62_0.12_25)]"
}

export const getScoreInterpretationColorClass = (tone: ScoreTone | null): string => {
  if (!tone) {
    return "text-silver-dim"
  }

  switch (tone) {
    case "strong_opportunity":
      return "text-[oklch(0.65_0.24_25)]"
    case "opportunity":
      return "text-[oklch(0.58_0.18_25)]"
    case "neutral":
      return "text-silver"
    case "caution":
      return "text-[oklch(0.52_0.008_270)]"
    case "overheated":
      return "text-[oklch(0.42_0.01_270)]"
  }
}

export const getScoreMarkerStyle = (score: number): { borderColor: string; backgroundColor: string } => {
  const color = scoreToOklch(score)
  return {
    borderColor: color,
    backgroundColor: color.replace(/\)$/, " / 35%)"),
  }
}
