import { Badge } from "@/components/ui/badge"

type FreshnessBadgesProps = {
  isNull: boolean
  nullReason?: string | null
  isStale: boolean
  cadence: string
}

export const FreshnessBadges = ({
  isNull,
  nullReason,
  isStale,
  cadence,
}: FreshnessBadgesProps) => {
  if (cadence === "provisional") {
    return <Badge variant="warning">Provisional</Badge>
  }

  if (isNull) {
    return (
      <Badge variant="destructive" title={nullReason ?? undefined}>
        {nullReason ?? "Unavailable"}
      </Badge>
    )
  }

  if (isStale) {
    return <Badge variant="warning">Stale</Badge>
  }

  return null
}
