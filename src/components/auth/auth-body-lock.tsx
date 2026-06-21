"use client"

import { useEffect } from "react"

const authActiveClass = "auth-active"

export const AuthBodyLock = () => {
  useEffect(() => {
    const html = document.documentElement
    html.classList.add(authActiveClass)
    window.scrollTo(0, 0)

    return () => {
      html.classList.remove(authActiveClass)
    }
  }, [])

  return null
}
