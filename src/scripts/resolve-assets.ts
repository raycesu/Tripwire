import { resolveAllSeedAssets } from "@/lib/assets/resolve-assets"

const run = async () => {
  const results = await resolveAllSeedAssets()

  console.log("Asset resolution results:\n")

  for (const result of results) {
    const provider = result.providerName ?? "—"
    const reason = result.unsupportedReason ? ` (${result.unsupportedReason})` : ""
    console.log(`  ${result.symbol}: ${result.resolutionStatus} [${provider}]${reason}`)
  }

  console.log(`\nResolved ${results.length} assets.`)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
