import { UserButton } from "@clerk/nextjs"
import { TripwireLogo } from "@/components/brand/tripwire-logo"
import { DashboardNav } from "@/components/app-shell/dashboard-nav"
import { ensureDbUser } from "@/lib/auth/ensure-user"

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  await ensureDbUser()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-card/70 backdrop-blur">
        <div className="mx-auto flex h-28 w-full max-w-6xl items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-8">
            <TripwireLogo />
            <DashboardNav />
          </div>
          <UserButton />
        </div>
      </header>
      {children}
    </div>
  )
}
