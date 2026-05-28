import { runDailyScoresWithAlerts } from "@/jobs/run-daily-scores"
import { runWeeklyScoresWithAlerts } from "@/jobs/run-weekly-scores"
import type { AlertRunSummary, JobRunSummary } from "@/jobs/types"

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
    const { summary, alertSummary } = await runDailyScoresWithAlerts()
    printSummary("Daily scores (Macro + Composite)", summary)
    printAlertSummary("Daily alert evaluation", alertSummary)
  }

  if (runWeekly) {
    const { summary, alertSummary } = await runWeeklyScoresWithAlerts()
    printSummary("Weekly scores (Relativity + Volume + Composite)", summary)
    printAlertSummary("Weekly alert evaluation", alertSummary)
  }
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
