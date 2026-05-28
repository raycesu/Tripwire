export type JobRunSummary = {
  attempted: number
  succeeded: number
  failed: number
  errors: Array<{ assetId: string; symbol: string; sector: string; message: string }>
}

export const createJobSummary = (): JobRunSummary => ({
  attempted: 0,
  succeeded: 0,
  failed: 0,
  errors: [],
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
