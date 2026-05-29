import { logError } from "@/lib/logging/logger"
import { redactSecrets } from "@/lib/logging/redact-secrets"

export const logApiError = (input: {
  event: string
  route: string
  userId?: string
  status: number
  error: unknown
}) => {
  logError({
    event: input.event,
    route: input.route,
    userId: input.userId,
    status: input.status,
    error: redactSecrets(
      input.error instanceof Error
        ? { name: input.error.name, message: input.error.message }
        : input.error
    ),
  })
}
