import { z } from "zod"
import { fetchJson } from "@/providers/http"
import { acquireTwelveDataToken } from "@/providers/twelve-data-rate-limit"
import type { ProviderName } from "@/providers/types"
import { ProviderError } from "@/providers/types"

const PROVIDER: ProviderName = "twelve_data"

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

const isServerRetryableStatus = (status: number | undefined): boolean => {
  if (status === undefined) {
    return true
  }

  return status >= 500
}

export const fetchTwelveDataJson = async <T>(
  url: string,
  schema: z.ZodType<T>
): Promise<T> => {
  await acquireTwelveDataToken()

  try {
    return await fetchJson(url, schema, PROVIDER, {
      isRetryableStatus: isServerRetryableStatus,
    })
  } catch (error) {
    if (!(error instanceof ProviderError) || error.status !== 429) {
      throw error
    }

    await sleep(error.retryAfterMs ?? 60_000)
    await acquireTwelveDataToken()

    return fetchJson(url, schema, PROVIDER, {
      maxRetries: 1,
      isRetryableStatus: isServerRetryableStatus,
    })
  }
}
