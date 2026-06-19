import type { LucideIcon } from "lucide-react"
import { Inbox } from "lucide-react"
import { ButtonLink } from "@/components/ui/button"

type EmptyStateProps = {
  title: string
  description: string
  icon?: LucideIcon
  actionHref?: string
  actionLabel?: string
  variant?: "card" | "plain"
}

export const EmptyState = ({
  title,
  description,
  icon: Icon = Inbox,
  actionHref,
  actionLabel,
  variant = "card",
}: EmptyStateProps) => {
  return (
    <div
      className={
        variant === "plain"
          ? "py-12 text-center"
          : "surface-card border-dashed p-8 text-center"
      }
    >
      <Icon className="mx-auto size-8 text-white/45" aria-hidden="true" />
      <p className="mt-3 text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      {actionHref && actionLabel ? (
        <div className="mt-4">
          <ButtonLink href={actionHref}>{actionLabel}</ButtonLink>
        </div>
      ) : null}
    </div>
  )
}
