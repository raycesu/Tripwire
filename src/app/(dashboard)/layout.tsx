import { UserButton } from "@clerk/nextjs"
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
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-8">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Tripwire</p>
              <p className="text-sm font-medium text-foreground">Contrarian opportunity dashboard</p>
            </div>
            <DashboardNav />
          </div>
          <UserButton />
        </div>
      </header>
      {children}
    </div>
  )
}
