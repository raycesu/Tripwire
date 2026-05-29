import type { Asset } from "@/db/schema"

export type AssetType = "crypto" | "stock"

export type AssetDto = {
  id: string
  symbol: string
  name: string
  assetType: AssetType
  providerSymbol: string | null
  providerName: string | null
  quoteAsset: string | null
  benchmarkSymbol: string | null
  resolutionStatus: string
  unsupportedReason: string | null
  isActive: boolean
}

export const toAssetDto = (asset: Asset): AssetDto => ({
  id: asset.id,
  symbol: asset.symbol,
  name: asset.name,
  assetType: asset.assetType as AssetType,
  providerSymbol: asset.providerSymbol,
  providerName: asset.providerName,
  quoteAsset: asset.quoteAsset,
  benchmarkSymbol: asset.benchmarkSymbol,
  resolutionStatus: asset.resolutionStatus,
  unsupportedReason: asset.unsupportedReason,
  isActive: asset.isActive,
})
