import { listDistinctWatchlistAssets } from "@/lib/watchlist/queries"
import {
  recomputeComposite,
  resolveValidForDate,
  upsertScoreSnapshot,
} from "@/lib/scores/snapshots"
import { evaluateAlerts } from "@/jobs/evaluate-alerts"
import { ScoringContext } from "@/jobs/scoring-context"
import { createJobSummary, type JobRunSummary } from "@/jobs/types"
import { computeRelativity, resolveBenchmarkSymbol } from "@/scoring/relativity"
import { computeVolume } from "@/scoring/volume"
import { getUtcMidnight } from "@/scoring/staleness"

export type WeeklyScoresResult = {
  summary: JobRunSummary
  freshSnapshotIds: string[]
}

export const runWeeklyScores = async (): Promise<WeeklyScoresResult> => {
  const summary = createJobSummary()
  const freshSnapshotIds: string[] = []
  const assets = await listDistinctWatchlistAssets()
  const context = new ScoringContext()
  const fallbackValidForDate = getUtcMidnight()

  for (const asset of assets) {
    summary.attempted += 1
    let assetSucceeded = true

    try {
      const benchmarkSymbol = resolveBenchmarkSymbol(asset)
      const assetType = asset.assetType === "stock" ? "stock" : "crypto"
      const benchmarkRsi = await context.getBenchmarkRsi(benchmarkSymbol, assetType)

      const relativityResult = await computeRelativity({ asset, benchmarkRsi })
      const relativityValidForDate = resolveValidForDate(
        "relativity",
        "weekly",
        relativityResult,
        fallbackValidForDate
      )

      const relativitySnapshot = await upsertScoreSnapshot({
        assetId: asset.id,
        sector: "relativity",
        cadence: "weekly",
        validForDate: relativityValidForDate,
        result: relativityResult,
        sourceMetadata: relativityResult.sourceMetadata,
      })
      freshSnapshotIds.push(relativitySnapshot.id)
    } catch (error) {
      assetSucceeded = false
      summary.failed += 1
      summary.errors.push({
        assetId: asset.id,
        symbol: asset.symbol,
        sector: "relativity",
        message: error instanceof Error ? error.message : "Unknown error",
      })
    }

    try {
      const volumeResult = await computeVolume(asset)
      const volumeValidForDate = resolveValidForDate(
        "volume",
        "weekly",
        volumeResult,
        fallbackValidForDate
      )

      const volumeSnapshot = await upsertScoreSnapshot({
        assetId: asset.id,
        sector: "volume",
        cadence: "weekly",
        validForDate: volumeValidForDate,
        result: volumeResult,
        sourceMetadata: volumeResult.sourceMetadata,
      })
      freshSnapshotIds.push(volumeSnapshot.id)
    } catch (error) {
      assetSucceeded = false
      summary.failed += 1
      summary.errors.push({
        assetId: asset.id,
        symbol: asset.symbol,
        sector: "volume",
        message: error instanceof Error ? error.message : "Unknown error",
      })
    }

    try {
      const compositeSnapshot = await recomputeComposite(asset.id, fallbackValidForDate)
      freshSnapshotIds.push(compositeSnapshot.id)

      if (assetSucceeded) {
        summary.succeeded += 1
      }
    } catch (error) {
      summary.failed += 1
      summary.errors.push({
        assetId: asset.id,
        symbol: asset.symbol,
        sector: "composite",
        message: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  return { summary, freshSnapshotIds }
}

export const runWeeklyScoresWithAlerts = async () => {
  const { summary, freshSnapshotIds } = await runWeeklyScores()
  const alertSummary = await evaluateAlerts({ freshSnapshotIds })

  return { summary, alertSummary }
}
