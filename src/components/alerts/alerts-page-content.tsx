"use client"

import { useCallback, useRef, useState } from "react"
import { AlertHistoryTimeline } from "@/components/alerts/alert-history-timeline"
import { AlertRulesPanel } from "@/components/alerts/alert-rules-panel"
import {
  AlertsTabRow,
  type AlertsPageTab,
} from "@/components/alerts/alerts-tab-row"
import type { AlertEventDto, AlertRuleDto, AlertWatchlistOption } from "@/lib/alerts/types"

type AlertsPageContentProps = {
  initialRules: AlertRuleDto[]
  watchlist: AlertWatchlistOption[]
  alertEvents: AlertEventDto[]
  assetSymbols: string[]
}

export const AlertsPageContent = ({
  initialRules,
  watchlist,
  alertEvents,
  assetSymbols,
}: AlertsPageContentProps) => {
  const [activeTab, setActiveTab] = useState<AlertsPageTab>("rules")
  const [historyFilterSymbol, setHistoryFilterSymbol] = useState("all")
  const [activeRulesCount, setActiveRulesCount] = useState(
    () => initialRules.filter((rule) => rule.isEnabled).length
  )

  const openCreateRef = useRef<(() => void) | null>(null)

  const handleRulesCountsChange = useCallback(
    (counts: { activeCount: number; totalCount: number }) => {
      setActiveRulesCount(counts.activeCount)
    },
    []
  )

  const handleBindNewRule = useCallback((openCreate: () => void) => {
    openCreateRef.current = openCreate
  }, [])

  const handleNewRule = () => {
    openCreateRef.current?.()
  }

  const handleHistoryFilterChange = (symbol: string) => {
    setHistoryFilterSymbol(symbol)
  }

  return (
    <div className="flex flex-col gap-4">
      <AlertsTabRow
        activeTab={activeTab}
        onTabChange={setActiveTab}
        activeRulesCount={activeRulesCount}
        historyTotalCount={alertEvents.length}
        onNewRule={handleNewRule}
        assetSymbols={assetSymbols}
        historyFilterSymbol={historyFilterSymbol}
        onHistoryFilterChange={handleHistoryFilterChange}
      />

      {activeTab === "rules" ? (
        <div id="alerts-rules-panel" role="tabpanel" aria-label="Alert rules">
          <AlertRulesPanel
            initialRules={initialRules}
            watchlist={watchlist}
            onRulesCountsChange={handleRulesCountsChange}
            onBindNewRule={handleBindNewRule}
          />
        </div>
      ) : (
        <div id="alerts-history-panel" role="tabpanel" aria-label="Alert history">
          <AlertHistoryTimeline
            key={historyFilterSymbol}
            events={alertEvents}
            filterSymbol={historyFilterSymbol}
          />
        </div>
      )}
    </div>
  )
}
