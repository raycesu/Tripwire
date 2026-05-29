import { describe, expect, it } from "vitest"
import { resolveBenchmarkSymbol } from "@/lib/assets/benchmark"

describe("resolveBenchmarkSymbol", () => {
  it("uses SPY for stocks", () => {
    expect(resolveBenchmarkSymbol("TSLA", "stock")).toBe("SPY")
  })

  it("uses SPY for BTC and BTC for other crypto", () => {
    expect(resolveBenchmarkSymbol("BTC", "crypto")).toBe("SPY")
    expect(resolveBenchmarkSymbol("ETH", "crypto")).toBe("BTC")
    expect(resolveBenchmarkSymbol("SOL", "crypto")).toBe("BTC")
  })
})
