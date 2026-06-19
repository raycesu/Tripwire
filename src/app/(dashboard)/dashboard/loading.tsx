import { Skeleton } from "@/components/ui/skeleton"

const WatchlistCardSkeleton = () => (
  <div className="flex flex-col gap-4">
    <div className="relative flex items-center justify-center px-10">
      <Skeleton className="h-6 w-20" />
      <Skeleton className="absolute right-0 top-1/2 size-8 -translate-y-1/2 rounded-md" />
    </div>
    <Skeleton className="mx-auto h-[130px] w-full max-w-[240px] rounded-full" />
    <div className="flex flex-col gap-3 border-t border-white/10 pt-4">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
    </div>
  </div>
)

export default function DashboardLoading() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <li>
          <WatchlistCardSkeleton />
        </li>
        <li>
          <WatchlistCardSkeleton />
        </li>
        <li>
          <WatchlistCardSkeleton />
        </li>
      </ul>
    </main>
  )
}
