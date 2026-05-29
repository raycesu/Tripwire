import type { AlertRunSummary, JobRunSummary } from "@/jobs/types"

export type FinishedJobStatus = "success" | "partial_failure"

export const deriveJobStatus = (
  summary?: JobRunSummary,
  alertSummary?: AlertRunSummary
): FinishedJobStatus => {
  const jobFailed = summary ? summary.failed > 0 : false
  const alertFailed = alertSummary ? alertSummary.failed > 0 : false

  if (jobFailed || alertFailed) {
    return "partial_failure"
  }

  return "success"
}
