export type CryptoCatalogEntry = {
  symbol: string
  name: string
  assetType: "crypto"
  source: "binance_us" | "kraken"
  providerSymbol: string
}

export const mergeCryptoCatalogEntries = (
  primaryEntries: CryptoCatalogEntry[],
  fallbackEntries: CryptoCatalogEntry[]
): CryptoCatalogEntry[] => {
  const bySymbol = new Map<string, CryptoCatalogEntry>()

  for (const entry of primaryEntries) {
    bySymbol.set(entry.symbol, {
      ...entry,
      assetType: "crypto",
    })
  }

  for (const entry of fallbackEntries) {
    if (bySymbol.has(entry.symbol)) {
      continue
    }

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
    source: "binance_us"
  }>
): CryptoCatalogEntry[] =>
  entries.map((entry) => ({
    symbol: entry.symbol.toUpperCase(),
    name: entry.name,
    assetType: "crypto" as const,
    source: entry.source,
    providerSymbol: entry.providerSymbol,
  }))

export const mapKrakenBasesToCatalog = (
  entries: Array<{
    symbol: string
    name: string
    providerSymbol: string
    source: "kraken"
  }>
): CryptoCatalogEntry[] =>
  entries.map((entry) => ({
    symbol: entry.symbol.toUpperCase(),
    name: entry.name,
    assetType: "crypto" as const,
    source: entry.source,
    providerSymbol: entry.providerSymbol,
  }))
