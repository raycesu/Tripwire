import { NextResponse } from "next/server"
import { verifyCronSecret } from "@/lib/cron/verify-cron-secret"
import { runScheduledJob } from "@/lib/jobs/run-scheduled-job"
import { runWeeklyScoresWithAlerts } from "@/jobs/run-weekly-scores"

export const maxDuration = 300

export const POST = async (request: Request) => {
  const unauthorized = verifyCronSecret(request)

  if (unauthorized) {
    return unauthorized
  }

  try {
    const result = await runScheduledJob({
      jobName: "score-weekly",
      triggeredBy: "cron-job.org",
      execute: async () => {
        const { summary, alertSummary } = await runWeeklyScoresWithAlerts()
        return { summary, alertSummary }
      },
    })

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ ok: false, error: "Job failed" }, { status: 500 })
  }
}
