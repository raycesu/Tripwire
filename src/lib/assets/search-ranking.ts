import type { AssetType } from "@/lib/assets/types"

export type CatalogSearchResult = {
  symbol: string
  name: string
  assetType: AssetType
  source: string
  exchange: string | null
}

export const rankCatalogSearchResult = (
  query: string,
  result: CatalogSearchResult
): number => {
  const normalizedQuery = query.toUpperCase()
  const normalizedSymbol = result.symbol.toUpperCase()
  const normalizedName = result.name.toUpperCase()

  if (normalizedSymbol === normalizedQuery) {
    return 0
  }

  if (normalizedSymbol.startsWith(normalizedQuery)) {
    return 1
  }

  if (normalizedName.includes(normalizedQuery)) {
    return 2
  }

  return 3
}
