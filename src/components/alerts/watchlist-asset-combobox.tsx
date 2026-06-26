"use client"

import { ChevronDown, Search } from "lucide-react"
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react"
import { AssetTypePill } from "@/components/alerts/asset-type-pill"
import type { AlertWatchlistOption } from "@/lib/alerts/types"
import { cn } from "@/lib/utils"

type WatchlistAssetComboboxProps = {
  items: AlertWatchlistOption[]
  value: string
  onChange: (assetId: string) => void
}

const COMBOBOX_CONTAINER_STYLE: React.CSSProperties = {
  position: "relative",
}

const TRIGGER_STYLE: React.CSSProperties = {
  display: "flex",
  minHeight: "3rem",
  width: "100%",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "0.75rem",
  borderRadius: "0.75rem",
  padding: "0.625rem 0.875rem",
  background: "rgba(0, 0, 0, 0.2)",
  textAlign: "left",
  transition: "border-color 150ms ease, background-color 150ms ease",
}

const DROPDOWN_STYLE: React.CSSProperties = {
  position: "absolute",
  top: "calc(100% + 0.5rem)",
  right: 0,
  left: 0,
  zIndex: 10001,
  overflow: "hidden",
  borderRadius: "0.75rem",
  border: "1px solid rgba(255, 255, 255, 0.2)",
  background: "#0f0f0f",
  boxShadow: "0 18px 48px rgba(0, 0, 0, 0.75)",
}

const SEARCH_PANEL_STYLE: React.CSSProperties = {
  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
  padding: "0.5rem",
}

const LIST_STYLE: React.CSSProperties = {
  maxHeight: "10rem",
  overflowY: "auto",
  overscrollBehavior: "contain",
  padding: "0.25rem 0",
}

const OPTION_BUTTON_STYLE: React.CSSProperties = {
  display: "flex",
  width: "100%",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "0.75rem",
  padding: "0.625rem 1rem",
  textAlign: "left",
  fontSize: "0.875rem",
  lineHeight: "1.25rem",
  transition: "background-color 150ms ease",
}

const filterWatchlist = (items: AlertWatchlistOption[], query: string) => {
  const normalized = query.trim().toLowerCase()

  if (!normalized) {
    return items
  }

  return items.filter(
    (item) =>
      item.symbol.toLowerCase().includes(normalized) ||
      item.name.toLowerCase().includes(normalized)
  )
}

export const WatchlistAssetCombobox = ({
  items,
  value,
  onChange,
}: WatchlistAssetComboboxProps) => {
  const listboxId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [activeIndex, setActiveIndex] = useState(-1)

  const selectedItem = items.find((item) => item.assetId === value) ?? items[0]
  const filteredItems = useMemo(() => filterWatchlist(items, query), [items, query])

  const handleClose = useCallback(() => {
    setIsOpen(false)
    setQuery("")
    setActiveIndex(-1)
  }, [])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    window.requestAnimationFrame(() => inputRef.current?.focus())
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        handleClose()
      }
    }

    document.addEventListener("mousedown", handlePointerDown, true)

    return () => {
      document.removeEventListener("mousedown", handlePointerDown, true)
    }
  }, [handleClose, isOpen])

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      handleClose()
      return
    }

    setQuery("")
    setActiveIndex(-1)
    setIsOpen(true)
  }

  const handleSelect = (assetId: string) => {
    onChange(assetId)
    handleClose()
  }

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      handleOpenChange(!isOpen)
      return
    }

    if (event.key === "ArrowDown" && !isOpen) {
      event.preventDefault()
      handleOpenChange(true)
    }
  }

  const handleTriggerClick = () => {
    handleOpenChange(!isOpen)
  }

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault()
      event.stopPropagation()
      handleClose()
      return
    }

    if (filteredItems.length === 0) {
      return
    }

    if (event.key === "ArrowDown") {
      event.preventDefault()
      setActiveIndex((current) => (current + 1) % filteredItems.length)
      return
    }

    if (event.key === "ArrowUp") {
      event.preventDefault()
      setActiveIndex((current) =>
        current <= 0 ? filteredItems.length - 1 : current - 1
      )
      return
    }

    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault()
      const selected = filteredItems[activeIndex]

      if (selected) {
        handleSelect(selected.assetId)
      }
    }
  }

  if (!selectedItem) {
    return null
  }

  return (
    <div
      ref={containerRef}
      style={{
        ...COMBOBOX_CONTAINER_STYLE,
        zIndex: isOpen ? 10000 : undefined,
      }}
    >
      <button
        type="button"
        tabIndex={0}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        className={cn(
          "border",
          isOpen
            ? "border-white/30 bg-black/30"
            : "border-white/15 bg-black/20 hover:border-white/25 hover:bg-black/30"
        )}
        style={{
          ...TRIGGER_STYLE,
          border: isOpen
            ? "1px solid rgba(255, 255, 255, 0.3)"
            : "1px solid rgba(255, 255, 255, 0.15)",
          background: isOpen ? "rgba(0, 0, 0, 0.3)" : "rgba(0, 0, 0, 0.2)",
        }}
        onClick={handleTriggerClick}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className="flex min-w-0 flex-1 items-center gap-3">
          <span className="font-semibold text-foreground">{selectedItem.symbol}</span>
          <span className="truncate text-sm text-muted-foreground">{selectedItem.name}</span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <AssetTypePill assetType={selectedItem.assetType} />
          <ChevronDown
            className={cn("size-4 text-muted-foreground transition-transform", isOpen && "rotate-180")}
            aria-hidden="true"
          />
        </span>
      </button>

      {isOpen ? (
        <div style={DROPDOWN_STYLE}>
          <div style={SEARCH_PANEL_STYLE}>
            <div className="flex h-10 items-center gap-2.5 rounded-lg border border-white/15 bg-[#141414] px-3 focus-within:border-white/30">
              <Search className="size-4 shrink-0 text-white/45" aria-hidden="true" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                role="combobox"
                aria-expanded={isOpen}
                aria-controls={listboxId}
                aria-autocomplete="list"
                aria-activedescendant={
                  activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
                }
                aria-label="Search watchlist assets"
                placeholder="Search ticker or name…"
                autoComplete="off"
                className="min-w-0 flex-1 bg-transparent text-sm text-white/95 outline-none placeholder:text-white/40"
                onChange={(event) => {
                  setQuery(event.target.value)
                  setActiveIndex(-1)
                }}
                onKeyDown={handleInputKeyDown}
              />
            </div>
          </div>

          <ul
            id={listboxId}
            role="listbox"
            aria-label="Watchlist assets"
            style={LIST_STYLE}
          >
            {filteredItems.length === 0 ? (
              <li className="px-4 py-3 text-sm text-muted-foreground">No matching assets.</li>
            ) : (
              filteredItems.map((item, index) => (
                <li key={item.assetId} role="presentation">
                  <button
                    id={`${listboxId}-option-${index}`}
                    type="button"
                    role="option"
                    aria-selected={value === item.assetId}
                    tabIndex={0}
                    className={cn(
                      "hover:bg-white/8",
                      activeIndex === index && "bg-white/8",
                      value === item.assetId && "bg-white/6"
                    )}
                    style={{
                      ...OPTION_BUTTON_STYLE,
                      background:
                        activeIndex === index
                          ? "rgba(255, 255, 255, 0.08)"
                          : value === item.assetId
                            ? "rgba(255, 255, 255, 0.06)"
                            : "transparent",
                    }}
                    onClick={() => handleSelect(item.assetId)}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter" && event.key !== " ") {
                        return
                      }

                      event.preventDefault()
                      handleSelect(item.assetId)
                    }}
                    onMouseEnter={() => setActiveIndex(index)}
                  >
                    <span className="min-w-0">
                      <span className="font-medium text-foreground">{item.symbol}</span>
                      <span className="mt-0.5 block truncate text-muted-foreground">{item.name}</span>
                    </span>
                    <AssetTypePill assetType={item.assetType} />
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
