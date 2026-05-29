import { describe, expect, it } from "vitest"
import { extractCronSecret } from "@/lib/cron/extract-cron-secret"

const buildRequest = (input: { url: string; headers?: Record<string, string> }) => {
  return new Request(input.url, { headers: input.headers })
}

describe("extractCronSecret", () => {
  it("reads Bearer token from Authorization header", () => {
    const request = buildRequest({
      url: "https://example.com/api/cron/score-daily",
      headers: { Authorization: "Bearer test-secret" },
    })

    expect(extractCronSecret(request)).toBe("test-secret")
  })

  it("reads secret from query param", () => {
    const request = buildRequest({
      url: "https://example.com/api/cron/score-daily?secret=query-secret",
    })

    expect(extractCronSecret(request)).toBe("query-secret")
  })

  it("returns null when no secret provided", () => {
    const request = buildRequest({
      url: "https://example.com/api/cron/score-daily",
    })

    expect(extractCronSecret(request)).toBeNull()
  })
})
