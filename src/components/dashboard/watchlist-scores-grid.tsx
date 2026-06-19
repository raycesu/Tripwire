import { WatchlistAssetCard } from "@/components/dashboard/watchlist-asset-card"
import type { AssetSnapshotsSummary } from "@/lib/scores/types"
import type { WatchlistEntryDto } from "@/lib/watchlist/types"

type WatchlistScoresGridProps = {
  watchlist: WatchlistEntryDto[]
  snapshotsByAssetId: Map<string, AssetSnapshotsSummary>
}

export const WatchlistScoresGrid = ({
  watchlist,
  snapshotsByAssetId,
}: WatchlistScoresGridProps) => {
  return (
    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {watchlist.map((entry) => (
        <li key={entry.id}>
          <WatchlistAssetCard
            entry={entry}
            summary={snapshotsByAssetId.get(entry.assetId)}
          />
        </li>
      ))}
    </ul>
  )
}
