"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", label: "Watchlist" },
  { href: "/alerts", label: "Alerts" },
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
              "rounded-full px-3 py-1.5 text-sm font-medium transition-all",
              isActive ? "nav-link-active" : "nav-link-idle"
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
