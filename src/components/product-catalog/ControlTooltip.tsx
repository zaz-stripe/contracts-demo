'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { getTooltipPosition } from "./tooltipPositioning"

export function ControlTooltip({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  const [show, setShow] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const updatePosition = useCallback(() => {
    if (!show || !ref.current || !tooltipRef.current) return
    const next = getTooltipPosition({
      anchorRect: ref.current.getBoundingClientRect(),
      tooltipRect: tooltipRef.current.getBoundingClientRect(),
      preferredSide: "bottom",
    })
    setPos({ top: next.top, left: next.left })
  }, [show])

  useLayoutEffect(() => {
    if (!show) {
      setPos(null)
      return
    }
    updatePosition()
  }, [show, label, updatePosition])

  useEffect(() => {
    if (!show) return
    window.addEventListener("resize", updatePosition)
    window.addEventListener("scroll", updatePosition, true)
    return () => {
      window.removeEventListener("resize", updatePosition)
      window.removeEventListener("scroll", updatePosition, true)
    }
  }, [show, updatePosition])

  return (
    <div
      ref={ref}
      className={className ?? "h-full"}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && typeof document !== "undefined" && createPortal(
        <div
          ref={tooltipRef}
          className="pointer-events-none fixed z-[9999] rounded-[8px] border border-[#D4DEE9] bg-white px-[10px] py-[4px] shadow-[0px_5px_15px_0px_rgba(0,0,0,0.12),0px_15px_35px_0px_rgba(48,49,61,0.08)]"
          style={{
            top: pos?.top ?? 0,
            left: pos?.left ?? 0,
            visibility: pos ? "visible" : "hidden",
          }}
        >
          <p className="whitespace-nowrap text-[12px] font-medium leading-[20px] tracking-[-0.15px] text-[#353A44]">{label}</p>
        </div>,
        document.body,
      )}
    </div>
  )
}
