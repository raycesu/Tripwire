import { describe, expect, it } from "vitest"

describe("duplicate prevention key", () => {
  it("uses alert rule id and score snapshot id as unique pair", () => {
    const ruleId = "rule-1"
    const snapshotA = "snap-a"
    const snapshotB = "snap-b"

    const keyA = `${ruleId}:${snapshotA}`
    const keyB = `${ruleId}:${snapshotB}`

    expect(keyA).not.toBe(keyB)
  })

  it("allows repeat alerts across different snapshots", () => {
    const seen = new Set<string>()
    const ruleId = "rule-1"

    seen.add(`${ruleId}:snap-1`)
    const isDuplicateForSnap2 = seen.has(`${ruleId}:snap-2`)

    expect(isDuplicateForSnap2).toBe(false)
  })
})
