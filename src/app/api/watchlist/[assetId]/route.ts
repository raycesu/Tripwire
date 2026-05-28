import { NextResponse } from "next/server"
import { requireApiUser } from "@/lib/auth/require-user"
import { removeFromWatchlist } from "@/lib/watchlist/mutations"
import { assetIdParamSchema } from "@/lib/validation/watchlist"

type RouteContext = {
  params: Promise<{ assetId: string }>
}

export const DELETE = async (_request: Request, context: RouteContext) => {
  const userOrResponse = await requireApiUser()

  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  const params = await context.params
  const parsed = assetIdParamSchema.safeParse(params)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid asset id" }, { status: 400 })
  }

  const result = await removeFromWatchlist(userOrResponse.id, parsed.data.assetId)

  if (!result.ok) {
    return NextResponse.json({ error: "Watchlist item not found" }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
