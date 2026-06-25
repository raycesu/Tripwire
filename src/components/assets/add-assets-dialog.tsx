"use client"

import { PlusIcon } from "lucide-react"
import { useAddAssets } from "@/components/assets/add-assets-provider"
import { cn } from "@/lib/utils"

type AddAssetsDialogProps = {
  variant?: "nav" | "page"
}

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

export const AddAssetsDialog = ({ variant = "nav" }: AddAssetsDialogProps) => {
  const { openAddAssets } = useAddAssets()

  const handleClick = () => {
    openAddAssets()
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return
    }

    event.preventDefault()
    openAddAssets()
  }

  const handleMouseEnter = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (variant !== "page") {
      return
    }

    Object.assign(event.currentTarget.style, PAGE_BUTTON_HOVER_STYLE)
  }

  const handleMouseLeave = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (variant !== "page") {
      return
    }

    Object.assign(event.currentTarget.style, PAGE_BUTTON_STYLE)
  }

  return (
    <button
      type="button"
      tabIndex={0}
      className={cn(
        "text-sm font-medium",
        variant === "nav" && "rounded-full px-3 py-1.5 transition-all nav-link-idle",
        variant === "page" &&
          "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-[box-shadow,border-color]"
      )}
      style={variant === "page" ? PAGE_BUTTON_STYLE : undefined}
      aria-label="Add to watchlist"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {variant === "page" ? (
        <>
          <PlusIcon className="size-3.5" aria-hidden="true" />
          Add
        </>
      ) : (
        "Add assets"
      )}
    </button>
  )
}
