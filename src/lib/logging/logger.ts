import { redactSecrets } from "@/lib/logging/redact-secrets"

export type LogLevel = "info" | "warn" | "error"

export type LogFields = {
  event: string
  userId?: string
  jobName?: string
  provider?: string
  assetSymbol?: string
  durationMs?: number
  [key: string]: unknown
}

const writeLog = (level: LogLevel, fields: LogFields) => {
  const payload = redactSecrets({
    level,
    timestamp: new Date().toISOString(),
    ...fields,
  })

  const line = JSON.stringify(payload)

  if (level === "error") {
    console.error(line)
    return
  }

  if (level === "warn") {
    console.warn(line)
    return
  }

  console.log(line)
}

export const logInfo = (fields: LogFields) => {
  writeLog("info", fields)
}

export const logWarn = (fields: LogFields) => {
  writeLog("warn", fields)
}

export const logError = (fields: LogFields) => {
  writeLog("error", fields)
}
