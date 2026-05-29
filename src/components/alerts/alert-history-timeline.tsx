"use client"

import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { formatScore } from "@/lib/scores/labels"
import type { AlertEventDto } from "@/lib/alerts/types"

type AlertHistoryTimelineProps = {
  events: AlertEventDto[]
  assetSymbols: string[]
}

const statusVariant = (
  status: string
): "success" | "destructive" | "warning" | "default" => {
  if (status === "sent") {
    return "success"
  }

  if (status === "failed") {
    return "destructive"
  }

  if (status === "skipped_rate_limited") {
    return "warning"
  }

  return "default"
}

const formatEventTime = (date: Date): string => {
  return date.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export const AlertHistoryTimeline = ({ events, assetSymbols }: AlertHistoryTimelineProps) => {
  const [filterSymbol, setFilterSymbol] = useState<string>("all")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filteredEvents = useMemo(() => {
    if (filterSymbol === "all") {
      return events
    }

    return events.filter((event) => event.assetSymbol === filterSymbol)
  }, [events, filterSymbol])

  if (events.length === 0) {
    return (
      <EmptyState
        title="No alerts fired yet"
        description="Create a rule and wait for the next scoring run. Initial-match alerts fire when the latest score already qualifies."
        actionHref="/assets"
        actionLabel="Browse assets"
      />
    )
  }

  return (
    <div className="space-y-4">
      {assetSymbols.length > 1 ? (
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Filter by asset</span>
          <select
            value={filterSymbol}
            onChange={(event) => setFilterSymbol(event.target.value)}
            className="rounded-md border border-border bg-muted/40 px-2 py-1 text-foreground"
            aria-label="Filter alert history by asset"
          >
            <option value="all">All assets</option>
            {assetSymbols.map((symbol) => (
              <option key={symbol} value={symbol}>
                {symbol}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <ul className="divide-y divide-border" aria-label="Alert delivery history">
        {filteredEvents.map((event) => {
          const isExpanded = expandedId === event.id
          const isLongMessage = event.message.length > 120

          return (
            <li key={event.id} className="py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">
                    {event.assetSymbol} · {event.ruleLabel}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatEventTime(event.createdAt)}
                    {event.sentAt ? ` · sent ${formatEventTime(event.sentAt)}` : null}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-foreground">
                    {formatScore(String(event.triggeredValue))}
                  </span>
                  <Badge variant={statusVariant(event.telegramStatus)}>
                    {event.telegramStatus.replace(/_/g, " ")}
                  </Badge>
                </div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {isExpanded || !isLongMessage ? event.message : `${event.message.slice(0, 120)}…`}
              </p>
              {isLongMessage ? (
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : event.id)}
                  className="mt-1 text-xs text-foreground underline-offset-4 hover:underline"
                >
                  {isExpanded ? "Show less" : "Show full message"}
                </button>
              ) : null}
              {event.telegramError ? (
                <p className="mt-1 text-xs text-destructive">{event.telegramError}</p>
              ) : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
