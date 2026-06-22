import { describe, expect, it } from "vitest"
import {
  clamp,
  latestRsi,
  wilderRsi,
} from "@/scoring/indicators"

// Reference closes (30 points) — latest Wilder RSI(14) ≈ 51.28 for this fixture
const REFERENCE_CLOSES = [
  44, 44.34, 44.09, 43.61, 44.33, 44.83, 45.1, 45.42, 45.84, 46.08, 45.89, 46.03,
  45.61, 46.28, 46.28, 46.00, 46.03, 46.41, 46.22, 45.71, 46.25, 45.71, 46.02, 45.43,
  45.73, 46.06, 45.77, 46.24, 46.22, 45.47,
]

describe("clamp", () => {
  it("clamps values to the inclusive range", () => {
    expect(clamp(5, -2, 2)).toBe(2)
    expect(clamp(-5, -2, 2)).toBe(-2)
    expect(clamp(0.5, -2, 2)).toBe(0.5)
  })
})

describe("wilderRsi", () => {
  it("returns an output shorter than the input by the RSI period", () => {
    const output = wilderRsi(REFERENCE_CLOSES, 14)
    expect(output.length).toBe(REFERENCE_CLOSES.length - 14)
  })

  it("maps the latest RSI to the latest close, not a length-matched index", () => {
    const output = wilderRsi(REFERENCE_CLOSES, 14)
    const latest = latestRsi(REFERENCE_CLOSES, 14)

    expect(latest).not.toBeNull()
    expect(latest).toBe(output[output.length - 1])
    expect(latest).not.toBe(output[0])

    // Wrong pattern: indexing RSI by candle index (would use output[15] for 30 closes — out of range or wrong)
    const wrongIndex = output[REFERENCE_CLOSES.length - 1]
    expect(wrongIndex).toBeUndefined()
  })

  it("matches a known reference RSI for the fixture tail", () => {
    const latest = latestRsi(REFERENCE_CLOSES, 14)
    expect(latest).toBeCloseTo(51.28, 1)
  })
})
