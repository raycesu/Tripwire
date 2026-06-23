import { LandingCtaPrimary } from "@/components/marketing/landing-cta"
import { HeroScorePreviewLoader } from "@/components/marketing/hero-score-preview-loader"
import { LandingStats } from "@/components/marketing/landing-stats"

export const LandingHero = () => {
  return (
    <section className="grid min-h-0 items-center gap-6 sm:gap-8 lg:grid-cols-2 lg:gap-12">
      <div className="flex flex-col gap-4 sm:gap-6">
        <h1 className="text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
          <span className="block text-white">You don&apos;t watch the market.</span>
          <span className="block text-[oklch(0.65_0.24_25)]">Tripwire does.</span>
        </h1>
        <p className="max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
          Tripwire scores your watchlist across backtested contrarian sectors and
          sends a Telegram alert the moment a real opportunity shows up, so you
          don&apos;t have to watch the market yourself.
        </p>
        <div>
          <LandingCtaPrimary href="/sign-up" size="hero" showArrow>
            Get started
          </LandingCtaPrimary>
        </div>
        <LandingStats />
      </div>
      <div className="flex min-h-0 w-full justify-center lg:justify-end">
        <HeroScorePreviewLoader className="max-h-[min(68vh,720px)]" />
      </div>
    </section>
  )
}
