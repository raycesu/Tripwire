import Link from "next/link"
import { AssetResolutionBadge } from "@/components/assets/asset-resolution-badge"
import { WatchlistToggleButton } from "@/components/watchlist/watchlist-toggle-button"
import { listActiveAssets, getWatchlistAssetIdsForUser } from "@/lib/assets/queries"
import { ensureDbUser } from "@/lib/auth/ensure-user"

export default async function AssetsPage() {
  const user = await ensureDbUser()
  const [assets, watchlistAssetIds] = await Promise.all([
    listActiveAssets(),
    getWatchlistAssetIdsForUser(user.id),
  ])

  const cryptoAssets = assets.filter((asset) => asset.assetType === "crypto")
  const stockAssets = assets.filter((asset) => asset.assetType === "stock")

  const renderAssetRow = (asset: (typeof assets)[number]) => {
    const isOnWatchlist = watchlistAssetIds.has(asset.id)

    return (
      <tr key={asset.id} className="border-b border-border last:border-0">
        <td className="py-4 pr-4">
          <Link
            href={`/assets/${asset.symbol}`}
            className="font-medium text-foreground hover:underline"
          >
            {asset.symbol}
          </Link>
          <p className="text-sm text-muted-foreground">{asset.name}</p>
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
            isOnWatchlist={isOnWatchlist}
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
          MVP starter universe. Provider validation completes in Phase 3; you can add any seeded
          asset to your watchlist now.
        </p>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Crypto
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                <th className="pb-3 pr-4 font-medium">Asset</th>
                <th className="pb-3 pr-4 font-medium">Type</th>
                <th className="pb-3 pr-4 font-medium">Provider</th>
                <th className="pb-3 pr-4 font-medium">Benchmark</th>
                <th className="pb-3 font-medium">Watchlist</th>
              </tr>
            </thead>
            <tbody>{cryptoAssets.map(renderAssetRow)}</tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Stocks
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                <th className="pb-3 pr-4 font-medium">Asset</th>
                <th className="pb-3 pr-4 font-medium">Type</th>
                <th className="pb-3 pr-4 font-medium">Provider</th>
                <th className="pb-3 pr-4 font-medium">Benchmark</th>
                <th className="pb-3 font-medium">Watchlist</th>
              </tr>
            </thead>
            <tbody>{stockAssets.map(renderAssetRow)}</tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
