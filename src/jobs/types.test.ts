import { describe, expect, it } from "vitest"
import { createAlertRunSummary, mergeAlertRunSummaries } from "@/jobs/types"

describe("mergeAlertRunSummaries", () => {
  it("sums counters across summaries", () => {
    const first = createAlertRunSummary()
    first.sent = 2
    first.skippedDuplicate = 1

    const second = createAlertRunSummary()
    second.sent = 3
    second.failed = 1

    const merged = mergeAlertRunSummaries(first, second)

    expect(merged.sent).toBe(5)
    expect(merged.skippedDuplicate).toBe(1)
    expect(merged.failed).toBe(1)
  })
})
