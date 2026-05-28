"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"

type WatchlistToggleButtonProps = {
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

export const WatchlistToggleButton = ({
  assetId,
  symbol,
  isOnWatchlist: initialOnWatchlist,
}: WatchlistToggleButtonProps) => {
  const router = useRouter()
  const [isOnWatchlist, setIsOnWatchlist] = useState(initialOnWatchlist)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

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
      }

      router.refresh()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return
    }

    event.preventDefault()
    void handleToggle()
  }

  const label = isOnWatchlist
    ? `Remove ${symbol} from watchlist`
    : `Add ${symbol} to watchlist`

  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        type="button"
        variant={isOnWatchlist ? "outline" : "default"}
        disabled={isLoading}
        aria-label={label}
        onClick={() => void handleToggle()}
        onKeyDown={handleKeyDown}
      >
        {isLoading ? "Updating…" : isOnWatchlist ? "Remove from watchlist" : "Add to watchlist"}
      </Button>
      {errorMessage ? (
        <p className="text-xs text-destructive" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  )
}
