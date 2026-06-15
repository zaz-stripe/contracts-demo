'use client'

import type { ReactNode } from "react"
import { createContext, useContext, useMemo, useState } from "react"

export type LayoutDirection = "horizontal" | "vertical"

type LayoutDirectionContextValue = {
  direction: LayoutDirection
  setDirection: (next: LayoutDirection) => void
}

const LayoutDirectionContext = createContext<LayoutDirectionContextValue | null>(null)

export function LayoutDirectionProvider({ children }: { children: ReactNode }) {
  const [direction, setDirection] = useState<LayoutDirection>("horizontal")

  const value = useMemo(() => ({ direction, setDirection }), [direction])

  return <LayoutDirectionContext.Provider value={value}>{children}</LayoutDirectionContext.Provider>
}

export function useLayoutDirection(): LayoutDirectionContextValue {
  const ctx = useContext(LayoutDirectionContext)
  if (!ctx) return { direction: "horizontal", setDirection: () => {} }
  return ctx
}
