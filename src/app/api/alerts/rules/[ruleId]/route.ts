import { NextResponse } from "next/server"
import { deleteAlertRule, updateAlertRule } from "@/lib/alerts/mutations"
import { getAlertRuleForUser } from "@/lib/alerts/queries"
import { toAlertRuleDto } from "@/lib/alerts/types"
import { requireApiUser } from "@/lib/auth/require-user"
import { alertRuleIdParamSchema, updateAlertRuleBodySchema } from "@/lib/validation/alerts"

type RouteContext = {
  params: Promise<{ ruleId: string }>
}

export const PATCH = async (request: Request, context: RouteContext) => {
  const userOrResponse = await requireApiUser()

  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  const params = await context.params
  const paramParsed = alertRuleIdParamSchema.safeParse({ ruleId: params.ruleId })

  if (!paramParsed.success) {
    return NextResponse.json({ error: "Invalid rule id" }, { status: 400 })
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = updateAlertRuleBodySchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const result = await updateAlertRule(userOrResponse.id, paramParsed.data.ruleId, parsed.data)

  if (!result.ok) {
    return NextResponse.json({ error: "Alert rule not found" }, { status: 404 })
  }

  const rule = await getAlertRuleForUser(userOrResponse.id, paramParsed.data.ruleId)

  if (!rule) {
    return NextResponse.json({ error: "Alert rule not found" }, { status: 404 })
  }

  return NextResponse.json({ rule: toAlertRuleDto(rule) })
}

export const DELETE = async (_request: Request, context: RouteContext) => {
  const userOrResponse = await requireApiUser()

  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  const params = await context.params
  const paramParsed = alertRuleIdParamSchema.safeParse({ ruleId: params.ruleId })

  if (!paramParsed.success) {
    return NextResponse.json({ error: "Invalid rule id" }, { status: 400 })
  }

  const result = await deleteAlertRule(userOrResponse.id, paramParsed.data.ruleId)

  if (!result.ok) {
    return NextResponse.json({ error: "Alert rule not found" }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
