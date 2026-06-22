import { BreakdownTable } from "@/components/scores/breakdown-table"
import {
  buildCompositeBreakdownRows,
  buildMacroBreakdownRows,
  buildRelativityBreakdownRows,
  buildVolumeBreakdownRows,
} from "@/lib/scores/breakdown"

import type { AssetType } from "@/lib/assets/types"

type SectorBreakdownProps = {
  sector: string
  assetType: AssetType
  components: Record<string, unknown> | null
}

export const SectorBreakdown = ({ sector, assetType, components }: SectorBreakdownProps) => {
  if (!components || Object.keys(components).length === 0) {
    return <p className="text-sm text-muted-foreground">No component breakdown available.</p>
  }

  if (components.error !== undefined && sector !== "volume") {
    return <p className="text-sm text-destructive">{String(components.error)}</p>
  }

  switch (sector) {
    case "macro": {
      const rows = buildMacroBreakdownRows(components, assetType)
      return <BreakdownTable rows={rows} columns="full" />
    }
    case "relativity": {
      const rows = buildRelativityBreakdownRows(components)
      return <BreakdownTable rows={rows} columns="values-only" />
    }
    case "volume": {
      const rows = buildVolumeBreakdownRows(components)
      return <BreakdownTable rows={rows} columns="values-only" />
    }
    case "composite": {
      const rows = buildCompositeBreakdownRows(components)
      const hasInvalid = Array.isArray(components.invalid_sectors)

      return (
        <BreakdownTable
          rows={rows}
          footnote={
            hasInvalid
              ? "Composite is null until Macro, Relativity, and Volume are all valid and non-stale."
              : "Composite is the simple average of the three sector scores."
          }
        />
      )
    }
    default:
      return <p className="text-sm text-muted-foreground">Unknown sector breakdown.</p>
  }
}
