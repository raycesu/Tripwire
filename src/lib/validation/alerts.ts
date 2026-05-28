import { z } from "zod"

const sectorSchema = z.enum(["macro", "relativity", "volume"])

export const createAlertRuleBodySchema = z
  .object({
    assetId: z.string().uuid(),
    scope: z.enum(["composite", "sector"]),
    sector: sectorSchema.optional(),
    operator: z.literal("above").default("above"),
    threshold: z.number().min(-2).max(2),
    cooldownMinutes: z.number().int().min(0).default(0),
  })
  .superRefine((value, ctx) => {
    if (value.scope === "sector" && !value.sector) {
      ctx.addIssue({
        code: "custom",
        message: "sector is required when scope is sector",
        path: ["sector"],
      })
    }

    if (value.scope === "composite" && value.sector) {
      ctx.addIssue({
        code: "custom",
        message: "sector must be omitted when scope is composite",
        path: ["sector"],
      })
    }
  })

export const updateAlertRuleBodySchema = z.object({
  threshold: z.number().min(-2).max(2).optional(),
  cooldownMinutes: z.number().int().min(0).optional(),
  isEnabled: z.boolean().optional(),
})

export const alertRuleIdParamSchema = z.object({
  ruleId: z.string().uuid(),
})
