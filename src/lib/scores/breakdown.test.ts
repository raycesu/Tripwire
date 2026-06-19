import { describe, expect, it } from "vitest"
import {
  buildCompositeBreakdownRows,
  buildMacroBreakdownRows,
  buildRelativityBreakdownRows,
  buildVolumeBreakdownRows,
} from "@/lib/scores/breakdown"
import { BREAKDOWN_TOOLTIPS } from "@/lib/scores/breakdown-tooltips"

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
    expect(rows[0]?.detail).toBeUndefined()
    expect(rows[0]?.tooltip).toContain(BREAKDOWN_TOOLTIPS.fear_greed)
    expect(rows[0]?.tooltip).toContain("Current reading: Fear")
  })

  it("includes VIX date in tooltip for stock macro", () => {
    const rows = buildMacroBreakdownRows(
      {
        vix: { value: 18.5, score: 0.5, weight: 0.6, date: "2026-06-18" },
        sp500_weekly_rsi: { value: 52.1, score: -0.2, weight: 0.4 },
      },
      "stock"
    )

    expect(rows[0]?.label).toBe("VIX")
    expect(rows[0]?.tooltip).toContain(BREAKDOWN_TOOLTIPS.vix)
    expect(rows[0]?.tooltip).toContain("As of 2026-06-18")
    expect(rows[0]?.detail).toBeUndefined()
    expect(rows[1]?.label).toBe("S&P 500 weekly RSI")
    expect(rows[1]?.tooltip).toBeUndefined()
  })

  it("omits BTC weekly RSI tooltip for crypto macro", () => {
    const rows = buildMacroBreakdownRows(
      {
        fear_greed: { value: 25, score: 1.2, weight: 0.5, label: "Fear", classification: "Fear" },
        btc_weekly_rsi: { value: 45, score: 0.8, weight: 0.5 },
      },
      "crypto"
    )

    const btcRow = rows.find((row) => row.label === "BTC weekly RSI")
    expect(btcRow?.tooltip).toBeUndefined()
  })
})

describe("buildRelativityBreakdownRows", () => {
  it("returns three rows without a separate benchmark symbol row", () => {
    const rows = buildRelativityBreakdownRows({
      asset_rsi: 40,
      benchmark_symbol: "BTC",
      benchmark_rsi: 55,
      relativity_index: 15,
    })

    expect(rows).toHaveLength(3)
    expect(rows.map((row) => row.label)).toEqual([
      "Asset RSI(14)",
      "Benchmark RSI(14)",
      "Relativity index",
    ])
    expect(rows.some((row) => row.label === "Benchmark")).toBe(false)
  })

  it("omits asset RSI tooltip", () => {
    const rows = buildRelativityBreakdownRows({
      asset_rsi: 40,
      benchmark_symbol: "BTC",
      benchmark_rsi: 55,
      relativity_index: 15,
    })

    const assetRow = rows.find((row) => row.label === "Asset RSI(14)")
    expect(assetRow?.tooltip).toBeUndefined()
  })

  it("includes relativity formula tooltip", () => {
    const rows = buildRelativityBreakdownRows({
      asset_rsi: 40,
      benchmark_symbol: "BTC",
      benchmark_rsi: 55,
      relativity_index: 15,
    })

    const relativityRow = rows.find((row) => row.label === "Relativity index")
    expect(relativityRow?.tooltip).toBe(BREAKDOWN_TOOLTIPS.relativity_index)
    expect(relativityRow?.detail).toBeUndefined()
  })

  it("includes benchmark symbol in benchmark RSI tooltip", () => {
    const rows = buildRelativityBreakdownRows({
      asset_rsi: 40,
      benchmark_symbol: "SPY",
      benchmark_rsi: 55,
      relativity_index: 15,
    })

    const benchmarkRow = rows.find((row) => row.label === "Benchmark RSI(14)")
    expect(benchmarkRow?.tooltip).toBe("Benchmark: SPY")
  })
})

describe("buildVolumeBreakdownRows", () => {
  it("returns value-only rows without sub-score or weight", () => {
    const rows = buildVolumeBreakdownRows({
      v_trend: 0.42,
      p_context: -0.15,
      rsi_now: 38.2,
      gate: 1.2,
      decel_factor: 1.05,
      raw: 0.192,
      score: 0.48,
    })

    expect(rows).toHaveLength(6)
    expect(rows.every((row) => row.score === undefined && row.weight === undefined)).toBe(true)
  })

  it("includes raw blend tooltip", () => {
    const rows = buildVolumeBreakdownRows({
      v_trend: 0.42,
      p_context: -0.15,
      rsi_now: 38.2,
      gate: 1.2,
      decel_factor: 1.05,
      raw: 0.192,
    })

    const rawRow = rows.find((row) => row.label === "Raw blend")
    expect(rawRow?.tooltip).toBe(BREAKDOWN_TOOLTIPS.raw)
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
