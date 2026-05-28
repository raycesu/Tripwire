"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/assets", label: "Assets" },
  { href: "/alerts", label: "Alerts" },
  { href: "/settings", label: "Settings" },
] as const

export const DashboardNav = () => {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-1" aria-label="Main navigation">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
