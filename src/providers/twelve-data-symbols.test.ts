import { describe, expect, it } from "vitest"
import {
  mergeStockCatalogEntries,
  type MergeableStockCatalogEntry,
} from "@/lib/assets/merge-stock-catalog"
import { STOCK_EXCHANGE_ALLOWLIST } from "@/lib/assets/stock-exchange-allowlist"

const buildEntry = (
  symbol: string,
  exchange: string,
  micCode: string
): MergeableStockCatalogEntry => ({
  symbol,
  name: symbol,
  assetType: "stock",
  source: "twelve_data",
  providerSymbol: symbol,
  exchange,
  micCode,
})

describe("STOCK_EXCHANGE_ALLOWLIST", () => {
  it("includes only NYSE, NASDAQ, and BATS", () => {
    expect(STOCK_EXCHANGE_ALLOWLIST.map((entry) => entry.label)).toEqual([
      "NYSE",
      "NASDAQ",
      "BATS",
    ])
  })
})

describe("mergeStockCatalogEntries", () => {
  it("prefers NYSE when the same symbol appears on NYSE and NASDAQ", () => {
    const nyseEntries = [buildEntry("DUAL", "NYSE", "XNYS")]
    const nasdaqEntries = [buildEntry("DUAL", "NASDAQ", "XNAS")]

    const merged = mergeStockCatalogEntries([nyseEntries, nasdaqEntries])

    expect(merged).toHaveLength(1)
    expect(merged[0]).toEqual(buildEntry("DUAL", "NYSE", "XNYS"))
  })

  it("keeps distinct symbols from each exchange", () => {
    const nyseEntries = [buildEntry("JPM", "NYSE", "XNYS")]
    const nasdaqEntries = [buildEntry("NVDA", "NASDAQ", "XNAS")]
    const batsEntries = [buildEntry("BATSY", "BATS", "BATS")]

    const merged = mergeStockCatalogEntries([nyseEntries, nasdaqEntries, batsEntries])

    expect(merged.map((entry) => entry.symbol)).toEqual(["BATSY", "JPM", "NVDA"])
  })

  it("applies priority order NYSE then NASDAQ then BATS", () => {
    const nyseEntries = [buildEntry("SHARED", "NYSE", "XNYS")]
    const nasdaqEntries = [buildEntry("SHARED", "NASDAQ", "XNAS")]
    const batsEntries = [buildEntry("SHARED", "BATS", "BATS")]

    const merged = mergeStockCatalogEntries([nyseEntries, nasdaqEntries, batsEntries])

    expect(merged[0]?.exchange).toBe("NYSE")
    expect(merged[0]?.micCode).toBe("XNYS")
  })
})
