import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  acquireTwelveDataToken,
  resetTwelveDataRateLimit,
} from "@/providers/twelve-data-rate-limit"

describe("twelve data rate limit", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    resetTwelveDataRateLimit()
    process.env.TWELVE_DATA_MAX_CALLS_PER_MINUTE = "7"
  })

  afterEach(() => {
    vi.useRealTimers()
    resetTwelveDataRateLimit()
    delete process.env.TWELVE_DATA_MAX_CALLS_PER_MINUTE
  })

  it("waits until the next window when the bucket is exhausted", async () => {
    for (let index = 0; index < 7; index += 1) {
      await acquireTwelveDataToken()
    }

    let resolved = false
    const blocked = acquireTwelveDataToken().then(() => {
      resolved = true
    })

    await vi.advanceTimersByTimeAsync(59_999)
    expect(resolved).toBe(false)

    await vi.advanceTimersByTimeAsync(1)
    await blocked
    expect(resolved).toBe(true)
  })
})
