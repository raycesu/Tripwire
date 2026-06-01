import type { LucideIcon } from "lucide-react"
import { Inbox } from "lucide-react"
import { ButtonLink } from "@/components/ui/button"

type EmptyStateProps = {
  title: string
  description: string
  icon?: LucideIcon
  actionHref?: string
  actionLabel?: string
}

export const EmptyState = ({
  title,
  description,
  icon: Icon = Inbox,
  actionHref,
  actionLabel,
}: EmptyStateProps) => {
  return (
    <div className="rounded-lg border border-dashed border-border p-8 text-center">
      <Icon className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
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
