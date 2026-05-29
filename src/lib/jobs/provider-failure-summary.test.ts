import { describe, expect, it } from "vitest"
import { buildProviderMetadata, recordNullReason } from "@/lib/jobs/provider-failure-summary"
import { createJobSummary } from "@/jobs/types"

describe("provider failure summary", () => {
  it("tracks null reasons and sector failures", () => {
    const summary = createJobSummary()
    recordNullReason(summary, {
      score: null,
      isNull: true,
      nullReason: "provider_error",
      components: {},
    })
    summary.errors.push({
      assetId: "a",
      symbol: "BTC",
      sector: "macro",
      message: "db error",
    })

    const metadata = buildProviderMetadata(summary)

    expect(metadata).toEqual({
      providers: {
        nullReasonCounts: { provider_error: 1 },
        failuresBySector: { macro: 1 },
        assetsFailed: 0,
      },
    })
  })
})
