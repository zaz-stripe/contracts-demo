'use client'

import type { ReactNode } from "react"
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useTranslation } from "react-i18next"

export type DetailChipItem = { id: string; label: ReactNode; onClick: () => void }

type Props = {
  items: DetailChipItem[]
  chipClassName: string
  containerClassName?: string
  maxRows?: number
  onOverflowClick?: () => void
}

function rowCount(els: HTMLElement[]) {
  const tops = new Set<number>()
  for (const el of els) {
    if (el.offsetParent == null) continue
    tops.add(el.offsetTop)
  }
  return tops.size
}

export function DetailChipsOverflow({
  items,
  chipClassName,
  containerClassName = "flex flex-wrap items-center gap-[8px]",
  maxRows = 2,
  onOverflowClick,
}: Props) {
  const { t } = useTranslation()
  const hostRef = useRef<HTMLDivElement | null>(null)
  const measureRef = useRef<HTMLDivElement | null>(null)
  const overflowTriggerRef = useRef<HTMLButtonElement | null>(null)
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const closeTimerRef = useRef<number | null>(null)

  const [w, setW] = useState<number | null>(null)
  const [visible, setVisible] = useState(items.length)
  const [open, setOpen] = useState(false)
  const [popoverStyle, setPopoverStyle] = useState<{ top: number; left: number } | null>(null)

  const hidden = Math.max(0, items.length - visible)
  const hiddenItems = hidden > 0 ? items.slice(visible) : []
  const overflowLabel = useMemo(() => (hidden > 0 ? `+ ${hidden} ${t("more")}` : ""), [hidden, t])
  const canUseDOM = typeof document !== "undefined"

  useEffect(() => {
    if (!hostRef.current) return
    const ro = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect?.width
      if (typeof width === "number" && Number.isFinite(width)) setW(width)
    })
    ro.observe(hostRef.current)
    return () => ro.disconnect()
  }, [])

  useLayoutEffect(() => {
    const root = measureRef.current
    if (!root) return
    if (typeof w === "number") root.style.width = `${w}px`

    const chips = Array.from(root.querySelectorAll<HTMLElement>('[data-chip="true"]'))
    const overflow = root.querySelector<HTMLElement>('[data-overflow="true"]')
    if (!overflow) return

    const total = items.length
    if (total === 0) {
      setVisible((prev) => (prev === 0 ? prev : 0))
      return
    }

    const apply = (n: number) => {
      for (let i = 0; i < chips.length; i++) chips[i]!.style.display = i < n ? "" : "none"
      const hiddenCount = total - n
      overflow.style.display = hiddenCount > 0 ? "" : "none"
      overflow.textContent = hiddenCount > 0 ? `+ ${hiddenCount} ${t("more")}` : ""
    }

    const fits = (n: number) => {
      apply(n)
      const shown: HTMLElement[] = []
      for (let i = 0; i < total; i++) {
        const el = chips[i]
        if (el && el.style.display !== "none") shown.push(el)
      }
      if (overflow.style.display !== "none") shown.push(overflow)
      return rowCount(shown) <= maxRows
    }

    apply(total)
    if (fits(total)) {
      setVisible((prev) => (prev === total ? prev : total))
      return
    }

    let lo = 0
    let hi = total - 1
    let best = 0
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2)
      if (fits(mid)) {
        best = mid
        lo = mid + 1
      } else {
        hi = mid - 1
      }
    }
    // Only update state if value changed to prevent potential render loops
    setVisible((prev) => (prev === best ? prev : best))
  }, [items, w, maxRows, t])

  const openPopover = () => {
    if (closeTimerRef.current != null) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    setOpen(true)
  }

  const closePopoverSoon = () => {
    if (closeTimerRef.current != null) window.clearTimeout(closeTimerRef.current)
    closeTimerRef.current = window.setTimeout(() => setOpen(false), 120)
  }

  useLayoutEffect(() => {
    if (!open) {
      setPopoverStyle(null)
      return
    }
    const trigger = overflowTriggerRef.current
    const pop = popoverRef.current
    if (!trigger || !pop) return
    const triggerRect = trigger.getBoundingClientRect()
    const popRect = pop.getBoundingClientRect()
    const viewportPadding = 12
    const gap = 6

    // Default: align left edge with trigger.
    let left = triggerRect.left
    // If it would clip on the right, align right edge with trigger.
    if (left + popRect.width > window.innerWidth - viewportPadding) {
      left = triggerRect.right - popRect.width
    }
    // Clamp to viewport padding.
    left = Math.max(viewportPadding, Math.min(left, window.innerWidth - viewportPadding - popRect.width))

    // Default: below trigger.
    let top = triggerRect.bottom + gap
    // If it would clip bottom, try above.
    if (top + popRect.height > window.innerHeight - viewportPadding) {
      top = triggerRect.top - popRect.height - gap
    }
    top = Math.max(viewportPadding, Math.min(top, window.innerHeight - viewportPadding - popRect.height))

    setPopoverStyle({ top, left })
  }, [open, hiddenItems.length])

  return (
    <div ref={hostRef} className="min-w-0 flex-1">
      <div className={containerClassName}>
        {items.slice(0, visible).map((it) => (
          <button key={it.id} type="button" className={chipClassName} onClick={it.onClick}>
            {it.label}
          </button>
        ))}

        {hidden > 0 && (
          <div className="relative" onMouseEnter={openPopover} onMouseLeave={closePopoverSoon}>
            <button
              ref={overflowTriggerRef}
              type="button"
              className={chipClassName}
              aria-label={`Show ${hidden} more`}
              onClick={() => {
                if (onOverflowClick) {
                  setOpen(false)
                  onOverflowClick()
                  return
                }
                openPopover()
              }}
            >
              {overflowLabel}
            </button>
          </div>
        )}
      </div>

      {open && hidden > 0 && canUseDOM
        ? createPortal(
            <div
              ref={popoverRef}
              className="fixed z-[9999] min-w-[180px] max-w-[calc(100vw-24px)] rounded-[8px] border border-[#D8DEE4] bg-white p-[6px] shadow-[0_6px_18px_rgba(0,0,0,0.12)]"
              style={popoverStyle ?? { top: -99999, left: -99999 }}
              onMouseEnter={openPopover}
              onMouseLeave={closePopoverSoon}
            >
              <div className="flex flex-col">
                {hiddenItems.map((it) => (
                  <button
                    key={it.id}
                    type="button"
                    className="w-full rounded-[6px] px-[10px] py-[8px] text-left text-[12px] font-[500] leading-[16px] text-[#353A44] hover:bg-[#F5F6F8]"
                    onClick={() => {
                      setOpen(false)
                      it.onClick()
                    }}
                  >
                    {it.label}
                  </button>
                ))}
              </div>
            </div>,
            document.body
          )
        : null}

      {/* Hidden measurer to compute wrapping for maxRows */}
      <div
        ref={measureRef}
        className={`${containerClassName} pointer-events-none invisible fixed left-[-99999px] top-[-99999px]`}
        aria-hidden="true"
      >
        {items.map((it) => (
          <button key={it.id} type="button" className={chipClassName} data-chip="true" tabIndex={-1}>
            {it.label}
          </button>
        ))}
        <button type="button" className={chipClassName} data-overflow="true" tabIndex={-1}>
          + 0 more
        </button>
      </div>
    </div>
  )
}


