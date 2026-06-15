"use client"

import { createContext, useContext, type ReactNode } from "react"

type PlanFormCloseContextValue = {
  onCloseForm: () => void
}

const PlanFormCloseContext = createContext<PlanFormCloseContextValue | null>(null)

type PlanFormCloseProviderProps = {
  onCloseForm: () => void
  children: ReactNode
}

export function PlanFormCloseProvider({ onCloseForm, children }: PlanFormCloseProviderProps) {
  return <PlanFormCloseContext.Provider value={{ onCloseForm }}>{children}</PlanFormCloseContext.Provider>
}

export function usePlanFormClose(): () => void {
  const ctx = useContext(PlanFormCloseContext)
  // Return a no-op if context is not available (for safety)
  return ctx?.onCloseForm ?? (() => {})
}
