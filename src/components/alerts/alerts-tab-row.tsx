"use client"

import { Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { PageActionButton } from "@/components/ui/page-action-button"
import { cn } from "@/lib/utils"

export type AlertsPageTab = "rules" | "history"

type AlertsTabRowProps = {
  activeTab: AlertsPageTab
  onTabChange: (tab: AlertsPageTab) => void
  activeRulesCount: number
  historyTotalCount: number
  onNewRule: () => void
  assetSymbols: string[]
  historyFilterSymbol: string
  onHistoryFilterChange: (symbol: string) => void
}

const handleTabKeyDown = (
  event: React.KeyboardEvent<HTMLButtonElement>,
  tab: AlertsPageTab,
  onTabChange: (tab: AlertsPageTab) => void
) => {
  if (event.key !== "Enter" && event.key !== " ") {
    return
  }

  event.preventDefault()
  onTabChange(tab)
}

const tabButtonClassName = (isActive: boolean) =>
  cn(
    "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors",
    isActive
      ? "bg-white/8 font-medium text-foreground"
      : "bg-transparent font-normal text-muted-foreground"
  )

export const AlertsTabRow = ({
  activeTab,
  onTabChange,
  activeRulesCount,
  historyTotalCount,
  onNewRule,
  assetSymbols,
  historyFilterSymbol,
  onHistoryFilterChange,
}: AlertsTabRowProps) => (
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div
      className="flex items-center gap-2"
      role="tablist"
      aria-label="Alerts sections"
    >
      <button
        type="button"
        role="tab"
        tabIndex={0}
        aria-selected={activeTab === "rules"}
        aria-controls="alerts-rules-panel"
        className={tabButtonClassName(activeTab === "rules")}
        onClick={() => onTabChange("rules")}
        onKeyDown={(event) => handleTabKeyDown(event, "rules", onTabChange)}
      >
        Rules
        <Badge
          variant={activeTab === "rules" ? "success" : "default"}
          className="rounded-full px-1.5 py-0 text-[10px]"
        >
          {activeRulesCount} active
        </Badge>
      </button>

      <button
        type="button"
        role="tab"
        tabIndex={0}
        aria-selected={activeTab === "history"}
        aria-controls="alerts-history-panel"
        className={tabButtonClassName(activeTab === "history")}
        onClick={() => onTabChange("history")}
        onKeyDown={(event) => handleTabKeyDown(event, "history", onTabChange)}
      >
        History
        <Badge variant="default" className="rounded-full px-1.5 py-0 text-[10px]">
          {historyTotalCount} total
        </Badge>
      </button>
    </div>

    {activeTab === "rules" ? (
      <PageActionButton onClick={onNewRule} aria-label="Create a new alert rule">
        <Plus className="size-3.5" aria-hidden="true" />
        New
      </PageActionButton>
    ) : assetSymbols.length > 1 ? (
      <select
        value={historyFilterSymbol}
        onChange={(event) => onHistoryFilterChange(event.target.value)}
        className="rounded-md border border-border bg-muted/40 px-2 py-1 text-sm text-foreground"
        aria-label="Filter alert history by asset"
      >
        <option value="all">All assets</option>
        {assetSymbols.map((symbol) => (
          <option key={symbol} value={symbol}>
            {symbol}
          </option>
        ))}
      </select>
    ) : null}
  </div>
)
