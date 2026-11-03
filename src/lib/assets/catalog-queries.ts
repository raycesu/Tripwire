import { and, asc, eq, ilike, or } from "drizzle-orm"
import { db } from "@/db/client"
import { assetCatalog } from "@/db/schema"
import {
  compareCatalogSearchResults,
  type CatalogSearchResult,
} from "@/lib/assets/search-ranking"
import type { AssetType } from "@/lib/assets/types"

export type { CatalogSearchResult } from "@/lib/assets/search-ranking"
export { compareCatalogSearchResults, rankCatalogSearchResult } from "@/lib/assets/search-ranking"

export const listCatalogEntriesBySymbol = async (
  symbol: string
): Promise<CatalogSearchResult[]> => {
  const normalized = symbol.toUpperCase()
  const rows = await db.query.assetCatalog.findMany({
    where: eq(assetCatalog.symbol, normalized),
  })

  return rows.map((row) => ({
    symbol: row.symbol,
    name: row.name,
    assetType: row.assetType as AssetType,
    source: row.source,
    exchange: row.exchange,
  }))
}

export const getCatalogEntryBySymbol = async (
  symbol: string,
  assetType?: AssetType
): Promise<CatalogSearchResult | null> => {
  const normalized = symbol.toUpperCase()

  const row = await db.query.assetCatalog.findFirst({
    where: assetType
      ? and(eq(assetCatalog.symbol, normalized), eq(assetCatalog.assetType, assetType))
      : eq(assetCatalog.symbol, normalized),
  })

  if (!row) {
    return null
  }

  return {
    symbol: row.symbol,
    name: row.name,
    assetType: row.assetType as AssetType,
    source: row.source,
    exchange: row.exchange,
  }
}

export const searchAssetCatalog = async (input: {
  query: string
  assetType?: AssetType
  limit: number
}): Promise<CatalogSearchResult[]> => {
  const normalizedQuery = input.query.trim().toUpperCase()

  if (normalizedQuery.length < 2) {
    return []
  }

  const containsPattern = `%${normalizedQuery}%`
  const typeFilter = input.assetType
    ? eq(assetCatalog.assetType, input.assetType)
    : undefined

  const rows = await db
    .select({
      symbol: assetCatalog.symbol,
      name: assetCatalog.name,
      assetType: assetCatalog.assetType,
      source: assetCatalog.source,
      exchange: assetCatalog.exchange,
    })
    .from(assetCatalog)
    .where(
      and(
        typeFilter,
        or(
          ilike(assetCatalog.symbol, containsPattern),
          ilike(assetCatalog.name, containsPattern)
        )
      )
    )
    .orderBy(asc(assetCatalog.symbol))
    .limit(Math.max(input.limit * 4, 40))

  const unique = new Map<string, CatalogSearchResult>()

  for (const row of rows) {
    const result: CatalogSearchResult = {
      symbol: row.symbol,
      name: row.name,
      assetType: row.assetType as AssetType,
      source: row.source,
      exchange: row.exchange,
    }
    const key = `${result.symbol}:${result.assetType}`
    unique.set(key, result)
  }

  return Array.from(unique.values())
    .sort((left, right) => compareCatalogSearchResults(normalizedQuery, left, right))
    .slice(0, input.limit)
}
