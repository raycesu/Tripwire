import { ButtonLink } from "@/components/ui/button"

export default function AssetNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-4 px-6 py-20 text-center">
      <h1 className="text-2xl font-semibold text-foreground">Asset not found</h1>
      <p className="text-sm text-muted-foreground">
        This symbol is not in the Tripwire catalog yet.
      </p>
      <ButtonLink href="/assets">Back to catalog</ButtonLink>
    </main>
  )
}
