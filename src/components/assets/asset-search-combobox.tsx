"use client"

import { Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useId, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { AssetType } from "@/lib/assets/types"

type AssetSearchResult = {
  symbol: string
  name: string
  assetType: AssetType
  source: string
  exchange: string | null
}

type AssetTypeFilter = "all" | AssetType

type AssetSearchComboboxProps = {
  className?: string
  layout?: "dropdown" | "panel"
  placeholder?: string
  onAssetSelected?: () => void
}

const FILTER_OPTIONS: Array<{ value: AssetTypeFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "crypto", label: "Crypto" },
  { value: "stock", label: "Stocks" },
]

export const AssetSearchCombobox = ({
  className,
  layout = "dropdown",
  placeholder = "Search by ticker (e.g. ETH, TSLA)",
  onAssetSelected,
}: AssetSearchComboboxProps) => {
  const router = useRouter()
  const listboxId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<AssetTypeFilter>("all")
  const [results, setResults] = useState<AssetSearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSelect = useCallback(
    (symbol: string) => {
      setIsOpen(false)
      setQuery("")
      setResults([])
      setActiveIndex(-1)
      onAssetSelected?.()
      router.push(`/assets/${symbol}`)
    },
    [onAssetSelected, router]
  )

  useEffect(() => {
    const trimmed = query.trim()

    if (trimmed.length < 2) {
      return
    }

    const controller = new AbortController()
    const timeoutId = window.setTimeout(async () => {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const params = new URLSearchParams({ q: trimmed })

        if (typeFilter !== "all") {
          params.set("type", typeFilter)
        }

        const response = await fetch(`/api/assets/search?${params.toString()}`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error("Search failed")
        }

        const data = (await response.json()) as { results: AssetSearchResult[] }
        setResults(data.results)
        setActiveIndex(-1)
        setIsOpen(true)
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return
        }

        setResults([])
        setErrorMessage("Could not search assets. Try again.")
      } finally {
        setIsLoading(false)
      }
    }, 250)

    return () => {
      controller.abort()
      window.clearTimeout(timeoutId)
    }
  }, [query, typeFilter])

  useEffect(() => {
    if (layout === "panel") {
      return
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handlePointerDown)
    return () => document.removeEventListener("mousedown", handlePointerDown)
  }, [layout])

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextQuery = event.target.value

    setQuery(nextQuery)
    setIsOpen(true)

    if (nextQuery.trim().length < 2) {
      setResults([])
      setIsLoading(false)
      setErrorMessage(null)
      setActiveIndex(-1)
    }
  }

  const handleInputFocus = () => {
    if (query.trim().length >= 2 && results.length > 0) {
      setIsOpen(true)
    }
  }

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setIsOpen(false)
      setActiveIndex(-1)
      return
    }

    if (layout !== "panel" && !isOpen) {
      return
    }

    if (results.length === 0) {
      return
    }

    if (event.key === "ArrowDown") {
      event.preventDefault()
      setActiveIndex((current) => (current + 1) % results.length)
      return
    }

    if (event.key === "ArrowUp") {
      event.preventDefault()
      setActiveIndex((current) => (current <= 0 ? results.length - 1 : current - 1))
      return
    }

    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault()
      const selected = results[activeIndex]

      if (selected) {
        handleSelect(selected.symbol)
      }
    }
  }

  const handleFilterClick = (value: AssetTypeFilter) => {
    setTypeFilter(value)
    inputRef.current?.focus()
  }

  const handleFilterKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    value: AssetTypeFilter
  ) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return
    }

    event.preventDefault()
    handleFilterClick(value)
  }

  const handleResultClick = (symbol: string) => {
    handleSelect(symbol)
  }

  const handleResultKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    symbol: string
  ) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return
    }

    event.preventDefault()
    handleSelect(symbol)
  }

  const trimmedQuery = query.trim()
  const showResults = layout === "panel" ? trimmedQuery.length >= 2 : isOpen && trimmedQuery.length >= 2

  const filterPills = (
    <div
      className={cn(layout === "panel" ? "mt-3 flex gap-2" : "mb-3 flex flex-wrap gap-2")}
      style={layout === "panel" ? { display: "flex", gap: "0.5rem", marginTop: "0.75rem" } : undefined}
    >
      {FILTER_OPTIONS.map((option) => {
        const isActive = typeFilter === option.value

        return (
        <button
          key={option.value}
          type="button"
          tabIndex={0}
          aria-pressed={isActive}
          aria-label={`Filter search to ${option.label}`}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
            layout === "panel" ? "text-center" : isActive ? "silver-pill-active" : "silver-pill"
          )}
          style={
            layout === "panel"
              ? {
                  flex: 1,
                  backgroundColor: isActive ? "#ffffff" : "rgb(38, 38, 38)",
                  color: isActive ? "#000000" : "rgba(255, 255, 255, 0.78)",
                  border: isActive ? "1px solid #ffffff" : "1px solid rgba(255, 255, 255, 0.18)",
                }
              : undefined
          }
          onClick={() => handleFilterClick(option.value)}
          onKeyDown={(event) => handleFilterKeyDown(event, option.value)}
        >
          {option.label}
        </button>
        )
      })}
    </div>
  )

  const searchInput = (
    <div className="relative">
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/45"
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        type="search"
        value={query}
        role="combobox"
        aria-expanded={showResults}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={
          activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
        }
        aria-label="Search assets by ticker or name"
        placeholder={placeholder}
        autoComplete="off"
        autoFocus={layout === "panel"}
        className={cn(
          "h-11 w-full rounded-lg border pr-4 pl-10 text-sm outline-none",
          layout === "panel"
            ? "text-white placeholder:text-white/40"
            : "glass-input text-white/95 placeholder:text-white/40"
        )}
        style={
          layout === "panel"
            ? {
                backgroundColor: "rgb(32, 32, 32)",
                borderColor: "rgba(255, 255, 255, 0.28)",
              }
            : undefined
        }
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onKeyDown={handleInputKeyDown}
      />
    </div>
  )

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {layout === "panel" ? (
        <>
          {searchInput}
          {filterPills}
        </>
      ) : (
        <>
          {filterPills}
          {searchInput}
        </>
      )}

      {errorMessage ? (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {showResults ? (
        <div
          className={cn(
            layout === "panel"
              ? "mt-4 max-h-[min(24rem,50vh)] overflow-y-auto"
              : "glass-popover absolute z-20 mt-2 w-full overflow-hidden rounded-lg"
          )}
          role="presentation"
        >
          <ul
            id={listboxId}
            role="listbox"
            aria-label="Asset search results"
            className={cn(layout === "panel" ? undefined : "max-h-72 overflow-y-auto py-1")}
          >
            {isLoading ? (
              <li className="px-1 py-3 text-sm text-white/45">Searching…</li>
            ) : null}

            {!isLoading && results.length === 0 ? (
              <li className="px-1 py-3 text-sm text-white/45">
                No supported assets match that ticker.
              </li>
            ) : null}

            {!isLoading
              ? results.map((result, index) => (
                  <li key={`${result.symbol}-${result.assetType}`} role="presentation">
                    <button
                      id={`${listboxId}-option-${index}`}
                      type="button"
                      role="option"
                      aria-selected={activeIndex === index}
                      tabIndex={0}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-lg px-1 py-2.5 text-left text-sm transition-colors hover:bg-white/6",
                        activeIndex === index && "bg-white/8",
                        layout !== "panel" && "px-4 py-3 hover:bg-white/8"
                      )}
                      onClick={() => handleResultClick(result.symbol)}
                      onKeyDown={(event) => handleResultKeyDown(event, result.symbol)}
                      onMouseEnter={() => setActiveIndex(-1)}
                    >
                      {layout === "panel" ? (
                        <span className="min-w-0 truncate">
                          <span className="font-semibold text-white">{result.symbol}</span>
                          <span className="ml-2 text-white/50">{result.name}</span>
                        </span>
                      ) : (
                        <span className="min-w-0">
                          <span className="font-medium text-foreground">{result.symbol}</span>
                          <span className="mt-0.5 block truncate text-muted-foreground">
                            {result.name}
                          </span>
                        </span>
                      )}
                      <span className="flex shrink-0 items-center gap-2">
                        {result.assetType === "stock" && result.exchange ? (
                          <Badge variant="default">{result.exchange}</Badge>
                        ) : null}
                        {layout !== "panel" ? (
                          <Badge variant="default" className="capitalize">
                            {result.assetType}
                          </Badge>
                        ) : null}
                      </span>
                    </button>
                  </li>
                ))
              : null}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
