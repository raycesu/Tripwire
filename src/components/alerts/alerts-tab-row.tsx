"use client"

import { Plus } from "lucide-react"
import { AlertHistoryAssetFilter } from "@/components/alerts/alert-history-asset-filter"
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

type AlertsTabButtonProps = {
  isActive: boolean
  label: string
  panelId: string
  badge: React.ReactNode
  onSelect: () => void
}

const handleTabKeyDown = (
  event: React.KeyboardEvent<HTMLButtonElement>,
  onSelect: () => void
) => {
  if (event.key !== "Enter" && event.key !== " ") {
    return
  }

  event.preventDefault()
  onSelect()
}

const AlertsTabButton = ({
  isActive,
  label,
  panelId,
  badge,
  onSelect,
}: AlertsTabButtonProps) => (
  <button
    type="button"
    role="tab"
    tabIndex={0}
    aria-selected={isActive}
    aria-controls={panelId}
    className="appearance-none border-0 bg-transparent p-0"
    onClick={onSelect}
    onKeyDown={(event) => handleTabKeyDown(event, onSelect)}
  >
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-base leading-tight transition-colors",
        isActive
          ? "font-medium text-foreground"
          : "font-normal text-muted-foreground hover:bg-white/5 hover:text-foreground"
      )}
      style={isActive ? { backgroundColor: "#333333" } : undefined}
    >
      {label}
      {badge}
    </span>
  </button>
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
    <div className="flex items-center gap-2" role="tablist" aria-label="Alerts sections">
      <AlertsTabButton
        isActive={activeTab === "rules"}
        label="Rules"
        panelId="alerts-rules-panel"
        badge={
          <Badge variant="success" className="rounded-full px-2 py-0.5 text-[10px]">
            {activeRulesCount} active
          </Badge>
        }
        onSelect={() => onTabChange("rules")}
      />

      <AlertsTabButton
        isActive={activeTab === "history"}
        label="History"
        panelId="alerts-history-panel"
        badge={
          <Badge variant="default" className="rounded-full px-2 py-0.5 text-[10px]">
            {historyTotalCount} total
          </Badge>
        }
        onSelect={() => onTabChange("history")}
      />
    </div>

    {activeTab === "rules" ? (
      <PageActionButton onClick={onNewRule} aria-label="Create a new alert rule">
        <Plus className="size-3.5" aria-hidden="true" />
        New
      </PageActionButton>
    ) : assetSymbols.length > 1 ? (
      <AlertHistoryAssetFilter
        assetSymbols={assetSymbols}
        value={historyFilterSymbol}
        onChange={onHistoryFilterChange}
      />
    ) : null}
  </div>
)
