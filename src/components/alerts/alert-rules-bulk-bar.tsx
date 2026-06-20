"use client"

import { Pause, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type AlertRulesBulkBarProps = {
  selectedCount: number
  isBusy: boolean
  onDisable: () => void
  onDelete: () => void
  onClear: () => void
  className?: string
}

export const AlertRulesBulkBar = ({
  selectedCount,
  isBusy,
  onDisable,
  onDelete,
  onClear,
  className,
}: AlertRulesBulkBarProps) => {
  if (selectedCount === 0) {
    return null
  }

  const label = selectedCount === 1 ? "1 rule selected" : `${selectedCount} rules selected`

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2.5",
        className
      )}
    >
      <p className="text-sm font-medium text-foreground">{label}</p>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isBusy}
          onClick={onDisable}
          aria-label={`Disable ${selectedCount} selected rules`}
        >
          <Pause aria-hidden="true" />
          Disable
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={isBusy}
          onClick={onDelete}
          aria-label={`Delete ${selectedCount} selected rules`}
        >
          <Trash2 aria-hidden="true" />
          Delete
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={isBusy}
          onClick={onClear}
          aria-label="Clear selection"
        >
          <X aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
