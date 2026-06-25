"use client"

import { Settings } from "lucide-react"
import { useState } from "react"
import { TelegramConnectPanel } from "@/components/settings/telegram-connect-panel"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { TelegramConnectionStatus } from "@/lib/telegram/queries"

type SettingsMenuProps = {
  initialStatus: TelegramConnectionStatus
}

export const SettingsMenu = ({ initialStatus }: SettingsMenuProps) => {
  const [open, setOpen] = useState(false)

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        type="button"
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-full transition-all",
          "nav-link-idle border border-white/28 bg-white/[0.04]",
          open && "nav-link-active"
        )}
        aria-label="Settings"
        aria-expanded={open}
      >
        <Settings className="size-4" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent align="end" side="bottom" sideOffset={8}>
        <TelegramConnectPanel initialStatus={initialStatus} />
      </PopoverContent>
    </Popover>
  )
}
