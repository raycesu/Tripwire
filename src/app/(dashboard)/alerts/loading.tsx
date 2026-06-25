import { Skeleton } from "@/components/ui/skeleton"

export default function AlertsLoading() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-6 py-8">
      <Skeleton className="h-96 w-full rounded-xl" />
    </main>
  )
}
