'use client'

import type { ReactNode } from "react"
import { createContext, useContext, useMemo, useState } from "react"

/** "+" menu: contextual kinds vs all kinds in the workflow config. */
export type AddMenuMode = "contextual" | "general"

type AddMenuModeContextValue = {
  addMenuMode: AddMenuMode
  setAddMenuMode: (next: AddMenuMode) => void
}

const AddMenuModeContext = createContext<AddMenuModeContextValue | null>(null)

export function AddMenuModeProvider({ children }: { children: ReactNode }) {
  const [addMenuMode, setAddMenuMode] = useState<AddMenuMode>("contextual")

  const value = useMemo(() => ({ addMenuMode, setAddMenuMode }), [addMenuMode])

  return <AddMenuModeContext.Provider value={value}>{children}</AddMenuModeContext.Provider>
}

export function useAddMenuMode(): AddMenuModeContextValue {
  const ctx = useContext(AddMenuModeContext)
  if (!ctx) {
    return { addMenuMode: "contextual", setAddMenuMode: () => {} }
  }
  return ctx
}
