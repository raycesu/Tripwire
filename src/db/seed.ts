/**
 * Idempotent MVP asset seed. Run after migrations:
 * npm run db:seed
 */
import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import { assets } from "./schema"

const seedAssets = [
  {
    symbol: "BTC",
    name: "Bitcoin",
    assetType: "crypto",
    providerSymbol: "BTCUSDT",
    benchmarkSymbol: "SPY",
    quoteAsset: "USDT",
    resolutionStatus: "needs_review",
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    assetType: "crypto",
    providerSymbol: "ETHUSDT",
    benchmarkSymbol: "BTC",
    quoteAsset: "USDT",
    resolutionStatus: "needs_review",
  },
  {
    symbol: "SOL",
    name: "Solana",
    assetType: "crypto",
    providerSymbol: "SOLUSDT",
    benchmarkSymbol: "BTC",
    quoteAsset: "USDT",
    resolutionStatus: "needs_review",
  },
  {
    symbol: "HYPE",
    name: "Hyperliquid",
    assetType: "crypto",
    providerSymbol: "HYPEUSDT",
    benchmarkSymbol: "BTC",
    quoteAsset: "USDT",
    resolutionStatus: "needs_review",
  },
  {
    symbol: "ZEC",
    name: "Zcash",
    assetType: "crypto",
    providerSymbol: "ZECUSDT",
    benchmarkSymbol: "BTC",
    quoteAsset: "USDT",
    resolutionStatus: "needs_review",
  },
  {
    symbol: "MSTR",
    name: "MicroStrategy",
    assetType: "stock",
    providerSymbol: "MSTR",
    benchmarkSymbol: "SPY",
    quoteAsset: null,
    resolutionStatus: "needs_review",
  },
  {
    symbol: "TSLA",
    name: "Tesla",
    assetType: "stock",
    providerSymbol: "TSLA",
    benchmarkSymbol: "SPY",
    quoteAsset: null,
    resolutionStatus: "needs_review",
  },
  {
    symbol: "NVDA",
    name: "Nvidia",
    assetType: "stock",
    providerSymbol: "NVDA",
    benchmarkSymbol: "SPY",
    quoteAsset: null,
    resolutionStatus: "needs_review",
  },
  {
    symbol: "COIN",
    name: "Coinbase",
    assetType: "stock",
    providerSymbol: "COIN",
    benchmarkSymbol: "SPY",
    quoteAsset: null,
    resolutionStatus: "needs_review",
  },
] as const

const runSeed = async () => {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required. Load .env.local before seeding.")
  }

  const sql = neon(databaseUrl)
  const db = drizzle(sql)

  await db.insert(assets).values([...seedAssets]).onConflictDoNothing()

  console.log(`Seeded ${seedAssets.length} MVP assets (skipped existing symbols).`)
}

runSeed().catch((error) => {
  console.error(error)
  process.exit(1)
})
