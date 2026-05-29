import { describe, expect, it } from "vitest"
import { getRetryAfterSeconds, getWindowStartMs } from "@/lib/rate-limit/window"

describe("rate limit window", () => {
  it("aligns window start to bucket boundary", () => {
    const nowMs = 1_700_000_123_456
    const windowSeconds = 600
    const windowStart = getWindowStartMs(nowMs, windowSeconds)

    expect(windowStart % (windowSeconds * 1000)).toBe(0)
    expect(windowStart).toBeLessThanOrEqual(nowMs)
  })

  it("computes retry-after until window end", () => {
    const windowSeconds = 600
    const windowStartMs = getWindowStartMs(1_700_000_100_000, windowSeconds)
    const retryAfter = getRetryAfterSeconds(windowStartMs, windowSeconds, 1_700_000_100_000)

    expect(retryAfter).toBeGreaterThan(0)
    expect(retryAfter).toBeLessThanOrEqual(windowSeconds)
  })
})
