import { NextResponse } from "next/server"
import { requireApiUser } from "@/lib/auth/require-user"
import { issueTelegramConnectCode } from "@/lib/telegram/connect-code"

export const POST = async () => {
  const userOrResponse = await requireApiUser()

  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  const { deepLink, expiresAt } = await issueTelegramConnectCode(userOrResponse.id)

  return NextResponse.json({
    deepLink,
    expiresAt: expiresAt.toISOString(),
  })
}
