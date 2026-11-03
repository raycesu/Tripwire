import { db } from "@/db/client"
import { assets } from "@/db/schema"
import { finalizeAssetDto } from "@/lib/assets/backfill-stock-exchange"
import { resolveBenchmarkSymbol } from "@/lib/assets/benchmark"
import {
  getCatalogEntryBySymbol,
  listCatalogEntriesBySymbol,
  type CatalogSearchResult,
} from "@/lib/assets/catalog-queries"
import { getAssetBySymbol, getAssetsBySymbol } from "@/lib/assets/queries"
import {
  resolveCryptoAssetBySymbol,
  resolveStockAssetBySymbol,
} from "@/lib/assets/resolve-assets"
import type { AssetDto, AssetType } from "@/lib/assets/types"

export type AssetChoice = {
  symbol: string
  name: string
  assetType: AssetType
  exchange: string | null
}

export type EnsureAssetResult =
  | { status: "ready"; asset: AssetDto }
  | { status: "ambiguous"; choices: AssetChoice[] }
  | { status: "missing" }

const sortChoices = (left: AssetChoice, right: AssetChoice): number => {
  if (left.assetType === right.assetType) {
    return left.symbol.localeCompare(right.symbol)
  }

  return left.assetType === "crypto" ? -1 : 1
}

const buildChoices = (
  catalogEntries: CatalogSearchResult[],
  existingAssets: AssetDto[]
): AssetChoice[] => {
  const byType = new Map<AssetType, AssetChoice>()

  for (const entry of catalogEntries) {
    byType.set(entry.assetType, {
      symbol: entry.symbol,
      name: entry.name,
      assetType: entry.assetType,
      exchange: entry.exchange,
    })
  }

  for (const asset of existingAssets) {
    if (byType.has(asset.assetType)) {
      continue
    }

    byType.set(asset.assetType, {
      symbol: asset.symbol,
      name: asset.name,
      assetType: asset.assetType,
      exchange: asset.exchange,
    })
  }

  return Array.from(byType.values()).sort(sortChoices)
}

const ensureTypedAsset = async (
  symbol: string,
  assetType: AssetType
): Promise<AssetDto | null> => {
  const existing = await getAssetBySymbol(symbol, assetType)

  if (existing) {
    if (existing.resolutionStatus === "needs_review") {
      if (existing.assetType === "crypto") {
        await resolveCryptoAssetBySymbol(symbol)
      } else {
        await resolveStockAssetBySymbol(symbol)
      }

      return finalizeAssetDto(await getAssetBySymbol(symbol, assetType))
    }

    return finalizeAssetDto(existing)
  }

  const catalogEntry = await getCatalogEntryBySymbol(symbol, assetType)

  if (!catalogEntry) {
    return null
  }

  const now = new Date()
  const benchmarkSymbol = resolveBenchmarkSymbol(catalogEntry.symbol, catalogEntry.assetType)

  const inserted = await db
    .insert(assets)
    .values({
      symbol: catalogEntry.symbol,
      name: catalogEntry.name,
      assetType: catalogEntry.assetType,
      providerSymbol: catalogEntry.assetType === "stock" ? catalogEntry.symbol : null,
      providerName: catalogEntry.assetType === "stock" ? "twelve_data" : null,
      quoteAsset: catalogEntry.assetType === "crypto" ? "USDT" : null,
      exchange: catalogEntry.assetType === "stock" ? catalogEntry.exchange : null,
      benchmarkSymbol,
      resolutionStatus: "needs_review",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing({
      target: [assets.symbol, assets.assetType],
    })
    .returning({ id: assets.id })

  if (inserted.length === 0) {
    const raced = await getAssetBySymbol(symbol, assetType)

    if (!raced) {
      return null
    }

    return finalizeAssetDto(raced)
  }

  if (catalogEntry.assetType === "crypto") {
    await resolveCryptoAssetBySymbol(symbol)
  } else {
    await resolveStockAssetBySymbol(symbol)
  }

  return finalizeAssetDto(await getAssetBySymbol(symbol, assetType))
}

export const ensureAsset = async (
  symbol: string,
  assetType?: AssetType
): Promise<EnsureAssetResult> => {
  const normalized = symbol.trim().toUpperCase()

  if (!normalized) {
    return { status: "missing" }
  }

  if (assetType) {
    const asset = await ensureTypedAsset(normalized, assetType)

    if (!asset) {
      return { status: "missing" }
    }

    return { status: "ready", asset }
  }

  const [catalogEntries, existingAssets] = await Promise.all([
    listCatalogEntriesBySymbol(normalized),
    getAssetsBySymbol(normalized),
  ])
  const choices = buildChoices(catalogEntries, existingAssets)

  if (choices.length > 1) {
    return { status: "ambiguous", choices }
  }

  const onlyChoice = choices[0]

  if (!onlyChoice) {
    return { status: "missing" }
  }

  const asset = await ensureTypedAsset(normalized, onlyChoice.assetType)

  if (!asset) {
    return { status: "missing" }
  }

  return { status: "ready", asset }
}
