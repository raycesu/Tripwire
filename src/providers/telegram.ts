import { z } from "zod"
import { env } from "@/lib/env"

const telegramOkSchema = z.object({
  ok: z.literal(true),
  result: z.object({
    message_id: z.number(),
  }),
})

const telegramErrorSchema = z.object({
  ok: z.literal(false),
  description: z.string().optional(),
  error_code: z.number().optional(),
})

export type TelegramPermanentFailureKind = "blocked" | "invalid_chat"

export class TelegramSendError extends Error {
  readonly kind: "permanent" | "transient"
  readonly permanentKind?: TelegramPermanentFailureKind
  readonly status?: number

  constructor(
    message: string,
    kind: "permanent" | "transient",
    permanentKind?: TelegramPermanentFailureKind,
    status?: number
  ) {
    super(message)
    this.name = "TelegramSendError"
    this.kind = kind
    this.permanentKind = permanentKind
    this.status = status
  }
}

const classifyPermanentFailure = (
  status: number,
  description: string
): TelegramPermanentFailureKind | null => {
  const lower = description.toLowerCase()

  if (status === 403 || lower.includes("blocked") || lower.includes("deactivated")) {
    return "blocked"
  }

  if (
    status === 400 &&
    (lower.includes("chat not found") ||
      lower.includes("peer_id_invalid") ||
      lower.includes("user not found"))
  ) {
    return "invalid_chat"
  }

  return null
}

export const sendTelegramMessage = async (input: {
  chatId: string
  text: string
}): Promise<{ messageId: number }> => {
  const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15_000)

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: input.chatId,
        text: input.text,
        disable_web_page_preview: true,
      }),
      signal: controller.signal,
      cache: "no-store",
    })

    const json: unknown = await response.json()
    const okParsed = telegramOkSchema.safeParse(json)

    if (okParsed.success) {
      return { messageId: okParsed.data.result.message_id }
    }

    const errParsed = telegramErrorSchema.safeParse(json)
    const description = errParsed.success ? (errParsed.data.description ?? "Telegram API error") : "Telegram API error"
    const errorCode = errParsed.success ? errParsed.data.error_code : undefined
    const permanentKind = classifyPermanentFailure(response.status, description)

    if (permanentKind) {
      throw new TelegramSendError(description, "permanent", permanentKind, response.status)
    }

    throw new TelegramSendError(
      description,
      "transient",
      undefined,
      errorCode ?? response.status
    )
  } catch (error) {
    if (error instanceof TelegramSendError) {
      throw error
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new TelegramSendError("Telegram request timed out", "transient")
    }

    throw new TelegramSendError(
      error instanceof Error ? error.message : "Unknown Telegram error",
      "transient"
    )
  } finally {
    clearTimeout(timeout)
  }
}

export const buildTestTelegramMessage = (): string => {
  return [
    "Tripwire Test Alert",
    "",
    "Your Telegram connection is working.",
    "",
    "You will receive opportunity alerts when your rules match fresh score updates.",
  ].join("\n")
}
