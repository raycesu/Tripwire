"use client"

import { useMemo, useState } from "react"
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { ScoreHistoryPoint } from "@/lib/scores/types"
import { scoreToOklch } from "@/lib/scores/colors"
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

const CHART_HEIGHT_PX = 256

const formatChartDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })
}

type ChartDotProps = {
  cx?: number
  cy?: number
  payload?: { score: number; isStale: boolean }
}

const ScoreDot = ({ cx, cy, payload }: ChartDotProps) => {
  if (cx === undefined || cy === undefined || !payload) {
    return null
  }

  const fill = scoreToOklch(payload.score)
  const opacity = payload.isStale ? 0.35 : 1

  return (
    <circle
      cx={cx}
      cy={cy}
      r={3}
      fill={fill}
      stroke={fill}
      strokeWidth={1}
      opacity={opacity}
    />
  )
}

export const ScoreHistorySection = ({ historyBySector }: ScoreHistorySectionProps) => {
  const [sector, setSector] = useState<keyof HistoryBySector>("composite")

  const points = historyBySector[sector]

  const chartData = useMemo(
    () =>
      points.map((point) => ({
        date: formatChartDate(point.validForDate),
        score: point.score,
        isStale: point.isStale,
        interpretation: getScoreInterpretation(point.score),
      })),
    [points]
  )

  const hasStalePoints = chartData.some((point) => point.isStale)

  const hasEnoughData = chartData.length >= 2

  return (
    <section>
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

      {hasStalePoints ? (
        <p className="mb-3 text-xs text-muted-foreground">Dimmed points are stale snapshots.</p>
      ) : null}

      {!hasEnoughData ? (
        <p className="text-sm text-muted-foreground">
          Not enough history yet. After several scoring runs you will see a trend line here.
        </p>
      ) : (
        <div className="h-64 w-full min-w-0" role="img" aria-label={`${sector} score history chart`}>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT_PX} minWidth={0}>
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <YAxis domain={[-2, 2]} ticks={[-2, -1, 0, 1, 2]} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(28, 28, 30, 0.95)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "0.5rem",
                  color: "#d1d1d1",
                  backdropFilter: "blur(8px)",
                }}
                labelStyle={{ color: "#d1d1d1" }}
                itemStyle={{ color: "#d1d1d1" }}
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
                stroke="var(--score-silver-mid)"
                strokeWidth={2}
                dot={<ScoreDot />}
                activeDot={{ r: 5, stroke: "var(--silver)", strokeWidth: 1 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}
