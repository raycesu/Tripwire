import { eq } from "drizzle-orm"
import { db } from "@/db/client"
import { telegramDeliveryState, users } from "@/db/schema"
import type { TelegramDeliveryStatus } from "@/db/schema"

export type TelegramConnectionStatus = {
  isVerified: boolean
  chatIdMasked: string | null
  deliveryStatus: TelegramDeliveryStatus | null
  lastError: string | null
}

const maskChatId = (chatId: string): string => {
  if (chatId.length <= 4) {
    return "****"
  }

  return `****${chatId.slice(-4)}`
}

export const getTelegramConnectionStatus = async (
  userId: string
): Promise<TelegramConnectionStatus> => {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      telegramChatId: true,
      telegramVerifiedAt: true,
    },
  })

  const delivery = await db.query.telegramDeliveryState.findFirst({
    where: eq(telegramDeliveryState.userId, userId),
  })

  const isVerified = Boolean(user?.telegramVerifiedAt && user.telegramChatId)
  const deliveryStatus = (delivery?.status as TelegramDeliveryStatus | undefined) ?? null

  return {
    isVerified,
    chatIdMasked: user?.telegramChatId ? maskChatId(user.telegramChatId) : null,
    deliveryStatus: isVerified ? (deliveryStatus ?? "connected") : deliveryStatus,
    lastError: delivery?.lastError ?? null,
  }
}

export const getUserTelegramChatId = async (userId: string): Promise<string | null> => {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      telegramChatId: true,
      telegramVerifiedAt: true,
    },
  })

  if (!user?.telegramVerifiedAt || !user.telegramChatId) {
    return null
  }

  const delivery = await db.query.telegramDeliveryState.findFirst({
    where: eq(telegramDeliveryState.userId, userId),
    columns: { status: true },
  })

  if (delivery && delivery.status !== "connected") {
    return null
  }

  return user.telegramChatId
}
