"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

type AssetDetailErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AssetDetailError({ error, reset }: AssetDetailErrorProps) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-6 py-10">
      <h1 className="text-xl font-semibold text-foreground">Could not load asset</h1>
      <p className="text-sm text-muted-foreground">{error.message}</p>
      <div className="flex gap-3">
        <Button type="button" onClick={reset}>
          Try again
        </Button>
        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
        >
          Back to watchlist
        </Link>
      </div>
    </main>
  )
}
