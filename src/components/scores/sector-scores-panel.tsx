import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { FreshnessBadges } from "@/components/scores/freshness-badges"
import { ScoreChip } from "@/components/scores/score-chip"
import { SectorBreakdown } from "@/components/scores/sector-breakdown"
import { formatComputedAt } from "@/lib/scores/labels"
import type { AssetType } from "@/lib/assets/types"
import type { ScoreSnapshotView } from "@/lib/scores/types"

type SectorScoresPanelProps = {
  assetType: AssetType
  composite: ScoreSnapshotView | null
  sectors: ScoreSnapshotView[]
}

const SECTOR_ORDER = ["macro", "relativity", "volume"] as const

export const SectorScoresPanel = ({
  assetType,
  composite,
  sectors,
}: SectorScoresPanelProps) => {
  const orderedSectors = SECTOR_ORDER.map((name) =>
    sectors.find((snapshot) => snapshot.sector === name)
  ).filter((snapshot): snapshot is ScoreSnapshotView => snapshot !== undefined)

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Composite score
        </h2>
        {composite ? (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              {!composite.isNull ? (
                <ScoreChip score={composite.score} size="lg" showInterpretation />
              ) : (
                <FreshnessBadges
                  isNull={composite.isNull}
                  nullReason={composite.nullReason}
                  isStale={composite.isStale}
                  cadence={composite.cadence}
                />
              )}
              {!composite.isNull ? (
                <FreshnessBadges
                  isNull={composite.isNull}
                  nullReason={composite.nullReason}
                  isStale={composite.isStale}
                  cadence={composite.cadence}
                />
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              Computed {formatComputedAt(composite.computedAt)} UTC · {composite.cadence}
            </p>
            <SectorBreakdown
              sector="composite"
              assetType={assetType}
              components={composite.componentsJson}
            />
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            No composite score yet. Run scoring after Macro, Relativity, and Volume snapshots exist.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Sector scores
        </h2>
        {orderedSectors.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No sector scores stored yet. Add this asset to your watchlist and wait for the daily or
            weekly cron jobs.
          </p>
        ) : (
          <Accordion className="w-full">
            {orderedSectors.map((snapshot) => (
              <AccordionItem key={snapshot.id} value={snapshot.sector}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex flex-1 flex-wrap items-center justify-between gap-3 pr-2">
                    <div className="text-left">
                      <span className="font-medium capitalize text-foreground">{snapshot.sector}</span>
                      <p className="mt-0.5 text-xs font-normal text-muted-foreground">
                        {snapshot.cadence} · {formatComputedAt(snapshot.computedAt)} UTC
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {snapshot.isNull ? (
                        <FreshnessBadges
                          isNull={snapshot.isNull}
                          nullReason={snapshot.nullReason}
                          isStale={snapshot.isStale}
                          cadence={snapshot.cadence}
                        />
                      ) : (
                        <ScoreChip score={snapshot.score} size="sm" />
                      )}
                      {!snapshot.isNull ? (
                        <FreshnessBadges
                          isNull={snapshot.isNull}
                          nullReason={snapshot.nullReason}
                          isStale={snapshot.isStale}
                          cadence={snapshot.cadence}
                        />
                      ) : null}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <SectorBreakdown
                    sector={snapshot.sector}
                    assetType={assetType}
                    components={snapshot.componentsJson}
                  />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </section>
    </div>
  )
}
