import Link from "next/link"
import {
  WATCHLIST_GRID_CLASS,
  WATCHLIST_GRID_STYLE,
  watchlistBodyCellClass,
} from "@/components/dashboard/watchlist-table-layout"
import { SectorScoreTube } from "@/components/scores/sector-score-tube"
import { ScoreSignalBadge } from "@/components/scores/score-signal-badge"
import { ScoreSpeedometer } from "@/components/scores/score-speedometer"
import type { AssetSnapshotsSummary } from "@/lib/scores/types"
import type { WatchlistEntryDto } from "@/lib/watchlist/types"

type WatchlistTableRowProps = {
  entry: WatchlistEntryDto
  summary: AssetSnapshotsSummary | undefined
}

export const WatchlistTableRow = ({ entry, summary }: WatchlistTableRowProps) => {
  const composite = summary?.composite ?? null

  return (
    <div
      className={`${WATCHLIST_GRID_CLASS} border-b border-white/8`}
      style={WATCHLIST_GRID_STYLE}
      role="row"
    >
      <div role="cell" className={watchlistBodyCellClass("asset")}>
        <Link
          href={`/assets/${entry.asset.symbol}`}
          className="group block min-w-0"
        >
          <span className="block truncate font-semibold text-metallic group-hover:underline">
            {entry.asset.symbol}
          </span>
          <span className="block truncate text-xs text-silver-dim">{entry.asset.name}</span>
        </Link>
      </div>

      <div role="cell" className={watchlistBodyCellClass("signal")}>
        <ScoreSignalBadge snapshot={composite} />
      </div>

      <div role="cell" className={watchlistBodyCellClass("macro")}>
        <SectorScoreTube
          label="Macro"
          snapshot={summary?.macro ?? null}
          layout="table"
        />
      </div>

      <div role="cell" className={watchlistBodyCellClass("relativity")}>
        <SectorScoreTube
          label="Relativity"
          snapshot={summary?.relativity ?? null}
          layout="table"
        />
      </div>

      <div role="cell" className={watchlistBodyCellClass("volume")}>
        <SectorScoreTube
          label="Volume"
          snapshot={summary?.volume ?? null}
          layout="table"
        />
      </div>

      <div role="cell" className={watchlistBodyCellClass("spacer")} aria-hidden="true" />

      <div role="cell" className={watchlistBodyCellClass("score")}>
        <ScoreSpeedometer
          variant="inline"
          snapshot={composite}
          symbol={entry.asset.symbol}
        />
      </div>
    </div>
  )
}
