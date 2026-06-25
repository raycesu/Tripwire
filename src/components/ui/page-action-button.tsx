"use client"

import { cn } from "@/lib/utils"

const PAGE_BUTTON_STYLE: React.CSSProperties = {
  background: "linear-gradient(180deg, #c42a2a 0%, #961818 100%)",
  color: "#ffffff",
  border: "1px solid rgba(204, 34, 34, 0.45)",
  boxShadow:
    "inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 0 14px rgba(204, 34, 34, 0.22)",
}

const PAGE_BUTTON_HOVER_STYLE: React.CSSProperties = {
  background: "linear-gradient(180deg, #d43232 0%, #cc2222 100%)",
  border: "1px solid rgba(204, 34, 34, 0.6)",
  boxShadow:
    "inset 0 1px 0 rgba(255, 255, 255, 0.16), 0 0 18px rgba(204, 34, 34, 0.32)",
}

type PageActionButtonProps = {
  children: React.ReactNode
  onClick?: () => void
  "aria-label": string
  className?: string
  type?: "button" | "submit"
  disabled?: boolean
}

export const PageActionButton = ({
  children,
  onClick,
  "aria-label": ariaLabel,
  className,
  type = "button",
  disabled = false,
}: PageActionButtonProps) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (type === "submit" || !onClick) {
      return
    }

    if (event.key !== "Enter" && event.key !== " ") {
      return
    }

    event.preventDefault()
    onClick()
  }

  const handleMouseEnter = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) {
      return
    }

    Object.assign(event.currentTarget.style, PAGE_BUTTON_HOVER_STYLE)
  }

  const handleMouseLeave = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) {
      return
    }

    Object.assign(event.currentTarget.style, PAGE_BUTTON_STYLE)
  }

  return (
    <button
      type={type}
      tabIndex={0}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-[box-shadow,border-color] disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      style={PAGE_BUTTON_STYLE}
      aria-label={ariaLabel}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </button>
  )
}
