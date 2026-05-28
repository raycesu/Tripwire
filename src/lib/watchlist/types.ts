import type { AssetDto } from "@/lib/assets/types"

export type WatchlistEntryDto = {
  id: string
  assetId: string
  createdAt: Date
  asset: AssetDto
}
