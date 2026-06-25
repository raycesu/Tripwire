import { AlertsPageContent } from "@/components/alerts/alerts-page-content"
import { ensureDbUser } from "@/lib/auth/ensure-user"
import { listAlertEventsForUser, listAlertRulesForUser } from "@/lib/alerts/queries"
import { toAlertRuleDto } from "@/lib/alerts/types"
import { listUserWatchlist } from "@/lib/watchlist/queries"

export default async function AlertsPage() {
  const user = await ensureDbUser()
  const [rules, watchlist, alertEvents] = await Promise.all([
    listAlertRulesForUser(user.id),
    listUserWatchlist(user.id),
    listAlertEventsForUser(user.id, { limit: 50 }),
  ])

  const watchlistOptions = watchlist.map((item) => ({
    assetId: item.assetId,
    symbol: item.asset.symbol,
    name: item.asset.name,
    assetType: item.asset.assetType,
  }))

  const assetSymbols = [...new Set(alertEvents.map((event) => event.assetSymbol))].sort()

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-6 py-8">
      <h1 className="sr-only">Alerts</h1>
      <AlertsPageContent
        initialRules={rules.map(toAlertRuleDto)}
        watchlist={watchlistOptions}
        alertEvents={alertEvents}
        assetSymbols={assetSymbols}
      />
    </main>
  )
}
