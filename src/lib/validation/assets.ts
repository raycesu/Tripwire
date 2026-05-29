import { z } from "zod"

export const assetSearchQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .min(2)
    .max(32)
    .transform((value) => value.toUpperCase()),
  type: z.enum(["crypto", "stock"]).optional(),
  limit: z.coerce.number().int().min(1).max(25).default(15),
})

export type AssetSearchQuery = z.infer<typeof assetSearchQuerySchema>
