import { describe, expect, it } from "vitest"
import {
  getScoreInterpretationColorClass,
  getScoreTextColorClass,
  getScoreToneColorClasses,
  scoreToOklch,
  SCORE_COLOR_STOPS,
} from "@/lib/scores/colors"

describe("scoreToOklch", () => {
  it("returns dark silver at -2", () => {
    expect(scoreToOklch(-2)).toBe("oklch(0.38 0.01 270)")
  })

  it("returns mid silver at 0", () => {
    expect(scoreToOklch(0)).toBe("oklch(0.62 0.008 270)")
  })

  it("returns deep red at +2", () => {
    expect(scoreToOklch(2)).toBe("oklch(0.58 0.22 25)")
  })

  it("interpolates between -2 and 0", () => {
    const color = scoreToOklch(-1)
    expect(color).toMatch(/^oklch\(/)
    expect(color).not.toBe(scoreToOklch(-2))
    expect(color).not.toBe(scoreToOklch(0))
  })

  it("interpolates between 0 and +2", () => {
    const color = scoreToOklch(1)
    expect(color).toMatch(/^oklch\(/)
    expect(color).not.toBe(scoreToOklch(0))
    expect(color).not.toBe(scoreToOklch(2))
  })

  it("keeps positive scores on the red hue axis (no blue/magenta drift)", () => {
    for (const score of [0.25, 0.5, 1, 1.5, 2]) {
      const color = scoreToOklch(score)
      const hue = Number(color.match(/oklch\([^)]+\s+[^)]+\s+([^)]+)\)/)?.[1])
      expect(hue).toBeGreaterThanOrEqual(0)
      expect(hue).toBeLessThanOrEqual(60)
    }
  })

  it("clamps out-of-range values", () => {
    expect(scoreToOklch(-5)).toBe(scoreToOklch(-2))
    expect(scoreToOklch(5)).toBe(scoreToOklch(2))
  })
})

describe("getScoreToneColorClasses", () => {
  it("returns non-empty classes for every tone", () => {
    const tones = [
      "strong_opportunity",
      "opportunity",
      "neutral",
      "caution",
      "overheated",
    ] as const

    for (const tone of tones) {
      expect(getScoreToneColorClasses(tone).length).toBeGreaterThan(0)
    }
  })
})

describe("getScoreTextColorClass", () => {
  it("returns red-tinted class for high scores", () => {
    expect(getScoreTextColorClass(2)).toContain("0.65")
  })

  it("returns silver class for neutral scores", () => {
    expect(getScoreTextColorClass(0)).toBe("text-silver-dim")
  })

  it("returns muted red class for mild positive scores", () => {
    expect(getScoreTextColorClass(0.38)).toContain("0.62")
    expect(getScoreTextColorClass(0.38)).toContain("25")
  })

  it("returns silver class for negative scores", () => {
    expect(getScoreTextColorClass(-2)).toBe("text-silver")
    expect(getScoreTextColorClass(-0.5)).toBe("text-silver")
  })
})

describe("getScoreInterpretationColorClass", () => {
  it("returns silver for neutral tone", () => {
    expect(getScoreInterpretationColorClass("neutral")).toBe("text-silver")
  })

  it("returns fallback for null tone", () => {
    expect(getScoreInterpretationColorClass(null)).toBe("text-silver-dim")
  })
})

describe("SCORE_COLOR_STOPS", () => {
  it("defines anchors at -2, 0, and +2", () => {
    expect(SCORE_COLOR_STOPS[-2]).toBeDefined()
    expect(SCORE_COLOR_STOPS[0]).toBeDefined()
    expect(SCORE_COLOR_STOPS[2]).toBeDefined()
  })
})
