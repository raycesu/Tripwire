import type { ReactNode } from "react"

type AppShellHeaderBarProps = {
  children: ReactNode
  paddingLeftRem: number
  paddingRightRem: number
  heightClass: string
}

export const AppShellHeaderBar = ({
  children,
  paddingLeftRem,
  paddingRightRem,
  heightClass,
}: AppShellHeaderBarProps) => {
  return (
    <div
      className={`relative mx-auto flex w-full max-w-6xl items-center justify-between gap-4 overflow-visible ${heightClass}`}
      style={{
        paddingLeft: `${paddingLeftRem}rem`,
        paddingRight: `${paddingRightRem}rem`,
      }}
    >
      {children}
    </div>
  )
}
