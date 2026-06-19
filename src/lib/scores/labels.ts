import {
  getScoreToneColorClasses,
  getScoreTextColorClass,
  getScoreInterpretationColorClass,
} from "@/lib/scores/colors"

export type ScoreTone =
  | "strong_opportunity"
  | "opportunity"
  | "neutral"
  | "caution"
  | "overheated"

export const getScoreTone = (scoreValue: number): ScoreTone => {
  if (scoreValue >= 1.5) {
    return "strong_opportunity"
  }

  if (scoreValue >= 1) {
    return "opportunity"
  }

  if (scoreValue >= -0.49) {
    return "neutral"
  }

  if (scoreValue > -1) {
    return "caution"
  }

  return "overheated"
}

export const getScoreInterpretation = (scoreValue: number): string => {
  const tone = getScoreTone(scoreValue)

  switch (tone) {
    case "strong_opportunity":
      return "Strong Opportunity"
    case "opportunity":
      return "Opportunity"
    case "neutral":
      return "Neutral"
    case "caution":
      return "Caution"
    case "overheated":
      return "Crowded / Overheated"
  }
}

export { getScoreTextColorClass, getScoreInterpretationColorClass }

export const getScoreColorClasses = (tone: ScoreTone): string => {
  return getScoreToneColorClasses(tone)
}

export const getScoreToneFromString = (score: string | null): ScoreTone | null => {
  if (score === null) {
    return null
  }

  const numeric = Number(score)

  if (Number.isNaN(numeric)) {
    return null
  }

  return getScoreTone(numeric)
}

export const formatScore = (score: string | null): string => {
  if (score === null) {
    return "—"
  }

  const numeric = Number(score)

  if (Number.isNaN(numeric)) {
    return score
  }

  const prefix = numeric > 0 ? "+" : ""
  return `${prefix}${numeric.toFixed(2)}`
}

export const formatComputedAt = (date: Date): string => {
  return date.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  })
}
