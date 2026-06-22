import Link from "next/link"
import { AddAssetsProvider } from "@/components/assets/add-assets-provider"
import { DashboardNav } from "@/components/app-shell/dashboard-nav"
import { LogoutButton } from "@/components/app-shell/logout-button"
import { TripwireLogo } from "@/components/brand/tripwire-logo"
import { ensureDbUser } from "@/lib/auth/ensure-user"

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  await ensureDbUser()

  return (
    <AddAssetsProvider>
      <div className="app-shell-root relative flex min-h-screen flex-col bg-shell-glow">
        <header className="relative z-10">
          <div className="mx-auto flex h-28 w-full max-w-6xl items-center justify-between gap-4 px-6">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" aria-label="Tripwire dashboard">
                <TripwireLogo />
              </Link>
              <DashboardNav />
            </div>
            <LogoutButton />
          </div>
        </header>
        <div className="relative z-10">{children}</div>
      </div>
    </AddAssetsProvider>
  )
}
