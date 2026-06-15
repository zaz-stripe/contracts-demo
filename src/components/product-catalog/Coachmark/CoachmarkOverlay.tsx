'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { CloseTinyIcon } from '@/components/ProductCatalogIcons'
import type { CoachmarkStep } from './CoachmarkProvider'

type CoachmarkOverlayProps = {
  step: CoachmarkStep
  stepIndex: number
  totalSteps: number
  onClose: () => void
  onNext: () => void
  onPrev: () => void
  /** When true, hide step counter and prev/next (single tooltip with close only). */
  hideTourNavigation?: boolean
}

/**
 * Throttle a function to run at most once per animation frame.
 * More efficient than setTimeout-based throttling for visual updates.
 */
function useThrottledCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  deps: React.DependencyList
): T {
  const rafIdRef = useRef<number | null>(null)
  const lastArgsRef = useRef<Parameters<T> | null>(null)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const throttledFn = useCallback((...args: Parameters<T>) => {
    lastArgsRef.current = args

    if (rafIdRef.current === null) {
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null
        if (lastArgsRef.current) {
          callback(...lastArgsRef.current)
        }
      })
    }
  }, deps) as T

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [])

  return throttledFn
}

export function CoachmarkOverlay({
  step,
  stepIndex,
  totalSteps,
  onClose,
  onNext,
  onPrev,
  hideTourNavigation = false,
}: CoachmarkOverlayProps) {
  const [position, setPosition] = useState<{ top: number; left: number; arrowOffset: number } | null>(null)
  const popoverRef = useRef<HTMLDivElement | null>(null)
  // Cache the target element reference to avoid repeated DOM queries
  const targetElRef = useRef<Element | null>(null)

  // Track the displayed step for instant content swap
  const [displayedStep, setDisplayedStep] = useState(step)
  const [displayedStepIndex, setDisplayedStepIndex] = useState(stepIndex)
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Handle step changes - hide, reposition, then show with new content
  useEffect(() => {
    if (step.id !== displayedStep.id) {
      // Clear any pending queries
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current)
      }

      // Hide popover while we reposition
      setPosition(null)

      // Query the new target element with retry logic, then update content
      const findAndUpdate = (retriesLeft: number) => {
        targetElRef.current = document.querySelector(step.targetSelector)

        if (!targetElRef.current && retriesLeft > 0) {
          transitionTimeoutRef.current = setTimeout(() => findAndUpdate(retriesLeft - 1), 50)
        } else if (targetElRef.current) {
          // Element found - update content (position will recalculate automatically)
          setDisplayedStep(step)
          setDisplayedStepIndex(stepIndex)
        }
      }
      findAndUpdate(5)
    }

    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current)
      }
    }
  }, [step, stepIndex, displayedStep.id])

  // Query for the target element when the selector changes (initial mount)
  useEffect(() => {
    if (!targetElRef.current) {
      targetElRef.current = document.querySelector(displayedStep.targetSelector)
    }
  }, [displayedStep.targetSelector])

  const calculatePosition = useCallback(() => {
    // Use cached element reference instead of querying DOM every time
    const targetEl = targetElRef.current
    if (!targetEl) {
      return null
    }

    const rect = targetEl.getBoundingClientRect()

    // Only check that element has valid dimensions (width/height > 0)
    // Skip strict viewport bounds check because:
    // 1. Elements in transformed containers (pan/zoom) report coordinates outside viewport
    // 2. The coachmark is designed to point to visible on-screen elements
    // 3. The position clamping below will keep the popover visible anyway
    if (rect.width <= 0 || rect.height <= 0) {
      return null
    }

    const popoverWidth = 280
    const popoverHeight = 160
    const gap = 6

    let top = 0
    let left = 0

    // Helper to calculate vertical position based on alignment
    const getVerticalPosition = () => {
      const align = displayedStep.align ?? 'center'
      switch (align) {
        case 'top':
          return rect.top
        case 'bottom':
          return rect.bottom - popoverHeight
        case 'center':
        default:
          return rect.top + rect.height / 2 - popoverHeight / 2
      }
    }

    // Calculate target point for arrow positioning
    // For top/bottom positions, always use center X
    // For left/right positions, use the alignment point for Y
    const targetCenterX = rect.left + rect.width / 2
    const align = displayedStep.align ?? 'center'
    let targetPointY: number
    switch (align) {
      case 'top':
        targetPointY = rect.top
        break
      case 'bottom':
        targetPointY = rect.bottom
        break
      case 'center':
      default:
        targetPointY = rect.top + rect.height / 2
    }

    switch (displayedStep.position) {
      case 'top':
        top = rect.top - popoverHeight - gap
        left = rect.left + rect.width / 2 - popoverWidth / 2
        break
      case 'bottom':
        top = rect.bottom + gap
        left = rect.left + rect.width / 2 - popoverWidth / 2
        break
      case 'left':
        top = getVerticalPosition()
        left = rect.left - popoverWidth - gap
        break
      case 'right':
        top = getVerticalPosition()
        left = rect.right + gap
        break
    }

    // Apply optional offsets before clamping
    if (displayedStep.offsetLeft) left += displayedStep.offsetLeft
    if (displayedStep.offsetTop) top += displayedStep.offsetTop

    // Clamp to viewport
    const padding = 16
    top = Math.max(padding, Math.min(top, window.innerHeight - popoverHeight - padding))
    left = Math.max(padding, Math.min(left, window.innerWidth - popoverWidth - padding))

    // Calculate arrow offset based on how much we shifted
    // For top/bottom positions, we need horizontal arrow offset
    // For left/right positions, we need vertical arrow offset
    let arrowOffset = 0
    if (displayedStep.position === 'top' || displayedStep.position === 'bottom') {
      // Arrow should point to target center X
      // Default arrow is at 50% (center of popover)
      // Calculate offset from center in pixels
      const popoverCenterX = left + popoverWidth / 2
      arrowOffset = targetCenterX - popoverCenterX
    } else {
      // Arrow should point to the target's alignment point (top/center/bottom)
      // Calculate the Y position relative to popover top
      // The arrow's base position varies by align, so we calculate offset from that base
      const popoverTop = top
      // Target arrow Y position relative to popover
      const arrowTargetRelativeY = targetPointY - popoverTop
      // Base arrow position based on align
      let baseArrowY: number
      switch (align) {
        case 'top':
          baseArrowY = 20
          break
        case 'bottom':
          baseArrowY = popoverHeight - 36
          break
        case 'center':
        default:
          baseArrowY = popoverHeight / 2
      }
      arrowOffset = arrowTargetRelativeY - baseArrowY
    }

    return { top, left, arrowOffset }
  }, [displayedStep.position, displayedStep.align, displayedStep.offsetLeft, displayedStep.offsetTop])

  // Throttled position update to prevent layout thrashing during scroll/resize
  // Only update if new position is valid (not null) to prevent overlay from disappearing
  const throttledUpdatePosition = useThrottledCallback(() => {
    const newPos = calculatePosition()
    if (newPos) {
      setPosition(newPos)
    }
  }, [calculatePosition])

  useEffect(() => {
    // Initial position calculation with retry logic
    const tryCalculatePosition = (retriesLeft: number) => {
      // First, try to query the element if we don't have it
      if (!targetElRef.current) {
        targetElRef.current = document.querySelector(displayedStep.targetSelector)
      }

      const newPos = calculatePosition()
      if (newPos) {
        setPosition(newPos)
      } else if (retriesLeft > 0) {
        // Retry after a short delay
        setTimeout(() => tryCalculatePosition(retriesLeft - 1), 100)
      }
    }
    tryCalculatePosition(10) // Try up to 10 times (1 second total)

    // Update position on scroll/resize with throttling
    window.addEventListener('scroll', throttledUpdatePosition, true)
    window.addEventListener('resize', throttledUpdatePosition)

    // Use ResizeObserver to catch transform changes (pan/zoom)
    let resizeObserver: ResizeObserver | null = null
    if (targetElRef.current) {
      resizeObserver = new ResizeObserver(throttledUpdatePosition)
      resizeObserver.observe(targetElRef.current)
      // Also observe parent container to catch transform changes
      const parent = targetElRef.current.closest('[style*="transform"]')
      if (parent) {
        resizeObserver.observe(parent)
      }
    }

    // Poll for position changes during active coachmark (catches pan/zoom via drag)
    const pollInterval = setInterval(throttledUpdatePosition, 100)

    return () => {
      window.removeEventListener('scroll', throttledUpdatePosition, true)
      window.removeEventListener('resize', throttledUpdatePosition)
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
      clearInterval(pollInterval)
    }
  }, [calculatePosition, throttledUpdatePosition])

  // Close on Escape; prev/next only when in tour mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (!hideTourNavigation) {
        if (e.key === 'ArrowRight' || e.key === 'Enter') {
          onNext()
        } else if (e.key === 'ArrowLeft') {
          onPrev()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose, onNext, onPrev, hideTourNavigation])

  if (!position) {
    return null
  }

  const canUseDOM = typeof document !== 'undefined'
  if (!canUseDOM) return null

  // Get arrow styles based on popover position and alignment
  const getArrowStyles = () => {
    const baseStyles = "absolute h-0 w-0 border-[8px] border-transparent"
    const borderBaseStyles = "absolute h-0 w-0 border-[9px] border-transparent"
    const align = displayedStep.align ?? 'center'
    const arrowOffset = position?.arrowOffset ?? 0

    // Calculate vertical position for left/right arrows based on align and offset
    const getVerticalArrowPosition = () => {
      switch (align) {
        case 'top':
          return `calc(20px + ${arrowOffset}px)`
        case 'bottom':
          return `calc(100% - 36px + ${arrowOffset}px)`
        case 'center':
        default:
          return `calc(50% + ${arrowOffset}px)`
      }
    }

    // Calculate horizontal position for top/bottom arrows with offset
    const getHorizontalArrowPosition = () => {
      return `calc(50% + ${arrowOffset}px)`
    }

    switch (displayedStep.position) {
      case 'bottom':
        return {
          arrow: { className: `${baseStyles} border-b-white`, style: { top: -16, left: getHorizontalArrowPosition(), transform: 'translateX(-50%)' } as const },
          border: { className: `${borderBaseStyles} border-b-[#D8DEE4]`, style: { top: -18, left: getHorizontalArrowPosition(), transform: 'translateX(-50%)' } as const },
        }
      case 'top':
        return {
          arrow: { className: `${baseStyles} border-t-white`, style: { bottom: -16, left: getHorizontalArrowPosition(), transform: 'translateX(-50%)' } as const },
          border: { className: `${borderBaseStyles} border-t-[#D8DEE4]`, style: { bottom: -18, left: getHorizontalArrowPosition(), transform: 'translateX(-50%)' } as const },
        }
      case 'left':
        return {
          arrow: { className: `${baseStyles} border-l-white`, style: { top: getVerticalArrowPosition(), right: -16, transform: align === 'center' ? 'translateY(-50%)' : 'none' } as const },
          border: { className: `${borderBaseStyles} border-l-[#D8DEE4]`, style: { top: getVerticalArrowPosition(), right: -18, transform: align === 'center' ? 'translateY(-50%)' : 'none' } as const },
        }
      case 'right':
        return {
          arrow: { className: `${baseStyles} border-r-white`, style: { top: getVerticalArrowPosition(), left: -16, transform: align === 'center' ? 'translateY(-50%)' : 'none' } as const },
          border: { className: `${borderBaseStyles} border-r-[#D8DEE4]`, style: { top: getVerticalArrowPosition(), left: -18, transform: align === 'center' ? 'translateY(-50%)' : 'none' } as const },
        }
      default:
        return null
    }
  }

  const arrowStyles = getArrowStyles()

  return createPortal(
    <div
      ref={popoverRef}
      className="fixed z-[10000] w-[280px] overflow-visible rounded-lg border border-[#D8DEE4] bg-white shadow-[0_12px_32px_rgba(28,32,40,0.16)]"
      style={{ top: position.top, left: position.left }}
      role="dialog"
      aria-labelledby="coachmark-title"
      aria-describedby="coachmark-description"
    >
      {/* Arrow pointing to target (border + fill) */}
      {arrowStyles && (
        <>
          <span className={arrowStyles.border.className} style={arrowStyles.border.style} />
          <span className={arrowStyles.arrow.className} style={arrowStyles.arrow.style} />
        </>
      )}
      {/* Header with close button */}
      <div className="flex items-start justify-between gap-2 px-4 pt-4">
        <h3 id="coachmark-title" className="text-[14px] font-semibold text-[#1C2028]">
          {displayedStep.title}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded hover:bg-[#F5F6F8] transition-colors"
          aria-label="Close tour"
        >
          <CloseTinyIcon className="text-[#6C7688]" />
        </button>
      </div>

      {/* Description */}
      <p id="coachmark-description" className={`text-[13px] leading-[1.5] text-[#596171] ${hideTourNavigation ? 'px-4 pb-4 pt-2' : 'px-4 pt-2'}`}>
        {displayedStep.description}
      </p>

      {/* Footer with navigation (hidden in single-step / dynamic coachmark mode) */}
      {!hideTourNavigation && (
        <div className="flex items-center justify-between px-4 pb-4 pt-4">
          {/* Step indicator */}
          <span className="text-[12px] text-[#818DA0]">
            {displayedStepIndex + 1} of {totalSteps}
          </span>

          {/* Navigation buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onPrev}
              disabled={stepIndex === 0}
              className="flex h-7 items-center rounded-md border border-[#D8DEE4] px-2 text-[12px] font-medium text-[#353A44] transition-colors hover:bg-[#F5F6F8] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={onNext}
              className="flex h-7 items-center rounded-md bg-[#533AFD] px-3 text-[12px] font-medium text-white transition-colors hover:bg-[#4430D9]"
            >
              {stepIndex === totalSteps - 1 ? 'Done' : 'Next'}
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body
  )
}
