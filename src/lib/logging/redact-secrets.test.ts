import { describe, expect, it, beforeEach } from "vitest"
import { maskChatId, redactSecrets, redactString } from "@/lib/logging/redact-secrets"

describe("redactString", () => {
  beforeEach(() => {
    process.env.TELEGRAM_BOT_TOKEN = "123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
  })

  it("redacts Telegram bot URLs", () => {
    const input =
      "Failed at https://api.telegram.org/bot123456789:ABCdefGHIjklMNOpqrsTUVwxyz/sendMessage"
    const result = redactString(input)

    expect(result).not.toContain("ABCdefGHI")
    expect(result).toContain("[REDACTED]")
  })

  it("redacts env token values when present", () => {
    const result = redactString("token=123456789:ABCdefGHIjklMNOpqrsTUVwxyz")

    expect(result).not.toContain("ABCdefGHI")
    expect(result).toContain("[REDACTED]")
  })
})

describe("redactSecrets", () => {
  it("redacts nested objects with sensitive keys", () => {
    const result = redactSecrets({
      telegram_bot_token: "secret-value",
      nested: { apiKey: "also-secret" },
      safe: "ok",
    }) as Record<string, unknown>

    expect(result.telegram_bot_token).toBe("[REDACTED]")
    expect((result.nested as Record<string, unknown>).apiKey).toBe("[REDACTED]")
    expect(result.safe).toBe("ok")
  })

  it("redacts Error messages", () => {
    const error = new Error("https://api.telegram.org/botfake-token/sendMessage failed")
    const result = redactSecrets(error) as { message: string }

    expect(result.message).not.toContain("fake-token")
    expect(result.message).toContain("[REDACTED]")
  })
})

describe("maskChatId", () => {
  it("masks all but last four digits", () => {
    expect(maskChatId("123456789")).toBe("****6789")
  })
})
