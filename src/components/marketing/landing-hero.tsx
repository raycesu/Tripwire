import { ButtonLink } from "@/components/ui/button"

export const LandingHero = () => {
  return (
    <section className="grid min-h-0 items-center gap-6 sm:gap-8 lg:grid-cols-2 lg:gap-12">
      <div className="flex flex-col gap-4 sm:gap-6">
        <h1 className="text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
          <span className="block text-white">Know when.</span>
          <span className="block text-white">Stop</span>
          <span className="block text-[oklch(0.65_0.24_25)]">watching.</span>
        </h1>
        <p className="max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
          Tripwire scores your watchlist across backtested contrarian sectors and
          sends a Telegram alert the moment a real opportunity shows up, so you
          don&apos;t have to watch the market yourself.
        </p>
        <div>
          <ButtonLink href="/sign-up" variant="outline" size="lg">
            Get started
          </ButtonLink>
        </div>
      </div>
      <div className="flex min-h-0 justify-center lg:justify-end">
        <img
          src="/hero.png"
          alt="Tripwire score dashboard preview"
          width={786}
          height={731}
          className="h-auto w-full max-h-[min(46vh,520px)] max-w-md object-contain sm:max-h-[min(50vh,560px)] sm:max-w-lg lg:ml-auto"
        />
      </div>
    </section>
  )
}
