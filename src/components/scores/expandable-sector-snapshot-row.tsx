"use client"

import { useId, useState } from "react"
import { ChevronDownIcon } from "lucide-react"
import { FreshnessBadges } from "@/components/scores/freshness-badges"
import { SectorBreakdown } from "@/components/scores/sector-breakdown"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { AssetType } from "@/lib/assets/types"
import { formatScore, getScoreInterpretation } from "@/lib/scores/labels"
import type { ScoreSnapshotView } from "@/lib/scores/types"

type ExpandableSectorSnapshotRowProps = {
  label: string
  sector: "macro" | "relativity" | "volume"
  snapshot: ScoreSnapshotView | null
  assetType: AssetType
}

const hasBreakdown = (
  snapshot: ScoreSnapshotView | null,
  sector: "macro" | "relativity" | "volume"
): boolean => {
  if (!snapshot || snapshot.isNull) {
    return false
  }

  const components = snapshot.componentsJson

  if (!components || Object.keys(components).length === 0) {
    return false
  }

  if (components.error !== undefined && sector !== "volume") {
    return false
  }

  return true
}

export const ExpandableSectorSnapshotRow = ({
  label,
  sector,
  snapshot,
  assetType,
}: ExpandableSectorSnapshotRowProps) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const breakdownId = useId()
  const canExpand = hasBreakdown(snapshot, sector)

  const numericScore =
    snapshot && !snapshot.isNull && snapshot.score !== null
      ? Number(snapshot.score.replace(/^\+/, ""))
      : null

  const handleToggle = () => {
    if (!canExpand) {
      return
    }

    setIsExpanded((previous) => !previous)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return
    }

    event.preventDefault()
    handleToggle()
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border/60 bg-muted/20">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
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
          {canExpand ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
              aria-expanded={isExpanded}
              aria-controls={breakdownId}
              aria-label={`${isExpanded ? "Hide" : "Show"} ${label} breakdown`}
              onClick={handleToggle}
              onKeyDown={handleKeyDown}
            >
              {isExpanded ? "Hide" : "Show"}
              <ChevronDownIcon
                className={cn(
                  "size-3.5 transition-transform duration-200",
                  isExpanded && "rotate-180"
                )}
                aria-hidden="true"
              />
            </Button>
          ) : null}
        </div>
      </div>

      {isExpanded && canExpand && snapshot ? (
        <div
          id={breakdownId}
          className="border-t border-border/60 bg-black/20 px-4 py-3"
        >
          <SectorBreakdown
            sector={sector}
            assetType={assetType}
            components={snapshot.componentsJson}
          />
        </div>
      ) : null}
    </div>
  )
}
