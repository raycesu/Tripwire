import { randomBytes } from "crypto"
import { eq } from "drizzle-orm"
import { db } from "@/db/client"
import { users } from "@/db/schema"
import { env } from "@/lib/env"

const CONNECT_CODE_TTL_MS = 15 * 60 * 1000

const generateConnectCode = (): string => {
  return randomBytes(12).toString("base64url")
}

export const issueTelegramConnectCode = async (
  userId: string
): Promise<{ deepLink: string; expiresAt: Date; code: string }> => {
  const code = generateConnectCode()
  const expiresAt = new Date(Date.now() + CONNECT_CODE_TTL_MS)

  await db
    .update(users)
    .set({
      telegramConnectCode: code,
      telegramConnectCodeExpiresAt: expiresAt,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))

  const deepLink = `https://t.me/${env.TELEGRAM_BOT_USERNAME}?start=${encodeURIComponent(code)}`

  return { deepLink, expiresAt, code }
}
