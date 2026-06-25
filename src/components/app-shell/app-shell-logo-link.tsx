import { TripwireLogo } from "@/components/brand/tripwire-logo"

type AppShellLogoLinkProps = {
  href: string
  ariaLabel: string
}

/** Plain anchor — avoids Next Link client hydration dropping logo offset styles. */
export const AppShellLogoLink = ({ href, ariaLabel }: AppShellLogoLinkProps) => {
  return (
    <a href={href} aria-label={ariaLabel} className="inline-block shrink-0">
      <TripwireLogo />
    </a>
  )
}
