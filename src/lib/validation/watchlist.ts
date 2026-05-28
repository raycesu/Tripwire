import { z } from "zod"

export const addWatchlistBodySchema = z.object({
  symbol: z
    .string()
    .min(1)
    .max(32)
    .transform((value) => value.trim().toUpperCase()),
})

export const assetIdParamSchema = z.object({
  assetId: z.string().uuid(),
})
