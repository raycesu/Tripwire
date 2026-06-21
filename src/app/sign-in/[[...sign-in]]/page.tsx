import { SignIn } from "@clerk/nextjs"
import { LogIn } from "lucide-react"

import { AuthCard } from "@/components/auth/auth-card"
import { AuthPageShell } from "@/components/auth/auth-page-shell"
import { authPageClerkAppearance } from "@/lib/auth/clerk-appearance"

export default function SignInPage() {
  return (
    <AuthPageShell>
      <AuthCard
        icon={LogIn}
        title="Sign in with email"
        subtitle="Welcome back. Your watchlist awaits."
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
