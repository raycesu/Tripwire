import { AssetResolutionBadge } from "@/components/assets/asset-resolution-badge"
import { FreshnessBadges } from "@/components/scores/freshness-badges"
import { ScoreSpeedometer } from "@/components/scores/score-speedometer"
import type { AssetDto } from "@/lib/assets/types"
import { formatScore, getScoreInterpretation } from "@/lib/scores/labels"
import type { AssetSnapshotsSummary } from "@/lib/scores/types"

type AssetDetailHeaderProps = {
  asset: AssetDto
  summary: AssetSnapshotsSummary
}

const SectorSnapshotRow = ({
  label,
  snapshot,
}: {
  label: string
  snapshot: AssetSnapshotsSummary["macro"]
}) => {
  const numericScore =
    snapshot && !snapshot.isNull && snapshot.score !== null
      ? Number(snapshot.score.replace(/^\+/, ""))
      : null

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 px-4 py-3">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {snapshot && !snapshot.isNull && numericScore !== null ? (
          <span className="text-sm text-muted-foreground">
            {getScoreInterpretation(numericScore)}
          </span>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-sm font-medium tabular-nums text-foreground">
          {snapshot && !snapshot.isNull ? formatScore(snapshot.score) : "—"}
        </span>
        {snapshot ? (
          <FreshnessBadges
            isNull={snapshot.isNull}
            nullReason={snapshot.nullReason}
            isStale={snapshot.isStale}
            cadence={snapshot.cadence}
          />
        ) : (
          <FreshnessBadges isNull isStale={false} cadence="daily" nullReason="No score yet" />
        )}
      </div>
    </div>
  )
}

export const AssetDetailHeader = ({ asset, summary }: AssetDetailHeaderProps) => {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold text-metallic">{asset.symbol}</h1>
          <p className="text-sm text-muted-foreground">{asset.name}</p>
          <AssetResolutionBadge
            resolutionStatus={asset.resolutionStatus}
            unsupportedReason={asset.unsupportedReason}
          />
        </div>
        <ScoreSpeedometer snapshot={summary.composite} symbol={asset.symbol} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <SectorSnapshotRow label="Macro" snapshot={summary.macro} />
        <SectorSnapshotRow label="Relativity" snapshot={summary.relativity} />
        <SectorSnapshotRow label="Volume" snapshot={summary.volume} />
      </div>
    </section>
  )
}
