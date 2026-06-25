import { AppShellHeaderBar } from "@/components/app-shell/app-shell-header-bar"
import {
  APP_SHELL_HEADER_HEIGHT_CLASS,
  APP_SHELL_HEADER_PADDING,
  appShellLogoOffsetStyle,
} from "@/components/app-shell/app-shell-layout"
import { AppShellLogoLink } from "@/components/app-shell/app-shell-logo-link"
import {
  LandingCtaPrimary,
  LandingCtaSecondary,
} from "@/components/marketing/landing-cta"

export const LandingHeader = () => {
  return (
    <header className="relative z-10 shrink-0">
      <AppShellHeaderBar
        paddingLeftRem={APP_SHELL_HEADER_PADDING.leftRem}
        paddingRightRem={APP_SHELL_HEADER_PADDING.rightRem}
        heightClass={APP_SHELL_HEADER_HEIGHT_CLASS}
      >
        <div className="shrink-0" style={appShellLogoOffsetStyle}>
          <AppShellLogoLink href="/" ariaLabel="Tripwire home" />
        </div>
        <div className="flex items-center gap-3">
          <LandingCtaSecondary href="/sign-in">Sign in</LandingCtaSecondary>
          <LandingCtaPrimary href="/sign-up">Get started</LandingCtaPrimary>
        </div>
      </AppShellHeaderBar>
    </header>
  )
}
