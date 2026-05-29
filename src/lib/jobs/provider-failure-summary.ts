import type { JobRunSummary } from "@/jobs/types"
import type { SectorScoreResult } from "@/scoring/types"

export const recordNullReason = (summary: JobRunSummary, result: SectorScoreResult) => {
  if (!result.isNull || !result.nullReason) {
    return
  }

  const current = summary.nullReasonCounts[result.nullReason] ?? 0
  summary.nullReasonCounts[result.nullReason] = current + 1
}

export const buildProviderMetadata = (
  summary?: JobRunSummary
): Record<string, unknown> | undefined => {
  if (!summary) {
    return undefined
  }

  const nullReasonCounts = summary.nullReasonCounts
  const hasNullReasons = Object.keys(nullReasonCounts).length > 0
  const hasErrors = summary.errors.length > 0

  if (!hasNullReasons && !hasErrors) {
    return undefined
  }

  const failuresBySector: Record<string, number> = {}

  for (const error of summary.errors) {
    failuresBySector[error.sector] = (failuresBySector[error.sector] ?? 0) + 1
  }

  return {
    providers: {
      nullReasonCounts,
      failuresBySector,
      assetsFailed: summary.failed,
    },
  }
}
