"use client"

import { useEffect } from "react"

const landingActiveClass = "landing-active"

export const LandingBodyLock = () => {
  useEffect(() => {
    const html = document.documentElement
    html.classList.add(landingActiveClass)

    return () => {
      html.classList.remove(landingActiveClass)
    }
  }, [])

  return null
}
