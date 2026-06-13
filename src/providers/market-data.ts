import type { AssetDto } from "@/lib/assets/types"
import * as binanceUs from "@/providers/binance-us"
import { buildUsdtPairSymbol } from "@/providers/crypto-resolver"
import * as kraken from "@/providers/kraken"
import * as twelveData from "@/providers/twelve-data"
import type { ProviderName, WeeklyOhlcvResult } from "@/providers/types"
import { VOLUME_CANDLE_COUNT } from "@/scoring/candles"

type FetchableAsset = {
  assetType: string
  providerName: string | null
  providerSymbol: string | null
  exchange: string | null
  resolutionStatus: string
  symbol: string
}

const extractBaseSymbol = (providerSymbol: string): string =>
  providerSymbol.toUpperCase().replace(/USDT$/, "")

const fetchFromKraken = (
  providerSymbol: string,
  minCount: number
): Promise<WeeklyOhlcvResult> => kraken.fetchWeeklyOhlcv(providerSymbol, minCount)

const fetchFromBinanceUs = (
  providerSymbol: string,
  minCount: number
): Promise<WeeklyOhlcvResult> => binanceUs.fetchWeeklyOhlcv(providerSymbol, minCount)

const fetchKrakenFallbackForBase = async (
  baseSymbol: string,
  minCount: number
): Promise<WeeklyOhlcvResult> => {
  const pair = await kraken.resolveUsdtPair(baseSymbol)

  if (!pair) {
    return {
      ok: false,
      nullReason: "unsupported_asset",
      message: `No Kraken USDT pair found for ${baseSymbol}`,
      provider: "kraken",
    }
  }

  return fetchFromKraken(pair.providerSymbol, minCount)
}

export const fetchCryptoWeeklyOhlcv = async (
  providerName: ProviderName | string | null,
  providerSymbol: string,
  minCount: number
): Promise<WeeklyOhlcvResult> => {
  const baseSymbol = extractBaseSymbol(providerSymbol)

  if (providerName === "kraken") {
    return fetchFromKraken(providerSymbol, minCount)
  }

  if (providerName === "binance_us" || providerName === "binance_global" || !providerName) {
    const usResult = await fetchFromBinanceUs(buildUsdtPairSymbol(baseSymbol), minCount)

    if (usResult.ok) {
      return usResult
    }

    return fetchKrakenFallbackForBase(baseSymbol, minCount)
  }

  return {
    ok: false,
    nullReason: "invalid_provider",
    message: `Unknown crypto provider ${providerName}`,
  }
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
    return twelveData.fetchWeeklyOhlcv(asset.providerSymbol, minCount, {
      exchange: asset.exchange,
    })
  }

  if (
    asset.providerName === "binance_us" ||
    asset.providerName === "binance_global" ||
    asset.providerName === "kraken"
  ) {
    return fetchCryptoWeeklyOhlcv(asset.providerName, asset.providerSymbol, minCount)
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
  minCount = VOLUME_CANDLE_COUNT,
  exchange?: string | null
): Promise<WeeklyOhlcvResult> => {
  if (assetType === "stock") {
    return twelveData.fetchWeeklyOhlcv(symbol, minCount, { exchange })
  }

  return fetchCryptoWeeklyOhlcv("binance_us", buildUsdtPairSymbol(symbol), minCount)
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
