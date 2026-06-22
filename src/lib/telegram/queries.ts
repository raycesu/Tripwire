import { eq, inArray } from "drizzle-orm"
import { db } from "@/db/client"
import { telegramDeliveryState, users } from "@/db/schema"
import type { TelegramDeliveryStatus } from "@/db/schema"

import { resolveTelegramChatId } from "@/lib/telegram/resolve-chat-id"

export { resolveTelegramChatId } from "@/lib/telegram/resolve-chat-id"

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

  const delivery = await db.query.telegramDeliveryState.findFirst({
    where: eq(telegramDeliveryState.userId, userId),
    columns: { status: true },
  })

  return resolveTelegramChatId(user, delivery?.status)
}

export const getUserTelegramChatIds = async (
  userIds: string[]
): Promise<Map<string, string | null>> => {
  const result = new Map<string, string | null>()

  if (userIds.length === 0) {
    return result
  }

  for (const userId of userIds) {
    result.set(userId, null)
  }

  const userRows = await db.query.users.findMany({
    where: inArray(users.id, userIds),
    columns: {
      id: true,
      telegramChatId: true,
      telegramVerifiedAt: true,
    },
  })

  const deliveryRows = await db.query.telegramDeliveryState.findMany({
    where: inArray(telegramDeliveryState.userId, userIds),
    columns: {
      userId: true,
      status: true,
    },
  })

  const deliveryStatusByUserId = new Map(
    deliveryRows.map((row) => [row.userId, row.status])
  )

  for (const user of userRows) {
    result.set(
      user.id,
      resolveTelegramChatId(user, deliveryStatusByUserId.get(user.id))
    )
  }

  return result
}
