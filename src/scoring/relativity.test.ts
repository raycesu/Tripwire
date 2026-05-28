import { describe, expect, it } from "vitest"
import { clamp } from "@/scoring/indicators"

const computeRelativityScore = (benchmarkRsi: number, assetRsi: number): number => {
  const relativityIndex = benchmarkRsi - assetRsi
  return clamp(relativityIndex / 8, -2, 2)
}

describe("relativity score formula", () => {
  it("scores +1.5 when benchmark RSI is 50 and asset RSI is 38", () => {
    expect(computeRelativityScore(50, 38)).toBe(1.5)
  })

  it("scores 0 when benchmark and asset RSI match", () => {
    expect(computeRelativityScore(50, 50)).toBe(0)
  })

  it("scores -1.25 when benchmark RSI is 50 and asset RSI is 60", () => {
    expect(computeRelativityScore(50, 60)).toBe(-1.25)
  })
})
