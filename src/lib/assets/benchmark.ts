import type { AssetType } from "@/lib/assets/types"

export const resolveBenchmarkSymbol = (symbol: string, assetType: AssetType): string => {
  if (assetType === "stock") {
    return "SPY"
  }

  if (symbol === "BTC") {
    return "SPY"
  }

  return "BTC"
}
