import { cn } from "@/lib/utils"

type TripwireLogoProps = {
  className?: string
  showWordmark?: boolean
}

export const TripwireLogo = ({ className, showWordmark = true }: TripwireLogoProps) => {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="size-8 shrink-0"
        aria-hidden="true"
      >
        <circle cx="16" cy="16" r="14" className="stroke-border" strokeWidth="1.5" />
        <circle cx="16" cy="16" r="4" className="fill-muted-foreground/40" />
        <path
          d="M6 16h8M18 16h8"
          className="stroke-accent/70"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="6" cy="16" r="2" className="fill-accent/50" />
        <circle cx="26" cy="16" r="2" className="fill-accent/50" />
      </svg>
      {showWordmark ? (
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Tripwire
          </p>
          <p className="text-sm font-medium leading-tight text-foreground">Opportunity radar</p>
        </div>
      ) : null}
    </div>
  )
}
