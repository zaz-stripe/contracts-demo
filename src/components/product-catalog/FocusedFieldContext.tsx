'use client'

import { createContext, useContext, useMemo, useState, type ReactNode } from "react"

type FocusedFieldContextValue = {
  focusedField: string | null
  setFocusedField: (field: string | null) => void
}

const FocusedFieldContext = createContext<FocusedFieldContextValue>({
  focusedField: null,
  setFocusedField: () => {},
})

export function FocusedFieldProvider({ children }: { children: ReactNode }) {
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const value = useMemo(() => ({ focusedField, setFocusedField }), [focusedField])
  return <FocusedFieldContext.Provider value={value}>{children}</FocusedFieldContext.Provider>
}

export function useFocusedField() {
  return useContext(FocusedFieldContext)
}
