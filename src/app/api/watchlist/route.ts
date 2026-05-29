import { NextResponse } from "next/server"
import { requireApiUser } from "@/lib/auth/require-user"
import { enforceRateLimit } from "@/lib/rate-limit/enforce-rate-limit"
import { addToWatchlist } from "@/lib/watchlist/mutations"
import { listUserWatchlist } from "@/lib/watchlist/queries"
import { addWatchlistBodySchema } from "@/lib/validation/watchlist"

export const GET = async () => {
  const userOrResponse = await requireApiUser()

  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  const watchlist = await listUserWatchlist(userOrResponse.id)

  return NextResponse.json({ watchlist })
}

export const POST = async (request: Request) => {
  const userOrResponse = await requireApiUser()

  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  const rateLimited = await enforceRateLimit(userOrResponse.id, "watchlist-add")

  if (rateLimited) {
    return rateLimited
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = addWatchlistBodySchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const result = await addToWatchlist(userOrResponse.id, parsed.data.symbol)

  if (!result.ok) {
    if (result.code === "NOT_FOUND") {
      return NextResponse.json({ error: "Asset not found in catalog" }, { status: 404 })
    }

    if (result.code === "INACTIVE") {
      return NextResponse.json({ error: "Asset is not available" }, { status: 400 })
    }

    if (result.code === "UNSUPPORTED") {
      return NextResponse.json(
        { error: "Asset is unsupported by market data providers" },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: "Asset already on watchlist" }, { status: 409 })
  }

  return NextResponse.json({ assetId: result.assetId }, { status: 201 })
}
