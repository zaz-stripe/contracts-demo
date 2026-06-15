'use client'

import type { ReactNode } from "react"
import { createContext, useContext, useMemo, useState } from "react"

export type ComboboxStyle = "combobox" | "sel-link" | "sel-btn" | "sel-clear" | "sel-segmented" | "create-first"

type ComboboxStyleContextValue = {
  comboboxStyle: ComboboxStyle
  setComboboxStyle: (next: ComboboxStyle) => void
}

const ComboboxStyleContext = createContext<ComboboxStyleContextValue | null>(null)

export function ComboboxStyleProvider({ children }: { children: ReactNode }) {
  const [comboboxStyle, setComboboxStyle] = useState<ComboboxStyle>("sel-link")
  const value = useMemo(() => ({ comboboxStyle, setComboboxStyle }), [comboboxStyle])
  return <ComboboxStyleContext.Provider value={value}>{children}</ComboboxStyleContext.Provider>
}

export function useComboboxStyle(): ComboboxStyleContextValue {
  const ctx = useContext(ComboboxStyleContext)
  if (!ctx) return { comboboxStyle: "sel-link", setComboboxStyle: () => {} }
  return ctx
}
