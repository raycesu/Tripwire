"use client"

import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { TelegramConnectionStatus } from "@/lib/telegram/queries"

type TelegramConnectPanelProps = {
  initialStatus: TelegramConnectionStatus
}

const CONNECT_POLL_INTERVAL_MS = 3000
const CONNECT_POLL_DURATION_MS = 60000

type StatusVariant = "connected" | "warning" | "destructive" | "default"

const TelegramStatusBadge = ({
  label,
  variant,
}: {
  label: string
  variant: StatusVariant
}) => {
  const dotClassName = cn(
    "size-1.5 shrink-0 rounded-full",
    variant === "connected" && "bg-chart-1",
    variant === "warning" && "bg-accent",
    variant === "destructive" && "bg-destructive",
    variant === "default" && "bg-white/40"
  )

  const pillClassName = cn(
    "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
    variant === "connected" && "border-chart-1/30 bg-chart-1/10 text-chart-1",
    variant === "warning" && "border-accent/30 bg-accent/10 text-accent",
    variant === "destructive" && "border-destructive/30 bg-destructive/10 text-destructive",
    variant === "default" && "border-white/20 bg-white/5 text-white/60"
  )

  return (
    <span className={pillClassName}>
      <span className={dotClassName} aria-hidden="true" />
      {label}
    </span>
  )
}

export const TelegramConnectPanel = ({ initialStatus }: TelegramConnectPanelProps) => {
  const router = useRouter()
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current)
      }

      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [])

  const stopConnectPolling = () => {
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current)
      pollTimeoutRef.current = null
    }

    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
  }

  const startConnectPolling = () => {
    stopConnectPolling()

    pollIntervalRef.current = setInterval(() => {
      router.refresh()
    }, CONNECT_POLL_INTERVAL_MS)

    pollTimeoutRef.current = setTimeout(() => {
      stopConnectPolling()
    }, CONNECT_POLL_DURATION_MS)
  }

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
      setMessage("Open Telegram, press Start, then return here. Status will refresh automatically.")
      startConnectPolling()
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
      router.refresh()
    } catch {
      setError("Failed to send test alert")
    } finally {
      setIsTesting(false)
    }
  }

  const isConnected =
    initialStatus.isVerified && initialStatus.deliveryStatus === "connected"

  const needsReconnect =
    isConnected ||
    initialStatus.deliveryStatus === "blocked" ||
    initialStatus.deliveryStatus === "invalid_chat"

  const connectLabel = isConnecting
    ? "Connecting…"
    : needsReconnect
      ? "Reconnect"
      : "Connect Telegram"

  const statusMeta = ((): { label: string; variant: StatusVariant } => {
    if (isConnected) {
      return { label: "Connected", variant: "connected" }
    }

    if (initialStatus.deliveryStatus === "blocked") {
      return { label: "Blocked", variant: "destructive" }
    }

    if (initialStatus.deliveryStatus === "invalid_chat") {
      return { label: "Invalid chat", variant: "destructive" }
    }

    return { label: "Not connected", variant: "default" }
  })()

  const canSendTest = initialStatus.isVerified || initialStatus.deliveryStatus === "connected"
  const feedback = error ?? initialStatus.lastError ?? message

  return (
    <section className="p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">Telegram Alerts</h2>
        <TelegramStatusBadge label={statusMeta.label} variant={statusMeta.variant} />
      </div>

      <div className="mt-4 border-t border-white/10" />

      <p className="mt-4 text-sm">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Chat ID:
        </span>{" "}
        <span className="font-medium text-foreground" aria-label="Masked Telegram chat ID">
          {initialStatus.chatIdMasked ?? "—"}
        </span>
      </p>

      {feedback ? (
        <p
          className={cn(
            "mt-3 text-xs",
            error || initialStatus.lastError ? "text-destructive" : "text-muted-foreground"
          )}
          role={error || initialStatus.lastError ? "alert" : "status"}
        >
          {feedback}
        </p>
      ) : null}

      <div className="mt-4 flex flex-nowrap items-center gap-2.5">
        <Button
          type="button"
          variant="outline"
          className="h-9 shrink-0 rounded-full border-white/30 bg-gradient-to-b from-white/[0.1] to-white/[0.03] px-4 text-sm font-medium whitespace-nowrap text-white/90 shadow-[inset_0_1px_0_oklch(1_0_0/18%)] hover:border-white/45 hover:from-white/[0.14] hover:to-white/[0.06] hover:text-white disabled:opacity-40"
          onClick={handleConnect}
          disabled={isConnecting}
          aria-label={needsReconnect ? "Reconnect Telegram account" : "Connect Telegram account"}
        >
          {connectLabel}
        </Button>
        <Button
          type="button"
          variant="default"
          className="h-9 shrink-0 rounded-full px-4 text-sm font-medium whitespace-nowrap"
          onClick={handleTest}
          disabled={isTesting || !canSendTest}
          aria-label="Send test Telegram alert"
        >
          {isTesting ? "Sending…" : "Send test alert"}
        </Button>
      </div>
    </section>
  )
}
