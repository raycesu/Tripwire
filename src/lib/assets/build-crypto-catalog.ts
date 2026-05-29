export type CryptoCatalogEntry = {
  symbol: string
  name: string
  assetType: "crypto"
  source: "binance_global" | "binance_us"
  providerSymbol: string
}

export const mergeCryptoCatalogEntries = (
  globalEntries: CryptoCatalogEntry[],
  usEntries: CryptoCatalogEntry[]
): CryptoCatalogEntry[] => {
  const bySymbol = new Map<string, CryptoCatalogEntry>()

  for (const entry of usEntries) {
    bySymbol.set(entry.symbol, {
      ...entry,
      assetType: "crypto",
    })
  }

  for (const entry of globalEntries) {
    bySymbol.set(entry.symbol, {
      ...entry,
      assetType: "crypto",
    })
  }

  return Array.from(bySymbol.values()).sort((left, right) =>
    left.symbol.localeCompare(right.symbol)
  )
}

export const mapBinanceBasesToCatalog = (
  entries: Array<{
    symbol: string
    name: string
    providerSymbol: string
    source: "binance_global" | "binance_us"
  }>
): CryptoCatalogEntry[] =>
  entries.map((entry) => ({
    symbol: entry.symbol.toUpperCase(),
    name: entry.name,
    assetType: "crypto" as const,
    source: entry.source,
    providerSymbol: entry.providerSymbol,
  }))
