import { describe, expect, it } from "vitest"
import { getScoreInterpretation, getScoreTone, getScoreToneFromString } from "@/lib/scores/labels"

describe("getScoreTone", () => {
  it("maps strong opportunity at 1.5 and above", () => {
    expect(getScoreTone(1.5)).toBe("strong_opportunity")
    expect(getScoreTone(2)).toBe("strong_opportunity")
  })

  it("maps opportunity from 1.0 to 1.49", () => {
    expect(getScoreTone(1)).toBe("opportunity")
    expect(getScoreTone(1.49)).toBe("opportunity")
  })

  it("maps neutral from -0.49 to 0.99", () => {
    expect(getScoreTone(-0.49)).toBe("neutral")
    expect(getScoreTone(0.99)).toBe("neutral")
    expect(getScoreTone(0)).toBe("neutral")
  })

  it("maps caution from -0.5 to -0.99", () => {
    expect(getScoreTone(-0.5)).toBe("caution")
    expect(getScoreTone(-0.99)).toBe("caution")
  })

  it("maps overheated at -1.0 and below", () => {
    expect(getScoreTone(-1)).toBe("overheated")
    expect(getScoreTone(-2)).toBe("overheated")
  })
})

describe("getScoreInterpretation", () => {
  it("aligns labels with tone bands", () => {
    expect(getScoreInterpretation(1.75)).toBe("Strong Opportunity")
    expect(getScoreInterpretation(1.2)).toBe("Opportunity")
    expect(getScoreInterpretation(0)).toBe("Neutral")
    expect(getScoreInterpretation(-0.75)).toBe("Caution")
    expect(getScoreInterpretation(-1.5)).toBe("Crowded / Overheated")
  })
})

describe("getScoreToneFromString", () => {
  it("parses stored score strings", () => {
    expect(getScoreToneFromString("1.50")).toBe("strong_opportunity")
    expect(getScoreToneFromString(null)).toBeNull()
    expect(getScoreToneFromString("invalid")).toBeNull()
  })
})
