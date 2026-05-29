import { describe, expect, it } from "vitest"
import {
  buildCompositeBreakdownRows,
  buildMacroBreakdownRows,
  buildRelativityBreakdownRows,
} from "@/lib/scores/breakdown"

describe("buildMacroBreakdownRows", () => {
  it("parses crypto macro components", () => {
    const rows = buildMacroBreakdownRows(
      {
        fear_greed: { value: 25, score: 1.2, weight: 0.5, label: "Fear", classification: "Fear" },
        btc_weekly_rsi: { value: 45, score: 0.8, weight: 0.5 },
      },
      "crypto"
    )

    expect(rows).toHaveLength(2)
    expect(rows[0]?.label).toBe("Fear & Greed")
    expect(rows[0]?.weight).toBe("50%")
  })
})

describe("buildRelativityBreakdownRows", () => {
  it("includes formula hint", () => {
    const rows = buildRelativityBreakdownRows({
      asset_rsi: 40,
      benchmark_symbol: "BTC",
      benchmark_rsi: 55,
      relativity_index: 1.875,
    })

    expect(rows.some((row) => row.label === "Relativity index")).toBe(true)
  })
})

describe("buildCompositeBreakdownRows", () => {
  it("lists invalid sectors when composite is null", () => {
    const rows = buildCompositeBreakdownRows({
      invalid_sectors: [{ sector: "volume", null_reason: "insufficient_candles", is_stale: false }],
    })

    expect(rows[0]?.label).toBe("volume")
    expect(rows[0]?.value).toBe("insufficient_candles")
  })
})
