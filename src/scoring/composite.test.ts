import { describe, expect, it } from "vitest"
import { computeComposite } from "@/scoring/composite"
import type { SectorSnapshotInput } from "@/scoring/types"

const buildSnapshot = (
  sector: SectorSnapshotInput["sector"],
  score: string,
  overrides: Partial<SectorSnapshotInput> = {}
): SectorSnapshotInput => ({
  sector,
  score,
  isNull: false,
  nullReason: null,
  isStale: false,
  computedAt: new Date("2026-05-28T00:00:00.000Z"),
  cadence: sector === "macro" ? "daily" : "weekly",
  ...overrides,
})

describe("computeComposite", () => {
  it("averages three valid sector scores", () => {
    const result = computeComposite({
      macro: buildSnapshot("macro", "1.20"),
      relativity: buildSnapshot("relativity", "1.50"),
      volume: buildSnapshot("volume", "1.80"),
    })

    expect(result.isNull).toBe(false)
    expect(result.score).toBeCloseTo(1.5, 2)
    expect(result.components.included_sectors).toEqual(["macro", "relativity", "volume"])
  })

  it("returns null when any sector is stale", () => {
    const result = computeComposite({
      macro: buildSnapshot("macro", "1.20"),
      relativity: buildSnapshot("relativity", "1.50", { isStale: true }),
      volume: buildSnapshot("volume", "1.80"),
    })

    expect(result.isNull).toBe(true)
    expect(result.nullReason).toBe("insufficient_valid_sectors")
  })

  it("returns null when a sector snapshot is missing", () => {
    const result = computeComposite({
      macro: buildSnapshot("macro", "1.20"),
      relativity: null,
      volume: buildSnapshot("volume", "1.80"),
    })

    expect(result.isNull).toBe(true)
    expect(result.nullReason).toBe("insufficient_valid_sectors")
  })
})
