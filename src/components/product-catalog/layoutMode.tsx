'use client'

import type { ReactNode } from "react"
import { createContext, useContext, useMemo, useState } from "react"

/**
 * Layout A: Default layout where the preview/map/code takes the main area
 * Layout B: Side preview layout where the preview is permanently on the right side,
 *           and map/code takes the left side
 */
export type LayoutMode = "A" | "B"

type LayoutModeContextValue = {
  layoutMode: LayoutMode
  setLayoutMode: (next: LayoutMode) => void
}

const LayoutModeContext = createContext<LayoutModeContextValue | null>(null)

export function LayoutModeProvider({ children }: { children: ReactNode }) {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("B")

  const value = useMemo(() => ({ layoutMode, setLayoutMode }), [layoutMode])

  return <LayoutModeContext.Provider value={value}>{children}</LayoutModeContext.Provider>
}

export function useLayoutMode(): LayoutModeContextValue {
  const ctx = useContext(LayoutModeContext)
  if (!ctx) return { layoutMode: "A", setLayoutMode: () => {} }
  return ctx
}
