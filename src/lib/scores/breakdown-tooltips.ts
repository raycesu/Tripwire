export type BreakdownTooltipKey =
  | "vix"
  | "sp500_weekly_rsi"
  | "fear_greed"
  | "btc_weekly_rsi"
  | "asset_rsi"
  | "benchmark_rsi"
  | "relativity_index"
  | "v_trend"
  | "p_context"
  | "rsi_now"
  | "gate"
  | "decel_factor"
  | "raw"

export const BREAKDOWN_TOOLTIPS: Record<BreakdownTooltipKey, string> = {
  vix:
    "CBOE Volatility Index — measures implied volatility of S&P 500 options. Higher VIX reflects market fear; Tripwire maps elevated fear to higher opportunity sub-scores.",
  sp500_weekly_rsi:
    "14-period Wilder RSI on weekly S&P 500 closes. Lower RSI suggests the market is relatively oversold, which maps to higher opportunity sub-scores.",
  fear_greed:
    "Crypto Fear & Greed sentiment index (0–100). Lower readings reflect fear and map to higher opportunity sub-scores in the crypto macro blend.",
  btc_weekly_rsi:
    "14-period Wilder RSI on weekly BTC closes. Lower RSI maps to higher opportunity sub-scores in the crypto macro blend.",
  asset_rsi:
    "14-period Wilder RSI on weekly closes for this asset. Used as the asset side of the relativity comparison.",
  benchmark_rsi:
    "14-period Wilder RSI on weekly closes for the benchmark asset. Used as the reference side of the relativity comparison.",
  relativity_index:
    "Relativity index = benchmark_rsi − asset_rsi. Sector score = clamp((benchmark_rsi − asset_rsi) / 8, −2, +2). Higher values mean the asset is relatively weaker vs its benchmark.",
  v_trend:
    "Volume trend component: compares the average of the last 3 weekly volumes to the prior 3 weeks. Formula: clamp(slope × −3, −1, +1). Rising volume on weakness can boost opportunity.",
  p_context:
    "Price context: where the latest close sits within the 10-week high/low range. Formula: clamp(1 − rangePosition × 2, −1, +1). Lower in the range maps toward opportunity.",
  rsi_now:
    "Current weekly RSI(14) on the asset. Feeds the gate multiplier that scales the raw volume blend before the final clamp.",
  gate:
    "RSI-band multiplier (0.5–1.5) applied to the raw blend. Oversold RSI bands increase the gate; overheated bands reduce it.",
  decel_factor:
    "Momentum deceleration multiplier (0.5–1.5) from recent vs prior 2-week returns. Slowing downside momentum can increase the factor.",
  raw:
    "Raw blend = v_trend × 0.6 + p_context × 0.4. Final volume score = clamp(raw × gate × decel_factor × 2, −2, +2).",
}

export const getBenchmarkRsiTooltip = (benchmarkSymbol: string | undefined): string => {
  const symbol = benchmarkSymbol ?? "benchmark"
  return `Benchmark: ${symbol}`
}
