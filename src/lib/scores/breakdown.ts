import {
  BREAKDOWN_TOOLTIPS,
  getBenchmarkRsiTooltip,
} from "@/lib/scores/breakdown-tooltips"

const formatNum = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "—"
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(2)
  }

  return String(value)
}

const readNested = (obj: unknown): Record<string, unknown> | null => {
  if (typeof obj === "object" && obj !== null && !Array.isArray(obj)) {
    return obj as Record<string, unknown>
  }

  return null
}

export type BreakdownRow = {
  label: string
  value: string
  score?: string
  weight?: string
  detail?: string
  tooltip?: string
}

export const buildMacroBreakdownRows = (
  components: Record<string, unknown> | null,
  assetType: "crypto" | "stock"
): BreakdownRow[] => {
  if (!components) {
    return []
  }

  if (assetType === "crypto") {
    const fearGreed = readNested(components.fear_greed)
    const btcRsi = readNested(components.btc_weekly_rsi)

    const rows: BreakdownRow[] = []

    if (fearGreed) {
      const fearGreedReading =
        fearGreed.label !== undefined
          ? fearGreed.classification !== undefined &&
            String(fearGreed.classification) !== String(fearGreed.label)
            ? `${String(fearGreed.label)} (${String(fearGreed.classification)})`
            : String(fearGreed.label)
          : fearGreed.classification !== undefined
            ? String(fearGreed.classification)
            : undefined

      const fearGreedTooltip =
        fearGreedReading !== undefined
          ? `${BREAKDOWN_TOOLTIPS.fear_greed} Current reading: ${fearGreedReading}.`
          : BREAKDOWN_TOOLTIPS.fear_greed

      rows.push({
        label: "Fear & Greed",
        value: formatNum(fearGreed.value),
        score: formatNum(fearGreed.score),
        weight: fearGreed.weight !== undefined ? `${(Number(fearGreed.weight) * 100).toFixed(0)}%` : undefined,
        tooltip: fearGreedTooltip,
      })
    }

    if (btcRsi) {
      rows.push({
        label: "BTC weekly RSI",
        value: formatNum(btcRsi.value),
        score: formatNum(btcRsi.score),
        weight: btcRsi.weight !== undefined ? `${(Number(btcRsi.weight) * 100).toFixed(0)}%` : undefined,
      })
    }

    return rows
  }

  const vix = readNested(components.vix)
  const sp500 = readNested(components.sp500_weekly_rsi)
  const rows: BreakdownRow[] = []

  if (vix) {
    const vixTooltip =
      vix.date !== undefined
        ? `${BREAKDOWN_TOOLTIPS.vix} As of ${String(vix.date)}.`
        : BREAKDOWN_TOOLTIPS.vix

    rows.push({
      label: "VIX",
      value: formatNum(vix.value),
      score: formatNum(vix.score),
      weight: vix.weight !== undefined ? `${(Number(vix.weight) * 100).toFixed(0)}%` : undefined,
      tooltip: vixTooltip,
    })
  }

  if (sp500) {
    rows.push({
      label: "S&P 500 weekly RSI",
      value: formatNum(sp500.value),
      score: formatNum(sp500.score),
      weight: sp500.weight !== undefined ? `${(Number(sp500.weight) * 100).toFixed(0)}%` : undefined,
    })
  }

  return rows
}

export const buildRelativityBreakdownRows = (
  components: Record<string, unknown> | null
): BreakdownRow[] => {
  if (!components) {
    return []
  }

  const benchmarkSymbol =
    components.benchmark_symbol !== undefined
      ? String(components.benchmark_symbol)
      : undefined

  return [
    {
      label: "Asset RSI(14)",
      value: formatNum(components.asset_rsi),
    },
    {
      label: "Benchmark RSI(14)",
      value: formatNum(components.benchmark_rsi),
      tooltip: getBenchmarkRsiTooltip(benchmarkSymbol),
    },
    {
      label: "Relativity index",
      value: formatNum(components.relativity_index),
      tooltip: BREAKDOWN_TOOLTIPS.relativity_index,
    },
  ]
}

export const buildVolumeBreakdownRows = (
  components: Record<string, unknown> | null
): BreakdownRow[] => {
  if (!components) {
    return []
  }

  if (components.error !== undefined) {
    return [{ label: "Error", value: String(components.error) }]
  }

  return [
    {
      label: "V trend",
      value: formatNum(components.v_trend),
      tooltip: BREAKDOWN_TOOLTIPS.v_trend,
    },
    {
      label: "P context",
      value: formatNum(components.p_context),
      tooltip: BREAKDOWN_TOOLTIPS.p_context,
    },
    {
      label: "RSI(14) now",
      value: formatNum(components.rsi_now),
      tooltip: BREAKDOWN_TOOLTIPS.rsi_now,
    },
    {
      label: "Gate",
      value: formatNum(components.gate),
      tooltip: BREAKDOWN_TOOLTIPS.gate,
    },
    {
      label: "Decel factor",
      value: formatNum(components.decel_factor),
      tooltip: BREAKDOWN_TOOLTIPS.decel_factor,
    },
    {
      label: "Raw blend",
      value: formatNum(components.raw),
      tooltip: BREAKDOWN_TOOLTIPS.raw,
    },
  ]
}

export const buildCompositeBreakdownRows = (
  components: Record<string, unknown> | null
): BreakdownRow[] => {
  if (!components) {
    return []
  }

  const invalidSectors = Array.isArray(components.invalid_sectors)
    ? (components.invalid_sectors as Array<Record<string, unknown>>)
    : []

  if (invalidSectors.length > 0) {
    return invalidSectors.map((entry) => ({
      label: String(entry.sector ?? "sector"),
      value: String(entry.null_reason ?? "invalid"),
      detail: entry.is_stale ? "Stale" : entry.is_null ? "Null" : undefined,
    }))
  }

  const rows: BreakdownRow[] = []
  const sectors = ["macro", "relativity", "volume"] as const

  for (const sector of sectors) {
    const entry = readNested(components[sector])

    if (!entry) {
      continue
    }

    rows.push({
      label: sector.charAt(0).toUpperCase() + sector.slice(1),
      value: formatNum(entry.score),
      detail:
        entry.computed_at !== undefined
          ? `Computed ${new Date(String(entry.computed_at)).toLocaleString("en-US", { timeZone: "UTC" })} UTC`
          : undefined,
    })
  }

  const included = components.included_sectors

  if (Array.isArray(included) && included.length > 0) {
    rows.push({
      label: "Included sectors",
      value: included.join(", "),
      detail: "Composite requires all three valid, non-stale sectors (3/3)",
    })
  }

  return rows
}
