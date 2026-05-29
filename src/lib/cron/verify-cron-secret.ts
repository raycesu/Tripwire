import { timingSafeEqual } from "crypto"
import { NextResponse } from "next/server"
import { extractCronSecret } from "@/lib/cron/extract-cron-secret"
import { env } from "@/lib/env"

export { extractCronSecret } from "@/lib/cron/extract-cron-secret"

const safeCompare = (provided: string, expected: string): boolean => {
  const providedBuffer = Buffer.from(provided)
  const expectedBuffer = Buffer.from(expected)

  if (providedBuffer.length !== expectedBuffer.length) {
    return false
  }

  return timingSafeEqual(providedBuffer, expectedBuffer)
}

export const isValidCronSecret = (provided: string | null): boolean => {
  if (!provided) {
    return false
  }

  return safeCompare(provided, env.CRON_SECRET)
}

export const verifyCronSecret = (request: Request): NextResponse | null => {
  const provided = extractCronSecret(request)

  if (!isValidCronSecret(provided)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return null
}
