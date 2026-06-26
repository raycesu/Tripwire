"use client"

import { Copy, MoreVertical, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type AlertRuleRowActionsMenuProps = {
  assetSymbol: string
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
}

const menuItemClassName = "w-full gap-2 rounded-none px-2.5 py-2 focus:bg-white/8"

export const AlertRuleRowActionsMenu = ({
  assetSymbol,
  onEdit,
  onDuplicate,
  onDelete,
}: AlertRuleRowActionsMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${assetSymbol}`}
          />
        }
      >
        <MoreVertical aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="glass-popover !w-36 min-w-36 overflow-hidden rounded-xl p-0 shadow-none ring-0"
      >
        <DropdownMenuItem className={menuItemClassName} onClick={onEdit}>
          <Pencil className="size-4 text-muted-foreground" aria-hidden="true" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-0 h-px bg-white/10" />
        <DropdownMenuItem className={menuItemClassName} onClick={onDuplicate}>
          <Copy className="size-4 text-muted-foreground" aria-hidden="true" />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-0 h-px bg-white/10" />
        <DropdownMenuItem
          variant="destructive"
          className={menuItemClassName}
          onClick={onDelete}
        >
          <Trash2 aria-hidden="true" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
