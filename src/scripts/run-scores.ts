import { runScheduledJob } from "@/lib/jobs/run-scheduled-job"
import { runDailyScoresWithAlerts } from "@/jobs/run-daily-scores"
import { runWeeklyScoresWithAlerts } from "@/jobs/run-weekly-scores"
import type { AlertRunSummary, JobRunSummary } from "@/jobs/types"
import { redactSecrets } from "@/lib/logging/redact-secrets"

const printSummary = (label: string, summary: JobRunSummary) => {
  console.log(`\n${label}`)
  console.log(`  attempted: ${summary.attempted}`)
  console.log(`  succeeded: ${summary.succeeded}`)
  console.log(`  failed: ${summary.failed}`)

  if (summary.errors.length > 0) {
    console.log("  errors:")
    for (const error of summary.errors) {
      console.log(`    - ${error.symbol} (${error.sector}): ${error.message}`)
    }
  }
}

const printAlertSummary = (label: string, alertSummary: AlertRunSummary) => {
  console.log(`\n${label}`)
  console.log(`  sent: ${alertSummary.sent}`)
  console.log(`  failed: ${alertSummary.failed}`)
  console.log(`  skipped (duplicate): ${alertSummary.skippedDuplicate}`)
  console.log(`  skipped (rate limited): ${alertSummary.skippedRateLimited}`)
  console.log(`  skipped (cooldown): ${alertSummary.skippedCooldown}`)
  console.log(`  skipped (no telegram): ${alertSummary.skippedNoTelegram}`)
}

const run = async () => {
  const args = process.argv.slice(2)
  const runDaily = args.includes("--daily") || args.includes("--all")
  const runWeekly = args.includes("--weekly") || args.includes("--all")

  if (!runDaily && !runWeekly) {
    console.log("Usage: npm run scores:run -- [--daily] [--weekly] [--all]")
    process.exit(1)
  }

  if (runDaily) {
    const response = await runScheduledJob({
      jobName: "score-daily",
      triggeredBy: "manual",
      execute: () => runDailyScoresWithAlerts(),
    })

    console.log("\nScheduled job run")
    console.log(`  job: ${response.jobName}`)
    console.log(`  status: ${response.status}`)

    if (response.summary) {
      printSummary("Daily scores (Macro + Composite)", response.summary)
    }

    if (response.alertSummary) {
      printAlertSummary("Daily alert evaluation", response.alertSummary)
    }
  }

  if (runWeekly) {
    const response = await runScheduledJob({
      jobName: "score-weekly",
      triggeredBy: "manual",
      execute: () => runWeeklyScoresWithAlerts(),
    })

    console.log("\nScheduled job run")
    console.log(`  job: ${response.jobName}`)
    console.log(`  status: ${response.status}`)

    if (response.summary) {
      printSummary("Weekly scores (Relativity + Volume + Composite)", response.summary)
    }

    if (response.alertSummary) {
      printAlertSummary("Weekly alert evaluation", response.alertSummary)
    }
  }
}

run().catch((error) => {
  console.error(JSON.stringify(redactSecrets(error)))
  process.exit(1)
})
