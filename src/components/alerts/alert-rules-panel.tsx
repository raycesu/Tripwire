"use client"

import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { AlertRulesBulkBar } from "@/components/alerts/alert-rules-bulk-bar"
import { AlertRulesHeader } from "@/components/alerts/alert-rules-header"
import { AlertRulesPagination } from "@/components/alerts/alert-rules-pagination"
import { AlertRulesTable } from "@/components/alerts/alert-rules-table"
import {
  AlertRulesToolbar,
  type AlertRulesFilterTab,
} from "@/components/alerts/alert-rules-toolbar"
import { CreateAlertRuleDialog } from "@/components/alerts/create-alert-rule-dialog"
import { EditAlertRuleDialog } from "@/components/alerts/edit-alert-rule-dialog"
import {
  formatConditionPill,
  type AlertRuleDto,
  type AlertRuleInitialValues,
} from "@/lib/alerts/types"

const PAGE_SIZE = 8

type WatchlistOption = {
  assetId: string
  symbol: string
  name: string
}

type AlertRulesPanelProps = {
  initialRules: AlertRuleDto[]
  watchlist: WatchlistOption[]
}

const filterRules = (
  rules: AlertRuleDto[],
  filterTab: AlertRulesFilterTab,
  searchQuery: string
): AlertRuleDto[] => {
  const query = searchQuery.trim().toLowerCase()

  return rules.filter((rule) => {
    if (filterTab === "crypto" && rule.assetType !== "crypto") {
      return false
    }

    if (filterTab === "stock" && rule.assetType !== "stock") {
      return false
    }

    if (filterTab === "disabled" && rule.isEnabled) {
      return false
    }

    if (!query) {
      return true
    }

    const condition = formatConditionPill(rule).toLowerCase()

    return (
      rule.assetSymbol.toLowerCase().includes(query) ||
      rule.assetName.toLowerCase().includes(query) ||
      condition.includes(query)
    )
  })
}

export const AlertRulesPanel = ({ initialRules, watchlist }: AlertRulesPanelProps) => {
  const router = useRouter()
  const [rules, setRules] = useState(initialRules)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterTab, setFilterTab] = useState<AlertRulesFilterTab>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createSession, setCreateSession] = useState(0)
  const [createInitialValues, setCreateInitialValues] = useState<AlertRuleInitialValues | null>(
    null
  )
  const [editingRule, setEditingRule] = useState<AlertRuleDto | null>(null)
  const [togglingRuleId, setTogglingRuleId] = useState<string | null>(null)
  const [isBulkBusy, setIsBulkBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activeCount = rules.filter((rule) => rule.isEnabled).length
  const totalCount = rules.length

  const filteredRules = useMemo(
    () => filterRules(rules, filterTab, searchQuery),
    [rules, filterTab, searchQuery]
  )

  const totalPages = Math.max(1, Math.ceil(filteredRules.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)

  const pageRules = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return filteredRules.slice(start, start + PAGE_SIZE)
  }, [filteredRules, safePage])

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const handleFilterChange = (tab: AlertRulesFilterTab) => {
    setFilterTab(tab)
    setCurrentPage(1)
  }

  const handleOpenCreate = () => {
    setCreateInitialValues(null)
    setCreateSession((current) => current + 1)
    setIsCreateOpen(true)
  }

  const handleDuplicate = (rule: AlertRuleDto) => {
    const sector =
      rule.scope === "sector" &&
      rule.sector &&
      rule.sector !== "composite"
        ? rule.sector
        : undefined

    setCreateInitialValues({
      assetId: rule.assetId,
      scope: rule.scope,
      sector,
      threshold: rule.threshold,
    })
    setCreateSession((current) => current + 1)
    setIsCreateOpen(true)
  }

  const handleRuleCreated = (rule: AlertRuleDto) => {
    setRules((current) => [rule, ...current])
    router.refresh()
  }

  const handleRuleUpdated = (rule: AlertRuleDto) => {
    setRules((current) => current.map((item) => (item.id === rule.id ? rule : item)))
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
      setSelectedIds((current) => {
        const next = new Set(current)
        next.delete(ruleId)
        return next
      })
      router.refresh()
    } catch {
      setError("Failed to delete alert rule")
    }
  }

  const handleToggle = async (rule: AlertRuleDto) => {
    setError(null)
    setTogglingRuleId(rule.id)

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
    } finally {
      setTogglingRuleId(null)
    }
  }

  const handleToggleSelect = (ruleId: string, checked: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current)

      if (checked) {
        next.add(ruleId)
      } else {
        next.delete(ruleId)
      }

      return next
    })
  }

  const handleToggleSelectAll = (checked: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current)

      if (checked) {
        for (const rule of pageRules) {
          next.add(rule.id)
        }
      } else {
        for (const rule of pageRules) {
          next.delete(rule.id)
        }
      }

      return next
    })
  }

  const handleBulkDisable = async () => {
    if (selectedIds.size === 0) {
      return
    }

    setError(null)
    setIsBulkBusy(true)

    try {
      const ids = [...selectedIds]
      const updates: AlertRuleDto[] = []

      for (const ruleId of ids) {
        const rule = rules.find((item) => item.id === ruleId)

        if (!rule || !rule.isEnabled) {
          continue
        }

        const response = await fetch(`/api/alerts/rules/${ruleId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isEnabled: false }),
        })

        const data: { rule?: AlertRuleDto; error?: string } = await response.json()

        if (!response.ok || !data.rule) {
          setError(data.error ?? "Failed to disable selected rules")
          return
        }

        updates.push(data.rule)
      }

      if (updates.length > 0) {
        const updatesById = new Map(updates.map((rule) => [rule.id, rule]))
        setRules((current) =>
          current.map((item) => updatesById.get(item.id) ?? item)
        )
      }

      setSelectedIds(new Set())
    } catch {
      setError("Failed to disable selected rules")
    } finally {
      setIsBulkBusy(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      return
    }

    const confirmed = window.confirm(
      `Delete ${selectedIds.size} selected alert rule${selectedIds.size === 1 ? "" : "s"}? This cannot be undone.`
    )

    if (!confirmed) {
      return
    }

    setError(null)
    setIsBulkBusy(true)

    try {
      const ids = [...selectedIds]

      for (const ruleId of ids) {
        const response = await fetch(`/api/alerts/rules/${ruleId}`, { method: "DELETE" })

        if (!response.ok) {
          setError("Failed to delete selected rules")
          return
        }
      }

      setRules((current) => current.filter((rule) => !selectedIds.has(rule.id)))
      setSelectedIds(new Set())
      router.refresh()
    } catch {
      setError("Failed to delete selected rules")
    } finally {
      setIsBulkBusy(false)
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
    <>
      <section className="flex flex-col gap-4">
        <AlertRulesHeader
          activeCount={activeCount}
          totalCount={totalCount}
          onNewRule={handleOpenCreate}
        />

        <AlertRulesToolbar
          searchQuery={searchQuery}
          filterTab={filterTab}
          onSearchChange={handleSearchChange}
          onFilterChange={handleFilterChange}
        />

        <AlertRulesBulkBar
          selectedCount={selectedIds.size}
          isBusy={isBulkBusy}
          onDisable={handleBulkDisable}
          onDelete={handleBulkDelete}
          onClear={() => setSelectedIds(new Set())}
        />

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        {rules.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No alert rules yet. Click <span className="text-foreground">New rule</span> to create
            one.
          </p>
        ) : filteredRules.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No rules match your search or filters.
          </p>
        ) : (
          <>
            <AlertRulesTable
              rules={pageRules}
              selectedIds={selectedIds}
              togglingRuleId={togglingRuleId}
              onToggleSelect={handleToggleSelect}
              onToggleSelectAll={handleToggleSelectAll}
              onToggleEnabled={handleToggle}
              onEdit={setEditingRule}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
            />
            <AlertRulesPagination
              currentPage={safePage}
              totalPages={totalPages}
              totalItems={filteredRules.length}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </section>

      <CreateAlertRuleDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        watchlist={watchlist}
        onRuleCreated={handleRuleCreated}
        formSession={createSession}
        initialValues={createInitialValues}
      />

      <EditAlertRuleDialog
        rule={editingRule}
        open={editingRule !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingRule(null)
          }
        }}
        onRuleUpdated={handleRuleUpdated}
      />
    </>
  )
}
