'use client'

import type { ReactNode } from "react"
import { createContext, useContext, useMemo, useState } from "react"

type MapInteractivityContextValue = {
  mapInteractive: boolean
  setMapInteractive: (next: boolean) => void
}

const MapInteractivityContext = createContext<MapInteractivityContextValue | null>(null)

export function MapInteractivityProvider({ children }: { children: ReactNode }) {
  // Default to false (non-interactive map)
  const [mapInteractive, setMapInteractive] = useState(false)

  const value = useMemo(() => ({ mapInteractive, setMapInteractive }), [mapInteractive])

  return <MapInteractivityContext.Provider value={value}>{children}</MapInteractivityContext.Provider>
}

export function useMapInteractivity(): MapInteractivityContextValue {
  const ctx = useContext(MapInteractivityContext)
  if (!ctx) return { mapInteractive: false, setMapInteractive: () => {} }
  return ctx
}
