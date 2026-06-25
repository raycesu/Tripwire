import type { ReactNode } from "react"
import { ExpandableSectorSnapshotRow } from "@/components/scores/expandable-sector-snapshot-row"
import { ScoreSpeedometer } from "@/components/scores/score-speedometer"
import type { AssetDto } from "@/lib/assets/types"
import type { AssetSnapshotsSummary } from "@/lib/scores/types"

type AssetDetailHeaderProps = {
  asset: AssetDto
  summary: AssetSnapshotsSummary
  leadingAction?: ReactNode
  trailingAction?: ReactNode
}

export const AssetDetailHeader = ({
  asset,
  summary,
  leadingAction,
  trailingAction,
}: AssetDetailHeaderProps) => {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col">
        {leadingAction || trailingAction ? (
          <div className="relative z-10 flex items-start justify-between gap-4">
            {leadingAction ?? <span aria-hidden="true" />}
            {trailingAction}
          </div>
        ) : null}

        <div className="relative z-0 flex w-full items-center justify-center gap-x-4 sm:gap-x-6 -mt-7">
          <div className="flex shrink-0 flex-col gap-0.5 text-left">
            <h1 className="text-3xl font-semibold leading-none text-metallic">{asset.symbol}</h1>
            <p className="text-sm text-muted-foreground">{asset.name}</p>
          </div>
          <ScoreSpeedometer
            snapshot={summary.composite}
            symbol={asset.symbol}
            size="large"
            className="shrink-0 self-start pointer-events-none"
          />
        </div>
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
