export type MergeableStockCatalogEntry = {
  symbol: string
  name: string
  assetType: "stock"
  source: "twelve_data"
  providerSymbol: string
  exchange: string
  micCode: string
}

export const mergeStockCatalogEntries = (
  entriesByExchange: MergeableStockCatalogEntry[][]
): MergeableStockCatalogEntry[] => {
  const bySymbol = new Map<string, MergeableStockCatalogEntry>()

  for (const entries of entriesByExchange) {
    for (const entry of entries) {
      if (!bySymbol.has(entry.symbol)) {
        bySymbol.set(entry.symbol, entry)
      }
    }
  }

  return Array.from(bySymbol.values()).sort((left, right) => left.symbol.localeCompare(right.symbol))
}
