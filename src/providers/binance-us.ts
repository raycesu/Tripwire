import { createBinanceSpotClient, type BinanceUsdtBase } from "@/providers/binance-spot"

const client = createBinanceSpotClient({
  provider: "binance_us",
  baseUrl: "https://api.binance.us",
  exchangeInfoCacheKey: "binance_us:exchange_info",
  source: "binance_us",
  failureMessage: "Failed to fetch Binance US OHLCV",
})

export type UsdtBaseCatalogEntry = BinanceUsdtBase<"binance_us">

export const getExchangeInfo = client.getExchangeInfo
export const loadActiveUsdtSymbols = client.loadActiveUsdtSymbols
export const hasActiveUsdtPair = client.hasActiveUsdtPair
export const listTradableUsdtBases = client.listTradableUsdtBases
export const getWeeklyKlinesRaw = client.getWeeklyKlinesRaw
export const fetchWeeklyOhlcv = client.fetchWeeklyOhlcv
export const resetBinanceUsCache = client.resetCache
