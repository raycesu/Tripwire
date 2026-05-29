export type JobRunSummary = {
  attempted: number
  succeeded: number
  failed: number
  errors: Array<{ assetId: string; symbol: string; sector: string; message: string }>
  nullReasonCounts: Record<string, number>
}

export const createJobSummary = (): JobRunSummary => ({
  attempted: 0,
  succeeded: 0,
  failed: 0,
  errors: [],
  nullReasonCounts: {},
})

export type AlertRunSummary = {
  sent: number
  failed: number
  skippedDuplicate: number
  skippedRateLimited: number
  skippedCooldown: number
  skippedNoTelegram: number
  errors: Array<{ ruleId: string; assetSymbol: string; message: string }>
}

export const createAlertRunSummary = (): AlertRunSummary => ({
  sent: 0,
  failed: 0,
  skippedDuplicate: 0,
  skippedRateLimited: 0,
  skippedCooldown: 0,
  skippedNoTelegram: 0,
  errors: [],
})

export const mergeAlertRunSummaries = (
  ...summaries: AlertRunSummary[]
): AlertRunSummary => {
  const merged = createAlertRunSummary()

  for (const summary of summaries) {
    merged.sent += summary.sent
    merged.failed += summary.failed
    merged.skippedDuplicate += summary.skippedDuplicate
    merged.skippedRateLimited += summary.skippedRateLimited
    merged.skippedCooldown += summary.skippedCooldown
    merged.skippedNoTelegram += summary.skippedNoTelegram
    merged.errors.push(...summary.errors)
  }

  return merged
}
