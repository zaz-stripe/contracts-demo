'use client'

import type { ReactNode } from "react"
import { createContext, useContext, useMemo, useState } from "react"

export type FormPanelSide = "hidden" | "float-left" | "fixed-left" | "fixed-right" | "float-right"

type FormPanelSideContextValue = {
  side: FormPanelSide
  setSide: (next: FormPanelSide) => void
}

const FormPanelSideContext = createContext<FormPanelSideContextValue | null>(null)

export function FormPanelSideProvider({ children }: { children: ReactNode }) {
  // Default to fixed-left; can be changed via the Options panel.
  const [side, setSide] = useState<FormPanelSide>("fixed-left")

  const value = useMemo(() => ({ side, setSide }), [side])

  return <FormPanelSideContext.Provider value={value}>{children}</FormPanelSideContext.Provider>
}

export function useFormPanelSide(): FormPanelSideContextValue {
  const ctx = useContext(FormPanelSideContext)
  if (!ctx) return { side: "hidden", setSide: () => {} }
  return ctx
}

