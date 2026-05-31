import { NextResponse } from "next/server"
import { verifyCronSecret } from "@/lib/cron/verify-cron-secret"
import {
  finishScheduledJobRun,
  startScheduledJobRun,
} from "@/lib/jobs/scheduled-job-runs"
import { syncAssetCatalog } from "@/lib/assets/sync-catalog"
import { logError, logInfo } from "@/lib/logging/logger"

export const maxDuration = 300

export const POST = async (request: Request) => {
  const unauthorized = verifyCronSecret(request)

  if (unauthorized) {
    return unauthorized
  }

  const runId = await startScheduledJobRun({
    jobName: "sync-asset-catalog",
    triggeredBy: "cron-job.org",
  })

  const startedAt = Date.now()

  try {
    const summary = await syncAssetCatalog()

    logInfo({
      event: "scheduled_job_finished",
      jobName: "sync-asset-catalog",
      runId,
      status: "success",
      durationMs: Date.now() - startedAt,
      cryptoCount: summary.cryptoCount,
      stockCount: summary.stockCount,
      totalUpserted: summary.totalUpserted,
      prunedCatalogCount: summary.prunedCatalogCount,
      prunedAssetCount: summary.prunedAssetCount,
    })

    await finishScheduledJobRun({
      id: runId,
      status: "success",
      metadata: {
        catalog: summary,
      },
    })

    return NextResponse.json({
      ok: true,
      jobName: "sync-asset-catalog",
      status: "success",
      ...summary,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    logError({
      event: "scheduled_job_failed",
      jobName: "sync-asset-catalog",
      runId,
      durationMs: Date.now() - startedAt,
      error: errorMessage,
    })

    await finishScheduledJobRun({
      id: runId,
      status: "failed",
      errorMessage,
    })

    return NextResponse.json({ ok: false, error: "Catalog sync failed" }, { status: 500 })
  }
}
