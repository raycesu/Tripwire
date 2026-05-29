import { NextResponse } from "next/server"
import { searchAssetCatalog } from "@/lib/assets/catalog-queries"
import { requireApiUser } from "@/lib/auth/require-user"
import { enforceRateLimit } from "@/lib/rate-limit/enforce-rate-limit"
import { assetSearchQuerySchema } from "@/lib/validation/assets"

export const GET = async (request: Request) => {
  const userOrResponse = await requireApiUser()

  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  const rateLimited = await enforceRateLimit(userOrResponse.id, "asset-search")

  if (rateLimited) {
    return rateLimited
  }

  const url = new URL(request.url)
  const parsed = assetSearchQuerySchema.safeParse({
    q: url.searchParams.get("q") ?? "",
    type: url.searchParams.get("type") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const results = await searchAssetCatalog({
    query: parsed.data.q,
    assetType: parsed.data.type,
    limit: parsed.data.limit,
  })

  return NextResponse.json({ results })
}
