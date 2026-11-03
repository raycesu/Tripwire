import type { AssetType } from "@/lib/assets/types"

export const assetDetailHref = (symbol: string, assetType: AssetType): string => {
  const normalized = symbol.trim().toUpperCase()
  const params = new URLSearchParams({ type: assetType })

  return `/assets/${encodeURIComponent(normalized)}?${params.toString()}`
}
