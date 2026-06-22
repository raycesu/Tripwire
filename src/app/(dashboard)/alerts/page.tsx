import { AlertHistoryTimeline } from "@/components/alerts/alert-history-timeline"
import { AlertRulesPanel } from "@/components/alerts/alert-rules-panel"
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
  }))

  const assetSymbols = [...new Set(alertEvents.map((event) => event.assetSymbol))].sort()

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
      <h1 className="sr-only">Alerts</h1>
      <AlertRulesPanel initialRules={rules.map(toAlertRuleDto)} watchlist={watchlistOptions} />

      <section>
        <AlertHistoryTimeline events={alertEvents} assetSymbols={assetSymbols} />
      </section>
    </main>
  )
}
