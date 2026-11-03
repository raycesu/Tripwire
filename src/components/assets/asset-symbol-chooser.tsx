import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { assetDetailHref } from "@/lib/assets/asset-href"
import type { AssetChoice } from "@/lib/assets/ensure-asset"
import { cn } from "@/lib/utils"

type AssetSymbolChooserProps = {
  symbol: string
  choices: AssetChoice[]
}

export const AssetSymbolChooser = ({ symbol, choices }: AssetSymbolChooserProps) => {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
      <Link
        href="/dashboard"
        className={cn(
          "inline-flex h-7 w-fit items-center gap-1.5 rounded-full px-2.5 text-[0.8rem] font-medium transition-all",
          "nav-link-active"
        )}
        aria-label="Back to watchlist"
      >
        <ChevronLeft className="size-3.5" aria-hidden="true" />
        Back
      </Link>

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-metallic">{symbol}</h1>
        <p className="text-sm text-muted-foreground">
          This ticker matches more than one asset. Choose the crypto or the stock.
        </p>
      </div>

      <ul className="flex flex-col gap-3" aria-label={`${symbol} asset choices`}>
        {choices.map((choice) => {
          const typeLabel = choice.assetType === "crypto" ? "Crypto" : "Stock"
          const detail = choice.exchange ? `${choice.name} · ${choice.exchange}` : choice.name

          return (
            <li key={choice.assetType}>
              <Link
                href={assetDetailHref(choice.symbol, choice.assetType)}
                aria-label={`Open ${choice.symbol} ${typeLabel}, ${choice.name}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-white/15 px-4 py-3 transition-colors hover:bg-white/6"
              >
                <span className="min-w-0">
                  <span className="block font-semibold text-white">{choice.symbol}</span>
                  <span className="mt-0.5 block truncate text-sm text-white/50">{detail}</span>
                </span>
                <Badge variant="default" className="capitalize">
                  {choice.assetType}
                </Badge>
              </Link>
            </li>
          )
        })}
      </ul>
    </main>
  )
}
