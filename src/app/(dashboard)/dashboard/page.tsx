import Link from "next/link"
import { Bell, Radar } from "lucide-react"
import { WatchlistScoresTable } from "@/components/dashboard/watchlist-scores-table"
import { EmptyState } from "@/components/ui/empty-state"
import { ButtonLink } from "@/components/ui/button"
import { ensureDbUser } from "@/lib/auth/ensure-user"
import { countActiveAlertRules } from "@/lib/alerts/queries"
import { getLatestSnapshotsForAssets } from "@/lib/scores/queries"
import { ScoringRunsSummary } from "@/components/dashboard/scoring-runs-summary"
import { getLastJobRun } from "@/lib/jobs/queries"
import { listUserWatchlist } from "@/lib/watchlist/queries"

export default async function DashboardPage() {
  const user = await ensureDbUser()
  const [watchlist, activeAlertCount, lastDailyJob, lastWeeklyJob] = await Promise.all([
    listUserWatchlist(user.id),
    countActiveAlertRules(user.id),
    getLastJobRun("score-daily"),
    getLastJobRun("score-weekly"),
  ])

  const assetIds = watchlist.map((entry) => entry.assetId)
  const snapshotsByAssetId = await getLatestSnapshotsForAssets(assetIds)

  const hasAnyScores = [...snapshotsByAssetId.values()].some(
    (summary) => summary.composite !== null || summary.macro !== null
  )

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
      <section className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-md bg-accent/20 p-2 text-accent">
            <Radar className="size-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tripwire</p>
            <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Monitor composite and sector scores for your watchlist. Positive scores signal
          contrarian opportunity, not generic bullishness.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Watchlist</p>
          <p className="mt-2 text-2xl font-semibold">{watchlist.length}</p>
        </article>
        <article className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Active alerts</p>
          <p className="mt-2 text-2xl font-semibold">{activeAlertCount}</p>
        </article>
        <ScoringRunsSummary lastDailyJob={lastDailyJob} lastWeeklyJob={lastWeeklyJob} />
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-accent" aria-hidden="true" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Your watchlist
            </h2>
          </div>
          <ButtonLink href="/assets" variant="secondary">
            Browse assets
          </ButtonLink>
        </div>

        {watchlist.length === 0 ? (
          <EmptyState
            title="No assets on your watchlist"
            description="Add BTC, ETH, SOL, and other MVP assets from the catalog to start monitoring scores."
            actionHref="/assets"
            actionLabel="Go to asset catalog"
          />
        ) : (
          <>
            {!hasAnyScores ? (
              <p className="mb-4 text-sm text-muted-foreground">
                Scores will appear after the daily or weekly cron jobs run, or after a manual{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">npm run scores:run</code>.
              </p>
            ) : null}
            <WatchlistScoresTable watchlist={watchlist} snapshotsByAssetId={snapshotsByAssetId} />
          </>
        )}
      </section>
    </main>
  )
}
