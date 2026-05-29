import { describe, expect, it } from "vitest"
import { deriveJobStatus } from "@/lib/jobs/derive-job-status"
import { createAlertRunSummary, createJobSummary } from "@/jobs/types"

describe("deriveJobStatus", () => {
  it("returns success when no failures", () => {
    const summary = createJobSummary()
    summary.attempted = 5
    summary.succeeded = 5

    expect(deriveJobStatus(summary)).toBe("success")
  })

  it("returns partial_failure when job assets failed", () => {
    const summary = createJobSummary()
    summary.failed = 1

    expect(deriveJobStatus(summary)).toBe("partial_failure")
  })

  it("returns partial_failure when alert delivery failed", () => {
    const alertSummary = createAlertRunSummary()
    alertSummary.failed = 1

    expect(deriveJobStatus(undefined, alertSummary)).toBe("partial_failure")
  })
})
