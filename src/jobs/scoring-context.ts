import type { AssetDto } from "@/lib/assets/types"
import { fetchBenchmarkWeeklyOhlcv } from "@/providers/market-data"
import {
  normalizeWeeklyOhlcvCandles,
  RSI_MIN_CANDLE_COUNT,
} from "@/scoring/candles"
import { latestRsi } from "@/scoring/indicators"
import { computeCryptoMacro, computeStockMacro } from "@/scoring/macro"
import type { SectorScoreResult } from "@/scoring/types"

export class ScoringContext {
  private cryptoMacroResult: SectorScoreResult | null = null
  private stockMacroResult: SectorScoreResult | null = null
  private readonly benchmarkRsiCache = new Map<string, number>()

  async getCryptoMacro(): Promise<SectorScoreResult> {
    if (!this.cryptoMacroResult) {
      this.cryptoMacroResult = await computeCryptoMacro()
    }

    return this.cryptoMacroResult
  }

  async getStockMacro(): Promise<SectorScoreResult> {
    if (!this.stockMacroResult) {
      this.stockMacroResult = await computeStockMacro()
    }

    return this.stockMacroResult
  }

  async getMacroForAsset(asset: AssetDto): Promise<SectorScoreResult> {
    if (asset.assetType === "stock") {
      return this.getStockMacro()
    }

    return this.getCryptoMacro()
  }

  async getBenchmarkRsi(benchmarkSymbol: string, assetType: "crypto" | "stock"): Promise<number | null> {
    const cacheKey = `${assetType}:${benchmarkSymbol}`
    const cached = this.benchmarkRsiCache.get(cacheKey)

    if (cached !== undefined) {
      return cached
    }

    const ohlcv = await fetchBenchmarkWeeklyOhlcv(benchmarkSymbol, assetType)

    if (!ohlcv.ok) {
      return null
    }

    const normalized = normalizeWeeklyOhlcvCandles(ohlcv.candles, {
      excludeInProgress: true,
      minCount: RSI_MIN_CANDLE_COUNT,
    })

    if (!normalized.ok) {
      return null
    }

    const closes = normalized.candles.map((candle) => candle.close)
    const rsi = latestRsi(closes, 14)

    if (rsi !== null) {
      this.benchmarkRsiCache.set(cacheKey, rsi)
    }

    return rsi
  }
}
