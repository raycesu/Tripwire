import { getCatalogEntryBySymbol } from "@/lib/assets/catalog-queries"
import type { AssetDto } from "@/lib/assets/types"
import { toTradingViewSymbol } from "@/lib/market-data/to-tradingview-symbol"

export const resolveTradingViewSymbolForAsset = async (
  asset: AssetDto
): Promise<string | null> => {
  const directSymbol = toTradingViewSymbol(asset)

  if (directSymbol) {
    return directSymbol
  }

  if (asset.assetType !== "stock" || asset.resolutionStatus === "unsupported") {
    return null
  }

  const catalogEntry = await getCatalogEntryBySymbol(asset.symbol, "stock")

  if (!catalogEntry?.exchange) {
    return null
  }

  return toTradingViewSymbol({
    ...asset,
    exchange: catalogEntry.exchange,
  })
}
