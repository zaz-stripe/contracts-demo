"use client"

import { createPortal } from "react-dom"
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import type { AssistantReference } from "@/components/ProductAssistantPanel"
import { cn } from "@/lib/utils"
import { getTooltipPosition } from "@/components/product-catalog/tooltipPositioning"
import { SparkleIcon16, OpenInWorkbenchIcon16x14, DocsIcon16 } from "./objectMapIcons"
import { clamp } from "./objectMapUtils"

export function NodeActionsPopover({
  anchorRect,
  onClose,
  reference,
  onAskForChanges,
}: {
  anchorRect: DOMRect
  onClose: () => void
  reference: AssistantReference
  onAskForChanges: (ref: AssistantReference) => void
}) {
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const [measuredWidth, setMeasuredWidth] = useState<number>(0)

  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<null | { label: string; rect: DOMRect }>(null)
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null)
  const tooltipRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!toastMessage) return
    const t = window.setTimeout(() => setToastMessage(null), 2600)
    return () => window.clearTimeout(t)
  }, [toastMessage])

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node
      const pop = popoverRef.current
      if (pop && pop.contains(target)) return
      onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("mousedown", onDown)
    window.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      window.removeEventListener("keydown", onKey)
    }
  }, [onClose])

  useEffect(() => {
    const el = popoverRef.current
    if (!el) return
    const w = el.offsetWidth
    if (w && w !== measuredWidth) setMeasuredWidth(w)
  }, [measuredWidth, tooltip?.label])

  const updateTooltipPosition = useCallback(() => {
    if (!tooltip || !tooltipRef.current) return
    const next = getTooltipPosition({
      anchorRect: tooltip.rect,
      tooltipRect: tooltipRef.current.getBoundingClientRect(),
      preferredSide: "top",
    })
    setTooltipPos({ top: next.top, left: next.left })
  }, [tooltip])

  useLayoutEffect(() => {
    if (!tooltip) {
      setTooltipPos(null)
      return
    }
    updateTooltipPosition()
  }, [tooltip, updateTooltipPosition])

  useEffect(() => {
    if (!tooltip) return
    window.addEventListener("resize", updateTooltipPosition)
    window.addEventListener("scroll", updateTooltipPosition, true)
    return () => {
      window.removeEventListener("resize", updateTooltipPosition)
      window.removeEventListener("scroll", updateTooltipPosition, true)
    }
  }, [tooltip, updateTooltipPosition])

  const content = (
    <>
      <div
        ref={popoverRef}
        className={cn(
          "fixed z-[1000]",
          "inline-flex items-center gap-[12px] rounded-[8px] border border-[#EBEEF1] bg-[#F5F6F8] pl-0 pr-[8px] py-0 shadow-[0_15px_35px_rgba(48,49,61,0.08),0_5px_15px_rgba(0,0,0,0.12)]"
        )}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        style={{
          top: anchorRect.bottom + 8,
          left: (() => {
            const width = measuredWidth || 260
            const center = anchorRect.left + anchorRect.width / 2
            return clamp(center - width / 2, 12, window.innerWidth - width - 12)
          })(),
        }}
      >
        <>
          <button
            type="button"
            className="flex items-center gap-[10px] rounded-[6px] bg-white px-[12px] py-[8px] text-[14px] font-[500] leading-[20px] tracking-[-0.15px] text-[#353A44]"
            onClick={() => {
              onAskForChanges(reference)
              onClose()
            }}
          >
            <SparkleIcon16 />
            <span>Ask for changes</span>
          </button>

          <div className="flex items-center gap-[6px]">
            <button
              type="button"
              className="flex size-[32px] items-center justify-center rounded-[6px] text-[#474E5A] hover:bg-[#D8DEE4] transition-colors"
              onMouseEnter={(e) =>
                setTooltip({ label: "Open in Workbench", rect: (e.currentTarget as HTMLElement).getBoundingClientRect() })
              }
              onMouseLeave={() => setTooltip(null)}
              onClick={() => setToastMessage("Clicking on this would open the corresponding documentation in workbench")}
              aria-label="Open in Workbench"
            >
              <OpenInWorkbenchIcon16x14 />
            </button>
            <button
              type="button"
              className="flex size-[32px] items-center justify-center rounded-[6px] text-[#474E5A] hover:bg-[#D8DEE4] transition-colors"
              onMouseEnter={(e) => setTooltip({ label: "View docs", rect: (e.currentTarget as HTMLElement).getBoundingClientRect() })}
              onMouseLeave={() => setTooltip(null)}
              onClick={() => setToastMessage("Clicking on this would open the corresponding documentation in Stripe docs")}
              aria-label="View docs"
            >
              <DocsIcon16 />
            </button>
          </div>
        </>
      </div>

      {tooltip ? (
        <div
          ref={tooltipRef}
          className="fixed z-[1001] rounded-[4px] bg-[#474E5A] px-[8px] py-[4px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-white shadow-[0_2px_5px_rgba(64,68,82,0.08),0_3px_9px_rgba(64,68,82,0.08)]"
          style={{
            top: tooltipPos?.top ?? 0,
            left: tooltipPos?.left ?? 0,
            maxWidth: 260,
            visibility: tooltipPos ? "visible" : "hidden",
            whiteSpace: "nowrap",
          }}
        >
          {tooltip.label}
        </div>
      ) : null}

      {toastMessage ? (
        <div className="fixed bottom-4 left-4 z-[1002] rounded-[10px] border border-[#EBEEF1] bg-white px-3 py-2 text-[12px] font-[500] text-[#353A44] shadow-[0_15px_35px_rgba(48,49,61,0.08),0_5px_15px_rgba(0,0,0,0.12)]">
          {toastMessage}
        </div>
      ) : null}
    </>
  )

  return createPortal(content, document.body)
}
