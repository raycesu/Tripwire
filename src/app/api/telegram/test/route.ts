import { NextResponse } from "next/server"
import { requireApiUser } from "@/lib/auth/require-user"
import { logApiError } from "@/lib/logging/log-api-error"
import { enforceRateLimit } from "@/lib/rate-limit/enforce-rate-limit"
import { getUserTelegramChatId } from "@/lib/telegram/queries"
import { buildTestTelegramMessage, sendTelegramMessage, TelegramSendError } from "@/providers/telegram"
import { markTelegramDisconnected } from "@/lib/telegram/link-chat"

export const POST = async () => {
  const userOrResponse = await requireApiUser()

  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  const rateLimited = await enforceRateLimit(userOrResponse.id, "telegram-test")

  if (rateLimited) {
    return rateLimited
  }

  const chatId = await getUserTelegramChatId(userOrResponse.id)

  if (!chatId) {
    return NextResponse.json(
      { error: "Telegram is not connected. Connect Telegram first." },
      { status: 400 }
    )
  }

  try {
    await sendTelegramMessage({
      chatId,
      text: buildTestTelegramMessage(),
    })
  } catch (error) {
    if (error instanceof TelegramSendError && error.kind === "permanent") {
      const status = error.permanentKind === "blocked" ? "blocked" : "invalid_chat"
      await markTelegramDisconnected(userOrResponse.id, status, error.message)

      return NextResponse.json(
        { error: "Telegram delivery failed. Please reconnect Telegram." },
        { status: 400 }
      )
    }

    logApiError({
      event: "telegram_test_send_failed",
      route: "/api/telegram/test",
      userId: userOrResponse.id,
      status: 502,
      error,
    })

    return NextResponse.json({ error: "Failed to send test alert" }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
