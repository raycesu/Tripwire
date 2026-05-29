import { eq } from "drizzle-orm"
import { db } from "@/db/client"
import { apiRateLimits } from "@/db/schema"
import type { RateLimitConfig } from "@/lib/rate-limit/config"
import { getRetryAfterSeconds, getWindowStartMs } from "@/lib/rate-limit/window"

export type RateLimitResult = {
  allowed: boolean
  retryAfterSeconds: number
}

export const buildRateLimitKey = (userId: string, routeSlug: string): string =>
  `${userId}:${routeSlug}`

export const checkRateLimit = async (input: {
  key: string
  config: RateLimitConfig
  now?: Date
}): Promise<RateLimitResult> => {
  const now = input.now ?? new Date()
  const nowMs = now.getTime()
  const windowStartMs = getWindowStartMs(nowMs, input.config.windowSeconds)
  const windowStart = new Date(windowStartMs)
  const retryAfterSeconds = getRetryAfterSeconds(
    windowStartMs,
    input.config.windowSeconds,
    nowMs
  )

  const existing = await db.query.apiRateLimits.findFirst({
    where: eq(apiRateLimits.key, input.key),
  })

  if (!existing) {
    await db.insert(apiRateLimits).values({
      key: input.key,
      windowStart,
      count: 1,
    })

    return { allowed: true, retryAfterSeconds: 0 }
  }

  const existingWindowMs = existing.windowStart.getTime()

  if (existingWindowMs !== windowStartMs) {
    await db
      .update(apiRateLimits)
      .set({
        windowStart,
        count: 1,
      })
      .where(eq(apiRateLimits.key, input.key))

    return { allowed: true, retryAfterSeconds: 0 }
  }

  if (existing.count >= input.config.limit) {
    return { allowed: false, retryAfterSeconds }
  }

  await db
    .update(apiRateLimits)
    .set({ count: existing.count + 1 })
    .where(eq(apiRateLimits.key, input.key))

  return { allowed: true, retryAfterSeconds: 0 }
}
