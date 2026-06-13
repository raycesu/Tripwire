import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("@/providers/market-data", () => ({
  fetchWeeklyOhlcvFromDto: vi.fn(),
  fetchBenchmarkWeeklyOhlcv: vi.fn(),
}))

vi.mock("@/scoring/macro", () => ({
  computeCryptoMacro: vi.fn(),
  computeStockMacro: vi.fn(),
}))

import { ScoringContext } from "@/jobs/scoring-context"
import type { AssetDto } from "@/lib/assets/types"
import { fetchWeeklyOhlcvFromDto } from "@/providers/market-data"

const asset: AssetDto = {
  id: "asset-1",
  symbol: "TSLA",
  name: "Tesla",
  assetType: "stock",
  providerSymbol: "TSLA",
  providerName: "twelve_data",
  quoteAsset: null,
  benchmarkSymbol: "SPY",
  exchange: "NASDAQ",
  resolutionStatus: "resolved",
  unsupportedReason: null,
  isActive: true,
}

describe("ScoringContext asset OHLCV cache", () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it("reuses the same fetch promise for repeated asset requests", async () => {
    vi.mocked(fetchWeeklyOhlcvFromDto).mockResolvedValue({
      ok: true,
      candles: [],
      sourceMetadata: {
        provider: "twelve_data",
        providerSymbol: "TSLA",
        fetchedAt: new Date().toISOString(),
        candleCount: 30,
        interval: "1w",
      },
    })

    const context = new ScoringContext()

    await context.getAssetWeeklyOhlcv(asset)
    await context.getAssetWeeklyOhlcv(asset)

    expect(fetchWeeklyOhlcvFromDto).toHaveBeenCalledTimes(1)
    expect(fetchWeeklyOhlcvFromDto).toHaveBeenCalledWith(asset, 30)
  })
})
