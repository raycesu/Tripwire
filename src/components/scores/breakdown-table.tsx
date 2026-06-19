"use client"

import { InfoIcon } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { BreakdownRow } from "@/lib/scores/breakdown"

type BreakdownTableProps = {
  rows: BreakdownRow[]
  footnote?: string
  columns?: "full" | "values-only"
}

const BreakdownLabelCell = ({ row }: { row: BreakdownRow }) => {
  if (!row.tooltip) {
    return (
      <td className="py-2 pr-2">
        <span className="text-foreground">{row.label}</span>
        {row.detail ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{row.detail}</p>
        ) : null}
      </td>
    )
  }

  return (
    <td className="py-2 pr-2">
      <Tooltip>
        <TooltipTrigger
          className="inline-flex items-center gap-1 text-left text-foreground underline decoration-dotted decoration-muted-foreground/50 underline-offset-2"
          aria-label={`${row.label}: more info`}
        >
          <span>{row.label}</span>
          <InfoIcon className="size-3 shrink-0 text-muted-foreground" aria-hidden="true" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-left leading-relaxed">
          {row.tooltip}
        </TooltipContent>
      </Tooltip>
      {row.detail ? (
        <p className="mt-0.5 text-xs text-muted-foreground">{row.detail}</p>
      ) : null}
    </td>
  )
}

export const BreakdownTable = ({
  rows,
  footnote,
  columns = "full",
}: BreakdownTableProps) => {
  if (rows.length === 0) {
    return null
  }

  const isValuesOnly = columns === "values-only"

  return (
    <div className="space-y-2">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="pb-2 font-medium">Component</th>
            <th className="pb-2 font-medium">Value</th>
            {!isValuesOnly ? (
              <>
                <th className="pb-2 font-medium text-right">Sub-score</th>
                <th className="pb-2 font-medium text-right">Weight</th>
              </>
            ) : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={row.label}>
              <BreakdownLabelCell row={row} />
              <td className="py-2 font-mono text-muted-foreground">{row.value}</td>
              {!isValuesOnly ? (
                <>
                  <td className="py-2 text-right font-mono">{row.score ?? "—"}</td>
                  <td className="py-2 text-right font-mono text-muted-foreground">
                    {row.weight ?? "—"}
                  </td>
                </>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
      {footnote ? <p className="text-xs text-muted-foreground">{footnote}</p> : null}
    </div>
  )
}
