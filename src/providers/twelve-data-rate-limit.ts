const WINDOW_MS = 60_000

type TokenBucketState = {
  tokens: number
  windowStartedAt: number
}

let bucketState: TokenBucketState | null = null

const getMaxTokens = (): number => {
  const parsed = Number(process.env.TWELVE_DATA_MAX_CALLS_PER_MINUTE ?? 7)

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 7
  }

  return parsed
}

const getBucketState = (): TokenBucketState => {
  if (!bucketState) {
    bucketState = {
      tokens: getMaxTokens(),
      windowStartedAt: Date.now(),
    }
  }

  return bucketState
}

const refillBucketIfNeeded = (state: TokenBucketState, now: number): void => {
  if (now - state.windowStartedAt >= WINDOW_MS) {
    state.tokens = getMaxTokens()
    state.windowStartedAt = now
  }
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

export const resetTwelveDataRateLimit = (): void => {
  bucketState = null
}

export const acquireTwelveDataToken = async (): Promise<void> => {
  while (true) {
    const now = Date.now()
    const state = getBucketState()
    refillBucketIfNeeded(state, now)

    if (state.tokens > 0) {
      state.tokens -= 1
      return
    }

    const waitMs = Math.max(0, state.windowStartedAt + WINDOW_MS - now)
    await sleep(waitMs)
  }
}
