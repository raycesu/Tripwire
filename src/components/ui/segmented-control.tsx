"use client"

import { cn } from "@/lib/utils"

type SegmentedControlOption<T extends string> = {
  value: T
  label: string
}

type SegmentedControlProps<T extends string> = {
  options: SegmentedControlOption<T>[]
  value: T
  onChange: (value: T) => void
  ariaLabel: string
  className?: string
}

const CONTROL_STYLE: React.CSSProperties = {
  position: "relative",
  display: "flex",
  borderRadius: "9999px",
  border: "1px solid rgba(255, 255, 255, 0.24)",
  background: "rgba(0, 0, 0, 0.26)",
  padding: "0.25rem",
  boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.05)",
}

const ACTIVE_INDICATOR_STYLE: React.CSSProperties = {
  pointerEvents: "none",
  position: "absolute",
  top: "0.25rem",
  bottom: "0.25rem",
  borderRadius: "9999px",
  border: "1px solid rgba(255, 255, 255, 0.18)",
  background:
    "linear-gradient(180deg, rgba(86, 86, 86, 0.96) 0%, rgba(48, 48, 48, 0.96) 100%)",
  boxShadow:
    "inset 0 1px 0 rgba(255, 255, 255, 0.16), 0 10px 24px rgba(0, 0, 0, 0.35)",
  transition: "left 180ms ease",
}

const OPTION_STYLE: React.CSSProperties = {
  position: "relative",
  zIndex: 1,
  flex: 1,
  borderRadius: "9999px",
  padding: "0.625rem 0.75rem",
  fontSize: "0.875rem",
  fontWeight: 600,
  lineHeight: "1.25rem",
  transition: "color 150ms ease, text-shadow 150ms ease",
}

const handleOptionKeyDown = (
  event: React.KeyboardEvent<HTMLButtonElement>,
  onSelect: () => void
) => {
  if (event.key !== "Enter" && event.key !== " ") {
    return
  }

  event.preventDefault()
  onSelect()
}

export const SegmentedControl = <T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: SegmentedControlProps<T>) => {
  const activeIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value)
  )
  const segmentWidth = `calc((100% - 0.5rem) / ${options.length})`

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        "relative flex rounded-full border border-white/10 bg-white/5 p-1",
        className
      )}
      style={CONTROL_STYLE}
    >
      <div
        aria-hidden="true"
        style={{
          ...ACTIVE_INDICATOR_STYLE,
          width: segmentWidth,
          left: `calc(0.25rem + ${activeIndex} * ((100% - 0.5rem) / ${options.length}))`,
        }}
      />
      {options.map((option) => {
        const isActive = value === option.value

        return (
          <button
            key={option.value}
            type="button"
            tabIndex={0}
            aria-pressed={isActive}
            className={cn(
              "relative z-10 flex-1 rounded-full px-3 py-2 text-sm font-medium transition-colors",
              isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground/80"
            )}
            style={{
              ...OPTION_STYLE,
              color: isActive ? "rgba(255, 255, 255, 0.98)" : "rgba(255, 255, 255, 0.55)",
              textShadow: isActive ? "0 1px 8px rgba(255, 255, 255, 0.12)" : "none",
            }}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => handleOptionKeyDown(event, () => onChange(option.value))}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
