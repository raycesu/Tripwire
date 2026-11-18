import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/env", () => ({
  env: {
    FRED_API_KEY: "test-fred-key",
  },
}))

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
  getSp500DailyCloses,
  parseFredDailyObservations,
} from "@/providers/fred"

const mockedFetchJson = vi.mocked(fetchJson)

const buildRecentNumericObservations = (count: number) => {
  const start = new Date("2024-01-02T00:00:00.000Z")

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(start)
    date.setUTCDate(start.getUTCDate() + index)

    return {
      date: date.toISOString().slice(0, 10),
      value: String(4000 + index),
    }
  })
}

describe("parseFredDailyObservations", () => {
  it("drops missing values and returns chronological closes", () => {
    const points = parseFredDailyObservations([
      { date: "2024-01-03", value: "4501" },
      { date: "2024-01-01", value: "." },
      { date: "2024-01-02", value: "4500" },
      { date: "2024-01-04", value: "not-a-number" },
    ])

    expect(points).toEqual([
      { date: "2024-01-02", close: 4500 },
      { date: "2024-01-03", close: 4501 },
    ])
  })

  it("yields zero points for oldest-window SP500 rows that are all missing", () => {
    const oldestWindow = Array.from({ length: 20 }, (_, index) => ({
      date: `1871-01-${String(index + 1).padStart(2, "0")}`,
      value: ".",
    }))

    expect(parseFredDailyObservations(oldestWindow)).toEqual([])
  })
})

describe("getSp500DailyCloses", () => {
  beforeEach(() => {
    mockedFetchJson.mockReset()
  })

  it("requests newest-first observations and returns chronological points", async () => {
    const recent = buildRecentNumericObservations(140).reverse()

    mockedFetchJson.mockResolvedValue({
      observations: recent,
    })

    const result = await getSp500DailyCloses(140)

    expect(result.ok).toBe(true)

    if (!result.ok) {
      return
    }

    expect(result.points).toHaveLength(140)
    expect(result.points[0]?.date).toBe("2024-01-02")
    expect(result.points[result.points.length - 1]?.date).toBe("2024-05-20")

    const calledUrl = mockedFetchJson.mock.calls[0]?.[0]
    expect(typeof calledUrl).toBe("string")

    const url = new URL(String(calledUrl))
    expect(url.searchParams.get("series_id")).toBe("SP500")
    expect(url.searchParams.get("sort_order")).toBe("desc")
    expect(url.searchParams.get("limit")).toBe("140")
    expect(url.searchParams.get("api_key")).toBe("test-fred-key")
  })

  it("returns insufficient_candles when newest window still lacks history", async () => {
    mockedFetchJson.mockResolvedValue({
      observations: buildRecentNumericObservations(20),
    })

    const result = await getSp500DailyCloses(20)

    expect(result).toEqual({
      ok: false,
      nullReason: "insufficient_candles",
      message: "Need at least 140 S&P 500 daily points, got 20",
    })
  })
})
