import { describe, expect, it } from "vitest"
import { compareCatalogSearchResults, rankCatalogSearchResult } from "@/lib/assets/search-ranking"

describe("rankCatalogSearchResult", () => {
  it("ranks exact symbol matches ahead of prefix and name matches", () => {
    const exact = rankCatalogSearchResult("ETH", {
      symbol: "ETH",
      name: "Ethereum",
      assetType: "crypto",
      source: "binance_global",
      exchange: null,
    })
    const prefix = rankCatalogSearchResult("ETH", {
      symbol: "ETHW",
      name: "EthereumPoW",
      assetType: "crypto",
      source: "binance_global",
      exchange: null,
    })
    const name = rankCatalogSearchResult("ETH", {
      symbol: "WETH",
      name: "Wrapped Ethereum",
      assetType: "crypto",
      source: "binance_global",
      exchange: null,
    })

    expect(exact).toBeLessThan(prefix)
    expect(prefix).toBeLessThan(name)
  })

  it("lists crypto ahead of a stock with the same ticker", () => {
    const crypto = {
      symbol: "PUMP",
      name: "PUMP",
      assetType: "crypto" as const,
      source: "binance_global",
      exchange: null,
    }
    const stock = {
      symbol: "PUMP",
      name: "ProPetro Holding Corp",
      assetType: "stock" as const,
      source: "twelve_data",
      exchange: "NYSE",
    }

    expect(compareCatalogSearchResults("PUMP", crypto, stock)).toBeLessThan(0)
    expect(compareCatalogSearchResults("PUMP", stock, crypto)).toBeGreaterThan(0)
  })
})
