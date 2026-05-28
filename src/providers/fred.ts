import { z } from "zod"
import { env } from "@/lib/env"
import { fetchJson } from "@/providers/http"
import { getOrFetch } from "@/providers/provider-cache"
import type {
  DailyPricePoint,
  FredObservationResult,
  FredSeriesResult,
  ProviderName,
} from "@/providers/types"
import { ProviderError } from "@/providers/types"

const PROVIDER: ProviderName = "fred"
const BASE_URL = "https://api.stlouisfed.org/fred/series/observations"
const VIX_CACHE_KEY = "fred:vixcls:latest"
const SP500_CACHE_KEY = "fred:sp500:daily"
const VIX_TTL_SECONDS = 3_600
const SP500_TTL_SECONDS = 21_600

const observationsSchema = z.object({
  observations: z.array(
    z.object({
      date: z.string(),
      value: z.string(),
    })
  ),
})

const parseObservationValue = (value: string): number | null => {
  if (value === ".") {
    return null
  }

  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    return null
  }

  return parsed
}

const fetchObservations = async (
  seriesId: string,
  limit: number,
  sortOrder: "asc" | "desc" = "desc"
): Promise<DailyPricePoint[]> => {
  const url = new URL(BASE_URL)
  url.searchParams.set("series_id", seriesId)
  url.searchParams.set("api_key", env.FRED_API_KEY)
  url.searchParams.set("file_type", "json")
  url.searchParams.set("sort_order", sortOrder)
  url.searchParams.set("limit", String(limit))

  const data = await fetchJson(url.toString(), observationsSchema, PROVIDER)

  const points: DailyPricePoint[] = []

  for (const observation of data.observations) {
    const close = parseObservationValue(observation.value)

    if (close === null) {
      continue
    }

    points.push({
      date: observation.date,
      close,
    })
  }

  return points
}

export const getLatestVix = async (): Promise<FredObservationResult> => {
  try {
    const cached = await getOrFetch<{ value: number; date: string }>(
      VIX_CACHE_KEY,
      PROVIDER,
      VIX_TTL_SECONDS,
      async () => {
        const points = await fetchObservations("VIXCLS", 5, "desc")

        if (points.length === 0) {
          throw new ProviderError(PROVIDER, "No VIX observations returned")
        }

        const latest = points[0]
        return { value: latest.close, date: latest.date }
      }
    )

    return { ok: true, value: cached.value, date: cached.date }
  } catch (error) {
    const message =
      error instanceof ProviderError ? error.message : "Failed to fetch VIX from FRED"

    return { ok: false, nullReason: "provider_error", message }
  }
}

export const getSp500DailyCloses = async (limit = 400): Promise<FredSeriesResult> => {
  try {
    const points = await getOrFetch<DailyPricePoint[]>(
      SP500_CACHE_KEY,
      PROVIDER,
      SP500_TTL_SECONDS,
      async () => fetchObservations("SP500", limit, "asc")
    )

    if (points.length < 28) {
      return {
        ok: false,
        nullReason: "insufficient_candles",
        message: `Need at least 28 S&P 500 daily points, got ${points.length}`,
      }
    }

    return { ok: true, points }
  } catch (error) {
    const message =
      error instanceof ProviderError ? error.message : "Failed to fetch SP500 from FRED"

    return { ok: false, nullReason: "provider_error", message }
  }
}
