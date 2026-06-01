import Link from "next/link"
import { WatchlistRemoveButton } from "@/components/dashboard/watchlist-remove-button"
import { SectorMiniIndicator } from "@/components/scores/sector-mini-indicator"
import { ScoreChip } from "@/components/scores/score-chip"
import type { AssetSnapshotsSummary } from "@/lib/scores/types"
import type { WatchlistEntryDto } from "@/lib/watchlist/types"

type WatchlistScoresTableProps = {
  watchlist: WatchlistEntryDto[]
  snapshotsByAssetId: Map<string, AssetSnapshotsSummary>
}

export const WatchlistScoresTable = ({
  watchlist,
  snapshotsByAssetId,
}: WatchlistScoresTableProps) => {
  return (
    <ul className="divide-y divide-border">
      {watchlist.map((entry) => {
        const summary = snapshotsByAssetId.get(entry.assetId)
        const composite = summary?.composite ?? null

        return (
          <li key={entry.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
            <div className="min-w-0 flex-1">
              <Link
                href={`/assets/${entry.asset.symbol}`}
                className="font-medium text-foreground hover:underline"
              >
                {entry.asset.symbol}
              </Link>
              <p className="text-sm text-muted-foreground">{entry.asset.name}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {composite && !composite.isNull ? (
                <ScoreChip score={composite.score} size="sm" />
              ) : composite?.isNull ? (
                <span className="text-xs text-destructive">Composite unavailable</span>
              ) : (
                <span className="text-xs text-muted-foreground">No score</span>
              )}

              <div className="flex items-center gap-1" aria-label="Sector scores">
                <SectorMiniIndicator label="Macro" snapshot={summary?.macro ?? null} />
                <SectorMiniIndicator label="Relativity" snapshot={summary?.relativity ?? null} />
                <SectorMiniIndicator label="Volume" snapshot={summary?.volume ?? null} />
              </div>
            </div>

            <WatchlistRemoveButton assetId={entry.assetId} symbol={entry.asset.symbol} />
          </li>
        )
      })}
    </ul>
  )
}
