'use client'

import React, { useRef, useState } from "react"

// Account logo with black background and white icon
// Use darkMode=true when placing on dark backgrounds (shows white icon without circular container)
export function AccountLogo({ size = 24, darkMode = false }: { size?: number; darkMode?: boolean }) {
  const scale = size / 24
  // Icon dimensions at base 24px container (smaller to have proper padding)
  const iconWidth = darkMode ? size * 0.6 : 9 * scale
  const iconHeight = darkMode ? size * 0.8 : 12 * scale

  if (darkMode) {
    // Dark mode: just the white icon, no background
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={iconWidth}
        height={iconHeight}
        viewBox="3 1.8 11.3 14.9"
        fill="none"
        className="shrink-0"
      >
        <path d="M5.43157 16.6024C4.00523 16.6024 3.06104 15.6682 3.06104 14.0209C3.06104 13.7396 3.08112 12.9461 3.1213 12.4539L3.54318 7.18048C3.82443 3.62468 5.73291 1.83673 8.66595 1.83673C11.599 1.83673 13.5075 3.62468 13.7887 7.18048L14.2106 12.4539C14.2508 12.9461 14.2709 13.7396 14.2709 14.0209C14.2709 15.6682 13.3267 16.6024 11.9003 16.6024C10.5041 16.6024 9.71059 15.9294 9.31885 14.1414C9.23849 13.7899 9.19831 13.4483 9.16818 12.8557C9.5097 12.8557 9.8713 12.7954 10.0722 12.7553C10.3936 12.695 10.5945 12.5544 10.5945 12.2229C10.5945 11.9416 10.4438 11.7608 10.1124 11.7608C10.032 11.7608 9.92153 11.7709 9.71059 11.791C9.37912 11.8211 8.95724 11.8412 8.66595 11.8412C8.37465 11.8412 7.95278 11.8211 7.6213 11.791C7.41037 11.7709 7.29987 11.7608 7.21952 11.7608C6.88804 11.7608 6.73737 11.9416 6.73737 12.2229C6.73737 12.5544 6.93827 12.695 7.2597 12.7553C7.46059 12.7954 7.8222 12.8557 8.16371 12.8557C8.13358 13.4483 8.0934 13.7899 8.01304 14.1414C7.6213 15.9294 6.82778 16.6024 5.43157 16.6024ZM6.73737 8.14477C6.73737 8.43606 6.88804 8.61687 7.21952 8.61687C7.29987 8.61687 7.41037 8.60682 7.6213 8.58673C7.95278 8.5566 8.37465 8.53651 8.66595 8.53651C8.95724 8.53651 9.37912 8.5566 9.71059 8.58673C9.92153 8.60682 10.032 8.61687 10.1124 8.61687C10.4438 8.61687 10.5945 8.43606 10.5945 8.14477C10.5945 7.81329 10.3936 7.68271 10.0722 7.62245C9.8713 7.58227 9.5097 7.53204 9.16818 7.53204V6.50749C9.16818 6.19611 9.01751 5.96508 8.66595 5.96508C8.31438 5.96508 8.16371 6.19611 8.16371 6.50749V7.53204C7.8222 7.53204 7.46059 7.58227 7.2597 7.62245C6.93827 7.68271 6.73737 7.81329 6.73737 8.14477Z" fill="white"/>
      </svg>
    )
  }

  return (
    <div
      className="flex items-center justify-center shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: "#21252C",
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={iconWidth}
        height={iconHeight}
        viewBox="3 1.8 11.3 14.9"
        fill="none"
        className="shrink-0"
        style={{ marginTop: -0.5 }}
      >
        <path d="M5.43157 16.6024C4.00523 16.6024 3.06104 15.6682 3.06104 14.0209C3.06104 13.7396 3.08112 12.9461 3.1213 12.4539L3.54318 7.18048C3.82443 3.62468 5.73291 1.83673 8.66595 1.83673C11.599 1.83673 13.5075 3.62468 13.7887 7.18048L14.2106 12.4539C14.2508 12.9461 14.2709 13.7396 14.2709 14.0209C14.2709 15.6682 13.3267 16.6024 11.9003 16.6024C10.5041 16.6024 9.71059 15.9294 9.31885 14.1414C9.23849 13.7899 9.19831 13.4483 9.16818 12.8557C9.5097 12.8557 9.8713 12.7954 10.0722 12.7553C10.3936 12.695 10.5945 12.5544 10.5945 12.2229C10.5945 11.9416 10.4438 11.7608 10.1124 11.7608C10.032 11.7608 9.92153 11.7709 9.71059 11.791C9.37912 11.8211 8.95724 11.8412 8.66595 11.8412C8.37465 11.8412 7.95278 11.8211 7.6213 11.791C7.41037 11.7709 7.29987 11.7608 7.21952 11.7608C6.88804 11.7608 6.73737 11.9416 6.73737 12.2229C6.73737 12.5544 6.93827 12.695 7.2597 12.7553C7.46059 12.7954 7.8222 12.8557 8.16371 12.8557C8.13358 13.4483 8.0934 13.7899 8.01304 14.1414C7.6213 15.9294 6.82778 16.6024 5.43157 16.6024ZM6.73737 8.14477C6.73737 8.43606 6.88804 8.61687 7.21952 8.61687C7.29987 8.61687 7.41037 8.60682 7.6213 8.58673C7.95278 8.5566 8.37465 8.53651 8.66595 8.53651C8.95724 8.53651 9.37912 8.5566 9.71059 8.58673C9.92153 8.60682 10.032 8.61687 10.1124 8.61687C10.4438 8.61687 10.5945 8.43606 10.5945 8.14477C10.5945 7.81329 10.3936 7.68271 10.0722 7.62245C9.8713 7.58227 9.5097 7.53204 9.16818 7.53204V6.50749C9.16818 6.19611 9.01751 5.96508 8.66595 5.96508C8.31438 5.96508 8.16371 6.19611 8.16371 6.50749V7.53204C7.8222 7.53204 7.46059 7.58227 7.2597 7.62245C6.93827 7.68271 6.73737 7.81329 6.73737 8.14477Z" fill="white"/>
      </svg>
    </div>
  )
}

export function RevertIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      className={`shrink-0 ${className ?? ""}`}
    >
      <path
        d="M4 2.5L2.5 4L4 5.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2.5 4H7C8.657 4 10 5.231 10 6.75V6.75C10 8.269 8.657 9.5 7 9.5H3"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// Tooltip component for showing content on hover - renders in a portal to avoid overflow clipping
export function ContentTooltip({ content, children }: { content: string | undefined; children: React.ReactNode }) {
  const [show, setShow] = useState(false)
  const [position, setPosition] = useState<{ top: number; left: number; arrowLeft: number } | null>(null)
  const triggerRef = useRef<HTMLDivElement>(null)

  if (!content) return <>{children}</>

  const isShortContent = content.length < 50
  const tooltipWidth = isShortContent ? null : 280

  const handleMouseEnter = () => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const pillCenterX = rect.left + rect.width / 2

    // Calculate tooltip position - center it, but clamp to viewport
    let tooltipLeft: number
    const estimatedWidth = tooltipWidth ?? Math.min(content.length * 8, 400)
    const padding = 12

    // Try to center the tooltip
    tooltipLeft = pillCenterX - estimatedWidth / 2

    // Clamp to viewport bounds
    if (tooltipLeft < padding) {
      tooltipLeft = padding
    } else if (tooltipLeft + estimatedWidth > window.innerWidth - padding) {
      tooltipLeft = window.innerWidth - padding - estimatedWidth
    }

    // Arrow should point to center of pill
    const arrowLeft = pillCenterX - tooltipLeft

    setPosition({
      top: rect.top - 8,
      left: tooltipLeft,
      arrowLeft: Math.max(12, Math.min(arrowLeft, estimatedWidth - 12)),
    })
    setShow(true)
  }

  return (
    <div
      ref={triggerRef}
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && position && (
        <div
          className="fixed z-[9999]"
          style={{ top: position.top, left: position.left, transform: "translateY(-100%)" }}
        >
          <div
            className={`rounded-[6px] bg-[#1F2432] px-[12px] py-[8px] text-[13px] font-[500] leading-[20px] tracking-[-0.024px] text-white shadow-[0_4px_12px_rgba(0,0,0,0.15)] ${
              isShortContent ? "whitespace-nowrap" : ""
            }`}
            style={tooltipWidth ? { width: tooltipWidth } : undefined}
          >
            <span>{content}</span>
            <div
              className="absolute top-full border-[5px] border-transparent border-t-[#1F2432]"
              style={{ left: position.arrowLeft, transform: "translateX(-50%)" }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
