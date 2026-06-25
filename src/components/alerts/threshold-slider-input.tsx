"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

const THRESHOLD_MIN = -2
const THRESHOLD_MAX = 2
const THRESHOLD_STEP = 0.1

const FIELD_SURFACE_CLASS =
  "rounded-lg border border-white/15 bg-black/20 text-foreground outline-none transition-colors focus:border-white/30"

const SLIDER_TRACK_STYLE: React.CSSProperties = {
  position: "absolute",
  top: "50%",
  right: 0,
  left: 0,
  height: "0.5rem",
  transform: "translateY(-50%)",
  borderRadius: "9999px",
  background: "rgba(255, 255, 255, 0.14)",
}

const SLIDER_THUMB_STYLE: React.CSSProperties = {
  position: "absolute",
  top: "50%",
  width: "1rem",
  height: "1rem",
  transform: "translate(-50%, -50%)",
  borderRadius: "9999px",
  border: "1px solid rgba(255, 255, 255, 0.42)",
  background: "linear-gradient(180deg, #f0f0f0 0%, #b8b8b8 100%)",
  boxShadow:
    "inset 0 1px 0 rgba(255, 255, 255, 0.4), 0 0 12px rgba(255, 255, 255, 0.15)",
}

const RANGE_INPUT_STYLE: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 10,
  width: "100%",
  height: "1.25rem",
  opacity: 0,
  cursor: "pointer",
  appearance: "none",
  WebkitAppearance: "none",
  background: "transparent",
}

type ThresholdSliderInputProps = {
  value: string
  onChange: (value: string) => void
  className?: string
}

const clampThreshold = (value: number) =>
  Math.min(THRESHOLD_MAX, Math.max(THRESHOLD_MIN, value))

export const ThresholdSliderInput = ({
  value,
  onChange,
  className,
}: ThresholdSliderInputProps) => {
  const [isSliderFocused, setIsSliderFocused] = useState(false)
  const numericValue = Number(value)
  const safeValue = Number.isNaN(numericValue) ? 0 : clampThreshold(numericValue)
  const sliderPosition =
    ((safeValue - THRESHOLD_MIN) / (THRESHOLD_MAX - THRESHOLD_MIN)) * 100

  const handleNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value)
  }

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value)
  }

  return (
    <div className={cn(FIELD_SURFACE_CLASS, "rounded-xl px-4 py-3.5", className)}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Value
        </span>
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={handleNumberChange}
          className="h-8 w-20 rounded-lg border border-white/15 bg-black/25 px-3 text-right text-sm text-foreground outline-none transition-colors focus:border-white/30"
          required
          pattern="-?[0-9]*\.?[0-9]*"
          aria-label="Threshold value"
        />
      </div>

      <div className="mt-3.5">
        <div className="relative h-5">
          <div
            style={{
              ...SLIDER_TRACK_STYLE,
              boxShadow: isSliderFocused ? "0 0 0 3px rgba(255, 255, 255, 0.12)" : undefined,
            }}
            aria-hidden="true"
          />
          <div
            style={{
              ...SLIDER_THUMB_STYLE,
              left: `${sliderPosition}%`,
            }}
            aria-hidden="true"
          />
          <input
            type="range"
            min={THRESHOLD_MIN}
            max={THRESHOLD_MAX}
            step={THRESHOLD_STEP}
            value={safeValue}
            onChange={handleSliderChange}
            onFocus={() => setIsSliderFocused(true)}
            onBlur={() => setIsSliderFocused(false)}
            aria-label="Threshold slider"
            aria-valuemin={THRESHOLD_MIN}
            aria-valuemax={THRESHOLD_MAX}
            aria-valuenow={safeValue}
            style={RANGE_INPUT_STYLE}
          />
        </div>
        <div className="mt-2.5 flex justify-between text-xs text-muted-foreground tabular-nums">
          <span>-2</span>
          <span>0</span>
          <span>+2</span>
        </div>
      </div>
    </div>
  )
}
