import { createBinanceSpotClient, type BinanceUsdtBase } from "@/providers/binance-spot"

const client = createBinanceSpotClient({
  provider: "binance_global",
  baseUrl: "https://api.binance.com",
  exchangeInfoCacheKey: "binance_global:exchange_info",
  source: "binance_global",
  failureMessage: "Failed to fetch Binance OHLCV",
})

export type UsdtBaseCatalogEntry = BinanceUsdtBase<"binance_global">

export const getExchangeInfo = client.getExchangeInfo
export const loadActiveUsdtSymbols = client.loadActiveUsdtSymbols
export const hasActiveUsdtPair = client.hasActiveUsdtPair
export const listTradableUsdtBases = client.listTradableUsdtBases
export const getWeeklyKlinesRaw = client.getWeeklyKlinesRaw
export const fetchWeeklyOhlcv = client.fetchWeeklyOhlcv
export const resetBinanceGlobalCache = client.resetCache
