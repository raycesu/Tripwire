"use client"

import { HeroAlertToast } from "@/components/marketing/hero-alert-toast"
import { HeroSectorBars } from "@/components/marketing/hero-sector-bars"
import { HeroTachometer } from "@/components/marketing/hero-tachometer"
import { useScoreSweepAnimation } from "@/components/marketing/use-score-sweep-animation"
import { cn } from "@/lib/utils"

const DEMO_LABEL = "BITCOIN"
const DEMO_SYMBOL = "BTC"
const DEMO_SCORE = 1.67

type HeroScorePreviewProps = {
  className?: string
}

export const HeroScorePreview = ({ className }: HeroScorePreviewProps) => {
  const { animatedScore, centerTextOpacity, isSettled } = useScoreSweepAnimation({
    targetScore: DEMO_SCORE,
  })

  return (
    <div
      className={cn("flex w-full flex-col gap-3 lg:ml-auto", className)}
      aria-label="Tripwire score demo animation"
    >
      <div className="flex w-full flex-col items-center">
        <span className="text-xl font-semibold tracking-tight text-metallic">
          {DEMO_LABEL}
        </span>
        <HeroTachometer
          animatedScore={animatedScore}
          targetScore={DEMO_SCORE}
          centerTextOpacity={centerTextOpacity}
          symbol={DEMO_SYMBOL}
          className="-mt-1 w-full max-w-[min(100%,840px)]"
        />
      </div>

      <div className="flex w-full flex-row items-center gap-4">
        <HeroSectorBars animatedScore={animatedScore} className="min-w-0 flex-1" />
        <HeroAlertToast visible={isSettled} className="ml-auto max-w-[12rem] shrink-0" />
      </div>
    </div>
  )
}
