export const formatScoreNumber = (value: number): string => {
  const rounded = Math.round(value * 100) / 100
  const prefix = rounded > 0 ? "+" : ""
  return `${prefix}${rounded.toFixed(2)}`
}

export const scoreFearGreed = (index: number): number => {
  if (index < 25) {
    return 2
  }

  if (index <= 44) {
    return 1
  }

  if (index <= 55) {
    return 0
  }

  if (index <= 75) {
    return -1
  }

  return -2
}

export const scoreWeeklyRsi = (rsi: number): number => {
  if (rsi < 30) {
    return 2
  }

  if (rsi <= 44) {
    return 1
  }

  if (rsi <= 55) {
    return 0
  }

  if (rsi <= 70) {
    return -1
  }

  return -2
}

export const scoreVix = (vix: number): number => {
  if (vix < 13) {
    return -1
  }

  if (vix <= 19) {
    return 0
  }

  if (vix <= 29) {
    return 1
  }

  if (vix <= 39) {
    return 2
  }

  return 2
}

export const fearGreedLabel = (index: number): string => {
  if (index < 25) {
    return "Extreme Fear"
  }

  if (index <= 44) {
    return "Fear"
  }

  if (index <= 55) {
    return "Neutral"
  }

  if (index <= 75) {
    return "Greed"
  }

  return "Extreme Greed"
}
