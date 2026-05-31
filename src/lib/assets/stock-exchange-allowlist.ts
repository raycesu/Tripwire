export type StockExchangeAllowlistEntry = {
  micCode: string
  exchangeName: string
  label: string
}

/** Ordered by listing priority when the same ticker appears on multiple US exchanges. */
export const STOCK_EXCHANGE_ALLOWLIST: StockExchangeAllowlistEntry[] = [
  { micCode: "XNYS", exchangeName: "NYSE", label: "NYSE" },
  { micCode: "XNAS", exchangeName: "NASDAQ", label: "NASDAQ" },
  { micCode: "BATS", exchangeName: "BATS", label: "BATS" },
]

const ALLOWED_MIC_CODES = new Set(
  STOCK_EXCHANGE_ALLOWLIST.map((entry) => entry.micCode.toUpperCase())
)

const ALLOWED_EXCHANGE_NAMES = new Set(
  STOCK_EXCHANGE_ALLOWLIST.map((entry) => entry.exchangeName.toUpperCase())
)

const priorityByMic = new Map(
  STOCK_EXCHANGE_ALLOWLIST.map((entry, index) => [entry.micCode.toUpperCase(), index])
)

const priorityByExchangeName = new Map(
  STOCK_EXCHANGE_ALLOWLIST.map((entry, index) => [entry.exchangeName.toUpperCase(), index])
)

export const getStockExchangePriority = (input: {
  micCode?: string | null
  exchangeName?: string | null
}): number | null => {
  if (input.micCode) {
    const priority = priorityByMic.get(input.micCode.toUpperCase())

    if (priority !== undefined) {
      return priority
    }
  }

  if (input.exchangeName) {
    const priority = priorityByExchangeName.get(input.exchangeName.toUpperCase())

    if (priority !== undefined) {
      return priority
    }
  }

  return null
}

export const isAllowedStockExchange = (input: {
  micCode?: string | null
  exchangeName?: string | null
}): boolean => {
  if (input.micCode && ALLOWED_MIC_CODES.has(input.micCode.toUpperCase())) {
    return true
  }

  if (input.exchangeName && ALLOWED_EXCHANGE_NAMES.has(input.exchangeName.toUpperCase())) {
    return true
  }

  return false
}

export const compareExchangePriority = (
  left: { micCode?: string | null; exchangeName?: string | null },
  right: { micCode?: string | null; exchangeName?: string | null }
): number => {
  const leftPriority = getStockExchangePriority(left)
  const rightPriority = getStockExchangePriority(right)

  if (leftPriority === null && rightPriority === null) {
    return 0
  }

  if (leftPriority === null) {
    return 1
  }

  if (rightPriority === null) {
    return -1
  }

  return leftPriority - rightPriority
}

export const getAllowlistEntryByMicCode = (
  micCode: string
): StockExchangeAllowlistEntry | undefined =>
  STOCK_EXCHANGE_ALLOWLIST.find((entry) => entry.micCode.toUpperCase() === micCode.toUpperCase())

export const getAllowlistEntryByExchangeName = (
  exchangeName: string
): StockExchangeAllowlistEntry | undefined =>
  STOCK_EXCHANGE_ALLOWLIST.find(
    (entry) => entry.exchangeName.toUpperCase() === exchangeName.toUpperCase()
  )
