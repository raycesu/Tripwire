import { describe, expect, it } from "vitest"
import { doesRuleMatchSnapshot } from "@/lib/alerts/evaluation"
import type { ScoreSnapshotRecord } from "@/lib/scores/snapshots"

describe("initial-match behavior", () => {
  it("qualifies when latest snapshot is already above threshold", () => {
    const snapshot: ScoreSnapshotRecord = {
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
    }

    const matches = doesRuleMatchSnapshot(
      { operator: "above", threshold: "1.50" },
      snapshot
    )

    expect(matches).toBe(true)
  })

  it("does not initial-match when snapshot is below threshold", () => {
    const snapshot: ScoreSnapshotRecord = {
      id: "snap-1",
      assetId: "asset-1",
      sector: "macro",
      score: "+0.50",
      isNull: false,
      nullReason: null,
      isStale: false,
      componentsJson: null,
      sourceMetadataJson: null,
      computedAt: new Date(),
      validForDate: new Date(),
      cadence: "daily",
    }

    const matches = doesRuleMatchSnapshot(
      { operator: "above", threshold: "1.50" },
      snapshot
    )

    expect(matches).toBe(false)
  })

  it("does not initial-match early-history snapshots", () => {
    const snapshot: ScoreSnapshotRecord = {
      id: "snap-1",
      assetId: "asset-1",
      sector: "volume",
      score: "+1.80",
      isNull: false,
      nullReason: null,
      isStale: false,
      componentsJson: {
        low_history: true,
        candle_count: 21,
        required_candle_count: 30,
      },
      sourceMetadataJson: null,
      computedAt: new Date(),
      validForDate: new Date(),
      cadence: "weekly",
    }

    const matches = doesRuleMatchSnapshot(
      { operator: "above", threshold: "1.50" },
      snapshot
    )

    expect(matches).toBe(false)
  })
})
