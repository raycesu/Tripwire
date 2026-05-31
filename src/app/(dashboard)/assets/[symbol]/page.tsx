import Link from "next/link"
import { notFound } from "next/navigation"
import { AssetResolutionBadge } from "@/components/assets/asset-resolution-badge"
import { ScoreHistorySection } from "@/components/scores/score-history-section"
import { SectorScoresPanel } from "@/components/scores/sector-scores-panel"
import { WatchlistToggleButton } from "@/components/watchlist/watchlist-toggle-button"
import { ensureAsset } from "@/lib/assets/ensure-asset"
import { isAssetOnWatchlist } from "@/lib/assets/queries"
import { ensureDbUser } from "@/lib/auth/ensure-user"
import { getLatestSnapshotsForAsset, getScoreHistory } from "@/lib/scores/queries"

type AssetDetailPageProps = {
  params: Promise<{ symbol: string }>
}

export default async function AssetDetailPage({ params }: AssetDetailPageProps) {
  const { symbol } = await params
  const user = await ensureDbUser()
  const asset = await ensureAsset(symbol)

  if (!asset) {
    notFound()
  }

  const [summary, onWatchlist, compositeHistory, macroHistory, relativityHistory, volumeHistory] =
    await Promise.all([
      getLatestSnapshotsForAsset(asset.id),
      isAssetOnWatchlist(user.id, asset.id),
      getScoreHistory(asset.id, "composite"),
      getScoreHistory(asset.id, "macro"),
      getScoreHistory(asset.id, "relativity"),
      getScoreHistory(asset.id, "volume"),
    ])

  const sectorSnapshots = [summary.macro, summary.relativity, summary.volume].filter(
    (snapshot): snapshot is NonNullable<typeof snapshot> => snapshot !== null
  )

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
      <div>
        <Link href="/assets" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to catalog
        </Link>
      </div>

      <section className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground capitalize">{asset.assetType}</p>
            <h1 className="text-3xl font-semibold text-foreground">{asset.symbol}</h1>
            <p className="mt-1 text-muted-foreground">{asset.name}</p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <AssetResolutionBadge
              resolutionStatus={asset.resolutionStatus}
              unsupportedReason={asset.unsupportedReason}
            />
            <WatchlistToggleButton
              assetId={asset.id}
              symbol={asset.symbol}
              isOnWatchlist={onWatchlist}
            />
          </div>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">Benchmark</dt>
            <dd className="mt-1 text-sm font-medium">{asset.benchmarkSymbol ?? "—"}</dd>
          </div>
          {asset.assetType === "stock" ? (
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">Exchange</dt>
              <dd className="mt-1 text-sm font-medium">{asset.exchange ?? "—"}</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">
              Provider symbol
            </dt>
            <dd className="mt-1 text-sm font-medium">{asset.providerSymbol ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">Quote</dt>
            <dd className="mt-1 text-sm font-medium">{asset.quoteAsset ?? "—"}</dd>
          </div>
        </dl>

        {asset.unsupportedReason ? (
          <p className="mt-4 text-sm text-destructive">{asset.unsupportedReason}</p>
        ) : null}
      </section>

      <SectorScoresPanel
        assetType={asset.assetType}
        composite={summary.composite}
        sectors={sectorSnapshots}
      />

      <ScoreHistorySection
        historyBySector={{
          composite: compositeHistory,
          macro: macroHistory,
          relativity: relativityHistory,
          volume: volumeHistory,
        }}
      />
    </main>
  )
}
