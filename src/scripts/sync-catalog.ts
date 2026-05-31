import { syncAssetCatalog } from "@/lib/assets/sync-catalog"

const runCatalogSync = async () => {
  const summary = await syncAssetCatalog()

  console.log(
    `Synced asset catalog: ${summary.cryptoCount} crypto, ${summary.stockCount} stocks (${summary.totalUpserted} total rows). Pruned ${summary.prunedCatalogCount} catalog rows and ${summary.prunedAssetCount} orphaned stock assets.`
  )
}

runCatalogSync().catch((error) => {
  console.error(error)
  process.exit(1)
})
