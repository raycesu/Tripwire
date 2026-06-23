import type { AlertRule } from "@/db/schema"
import type { ScoreSnapshotRecord } from "@/lib/scores/snapshots"
import { parseAlertOperator } from "@/lib/alerts/types"
import { formatScore } from "@/lib/scores/labels"
import { logWarn } from "@/lib/logging/logger"
import type { SectorName } from "@/scoring/types"

const formatSectorLabel = (sector: SectorName): string =>
  sector.charAt(0).toUpperCase() + sector.slice(1)

export const parseSnapshotScore = (score: string | null): number | null => {
  if (score === null) {
    return null
  }

  const normalized = score.replace(/^\+/, "")
  const numeric = Number(normalized)

  if (Number.isNaN(numeric)) {
    return null
  }

  return numeric
}

export const getRuleTargetSector = (rule: Pick<AlertRule, "scope" | "sector">): SectorName => {
  if (rule.scope === "composite") {
    return "composite"
  }

  return (rule.sector ?? "macro") as SectorName
}

export const isRuleWithinCooldown = (
  cooldownMinutes: number,
  lastSentAt: Date | null | undefined,
  now: Date
): boolean => {
  if (cooldownMinutes <= 0) {
    return false
  }

  if (!lastSentAt) {
    return false
  }

  const cooldownMs = cooldownMinutes * 60_000
  return now.getTime() - lastSentAt.getTime() < cooldownMs
}

export const doesRuleMatchSnapshot = (
  rule: Pick<AlertRule, "operator" | "threshold">,
  snapshot: Pick<ScoreSnapshotRecord, "score" | "isNull" | "isStale">
): boolean => {
  if (snapshot.isNull || snapshot.isStale) {
    return false
  }

  const scoreValue = parseSnapshotScore(snapshot.score)

  if (scoreValue === null) {
    return false
  }

  const threshold = Number(rule.threshold)

  if (rule.operator === "above") {
    return scoreValue > threshold
  }

  logWarn({
    event: "alert_unknown_operator",
    operator: rule.operator,
  })

  return false
}

export const prioritizeAlertRules = <T extends Pick<AlertRule, "scope">>(rules: T[]): T[] => {
  return [...rules].sort((a, b) => {
    if (a.scope === b.scope) {
      return 0
    }

    if (a.scope === "composite") {
      return -1
    }

    return 1
  })
}

export type BuildAlertMessageInput = {
  assetSymbol: string
  rule: Pick<AlertRule, "scope" | "sector" | "operator" | "threshold">
  snapshot: ScoreSnapshotRecord
  sectorSnapshots: Record<SectorName, ScoreSnapshotRecord | null>
}

export const buildAlertMessage = (input: BuildAlertMessageInput): string => {
  const sector = getRuleTargetSector(input.rule)
  const sectorLabel = formatSectorLabel(sector)
  const triggeredScore = formatScore(input.snapshot.score)
  const thresholdLabel = Number(input.rule.threshold).toFixed(2)
  const operator = parseAlertOperator(input.rule.operator)

  const sectorScorePart = (name: SectorName, label: string): string => {
    const snap = input.sectorSnapshots[name]

    if (!snap || snap.isNull || snap.score === null) {
      return `${label}: —`
    }

    return `${label}: ${formatScore(snap.score)}`
  }

  const sectorScoresLine = [
    sectorScorePart("macro", "Macro"),
    sectorScorePart("relativity", "Relativity"),
    sectorScorePart("volume", "Volume"),
  ].join("  |  ")

  return [
    `🔔 ${input.assetSymbol} Alert – ${sectorLabel}: ${triggeredScore}`,
    sectorScoresLine,
    `Rule: ${sectorLabel} ${operator} ${thresholdLabel}`,
  ].join("\n")
}

export type AlertMessageSectorScores = {
  composite: number | null
  macro: number | null
  relativity: number | null
  volume: number | null
}

const parseAlertMessageScoreLine = (message: string, label: string): number | null => {
  const regex = new RegExp(`${label}:\\s*([+-]?\\d+\\.\\d+|—|-)`, "i")
  const match = message.match(regex)

  if (!match) {
    return null
  }

  const value = match[1].trim()

  if (value === "—" || value === "-") {
    return null
  }

  return parseSnapshotScore(value)
}

export const parseAlertMessageSectorScores = (message: string): AlertMessageSectorScores => ({
  composite: parseAlertMessageScoreLine(message, "Composite"),
  macro: parseAlertMessageScoreLine(message, "Macro"),
  relativity: parseAlertMessageScoreLine(message, "Relativity"),
  volume: parseAlertMessageScoreLine(message, "Volume"),
})
