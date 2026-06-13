import {
  resolveLegacyCryptoAssets,
  resolvePendingAssets,
} from "@/lib/assets/resolve-assets"

const run = async () => {
  const useLegacyCrypto = process.argv.includes("--legacy-crypto")
  const results = useLegacyCrypto
    ? await resolveLegacyCryptoAssets()
    : await resolvePendingAssets()

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
