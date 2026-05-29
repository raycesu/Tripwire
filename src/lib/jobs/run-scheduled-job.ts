import type { ScheduledJobName, ScheduledJobTriggeredBy } from "@/db/schema"
import type { AlertRunSummary, JobRunSummary } from "@/jobs/types"
import { deriveJobStatus } from "@/lib/jobs/derive-job-status"
import {
  finishScheduledJobRun,
  startScheduledJobRun,
} from "@/lib/jobs/scheduled-job-runs"
import { logError, logInfo } from "@/lib/logging/logger"
import { redactSecrets } from "@/lib/logging/redact-secrets"

export type ScheduledJobResult = {
  summary?: JobRunSummary
  alertSummary?: AlertRunSummary
}

export type ScheduledJobResponse = {
  ok: boolean
  jobName: ScheduledJobName
  status: "success" | "partial_failure" | "failed"
  attempted: number
  succeeded: number
  failed: number
  alertsSent: number
  summary?: JobRunSummary
  alertSummary?: AlertRunSummary
}

export const runScheduledJob = async (input: {
  jobName: ScheduledJobName
  triggeredBy: ScheduledJobTriggeredBy
  execute: () => Promise<ScheduledJobResult>
}): Promise<ScheduledJobResponse> => {
  const runId = await startScheduledJobRun({
    jobName: input.jobName,
    triggeredBy: input.triggeredBy,
  })

  const startedAt = Date.now()

  logInfo({
    event: "scheduled_job_started",
    jobName: input.jobName,
    triggeredBy: input.triggeredBy,
    runId,
  })

  try {
    const result = await input.execute()
    const status = deriveJobStatus(result.summary, result.alertSummary)

    logInfo({
      event: "scheduled_job_finished",
      jobName: input.jobName,
      runId,
      status,
      durationMs: Date.now() - startedAt,
      attempted: result.summary?.attempted ?? 0,
      succeeded: result.summary?.succeeded ?? 0,
      failed: result.summary?.failed ?? 0,
      alertsSent: result.alertSummary?.sent ?? 0,
    })

    await finishScheduledJobRun({
      id: runId,
      status,
      summary: result.summary,
      alertSummary: result.alertSummary,
    })

    return {
      ok: true,
      jobName: input.jobName,
      status,
      attempted: result.summary?.attempted ?? 0,
      succeeded: result.summary?.succeeded ?? 0,
      failed: result.summary?.failed ?? 0,
      alertsSent: result.alertSummary?.sent ?? 0,
      summary: result.summary,
      alertSummary: result.alertSummary,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    logError({
      event: "scheduled_job_failed",
      jobName: input.jobName,
      runId,
      durationMs: Date.now() - startedAt,
      error: redactSecrets(error),
    })

    await finishScheduledJobRun({
      id: runId,
      status: "failed",
      errorMessage,
    })

    throw error
  }
}
