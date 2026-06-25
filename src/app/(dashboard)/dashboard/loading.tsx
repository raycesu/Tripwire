import { Skeleton } from "@/components/ui/skeleton"
import {
  WATCHLIST_GRID_CLASS,
  WATCHLIST_GRID_STYLE,
  WATCHLIST_SCORE_GAUGE_CLASS,
  watchlistBodyCellClass,
  watchlistHeaderCellClass,
} from "@/components/dashboard/watchlist-table-layout"
import { WATCHLIST_SECTOR_BAR_WIDTH_PX } from "@/components/scores/sector-score-tube"
import { cn } from "@/lib/utils"

const TABLE_HEADERS = [
  { key: "asset", label: "Asset" },
  { key: "signal", label: "Signal" },
  { key: "macro", label: "Macro" },
  { key: "relativity", label: "Relativity" },
  { key: "volume", label: "Volume" },
  { key: "spacer", label: "" },
  { key: "score", label: "Score" },
] as const

const WatchlistTableRowSkeleton = () => (
  <div
    className={`${WATCHLIST_GRID_CLASS} border-b border-white/8`}
    style={WATCHLIST_GRID_STYLE}
  >
    <div className={watchlistBodyCellClass("asset")}>
      <div className="flex flex-col gap-1">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
    <div className={watchlistBodyCellClass("signal")}>
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
    <div className={watchlistBodyCellClass("macro")}>
      <div className="flex items-center gap-1.5">
        <Skeleton
          className="h-4 shrink-0 rounded-full"
          style={{ width: `${WATCHLIST_SECTOR_BAR_WIDTH_PX}px` }}
        />
        <Skeleton className="h-3 w-10" />
      </div>
    </div>
    <div className={watchlistBodyCellClass("relativity")}>
      <div className="flex items-center gap-1.5">
        <Skeleton
          className="h-4 shrink-0 rounded-full"
          style={{ width: `${WATCHLIST_SECTOR_BAR_WIDTH_PX}px` }}
        />
        <Skeleton className="h-3 w-10" />
      </div>
    </div>
    <div className={watchlistBodyCellClass("volume")}>
      <div className="flex items-center gap-1.5">
        <Skeleton
          className="h-4 shrink-0 rounded-full"
          style={{ width: `${WATCHLIST_SECTOR_BAR_WIDTH_PX}px` }}
        />
        <Skeleton className="h-3 w-10" />
      </div>
    </div>
    <div className={watchlistBodyCellClass("spacer")} aria-hidden="true" />
    <div className={watchlistBodyCellClass("score")}>
      <Skeleton className={cn(WATCHLIST_SCORE_GAUGE_CLASS, "rounded-full")} />
    </div>
  </div>
)

export default function DashboardLoading() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-9 w-28 rounded-md" />
      </header>

      <div className="w-full">
        <div
          className={`${WATCHLIST_GRID_CLASS} border-b border-white/10`}
          style={WATCHLIST_GRID_STYLE}
        >
          {TABLE_HEADERS.map((header) => (
            <div
              key={header.key}
              className={watchlistHeaderCellClass(header.key)}
              aria-hidden={header.key === "spacer" ? true : undefined}
            >
              {header.label}
            </div>
          ))}
        </div>
        <WatchlistTableRowSkeleton />
        <WatchlistTableRowSkeleton />
        <WatchlistTableRowSkeleton />
        <WatchlistTableRowSkeleton />
        <WatchlistTableRowSkeleton />
      </div>
    </main>
  )
}
