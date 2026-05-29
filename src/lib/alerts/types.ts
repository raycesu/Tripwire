import type { AlertRule } from "@/db/schema"
import type { SectorName } from "@/scoring/types"

export type AlertScope = "composite" | "sector"

export type AlertRuleDto = {
  id: string
  assetId: string
  assetSymbol: string
  assetName: string
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
  asset: { symbol: string; name: string }
}

export const toAlertRuleDto = (rule: AlertRuleWithAsset): AlertRuleDto => ({
  id: rule.id,
  assetId: rule.assetId,
  assetSymbol: rule.asset.symbol,
  assetName: rule.asset.name,
  scope: rule.scope as AlertScope,
  sector: (rule.sector as SectorName | null) ?? null,
  operator: "above",
  threshold: Number(rule.threshold),
  cooldownMinutes: rule.cooldownMinutes,
  isEnabled: rule.isEnabled,
  createdAt: rule.createdAt,
  updatedAt: rule.updatedAt,
})

export type AlertEventDto = {
  id: string
  assetSymbol: string
  assetName: string
  ruleLabel: string
  triggeredValue: number
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
