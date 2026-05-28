import Link from "next/link"
import { Bell, Radar } from "lucide-react"
import { ButtonLink } from "@/components/ui/button"
import { AssetResolutionBadge } from "@/components/assets/asset-resolution-badge"
import { ensureDbUser } from "@/lib/auth/ensure-user"
import { countActiveAlertRules } from "@/lib/alerts/queries"
import { listUserWatchlist } from "@/lib/watchlist/queries"

export default async function DashboardPage() {
  const user = await ensureDbUser()
  const [watchlist, activeAlertCount] = await Promise.all([
    listUserWatchlist(user.id),
    countActiveAlertRules(user.id),
  ])

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
      <section className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-md bg-accent/20 p-2 text-accent">
            <Radar className="size-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tripwire</p>
            <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Monitor your watchlist. Scores appear after the scoring engine runs in a later phase.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Watchlist</p>
          <p className="mt-2 text-2xl font-semibold">{watchlist.length}</p>
        </article>
        <article className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Active alerts</p>
          <p className="mt-2 text-2xl font-semibold">{activeAlertCount}</p>
        </article>
        <article className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Status</p>
          <p className="mt-2 text-sm font-medium text-foreground">Awaiting first score run</p>
        </article>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-accent" aria-hidden="true" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Your watchlist
            </h2>
          </div>
          <ButtonLink href="/assets" variant="secondary">
            Browse assets
          </ButtonLink>
        </div>

        {watchlist.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No assets on your watchlist yet. Add BTC, ETH, SOL, and other MVP assets from the
              catalog.
            </p>
            <div className="mt-4">
              <ButtonLink href="/assets">Go to asset catalog</ButtonLink>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {watchlist.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <Link
                    href={`/assets/${entry.asset.symbol}`}
                    className="font-medium text-foreground hover:underline"
                  >
                    {entry.asset.symbol}
                  </Link>
                  <p className="text-sm text-muted-foreground">{entry.asset.name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <AssetResolutionBadge
                    resolutionStatus={entry.asset.resolutionStatus}
                    unsupportedReason={entry.asset.unsupportedReason}
                  />
                  <span className="text-xs text-muted-foreground capitalize">
                    {entry.asset.assetType}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
