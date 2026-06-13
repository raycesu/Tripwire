import { describe, expect, it } from "vitest"
import { toTradingViewSymbol } from "@/lib/market-data/to-tradingview-symbol"

describe("toTradingViewSymbol", () => {
  it("maps Binance Global crypto to BINANCE prefix", () => {
    expect(
      toTradingViewSymbol({
        assetType: "crypto",
        symbol: "ETH",
        providerSymbol: "ETHUSDT",
        providerName: "binance_global",
        exchange: null,
        resolutionStatus: "resolved",
      })
    ).toBe("BINANCE:ETHUSDT")
  })

  it("maps Binance US crypto to BINANCEUS prefix", () => {
    expect(
      toTradingViewSymbol({
        assetType: "crypto",
        symbol: "BTC",
        providerSymbol: "BTCUSDT",
        providerName: "binance_us",
        exchange: null,
        resolutionStatus: "resolved",
      })
    ).toBe("BINANCEUS:BTCUSDT")
  })

  it("defaults crypto to BINANCE when providerName is null but providerSymbol exists", () => {
    expect(
      toTradingViewSymbol({
        assetType: "crypto",
        symbol: "SOL",
        providerSymbol: "SOLUSDT",
        providerName: null,
        exchange: null,
        resolutionStatus: "pending",
      })
    ).toBe("BINANCE:SOLUSDT")
  })

  it("maps NYSE stocks", () => {
    expect(
      toTradingViewSymbol({
        assetType: "stock",
        symbol: "MSTR",
        providerSymbol: "MSTR",
        providerName: "twelve_data",
        exchange: "NYSE",
        resolutionStatus: "resolved",
      })
    ).toBe("NYSE:MSTR")
  })

  it("maps NASDAQ stocks", () => {
    expect(
      toTradingViewSymbol({
        assetType: "stock",
        symbol: "NVDA",
        providerSymbol: "NVDA",
        providerName: "twelve_data",
        exchange: "NASDAQ",
        resolutionStatus: "resolved",
      })
    ).toBe("NASDAQ:NVDA")
  })

  it("maps BATS stocks", () => {
    expect(
      toTradingViewSymbol({
        assetType: "stock",
        symbol: "TSLA",
        providerSymbol: "TSLA",
        providerName: "twelve_data",
        exchange: "BATS",
        resolutionStatus: "resolved",
      })
    ).toBe("BATS:TSLA")
  })

  it("maps CRCL when NYSE exchange is present", () => {
    expect(
      toTradingViewSymbol({
        assetType: "stock",
        symbol: "CRCL",
        providerSymbol: "CRCL",
        providerName: "twelve_data",
        exchange: "NYSE",
        resolutionStatus: "resolved",
      })
    ).toBe("NYSE:CRCL")
  })

  it("returns null for unsupported assets", () => {
    expect(
      toTradingViewSymbol({
        assetType: "crypto",
        symbol: "HYPE",
        providerSymbol: null,
        providerName: null,
        exchange: null,
        resolutionStatus: "unsupported",
      })
    ).toBeNull()
  })

  it("returns null for crypto without providerSymbol", () => {
    expect(
      toTradingViewSymbol({
        assetType: "crypto",
        symbol: "XYZ",
        providerSymbol: null,
        providerName: null,
        exchange: null,
        resolutionStatus: "pending",
      })
    ).toBeNull()
  })

  it("returns null for stocks without exchange", () => {
    expect(
      toTradingViewSymbol({
        assetType: "stock",
        symbol: "AAPL",
        providerSymbol: "AAPL",
        providerName: "twelve_data",
        exchange: null,
        resolutionStatus: "resolved",
      })
    ).toBeNull()
  })
})
