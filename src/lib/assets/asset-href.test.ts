import { describe, expect, it } from "vitest"
import { assetDetailHref } from "@/lib/assets/asset-href"

describe("assetDetailHref", () => {
  it("includes the asset type for colliding tickers", () => {
    expect(assetDetailHref("pump", "crypto")).toBe("/assets/PUMP?type=crypto")
    expect(assetDetailHref("PUMP", "stock")).toBe("/assets/PUMP?type=stock")
  })
})
