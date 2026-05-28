import { listDistinctWatchlistAssets } from "@/lib/watchlist/queries"
import {
  recomputeComposite,
  resolveValidForDate,
  upsertScoreSnapshot,
} from "@/lib/scores/snapshots"
import { evaluateAlerts } from "@/jobs/evaluate-alerts"
import { ScoringContext } from "@/jobs/scoring-context"
import { createJobSummary, type JobRunSummary } from "@/jobs/types"
import { getUtcMidnight } from "@/scoring/staleness"

export type DailyScoresResult = {
  summary: JobRunSummary
  freshSnapshotIds: string[]
}

export const runDailyScores = async (): Promise<DailyScoresResult> => {
  const summary = createJobSummary()
  const freshSnapshotIds: string[] = []
  const assets = await listDistinctWatchlistAssets()
  const context = new ScoringContext()
  const validForDate = getUtcMidnight()

  await context.getCryptoMacro()
  await context.getStockMacro()

  for (const asset of assets) {
    summary.attempted += 1

    try {
      const macroResult = await context.getMacroForAsset(asset)

      const macroSnapshot = await upsertScoreSnapshot({
        assetId: asset.id,
        sector: "macro",
        cadence: "daily",
        validForDate: resolveValidForDate("macro", "daily", macroResult, validForDate),
        result: macroResult,
        sourceMetadata: macroResult.sourceMetadata,
      })
      freshSnapshotIds.push(macroSnapshot.id)

      const compositeSnapshot = await recomputeComposite(asset.id, validForDate)
      freshSnapshotIds.push(compositeSnapshot.id)
      summary.succeeded += 1
    } catch (error) {
      summary.failed += 1
      summary.errors.push({
        assetId: asset.id,
        symbol: asset.symbol,
        sector: "macro",
        message: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  return { summary, freshSnapshotIds }
}

export const runDailyScoresWithAlerts = async () => {
  const { summary, freshSnapshotIds } = await runDailyScores()
  const alertSummary = await evaluateAlerts({ freshSnapshotIds })

  return { summary, alertSummary }
}
