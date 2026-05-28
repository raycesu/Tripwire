import { and, eq, gt } from "drizzle-orm"
import { db } from "@/db/client"
import { providerCache } from "@/db/schema"
import type { ProviderName } from "@/providers/types"

export const getCached = async <T>(cacheKey: string): Promise<T | null> => {
  const now = new Date()
  const rows = await db
    .select()
    .from(providerCache)
    .where(and(eq(providerCache.cacheKey, cacheKey), gt(providerCache.expiresAt, now)))
    .limit(1)

  const row = rows[0]

  if (!row) {
    return null
  }

  return row.payloadJson as T
}

export const setCached = async (
  cacheKey: string,
  provider: ProviderName,
  payload: unknown,
  ttlSeconds: number
): Promise<void> => {
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000)
  const now = new Date()

  await db
    .insert(providerCache)
    .values({
      cacheKey,
      provider,
      payloadJson: payload,
      expiresAt,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: providerCache.cacheKey,
      set: {
        provider,
        payloadJson: payload,
        expiresAt,
        updatedAt: now,
      },
    })
}

export const getOrFetch = async <T>(
  cacheKey: string,
  provider: ProviderName,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> => {
  const cached = await getCached<T>(cacheKey)

  if (cached !== null) {
    return cached
  }

  const fresh = await fetcher()
  await setCached(cacheKey, provider, fresh, ttlSeconds)
  return fresh
}
