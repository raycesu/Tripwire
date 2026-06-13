"use client"

import { useEffect, useRef, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"

const TRADINGVIEW_SCRIPT_SRC =
  "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"

const CHART_HEIGHT_PX = 480

type TradingViewChartSectionProps = {
  tradingViewSymbol: string | null
  assetSymbol: string
}

type TradingViewChartWidgetProps = {
  tradingViewSymbol: string
  assetSymbol: string
}

const buildWidgetConfig = (symbol: string) => ({
  autosize: true,
  symbol,
  interval: "D",
  timezone: "Etc/UTC",
  theme: "dark",
  style: "1",
  locale: "en",
  enable_publishing: false,
  allow_symbol_change: false,
  withdateranges: true,
  save_image: false,
  calendar: false,
  support_host: "https://www.tradingview.com",
})

const TradingViewChartWidget = ({
  tradingViewSymbol,
  assetSymbol,
}: TradingViewChartWidgetProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const container = containerRef.current

    if (!container) {
      return
    }

    container.replaceChildren()
    setIsLoading(true)

    const widgetHost = document.createElement("div")
    widgetHost.className = "tradingview-widget-container__widget"
    widgetHost.style.height = "calc(100% - 32px)"
    widgetHost.style.width = "100%"
    container.appendChild(widgetHost)

    const script = document.createElement("script")
    script.src = TRADINGVIEW_SCRIPT_SRC
    script.type = "text/javascript"
    script.async = true
    script.innerHTML = JSON.stringify(buildWidgetConfig(tradingViewSymbol))

    const handleLoad = () => {
      setIsLoading(false)
    }

    script.addEventListener("load", handleLoad)
    container.appendChild(script)

    const fallbackTimer = window.setTimeout(() => {
      setIsLoading(false)
    }, 3000)

    return () => {
      window.clearTimeout(fallbackTimer)
      script.removeEventListener("load", handleLoad)
      container.replaceChildren()
    }
  }, [tradingViewSymbol])

  return (
    <section
      className="rounded-xl border border-border bg-card p-6"
      role="region"
      aria-label={`Price chart for ${assetSymbol}`}
    >
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Price chart
      </h2>
      <div className="relative mt-4 w-full" style={{ height: CHART_HEIGHT_PX }}>
        {isLoading ? (
          <Skeleton
            className="absolute inset-0 h-full w-full rounded-md"
            aria-busy="true"
            aria-label={`Loading price chart for ${assetSymbol}`}
          />
        ) : null}
        <div
          ref={containerRef}
          className="tradingview-widget-container h-full w-full"
        />
      </div>
    </section>
  )
}

export const TradingViewChartSection = ({
  tradingViewSymbol,
  assetSymbol,
}: TradingViewChartSectionProps) => {
  if (!tradingViewSymbol) {
    return (
      <section
        className="rounded-xl border border-border bg-card p-6"
        role="region"
        aria-label={`Price chart for ${assetSymbol}`}
      >
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Price chart
        </h2>
        <p className="mt-4 text-sm text-muted-foreground">
          Price chart is unavailable for unsupported or unresolved assets.
        </p>
      </section>
    )
  }

  return (
    <TradingViewChartWidget
      tradingViewSymbol={tradingViewSymbol}
      assetSymbol={assetSymbol}
    />
  )
}
