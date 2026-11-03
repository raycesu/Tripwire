import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { AssetDetailActionsMenu } from "@/components/assets/asset-detail-actions-menu"
import { AssetDetailHeader } from "@/components/assets/asset-detail-header"
import { AssetSymbolChooser } from "@/components/assets/asset-symbol-chooser"
import { TradingViewChartSection } from "@/components/assets/trading-view-chart-section"
import { ScoreHistorySection } from "@/components/scores/score-history-section"
import { cn } from "@/lib/utils"
import { ensureAsset } from "@/lib/assets/ensure-asset"
import type { AssetType } from "@/lib/assets/types"
import { isAssetOnWatchlist } from "@/lib/assets/queries"
import { ensureDbUser } from "@/lib/auth/ensure-user"
import { resolveTradingViewSymbolForAsset } from "@/lib/market-data/resolve-tradingview-symbol"
import { getLatestSnapshotsForAsset, getScoreHistory } from "@/lib/scores/queries"

type AssetDetailPageProps = {
  params: Promise<{ symbol: string }>
  searchParams: Promise<{ type?: string }>
}

const parseAssetType = (value: string | undefined): AssetType | undefined => {
  if (value === "crypto" || value === "stock") {
    return value
  }

  return undefined
}

export default async function AssetDetailPage({ params, searchParams }: AssetDetailPageProps) {
  const { symbol } = await params
  const { type } = await searchParams
  const user = await ensureDbUser()
  const ensured = await ensureAsset(symbol, parseAssetType(type))

  if (ensured.status === "missing") {
    notFound()
  }

  if (ensured.status === "ambiguous") {
    return <AssetSymbolChooser symbol={symbol.toUpperCase()} choices={ensured.choices} />
  }

  const asset = ensured.asset

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
            assetType={asset.assetType}
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
