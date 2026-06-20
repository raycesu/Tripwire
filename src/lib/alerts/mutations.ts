import { and, eq, isNull } from "drizzle-orm"
import { db } from "@/db/client"
import { alertRules, watchlistItems } from "@/db/schema"
import type { AlertRuleWithAsset } from "@/lib/alerts/types"
import type { createAlertRuleBodySchema, updateAlertRuleBodySchema } from "@/lib/validation/alerts"
import type { z } from "zod"

export type CreateAlertRuleResult =
  | { ok: true; rule: AlertRuleWithAsset }
  | { ok: false; code: "NOT_ON_WATCHLIST" | "DUPLICATE" }

export const createAlertRule = async (
  userId: string,
  input: z.infer<typeof createAlertRuleBodySchema>
): Promise<CreateAlertRuleResult> => {
  const onWatchlist = await db.query.watchlistItems.findFirst({
    where: and(eq(watchlistItems.userId, userId), eq(watchlistItems.assetId, input.assetId)),
  })

  if (!onWatchlist) {
    return { ok: false, code: "NOT_ON_WATCHLIST" }
  }

  const sector = input.scope === "sector" ? input.sector ?? null : null

  const existing = await db.query.alertRules.findFirst({
    where: and(
      eq(alertRules.userId, userId),
      eq(alertRules.assetId, input.assetId),
      eq(alertRules.scope, input.scope),
      sector ? eq(alertRules.sector, sector) : isNull(alertRules.sector)
    ),
  })

  if (existing) {
    return { ok: false, code: "DUPLICATE" }
  }

  const rows = await db
    .insert(alertRules)
    .values({
      userId,
      assetId: input.assetId,
      scope: input.scope,
      sector,
      operator: input.operator,
      threshold: String(input.threshold),
      cooldownMinutes: input.cooldownMinutes,
      isEnabled: true,
    })
    .returning()

  const created = rows[0]

  if (!created) {
    throw new Error("Failed to create alert rule")
  }

  const rule = await db.query.alertRules.findFirst({
    where: eq(alertRules.id, created.id),
    with: {
      asset: { columns: { symbol: true, name: true, assetType: true } },
    },
  })

  if (!rule) {
    throw new Error("Failed to load created alert rule")
  }

  return { ok: true, rule: rule as AlertRuleWithAsset }
}

export const updateAlertRule = async (
  userId: string,
  ruleId: string,
  input: z.infer<typeof updateAlertRuleBodySchema>
): Promise<{ ok: boolean; code?: "NOT_FOUND" }> => {
  const existing = await db.query.alertRules.findFirst({
    where: and(eq(alertRules.id, ruleId), eq(alertRules.userId, userId)),
  })

  if (!existing) {
    return { ok: false, code: "NOT_FOUND" }
  }

  await db
    .update(alertRules)
    .set({
      ...(input.threshold !== undefined ? { threshold: String(input.threshold) } : {}),
      ...(input.cooldownMinutes !== undefined ? { cooldownMinutes: input.cooldownMinutes } : {}),
      ...(input.isEnabled !== undefined ? { isEnabled: input.isEnabled } : {}),
      updatedAt: new Date(),
    })
    .where(eq(alertRules.id, ruleId))

  return { ok: true }
}

export const deleteAlertRule = async (
  userId: string,
  ruleId: string
): Promise<{ ok: boolean; code?: "NOT_FOUND" }> => {
  const existing = await db.query.alertRules.findFirst({
    where: and(eq(alertRules.id, ruleId), eq(alertRules.userId, userId)),
  })

  if (!existing) {
    return { ok: false, code: "NOT_FOUND" }
  }

  await db.delete(alertRules).where(eq(alertRules.id, ruleId))

  return { ok: true }
}
