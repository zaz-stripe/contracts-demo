'use client'

import type { ReactNode } from "react"
import { createContext, useContext, useMemo, useState } from "react"

type ShowAdditionalNodesContextValue = {
  showAdditionalNodes: boolean
  setShowAdditionalNodes: (next: boolean) => void
}

const ShowAdditionalNodesContext = createContext<ShowAdditionalNodesContextValue | null>(null)

export function ShowAdditionalNodesProvider({ children }: { children: ReactNode }) {
  const [showAdditionalNodes, setShowAdditionalNodes] = useState<boolean>(false)

  const value = useMemo(() => ({ showAdditionalNodes, setShowAdditionalNodes }), [showAdditionalNodes])

  return <ShowAdditionalNodesContext.Provider value={value}>{children}</ShowAdditionalNodesContext.Provider>
}

export function useShowAdditionalNodes(): ShowAdditionalNodesContextValue {
  const ctx = useContext(ShowAdditionalNodesContext)
  if (!ctx) return { showAdditionalNodes: false, setShowAdditionalNodes: () => {} }
  return ctx
}
