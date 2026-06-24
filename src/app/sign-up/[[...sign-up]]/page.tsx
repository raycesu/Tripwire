import type { Metadata } from "next"
import { SignUp } from "@clerk/nextjs"
import { UserPlus } from "lucide-react"

import { AuthCard } from "@/components/auth/auth-card"
import { AuthPageShell } from "@/components/auth/auth-page-shell"
import { authPageClerkAppearance } from "@/lib/auth/clerk-appearance"

export const metadata: Metadata = {
  title: "Sign up",
  robots: {
    index: false,
    follow: false,
  },
}

export default function SignUpPage() {
  return (
    <AuthPageShell>
      <AuthCard
        icon={UserPlus}
        title="Create your account"
        subtitle="Score contrarian opportunities."
      >
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          forceRedirectUrl="/dashboard"
          appearance={authPageClerkAppearance}
        />
      </AuthCard>
    </AuthPageShell>
  )
}
