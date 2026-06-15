'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

export type CoachmarkStep = {
  id: string
  title: string
  description: string
  targetSelector: string
  position: 'top' | 'bottom' | 'left' | 'right'
  /** Vertical alignment for left/right positions (default: 'center') */
  align?: 'top' | 'center' | 'bottom'
  /** Optional horizontal offset (positive = right, negative = left) */
  offsetLeft?: number
  /** Optional vertical offset (positive = down, negative = up) */
  offsetTop?: number
  onNavigate?: () => void
}

type CoachmarkContextType = {
  isActive: boolean
  currentStepIndex: number
  steps: CoachmarkStep[]
  currentStep: CoachmarkStep | null
  startTour: (steps: CoachmarkStep[]) => void
  endTour: () => void
  nextStep: () => void
  prevStep: () => void
  goToStep: (index: number) => void
}

const CoachmarkContext = createContext<CoachmarkContextType | null>(null)

export function CoachmarkProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [steps, setSteps] = useState<CoachmarkStep[]>([])

  const currentStep = isActive && steps.length > 0 ? steps[currentStepIndex] ?? null : null

  const startTour = useCallback((tourSteps: CoachmarkStep[]) => {
    setSteps(tourSteps)
    setCurrentStepIndex(0)
    setIsActive(true)
    // Navigate to the first step
    if (tourSteps.length > 0 && tourSteps[0].onNavigate) {
      tourSteps[0].onNavigate()
    }
  }, [])

  const endTour = useCallback(() => {
    setIsActive(false)
    setCurrentStepIndex(0)
    setSteps([])
  }, [])

  const nextStep = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      const newIndex = currentStepIndex + 1
      setCurrentStepIndex(newIndex)
      if (steps[newIndex]?.onNavigate) {
        steps[newIndex].onNavigate()
      }
    } else {
      // End tour when reaching the end
      endTour()
    }
  }, [currentStepIndex, steps, endTour])

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      const newIndex = currentStepIndex - 1
      setCurrentStepIndex(newIndex)
      if (steps[newIndex]?.onNavigate) {
        steps[newIndex].onNavigate()
      }
    }
  }, [currentStepIndex, steps])

  const goToStep = useCallback((index: number) => {
    if (index >= 0 && index < steps.length) {
      setCurrentStepIndex(index)
      if (steps[index]?.onNavigate) {
        steps[index].onNavigate()
      }
    }
  }, [steps])

  return (
    <CoachmarkContext.Provider
      value={{
        isActive,
        currentStepIndex,
        steps,
        currentStep,
        startTour,
        endTour,
        nextStep,
        prevStep,
        goToStep,
      }}
    >
      {children}
    </CoachmarkContext.Provider>
  )
}

export function useCoachmark() {
  const context = useContext(CoachmarkContext)
  if (!context) {
    throw new Error('useCoachmark must be used within a CoachmarkProvider')
  }
  return context
}
