import { WatchlistScoresGrid } from "@/components/dashboard/watchlist-scores-grid"
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
      <section className="flex flex-col gap-4">
        {watchlist.length === 0 ? (
          <EmptyState
            variant="plain"
            title="No assets on your watchlist"
            description="Click Add assets in the header, search for a symbol, open its detail page, then add it to your watchlist."
          />
        ) : (
          <>
            {!hasAnyScores ? (
              <p className="mb-4 text-sm text-muted-foreground">
                Scores will appear after the daily or weekly cron jobs run, or after a manual{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">npm run scores:run</code>.
              </p>
            ) : null}
            <WatchlistScoresGrid watchlist={watchlist} snapshotsByAssetId={snapshotsByAssetId} />
          </>
        )}
      </section>
    </main>
  )
}
