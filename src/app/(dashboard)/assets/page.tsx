import Link from "next/link"
import { AssetResolutionBadge } from "@/components/assets/asset-resolution-badge"
import { AssetSearchCombobox } from "@/components/assets/asset-search-combobox"
import { ScoreChip } from "@/components/scores/score-chip"
import { WatchlistToggleButton } from "@/components/watchlist/watchlist-toggle-button"
import { ensureDbUser } from "@/lib/auth/ensure-user"
import { getLatestSnapshotsForAssets } from "@/lib/scores/queries"
import { listUserWatchlist } from "@/lib/watchlist/queries"
import type { WatchlistEntryDto } from "@/lib/watchlist/types"
import type { AssetSnapshotsSummary } from "@/lib/scores/types"

export default async function AssetsPage() {
  const user = await ensureDbUser()
  const watchlist = await listUserWatchlist(user.id)
  const snapshotsByAssetId = await getLatestSnapshotsForAssets(
    watchlist.map((entry) => entry.assetId)
  )

  const renderWatchlistRow = (entry: WatchlistEntryDto) => {
    const { asset } = entry
    const summary: AssetSnapshotsSummary | undefined = snapshotsByAssetId.get(asset.id)
    const composite = summary?.composite

    return (
      <tr key={entry.id} className="border-b border-border last:border-0">
        <td className="py-4 pr-4">
          <Link
            href={`/assets/${asset.symbol}`}
            className="font-medium text-foreground hover:underline"
          >
            {asset.symbol}
          </Link>
          <p className="text-sm text-muted-foreground">{asset.name}</p>
        </td>
        <td className="py-4 pr-4">
          {composite && !composite.isNull ? (
            <ScoreChip score={composite.score} size="sm" />
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </td>
        <td className="py-4 pr-4 capitalize text-sm text-muted-foreground">{asset.assetType}</td>
        <td className="py-4 pr-4">
          <AssetResolutionBadge
            resolutionStatus={asset.resolutionStatus}
            unsupportedReason={asset.unsupportedReason}
          />
        </td>
        <td className="py-4 text-sm text-muted-foreground">{asset.benchmarkSymbol ?? "—"}</td>
        <td className="py-4">
          <WatchlistToggleButton
            assetId={asset.id}
            symbol={asset.symbol}
            isOnWatchlist={true}
          />
        </td>
      </tr>
    )
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
      <section>
        <h1 className="text-2xl font-semibold text-foreground">Asset catalog</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Search Binance USDT spot pairs and Twelve Data equities. Open an asset to review scores
          and add it to your watchlist.
        </p>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Add assets
        </h2>
        <AssetSearchCombobox />
        <p className="mt-3 text-xs text-muted-foreground">
          Type at least two characters. Select a result to open its detail page.
        </p>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Your watchlist
        </h2>

        {watchlist.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No assets on your watchlist yet. Search above, open an asset, then add it from the
            detail page.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">Asset</th>
                  <th className="pb-3 pr-4 font-medium">Composite</th>
                  <th className="pb-3 pr-4 font-medium">Type</th>
                  <th className="pb-3 pr-4 font-medium">Provider</th>
                  <th className="pb-3 pr-4 font-medium">Benchmark</th>
                  <th className="pb-3 font-medium">Watchlist</th>
                </tr>
              </thead>
              <tbody>{watchlist.map(renderWatchlistRow)}</tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}
