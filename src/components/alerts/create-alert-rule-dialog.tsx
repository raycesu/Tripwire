"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogBackdrop,
  DialogDescription,
  DialogPopup,
  DialogPortal,
  DialogTitle,
  DialogViewport,
} from "@/components/ui/dialog"
import type { AlertRuleInitialValues } from "@/lib/alerts/types"
import type { AlertRuleDto } from "@/lib/alerts/types"

type WatchlistOption = {
  assetId: string
  symbol: string
  name: string
}

type CreateAlertRuleDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  watchlist: WatchlistOption[]
  onRuleCreated: (rule: AlertRuleDto) => void
  formSession: number
  initialValues?: AlertRuleInitialValues | null
}

const defaultAssetId = (watchlist: WatchlistOption[], initialValues?: AlertRuleInitialValues | null) =>
  initialValues?.assetId ?? watchlist[0]?.assetId ?? ""

type CreateAlertRuleFormProps = {
  watchlist: WatchlistOption[]
  initialValues?: AlertRuleInitialValues | null
  onRuleCreated: (rule: AlertRuleDto) => void
  onClose: () => void
}

const CreateAlertRuleForm = ({
  watchlist,
  initialValues,
  onRuleCreated,
  onClose,
}: CreateAlertRuleFormProps) => {
  const [assetId, setAssetId] = useState(defaultAssetId(watchlist, initialValues))
  const [scope, setScope] = useState<"composite" | "sector">(initialValues?.scope ?? "composite")
  const [sector, setSector] = useState<"macro" | "relativity" | "volume">(
    initialValues?.sector ?? "macro"
  )
  const [threshold, setThreshold] = useState(
    initialValues ? String(initialValues.threshold) : "1.5"
  )
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isDuplicate = initialValues !== null && initialValues !== undefined

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const thresholdValue = Number(threshold)

    if (Number.isNaN(thresholdValue) || thresholdValue < -2 || thresholdValue > 2) {
      setError("Threshold must be between -2 and 2")
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch("/api/alerts/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId,
          scope,
          sector: scope === "sector" ? sector : undefined,
          operator: "above",
          threshold: thresholdValue,
          cooldownMinutes: 0,
        }),
      })

      const data: { rule?: AlertRuleDto; error?: string; code?: string } = await response.json()

      if (!response.ok || !data.rule) {
        if (response.status === 409) {
          setError("A rule with the same asset and condition already exists")
        } else {
          setError(data.error ?? "Failed to create alert rule")
        }
        return
      }

      onRuleCreated(data.rule)
      onClose()
    } catch {
      setError("Failed to create alert rule")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleCreate} aria-label={isDuplicate ? "Duplicate alert rule" : "Create alert rule"}>
      <DialogTitle>{isDuplicate ? "Duplicate alert rule" : "Create alert rule"}</DialogTitle>
      <DialogDescription className="mt-1">
        Level-based alerts fire on every fresh qualifying score update.
      </DialogDescription>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted-foreground">Asset</span>
          <select
            value={assetId}
            onChange={(event) => setAssetId(event.target.value)}
            className="h-9 rounded-lg border border-border bg-background px-3"
            required
          >
            {watchlist.map((item) => (
              <option key={item.assetId} value={item.assetId}>
                {item.symbol} — {item.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted-foreground">Scope</span>
          <select
            value={scope}
            onChange={(event) => setScope(event.target.value as "composite" | "sector")}
            className="h-9 rounded-lg border border-border bg-background px-3"
          >
            <option value="composite">Composite</option>
            <option value="sector">Sector</option>
          </select>
        </label>

        {scope === "sector" ? (
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted-foreground">Sector</span>
            <select
              value={sector}
              onChange={(event) =>
                setSector(event.target.value as "macro" | "relativity" | "volume")
              }
              className="h-9 rounded-lg border border-border bg-background px-3"
            >
              <option value="macro">Macro</option>
              <option value="relativity">Relativity</option>
              <option value="volume">Volume</option>
            </select>
          </label>
        ) : null}

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted-foreground">Threshold (above)</span>
          <input
            type="number"
            step="0.01"
            min={-2}
            max={2}
            value={threshold}
            onChange={(event) => setThreshold(event.target.value)}
            className="h-9 rounded-lg border border-border bg-background px-3"
            required
          />
        </label>
      </div>

      {error ? (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating…" : isDuplicate ? "Create duplicate" : "Create rule"}
        </Button>
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

export const CreateAlertRuleDialog = ({
  open,
  onOpenChange,
  watchlist,
  onRuleCreated,
  formSession,
  initialValues = null,
}: CreateAlertRuleDialogProps) => {
  const handleClose = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogBackdrop />
        <DialogViewport>
          <DialogPopup opaque className="w-full max-w-md p-6">
            {open ? (
              <CreateAlertRuleForm
                key={`${formSession}-${initialValues?.assetId ?? "new"}`}
                watchlist={watchlist}
                initialValues={initialValues}
                onRuleCreated={onRuleCreated}
                onClose={handleClose}
              />
            ) : null}
          </DialogPopup>
        </DialogViewport>
      </DialogPortal>
    </Dialog>
  )
}
