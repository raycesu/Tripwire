import { Badge } from "@/components/ui/badge"

type AssetResolutionBadgeProps = {
  resolutionStatus: string
  unsupportedReason?: string | null
}

const getResolutionLabel = (status: string, unsupportedReason?: string | null) => {
  if (status === "resolved") {
    return "Provider resolved"
  }

  if (status === "unsupported") {
    return unsupportedReason ?? "Unsupported"
  }

  return "Pending provider review"
}

const getResolutionVariant = (status: string): "default" | "success" | "warning" | "destructive" => {
  if (status === "resolved") {
    return "success"
  }

  if (status === "unsupported") {
    return "destructive"
  }

  return "warning"
}

export const AssetResolutionBadge = ({
  resolutionStatus,
  unsupportedReason,
}: AssetResolutionBadgeProps) => {
  const label = getResolutionLabel(resolutionStatus, unsupportedReason)
  const variant = getResolutionVariant(resolutionStatus)

  return <Badge variant={variant}>{label}</Badge>
}
