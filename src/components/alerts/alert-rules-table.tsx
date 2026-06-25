"use client"

import { MoreVertical } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { formatConditionPill, type AlertRuleDto } from "@/lib/alerts/types"
import { AssetTypePill } from "@/components/alerts/asset-type-pill"
import { cn } from "@/lib/utils"

type AlertRulesTableProps = {
  rules: AlertRuleDto[]
  selectedIds: Set<string>
  togglingRuleId: string | null
  onToggleSelect: (ruleId: string, checked: boolean) => void
  onToggleSelectAll: (checked: boolean) => void
  onToggleEnabled: (rule: AlertRuleDto) => void
  onEdit: (rule: AlertRuleDto) => void
  onDuplicate: (rule: AlertRuleDto) => void
  onDelete: (ruleId: string) => void
}


export const AlertRulesTable = ({
  rules,
  selectedIds,
  togglingRuleId,
  onToggleSelect,
  onToggleSelectAll,
  onToggleEnabled,
  onEdit,
  onDuplicate,
  onDelete,
}: AlertRulesTableProps) => {
  const allSelected = rules.length > 0 && rules.every((rule) => selectedIds.has(rule.id))
  const someSelected = rules.some((rule) => selectedIds.has(rule.id))

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border/60 text-left text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
            <th scope="col" className="w-10 py-3 pr-2">
              <Checkbox
                checked={allSelected}
                indeterminate={!allSelected && someSelected}
                onCheckedChange={(checked) => onToggleSelectAll(checked === true)}
                aria-label="Select all rules on this page"
              />
            </th>
            <th scope="col" className="py-3 pr-4">
              Asset
            </th>
            <th scope="col" className="py-3 pr-4">
              Condition
            </th>
            <th scope="col" className="py-3 pr-4">
              Status
            </th>
            <th scope="col" className="w-10 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rules.map((rule) => {
            const isSelected = selectedIds.has(rule.id)
            const isToggling = togglingRuleId === rule.id

            return (
              <tr
                key={rule.id}
                className={cn(
                  "border-b border-border/40 transition-colors",
                  isSelected && "bg-primary/10"
                )}
              >
                <td className="py-3.5 pr-2 align-middle">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => onToggleSelect(rule.id, checked === true)}
                    aria-label={`Select alert rule for ${rule.assetSymbol}`}
                  />
                </td>
                <td className="py-3.5 pr-4 align-middle">
                  <div className="flex items-start gap-2.5">
                    <span
                      className={cn(
                        "mt-1.5 size-2 shrink-0 rounded-full",
                        rule.isEnabled ? "bg-chart-1" : "bg-white/30"
                      )}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-foreground">{rule.assetSymbol}</span>
                        <AssetTypePill assetType={rule.assetType} />
                      </div>
                      <p className="text-xs text-muted-foreground">{rule.assetName}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 pr-4 align-middle">
                  <span className="inline-flex rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-xs text-white/80">
                    {formatConditionPill(rule)}
                  </span>
                </td>
                <td className="py-3.5 pr-4 align-middle">
                  <Switch
                    checked={rule.isEnabled}
                    disabled={isToggling}
                    onCheckedChange={() => onToggleEnabled(rule)}
                    aria-label={`${rule.isEnabled ? "Disable" : "Enable"} alert for ${rule.assetSymbol}`}
                    className={cn(
                      rule.isEnabled
                        ? "data-checked:bg-chart-1"
                        : "data-unchecked:bg-white/20 dark:data-unchecked:bg-white/20"
                    )}
                  />
                </td>
                <td className="py-3.5 align-middle">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Actions for ${rule.assetSymbol}`}
                        />
                      }
                    >
                      <MoreVertical aria-hidden="true" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-36">
                      <DropdownMenuItem onClick={() => onEdit(rule)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDuplicate(rule)}>Duplicate</DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onClick={() => onDelete(rule.id)}>
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
