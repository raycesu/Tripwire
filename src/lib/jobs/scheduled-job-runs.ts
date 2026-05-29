import { eq } from "drizzle-orm"
import { db } from "@/db/client"
import { scheduledJobRuns } from "@/db/schema"
import type {
  ScheduledJobName,
  ScheduledJobStatus,
  ScheduledJobTriggeredBy,
} from "@/db/schema"
import type { AlertRunSummary, JobRunSummary } from "@/jobs/types"
import { buildProviderMetadata } from "@/lib/jobs/provider-failure-summary"

export { deriveJobStatus } from "@/lib/jobs/derive-job-status"

export type StartScheduledJobRunInput = {
  jobName: ScheduledJobName
  triggeredBy: ScheduledJobTriggeredBy
}

export type FinishScheduledJobRunInput = {
  id: string
  status: ScheduledJobStatus
  summary?: JobRunSummary
  alertSummary?: AlertRunSummary
  metadata?: Record<string, unknown>
  errorMessage?: string
}

export const startScheduledJobRun = async (
  input: StartScheduledJobRunInput
): Promise<string> => {
  const rows = await db
    .insert(scheduledJobRuns)
    .values({
      jobName: input.jobName,
      triggeredBy: input.triggeredBy,
      status: "running",
    })
    .returning({ id: scheduledJobRuns.id })

  const row = rows[0]

  if (!row) {
    throw new Error("Failed to start scheduled job run")
  }

  return row.id
}

export const finishScheduledJobRun = async (
  input: FinishScheduledJobRunInput
): Promise<void> => {
  const errorJson: Record<string, unknown> = {}

  if (input.summary?.errors.length) {
    errorJson.jobErrors = input.summary.errors
  }

  if (input.alertSummary?.errors.length) {
    errorJson.alertErrors = input.alertSummary.errors
  }

  if (input.errorMessage) {
    errorJson.message = input.errorMessage
  }

  const providerMetadata = buildProviderMetadata(input.summary)

  const metadataJson: Record<string, unknown> = {
    ...input.metadata,
    ...providerMetadata,
  }

  if (input.alertSummary) {
    metadataJson.alerts = {
      sent: input.alertSummary.sent,
      failed: input.alertSummary.failed,
      skippedDuplicate: input.alertSummary.skippedDuplicate,
      skippedRateLimited: input.alertSummary.skippedRateLimited,
      skippedCooldown: input.alertSummary.skippedCooldown,
      skippedNoTelegram: input.alertSummary.skippedNoTelegram,
    }
  }

  await db
    .update(scheduledJobRuns)
    .set({
      status: input.status,
      finishedAt: new Date(),
      assetsAttempted: input.summary?.attempted ?? null,
      assetsSucceeded: input.summary?.succeeded ?? null,
      assetsFailed: input.summary?.failed ?? null,
      errorJson: Object.keys(errorJson).length > 0 ? errorJson : null,
      metadataJson: Object.keys(metadataJson).length > 0 ? metadataJson : null,
    })
    .where(eq(scheduledJobRuns.id, input.id))
}
