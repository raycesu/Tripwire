"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatRuleLabel, type AlertRuleDto } from "@/lib/alerts/types"

type WatchlistOption = {
  assetId: string
  symbol: string
  name: string
}

type AlertRulesPanelProps = {
  initialRules: AlertRuleDto[]
  watchlist: WatchlistOption[]
}

export const AlertRulesPanel = ({ initialRules, watchlist }: AlertRulesPanelProps) => {
  const router = useRouter()
  const [rules, setRules] = useState(initialRules)
  const [assetId, setAssetId] = useState(watchlist[0]?.assetId ?? "")
  const [scope, setScope] = useState<"composite" | "sector">("composite")
  const [sector, setSector] = useState<"macro" | "relativity" | "volume">("macro")
  const [threshold, setThreshold] = useState("1.5")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

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

      const data: { rule?: AlertRuleDto; error?: string } = await response.json()

      if (!response.ok || !data.rule) {
        setError(data.error ?? "Failed to create alert rule")
        return
      }

      setRules((current) => [data.rule!, ...current])
      router.refresh()
    } catch {
      setError("Failed to create alert rule")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (ruleId: string) => {
    setError(null)

    try {
      const response = await fetch(`/api/alerts/rules/${ruleId}`, { method: "DELETE" })

      if (!response.ok) {
        setError("Failed to delete alert rule")
        return
      }

      setRules((current) => current.filter((rule) => rule.id !== ruleId))
      router.refresh()
    } catch {
      setError("Failed to delete alert rule")
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    setError(null)

    try {
      const response = await fetch("/api/alerts/rules/export")

      if (!response.ok) {
        const data: { error?: string } = await response.json()
        setError(data.error ?? "Failed to export alert rules")
        return
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = "tripwire-alert-rules.json"
      anchor.click()
      URL.revokeObjectURL(url)
    } catch {
      setError("Failed to export alert rules")
    } finally {
      setIsExporting(false)
    }
  }

  const handleToggle = async (rule: AlertRuleDto) => {
    setError(null)

    try {
      const response = await fetch(`/api/alerts/rules/${rule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isEnabled: !rule.isEnabled }),
      })

      const data: { rule?: AlertRuleDto; error?: string } = await response.json()

      if (!response.ok || !data.rule) {
        setError(data.error ?? "Failed to update alert rule")
        return
      }

      setRules((current) =>
        current.map((item) => (item.id === rule.id ? data.rule! : item))
      )
    } catch {
      setError("Failed to update alert rule")
    }
  }

  if (watchlist.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Add assets to your watchlist before creating alert rules.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <form
        onSubmit={handleCreate}
        className="rounded-xl border border-border bg-card p-6"
        aria-label="Create alert rule"
      >
        <h2 className="text-lg font-semibold text-foreground">Create alert rule</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Level-based alerts fire on every fresh qualifying score update.
        </p>

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

        <Button type="submit" className="mt-6" disabled={isSubmitting}>
          {isSubmitting ? "Creating…" : "Create rule"}
        </Button>
      </form>

      <section className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">Your alert rules</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting || rules.length === 0}
            aria-label="Export alert rules as JSON backup"
          >
            {isExporting ? "Exporting…" : "Export rules"}
          </Button>
        </div>

        {rules.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No alert rules yet. Export is available after you create rules for backup.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {rules.map((rule) => (
              <li key={rule.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                <div>
                  <p className="font-medium text-foreground">
                    {rule.assetSymbol} — {formatRuleLabel(rule)}
                  </p>
                  <p className="text-sm text-muted-foreground">{rule.assetName}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={rule.isEnabled ? "success" : "default"}>
                    {rule.isEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggle(rule)}
                    aria-label={`${rule.isEnabled ? "Disable" : "Enable"} alert for ${rule.assetSymbol}`}
                  >
                    {rule.isEnabled ? "Disable" : "Enable"}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(rule.id)}
                    aria-label={`Delete alert for ${rule.assetSymbol}`}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
