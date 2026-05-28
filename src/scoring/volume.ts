import type { AssetDto } from "@/lib/assets/types"
import { fetchWeeklyOhlcvFromDto } from "@/providers/market-data"
import type { SourceMetadata } from "@/providers/types"
import {
  normalizeWeeklyOhlcvCandles,
  VOLUME_CANDLE_COUNT,
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

export const computeVolume = async (asset: AssetDto): Promise<SectorScoreResult> => {
  if (asset.resolutionStatus === "unsupported") {
    return {
      score: null,
      isNull: true,
      nullReason: "unsupported_asset",
      components: { symbol: asset.symbol },
    }
  }

  const ohlcv = await fetchWeeklyOhlcvFromDto(asset, VOLUME_CANDLE_COUNT)

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
    minCount: VOLUME_CANDLE_COUNT,
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
