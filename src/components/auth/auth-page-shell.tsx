import Link from "next/link"

import { AuthBodyLock } from "@/components/auth/auth-body-lock"
import { TripwireLogo } from "@/components/brand/tripwire-logo"

type AuthPageShellProps = {
  children: React.ReactNode
}

export const AuthPageShell = ({ children }: AuthPageShellProps) => {
  return (
    <>
      <AuthBodyLock />
      <div className="auth-page app-shell-root relative flex h-dvh min-h-dvh w-full flex-col overflow-hidden bg-shell-glow">
        <div className="relative z-10 flex h-full min-h-0 flex-col">
          <header className="relative shrink-0">
            <div className="mx-auto flex h-28 w-full max-w-6xl items-center px-6">
              <Link href="/" aria-label="Tripwire home">
                <TripwireLogo />
              </Link>
            </div>
          </header>
          <main className="flex min-h-0 flex-1 items-center justify-center overflow-hidden px-6 py-4">
            {children}
          </main>
        </div>
      </div>
    </>
  )
}
