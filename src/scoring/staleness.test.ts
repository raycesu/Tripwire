import { describe, expect, it } from "vitest"
import { computeIsStale } from "@/scoring/staleness"

describe("computeIsStale", () => {
  const now = new Date("2026-05-28T12:00:00.000Z")

  it("marks macro stale after 36 hours", () => {
    const fresh = new Date("2026-05-27T01:00:00.000Z")
    const stale = new Date("2026-05-26T23:00:00.000Z")

    expect(computeIsStale("macro", "daily", fresh, now)).toBe(false)
    expect(computeIsStale("macro", "daily", stale, now)).toBe(true)
  })

  it("marks weekly sectors stale after 8 days", () => {
    const fresh = new Date("2026-05-21T12:00:00.000Z")
    const stale = new Date("2026-05-19T12:00:00.000Z")

    expect(computeIsStale("relativity", "weekly", fresh, now)).toBe(false)
    expect(computeIsStale("volume", "weekly", stale, now)).toBe(true)
  })
})
