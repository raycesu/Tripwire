import { describe, expect, it } from "vitest"
import {
  buildAlertMessage,
  doesRuleMatchSnapshot,
  parseSnapshotScore,
  prioritizeAlertRules,
} from "@/lib/alerts/evaluation"
import type { ScoreSnapshotRecord } from "@/lib/scores/snapshots"

const baseSnapshot = (overrides: Partial<ScoreSnapshotRecord> = {}): ScoreSnapshotRecord => ({
  id: "snap-1",
  assetId: "asset-1",
  sector: "macro",
  score: "+1.80",
  isNull: false,
  nullReason: null,
  isStale: false,
  componentsJson: null,
  sourceMetadataJson: null,
  computedAt: new Date(),
  validForDate: new Date(),
  cadence: "daily",
  ...overrides,
})

describe("parseSnapshotScore", () => {
  it("parses signed score strings", () => {
    expect(parseSnapshotScore("+1.63")).toBe(1.63)
    expect(parseSnapshotScore("-0.50")).toBe(-0.5)
  })

  it("returns null for missing scores", () => {
    expect(parseSnapshotScore(null)).toBeNull()
    expect(parseSnapshotScore("not-a-number")).toBeNull()
  })
})

describe("doesRuleMatchSnapshot", () => {
  it("matches above threshold", () => {
    expect(
      doesRuleMatchSnapshot({ operator: "above", threshold: "1.50" }, baseSnapshot())
    ).toBe(true)
  })

  it("does not match at or below threshold", () => {
    expect(
      doesRuleMatchSnapshot({ operator: "above", threshold: "1.80" }, baseSnapshot())
    ).toBe(false)
  })

  it("skips null and stale snapshots", () => {
    expect(
      doesRuleMatchSnapshot(
        { operator: "above", threshold: "1.00" },
        baseSnapshot({ isNull: true, score: null })
      )
    ).toBe(false)

    expect(
      doesRuleMatchSnapshot(
        { operator: "above", threshold: "1.00" },
        baseSnapshot({ isStale: true })
      )
    ).toBe(false)
  })
})

describe("prioritizeAlertRules", () => {
  it("orders composite rules before sector rules", () => {
    const ordered = prioritizeAlertRules([
      { scope: "sector", id: "a" } as never,
      { scope: "composite", id: "b" } as never,
      { scope: "sector", id: "c" } as never,
    ])

    expect(ordered.map((rule) => rule.scope)).toEqual(["composite", "sector", "sector"])
  })
})

describe("buildAlertMessage", () => {
  it("includes asset, sectors, and rule reason", () => {
    const message = buildAlertMessage({
      assetSymbol: "SOL",
      rule: { scope: "composite", sector: null, operator: "above", threshold: "1.50" },
      snapshot: baseSnapshot({ sector: "composite", score: "+1.63" }),
      sectorSnapshots: {
        macro: baseSnapshot({ sector: "macro", score: "+1.20" }),
        relativity: baseSnapshot({ sector: "relativity", score: "+1.50" }),
        volume: baseSnapshot({ sector: "volume", score: "+1.82" }),
        composite: baseSnapshot({ sector: "composite", score: "+1.63" }),
      },
    })

    expect(message).toContain("Tripwire Alert")
    expect(message).toContain("SOL composite is above 1.50")
    expect(message).toContain('Composite above 1.5')
  })
})
