import { describe, expect, it } from "vitest"
import { makeAlertEventKey } from "@/lib/alerts/event-keys"
import { isRuleWithinCooldown } from "@/lib/alerts/evaluation"
import { resolveTelegramChatId } from "@/lib/telegram/resolve-chat-id"

describe("makeAlertEventKey", () => {
  it("builds stable keys for duplicate detection", () => {
    expect(makeAlertEventKey("rule-1", "snap-a")).toBe("rule-1:snap-a")
    expect(makeAlertEventKey("rule-1", "snap-b")).not.toBe(makeAlertEventKey("rule-1", "snap-a"))
  })
})

describe("isRuleWithinCooldown", () => {
  const now = new Date("2026-06-21T12:00:00.000Z")

  it("returns false when cooldown is disabled", () => {
    expect(isRuleWithinCooldown(0, now, now)).toBe(false)
  })

  it("returns false when no prior send exists", () => {
    expect(isRuleWithinCooldown(30, undefined, now)).toBe(false)
  })

  it("returns true when last send is inside cooldown window", () => {
    const lastSent = new Date("2026-06-21T11:45:00.000Z")
    expect(isRuleWithinCooldown(30, lastSent, now)).toBe(true)
  })

  it("returns false when last send is outside cooldown window", () => {
    const lastSent = new Date("2026-06-21T11:00:00.000Z")
    expect(isRuleWithinCooldown(30, lastSent, now)).toBe(false)
  })
})

describe("resolveTelegramChatId", () => {
  const verifiedUser = {
    telegramChatId: "12345",
    telegramVerifiedAt: new Date("2026-06-21T00:00:00.000Z"),
  }

  it("returns null for unverified users", () => {
    expect(
      resolveTelegramChatId(
        { telegramChatId: "12345", telegramVerifiedAt: null },
        "connected"
      )
    ).toBeNull()
  })

  it("returns null when delivery is disconnected", () => {
    expect(resolveTelegramChatId(verifiedUser, "blocked")).toBeNull()
  })

  it("returns chat id for verified connected users", () => {
    expect(resolveTelegramChatId(verifiedUser, "connected")).toBe("12345")
    expect(resolveTelegramChatId(verifiedUser, undefined)).toBe("12345")
  })
})
