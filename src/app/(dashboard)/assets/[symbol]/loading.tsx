import { Skeleton } from "@/components/ui/skeleton"

export default function AssetDetailLoading() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-[480px] w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </main>
  )
}
