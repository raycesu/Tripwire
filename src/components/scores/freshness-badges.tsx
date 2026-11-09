import { Badge } from "@/components/ui/badge"
import { formatEarlyHistoryBadge } from "@/lib/scores/low-history"

type FreshnessBadgesProps = {
  isNull: boolean
  nullReason?: string | null
  isStale: boolean
  cadence: string
  lowHistory?: boolean
  candleCount?: number | null
}

export const FreshnessBadges = ({
  isNull,
  nullReason,
  isStale,
  cadence,
  lowHistory = false,
  candleCount = null,
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

  if (lowHistory) {
    return <Badge variant="warning">{formatEarlyHistoryBadge(candleCount)}</Badge>
  }

  if (isStale) {
    return <Badge variant="warning">Stale</Badge>
  }

  return null
}
