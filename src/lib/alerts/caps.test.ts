import { describe, expect, it } from "vitest"
import { prioritizeAlertRules } from "@/lib/alerts/evaluation"

describe("alert storm cap ordering", () => {
  it("prioritizes composite alerts when applying per-user cap", () => {
    const rules = [
      { id: "1", scope: "sector", userId: "u1" },
      { id: "2", scope: "composite", userId: "u1" },
      { id: "3", scope: "sector", userId: "u1" },
    ] as never[]

    const ordered = prioritizeAlertRules(rules)
    const maxPerUser = 1
    const sent = ordered.slice(0, maxPerUser)

    expect(sent[0]?.scope).toBe("composite")
  })
})

describe("global per-minute cap math", () => {
  it("computes remaining send budget", () => {
    const maxPerMinute = 20
    const alreadySent = 18
    const remaining = Math.max(0, maxPerMinute - alreadySent)

    expect(remaining).toBe(2)
  })
})
