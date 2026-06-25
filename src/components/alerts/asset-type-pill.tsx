import type { AssetType } from "@/lib/assets/types"
import { cn } from "@/lib/utils"

type AssetTypePillProps = {
  assetType: AssetType
  className?: string
}

export const AssetTypePill = ({ assetType, className }: AssetTypePillProps) => (
  <span
    className={cn(
      "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
      assetType === "crypto"
        ? "border-sky-400/30 bg-sky-400/10 text-sky-300"
        : "border-destructive/30 bg-destructive/10 text-destructive",
      className
    )}
  >
    {assetType}
  </span>
)
