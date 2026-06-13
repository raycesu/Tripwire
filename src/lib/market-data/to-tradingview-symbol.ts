import type { AssetType } from "@/lib/assets/types"

export type TradingViewSymbolInput = {
  assetType: AssetType
  symbol: string
  providerSymbol: string | null
  providerName: string | null
  exchange: string | null
  resolutionStatus: string
}

const CRYPTO_EXCHANGE_BY_PROVIDER: Record<string, string> = {
  binance_global: "BINANCE",
  binance_us: "BINANCEUS",
  kraken: "KRAKEN",
}

export const toTradingViewSymbol = (asset: TradingViewSymbolInput): string | null => {
  if (asset.resolutionStatus === "unsupported") {
    return null
  }

  if (asset.assetType === "crypto") {
    if (!asset.providerSymbol) {
      return null
    }

    const exchangePrefix =
      (asset.providerName && CRYPTO_EXCHANGE_BY_PROVIDER[asset.providerName]) ?? "BINANCE"

    return `${exchangePrefix}:${asset.providerSymbol.toUpperCase()}`
  }

  if (asset.assetType === "stock") {
    if (!asset.exchange) {
      return null
    }

    return `${asset.exchange.toUpperCase()}:${asset.symbol.toUpperCase()}`
  }

  return null
}
