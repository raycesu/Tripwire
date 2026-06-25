"use client"

import { AddAssetsDialog } from "@/components/assets/add-assets-dialog"

type WatchlistPageHeaderProps = {
  assetCount: number
}

export const WatchlistPageHeader = ({ assetCount }: WatchlistPageHeaderProps) => {
  const countLabel = assetCount === 1 ? "1 asset" : `${assetCount} assets`

  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap items-baseline gap-3">
        <h1 className="text-2xl font-semibold text-metallic">Watchlist</h1>
        <span className="text-sm text-silver-dim">{countLabel}</span>
      </div>
      <AddAssetsDialog variant="page" />
    </header>
  )
}
