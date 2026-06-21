import type { LucideIcon } from "lucide-react"

type AuthCardProps = {
  icon: LucideIcon
  title: string
  subtitle: string
  children: React.ReactNode
}

export const AuthCard = ({ icon: Icon, title, subtitle, children }: AuthCardProps) => {
  return (
    <div className="relative w-full max-w-[420px]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[2rem] bg-[radial-gradient(ellipse_at_center,oklch(1_0_0/8%),transparent_70%)] blur-2xl"
      />
      <div className="surface-card relative rounded-3xl px-6 py-7 sm:px-8 sm:py-8">
        <div className="mb-5 flex flex-col items-center gap-3 text-center">
          <div
            className="icon-silver-glow flex size-11 items-center justify-center rounded-xl"
            aria-hidden="true"
          >
            <Icon className="size-5 text-white" />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-bold text-white sm:text-2xl">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <div className="auth-clerk-root w-full min-w-0">{children}</div>
      </div>
    </div>
  )
}
