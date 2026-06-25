import { WATCHLIST_SECTOR_TUBE_WIDTH_PX } from "@/components/scores/sector-score-tube"

/**
 * Watchlist grid column rhythm:
 * Asset → gap → Signal → gap → Macro|Relativity|Volume (flush) → flex spacer → Score (gauge, right)
 */
export const WATCHLIST_GRID_TEMPLATE = `minmax(132px, 168px) 132px ${WATCHLIST_SECTOR_TUBE_WIDTH_PX}px ${WATCHLIST_SECTOR_TUBE_WIDTH_PX}px ${WATCHLIST_SECTOR_TUBE_WIDTH_PX}px minmax(8px, 1fr) 180px`

export const WATCHLIST_GRID_CLASS = "grid w-full items-center gap-x-0"

export const WATCHLIST_GRID_STYLE = {
  gridTemplateColumns: WATCHLIST_GRID_TEMPLATE,
} as const

export const WATCHLIST_SCORE_GAUGE_CLASS = "h-[88px] w-[180px]"

export const watchlistHeaderCellClass = (key: string): string => {
  const base = "pb-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-silver-dim"

  switch (key) {
    case "asset":
      return `${base} pr-2`
    case "signal":
      return `${base} pr-3`
    case "macro":
    case "relativity":
    case "volume":
      return `${base} pr-0`
    case "spacer":
      return "min-w-0"
    case "score":
      return `${base} flex w-[180px] justify-center justify-self-end pr-0 text-center`
    default:
      return base
  }
}

export const watchlistBodyCellClass = (key: string): string => {
  const base = "min-w-0 align-middle"

  switch (key) {
    case "asset":
      return `${base} py-1 pr-2`
    case "signal":
      return `${base} py-1 pr-3`
    case "macro":
    case "relativity":
    case "volume":
      return `${base} overflow-visible py-1 pr-0`
    case "spacer":
      return "min-w-0"
    case "score":
      return `${base} justify-self-end overflow-visible py-1 pr-0`
    default:
      return `${base} py-1`
  }
}
