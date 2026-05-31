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
}

const FILTER_OPTIONS: Array<{ value: AssetTypeFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "crypto", label: "Crypto" },
  { value: "stock", label: "Stocks" },
]

export const AssetSearchCombobox = ({ className }: AssetSearchComboboxProps) => {
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
      router.push(`/assets/${symbol}`)
    },
    [router]
  )

  useEffect(() => {
    const trimmed = query.trim()

    if (trimmed.length < 2) {
      setResults([])
      setIsLoading(false)
      setErrorMessage(null)
      setActiveIndex(-1)
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
        setActiveIndex(data.results.length > 0 ? 0 : -1)
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
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handlePointerDown)
    return () => document.removeEventListener("mousedown", handlePointerDown)
  }, [])

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value)
    setIsOpen(true)
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

    if (!isOpen || results.length === 0) {
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

  const showDropdown = isOpen && query.trim().length >= 2

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div className="mb-3 flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            tabIndex={0}
            aria-pressed={typeFilter === option.value}
            aria-label={`Filter search to ${option.label}`}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              typeFilter === option.value
                ? "border-accent bg-accent/15 text-accent"
                : "border-border bg-muted/40 text-muted-foreground hover:text-foreground"
            )}
            onClick={() => handleFilterClick(option.value)}
            onKeyDown={(event) => handleFilterKeyDown(event, option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          type="search"
          value={query}
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
          }
          aria-label="Search assets by ticker or name"
          placeholder="Search by ticker (e.g. ETH, TSLA)"
          autoComplete="off"
          className="h-11 w-full rounded-lg border border-border bg-background pr-4 pl-10 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleInputKeyDown}
        />
      </div>

      {errorMessage ? (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {showDropdown ? (
        <div
          className="absolute z-20 mt-2 w-full overflow-hidden rounded-lg border border-border bg-card shadow-lg"
          role="presentation"
        >
          <ul
            id={listboxId}
            role="listbox"
            aria-label="Asset search results"
            className="max-h-72 overflow-y-auto py-1"
          >
            {isLoading ? (
              <li className="px-4 py-3 text-sm text-muted-foreground">Searching…</li>
            ) : null}

            {!isLoading && results.length === 0 ? (
              <li className="px-4 py-3 text-sm text-muted-foreground">
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
                        "flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-muted/60",
                        activeIndex === index ? "bg-muted/60" : undefined
                      )}
                      onClick={() => handleResultClick(result.symbol)}
                      onKeyDown={(event) => handleResultKeyDown(event, result.symbol)}
                      onMouseEnter={() => setActiveIndex(index)}
                    >
                      <span className="min-w-0">
                        <span className="font-medium text-foreground">{result.symbol}</span>
                        <span className="mt-0.5 block truncate text-muted-foreground">
                          {result.name}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        {result.assetType === "stock" && result.exchange ? (
                          <Badge variant="default">{result.exchange}</Badge>
                        ) : null}
                        <Badge variant="default" className="capitalize">
                          {result.assetType}
                        </Badge>
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
