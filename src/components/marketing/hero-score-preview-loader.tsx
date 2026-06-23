"use client"

import dynamic from "next/dynamic"

import { cn } from "@/lib/utils"

const HeroScorePreview = dynamic(
  () =>
    import("@/components/marketing/hero-score-preview").then(
      (mod) => mod.HeroScorePreview
    ),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex w-full min-h-[min(58vh,420px)] flex-col gap-3 lg:ml-auto"
        aria-hidden
      />
    ),
  }
)

type HeroScorePreviewLoaderProps = {
  className?: string
}

export const HeroScorePreviewLoader = ({ className }: HeroScorePreviewLoaderProps) => (
  <HeroScorePreview className={cn(className)} />
)
