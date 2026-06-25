import { ChevronLeft } from "lucide-react"
import { notFound } from "next/navigation"
import { AssetDetailHeader } from "@/components/assets/asset-detail-header"
import { TradingViewChartSection } from "@/components/assets/trading-view-chart-section"
import { ScoreHistorySection } from "@/components/scores/score-history-section"
import { ButtonLink } from "@/components/ui/button"
import { AssetDetailActionsMenu } from "@/components/assets/asset-detail-actions-menu"
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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <ButtonLink
          href="/dashboard"
          variant="outline"
          size="sm"
          className="gap-1.5 rounded-full"
          aria-label="Back to watchlist"
        >
          <ChevronLeft aria-hidden="true" />
          Back
        </ButtonLink>
        <AssetDetailActionsMenu
          assetId={asset.id}
          symbol={asset.symbol}
          isOnWatchlist={onWatchlist}
        />
      </div>

      <AssetDetailHeader asset={asset} summary={snapshotSummary} />

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
