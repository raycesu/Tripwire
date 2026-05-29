import { z } from "zod"

const envSchema = z.object({
  DATABASE_URL: z.url(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  CRON_SECRET: z.string().min(1),
  MAX_ALERTS_PER_USER_PER_RUN: z.coerce.number().int().positive().default(10),
  MAX_TELEGRAM_MESSAGES_PER_MINUTE: z.coerce.number().int().positive().default(20),
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  TELEGRAM_BOT_USERNAME: z.string().min(1),
  TELEGRAM_WEBHOOK_SECRET: z.string().min(1),
  FRED_API_KEY: z.string().min(1),
  TWELVE_DATA_API_KEY: z.string().min(1),
  PROVIDER_FETCH_MAX_RETRIES: z.coerce.number().int().positive().default(3),
  PROVIDER_FETCH_TIMEOUT_MS: z.coerce.number().int().positive().default(15_000),
})

const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  const issues = parsedEnv.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("\n")

  throw new Error(`Invalid environment variables:\n${issues}`)
}

export const env = parsedEnv.data
