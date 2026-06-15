'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { FIELD_DESCRIPTIONS } from '@/components/product-catalog/FieldDescription/FieldDescriptionContext'

function InfoIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="11.5"
      height="11.5"
      viewBox="0 0 12 12"
      fill="none"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.5 1.5H3C2.17157 1.5 1.5 2.17157 1.5 3V8.5C1.5 9.32843 2.17157 10 3 10H8.5C9.32843 10 10 9.32843 10 8.5V3C10 2.17157 9.32843 1.5 8.5 1.5ZM3 0C1.34315 0 0 1.34315 0 3V8.5C0 10.1569 1.34315 11.5 3 11.5H8.5C10.1569 11.5 11.5 10.1569 11.5 8.5V3C11.5 1.34315 10.1569 0 8.5 0H3Z"
        fill="#474E5A"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.23182 6.24998C4.23182 5.86338 4.54522 5.54998 4.93182 5.54998H6.02273C6.40933 5.54998 6.72273 5.86338 6.72273 6.24998V8.24998C6.72273 8.63658 6.40933 8.94998 6.02273 8.94998C5.63613 8.94998 5.32273 8.63658 5.32273 8.24998V6.94998H4.93182C4.54522 6.94998 4.23182 6.63658 4.23182 6.24998Z"
        fill="#474E5A"
      />
      <path
        d="M4.74994 3.74999C4.74994 3.19858 5.19854 2.74999 5.74994 2.74999C6.30134 2.74999 6.74994 3.19858 6.74994 3.74999C6.74994 4.30139 6.30134 4.74999 5.74994 4.74999C5.19854 4.74999 4.74994 4.30139 4.74994 3.74999Z"
        fill="#474E5A"
      />
    </svg>
  )
}

type FieldInfoTooltipProps = {
  fieldId: string
}

export function FieldInfoTooltip({ fieldId }: FieldInfoTooltipProps) {
  const field = FIELD_DESCRIPTIONS[fieldId]
  const [show, setShow] = useState(false)
  const [position, setPosition] = useState<{
    top: number
    left: number
    arrowLeft: number
  } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const iconCenterX = rect.left + rect.width / 2
    const tooltipWidth = 240
    const padding = 12

    // Try to center tooltip below the icon
    let tooltipLeft = iconCenterX - tooltipWidth / 2

    // Clamp to viewport
    if (tooltipLeft < padding) {
      tooltipLeft = padding
    } else if (tooltipLeft + tooltipWidth > window.innerWidth - padding) {
      tooltipLeft = window.innerWidth - padding - tooltipWidth
    }

    const arrowLeft = iconCenterX - tooltipLeft

    setPosition({
      top: rect.bottom + 6,
      left: tooltipLeft,
      arrowLeft: Math.max(12, Math.min(arrowLeft, tooltipWidth - 12)),
    })
  }, [])

  const handleMouseEnter = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
    updatePosition()
    setShow(true)
  }, [updatePosition])

  const handleMouseLeave = useCallback(() => {
    hideTimeoutRef.current = setTimeout(() => {
      setShow(false)
    }, 100)
  }, [])

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
      }
    }
  }, [])

  if (!field) return null

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="inline-flex items-center justify-center"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-label={`Info: ${field.title}`}
      >
        <InfoIcon />
      </button>
      {show &&
        position &&
        createPortal(
          <div
            className="fixed z-[9999]"
            style={{ top: position.top, left: position.left }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {/* Arrow pointing up */}
            <div
              className="absolute bottom-full border-[5px] border-transparent border-b-white"
              style={{
                left: position.arrowLeft,
                transform: 'translateX(-50%)',
                filter: 'drop-shadow(0 -1px 1px rgba(0,0,0,0.06))',
              }}
            />
            <div
              className="rounded-[6px] border border-[#E2E6EB] bg-white px-[12px] py-[8px] text-[12px] font-[500] leading-[18px] tracking-[-0.024px] text-[#6C7688] shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
              style={{ width: 240 }}
            >
              <span className="font-[600] text-[#353A44]">{field.title}</span>
              <span className="text-[#9CA3AF]"> — </span>
              <span>{field.description}</span>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
