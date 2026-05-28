import { z } from "zod"

export const telegramUpdateSchema = z.object({
  message: z
    .object({
      text: z.string().optional(),
      chat: z.object({
        id: z.number(),
      }),
    })
    .optional(),
})
