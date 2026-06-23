import Link from "next/link"

import { TripwireLogo } from "@/components/brand/tripwire-logo"
import {
  LandingCtaPrimary,
  LandingCtaSecondary,
} from "@/components/marketing/landing-cta"

/** Logo horizontal offset — more negative = further left (e.g. -2, -2.5) */
const LOGO_MARGIN_LEFT_REM = -1.25

export const LandingHeader = () => {
  return (
    <header className="relative z-10 shrink-0">
      <div className="mx-auto flex h-28 w-full max-w-6xl items-center justify-between gap-4 pl-0 pr-6">
        <Link
          href="/"
          aria-label="Tripwire home"
          style={{ marginLeft: `${LOGO_MARGIN_LEFT_REM}rem` }}
        >
          <TripwireLogo />
        </Link>
        <div className="flex items-center gap-3">
          <LandingCtaSecondary href="/sign-in">Sign in</LandingCtaSecondary>
          <LandingCtaPrimary href="/sign-up">Get started</LandingCtaPrimary>
        </div>
      </div>
    </header>
  )
}
