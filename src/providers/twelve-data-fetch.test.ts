import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { z } from "zod"
import { fetchTwelveDataJson } from "@/providers/twelve-data-fetch"
import { resetTwelveDataRateLimit } from "@/providers/twelve-data-rate-limit"

const schema = z.object({ ok: z.literal(true) })

describe("fetchTwelveDataJson", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    resetTwelveDataRateLimit()
    vi.stubGlobal("fetch", vi.fn())
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    resetTwelveDataRateLimit()
  })

  it("waits for Retry-After before retrying a 429", async () => {
    const fetchMock = vi.mocked(fetch)

    fetchMock
      .mockResolvedValueOnce(
        new Response("rate limited", {
          status: 429,
          headers: { "Retry-After": "2" },
        })
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }))

    const resultPromise = fetchTwelveDataJson("https://example.com/data", schema)

    await vi.advanceTimersByTimeAsync(2_000)

    const result = await resultPromise

    expect(result).toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
