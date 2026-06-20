import { Skeleton } from "@/components/ui/skeleton"

export default function AlertsLoading() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
      <Skeleton className="h-96 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </main>
  )
}
