import { resolveAllSeedAssets } from "@/lib/assets/resolve-assets"
import { listActiveAssets } from "@/lib/assets/queries"
import { getLatestVix, getSp500DailyCloses } from "@/providers/fred"
import { fetchWeeklyOhlcvFromDto } from "@/providers/market-data"
import { resampleDailyToWeeklyCloses } from "@/scoring/candles"

type CheckRow = {
  label: string
  pass: boolean
  detail: string
}

const run = async () => {
  const rows: CheckRow[] = []

  console.log("Resolving seed assets...\n")
  await resolveAllSeedAssets()

  const assets = await listActiveAssets()
  const cryptoTargets = ["BTC", "ETH", "SOL", "ZEC", "HYPE"]

  for (const symbol of cryptoTargets) {
    const asset = assets.find((entry) => entry.symbol === symbol)

    if (!asset) {
      rows.push({ label: symbol, pass: false, detail: "Asset not found" })
      continue
    }

    if (asset.resolutionStatus === "unsupported") {
      rows.push({
        label: symbol,
        pass: symbol === "HYPE",
        detail: `unsupported: ${asset.unsupportedReason ?? "unknown"}`,
      })
      continue
    }

    const result = await fetchWeeklyOhlcvFromDto(asset)

    rows.push({
      label: symbol,
      pass: result.ok && result.candles.length >= 30,
      detail: result.ok
        ? `${result.candles.length} candles via ${result.sourceMetadata.provider}`
        : `${result.nullReason}: ${result.message}`,
    })
  }

  for (const symbol of ["MSTR", "SPY"]) {
    const asset = assets.find((entry) => entry.symbol === symbol)
    const fetchSymbol = symbol === "SPY" ? "SPY" : symbol

    if (!asset && symbol !== "SPY") {
      rows.push({ label: symbol, pass: false, detail: "Asset not found" })
      continue
    }

    const result = await fetchWeeklyOhlcvFromDto(
      asset ?? {
        id: "benchmark",
        symbol: fetchSymbol,
        name: fetchSymbol,
        assetType: "stock",
        providerSymbol: fetchSymbol,
        providerName: "twelve_data",
        quoteAsset: null,
        benchmarkSymbol: null,
        exchange: null,
        resolutionStatus: "resolved",
        unsupportedReason: null,
        isActive: true,
      }
    )

    rows.push({
      label: symbol,
      pass: result.ok && result.candles.length >= 28,
      detail: result.ok
        ? `${result.candles.length} candles via ${result.sourceMetadata.provider}`
        : `${result.nullReason}: ${result.message}`,
    })
  }

  const vix = await getLatestVix()
  rows.push({
    label: "FRED VIX",
    pass: vix.ok,
    detail: vix.ok ? `${vix.value} on ${vix.date}` : vix.message,
  })

  const sp500 = await getSp500DailyCloses()
  const weeklyCount =
    sp500.ok ? resampleDailyToWeeklyCloses(sp500.points).length : 0

  rows.push({
    label: "FRED SP500",
    pass: sp500.ok && weeklyCount >= 28,
    detail: sp500.ok
      ? `${sp500.points.length} daily → ${weeklyCount} weekly`
      : sp500.message,
  })

  console.log("Market data verification:\n")
  console.log("  Label          Pass  Detail")
  console.log("  -------------  ----  ----------------------------------------")

  for (const row of rows) {
    const passLabel = row.pass ? "yes" : "no"
    console.log(`  ${row.label.padEnd(13)}  ${passLabel.padEnd(4)}  ${row.detail}`)
  }

  const failed = rows.filter((row) => !row.pass)

  if (failed.length > 0) {
    console.log(`\n${failed.length} check(s) failed.`)
    process.exit(1)
  }

  console.log("\nAll checks passed.")
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
