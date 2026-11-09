import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/providers/http", () => ({
  fetchJson: vi.fn(),
}))

vi.mock("@/providers/provider-cache", () => ({
  getOrFetch: vi.fn(async (_key: string, _provider: string, _ttl: number, fetcher: () => Promise<unknown>) =>
    fetcher()
  ),
}))

import { fetchJson } from "@/providers/http"
import {
  fetchWeeklyOhlcv,
  resetKrakenCache,
} from "@/providers/kraken"

const mockedFetchJson = vi.mocked(fetchJson)

const buildWeeklyRows = (count: number): (string | number)[][] => {
  const now = Date.now()
  const weekMs = 7 * 24 * 60 * 60 * 1000

  return Array.from({ length: count }, (_, index) => {
    const openTime = Math.floor((now - (count - index) * weekMs) / 1000)

    return [
      openTime,
      "100",
      "110",
      "90",
      "105",
      "100",
      "1000",
      10,
    ]
  })
}

describe("kraken weekly OHLCV", () => {
  beforeEach(() => {
    resetKrakenCache()
    mockedFetchJson.mockReset()
  })

  afterEach(() => {
    resetKrakenCache()
  })

  it("requests OHLC with a path-only /OHLC URL under the public base", async () => {
    mockedFetchJson.mockImplementation(async (url: string) => {
      if (url.endsWith("/Assets")) {
        return {
          error: [],
          result: {
            XXMR: {
              altname: "XMR",
              status: "enabled",
            },
          },
        }
      }

      if (url.endsWith("/AssetPairs")) {
        return {
          error: [],
          result: {
            XMRUSDT: {
              altname: "XMRUSDT",
              base: "XXMR",
              quote: "USDT",
              status: "online",
            },
          },
        }
      }

      if (url.includes("/0/public/OHLC?")) {
        expect(url).toBe(
          "https://api.kraken.com/0/public/OHLC?pair=XMRUSDT&interval=10080"
        )
        expect(url).not.toContain("/0/public/0/public/")

        return {
          error: [],
          result: {
            XMRUSDT: buildWeeklyRows(32),
            last: 1,
          },
        }
      }

      throw new Error(`Unexpected Kraken URL: ${url}`)
    })

    const result = await fetchWeeklyOhlcv("XMRUSDT", 30)

    expect(result.ok).toBe(true)

    if (result.ok) {
      expect(result.candles.length).toBeGreaterThanOrEqual(30)
      expect(result.sourceMetadata.provider).toBe("kraken")
      expect(result.sourceMetadata.providerSymbol).toBe("XMRUSDT")
    }

    const ohlcCalls = mockedFetchJson.mock.calls.filter(([url]) =>
      String(url).includes("/OHLC?")
    )

    expect(ohlcCalls).toHaveLength(1)
    expect(String(ohlcCalls[0]?.[0])).toBe(
      "https://api.kraken.com/0/public/OHLC?pair=XMRUSDT&interval=10080"
    )
  })
})
