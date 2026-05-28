export const getScoreInterpretation = (scoreValue: number): string => {
  if (scoreValue >= 1.5) {
    return "Strong Opportunity"
  }

  if (scoreValue >= 1) {
    return "Opportunity"
  }

  if (scoreValue >= -0.49) {
    return "Neutral"
  }

  if (scoreValue >= -0.5) {
    return "Caution"
  }

  return "Crowded / Overheated"
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
