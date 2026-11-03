import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("@/providers/binance-global", () => ({
  hasActiveUsdtPair: vi.fn(),
}))

vi.mock("@/providers/binance-us", () => ({
  hasActiveUsdtPair: vi.fn(),
}))

vi.mock("@/providers/kraken", () => ({
  resolveUsdtPair: vi.fn(),
}))

import * as binanceGlobal from "@/providers/binance-global"
import * as binanceUs from "@/providers/binance-us"
import { resolveCryptoSymbol } from "@/providers/crypto-resolver"
import * as kraken from "@/providers/kraken"

describe("resolveCryptoSymbol", () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it("prefers Binance US when a USDT pair exists", async () => {
    vi.mocked(binanceUs.hasActiveUsdtPair).mockResolvedValue(true)
    vi.mocked(kraken.resolveUsdtPair).mockResolvedValue(null)
    vi.mocked(binanceGlobal.hasActiveUsdtPair).mockResolvedValue(true)

    const result = await resolveCryptoSymbol("btc")

    expect(result).toEqual({
      ok: true,
      providerName: "binance_us",
      providerSymbol: "BTCUSDT",
      quoteAsset: "USDT",
    })
    expect(binanceGlobal.hasActiveUsdtPair).not.toHaveBeenCalled()
  })

  it("falls back to Kraken when Binance US does not list the pair", async () => {
    vi.mocked(binanceUs.hasActiveUsdtPair).mockResolvedValue(false)
    vi.mocked(kraken.resolveUsdtPair).mockResolvedValue({
      baseSymbol: "ZEC",
      providerSymbol: "ZECUSDT",
      pairKey: "ZECUSDT",
    })

    const result = await resolveCryptoSymbol("zec")

    expect(result).toEqual({
      ok: true,
      providerName: "kraken",
      providerSymbol: "ZECUSDT",
      quoteAsset: "USDT",
    })
    expect(binanceGlobal.hasActiveUsdtPair).not.toHaveBeenCalled()
  })

  it("falls back to Binance when Binance US and Kraken do not list the pair", async () => {
    vi.mocked(binanceUs.hasActiveUsdtPair).mockResolvedValue(false)
    vi.mocked(kraken.resolveUsdtPair).mockResolvedValue(null)
    vi.mocked(binanceGlobal.hasActiveUsdtPair).mockResolvedValue(true)

    const result = await resolveCryptoSymbol("pump")

    expect(result).toEqual({
      ok: true,
      providerName: "binance_global",
      providerSymbol: "PUMPUSDT",
      quoteAsset: "USDT",
    })
  })

  it("marks unsupported when no venue lists the pair", async () => {
    vi.mocked(binanceUs.hasActiveUsdtPair).mockResolvedValue(false)
    vi.mocked(kraken.resolveUsdtPair).mockResolvedValue(null)
    vi.mocked(binanceGlobal.hasActiveUsdtPair).mockResolvedValue(false)

    const result = await resolveCryptoSymbol("missing")

    expect(result.ok).toBe(false)

    if (!result.ok) {
      expect(result.unsupportedReason).toContain("Binance spot")
    }
  })
})
