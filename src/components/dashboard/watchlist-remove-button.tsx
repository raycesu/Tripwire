"use client"

import { Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"

type WatchlistRemoveButtonProps = {
  assetId: string
  symbol: string
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

export const WatchlistRemoveButton = ({ assetId, symbol }: WatchlistRemoveButtonProps) => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleRemove = async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const response = await fetch(`/api/watchlist/${assetId}`, { method: "DELETE" })

      if (!response.ok) {
        throw new Error(await getResponseErrorMessage(response, "Failed to remove from watchlist"))
      }

      router.refresh()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={isLoading}
        aria-label={`Remove ${symbol} from watchlist`}
        onClick={() => void handleRemove()}
      >
        <Trash2 className="size-4 text-muted-foreground group-hover/button:text-destructive" />
      </Button>
      {errorMessage ? (
        <p className="max-w-40 text-right text-xs text-destructive" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  )
}
