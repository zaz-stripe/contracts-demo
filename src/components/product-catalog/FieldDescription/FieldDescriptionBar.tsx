'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useFieldDescription, FIELD_DESCRIPTIONS } from './FieldDescriptionContext'

/**
 * Maps data-coachmark values to field IDs in our FIELD_DESCRIPTIONS
 */
const COACHMARK_TO_FIELD_MAP: Record<string, string> = {
  'pricing-plan': 'pricing-plan',
  'rate-card': 'rate-card',
  'rate': 'rate',
  'meter': 'meter',
  'credit-grant': 'credit-grant',
  'subscription-fee': 'subscription-fee',
  'sidebar': 'sidebar-menu',
  'map-tab': 'map-tab',
  'preview-tab': 'preview-tab',
  'code-tab': 'code-tab',
  'preview-panel': 'preview-panel',
}

export function FieldDescriptionBar() {
  const { activeField, setActiveField } = useFieldDescription()
  const lastHoveredElement = useRef<Element | null>(null)

  // Event delegation for data-coachmark and data-field-description attributes
  const handleMouseOver = useCallback((e: MouseEvent) => {
    const target = e.target as Element

    // Find the closest element with data-field-description or data-coachmark
    const fieldElement = target.closest('[data-field-description]')
    const coachmarkElement = target.closest('[data-coachmark]')

    const relevantElement = fieldElement || coachmarkElement

    if (relevantElement === lastHoveredElement.current) {
      return // Already tracking this element
    }

    lastHoveredElement.current = relevantElement

    if (fieldElement) {
      const fieldId = fieldElement.getAttribute('data-field-description')
      if (fieldId && FIELD_DESCRIPTIONS[fieldId]) {
        setActiveField(FIELD_DESCRIPTIONS[fieldId])
        return
      }
    }

    if (coachmarkElement) {
      const coachmarkValue = coachmarkElement.getAttribute('data-coachmark')
      if (coachmarkValue) {
        const fieldId = COACHMARK_TO_FIELD_MAP[coachmarkValue]
        if (fieldId && FIELD_DESCRIPTIONS[fieldId]) {
          setActiveField(FIELD_DESCRIPTIONS[fieldId])
          return
        }
      }
    }

    // Clear active field when not hovering over a recognized field/coachmark
    setActiveField(null)
  }, [setActiveField])

  useEffect(() => {
    document.addEventListener('mouseover', handleMouseOver, true)
    return () => {
      document.removeEventListener('mouseover', handleMouseOver, true)
    }
  }, [handleMouseOver])

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[1200] flex h-[28px] items-center border-t border-[#EBEEF1] bg-[#FAFBFC] px-4"
      style={{
        fontFamily: '"SF Pro Text", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {activeField ? (
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="shrink-0 text-[11px] font-[600] text-[#353A44]">
            {activeField.title}
          </span>
          <span className="text-[11px] text-[#6C7688]">—</span>
          <span className="truncate text-[11px] text-[#6C7688]">
            {activeField.description}
          </span>
        </div>
      ) : (
        <span className="text-[11px] text-[#9CA3AF]">
          Hover over a field for more information
        </span>
      )}
    </div>
  )
}
