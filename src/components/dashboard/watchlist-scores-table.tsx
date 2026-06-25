import { WatchlistTableRow } from "@/components/dashboard/watchlist-table-row"
import {
  WATCHLIST_GRID_CLASS,
  WATCHLIST_GRID_STYLE,
  watchlistHeaderCellClass,
} from "@/components/dashboard/watchlist-table-layout"
import type { AssetSnapshotsSummary } from "@/lib/scores/types"
import type { WatchlistEntryDto } from "@/lib/watchlist/types"

type WatchlistScoresTableProps = {
  watchlist: WatchlistEntryDto[]
  snapshotsByAssetId: Map<string, AssetSnapshotsSummary>
}

const TABLE_HEADERS = [
  { key: "asset", label: "Asset" },
  { key: "signal", label: "Signal" },
  { key: "macro", label: "Macro" },
  { key: "relativity", label: "Relativity" },
  { key: "volume", label: "Volume" },
  { key: "spacer", label: "" },
  { key: "score", label: "Score" },
] as const

export const WatchlistScoresTable = ({
  watchlist,
  snapshotsByAssetId,
}: WatchlistScoresTableProps) => {
  return (
    <div className="w-full" role="table" aria-label="Watchlist scores">
      <div
        className={`${WATCHLIST_GRID_CLASS} border-b border-white/10`}
        style={WATCHLIST_GRID_STYLE}
        role="row"
      >
        {TABLE_HEADERS.map((header) => (
          <div
            key={header.key}
            role="columnheader"
            className={watchlistHeaderCellClass(header.key)}
            aria-hidden={header.key === "spacer" ? true : undefined}
          >
            {header.label}
          </div>
        ))}
      </div>

      <div role="rowgroup">
        {watchlist.map((entry) => (
          <WatchlistTableRow
            key={entry.id}
            entry={entry}
            summary={snapshotsByAssetId.get(entry.assetId)}
          />
        ))}
      </div>
    </div>
  )
}
