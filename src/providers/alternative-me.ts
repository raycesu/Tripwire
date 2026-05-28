import { z } from "zod"
import { fetchJson } from "@/providers/http"
import { getOrFetch } from "@/providers/provider-cache"
import type { ProviderName } from "@/providers/types"
import { ProviderError } from "@/providers/types"

const PROVIDER: ProviderName = "alternative_me"
const CACHE_KEY = "alternative_me:fear_greed:latest"
const TTL_SECONDS = 3_600
const API_URL = "https://api.alternative.me/fng/?limit=1"

const fearGreedSchema = z.object({
  data: z
    .array(
      z.object({
        value: z.string(),
        value_classification: z.string(),
      })
    )
    .min(1),
})

export type FearGreedSuccess = {
  ok: true
  value: number
  classification: string
}

export type FearGreedFailure = {
  ok: false
  nullReason: "provider_error"
  message: string
}

export type FearGreedResult = FearGreedSuccess | FearGreedFailure

const fetchFearGreed = async (): Promise<{ value: number; classification: string }> => {
  const data = await fetchJson(API_URL, fearGreedSchema, PROVIDER)
  const entry = data.data[0]
  const value = Number(entry.value)

  if (!Number.isFinite(value)) {
    throw new ProviderError(PROVIDER, "Invalid Fear & Greed index value")
  }

  return { value, classification: entry.value_classification }
}

export const getFearGreedIndex = async (): Promise<FearGreedResult> => {
  try {
    const cached = await getOrFetch(CACHE_KEY, PROVIDER, TTL_SECONDS, fetchFearGreed)

    return {
      ok: true,
      value: cached.value,
      classification: cached.classification,
    }
  } catch (error) {
    const message =
      error instanceof ProviderError ? error.message : "Failed to fetch Fear & Greed index"

    return { ok: false, nullReason: "provider_error", message }
  }
}
