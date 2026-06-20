import type { AlertRule } from "@/db/schema"
import type { ScoreSnapshotRecord } from "@/lib/scores/snapshots"
import { formatRuleLabel, type AlertScope } from "@/lib/alerts/types"
import { formatScore } from "@/lib/scores/labels"
import { formatScoreNumber } from "@/scoring/thresholds"
import type { SectorName } from "@/scoring/types"

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
  const scope = input.rule.scope as AlertScope
  const sector = getRuleTargetSector(input.rule)
  const triggeredValue = parseSnapshotScore(input.snapshot.score) ?? 0
  const ruleLabel = formatRuleLabel({
    scope,
    sector: input.rule.sector as SectorName | null,
    operator: "above",
    threshold: Number(input.rule.threshold),
  })

  const sectorLine = (name: SectorName, label: string): string => {
    const snap = input.sectorSnapshots[name]

    if (!snap || snap.isNull || snap.score === null) {
      return `${label}: —`
    }

    return `${label}: ${formatScore(snap.score)}`
  }

  return [
    "Tripwire Alert",
    "",
    `${input.assetSymbol} ${sector} is above ${Number(input.rule.threshold).toFixed(2)}`,
    "",
    sectorLine("composite", "Composite"),
    sectorLine("macro", "Macro"),
    sectorLine("relativity", "Relativity"),
    sectorLine("volume", "Volume"),
    "",
    `Triggered: ${formatScoreNumber(triggeredValue)}`,
    "",
    `Reason: Your alert rule "${ruleLabel}" matched the latest score update.`,
  ].join("\n")
}

export type AlertMessageSectorScores = {
  composite: number | null
  macro: number | null
  relativity: number | null
  volume: number | null
}

const parseAlertMessageScoreLine = (message: string, label: string): number | null => {
  const regex = new RegExp(`^${label}:\\s*(.+)$`, "m")
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
