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

const assetTypeTieBreak = (assetType: AssetType): number => (assetType === "crypto" ? 0 : 1)

export const compareCatalogSearchResults = (
  query: string,
  left: CatalogSearchResult,
  right: CatalogSearchResult
): number => {
  const rankDiff = rankCatalogSearchResult(query, left) - rankCatalogSearchResult(query, right)

  if (rankDiff !== 0) {
    return rankDiff
  }

  const symbolDiff = left.symbol.localeCompare(right.symbol)

  if (symbolDiff !== 0) {
    return symbolDiff
  }

  return assetTypeTieBreak(left.assetType) - assetTypeTieBreak(right.assetType)
}
