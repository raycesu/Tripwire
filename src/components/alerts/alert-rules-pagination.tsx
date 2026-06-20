"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type AlertRulesPaginationProps = {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  itemLabel?: string
  onPageChange: (page: number) => void
}

const getVisiblePages = (currentPage: number, totalPages: number): number[] => {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const pages = new Set<number>([1, totalPages, currentPage])

  if (currentPage > 1) {
    pages.add(currentPage - 1)
  }

  if (currentPage < totalPages) {
    pages.add(currentPage + 1)
  }

  return [...pages].sort((a, b) => a - b)
}

export const AlertRulesPagination = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  itemLabel = "rules",
  onPageChange,
}: AlertRulesPaginationProps) => {
  if (totalItems === 0) {
    return null
  }

  const start = (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, totalItems)
  const visiblePages = getVisiblePages(currentPage, totalPages)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
      <p className="text-xs text-muted-foreground">
        Showing {start}–{end} of {totalItems}
        {itemLabel ? ` ${itemLabel}` : ""}
      </p>
      {totalPages > 1 ? (
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
          {visiblePages.map((page, index) => {
            const previousPage = visiblePages[index - 1]
            const showEllipsis = previousPage !== undefined && page - previousPage > 1

            return (
              <span key={page} className="flex items-center gap-1">
                {showEllipsis ? (
                  <span className="px-1 text-xs text-muted-foreground" aria-hidden="true">
                    …
                  </span>
                ) : null}
                <Button
                  type="button"
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  className={cn("min-w-8 px-2", page === currentPage && "pointer-events-none")}
                  onClick={() => onPageChange(page)}
                  aria-label={`Page ${page}`}
                  aria-current={page === currentPage ? "page" : undefined}
                >
                  {page}
                </Button>
              </span>
            )
          })}
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            aria-label="Next page"
          >
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      ) : null}
    </div>
  )
}
