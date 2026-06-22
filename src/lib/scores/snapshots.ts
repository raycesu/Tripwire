import { and, desc, eq, inArray } from "drizzle-orm"
import { db } from "@/db/client"
import { scoreSnapshots } from "@/db/schema"
import { computeComposite } from "@/scoring/composite"
import { computeIsStale, getUtcMidnight } from "@/scoring/staleness"
import { formatScoreNumber } from "@/scoring/thresholds"
import type { Cadence, SectorName, SectorScoreResult, SectorSnapshotInput } from "@/scoring/types"
import type { SourceMetadata } from "@/providers/types"

export type ScoreSnapshotRecord = {
  id: string
  assetId: string
  sector: SectorName
  score: string | null
  isNull: boolean
  nullReason: string | null
  isStale: boolean
  componentsJson: Record<string, unknown> | null
  sourceMetadataJson: SourceMetadata | SourceMetadata[] | null
  computedAt: Date
  validForDate: Date
  cadence: Cadence
}

export type UpsertScoreSnapshotInput = {
  assetId: string
  sector: SectorName
  cadence: Cadence
  validForDate: Date
  result: SectorScoreResult
  sourceMetadata?: SourceMetadata | SourceMetadata[]
}

const toSnapshotInput = (record: ScoreSnapshotRecord): SectorSnapshotInput => ({
  sector: record.sector,
  score: record.score,
  isNull: record.isNull,
  nullReason: record.nullReason,
  isStale: record.isStale,
  computedAt: record.computedAt,
  cadence: record.cadence,
})

const mapRow = (row: typeof scoreSnapshots.$inferSelect): ScoreSnapshotRecord => ({
  id: row.id,
  assetId: row.assetId,
  sector: row.sector as SectorName,
  score: row.score,
  isNull: row.isNull,
  nullReason: row.nullReason,
  isStale: row.isStale,
  componentsJson: row.componentsJson as Record<string, unknown> | null,
  sourceMetadataJson: row.sourceMetadataJson as SourceMetadata | SourceMetadata[] | null,
  computedAt: row.computedAt,
  validForDate: row.validForDate,
  cadence: row.cadence as Cadence,
})

export const resolveValidForDate = (
  sector: SectorName,
  cadence: Cadence,
  result: SectorScoreResult,
  runDate: Date = new Date()
): Date => {
  if (result.validForDate) {
    return getUtcMidnight(result.validForDate)
  }

  return getUtcMidnight(runDate)
}

export const upsertScoreSnapshot = async (
  input: UpsertScoreSnapshotInput
): Promise<ScoreSnapshotRecord> => {
  const computedAt = new Date()
  const isStale = false
  const scoreText =
    input.result.isNull || input.result.score === null
      ? null
      : formatScoreNumber(input.result.score)

  const values = {
    assetId: input.assetId,
    sector: input.sector,
    score: scoreText,
    isNull: input.result.isNull,
    nullReason: input.result.nullReason,
    isStale,
    componentsJson: input.result.components,
    sourceMetadataJson: input.sourceMetadata ?? input.result.sourceMetadata ?? null,
    computedAt,
    validForDate: input.validForDate,
    cadence: input.cadence,
  }

  const rows = await db
    .insert(scoreSnapshots)
    .values(values)
    .onConflictDoUpdate({
      target: [
        scoreSnapshots.assetId,
        scoreSnapshots.sector,
        scoreSnapshots.validForDate,
        scoreSnapshots.cadence,
      ],
      set: {
        score: values.score,
        isNull: values.isNull,
        nullReason: values.nullReason,
        isStale: values.isStale,
        componentsJson: values.componentsJson,
        sourceMetadataJson: values.sourceMetadataJson,
        computedAt: values.computedAt,
      },
    })
    .returning()

  const row = rows[0]

  if (!row) {
    throw new Error(`Failed to upsert score snapshot for ${input.assetId} ${input.sector}`)
  }

  return mapRow(row)
}

const buildLatestSectorSnapshotsMap = (
  rows: (typeof scoreSnapshots.$inferSelect)[]
): Record<SectorName, ScoreSnapshotRecord | null> => {
  const latestBySector = new Map<SectorName, ScoreSnapshotRecord>()

  for (const row of rows) {
    const sector = row.sector as SectorName

    if (latestBySector.has(sector)) {
      continue
    }

    const record = mapRow(row)
    const isStale = computeIsStale(sector, record.cadence, record.computedAt)
    latestBySector.set(sector, { ...record, isStale })
  }

  return {
    macro: latestBySector.get("macro") ?? null,
    relativity: latestBySector.get("relativity") ?? null,
    volume: latestBySector.get("volume") ?? null,
    composite: latestBySector.get("composite") ?? null,
  }
}

export const getLatestSectorSnapshots = async (
  assetId: string
): Promise<Record<SectorName, ScoreSnapshotRecord | null>> => {
  const rows = await db
    .select()
    .from(scoreSnapshots)
    .where(eq(scoreSnapshots.assetId, assetId))
    .orderBy(desc(scoreSnapshots.computedAt))

  return buildLatestSectorSnapshotsMap(rows)
}

export const getLatestSectorSnapshotsForAssets = async (
  assetIds: string[]
): Promise<Map<string, Record<SectorName, ScoreSnapshotRecord | null>>> => {
  const result = new Map<string, Record<SectorName, ScoreSnapshotRecord | null>>()

  if (assetIds.length === 0) {
    return result
  }

  for (const assetId of assetIds) {
    result.set(assetId, {
      macro: null,
      relativity: null,
      volume: null,
      composite: null,
    })
  }

  const rows = await db
    .select()
    .from(scoreSnapshots)
    .where(inArray(scoreSnapshots.assetId, assetIds))
    .orderBy(desc(scoreSnapshots.computedAt))

  const rowsByAssetId = new Map<string, (typeof scoreSnapshots.$inferSelect)[]>()

  for (const row of rows) {
    const assetRows = rowsByAssetId.get(row.assetId) ?? []
    assetRows.push(row)
    rowsByAssetId.set(row.assetId, assetRows)
  }

  for (const assetId of assetIds) {
    const assetRows = rowsByAssetId.get(assetId) ?? []
    result.set(assetId, buildLatestSectorSnapshotsMap(assetRows))
  }

  return result
}

export const recomputeComposite = async (
  assetId: string,
  validForDate: Date = getUtcMidnight()
): Promise<ScoreSnapshotRecord> => {
  const snapshots = await getLatestSectorSnapshots(assetId)

  const compositeResult = computeComposite({
    macro: snapshots.macro ? toSnapshotInput(snapshots.macro) : null,
    relativity: snapshots.relativity ? toSnapshotInput(snapshots.relativity) : null,
    volume: snapshots.volume ? toSnapshotInput(snapshots.volume) : null,
  })

  return upsertScoreSnapshot({
    assetId,
    sector: "composite",
    cadence: "daily",
    validForDate,
    result: compositeResult,
  })
}

export const markStaleSnapshots = async (assetId: string): Promise<void> => {
  const snapshots = await getLatestSectorSnapshots(assetId)
  const sectors: SectorName[] = ["macro", "relativity", "volume", "composite"]

  for (const sector of sectors) {
    const snapshot = snapshots[sector]

    if (!snapshot) {
      continue
    }

    const isStale = computeIsStale(sector, snapshot.cadence, snapshot.computedAt)

    if (isStale !== snapshot.isStale) {
      await db
        .update(scoreSnapshots)
        .set({ isStale })
        .where(
          and(
            eq(scoreSnapshots.assetId, assetId),
            eq(scoreSnapshots.sector, sector),
            eq(scoreSnapshots.validForDate, snapshot.validForDate),
            eq(scoreSnapshots.cadence, snapshot.cadence)
          )
        )
    }
  }
}
