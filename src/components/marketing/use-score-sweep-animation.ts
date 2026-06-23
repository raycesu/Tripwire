"use client"

import { useEffect, useState } from "react"

const SCORE_MIN = -2
const SWEEP_DURATION_MS = 1200
const TEXT_FADE_DURATION_MS = 450

type UseScoreSweepAnimationOptions = {
  targetScore: number
  startScore?: number
}

type UseScoreSweepAnimationResult = {
  animatedScore: number
  centerTextOpacity: number
  isSettled: boolean
}

const usePrefersReducedMotion = (): boolean => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches)

    handleChange()
    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  return prefersReducedMotion
}

export const useScoreSweepAnimation = ({
  targetScore,
  startScore = SCORE_MIN,
}: UseScoreSweepAnimationOptions): UseScoreSweepAnimationResult => {
  const prefersReducedMotion = usePrefersReducedMotion()
  const [animatedScore, setAnimatedScore] = useState(targetScore)
  const [centerTextOpacity, setCenterTextOpacity] = useState(1)
  const [isSettled, setIsSettled] = useState(true)

  useEffect(() => {
    if (prefersReducedMotion) {
      setAnimatedScore(targetScore)
      setCenterTextOpacity(1)
      setIsSettled(true)
      return
    }

    let rafId = 0
    let cancelled = false
    const animationStart = performance.now()

    setAnimatedScore(startScore)
    setCenterTextOpacity(0)
    setIsSettled(false)

    const tick = (now: number) => {
      if (cancelled) {
        return
      }

      const elapsed = now - animationStart

      if (elapsed < SWEEP_DURATION_MS) {
        const progress = elapsed / SWEEP_DURATION_MS
        setAnimatedScore(startScore + (targetScore - startScore) * progress)
        setCenterTextOpacity(0)
        rafId = requestAnimationFrame(tick)
        return
      }

      setAnimatedScore(targetScore)

      const textFadeElapsed = elapsed - SWEEP_DURATION_MS

      if (textFadeElapsed < TEXT_FADE_DURATION_MS) {
        setCenterTextOpacity(textFadeElapsed / TEXT_FADE_DURATION_MS)
        rafId = requestAnimationFrame(tick)
        return
      }

      setCenterTextOpacity(1)
      setIsSettled(true)
    }

    rafId = requestAnimationFrame(tick)

    return () => {
      cancelled = true
      cancelAnimationFrame(rafId)
    }
  }, [targetScore, startScore, prefersReducedMotion])

  return { animatedScore, centerTextOpacity, isSettled }
}
