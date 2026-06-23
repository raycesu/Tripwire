import { describe, expect, it } from "vitest"
import {
  buildAlertMessage,
  doesRuleMatchSnapshot,
  parseAlertMessageSectorScores,
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

  it("never matches unknown operators", () => {
    expect(
      doesRuleMatchSnapshot({ operator: "below", threshold: "1.00" }, baseSnapshot())
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

describe("parseAlertMessageSectorScores", () => {
  it("parses sector score lines from alert messages", () => {
    const message = buildAlertMessage({
      assetSymbol: "CRCL",
      rule: { scope: "composite", sector: null, operator: "above", threshold: "1.00" },
      snapshot: baseSnapshot({ sector: "composite", score: "+1.07" }),
      sectorSnapshots: {
        macro: baseSnapshot({ sector: "macro", score: "-0.80" }),
        relativity: baseSnapshot({ sector: "relativity", score: "+2.00" }),
        volume: baseSnapshot({ sector: "volume", score: "+2.00" }),
        composite: baseSnapshot({ sector: "composite", score: "+1.07" }),
      },
    })

    expect(parseAlertMessageSectorScores(message)).toEqual({
      composite: 1.07,
      macro: -0.8,
      relativity: 2,
      volume: 2,
    })
  })

  it("returns null for missing sector lines", () => {
    expect(parseAlertMessageSectorScores("Tripwire Alert\n\nNo scores here")).toEqual({
      composite: null,
      macro: null,
      relativity: null,
      volume: null,
    })
  })

  it("returns null for em dash null scores", () => {
    const message = ["Composite: —", "Macro: —", "Relativity: +1.00", "Volume: —"].join("\n")

    expect(parseAlertMessageSectorScores(message)).toEqual({
      composite: null,
      macro: null,
      relativity: 1,
      volume: null,
    })
  })
})

describe("buildAlertMessage", () => {
  it("uses a compact three-line format with bell, sectors, and rule", () => {
    const message = buildAlertMessage({
      assetSymbol: "BTC",
      rule: { scope: "composite", sector: null, operator: "above", threshold: "1.00" },
      snapshot: baseSnapshot({ sector: "composite", score: "+1.04" }),
      sectorSnapshots: {
        macro: baseSnapshot({ sector: "macro", score: "+1.60" }),
        relativity: baseSnapshot({ sector: "relativity", score: "+2.00" }),
        volume: baseSnapshot({ sector: "volume", score: "-0.49" }),
        composite: baseSnapshot({ sector: "composite", score: "+1.04" }),
      },
    })

    expect(message).toBe(
      [
        "🔔 BTC Alert – Composite: +1.04",
        "Macro: +1.60  |  Relativity: +2.00  |  Volume: -0.49",
        "Rule: Composite above 1.00",
      ].join("\n")
    )
  })
})
