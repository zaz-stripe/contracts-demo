'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'

type CoachmarkPulseProps = {
  targetSelector: string
  onClick: () => void
  isSelected?: boolean
}

export function CoachmarkPulse({ targetSelector, onClick, isSelected = false }: CoachmarkPulseProps) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
  // Cache the target element reference to avoid repeated DOM queries
  const targetElRef = useRef<Element | null>(null)
  // Track RAF ID for throttling
  const rafIdRef = useRef<number | null>(null)

  // Query for the target element when the selector changes
  useEffect(() => {
    targetElRef.current = document.querySelector(targetSelector)
  }, [targetSelector])

  const calculatePosition = useCallback(() => {
    // Try to use cached element, but re-query if not found (handles async rendering)
    let targetEl = targetElRef.current
    if (!targetEl) {
      targetEl = document.querySelector(targetSelector)
      if (targetEl) {
        targetElRef.current = targetEl
      } else {
        return null
      }
    }

    const rect = targetEl.getBoundingClientRect()

    // Check if element is visible in the viewport
    // Elements in a transformed container may have valid rects but be off-screen
    const isInViewport = (
      rect.top >= -50 &&
      rect.left >= -50 &&
      rect.bottom <= window.innerHeight + 50 &&
      rect.right <= window.innerWidth + 50 &&
      rect.width > 0 &&
      rect.height > 0
    )

    if (!isInViewport) return null

    // Position the pulse at the top-right corner of the element
    return {
      top: rect.top - 4,
      left: rect.right - 4,
    }
  }, [targetSelector])

  useEffect(() => {
    // Throttled update using requestAnimationFrame
    const throttledUpdate = () => {
      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(() => {
          rafIdRef.current = null
          setPosition(calculatePosition())
        })
      }
    }

    // Initial position
    setPosition(calculatePosition())

    // Update on scroll/resize with throttling
    window.addEventListener('scroll', throttledUpdate, true)
    window.addEventListener('resize', throttledUpdate)

    // Use ResizeObserver to catch transform changes (pan/zoom)
    let resizeObserver: ResizeObserver | null = null
    if (targetElRef.current) {
      resizeObserver = new ResizeObserver(throttledUpdate)
      resizeObserver.observe(targetElRef.current)
      // Also observe parent container to catch transform changes
      const parent = targetElRef.current.closest('[style*="transform"]')
      if (parent) {
        resizeObserver.observe(parent)
      }
    }

    // Poll for position changes during active coachmark (catches pan/zoom via drag)
    const pollInterval = setInterval(throttledUpdate, 100)

    return () => {
      window.removeEventListener('scroll', throttledUpdate, true)
      window.removeEventListener('resize', throttledUpdate)
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
      }
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
      clearInterval(pollInterval)
    }
  }, [calculatePosition])

  if (!position) return null

  const canUseDOM = typeof document !== 'undefined'
  if (!canUseDOM) return null

  // Larger size when selected
  const outerSize = isSelected ? 'h-4 w-4' : 'h-3 w-3'
  const innerSize = isSelected ? 'h-3 w-3' : 'h-2 w-2'

  return createPortal(
    <button
      type="button"
      onClick={onClick}
      className={`fixed z-[10001] flex items-center justify-center ${outerSize}`}
      style={{ top: position.top, left: position.left }}
      aria-label="Show tour step"
    >
      {/* Pulsing outer ring */}
      <span
        className={`absolute rounded-full bg-[#533AFD] ${outerSize}`}
        style={{ animation: 'subtle-pulse 2s ease-in-out infinite' }}
      />
      {/* Solid inner circle */}
      <span className={`relative rounded-full bg-[#533AFD] ${innerSize}`} />
    </button>,
    document.body
  )
}
