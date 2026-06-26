"use client"

import { ChevronDown } from "lucide-react"
import { Fragment } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

type AlertHistoryAssetFilterProps = {
  assetSymbols: string[]
  value: string
  onChange: (symbol: string) => void
}

const menuItemClassName = "w-full rounded-none px-2.5 py-2 focus:bg-white/8"
const menuSeparatorClassName = "my-0 h-px bg-white/10"

export const AlertHistoryAssetFilter = ({
  assetSymbols,
  value,
  onChange,
}: AlertHistoryAssetFilterProps) => {
  const displayLabel = value === "all" ? "All assets" : value

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            tabIndex={0}
            aria-label="Filter alert history by asset"
            className={cn(
              "glass-input inline-flex h-9 items-center gap-2 rounded-lg border px-3 py-1.5 text-sm text-white/95 outline-none transition-colors"
            )}
          />
        }
      >
        <span className="font-medium">{displayLabel}</span>
        <ChevronDown className="size-3.5 shrink-0 text-white/50" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="glass-popover min-w-[9rem] overflow-hidden rounded-xl p-0 shadow-none ring-0"
      >
        <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
          <DropdownMenuRadioItem value="all" className={menuItemClassName}>
            All assets
          </DropdownMenuRadioItem>
          {assetSymbols.map((symbol) => (
            <Fragment key={symbol}>
              <DropdownMenuSeparator className={menuSeparatorClassName} />
              <DropdownMenuRadioItem value={symbol} className={menuItemClassName}>
                {symbol}
              </DropdownMenuRadioItem>
            </Fragment>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
