import { NextResponse } from "next/server"
import { requireApiUser } from "@/lib/auth/require-user"
import { getUserTelegramChatId } from "@/lib/telegram/queries"
import { buildTestTelegramMessage, sendTelegramMessage, TelegramSendError } from "@/providers/telegram"
import { markTelegramDisconnected } from "@/lib/telegram/link-chat"

export const POST = async () => {
  const userOrResponse = await requireApiUser()

  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
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

    return NextResponse.json({ error: "Failed to send test alert" }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
