import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("@/providers/binance-us", () => ({
  hasActiveUsdtPair: vi.fn(),
}))

vi.mock("@/providers/kraken", () => ({
  resolveUsdtPair: vi.fn(),
}))

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

    const result = await resolveCryptoSymbol("btc")

    expect(result).toEqual({
      ok: true,
      providerName: "binance_us",
      providerSymbol: "BTCUSDT",
      quoteAsset: "USDT",
    })
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
  })

  it("marks unsupported when neither exchange lists the pair", async () => {
    vi.mocked(binanceUs.hasActiveUsdtPair).mockResolvedValue(false)
    vi.mocked(kraken.resolveUsdtPair).mockResolvedValue(null)

    const result = await resolveCryptoSymbol("missing")

    expect(result.ok).toBe(false)

    if (!result.ok) {
      expect(result.unsupportedReason).toContain("Binance US or Kraken")
    }
  })
})
