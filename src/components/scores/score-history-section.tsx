"use client"

import { useMemo, useState } from "react"
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { ScoreHistoryPoint } from "@/lib/scores/types"
import { formatScore, getScoreInterpretation } from "@/lib/scores/labels"
type HistoryBySector = {
  composite: ScoreHistoryPoint[]
  macro: ScoreHistoryPoint[]
  relativity: ScoreHistoryPoint[]
  volume: ScoreHistoryPoint[]
}

type ScoreHistorySectionProps = {
  historyBySector: HistoryBySector
}

const SECTOR_OPTIONS: { value: keyof HistoryBySector; label: string }[] = [
  { value: "composite", label: "Composite" },
  { value: "macro", label: "Macro" },
  { value: "relativity", label: "Relativity" },
  { value: "volume", label: "Volume" },
]

const formatChartDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })
}

export const ScoreHistorySection = ({ historyBySector }: ScoreHistorySectionProps) => {
  const [sector, setSector] = useState<keyof HistoryBySector>("composite")

  const points = historyBySector[sector]

  const chartData = useMemo(
    () =>
      points.map((point) => ({
        date: formatChartDate(point.validForDate),
        score: point.score,
        interpretation: getScoreInterpretation(point.score),
      })),
    [points]
  )

  const hasEnoughData = chartData.length >= 2

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Score history
        </h2>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Sector</span>
          <select
            value={sector}
            onChange={(event) => setSector(event.target.value as keyof HistoryBySector)}
            className="rounded-md border border-border bg-muted/40 px-2 py-1 text-foreground"
            aria-label="Select sector for score history"
          >
            {SECTOR_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!hasEnoughData ? (
        <p className="text-sm text-muted-foreground">
          Not enough history yet. After several scoring runs you will see a trend line here.
        </p>
      ) : (
        <div className="h-64 w-full" role="img" aria-label={`${sector} score history chart`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <YAxis domain={[-2, 2]} ticks={[-2, -1, 0, 1, 2]} tick={{ fontSize: 11 }} />
              <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="4 4" />
              <ReferenceLine y={1} stroke="var(--chart-1)" strokeOpacity={0.35} />
              <ReferenceLine y={-1} stroke="var(--destructive)" strokeOpacity={0.35} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "0.5rem",
                }}
                formatter={(value) => {
                  const numeric = typeof value === "number" ? value : Number(value)

                  if (Number.isNaN(numeric)) {
                    return ["—", "Score"]
                  }

                  return [
                    `${formatScore(String(numeric))} · ${getScoreInterpretation(numeric)}`,
                    "Score",
                  ]
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="var(--chart-1)"
                strokeWidth={2}
                dot={{ r: 2, fill: "var(--chart-1)" }}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}
