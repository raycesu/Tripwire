import Link from "next/link"

import { TripwireLogo } from "@/components/brand/tripwire-logo"
import { ButtonLink } from "@/components/ui/button"

export const LandingHeader = () => {
  return (
    <header className="relative z-10 shrink-0">
      <div className="mx-auto flex h-28 w-full max-w-6xl items-center justify-between gap-4 px-6">
        <Link href="/" aria-label="Tripwire home">
          <TripwireLogo />
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/sign-in"
            className="nav-link-idle rounded-full px-3 py-1.5 text-sm font-medium transition-all hover:text-white"
          >
            Sign in
          </Link>
          <ButtonLink href="/sign-up" variant="outline" size="lg">
            Get started
          </ButtonLink>
        </div>
      </div>
    </header>
  )
}
