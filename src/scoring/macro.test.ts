import { describe, expect, it } from "vitest"
import { scoreFearGreed, scoreWeeklyRsi } from "@/scoring/thresholds"

const CRYPTO_FEAR_GREED_WEIGHT = 0.6
const CRYPTO_BTC_RSI_WEIGHT = 0.4

describe("crypto macro weighted formula", () => {
  it("combines fear greed and BTC RSI component scores", () => {
    const fearGreedScore = scoreFearGreed(22)
    const btcRsiScore = scoreWeeklyRsi(38)
    const weighted =
      fearGreedScore * CRYPTO_FEAR_GREED_WEIGHT + btcRsiScore * CRYPTO_BTC_RSI_WEIGHT

    expect(fearGreedScore).toBe(2)
    expect(btcRsiScore).toBe(1)
    expect(weighted).toBeCloseTo(1.6, 2)
  })
})
