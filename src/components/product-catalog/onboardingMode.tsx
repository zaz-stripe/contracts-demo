'use client'

import type { ReactNode } from "react"
import { createContext, useContext, useMemo, useState } from "react"

type OnboardingMode = "tips" | "form"

type OnboardingModeContextValue = {
  onboardingMode: OnboardingMode
  setOnboardingMode: (next: OnboardingMode) => void
}

const OnboardingModeContext = createContext<OnboardingModeContextValue | null>(null)

export function OnboardingModeProvider({ children }: { children: ReactNode }) {
  const [onboardingMode, setOnboardingMode] = useState<OnboardingMode>("form")

  const value = useMemo(() => ({ onboardingMode, setOnboardingMode }), [onboardingMode])

  return <OnboardingModeContext.Provider value={value}>{children}</OnboardingModeContext.Provider>
}

export function useOnboardingMode(): OnboardingModeContextValue {
  const ctx = useContext(OnboardingModeContext)
  if (!ctx) return { onboardingMode: "tips", setOnboardingMode: () => {} }
  return ctx
}
