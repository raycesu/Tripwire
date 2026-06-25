"use client"

import { PlusIcon } from "lucide-react"
import { useAddAssets } from "@/components/assets/add-assets-provider"
import { cn } from "@/lib/utils"

type AddAssetsDialogProps = {
  variant?: "nav" | "page"
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

  return (
    <button
      type="button"
      tabIndex={0}
      className={cn(
        "text-sm font-medium transition-all",
        variant === "nav" && "rounded-full px-3 py-1.5 nav-link-idle",
        variant === "page" &&
          "inline-flex items-center gap-1.5 rounded-md border border-silver/30 px-3 py-1.5 text-foreground hover:border-silver/50 hover:bg-white/5"
      )}
      aria-label="Add assets to watchlist"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {variant === "page" ? (
        <>
          <PlusIcon className="size-3.5" aria-hidden="true" />
          Add asset
        </>
      ) : (
        "Add assets"
      )}
    </button>
  )
}
