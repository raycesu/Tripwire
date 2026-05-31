import { cn } from "@/lib/utils"

type TripwireLogoProps = {
  className?: string
  showWordmark?: boolean
}

export const TripwireLogo = ({ className, showWordmark = true }: TripwireLogoProps) => {
  if (!showWordmark) {
    return (
      <img
        src="/icon.svg"
        alt="Tripwire"
        width={32}
        height={32}
        className={cn("size-12 shrink-0", className)}
      />
    )
  }

  return (
    <img
      src="/tripwire_logo.svg"
      alt="Tripwire"
      width={288}
      height={96}
      className={cn("h-24 w-auto shrink-0", className)}
    />
  )
}
