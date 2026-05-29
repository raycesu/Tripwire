import { describe, expect, it } from "vitest"
import { buildAlertRulesExport } from "@/lib/alerts/export"
import type { AlertRuleWithAsset } from "@/lib/alerts/types"

const sampleRule = (overrides: Partial<AlertRuleWithAsset> = {}): AlertRuleWithAsset =>
  ({
    id: "rule-1",
    userId: "user-1",
    assetId: "asset-1",
    scope: "composite",
    sector: null,
    operator: "above",
    threshold: "1.50",
    cooldownMinutes: 0,
    isEnabled: true,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    asset: { symbol: "BTC", name: "Bitcoin" },
    ...overrides,
  }) as AlertRuleWithAsset

describe("buildAlertRulesExport", () => {
  it("exports portable rule backup without user or telegram fields", () => {
    const payload = buildAlertRulesExport([sampleRule()])

    expect(payload.version).toBe(1)
    expect(payload.exportedAt).toBeTruthy()
    expect(payload.rules).toEqual([
      {
        assetSymbol: "BTC",
        scope: "composite",
        sector: null,
        operator: "above",
        threshold: "1.50",
        cooldownMinutes: 0,
        isEnabled: true,
      },
    ])
    expect(payload).not.toHaveProperty("telegramChatId")
    expect(payload.rules[0]).not.toHaveProperty("userId")
  })
})
