import type { SourceMetadata } from "@/providers/types"

export type SectorName = "macro" | "relativity" | "volume" | "composite"

export type Cadence = "daily" | "weekly" | "manual" | "provisional"

export type SectorScoreResult = {
  score: number | null
  isNull: boolean
  nullReason: string | null
  components: Record<string, unknown>
  sourceMetadata?: SourceMetadata | SourceMetadata[]
  validForDate?: Date
}

export type SectorSnapshotInput = {
  sector: SectorName
  score: string | null
  isNull: boolean
  nullReason: string | null
  isStale: boolean
  computedAt: Date
  cadence: Cadence
}
