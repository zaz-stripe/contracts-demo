'use client'

import type { ReactNode } from "react"
import { createContext, useContext, useMemo, useState } from "react"

type ShowFieldHelperContextValue = {
  showFieldHelper: boolean
  setShowFieldHelper: (next: boolean) => void
}

const ShowFieldHelperContext = createContext<ShowFieldHelperContextValue | null>(null)

export function ShowFieldHelperProvider({ children }: { children: ReactNode }) {
  // Default to true (on)
  const [showFieldHelper, setShowFieldHelper] = useState(true)

  const value = useMemo(() => ({ showFieldHelper, setShowFieldHelper }), [showFieldHelper])

  return <ShowFieldHelperContext.Provider value={value}>{children}</ShowFieldHelperContext.Provider>
}

export function useShowFieldHelper(): ShowFieldHelperContextValue {
  const ctx = useContext(ShowFieldHelperContext)
  if (!ctx) return { showFieldHelper: false, setShowFieldHelper: () => {} }
  return ctx
}
