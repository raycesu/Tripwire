"use client"

import { useId, useState } from "react"
import { ChevronDownIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SectorBreakdown } from "@/components/scores/sector-breakdown"
import { SectorScoreTube } from "@/components/scores/sector-score-tube"
import { cn } from "@/lib/utils"
import type { AssetType } from "@/lib/assets/types"
import type { ScoreSnapshotView } from "@/lib/scores/types"

type ExpandableSectorScoreTubeProps = {
  label: string
  sector: "macro" | "relativity" | "volume"
  snapshot: ScoreSnapshotView | null
  assetType: AssetType
  className?: string
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

export const ExpandableSectorScoreTube = ({
  label,
  sector,
  snapshot,
  assetType,
  className,
}: ExpandableSectorScoreTubeProps) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const breakdownId = useId()
  const canExpand = hasBreakdown(snapshot, sector)

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
    <SectorScoreTube
      label={label}
      snapshot={snapshot}
      className={className}
      labelAction={
        canExpand ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="size-5 text-silver-dim hover:text-foreground"
            aria-expanded={isExpanded}
            aria-controls={breakdownId}
            aria-label={`${isExpanded ? "Hide" : "Show"} ${label} breakdown`}
            onClick={handleToggle}
            onKeyDown={handleKeyDown}
          >
            <ChevronDownIcon
              className={cn(
                "size-3.5 transition-transform duration-200",
                isExpanded && "rotate-180"
              )}
              aria-hidden="true"
            />
          </Button>
        ) : null
      }
    >
      {isExpanded && canExpand && snapshot ? (
        <div
          id={breakdownId}
          className="mt-1 rounded-md border border-border/60 bg-black/20 p-2"
        >
          <SectorBreakdown
            sector={sector}
            assetType={assetType}
            components={snapshot.componentsJson}
          />
        </div>
      ) : null}
    </SectorScoreTube>
  )
}
