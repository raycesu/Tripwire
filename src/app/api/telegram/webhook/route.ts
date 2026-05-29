import { NextResponse } from "next/server"
import { env } from "@/lib/env"
import { logInfo, logWarn } from "@/lib/logging/logger"
import { linkTelegramChat } from "@/lib/telegram/link-chat"
import { telegramUpdateSchema } from "@/lib/validation/telegram"

const parseStartCode = (text: string): string | null => {
  const match = text.trim().match(/^\/start(?:@\w+)?\s+(\S+)$/i)

  if (!match?.[1]) {
    return null
  }

  return match[1]
}

export const POST = async (request: Request) => {
  const secret = request.headers.get("x-telegram-bot-api-secret-token")

  if (!secret || secret !== env.TELEGRAM_WEBHOOK_SECRET) {
    logWarn({ event: "telegram_webhook_unauthorized" })
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: true })
  }

  const parsed = telegramUpdateSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ ok: true })
  }

  const text = parsed.data.message?.text

  if (!text) {
    return NextResponse.json({ ok: true })
  }

  const connectCode = parseStartCode(text)

  if (!connectCode) {
    return NextResponse.json({ ok: true })
  }

  const chatId = parsed.data.message?.chat.id

  if (chatId === undefined) {
    return NextResponse.json({ ok: true })
  }

  try {
    await linkTelegramChat(connectCode, String(chatId))
    logInfo({
      event: "telegram_webhook_linked",
      connectCodePrefix: connectCode.slice(0, 4),
    })
  } catch (error) {
    logWarn({
      event: "telegram_webhook_link_failed",
      connectCodePrefix: connectCode.slice(0, 4),
      message: error instanceof Error ? error.message : "Unknown error",
    })
  }

  return NextResponse.json({ ok: true })
}
