import Link from "next/link"
import { notFound } from "next/navigation"
import { AssetResolutionBadge } from "@/components/assets/asset-resolution-badge"
import { ScoreBreakdown } from "@/components/scores/score-breakdown"
import { WatchlistToggleButton } from "@/components/watchlist/watchlist-toggle-button"
import { Badge } from "@/components/ui/badge"
import {
  getAssetBySymbol,
  getLatestSnapshotsByAssetId,
  isAssetOnWatchlist,
} from "@/lib/assets/queries"
import { ensureDbUser } from "@/lib/auth/ensure-user"
import { formatScore, getScoreInterpretation } from "@/lib/scores/labels"

type AssetDetailPageProps = {
  params: Promise<{ symbol: string }>
}

const formatComputedAt = (date: Date): string => {
  return date.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  })
}

export default async function AssetDetailPage({ params }: AssetDetailPageProps) {
  const { symbol } = await params
  const user = await ensureDbUser()
  const asset = await getAssetBySymbol(symbol)

  if (!asset) {
    notFound()
  }

  const [snapshots, onWatchlist] = await Promise.all([
    getLatestSnapshotsByAssetId(asset.id),
    isAssetOnWatchlist(user.id, asset.id),
  ])

  const compositeSnapshot = snapshots.find((snapshot) => snapshot.sector === "composite")
  const sectorSnapshots = snapshots.filter((snapshot) => snapshot.sector !== "composite")

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

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Composite score
        </h2>
        {compositeSnapshot && !compositeSnapshot.isNull && compositeSnapshot.score ? (
          <div className="mt-4">
            <p className="text-3xl font-semibold text-foreground">
              {formatScore(compositeSnapshot.score)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {getScoreInterpretation(Number(compositeSnapshot.score))}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Computed {formatComputedAt(compositeSnapshot.computedAt)} UTC
            </p>
            {compositeSnapshot.isStale ? (
              <Badge variant="warning" className="mt-2">
                Stale
              </Badge>
            ) : null}
            <ScoreBreakdown components={compositeSnapshot.componentsJson} />
          </div>
        ) : compositeSnapshot?.isNull ? (
          <div className="mt-4">
            <Badge variant="destructive">
              {compositeSnapshot.nullReason ?? "Unavailable"}
            </Badge>
            <ScoreBreakdown components={compositeSnapshot.componentsJson} />
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            No composite score yet. Run scoring after Macro, Relativity, and Volume snapshots exist.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Sector snapshots
        </h2>
        {sectorSnapshots.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No sector scores stored yet. Add this asset to your watchlist and run{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">npm run scores:run -- --all</code>.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {sectorSnapshots.map((snapshot) => (
              <li key={snapshot.id} className="py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <span className="font-medium capitalize">{snapshot.sector}</span>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {snapshot.cadence} · computed {formatComputedAt(snapshot.computedAt)} UTC
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {snapshot.isNull ? (
                      <Badge variant="destructive">
                        {snapshot.nullReason ?? "Unavailable"}
                      </Badge>
                    ) : (
                      <span className="font-mono text-sm">{formatScore(snapshot.score)}</span>
                    )}
                    {snapshot.isStale ? <Badge variant="warning">Stale</Badge> : null}
                  </div>
                </div>
                <ScoreBreakdown components={snapshot.componentsJson} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
