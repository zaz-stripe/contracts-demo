'use client'

import type { ReactNode } from "react"
import { createContext, useContext, useMemo, useState } from "react"

type SidebarDarkModeContextValue = {
  sidebarDarkMode: boolean
  setSidebarDarkMode: (next: boolean) => void
}

const SidebarDarkModeContext = createContext<SidebarDarkModeContextValue | null>(null)

export function SidebarDarkModeProvider({ children }: { children: ReactNode }) {
  const [sidebarDarkMode, setSidebarDarkMode] = useState<boolean>(false)

  const value = useMemo(() => ({ sidebarDarkMode, setSidebarDarkMode }), [sidebarDarkMode])

  return <SidebarDarkModeContext.Provider value={value}>{children}</SidebarDarkModeContext.Provider>
}

export function useSidebarDarkMode(): SidebarDarkModeContextValue {
  const ctx = useContext(SidebarDarkModeContext)
  if (!ctx) return { sidebarDarkMode: false, setSidebarDarkMode: () => {} }
  return ctx
}
