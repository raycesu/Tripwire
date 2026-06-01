import { Bell, Radar } from "lucide-react"
import { AssetSearchCombobox } from "@/components/assets/asset-search-combobox"
import { WatchlistScoresTable } from "@/components/dashboard/watchlist-scores-table"
import { EmptyState } from "@/components/ui/empty-state"
import { ensureDbUser } from "@/lib/auth/ensure-user"
import { getLatestSnapshotsForAssets } from "@/lib/scores/queries"
import { listUserWatchlist } from "@/lib/watchlist/queries"

export default async function DashboardPage() {
  const user = await ensureDbUser()
  const watchlist = await listUserWatchlist(user.id)

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

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Add assets
        </h2>
        <AssetSearchCombobox />
        <p className="mt-3 text-xs text-muted-foreground">
          Type at least two characters. Select a result to open its detail page and add it to your
          watchlist.
        </p>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-accent" aria-hidden="true" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Your watchlist
            </h2>
          </div>
        </div>

        {watchlist.length === 0 ? (
          <EmptyState
            title="No assets on your watchlist"
            description="Use the add assets search above, open a symbol, then add it to your watchlist."
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
