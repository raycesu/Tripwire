import * as binanceGlobal from "@/providers/binance"
import * as binanceUs from "@/providers/binance-us"
import type { CryptoResolutionResult } from "@/providers/types"

const UNSUPPORTED_REASON = "No Binance Global or Binance US USDT pair found"

export const buildUsdtPairSymbol = (baseSymbol: string): string =>
  `${baseSymbol.toUpperCase()}USDT`

export const resolveCryptoSymbol = async (baseSymbol: string): Promise<CryptoResolutionResult> => {
  const providerSymbol = buildUsdtPairSymbol(baseSymbol)

  if (await binanceGlobal.hasActiveUsdtPair(providerSymbol)) {
    return {
      ok: true,
      providerName: "binance_global",
      providerSymbol,
      quoteAsset: "USDT",
    }
  }

  if (await binanceUs.hasActiveUsdtPair(providerSymbol)) {
    return {
      ok: true,
      providerName: "binance_us",
      providerSymbol,
      quoteAsset: "USDT",
    }
  }

  return {
    ok: false,
    unsupportedReason: UNSUPPORTED_REASON,
  }
}
