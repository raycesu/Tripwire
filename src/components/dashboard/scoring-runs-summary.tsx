import type { ScheduledJobRun } from "@/db/schema"
import { formatComputedAt } from "@/lib/scores/labels"

type ScoringRunsSummaryProps = {
  lastDailyJob: ScheduledJobRun | null
  lastWeeklyJob: ScheduledJobRun | null
}

const formatJobLine = (job: ScheduledJobRun | null, label: string): string => {
  if (!job) {
    return `${label}: No runs logged yet`
  }

  const failedSuffix =
    job.assetsFailed && job.assetsFailed > 0
      ? ` · ${job.assetsFailed} asset(s) failed`
      : ""

  return `${label}: ${job.status} · ${formatComputedAt(job.startedAt)} UTC${failedSuffix}`
}

export const ScoringRunsSummary = ({
  lastDailyJob,
  lastWeeklyJob,
}: ScoringRunsSummaryProps) => {
  const hasPartialFailure =
    (lastDailyJob?.status === "partial_failure" && (lastDailyJob.assetsFailed ?? 0) > 0) ||
    (lastWeeklyJob?.status === "partial_failure" && (lastWeeklyJob.assetsFailed ?? 0) > 0)

  return (
    <article className="rounded-xl border border-border bg-card p-5 md:col-span-1">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">Scoring runs</p>
      <ul className="mt-3 space-y-2 text-sm font-medium text-foreground">
        <li>{formatJobLine(lastDailyJob, "Daily")}</li>
        <li>{formatJobLine(lastWeeklyJob, "Weekly")}</li>
      </ul>
      {hasPartialFailure ? (
        <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
          Some assets failed to score in the latest run. Scores may be incomplete until the next
          successful run.
        </p>
      ) : null}
    </article>
  )
}
