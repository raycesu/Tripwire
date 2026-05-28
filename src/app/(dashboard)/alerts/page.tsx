import Link from "next/link"
import { AlertRulesPanel } from "@/components/alerts/alert-rules-panel"
import { ensureDbUser } from "@/lib/auth/ensure-user"
import { listAlertRulesForUser } from "@/lib/alerts/queries"
import { toAlertRuleDto } from "@/lib/alerts/types"
import { listUserWatchlist } from "@/lib/watchlist/queries"

export default async function AlertsPage() {
  const user = await ensureDbUser()
  const [rules, watchlist] = await Promise.all([
    listAlertRulesForUser(user.id),
    listUserWatchlist(user.id),
  ])

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Alerts</h1>
        <p className="mt-1 text-muted-foreground">
          Define threshold rules and receive Telegram notifications when fresh scores qualify.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          <Link href="/settings" className="text-foreground underline-offset-4 hover:underline">
            Connect Telegram in Settings
          </Link>{" "}
          before expecting delivery.
        </p>
      </div>

      <AlertRulesPanel
        initialRules={rules.map(toAlertRuleDto)}
        watchlist={watchlist.map((item) => ({
          assetId: item.assetId,
          symbol: item.asset.symbol,
          name: item.asset.name,
        }))}
      />
    </main>
  )
}
