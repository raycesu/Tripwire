"use client"

import { TooltipProvider } from "@/components/ui/tooltip"

type AppTooltipProviderProps = {
  children: React.ReactNode
}

export const AppTooltipProvider = ({ children }: AppTooltipProviderProps) => {
  return <TooltipProvider>{children}</TooltipProvider>
}
