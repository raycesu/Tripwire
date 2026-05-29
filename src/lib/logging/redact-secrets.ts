const REDACTED = "[REDACTED]"

const TELEGRAM_BOT_URL_PATTERN =
  /https:\/\/api\.telegram\.org\/bot[^/\s]+/gi

const ENV_SECRET_PATTERNS: Array<{ name: string; pattern: RegExp }> = []

const registerEnvSecret = (value: string | undefined) => {
  if (!value || value.length < 8) {
    return
  }

  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  ENV_SECRET_PATTERNS.push({
    name: "env",
    pattern: new RegExp(escaped, "g"),
  })
}

const initEnvSecrets = () => {
  if (ENV_SECRET_PATTERNS.length > 0) {
    return
  }

  registerEnvSecret(process.env.TELEGRAM_BOT_TOKEN)
  registerEnvSecret(process.env.CRON_SECRET)
  registerEnvSecret(process.env.FRED_API_KEY)
  registerEnvSecret(process.env.TWELVE_DATA_API_KEY)
  registerEnvSecret(process.env.CLERK_SECRET_KEY)
}

export const redactString = (input: string): string => {
  initEnvSecrets()

  let result = input.replace(TELEGRAM_BOT_URL_PATTERN, `https://api.telegram.org/bot${REDACTED}`)

  for (const { pattern } of ENV_SECRET_PATTERNS) {
    result = result.replace(pattern, REDACTED)
  }

  return result
}

export const redactSecrets = (value: unknown): unknown => {
  if (value === null || value === undefined) {
    return value
  }

  if (typeof value === "string") {
    return redactString(value)
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactString(value.message),
      stack: value.stack ? redactString(value.stack) : undefined,
    }
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactSecrets(item))
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>
    const redacted: Record<string, unknown> = {}

    for (const [key, nested] of Object.entries(record)) {
      if (/token|secret|api[_-]?key|password/i.test(key)) {
        redacted[key] = REDACTED
        continue
      }

      redacted[key] = redactSecrets(nested)
    }

    return redacted
  }

  return value
}

export const maskChatId = (chatId: string): string => {
  if (chatId.length <= 4) {
    return "****"
  }

  return `****${chatId.slice(-4)}`
}
