import { eq } from "drizzle-orm"
import { db } from "@/db/client"
import { telegramDeliveryState, users } from "@/db/schema"
import type { TelegramDeliveryStatus } from "@/db/schema"

export type LinkTelegramChatResult =
  | { ok: true; userId: string }
  | { ok: false; reason: "invalid_code" | "expired_code" | "already_used" }

export const linkTelegramChat = async (
  connectCode: string,
  chatId: string
): Promise<LinkTelegramChatResult> => {
  const user = await db.query.users.findFirst({
    where: eq(users.telegramConnectCode, connectCode),
  })

  if (!user) {
    return { ok: false, reason: "invalid_code" }
  }

  if (!user.telegramConnectCodeExpiresAt || user.telegramConnectCodeExpiresAt < new Date()) {
    return { ok: false, reason: "expired_code" }
  }

  const now = new Date()

  await db
    .update(users)
    .set({
      telegramChatId: chatId,
      telegramVerifiedAt: now,
      telegramConnectCode: null,
      telegramConnectCodeExpiresAt: null,
      updatedAt: now,
    })
    .where(eq(users.id, user.id))

  await upsertTelegramDeliveryState(user.id, chatId, "connected")

  return { ok: true, userId: user.id }
}

export const upsertTelegramDeliveryState = async (
  userId: string,
  chatId: string,
  status: TelegramDeliveryStatus,
  error?: string
): Promise<void> => {
  const now = new Date()
  const existing = await db.query.telegramDeliveryState.findFirst({
    where: eq(telegramDeliveryState.userId, userId),
  })

  if (existing) {
    await db
      .update(telegramDeliveryState)
      .set({
        telegramChatId: chatId,
        status,
        lastSuccessAt: status === "connected" ? now : existing.lastSuccessAt,
        lastFailureAt: status !== "connected" ? now : existing.lastFailureAt,
        lastError: error ?? null,
        updatedAt: now,
      })
      .where(eq(telegramDeliveryState.userId, userId))

    return
  }

  await db.insert(telegramDeliveryState).values({
    userId,
    telegramChatId: chatId,
    status,
    lastSuccessAt: status === "connected" ? now : null,
    lastFailureAt: status !== "connected" ? now : null,
    lastError: error ?? null,
    updatedAt: now,
  })
}

export const markTelegramDisconnected = async (
  userId: string,
  status: Extract<TelegramDeliveryStatus, "blocked" | "invalid_chat" | "disconnected">,
  error: string
): Promise<void> => {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { telegramChatId: true },
  })

  const chatId = user?.telegramChatId ?? null
  const now = new Date()

  await db
    .update(users)
    .set({
      telegramVerifiedAt: null,
      updatedAt: now,
    })
    .where(eq(users.id, userId))

  if (chatId) {
    await upsertTelegramDeliveryState(userId, chatId, status, error)
  } else {
    const existing = await db.query.telegramDeliveryState.findFirst({
      where: eq(telegramDeliveryState.userId, userId),
    })

    if (existing) {
      await db
        .update(telegramDeliveryState)
        .set({
          status,
          lastFailureAt: now,
          lastError: error,
          updatedAt: now,
        })
        .where(eq(telegramDeliveryState.userId, userId))
    }
  }
}
