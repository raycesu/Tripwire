import { NextResponse } from "next/server"
import { ensureDbUser } from "@/lib/auth/ensure-user"
import type { User } from "@/db/schema"

export const requireApiUser = async (): Promise<User | NextResponse> => {
  try {
    return await ensureDbUser()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
