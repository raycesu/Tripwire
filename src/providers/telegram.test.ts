import { describe, expect, it, vi, afterEach } from "vitest"

vi.mock("@/lib/env", () => ({
  env: {
    TELEGRAM_BOT_TOKEN: "test-token",
  },
}))

import { sendTelegramMessage, TelegramSendError } from "@/providers/telegram"

describe("sendTelegramMessage", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("returns message id on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ ok: true, result: { message_id: 42 } }),
      })
    )

    const result = await sendTelegramMessage({ chatId: "123", text: "hello" })

    expect(result.messageId).toBe(42)
  })

  it("classifies blocked bot as permanent failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 403,
        json: async () => ({
          ok: false,
          description: "Forbidden: bot was blocked by the user",
          error_code: 403,
        }),
      })
    )

    await expect(sendTelegramMessage({ chatId: "123", text: "hello" })).rejects.toMatchObject({
      kind: "permanent",
      permanentKind: "blocked",
    } satisfies Partial<TelegramSendError>)
  })

  it("classifies invalid chat as permanent failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 400,
        json: async () => ({
          ok: false,
          description: "Bad Request: chat not found",
          error_code: 400,
        }),
      })
    )

    await expect(sendTelegramMessage({ chatId: "123", text: "hello" })).rejects.toMatchObject({
      kind: "permanent",
      permanentKind: "invalid_chat",
    })
  })
})
