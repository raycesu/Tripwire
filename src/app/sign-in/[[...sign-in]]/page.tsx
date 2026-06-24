import type { Metadata } from "next"
import { SignIn } from "@clerk/nextjs"
import { LogIn } from "lucide-react"

import { AuthCard } from "@/components/auth/auth-card"
import { AuthPageShell } from "@/components/auth/auth-page-shell"
import { authPageClerkAppearance } from "@/lib/auth/clerk-appearance"

export const metadata: Metadata = {
  title: "Sign in",
  robots: {
    index: false,
    follow: false,
  },
}

export default function SignInPage() {
  return (
    <AuthPageShell>
      <AuthCard
        icon={LogIn}
        title="Sign in with email"
        subtitle="Your signals are waiting."
      >
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          forceRedirectUrl="/dashboard"
          appearance={authPageClerkAppearance}
        />
      </AuthCard>
    </AuthPageShell>
  )
}
