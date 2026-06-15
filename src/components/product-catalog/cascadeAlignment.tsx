'use client'

import type { ReactNode } from "react"
import { createContext, useContext, useMemo, useState } from "react"

export type CascadeAlignment = "top" | "center"

type CascadeAlignmentContextValue = {
  cascadeAlignment: CascadeAlignment
  setCascadeAlignment: (next: CascadeAlignment) => void
}

const CascadeAlignmentContext = createContext<CascadeAlignmentContextValue | null>(null)

export function CascadeAlignmentProvider({ children }: { children: ReactNode }) {
  const [cascadeAlignment, setCascadeAlignment] = useState<CascadeAlignment>("top")

  const value = useMemo(() => ({ cascadeAlignment, setCascadeAlignment }), [cascadeAlignment])

  return <CascadeAlignmentContext.Provider value={value}>{children}</CascadeAlignmentContext.Provider>
}

export function useCascadeAlignment(): CascadeAlignmentContextValue {
  const ctx = useContext(CascadeAlignmentContext)
  if (!ctx) return { cascadeAlignment: "top", setCascadeAlignment: () => {} }
  return ctx
}
