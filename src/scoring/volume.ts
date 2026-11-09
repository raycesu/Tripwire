import type { AssetDto } from "@/lib/assets/types"
import { fetchWeeklyOhlcvFromDto } from "@/providers/market-data"
import type { SourceMetadata, WeeklyOhlcvResult } from "@/providers/types"
import {
  EARLY_HISTORY_MIN_CANDLES,
  normalizeWeeklyOhlcvCandles,
} from "@/scoring/candles"
import type { SectorScoreResult } from "@/scoring/types"
import { computeVolumeFromCandles } from "@/scoring/volume-formula"

export {
  computeDecelFactor,
  computePContext,
  computeRsiGate,
  computeVTrend,
  computeVolumeFromCandles,
} from "@/scoring/volume-formula"

export const computeVolume = async (
  asset: AssetDto,
  weeklyOhlcv?: WeeklyOhlcvResult
): Promise<SectorScoreResult> => {
  if (asset.resolutionStatus === "unsupported") {
    return {
      score: null,
      isNull: true,
      nullReason: "unsupported_asset",
      components: { symbol: asset.symbol },
    }
  }

  const ohlcv = weeklyOhlcv ?? (await fetchWeeklyOhlcvFromDto(asset, EARLY_HISTORY_MIN_CANDLES))

  if (!ohlcv.ok) {
    return {
      score: null,
      isNull: true,
      nullReason: ohlcv.nullReason,
      components: { error: ohlcv.message },
    }
  }

  const normalized = normalizeWeeklyOhlcvCandles(ohlcv.candles, {
    excludeInProgress: true,
    minCount: EARLY_HISTORY_MIN_CANDLES,
  })

  if (!normalized.ok) {
    return {
      score: null,
      isNull: true,
      nullReason: normalized.nullReason,
      components: { error: normalized.message },
    }
  }

  const result = computeVolumeFromCandles(normalized.candles)
  const sourceMetadata: SourceMetadata = ohlcv.sourceMetadata

  return {
    ...result,
    sourceMetadata,
  }
}
