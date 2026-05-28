import { z } from "zod"
import type { ProviderName } from "@/providers/types"
import { ProviderError } from "@/providers/types"

type FetchJsonOptions = {
  timeoutMs?: number
  headers?: Record<string, string>
}

export const fetchJson = async <T>(
  url: string,
  schema: z.ZodType<T>,
  provider: ProviderName,
  options: FetchJsonOptions = {}
): Promise<T> => {
  const { timeoutMs = 15_000, headers = {} } = options
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
