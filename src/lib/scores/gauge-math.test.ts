import { describe, expect, it } from "vitest"
import {
  angleToScore,
  buildArcSegments,
  clampScore,
  describeArcSegmentPath,
  isSegmentFilledToScore,
  normalizedToNeedleAngle,
  parseScoreValue,
  scoreToNeedleAngle,
  scoreToNormalizedPosition,
} from "@/lib/scores/gauge-math"

describe("parseScoreValue", () => {
  it("parses valid numeric strings", () => {
    expect(parseScoreValue("+1.50")).toBe(1.5)
    expect(parseScoreValue("-0.75")).toBe(-0.75)
    expect(parseScoreValue("0")).toBe(0)
  })

  it("returns null for invalid or missing values", () => {
    expect(parseScoreValue(null)).toBeNull()
    expect(parseScoreValue("n/a")).toBeNull()
  })
})

describe("scoreToNormalizedPosition", () => {
  it("maps -2 to 0 and +2 to 1", () => {
    expect(scoreToNormalizedPosition(-2)).toBe(0)
    expect(scoreToNormalizedPosition(2)).toBe(1)
  })

  it("maps 0 to center", () => {
    expect(scoreToNormalizedPosition(0)).toBe(0.5)
  })

  it("clamps out-of-range scores", () => {
    expect(scoreToNormalizedPosition(-3)).toBe(0)
    expect(scoreToNormalizedPosition(3)).toBe(1)
  })
})

describe("normalizedToNeedleAngle", () => {
  it("maps 0 to 180° and 1 to 0°", () => {
    expect(normalizedToNeedleAngle(0)).toBe(180)
    expect(normalizedToNeedleAngle(1)).toBe(0)
  })

  it("maps center to 90°", () => {
    expect(normalizedToNeedleAngle(0.5)).toBe(90)
  })
})

describe("scoreToNeedleAngle", () => {
  it("maps scores to expected angles", () => {
    expect(scoreToNeedleAngle(-2)).toBe(180)
    expect(scoreToNeedleAngle(0)).toBe(90)
    expect(scoreToNeedleAngle(2)).toBe(0)
  })
})

describe("clampScore", () => {
  it("keeps values within -2..+2", () => {
    expect(clampScore(-2.5)).toBe(-2)
    expect(clampScore(2.5)).toBe(2)
    expect(clampScore(1.2)).toBe(1.2)
  })
})

describe("angleToScore", () => {
  it("round-trips with scoreToNeedleAngle", () => {
    for (const score of [-2, -1, 0, 1, 2, 0.94, -0.75]) {
      const angle = scoreToNeedleAngle(score)
      expect(angleToScore(angle)).toBeCloseTo(score, 5)
    }
  })

  it("maps arc endpoints to score extremes", () => {
    expect(angleToScore(180)).toBe(-2)
    expect(angleToScore(90)).toBe(0)
    expect(angleToScore(0)).toBe(2)
  })
})

describe("buildArcSegments", () => {
  it("returns the requested segment count", () => {
    expect(buildArcSegments({ segmentCount: 28 })).toHaveLength(28)
  })

  it("spans from -2 on the left to +2 on the right", () => {
    const segments = buildArcSegments({ segmentCount: 28 })
    const midScores = segments.map((segment) => segment.midScore)

    expect(Math.min(...midScores)).toBeCloseTo(-2, 0)
    expect(Math.max(...midScores)).toBeCloseTo(2, 0)
  })

  it("orders segments left to right by decreasing start angle", () => {
    const segments = buildArcSegments({ segmentCount: 8 })
    for (let i = 1; i < segments.length; i++) {
      expect(segments[i].startAngle).toBeLessThan(segments[i - 1].startAngle)
    }
  })
})

describe("describeArcSegmentPath", () => {
  it("returns a closed SVG path", () => {
    const path = describeArcSegmentPath(100, 98, 28, 72, 170, 150)
    expect(path.startsWith("M ")).toBe(true)
    expect(path.endsWith("Z")).toBe(true)
  })
})

describe("isSegmentFilledToScore", () => {
  it("fills cumulatively from the left (-2) up to the current score", () => {
    expect(isSegmentFilledToScore(-1.5, 0)).toBe(true)
    expect(isSegmentFilledToScore(0, 0)).toBe(true)
    expect(isSegmentFilledToScore(1.5, 0)).toBe(false)

    expect(isSegmentFilledToScore(-2, 1.07)).toBe(true)
    expect(isSegmentFilledToScore(1.07, 1.07)).toBe(true)
    expect(isSegmentFilledToScore(1.5, 1.07)).toBe(false)
  })
})
