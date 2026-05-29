import { NextResponse } from "next/server"
import { buildAlertRulesExport } from "@/lib/alerts/export"
import { listAlertRulesForUser } from "@/lib/alerts/queries"
import { requireApiUser } from "@/lib/auth/require-user"
import { enforceRateLimit } from "@/lib/rate-limit/enforce-rate-limit"

export const GET = async () => {
  const userOrResponse = await requireApiUser()

  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  const rateLimited = await enforceRateLimit(userOrResponse.id, "alerts-export")

  if (rateLimited) {
    return rateLimited
  }

  const rules = await listAlertRulesForUser(userOrResponse.id)
  const payload = buildAlertRulesExport(rules)

  return NextResponse.json(payload, {
    headers: {
      "Content-Disposition": 'attachment; filename="tripwire-alert-rules.json"',
    },
  })
}
