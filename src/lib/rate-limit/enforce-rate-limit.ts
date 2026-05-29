import { NextResponse } from "next/server"
import { checkRateLimit, buildRateLimitKey } from "@/lib/rate-limit/check-rate-limit"
import type { RateLimitConfig, RateLimitRouteSlug } from "@/lib/rate-limit/config"
import { RATE_LIMITS } from "@/lib/rate-limit/config"

export const enforceRateLimit = async (
  userId: string,
  routeSlug: RateLimitRouteSlug,
  config: RateLimitConfig = RATE_LIMITS[routeSlug]
): Promise<NextResponse | null> => {
  const key = buildRateLimitKey(userId, routeSlug)
  const result = await checkRateLimit({ key, config })

  if (result.allowed) {
    return null
  }

  return NextResponse.json(
    {
      error: "Too many requests",
      retryAfterSeconds: result.retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSeconds),
      },
    }
  )
}
