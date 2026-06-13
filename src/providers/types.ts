export type ProviderName =
  | "binance_global"
  | "binance_us"
  | "kraken"
  | "twelve_data"
  | "fred"
  | "alternative_me"

export type NullReason =
  | "insufficient_candles"
  | "provider_error"
  | "unsupported_asset"
  | "invalid_provider"
  | "missing_provider_config"

export type WeeklyOhlcvCandle = {
  openTime: Date
  closeTime: Date
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export type SourceMetadata = {
  provider: ProviderName
  providerSymbol: string
  fetchedAt: string
  candleCount: number
  interval: "1w"
  exchange?: string
  micCode?: string
}

export type WeeklyOhlcvSuccess = {
  ok: true
  candles: WeeklyOhlcvCandle[]
  sourceMetadata: SourceMetadata
}

export type WeeklyOhlcvFailure = {
  ok: false
  nullReason: NullReason
  message: string
  provider?: ProviderName
}

export type WeeklyOhlcvResult = WeeklyOhlcvSuccess | WeeklyOhlcvFailure

export type CryptoResolutionSuccess = {
  ok: true
  providerName: "binance_us" | "kraken"
  providerSymbol: string
  quoteAsset: "USDT"
}

export type CryptoResolutionFailure = {
  ok: false
  unsupportedReason: string
}

export type CryptoResolutionResult = CryptoResolutionSuccess | CryptoResolutionFailure

export type DailyPricePoint = {
  date: string
  close: number
}

export type FredObservationSuccess = {
  ok: true
  value: number
  date: string
}

export type FredObservationFailure = {
  ok: false
  nullReason: NullReason
  message: string
}

export type FredObservationResult = FredObservationSuccess | FredObservationFailure

export type FredSeriesSuccess = {
  ok: true
  points: DailyPricePoint[]
}

export type FredSeriesFailure = {
  ok: false
  nullReason: NullReason
  message: string
}

export type FredSeriesResult = FredSeriesSuccess | FredSeriesFailure

export class ProviderError extends Error {
  readonly provider: ProviderName
  readonly status?: number
  readonly retryAfterMs?: number

  constructor(
    provider: ProviderName,
    message: string,
    status?: number,
    retryAfterMs?: number
  ) {
    super(message)
    this.name = "ProviderError"
    this.provider = provider
    this.status = status
    this.retryAfterMs = retryAfterMs
  }
}
