"use client"

import { Button } from "@/components/ui/button"

type AlertsErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AlertsError({ error, reset }: AlertsErrorProps) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-6 py-10">
      <h1 className="text-xl font-semibold text-foreground">Could not load alerts</h1>
      <p className="text-sm text-muted-foreground">{error.message}</p>
      <Button type="button" onClick={reset}>
        Try again
      </Button>
    </main>
  )
}
