"use client"

import { useEffect, useMemo, useState, useSyncExternalStore } from "react"
import { createPortal } from "react-dom"
import { ThresholdSliderInput } from "@/components/alerts/threshold-slider-input"
import { WatchlistAssetCombobox } from "@/components/alerts/watchlist-asset-combobox"
import { Button } from "@/components/ui/button"
import { PageActionButton } from "@/components/ui/page-action-button"
import { SegmentedControl } from "@/components/ui/segmented-control"
import {
  buildAlertRulePreview,
  type AlertRuleDto,
  type AlertRuleInitialValues,
  type AlertWatchlistOption,
} from "@/lib/alerts/types"

type CreateAlertRuleDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  watchlist: AlertWatchlistOption[]
  onRuleCreated: (rule: AlertRuleDto) => void
  formSession: number
  initialValues?: AlertRuleInitialValues | null
}

const defaultAssetId = (
  watchlist: AlertWatchlistOption[],
  initialValues?: AlertRuleInitialValues | null
) => initialValues?.assetId ?? watchlist[0]?.assetId ?? ""

const SCOPE_OPTIONS = [
  { value: "composite" as const, label: "Composite" },
  { value: "sector" as const, label: "Sector" },
]

const SECTOR_OPTIONS = [
  { value: "macro" as const, label: "Macro" },
  { value: "relativity" as const, label: "Relativity" },
  { value: "volume" as const, label: "Volume" },
]

const emptySubscribe = () => () => {}

const useIsClient = () =>
  useSyncExternalStore(emptySubscribe, () => true, () => false)

type CreateAlertRuleFormProps = {
  watchlist: AlertWatchlistOption[]
  initialValues?: AlertRuleInitialValues | null
  onRuleCreated: (rule: AlertRuleDto) => void
  onClose: () => void
}

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
    {children}
  </span>
)

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

  const selectedAsset = watchlist.find((item) => item.assetId === assetId) ?? watchlist[0]
  const thresholdValue = Number(threshold)

  const previewText = useMemo(() => {
    if (!selectedAsset || Number.isNaN(thresholdValue)) {
      return "Alert me when your selected asset crosses the threshold."
    }

    return buildAlertRulePreview({
      symbol: selectedAsset.symbol,
      scope,
      sector: scope === "sector" ? sector : null,
      threshold: thresholdValue,
    })
  }, [scope, sector, selectedAsset, thresholdValue])

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

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

  const submitLabel = isSubmitting
    ? "Creating…"
    : isDuplicate
      ? "Create duplicate"
      : "Create"

  const dialogTitle = isDuplicate ? "Duplicate alert rule" : "Create alert rule"

  return (
    <form
      onSubmit={handleCreate}
      className="space-y-4"
      style={{ padding: "1.25rem" }}
      aria-label={dialogTitle}
    >
      <header className="border-b border-white/10 pb-3">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          {dialogTitle}
        </h2>
        <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
          Choose a watchlist asset and the score level that should trigger a Telegram alert.
        </p>
      </header>

      <div className="space-y-4">
        <section className="space-y-2">
          <FieldLabel>Asset</FieldLabel>
          <WatchlistAssetCombobox items={watchlist} value={assetId} onChange={setAssetId} />
        </section>

        <section className="space-y-2">
          <FieldLabel>Scope</FieldLabel>
          <SegmentedControl
            options={SCOPE_OPTIONS}
            value={scope}
            onChange={setScope}
            ariaLabel="Alert scope"
            className="border-white/12 bg-black/20"
          />
        </section>

        {scope === "sector" ? (
          <section className="space-y-2">
            <FieldLabel>Sector</FieldLabel>
            <SegmentedControl
              options={SECTOR_OPTIONS}
              value={sector}
              onChange={setSector}
              ariaLabel="Alert sector"
              className="border-white/12 bg-black/20"
            />
          </section>
        ) : null}

        <section className="space-y-2">
          <FieldLabel>Threshold (above)</FieldLabel>
          <ThresholdSliderInput value={threshold} onChange={setThreshold} />
        </section>
      </div>

      <section
        className="rounded-xl border border-white/10 bg-black/20 px-4 py-3"
        aria-live="polite"
        aria-atomic="true"
      >
        <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          Rule preview
        </p>
        <p className="mt-1.5 text-sm leading-6 text-foreground">{previewText}</p>
      </section>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          type="button"
          variant="outline"
          className="h-10 w-full"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <PageActionButton
          type="submit"
          disabled={isSubmitting}
          className="h-10 w-full justify-center"
          aria-label={isDuplicate ? "Create duplicate alert rule" : "Create alert rule"}
        >
          {submitLabel}
        </PageActionButton>
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
  const mounted = useIsClient()

  const handleClose = () => {
    onOpenChange(false)
  }

  useEffect(() => {
    if (!open) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [onOpenChange, open])

  if (!open || !mounted) {
    return null
  }

  return (
    createPortal(
      <div
        role="presentation"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
          display: "grid",
          placeItems: "center",
          padding: "1rem",
          backgroundColor: "rgba(0, 0, 0, 0.82)",
          backdropFilter: "blur(6px)",
        }}
        onClick={handleClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label={initialValues ? "Duplicate alert rule" : "Create alert rule"}
          style={{
            position: "relative",
            zIndex: 9999,
            width: "min(calc(100vw - 2rem), 32rem)",
            maxHeight: "calc(100dvh - 2rem)",
            overflow: "visible",
            borderRadius: "1rem",
            border: "1px solid rgba(255, 255, 255, 0.24)",
            background:
              "linear-gradient(180deg, rgba(32, 32, 32, 1) 0%, rgba(18, 18, 18, 1) 100%)",
            boxShadow:
              "inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 28px 90px rgba(0, 0, 0, 0.82)",
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <CreateAlertRuleForm
            key={`${formSession}-${initialValues?.assetId ?? "new"}`}
            watchlist={watchlist}
            initialValues={initialValues}
            onRuleCreated={onRuleCreated}
            onClose={handleClose}
          />
        </div>
      </div>,
      document.body
    )
  )
}
