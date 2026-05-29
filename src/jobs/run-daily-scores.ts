import { listDistinctWatchlistAssets } from "@/lib/watchlist/queries"
import {
  markStaleSnapshots,
  recomputeComposite,
  resolveValidForDate,
  upsertScoreSnapshot,
} from "@/lib/scores/snapshots"
import { evaluateAlerts } from "@/jobs/evaluate-alerts"
import { ScoringContext } from "@/jobs/scoring-context"
import { createJobSummary, type JobRunSummary } from "@/jobs/types"
import { logWarn } from "@/lib/logging/logger"
import { redactString } from "@/lib/logging/redact-secrets"
import { recordNullReason } from "@/lib/jobs/provider-failure-summary"
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

  try {
    await context.getCryptoMacro()
    await context.getStockMacro()
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown macro prefetch error"
    logWarn({
      event: "macro_prefetch_failed",
      jobName: "score-daily",
      message: redactString(message),
    })
    summary.errors.push({
      assetId: "global",
      symbol: "MACRO",
      sector: "macro",
      message: redactString(message),
    })
  }

  for (const asset of assets) {
    summary.attempted += 1

    try {
      const macroResult = await context.getMacroForAsset(asset)
      recordNullReason(summary, macroResult)

      const macroSnapshot = await upsertScoreSnapshot({
        assetId: asset.id,
        sector: "macro",
        cadence: "daily",
        validForDate: resolveValidForDate("macro", "daily", macroResult, validForDate),
        result: macroResult,
        sourceMetadata: macroResult.sourceMetadata,
      })
      freshSnapshotIds.push(macroSnapshot.id)

      await markStaleSnapshots(asset.id)

      const compositeSnapshot = await recomputeComposite(asset.id, validForDate)
      freshSnapshotIds.push(compositeSnapshot.id)
      summary.succeeded += 1
    } catch (error) {
      summary.failed += 1
      const message = error instanceof Error ? error.message : "Unknown error"
      logWarn({
        event: "asset_score_failed",
        jobName: "score-daily",
        assetSymbol: asset.symbol,
        sector: "macro",
        message: redactString(message),
      })
      summary.errors.push({
        assetId: asset.id,
        symbol: asset.symbol,
        sector: "macro",
        message: redactString(message),
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
