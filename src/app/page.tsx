import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

import { LandingBodyLock } from "@/components/marketing/landing-body-lock"
import { LandingHeader } from "@/components/marketing/landing-header"
import { LandingHero } from "@/components/marketing/landing-hero"
import { LandingStats } from "@/components/marketing/landing-stats"

export default async function Home() {
  const { userId } = await auth()
  if (userId) redirect("/dashboard")

  return (
    <>
      <LandingBodyLock />
      <div className="app-shell-root relative flex h-dvh min-h-dvh w-full flex-col overflow-hidden bg-shell-glow">
        <div className="relative z-10 flex h-full min-h-0 flex-col">
          <LandingHeader />
          <main className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col justify-center gap-10 px-6 pb-16 pt-4 sm:gap-12 sm:pb-20 sm:pt-6">
            <LandingHero />
            <LandingStats />
          </main>
        </div>
      </div>
    </>
  )
}
