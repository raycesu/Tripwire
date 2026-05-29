import type { AlertRuleWithAsset } from "@/lib/alerts/types"

export type AlertRuleExportRecord = {
  assetSymbol: string
  scope: string
  sector: string | null
  operator: string
  threshold: string
  cooldownMinutes: number
  isEnabled: boolean
}

export type AlertRulesExportPayload = {
  version: 1
  exportedAt: string
  rules: AlertRuleExportRecord[]
}

export const buildAlertRulesExport = (rules: AlertRuleWithAsset[]): AlertRulesExportPayload => ({
  version: 1,
  exportedAt: new Date().toISOString(),
  rules: rules.map((rule) => ({
    assetSymbol: rule.asset.symbol,
    scope: rule.scope,
    sector: rule.sector,
    operator: rule.operator,
    threshold: String(rule.threshold),
    cooldownMinutes: rule.cooldownMinutes,
    isEnabled: rule.isEnabled,
  })),
})
