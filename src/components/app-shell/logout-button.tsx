"use client"

import { SignOutButton } from "@clerk/nextjs"
import { LogOut } from "lucide-react"
import { cn } from "@/lib/utils"

export const LogoutButton = () => {
  return (
    <SignOutButton redirectUrl="/">
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all",
          "nav-link-idle"
        )}
        aria-label="Log out"
      >
        <LogOut className="size-4" aria-hidden="true" />
        Log out
      </button>
    </SignOutButton>
  )
}
