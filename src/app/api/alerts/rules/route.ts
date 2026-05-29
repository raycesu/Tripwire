import { NextResponse } from "next/server"
import { evaluateInitialMatchForUser } from "@/jobs/evaluate-alerts"
import { createAlertRule } from "@/lib/alerts/mutations"
import { listAlertRulesForUser } from "@/lib/alerts/queries"
import { toAlertRuleDto } from "@/lib/alerts/types"
import { requireApiUser } from "@/lib/auth/require-user"
import { enforceRateLimit } from "@/lib/rate-limit/enforce-rate-limit"
import { createAlertRuleBodySchema } from "@/lib/validation/alerts"

export const GET = async () => {
  const userOrResponse = await requireApiUser()

  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  const rules = await listAlertRulesForUser(userOrResponse.id)

  return NextResponse.json({
    rules: rules.map(toAlertRuleDto),
  })
}

export const POST = async (request: Request) => {
  const userOrResponse = await requireApiUser()

  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  const rateLimited = await enforceRateLimit(userOrResponse.id, "alerts-create")

  if (rateLimited) {
    return rateLimited
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = createAlertRuleBodySchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const result = await createAlertRule(userOrResponse.id, parsed.data)

  if (!result.ok) {
    if (result.code === "NOT_ON_WATCHLIST") {
      return NextResponse.json(
        { error: "Asset must be on your watchlist before creating an alert" },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: "An identical alert rule already exists" }, { status: 409 })
  }

  const alertSummary = await evaluateInitialMatchForUser(userOrResponse.id, result.rule.id)

  return NextResponse.json(
    {
      rule: toAlertRuleDto(result.rule),
      initialMatch: {
        sent: alertSummary.sent,
        skippedDuplicate: alertSummary.skippedDuplicate,
        skippedRateLimited: alertSummary.skippedRateLimited,
      },
    },
    { status: 201 }
  )
}
