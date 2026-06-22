import { describe, expect, it } from "vitest"
import { resolveCompositeForDisplay, resolveCompositeRecord } from "@/lib/scores/resolve-composite"
import type { ScoreSnapshotView } from "@/lib/scores/types"
import type { ScoreSnapshotRecord } from "@/lib/scores/snapshots"

const computedAt = new Date("2026-05-28T00:00:00.000Z")
const validForDate = new Date("2026-05-28T00:00:00.000Z")

const buildView = (
  sector: ScoreSnapshotView["sector"],
  score: string,
  overrides: Partial<ScoreSnapshotView> = {}
): ScoreSnapshotView => ({
  id: `${sector}-id`,
  sector,
  score,
  isNull: false,
  nullReason: null,
  isStale: false,
  componentsJson: null,
  computedAt,
  validForDate,
  cadence: sector === "macro" || sector === "composite" ? "daily" : "weekly",
  ...overrides,
})

const buildRecord = (
  sector: ScoreSnapshotRecord["sector"],
  score: string,
  overrides: Partial<ScoreSnapshotRecord> = {}
): ScoreSnapshotRecord => ({
  id: `${sector}-id`,
  assetId: "asset-1",
  sector,
  score,
  isNull: false,
  nullReason: null,
  isStale: false,
  componentsJson: null,
  sourceMetadataJson: null,
  computedAt,
  validForDate,
  cadence: sector === "macro" || sector === "composite" ? "daily" : "weekly",
  ...overrides,
})

describe("resolveCompositeForDisplay", () => {
  it("returns null composite when a sector is stale even if stored composite is valid", () => {
    const macro = buildView("macro", "1.00")
    const relativity = buildView("relativity", "1.50", { isStale: true })
    const volume = buildView("volume", "1.80")
    const stored = buildView("composite", "1.43")

    const resolved = resolveCompositeForDisplay(stored, { macro, relativity, volume })

    expect(resolved?.isNull).toBe(true)
    expect(resolved?.nullReason).toBe("insufficient_valid_sectors")
    expect(resolved?.score).toBeNull()
  })

  it("keeps composite score when all three sectors are valid", () => {
    const macro = buildView("macro", "1.20")
    const relativity = buildView("relativity", "1.50")
    const volume = buildView("volume", "1.80")
    const stored = buildView("composite", "1.50")

    const resolved = resolveCompositeForDisplay(stored, { macro, relativity, volume })

    expect(resolved?.isNull).toBe(false)
    expect(resolved?.score).toBe("+1.50")
  })
})

describe("resolveCompositeRecord", () => {
  it("invalidates composite record when macro is null", () => {
    const macro = buildRecord("macro", "1.00", { isNull: true, score: null })
    const relativity = buildRecord("relativity", "1.50")
    const volume = buildRecord("volume", "1.80")
    const stored = buildRecord("composite", "1.43")

    const resolved = resolveCompositeRecord(stored, macro, relativity, volume)

    expect(resolved?.isNull).toBe(true)
    expect(resolved?.score).toBeNull()
  })
})
