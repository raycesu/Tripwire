import Link from "next/link"
import { ExpandableSectorScoreTube } from "@/components/scores/expandable-sector-score-tube"
import { ScoreSpeedometer } from "@/components/scores/score-speedometer"
import type { AssetSnapshotsSummary } from "@/lib/scores/types"
import type { WatchlistEntryDto } from "@/lib/watchlist/types"

type WatchlistAssetCardProps = {
  entry: WatchlistEntryDto
  summary: AssetSnapshotsSummary | undefined
}

export const WatchlistAssetCard = ({ entry, summary }: WatchlistAssetCardProps) => {
  const composite = summary?.composite ?? null

  return (
    <article className="flex flex-col gap-2">
      <div className="flex items-center justify-center">
        <Link
          href={`/assets/${entry.asset.symbol}`}
          className="text-lg font-semibold tracking-tight text-metallic hover:brightness-110 hover:underline"
        >
          {entry.asset.symbol}
        </Link>
      </div>

      <ScoreSpeedometer snapshot={composite} symbol={entry.asset.symbol} />

      <div className="flex flex-col gap-3 pt-2">
        <ExpandableSectorScoreTube
          label="Macro"
          sector="macro"
          snapshot={summary?.macro ?? null}
          assetType={entry.asset.assetType}
        />
        <ExpandableSectorScoreTube
          label="Relativity"
          sector="relativity"
          snapshot={summary?.relativity ?? null}
          assetType={entry.asset.assetType}
        />
        <ExpandableSectorScoreTube
          label="Volume"
          sector="volume"
          snapshot={summary?.volume ?? null}
          assetType={entry.asset.assetType}
        />
      </div>
    </article>
  )
}
