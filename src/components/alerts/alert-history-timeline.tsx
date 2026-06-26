"use client"

import { useMemo, useState } from "react"
import { AlertRulesPagination } from "@/components/alerts/alert-rules-pagination"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import type { AlertEventDto } from "@/lib/alerts/types"
import { getScoreTextColorClass } from "@/lib/scores/colors"
import { formatScore } from "@/lib/scores/labels"
import { cn } from "@/lib/utils"

type AlertHistoryTimelineProps = {
  events: AlertEventDto[]
  filterSymbol: string
}

const PAGE_SIZE = 10

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

const formatStatusLabel = (status: string): string => {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

const formatEventTime = (date: Date): string => {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

type SectorChipProps = {
  label: string
  score: number | null
}

const SectorChip = ({ label, score }: SectorChipProps) => (
  <span className="inline-flex items-center rounded-md border border-border/60 bg-muted/40 px-3 font-mono text-xs font-medium tabular-nums text-foreground">
    {label} {score === null ? "—" : formatScore(String(score))}
  </span>
)

export const AlertHistoryTimeline = ({
  events,
  filterSymbol,
}: AlertHistoryTimelineProps) => {
  const [currentPage, setCurrentPage] = useState(1)

  const filteredEvents = useMemo(() => {
    if (filterSymbol === "all") {
      return events
    }

    return events.filter((event) => event.assetSymbol === filterSymbol)
  }, [events, filterSymbol])

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)

  const pageEvents = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return filteredEvents.slice(start, start + PAGE_SIZE)
  }, [filteredEvents, safePage])

  if (events.length === 0) {
    return (
      <EmptyState
        title="No alerts fired yet"
        description="Create a rule and wait for the next scoring run. Initial-match alerts fire when the latest score already qualifies."
        actionHref="/dashboard"
        actionLabel="Back to watchlist"
      />
    )
  }

  return (
    <div>
      {filteredEvents.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No alerts for this asset yet.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <ul className="min-w-[640px] divide-y divide-border" aria-label="Alert delivery history">
              {pageEvents.map((event) => {
                const compositeScore = event.sectorScores.composite ?? event.triggeredValue
                const eventTime = event.sentAt ?? event.createdAt

                return (
                  <li key={event.id} className="py-3">
                    <div className="flex items-stretch gap-4">
                      <div className="flex min-w-[100px] shrink-0 flex-col justify-center">
                        <p className="font-medium text-foreground">{event.assetSymbol}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatEventTime(eventTime)}
                        </p>
                      </div>

                      <div className="flex w-16 shrink-0 items-center">
                        <span
                          className={cn(
                            "font-mono text-sm font-medium tabular-nums",
                            getScoreTextColorClass(compositeScore)
                          )}
                        >
                          {formatScore(String(compositeScore))}
                        </span>
                      </div>

                      <div className="flex min-w-0 flex-1 items-stretch gap-2">
                        <SectorChip label="Macro" score={event.sectorScores.macro} />
                        <SectorChip label="Relativity" score={event.sectorScores.relativity} />
                        <SectorChip label="Volume" score={event.sectorScores.volume} />
                      </div>

                      <div className="flex shrink-0 items-center">
                        <Badge
                          variant={statusVariant(event.telegramStatus)}
                          className="rounded-full px-2 py-0.5 text-xs"
                        >
                          {formatStatusLabel(event.telegramStatus)}
                        </Badge>
                      </div>
                    </div>

                    {event.telegramError ? (
                      <p className="mt-1 text-xs text-destructive">{event.telegramError}</p>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          </div>

          <AlertRulesPagination
            currentPage={safePage}
            totalPages={totalPages}
            totalItems={filteredEvents.length}
            pageSize={PAGE_SIZE}
            itemLabel=""
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  )
}
