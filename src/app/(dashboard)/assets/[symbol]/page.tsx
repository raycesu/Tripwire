import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { AssetDetailActionsMenu } from "@/components/assets/asset-detail-actions-menu"
import { AssetDetailHeader } from "@/components/assets/asset-detail-header"
import { TradingViewChartSection } from "@/components/assets/trading-view-chart-section"
import { ScoreHistorySection } from "@/components/scores/score-history-section"
import { cn } from "@/lib/utils"
import { ensureAsset } from "@/lib/assets/ensure-asset"
import { isAssetOnWatchlist } from "@/lib/assets/queries"
import { ensureDbUser } from "@/lib/auth/ensure-user"
import { resolveTradingViewSymbolForAsset } from "@/lib/market-data/resolve-tradingview-symbol"
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

  const [onWatchlist, snapshotSummary, compositeHistory, macroHistory, relativityHistory, volumeHistory] =
    await Promise.all([
      isAssetOnWatchlist(user.id, asset.id),
      getLatestSnapshotsForAsset(asset.id),
      getScoreHistory(asset.id, "composite"),
      getScoreHistory(asset.id, "macro"),
      getScoreHistory(asset.id, "relativity"),
      getScoreHistory(asset.id, "volume"),
    ])

  const tradingViewSymbol = await resolveTradingViewSymbolForAsset(asset)

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
      <AssetDetailHeader
        asset={asset}
        summary={snapshotSummary}
        leadingAction={
          <Link
            href="/dashboard"
            className={cn(
              "inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[0.8rem] font-medium transition-all",
              "nav-link-active"
            )}
            aria-label="Back to watchlist"
          >
            <ChevronLeft className="size-3.5" aria-hidden="true" />
            Back
          </Link>
        }
        trailingAction={
          <AssetDetailActionsMenu
            assetId={asset.id}
            symbol={asset.symbol}
            isOnWatchlist={onWatchlist}
          />
        }
      />

      <TradingViewChartSection
        tradingViewSymbol={tradingViewSymbol}
        assetSymbol={asset.symbol}
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
