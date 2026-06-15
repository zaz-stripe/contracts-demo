'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'

type OnboardingTourStep = 1 | 2 | 3

type OnboardingTourProps = {
  step: OnboardingTourStep | null
  onDismiss: () => void
}

type StepConfig = {
  id: string
  targetSelector: string
  position?: 'bottom' | 'right'
  /** Offset from top of target for 'right' position */
  topOffset?: number
  content: React.ReactNode
}

const STEPS: Record<OnboardingTourStep, StepConfig> = {
  1: {
    id: 'onboarding-plus-button',
    targetSelector: '[data-onboarding="plus-button"]',
    content: (
      <>
        <p className="text-[14px] font-[600] leading-[20px] text-[#1A2C44] whitespace-nowrap">Keep building your pricing plan</p>
        <p className="mt-[2px] text-[12px] leading-[16px] text-[#596171]">
          Add rates, subscription fees, or credit grants here anytime.
        </p>
      </>
    ),
  },
  2: {
    id: 'onboarding-add-popover',
    targetSelector: '[data-onboarding="add-popover"]',
    position: 'right',
    content: (
      <>
        <p className="text-[14px] font-[600] leading-[20px] text-[#1A2C44]">Pick a building block</p>
        <p className="mt-[2px] text-[12px] leading-[16px] text-[#596171]">
          Each one defines how you charge your customers.
        </p>
      </>
    ),
  },
  3: {
    id: 'onboarding-form-panel',
    targetSelector: '[data-onboarding="form-panel"]',
    position: 'right',
    topOffset: 57,
    content: (
      <>
        <p className="text-[14px] font-[600] leading-[20px] text-[#1A2C44]">Set it up</p>
        <p className="mt-[2px] text-[12px] leading-[16px] text-[#596171]">
          Configure the details. You can always edit later.
        </p>
      </>
    ),
  },
}

function OnboardingTooltip({
  step,
  onDismiss,
  dismissOnFormInteraction,
}: {
  step: StepConfig
  onDismiss: () => void
  dismissOnFormInteraction?: boolean
}) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    // Trigger enter animation after mount
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true))
    })
  }, [])
  const [position, setPosition] = useState<{ top: number; left: number; arrowLeft?: number; arrowTop?: number } | null>(null)
  const tooltipRef = useRef<HTMLDivElement | null>(null)
  const targetRef = useRef<Element | null>(null)

  const calculatePosition = useCallback(() => {
    const el = targetRef.current ?? document.querySelector(step.targetSelector)
    if (!el) return null
    targetRef.current = el

    const rect = el.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return null

    const pos = step.position ?? 'bottom'

    if (pos === 'right') {
      // Position to the right, top-aligned with the target (+ optional offset)
      const gap = 12
      const left = rect.right + gap
      const top = rect.top + (step.topOffset ?? 0)
      const arrowTop = 24
      return { top, left, arrowTop }
    }

    // Default: position below the target, chevron pointing up at center of target
    const gap = 13
    const top = rect.bottom + gap
    const arrowLeft = rect.left + rect.width / 2
    const tooltipLeft = arrowLeft - 24
    return { top, left: tooltipLeft, arrowLeft: 24 }
  }, [step.targetSelector, step.position])

  useEffect(() => {
    targetRef.current = null
    const tryPosition = (retries: number) => {
      const pos = calculatePosition()
      if (pos) {
        setPosition(pos)
      } else if (retries > 0) {
        setTimeout(() => tryPosition(retries - 1), 50)
      }
    }
    tryPosition(20)

    const update = () => {
      const pos = calculatePosition()
      if (pos) setPosition(pos)
    }
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    const poll = setInterval(update, 200)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
      clearInterval(poll)
    }
  }, [calculatePosition])

  // Close on Escape, text input, or any interaction with the form
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss()
    }
    if (dismissOnFormInteraction) {
      // Dismiss on value change or click inside the form panel.
      // Use setTimeout(0) so the browser fully processes the event
      // (keystroke goes into the input) before we trigger React state changes.
      const deferredDismiss = () => {
        // Delay dismiss to next frame so React fully processes the
        // current event and the input value update settles
        requestAnimationFrame(() => onDismiss())
      }
      const handleInput = (e: Event) => {
        const target = e.target as HTMLElement
        if (target.closest?.('[data-form-panel]')) {
          deferredDismiss()
        }
      }
      const handleMouseUp = (e: Event) => {
        const target = e.target as HTMLElement
        if (target.closest?.('[data-form-panel]') && !target.closest?.('[role="tooltip"]')) {
          deferredDismiss()
        }
      }
      // Delay attaching to avoid autofocus triggering dismiss
      const timer = setTimeout(() => {
        document.addEventListener('input', handleInput, true)
        document.addEventListener('change', handleInput, true)
        document.addEventListener('mouseup', handleMouseUp, true)
      }, 600)
      return () => {
        clearTimeout(timer)
        document.removeEventListener('input', handleInput, true)
        document.removeEventListener('change', handleInput, true)
        document.removeEventListener('mouseup', handleMouseUp, true)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onDismiss, dismissOnFormInteraction])


  if (!position) return null
  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      ref={tooltipRef}
      className="fixed z-[10000]"
      style={{
        top: position.top,
        left: position.left,
        opacity: visible ? 1 : 0,
        transform: visible ? 'scale(1)' : 'scale(0.95)',
        transition: 'opacity 200ms ease-out, transform 200ms ease-out',
      }}
      role="tooltip"
    >
      {/* Chevron arrow — border wraps around it */}
      {position.arrowLeft != null && (
        <div
          className="absolute -top-[7px]"
          style={{ left: position.arrowLeft - 7 }}
        >
          <svg width="14" height="8" viewBox="0 0 14 8" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0.5 8L7 1.5L13.5 8H0.5Z" fill="white" />
            <path d="M0.5 8L7 1.5L13.5 8" stroke="#EBEEF1" strokeWidth="1" fill="none" />
          </svg>
        </div>
      )}
      {position.arrowTop != null && (
        <div
          className="absolute -left-[7px]"
          style={{ top: position.arrowTop - 4 }}
        >
          <svg width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 0.5L1.5 7L8 13.5V0.5Z" fill="white" />
            <path d="M8 0.5L1.5 7L8 13.5" stroke="#EBEEF1" strokeWidth="1" fill="none" />
          </svg>
        </div>
      )}

      {/* Tooltip body */}
      <div className="flex items-start gap-[8px] rounded-[8px] border border-[#EBEEF1] bg-white px-[12px] py-[10px] w-[260px] shadow-[0_8px_24px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08)]">
        <div className="flex-1 min-w-0">
          {step.content}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-[4px] text-[#9CA3AF] hover:text-[#6C7688] hover:bg-[#F5F6F8] transition-colors mt-[1px]"
          aria-label="Dismiss"
        >
          <svg width="8" height="8" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M0.248959 0.248959C0.580905 -0.0829864 1.1191 -0.0829864 1.45104 0.248959L5 3.79792L8.54896 0.248959C8.88091 -0.0829864 9.4191 -0.0829864 9.75104 0.248959C10.083 0.580905 10.083 1.1191 9.75104 1.45104L6.20208 5L9.75104 8.54896C10.083 8.88091 10.083 9.4191 9.75104 9.75104C9.4191 10.083 8.88091 10.083 8.54896 9.75104L5 6.20208L1.45104 9.75104C1.1191 10.083 0.580905 10.083 0.248959 9.75104C-0.0829864 9.4191 -0.0829864 8.88091 0.248959 8.54896L3.79792 5L0.248959 1.45104C-0.0829864 1.1191 -0.0829864 0.580905 0.248959 0.248959Z" fill="currentColor"/>
          </svg>
        </button>
      </div>
    </div>,
    document.body
  )
}

export function OnboardingTour({ step, onDismiss }: OnboardingTourProps) {

  // Auto-dismiss step 3 after 30 seconds
  useEffect(() => {
    if (step !== 3) return
    const timer = setTimeout(onDismiss, 30000)
    return () => clearTimeout(timer)
  }, [step, onDismiss])

  if (!step) return null

  return (
    <OnboardingTooltip
      key={step}
      step={STEPS[step]}
      onDismiss={onDismiss}
      dismissOnFormInteraction={step === 3}
    />
  )
}
