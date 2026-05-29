export const getWindowStartMs = (nowMs: number, windowSeconds: number): number => {
  const windowMs = windowSeconds * 1000
  return Math.floor(nowMs / windowMs) * windowMs
}

export const getRetryAfterSeconds = (
  windowStartMs: number,
  windowSeconds: number,
  nowMs: number
): number => {
  const windowEndMs = windowStartMs + windowSeconds * 1000
  return Math.max(1, Math.ceil((windowEndMs - nowMs) / 1000))
}
