import { getFearGreedIndex } from "@/providers/alternative-me"
import { getLatestVix, getSp500DailyCloses } from "@/providers/fred"
import { fetchWeeklyOhlcvForSymbol } from "@/providers/market-data"
import type { SourceMetadata } from "@/providers/types"
import {
  dailyPointsToWeeklyCandles,
  normalizeWeeklyOhlcvCandles,
  RSI_MIN_CANDLE_COUNT,
} from "@/scoring/candles"
import { latestRsi } from "@/scoring/indicators"
import {
  fearGreedLabel,
  formatScoreNumber,
  scoreFearGreed,
  scoreVix,
  scoreWeeklyRsi,
} from "@/scoring/thresholds"
import type { SectorScoreResult } from "@/scoring/types"

const CRYPTO_FEAR_GREED_WEIGHT = 0.6
const CRYPTO_BTC_RSI_WEIGHT = 0.4
const STOCK_VIX_WEIGHT = 0.6
const STOCK_SP500_RSI_WEIGHT = 0.4

const nullResult = (nullReason: string, components: Record<string, unknown> = {}): SectorScoreResult => ({
  score: null,
  isNull: true,
  nullReason,
  components,
})

export const computeCryptoMacro = async (): Promise<SectorScoreResult> => {
  const fearGreed = await getFearGreedIndex()

  if (!fearGreed.ok) {
    return nullResult(fearGreed.nullReason, { error: fearGreed.message })
  }

  const btcOhlcv = await fetchWeeklyOhlcvForSymbol("BTC", "crypto", RSI_MIN_CANDLE_COUNT)

  if (!btcOhlcv.ok) {
    return nullResult(btcOhlcv.nullReason, { error: btcOhlcv.message })
  }

  const normalized = normalizeWeeklyOhlcvCandles(btcOhlcv.candles, {
    excludeInProgress: true,
    minCount: RSI_MIN_CANDLE_COUNT,
  })

  if (!normalized.ok) {
    return nullResult(normalized.nullReason, { error: normalized.message })
  }

  const closes = normalized.candles.map((candle) => candle.close)
  const btcRsi = latestRsi(closes, 14)

  if (btcRsi === null) {
    return nullResult("insufficient_candles", { error: "Could not compute BTC weekly RSI" })
  }

  const fearGreedScore = scoreFearGreed(fearGreed.value)
  const btcRsiScore = scoreWeeklyRsi(btcRsi)
  const weightedScore =
    fearGreedScore * CRYPTO_FEAR_GREED_WEIGHT + btcRsiScore * CRYPTO_BTC_RSI_WEIGHT

  const sourceMetadata: SourceMetadata = btcOhlcv.sourceMetadata

  return {
    score: weightedScore,
    isNull: false,
    nullReason: null,
    sourceMetadata,
    components: {
      fear_greed: {
        value: fearGreed.value,
        label: fearGreedLabel(fearGreed.value),
        classification: fearGreed.classification,
        score: fearGreedScore,
        weight: CRYPTO_FEAR_GREED_WEIGHT,
      },
      btc_weekly_rsi: {
        value: btcRsi,
        score: btcRsiScore,
        weight: CRYPTO_BTC_RSI_WEIGHT,
      },
      formatted_score: formatScoreNumber(weightedScore),
    },
  }
}

export const computeStockMacro = async (): Promise<SectorScoreResult> => {
  const vix = await getLatestVix()

  if (!vix.ok) {
    return nullResult(vix.nullReason, { error: vix.message })
  }

  const sp500 = await getSp500DailyCloses()

  if (!sp500.ok) {
    return nullResult(sp500.nullReason, { error: sp500.message })
  }

  const weeklyCandles = dailyPointsToWeeklyCandles(sp500.points)
  const normalized = normalizeWeeklyOhlcvCandles(weeklyCandles, {
    excludeInProgress: true,
    minCount: RSI_MIN_CANDLE_COUNT,
  })

  if (!normalized.ok) {
    return nullResult(normalized.nullReason, { error: normalized.message })
  }

  const closes = normalized.candles.map((candle) => candle.close)
  const sp500Rsi = latestRsi(closes, 14)

  if (sp500Rsi === null) {
    return nullResult("insufficient_candles", { error: "Could not compute S&P 500 weekly RSI" })
  }

  const vixScore = scoreVix(vix.value)
  const sp500RsiScore = scoreWeeklyRsi(sp500Rsi)
  const weightedScore = vixScore * STOCK_VIX_WEIGHT + sp500RsiScore * STOCK_SP500_RSI_WEIGHT

  return {
    score: weightedScore,
    isNull: false,
    nullReason: null,
    components: {
      vix: {
        value: vix.value,
        date: vix.date,
        score: vixScore,
        weight: STOCK_VIX_WEIGHT,
      },
      sp500_weekly_rsi: {
        value: sp500Rsi,
        score: sp500RsiScore,
        weight: STOCK_SP500_RSI_WEIGHT,
      },
      formatted_score: formatScoreNumber(weightedScore),
    },
  }
}
