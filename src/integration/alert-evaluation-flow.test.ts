import { describe, expect, it } from "vitest"
import {
  doesRuleMatchSnapshot,
  parseSnapshotScore,
  prioritizeAlertRules,
} from "@/lib/alerts/evaluation"
import type { ScoreSnapshotRecord } from "@/lib/scores/snapshots"

const snapshot = (
  overrides: Partial<ScoreSnapshotRecord> = {}
): ScoreSnapshotRecord => ({
  id: "snap-1",
  assetId: "asset-1",
  sector: "composite",
  score: "+1.60",
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

describe("alert evaluation flow", () => {
  it("matches fresh scores above threshold for level-based alerts", () => {
    const rule = { operator: "above", threshold: "1.50" }
    const fresh = snapshot({ score: "+1.60" })

    expect(doesRuleMatchSnapshot(rule, fresh)).toBe(true)
    expect(parseSnapshotScore(fresh.score)).toBe(1.6)
  })

  it("does not match stale or null snapshots", () => {
    const rule = { operator: "above", threshold: "1.00" }

    expect(doesRuleMatchSnapshot(rule, snapshot({ isStale: true }))).toBe(false)
    expect(doesRuleMatchSnapshot(rule, snapshot({ isNull: true, score: null }))).toBe(false)
  })

  it("prioritizes composite rules before sector rules for caps", () => {
    const ordered = prioritizeAlertRules([
      { scope: "sector" },
      { scope: "composite" },
      { scope: "sector" },
    ])

    expect(ordered.map((rule) => rule.scope)).toEqual(["composite", "sector", "sector"])
  })
})
