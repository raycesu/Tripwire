import { z } from "zod"
import type { ProviderName } from "@/providers/types"
import { ProviderError } from "@/providers/types"

type FetchJsonOptions = {
  timeoutMs?: number
  headers?: Record<string, string>
  maxRetries?: number
}

const DEFAULT_TIMEOUT_MS = Number(process.env.PROVIDER_FETCH_TIMEOUT_MS) || 15_000
const DEFAULT_MAX_RETRIES = Number(process.env.PROVIDER_FETCH_MAX_RETRIES) || 3

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const isRetryableStatus = (status: number | undefined): boolean => {
  if (status === undefined) {
    return true
  }

  if (status === 429) {
    return true
  }

  return status >= 500
}

const backoffMs = (attempt: number): number => {
  const base = 300 * 2 ** attempt
  const jitter = Math.floor(Math.random() * 100)
  return base + jitter
}

const fetchJsonOnce = async <T>(
  url: string,
  schema: z.ZodType<T>,
  provider: ProviderName,
  timeoutMs: number,
  headers: Record<string, string>
): Promise<T> => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        ...headers,
      },
      signal: controller.signal,
      cache: "no-store",
    })

    if (!response.ok) {
      throw new ProviderError(
        provider,
        `HTTP ${response.status} for ${url}`,
        response.status
      )
    }

    const json: unknown = await response.json()
    const parsed = schema.safeParse(json)

    if (!parsed.success) {
      throw new ProviderError(provider, `Invalid response shape from ${url}`)
    }

    return parsed.data
  } catch (error) {
    if (error instanceof ProviderError) {
      throw error
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new ProviderError(provider, `Request timed out for ${url}`)
    }

    throw new ProviderError(
      provider,
      error instanceof Error ? error.message : "Unknown fetch error"
    )
  } finally {
    clearTimeout(timeout)
  }
}

export const fetchJson = async <T>(
  url: string,
  schema: z.ZodType<T>,
  provider: ProviderName,
  options: FetchJsonOptions = {}
): Promise<T> => {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES
  const headers = options.headers ?? {}

  let lastError: ProviderError | null = null

  for (let attempt = 0; attempt < maxRetries; attempt += 1) {
    try {
      return await fetchJsonOnce(url, schema, provider, timeoutMs, headers)
    } catch (error) {
      if (!(error instanceof ProviderError)) {
        throw error
      }

      lastError = error

      const canRetry = attempt < maxRetries - 1 && isRetryableStatus(error.status)

      if (!canRetry) {
        throw error
      }

      await sleep(backoffMs(attempt))
    }
  }

  throw lastError ?? new ProviderError(provider, "Provider fetch failed")
}
