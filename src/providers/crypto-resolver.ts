import * as binanceUs from "@/providers/binance-us"
import * as kraken from "@/providers/kraken"
import type { CryptoResolutionResult } from "@/providers/types"

const UNSUPPORTED_REASON = "No Binance US or Kraken USDT pair found"

export const buildUsdtPairSymbol = (baseSymbol: string): string =>
  `${baseSymbol.toUpperCase()}USDT`

export const resolveCryptoSymbol = async (baseSymbol: string): Promise<CryptoResolutionResult> => {
  const normalizedBase = baseSymbol.toUpperCase()
  const providerSymbol = buildUsdtPairSymbol(normalizedBase)

  if (await binanceUs.hasActiveUsdtPair(providerSymbol)) {
    return {
      ok: true,
      providerName: "binance_us",
      providerSymbol,
      quoteAsset: "USDT",
    }
  }

  const krakenPair = await kraken.resolveUsdtPair(normalizedBase)

  if (krakenPair) {
    return {
      ok: true,
      providerName: "kraken",
      providerSymbol: krakenPair.providerSymbol,
      quoteAsset: "USDT",
    }
  }

  return {
    ok: false,
    unsupportedReason: UNSUPPORTED_REASON,
  }
}
