import { describe, expect, it } from "vitest"
import {
  mapBinanceBasesToCatalog,
  mapKrakenBasesToCatalog,
  mergeCryptoCatalogEntries,
} from "@/lib/assets/build-crypto-catalog"

describe("mergeCryptoCatalogEntries", () => {
  it("prefers Binance US when both exchanges list the same base", () => {
    const usEntries = mapBinanceBasesToCatalog([
      {
        symbol: "BTC",
        name: "BTC",
        providerSymbol: "BTCUSDT",
        source: "binance_us",
      },
    ])
    const krakenEntries = mapKrakenBasesToCatalog([
      {
        symbol: "BTC",
        name: "BTC",
        providerSymbol: "XBTUSDT",
        source: "kraken",
      },
    ])

    const merged = mergeCryptoCatalogEntries(usEntries, krakenEntries)

    expect(merged).toHaveLength(1)
    expect(merged[0]?.source).toBe("binance_us")
  })

  it("retains Kraken-only bases", () => {
    const usEntries = mapBinanceBasesToCatalog([
      {
        symbol: "ETH",
        name: "ETH",
        providerSymbol: "ETHUSDT",
        source: "binance_us",
      },
    ])
    const krakenEntries = mapKrakenBasesToCatalog([
      {
        symbol: "KRAKONLY",
        name: "KRAKONLY",
        providerSymbol: "KRAKONLYUSDT",
        source: "kraken",
      },
    ])

    const merged = mergeCryptoCatalogEntries(usEntries, krakenEntries)

    expect(merged.map((entry) => entry.symbol)).toEqual(["ETH", "KRAKONLY"])
    expect(merged.find((entry) => entry.symbol === "KRAKONLY")?.source).toBe("kraken")
  })
})

describe("mapBinanceBasesToCatalog", () => {
  it("normalizes symbols to uppercase crypto catalog rows", () => {
    const entries = mapBinanceBasesToCatalog([
      {
        symbol: "sol",
        name: "sol",
        providerSymbol: "SOLUSDT",
        source: "binance_us",
      },
    ])

    expect(entries[0]).toEqual({
      symbol: "SOL",
      name: "sol",
      assetType: "crypto",
      source: "binance_us",
      providerSymbol: "SOLUSDT",
    })
  })
})
