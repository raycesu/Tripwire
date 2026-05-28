import type { AssetDto } from "@/lib/assets/types"
import * as binanceGlobal from "@/providers/binance"
import * as binanceUs from "@/providers/binance-us"
import * as twelveData from "@/providers/twelve-data"
import type { ProviderName, WeeklyOhlcvResult } from "@/providers/types"
import { VOLUME_CANDLE_COUNT } from "@/scoring/candles"

type FetchableAsset = {
  assetType: string
  providerName: string | null
  providerSymbol: string | null
  resolutionStatus: string
  symbol: string
}

const fetchFromBinance = (
  providerName: ProviderName,
  providerSymbol: string,
  minCount: number
): Promise<WeeklyOhlcvResult> => {
  if (providerName === "binance_us") {
    return binanceUs.fetchWeeklyOhlcv(providerSymbol, minCount)
  }

  return binanceGlobal.fetchWeeklyOhlcv(providerSymbol, minCount)
}

export const fetchWeeklyOhlcv = async (
  asset: FetchableAsset,
  minCount = VOLUME_CANDLE_COUNT
): Promise<WeeklyOhlcvResult> => {
  if (asset.resolutionStatus === "unsupported") {
    return {
      ok: false,
      nullReason: "unsupported_asset",
      message: `Asset ${asset.symbol} is unsupported`,
    }
  }

  if (!asset.providerName || !asset.providerSymbol) {
    return {
      ok: false,
      nullReason: "missing_provider_config",
      message: `Asset ${asset.symbol} has no provider mapping`,
    }
  }

  if (asset.providerName === "twelve_data") {
    return twelveData.fetchWeeklyOhlcv(asset.providerSymbol, minCount)
  }

  if (asset.providerName === "binance_global" || asset.providerName === "binance_us") {
    return fetchFromBinance(asset.providerName, asset.providerSymbol, minCount)
  }

  return {
    ok: false,
    nullReason: "invalid_provider",
    message: `Unknown provider ${asset.providerName} for ${asset.symbol}`,
  }
}

export const fetchWeeklyOhlcvForSymbol = async (
  symbol: string,
  assetType: "crypto" | "stock",
  minCount = VOLUME_CANDLE_COUNT
): Promise<WeeklyOhlcvResult> => {
  if (assetType === "stock") {
    return twelveData.fetchWeeklyOhlcv(symbol, minCount)
  }

  const providerSymbol = `${symbol.toUpperCase()}USDT`
  const globalResult = await binanceGlobal.fetchWeeklyOhlcv(providerSymbol, minCount)

  if (globalResult.ok) {
    return globalResult
  }

  return binanceUs.fetchWeeklyOhlcv(providerSymbol, minCount)
}

export const fetchBenchmarkWeeklyOhlcv = async (
  benchmarkSymbol: string,
  assetType: "crypto" | "stock"
): Promise<WeeklyOhlcvResult> => {
  if (benchmarkSymbol === "BTC") {
    return fetchWeeklyOhlcvForSymbol("BTC", "crypto")
  }

  if (benchmarkSymbol === "SPY") {
    return twelveData.fetchWeeklyOhlcv("SPY")
  }

  return fetchWeeklyOhlcvForSymbol(benchmarkSymbol, assetType)
}

export const fetchWeeklyOhlcvFromDto = (
  asset: AssetDto,
  minCount = VOLUME_CANDLE_COUNT
): Promise<WeeklyOhlcvResult> => fetchWeeklyOhlcv(asset, minCount)
