'use client'

import type { ReactNode } from "react"
import { createContext, useContext, useMemo, useState } from "react"

type ShowAddPlanContextValue = {
  showAddPlan: boolean
  setShowAddPlan: (next: boolean) => void
}

const ShowAddPlanContext = createContext<ShowAddPlanContextValue | null>(null)

export function ShowAddPlanProvider({ children }: { children: ReactNode }) {
  const [showAddPlan, setShowAddPlan] = useState<boolean>(false)

  const value = useMemo(() => ({ showAddPlan, setShowAddPlan }), [showAddPlan])

  return <ShowAddPlanContext.Provider value={value}>{children}</ShowAddPlanContext.Provider>
}

export function useShowAddPlan(): ShowAddPlanContextValue {
  const ctx = useContext(ShowAddPlanContext)
  if (!ctx) return { showAddPlan: false, setShowAddPlan: () => {} }
  return ctx
}
