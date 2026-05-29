import { describe, expect, it } from "vitest"
import {
  mapBinanceBasesToCatalog,
  mergeCryptoCatalogEntries,
} from "@/lib/assets/build-crypto-catalog"

describe("mergeCryptoCatalogEntries", () => {
  it("prefers Binance Global when both exchanges list the same base", () => {
    const globalEntries = mapBinanceBasesToCatalog([
      {
        symbol: "BTC",
        name: "BTC",
        providerSymbol: "BTCUSDT",
        source: "binance_global",
      },
    ])
    const usEntries = mapBinanceBasesToCatalog([
      {
        symbol: "BTC",
        name: "BTC",
        providerSymbol: "BTCUSDT",
        source: "binance_us",
      },
    ])

    const merged = mergeCryptoCatalogEntries(globalEntries, usEntries)

    expect(merged).toHaveLength(1)
    expect(merged[0]?.source).toBe("binance_global")
  })

  it("retains Binance US-only bases", () => {
    const globalEntries = mapBinanceBasesToCatalog([
      {
        symbol: "ETH",
        name: "ETH",
        providerSymbol: "ETHUSDT",
        source: "binance_global",
      },
    ])
    const usEntries = mapBinanceBasesToCatalog([
      {
        symbol: "USONLY",
        name: "USONLY",
        providerSymbol: "USONLYUSDT",
        source: "binance_us",
      },
    ])

    const merged = mergeCryptoCatalogEntries(globalEntries, usEntries)

    expect(merged.map((entry) => entry.symbol)).toEqual(["ETH", "USONLY"])
    expect(merged.find((entry) => entry.symbol === "USONLY")?.source).toBe("binance_us")
  })
})

describe("mapBinanceBasesToCatalog", () => {
  it("normalizes symbols to uppercase crypto catalog rows", () => {
    const entries = mapBinanceBasesToCatalog([
      {
        symbol: "sol",
        name: "sol",
        providerSymbol: "SOLUSDT",
        source: "binance_global",
      },
    ])

    expect(entries[0]).toEqual({
      symbol: "SOL",
      name: "sol",
      assetType: "crypto",
      source: "binance_global",
      providerSymbol: "SOLUSDT",
    })
  })
})
