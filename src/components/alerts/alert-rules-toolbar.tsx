"use client"

import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

export type AlertRulesFilterTab = "all" | "crypto" | "stock" | "disabled"

const FILTER_OPTIONS: { value: AlertRulesFilterTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "crypto", label: "Crypto" },
  { value: "stock", label: "Stocks" },
  { value: "disabled", label: "Disabled" },
]

type AlertRulesToolbarProps = {
  searchQuery: string
  filterTab: AlertRulesFilterTab
  onSearchChange: (value: string) => void
  onFilterChange: (tab: AlertRulesFilterTab) => void
}

export const AlertRulesToolbar = ({
  searchQuery,
  filterTab,
  onSearchChange,
  onFilterChange,
}: AlertRulesToolbarProps) => {
  const handleFilterKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    tab: AlertRulesFilterTab
  ) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return
    }

    event.preventDefault()
    onFilterChange(tab)
  }

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="relative min-w-0 flex-1">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/45"
          aria-hidden="true"
        />
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search rules..."
          aria-label="Search alert rules"
          className="glass-input h-10 w-full rounded-lg border pr-4 pl-10 text-sm text-white/95 placeholder:text-white/40 outline-none"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((option) => {
          const isActive = filterTab === option.value

          return (
            <button
              key={option.value}
              type="button"
              tabIndex={0}
              aria-pressed={isActive}
              aria-label={`Filter alert rules to ${option.label}`}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                isActive ? "silver-pill-active" : "silver-pill"
              )}
              onClick={() => onFilterChange(option.value)}
              onKeyDown={(event) => handleFilterKeyDown(event, option.value)}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
