import { describe, expect, it } from "vitest"
import { buildProviderMetadata, recordNullReason } from "@/lib/jobs/provider-failure-summary"
import { createJobSummary } from "@/jobs/types"

describe("scoring job resilience", () => {
  it("continues summarizing when some assets fail", () => {
    const summary = createJobSummary()
    summary.attempted = 3
    summary.succeeded = 2
    summary.failed = 1
    summary.errors.push({
      assetId: "asset-2",
      symbol: "ETH",
      sector: "macro",
      message: "provider timeout",
    })
    recordNullReason(summary, {
      score: null,
      isNull: true,
      nullReason: "provider_error",
      components: {},
    })

    const metadata = buildProviderMetadata(summary)

    expect(metadata?.providers).toMatchObject({
      nullReasonCounts: { provider_error: 1 },
      failuresBySector: { macro: 1 },
      assetsFailed: 1,
    })
  })

  it("simulates per-asset isolation without aborting the batch", () => {
    const assets = ["BTC", "ETH", "SOL"]
    const summary = createJobSummary()

    for (const symbol of assets) {
      summary.attempted += 1

      if (symbol === "ETH") {
        summary.failed += 1
        summary.errors.push({
          assetId: symbol,
          symbol,
          sector: "macro",
          message: "simulated failure",
        })
        continue
      }

      summary.succeeded += 1
    }

    expect(summary.attempted).toBe(3)
    expect(summary.succeeded).toBe(2)
    expect(summary.failed).toBe(1)
  })
})
