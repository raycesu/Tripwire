import { AddAssetsProvider } from "@/components/assets/add-assets-provider"
import { DashboardNav } from "@/components/app-shell/dashboard-nav"
import { AppShellHeaderBar } from "@/components/app-shell/app-shell-header-bar"
import {
  APP_SHELL_HEADER_HEIGHT_CLASS,
  APP_SHELL_HEADER_PADDING,
  appShellLogoOffsetStyle,
} from "@/components/app-shell/app-shell-layout"
import { AppShellLogoLink } from "@/components/app-shell/app-shell-logo-link"
import { LogoutButton } from "@/components/app-shell/logout-button"
import { SettingsMenu } from "@/components/app-shell/settings-menu"
import { ensureDbUser } from "@/lib/auth/ensure-user"
import { getTelegramConnectionStatus } from "@/lib/telegram/queries"

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const user = await ensureDbUser()
  const telegramStatus = await getTelegramConnectionStatus(user.id)

  return (
    <div className="app-shell-root relative flex min-h-screen flex-col bg-shell-glow">
      <header className="relative z-10">
        <AppShellHeaderBar
          paddingLeftRem={APP_SHELL_HEADER_PADDING.leftRem}
          paddingRightRem={APP_SHELL_HEADER_PADDING.rightRem}
          heightClass={APP_SHELL_HEADER_HEIGHT_CLASS}
        >
          <div className="relative z-10 shrink-0" style={appShellLogoOffsetStyle}>
            <AppShellLogoLink href="/dashboard" ariaLabel="Tripwire dashboard" />
          </div>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="pointer-events-auto">
              <DashboardNav />
            </div>
          </div>
          <div className="relative z-10 flex items-center gap-2">
            <SettingsMenu initialStatus={telegramStatus} />
            <LogoutButton />
          </div>
        </AppShellHeaderBar>
      </header>
      <AddAssetsProvider>
        <div className="relative z-10 flex flex-1 flex-col">{children}</div>
      </AddAssetsProvider>
    </div>
  )
}
