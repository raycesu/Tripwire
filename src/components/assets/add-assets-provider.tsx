"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react"
import { createPortal } from "react-dom"
import { AssetSearchCombobox } from "@/components/assets/asset-search-combobox"

type AddAssetsContextValue = {
  openAddAssets: () => void
  closeAddAssets: () => void
}

const AddAssetsContext = createContext<AddAssetsContextValue | null>(null)

export const useAddAssets = () => {
  const context = useContext(AddAssetsContext)

  if (!context) {
    throw new Error("useAddAssets must be used within AddAssetsProvider")
  }

  return context
}

type AddAssetsProviderProps = {
  children: React.ReactNode
}

const emptySubscribe = () => () => {}

const useIsClient = () =>
  useSyncExternalStore(emptySubscribe, () => true, () => false)

export const AddAssetsProvider = ({ children }: AddAssetsProviderProps) => {
  const [open, setOpen] = useState(false)
  const [searchSession, setSearchSession] = useState(0)
  const mounted = useIsClient()

  const openAddAssets = useCallback(() => {
    setSearchSession((current) => current + 1)
    setOpen(true)
  }, [])

  const closeAddAssets = useCallback(() => {
    setOpen(false)
  }, [])

  useEffect(() => {
    if (!open) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [open])

  const modal =
    open && mounted
      ? createPortal(
          <>
            <div
              role="presentation"
              aria-hidden="true"
              tabIndex={-1}
              onClick={closeAddAssets}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  closeAddAssets()
                }
              }}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 9998,
                backgroundColor: "rgba(0, 0, 0, 0.72)",
              }}
            />

            <div
              role="dialog"
              aria-modal="true"
              aria-label="Search assets"
              onClick={(event) => event.stopPropagation()}
              style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                zIndex: 9999,
                width: "min(calc(100vw - 2rem), 26rem)",
                maxHeight: "min(640px, calc(100dvh - 2rem))",
                transform: "translate(-50%, -50%)",
                overflowY: "auto",
                borderRadius: "1rem",
                border: "1px solid rgba(255, 255, 255, 0.14)",
                backgroundColor: "rgb(23, 23, 23)",
                boxShadow: "0 16px 48px rgba(0, 0, 0, 0.55)",
                padding: "1.25rem",
              }}
            >
              <p
                style={{
                  margin: "0 0 1rem",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "rgba(255, 255, 255, 0.72)",
                }}
              >
                Search assets
              </p>
              <AssetSearchCombobox
                key={searchSession}
                layout="panel"
                placeholder="Search name or symbol"
                onAssetSelected={closeAddAssets}
              />
            </div>
          </>,
          document.body
        )
      : null

  return (
    <AddAssetsContext.Provider value={{ openAddAssets, closeAddAssets }}>
      {children}
      {modal}
    </AddAssetsContext.Provider>
  )
}
