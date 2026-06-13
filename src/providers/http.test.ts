import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { z } from "zod"
import { fetchJson } from "@/providers/http"
import { ProviderError } from "@/providers/types"

const schema = z.object({ ok: z.literal(true) })

describe("fetchJson retries", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("retries on 503 then succeeds", async () => {
    const fetchMock = vi.mocked(fetch)

    fetchMock
      .mockResolvedValueOnce(new Response("error", { status: 503 }))
      .mockResolvedValueOnce(new Response("error", { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }))

    const result = await fetchJson("https://example.com/data", schema, "binance_global", {
      maxRetries: 3,
    })

    expect(result).toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it("does not retry on 400", async () => {
    const fetchMock = vi.mocked(fetch)

    fetchMock.mockResolvedValueOnce(new Response("bad request", { status: 400 }))

    await expect(
      fetchJson("https://example.com/data", schema, "binance_global", { maxRetries: 3 })
    ).rejects.toBeInstanceOf(ProviderError)

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("captures Retry-After on 429", async () => {
    const fetchMock = vi.mocked(fetch)

    fetchMock.mockResolvedValueOnce(
      new Response("rate limited", {
        status: 429,
        headers: { "Retry-After": "5" },
      })
    )

    await expect(
      fetchJson("https://example.com/data", schema, "binance_global", { maxRetries: 1 })
    ).rejects.toMatchObject({
      status: 429,
      retryAfterMs: 5_000,
    })
  })
})
