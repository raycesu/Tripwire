"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import type { TelegramConnectionStatus } from "@/lib/telegram/queries"

type TelegramConnectPanelProps = {
  initialStatus: TelegramConnectionStatus
}

export const TelegramConnectPanel = ({ initialStatus }: TelegramConnectPanelProps) => {
  const [status, setStatus] = useState(initialStatus)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleConnect = async () => {
    setIsConnecting(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch("/api/telegram/connect", { method: "POST" })
      const data: { deepLink?: string; error?: string } = await response.json()

      if (!response.ok || !data.deepLink) {
        setError(data.error ?? "Failed to start Telegram connection")
        return
      }

      window.open(data.deepLink, "_blank", "noopener,noreferrer")
      setMessage("Open Telegram, press Start, then return here and send a test alert.")
    } catch {
      setError("Failed to start Telegram connection")
    } finally {
      setIsConnecting(false)
    }
  }

  const handleTest = async () => {
    setIsTesting(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch("/api/telegram/test", { method: "POST" })
      const data: { error?: string } = await response.json()

      if (!response.ok) {
        setError(data.error ?? "Failed to send test alert")
        return
      }

      setMessage("Test alert sent. Check your Telegram chat with the Tripwire bot.")
      setStatus((prev) => ({ ...prev, isVerified: true, deliveryStatus: "connected" }))
    } catch {
      setError("Failed to send test alert")
    } finally {
      setIsTesting(false)
    }
  }

  const statusLabel = (() => {
    if (status.isVerified && status.deliveryStatus === "connected") {
      return "Connected"
    }

    if (status.deliveryStatus === "blocked") {
      return "Blocked — reconnect required"
    }

    if (status.deliveryStatus === "invalid_chat") {
      return "Invalid chat — reconnect required"
    }

    return "Not connected"
  })()

  return (
    <section className="surface-card p-6">
      <h2 className="text-lg font-semibold text-foreground">Telegram alerts</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Connect the shared Tripwire bot to receive opportunity alerts on Telegram.
      </p>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wider text-muted-foreground">Status</dt>
          <dd className="mt-1 text-sm font-medium">{statusLabel}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-muted-foreground">Chat ID</dt>
          <dd className="mt-1 text-sm font-medium">{status.chatIdMasked ?? "—"}</dd>
        </div>
      </dl>

      {status.lastError ? (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {status.lastError}
        </p>
      ) : null}

      {message ? (
        <p className="mt-4 text-sm text-muted-foreground" role="status">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <Button
          type="button"
          onClick={handleConnect}
          disabled={isConnecting}
          aria-label="Connect Telegram account"
        >
          {isConnecting ? "Connecting…" : "Connect Telegram"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleTest}
          disabled={isTesting || !status.isVerified}
          aria-label="Send test Telegram alert"
        >
          {isTesting ? "Sending…" : "Send test alert"}
        </Button>
      </div>
    </section>
  )
}
