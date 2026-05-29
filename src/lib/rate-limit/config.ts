export type RateLimitRouteSlug =
  | "telegram-test"
  | "telegram-connect"
  | "alerts-create"
  | "alerts-mutate"
  | "alerts-export"
  | "watchlist-add"

export type RateLimitConfig = {
  limit: number
  windowSeconds: number
}

export const RATE_LIMITS: Record<RateLimitRouteSlug, RateLimitConfig> = {
  "telegram-test": { limit: 3, windowSeconds: 600 },
  "telegram-connect": { limit: 10, windowSeconds: 3600 },
  "alerts-create": { limit: 30, windowSeconds: 3600 },
  "alerts-mutate": { limit: 60, windowSeconds: 3600 },
  "alerts-export": { limit: 30, windowSeconds: 3600 },
  "watchlist-add": { limit: 30, windowSeconds: 3600 },
}
