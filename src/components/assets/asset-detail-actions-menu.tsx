"use client"

import { MoreHorizontal } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type AssetDetailActionsMenuProps = {
  assetId: string
  symbol: string
  isOnWatchlist: boolean
}

const getResponseErrorMessage = async (response: Response, fallback: string) => {
  const contentType = response.headers.get("content-type")

  if (!contentType?.includes("application/json")) {
    return fallback
  }

  try {
    const data = (await response.json()) as { error?: string }
    return data.error ?? fallback
  } catch {
    return fallback
  }
}

export const AssetDetailActionsMenu = ({
  assetId,
  symbol,
  isOnWatchlist: initialOnWatchlist,
}: AssetDetailActionsMenuProps) => {
  const router = useRouter()
  const [isOnWatchlist, setIsOnWatchlist] = useState(initialOnWatchlist)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  const handleToggle = async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      if (isOnWatchlist) {
        const response = await fetch(`/api/watchlist/${assetId}`, { method: "DELETE" })

        if (!response.ok) {
          throw new Error(
            await getResponseErrorMessage(response, "Failed to remove from watchlist")
          )
        }

        setIsOnWatchlist(false)
        setOpen(false)
      } else {
        const response = await fetch("/api/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symbol }),
        })

        if (!response.ok) {
          throw new Error(await getResponseErrorMessage(response, "Failed to add to watchlist"))
        }

        setIsOnWatchlist(true)
        setOpen(false)
      }

      router.refresh()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  const actionLabel = isOnWatchlist ? "Remove from watchlist" : "Add to watchlist"
  const ariaLabel = isOnWatchlist
    ? `Remove ${symbol} from watchlist`
    : `Add ${symbol} to watchlist`

  return (
    <div className="flex flex-col items-end gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          type="button"
          className={cn(
            "inline-flex size-7 items-center justify-center rounded-full border border-white/28 bg-white/[0.04] text-white/90 transition-all",
            open && "border-white/45 bg-white/10"
          )}
          aria-label={`${symbol} actions`}
          aria-expanded={open}
        >
          <MoreHorizontal className="size-4" aria-hidden="true" />
        </PopoverTrigger>
        <PopoverContent align="end" className="popover-chromeless">
          <Button
            type="button"
            variant={isOnWatchlist ? "outline" : "default"}
            disabled={isLoading}
            aria-label={ariaLabel}
            className="h-8 rounded-full px-4"
            onClick={() => void handleToggle()}
          >
            {isLoading ? "Updating…" : actionLabel}
          </Button>
        </PopoverContent>
      </Popover>
      {errorMessage ? (
        <p className="text-xs text-destructive" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  )
}
