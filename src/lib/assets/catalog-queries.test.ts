import { describe, expect, it } from "vitest"
import { rankCatalogSearchResult } from "@/lib/assets/search-ranking"

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
})
