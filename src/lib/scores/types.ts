import type { Cadence, SectorName } from "@/scoring/types"

export type ScoreSnapshotView = {
  id: string
  sector: SectorName | "composite"
  score: string | null
  isNull: boolean
  nullReason: string | null
  isStale: boolean
  componentsJson: Record<string, unknown> | null
  computedAt: Date
  validForDate: Date
  cadence: Cadence | string
}

export type ScoreHistoryPoint = {
  validForDate: Date
  score: number
  computedAt: Date
  isStale: boolean
}

export type AssetSnapshotsSummary = {
  assetId: string
  composite: ScoreSnapshotView | null
  macro: ScoreSnapshotView | null
  relativity: ScoreSnapshotView | null
  volume: ScoreSnapshotView | null
  lastComputedAt: Date | null
}
