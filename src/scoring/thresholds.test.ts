import { describe, expect, it } from "vitest"
import {
  formatScoreNumber,
  scoreFearGreed,
  scoreVix,
  scoreWeeklyRsi,
} from "@/scoring/thresholds"

describe("scoreFearGreed", () => {
  it("maps bucket boundaries", () => {
    expect(scoreFearGreed(24)).toBe(2)
    expect(scoreFearGreed(25)).toBe(1)
    expect(scoreFearGreed(44)).toBe(1)
    expect(scoreFearGreed(45)).toBe(0)
    expect(scoreFearGreed(55)).toBe(0)
    expect(scoreFearGreed(56)).toBe(-1)
    expect(scoreFearGreed(75)).toBe(-1)
    expect(scoreFearGreed(76)).toBe(-2)
  })
})

describe("scoreWeeklyRsi", () => {
  it("maps bucket boundaries", () => {
    expect(scoreWeeklyRsi(29)).toBe(2)
    expect(scoreWeeklyRsi(30)).toBe(1)
    expect(scoreWeeklyRsi(44)).toBe(1)
    expect(scoreWeeklyRsi(45)).toBe(0)
    expect(scoreWeeklyRsi(55)).toBe(0)
    expect(scoreWeeklyRsi(56)).toBe(-1)
    expect(scoreWeeklyRsi(70)).toBe(-1)
    expect(scoreWeeklyRsi(71)).toBe(-2)
  })
})

describe("scoreVix", () => {
  it("maps bucket boundaries", () => {
    expect(scoreVix(12)).toBe(-1)
    expect(scoreVix(13)).toBe(0)
    expect(scoreVix(19)).toBe(0)
    expect(scoreVix(20)).toBe(1)
    expect(scoreVix(29)).toBe(1)
    expect(scoreVix(30)).toBe(2)
    expect(scoreVix(40)).toBe(2)
  })
})

describe("formatScoreNumber", () => {
  it("formats positive scores with a plus prefix", () => {
    expect(formatScoreNumber(1.5)).toBe("+1.50")
  })

  it("formats negative scores without a plus prefix", () => {
    expect(formatScoreNumber(-1.25)).toBe("-1.25")
  })
})
