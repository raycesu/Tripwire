import { ExpandableSectorSnapshotRow } from "@/components/scores/expandable-sector-snapshot-row"
import { ScoreSpeedometer } from "@/components/scores/score-speedometer"
import type { AssetDto } from "@/lib/assets/types"
import type { AssetSnapshotsSummary } from "@/lib/scores/types"

type AssetDetailHeaderProps = {
  asset: AssetDto
  summary: AssetSnapshotsSummary
}

export const AssetDetailHeader = ({ asset, summary }: AssetDetailHeaderProps) => {
  return (
    <section className="flex flex-col gap-6">
      <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-x-4 sm:gap-x-6">
        <div className="col-start-1 flex flex-col gap-0.5 items-start text-left">
          <h1 className="text-3xl font-semibold leading-none text-metallic">{asset.symbol}</h1>
          <p className="text-sm text-muted-foreground">{asset.name}</p>
        </div>
        <ScoreSpeedometer
          snapshot={summary.composite}
          symbol={asset.symbol}
          className="col-start-2 shrink-0"
        />
        <div className="col-start-3" aria-hidden="true" />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <ExpandableSectorSnapshotRow
          label="Macro"
          sector="macro"
          snapshot={summary.macro}
          assetType={asset.assetType}
        />
        <ExpandableSectorSnapshotRow
          label="Relativity"
          sector="relativity"
          snapshot={summary.relativity}
          assetType={asset.assetType}
        />
        <ExpandableSectorSnapshotRow
          label="Volume"
          sector="volume"
          snapshot={summary.volume}
          assetType={asset.assetType}
        />
      </div>
    </section>
  )
}
