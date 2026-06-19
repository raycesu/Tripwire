"use client"

import { useAddAssets } from "@/components/assets/add-assets-provider"
import { cn } from "@/lib/utils"

export const AddAssetsDialog = () => {
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

  return (
    <button
      type="button"
      tabIndex={0}
      className={cn(
        "rounded-full px-3 py-1.5 text-sm font-medium transition-all",
        "nav-link-idle"
      )}
      aria-label="Add assets to watchlist"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      Add assets
    </button>
  )
}
