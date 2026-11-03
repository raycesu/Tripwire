"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

type AlertRulesHeaderProps = {
  activeCount: number
  totalCount: number
  onNewRule: () => void
}

export const AlertRulesHeader = ({
  activeCount,
  totalCount,
  onNewRule,
}: AlertRulesHeaderProps) => (
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div className="flex flex-wrap items-baseline gap-2">
      <h2 className="text-lg font-semibold text-foreground">Alert rules</h2>
      <p className="text-sm text-muted-foreground">
        {activeCount} active · {totalCount} total
      </p>
    </div>
    <Button
      type="button"
      size="sm"
      onClick={onNewRule}
      aria-label="Create a new alert rule"
    >
      <Plus aria-hidden="true" />
      New rule
    </Button>
  </div>
)
