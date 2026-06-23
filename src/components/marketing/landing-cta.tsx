import { ArrowRight } from "lucide-react"
import Link from "next/link"

import { cn } from "@/lib/utils"

import styles from "./landing-cta.module.css"

type LandingCtaPrimaryProps = {
  href: string
  children: React.ReactNode
  showArrow?: boolean
  size?: "default" | "hero"
  className?: string
}

type LandingCtaSecondaryProps = {
  href: string
  children: React.ReactNode
  className?: string
}

export const LandingCtaPrimary = ({
  href,
  children,
  showArrow = false,
  size = "default",
  className,
}: LandingCtaPrimaryProps) => (
  <Link
    href={href}
    className={cn(
      "group outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
      styles.primary,
      size === "hero" && styles.primaryHero,
      className
    )}
  >
    {children}
    {showArrow ? (
      <ArrowRight
        aria-hidden
        className="size-4 transition-transform group-hover:translate-x-0.5"
      />
    ) : null}
  </Link>
)

export const LandingCtaSecondary = ({
  href,
  children,
  className,
}: LandingCtaSecondaryProps) => (
  <Link
    href={href}
    className={cn(
      "outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
      styles.secondary,
      className
    )}
  >
    {children}
  </Link>
)
