import type { AlertRule } from "@/db/schema"
import type { AssetType } from "@/lib/assets/types"
import type { SectorName } from "@/scoring/types"
import { z } from "zod"

export type AlertScope = "composite" | "sector"

const MINUTES_PER_DAY = 24 * 60

export const cooldownMinutesToDays = (minutes: number) => minutes / MINUTES_PER_DAY

export const cooldownDaysToMinutes = (days: number) => days * MINUTES_PER_DAY

const alertOperatorSchema = z.literal("above")

export const parseAlertOperator = (operator: string): "above" => {
  const parsed = alertOperatorSchema.safeParse(operator)

  if (!parsed.success) {
    return "above"
  }

  return parsed.data
}

export type AlertRuleInitialValues = {
  assetId: string
  scope: AlertScope
  sector?: "macro" | "relativity" | "volume"
  threshold: number
}

export type AlertWatchlistOption = {
  assetId: string
  symbol: string
  name: string
  assetType: AssetType
}

export type AlertRuleDto = {
  id: string
  assetId: string
  assetSymbol: string
  assetName: string
  assetType: AssetType
  scope: AlertScope
  sector: SectorName | null
  operator: "above"
  threshold: number
  cooldownMinutes: number
  isEnabled: boolean
  createdAt: Date
  updatedAt: Date
}

export type AlertRuleWithAsset = AlertRule & {
  asset: { symbol: string; name: string; assetType: string }
}

export const toAlertRuleDto = (rule: AlertRuleWithAsset): AlertRuleDto => ({
  id: rule.id,
  assetId: rule.assetId,
  assetSymbol: rule.asset.symbol,
  assetName: rule.asset.name,
  assetType: rule.asset.assetType as AssetType,
  scope: rule.scope as AlertScope,
  sector: (rule.sector as SectorName | null) ?? null,
  operator: parseAlertOperator(rule.operator),
  threshold: Number(rule.threshold),
  cooldownMinutes: rule.cooldownMinutes,
  isEnabled: rule.isEnabled,
  createdAt: rule.createdAt,
  updatedAt: rule.updatedAt,
})

export type AlertEventSectorScores = {
  composite: number | null
  macro: number | null
  relativity: number | null
  volume: number | null
}

export type AlertEventDto = {
  id: string
  assetSymbol: string
  assetName: string
  ruleLabel: string
  triggeredValue: number
  sectorScores: AlertEventSectorScores
  message: string
  telegramStatus: string
  telegramError: string | null
  sentAt: Date | null
  createdAt: Date
}

export const formatRuleLabel = (rule: Pick<AlertRuleDto, "scope" | "sector" | "operator" | "threshold">): string => {
  const sectorLabel =
    rule.scope === "composite"
      ? "Composite"
      : rule.sector
        ? rule.sector.charAt(0).toUpperCase() + rule.sector.slice(1)
        : "Sector"

  return `${sectorLabel} ${rule.operator} ${rule.threshold}`
}

export const formatConditionPill = (
  rule: Pick<AlertRuleDto, "scope" | "sector" | "threshold">
): string => {
  const sectorLabel =
    rule.scope === "composite"
      ? "Composite"
      : rule.sector
        ? rule.sector.charAt(0).toUpperCase() + rule.sector.slice(1)
        : "Sector"

  const thresholdLabel = Number.isInteger(rule.threshold)
    ? String(rule.threshold)
    : String(rule.threshold)

  return `${sectorLabel} > ${thresholdLabel}`
}

const formatPreviewThreshold = (threshold: number): string => {
  const prefix = threshold > 0 ? "+" : ""
  return `${prefix}${threshold.toFixed(1)}`
}

export const buildAlertRulePreview = ({
  symbol,
  scope,
  sector,
  threshold,
}: {
  symbol: string
  scope: AlertScope
  sector: SectorName | null
  threshold: number
}): string => {
  const thresholdLabel = formatPreviewThreshold(threshold)

  if (scope === "composite") {
    return `Alert me when ${symbol} composite score goes above ${thresholdLabel}`
  }

  const sectorLabel = sector
    ? sector.charAt(0).toUpperCase() + sector.slice(1)
    : "Sector"

  return `Alert me when ${symbol} ${sectorLabel} sector goes above ${thresholdLabel}`
}
