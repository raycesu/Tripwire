"use client"

import { Send } from "lucide-react"
import { cn } from "@/lib/utils"

type HeroAlertToastProps = {
  visible: boolean
  className?: string
}

const ALERT_MESSAGE = "Alert sent · BTC composite is above 1.5"

export const HeroAlertToast = ({ visible, className }: HeroAlertToastProps) => {
  return (
    <div
      className={cn(
        "flex items-center gap-2 transition-all duration-500",
        visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
        className
      )}
      role="status"
      aria-live="polite"
      aria-hidden={!visible}
    >
      <Send
        className="size-4 shrink-0 text-[oklch(0.72_0.16_145)]"
        aria-hidden="true"
      />
      <p className="text-sm font-medium text-[oklch(0.72_0.16_145)]">{ALERT_MESSAGE}</p>
    </div>
  )
}
