"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogBackdrop,
  DialogPopup,
  DialogPortal,
  DialogViewport,
} from "@/components/ui/dialog"
import { PageActionButton } from "@/components/ui/page-action-button"
import {
  cooldownDaysToMinutes,
  cooldownMinutesToDays,
  formatConditionPill,
  type AlertRuleDto,
} from "@/lib/alerts/types"

type EditAlertRuleDialogProps = {
  rule: AlertRuleDto | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRuleUpdated: (rule: AlertRuleDto) => void
}

export const EditAlertRuleDialog = ({
  rule,
  open,
  onOpenChange,
  onRuleUpdated,
}: EditAlertRuleDialogProps) => {
  const handleClose = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogBackdrop />
        <DialogViewport>
          <DialogPopup opaque className="w-full max-w-md p-6">
            {open && rule ? (
              <EditAlertRuleForm
                key={rule.id}
                rule={rule}
                onRuleUpdated={onRuleUpdated}
                onClose={handleClose}
              />
            ) : null}
          </DialogPopup>
        </DialogViewport>
      </DialogPortal>
    </Dialog>
  )
}

type EditAlertRuleFormProps = {
  rule: AlertRuleDto
  onRuleUpdated: (rule: AlertRuleDto) => void
  onClose: () => void
}

const EditAlertRuleForm = ({ rule, onRuleUpdated, onClose }: EditAlertRuleFormProps) => {
  const [threshold, setThreshold] = useState(String(rule.threshold))
  const [cooldownDays, setCooldownDays] = useState(String(cooldownMinutesToDays(rule.cooldownMinutes)))
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const thresholdValue = Number(threshold)

  const previewCondition = useMemo(() => {
    if (Number.isNaN(thresholdValue)) {
      return formatConditionPill(rule)
    }

    return formatConditionPill({
      scope: rule.scope,
      sector: rule.sector,
      threshold: thresholdValue,
    })
  }, [rule, thresholdValue])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const thresholdValue = Number(threshold)
    const cooldownValue = Number(cooldownDays)

    if (Number.isNaN(thresholdValue) || thresholdValue < -2 || thresholdValue > 2) {
      setError("Threshold must be between -2 and 2")
      setIsSubmitting(false)
      return
    }

    if (Number.isNaN(cooldownValue) || cooldownValue < 0 || !Number.isInteger(cooldownValue)) {
      setError("Cooldown must be a whole number of days, zero or greater")
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch(`/api/alerts/rules/${rule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threshold: thresholdValue,
          cooldownMinutes: cooldownDaysToMinutes(cooldownValue),
        }),
      })

      const data: { rule?: AlertRuleDto; error?: string } = await response.json()

      if (!response.ok || !data.rule) {
        setError(data.error ?? "Failed to update alert rule")
        return
      }

      onRuleUpdated(data.rule)
      onClose()
    } catch {
      setError("Failed to update alert rule")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-label="Edit alert rule">
      <header className="border-b border-white/10 pb-3">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Edit Alert Rule</h2>
      </header>

      <div className="space-y-4">
        <div
          className="rounded-lg border border-border/60 bg-white/5 px-3 py-2.5 text-sm"
          aria-live="polite"
          aria-atomic="true"
        >
          <p className="font-medium text-foreground">
            {rule.assetSymbol} — {previewCondition}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
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

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted-foreground">Cooldown (days)</span>
            <input
              type="number"
              step="1"
              min={0}
              value={cooldownDays}
              onChange={(event) => setCooldownDays(event.target.value)}
              className="h-9 rounded-lg border border-border bg-background px-3"
              required
            />
          </label>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <PageActionButton
          type="submit"
          disabled={isSubmitting}
          aria-label="Save alert rule changes"
        >
          {isSubmitting ? "Saving…" : "Save changes"}
        </PageActionButton>
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
