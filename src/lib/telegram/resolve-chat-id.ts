export const resolveTelegramChatId = (
  user:
    | {
        telegramChatId: string | null
        telegramVerifiedAt: Date | null
      }
    | undefined,
  deliveryStatus: string | null | undefined
): string | null => {
  if (!user?.telegramVerifiedAt || !user.telegramChatId) {
    return null
  }

  if (deliveryStatus && deliveryStatus !== "connected") {
    return null
  }

  return user.telegramChatId
}
