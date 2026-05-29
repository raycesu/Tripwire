import { NextResponse } from "next/server"
import { sql } from "drizzle-orm"
import { db } from "@/db/client"

export const GET = async () => {
  try {
    await db.execute(sql`SELECT 1`)

    return NextResponse.json({
      ok: true,
      db: "up",
      timestamp: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json(
      {
        ok: false,
        db: "down",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}
