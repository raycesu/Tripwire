"use client"

import { PlusIcon } from "lucide-react"
import { useAddAssets } from "@/components/assets/add-assets-provider"
import { PageActionButton } from "@/components/ui/page-action-button"
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

  if (variant === "page") {
    return (
      <PageActionButton onClick={handleClick} aria-label="Add to watchlist">
        <PlusIcon className="size-3.5" aria-hidden="true" />
        Add
      </PageActionButton>
    )
  }

  return (
    <button
      type="button"
      tabIndex={0}
      className={cn(
        "rounded-full px-3 py-1.5 text-sm font-medium transition-all nav-link-idle"
      )}
      aria-label="Add to watchlist"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      Add assets
    </button>
  )
}
