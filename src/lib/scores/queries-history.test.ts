import { describe, expect, it } from "vitest"
import { mapRowToScoreHistoryPoint } from "@/lib/scores/history"

describe("mapRowToScoreHistoryPoint", () => {
  it("marks fresh daily macro snapshots as not stale", () => {
    const computedAt = new Date()
    const point = mapRowToScoreHistoryPoint(
      {
        score: "1.50",
        validForDate: new Date("2026-06-21T00:00:00.000Z"),
        computedAt,
        cadence: "daily",
      } as never,
      "macro"
    )

    expect(point).toEqual({
      validForDate: new Date("2026-06-21T00:00:00.000Z"),
      score: 1.5,
      computedAt,
      isStale: false,
    })
  })

  it("marks old daily macro snapshots as stale", () => {
    const computedAt = new Date(Date.now() - 40 * 60 * 60 * 1000)
    const point = mapRowToScoreHistoryPoint(
      {
        score: "-0.50",
        validForDate: new Date("2026-06-01T00:00:00.000Z"),
        computedAt,
        cadence: "daily",
      } as never,
      "macro"
    )

    expect(point?.isStale).toBe(true)
  })
})
