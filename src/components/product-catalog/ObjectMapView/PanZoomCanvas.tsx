"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { ControlTooltip } from "@/components/product-catalog/ControlTooltip"
import type { LayoutResult, PanZoom } from "./objectMapTypes"
import { unionBounds, clamp } from "./objectMapUtils"

/* ─── SVG Icons for map controls ────────────────────────────────── */

function ZoomOutIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="2" viewBox="0 0 12 2" fill="none" style={{ width: 11.7, height: 1.7, flexShrink: 0 }}>
      <path d="M5 0H0.85C0.380558 0 0 0.380558 0 0.85C0 1.31944 0.380558 1.7 0.85 1.7H5H6.7H10.85C11.3194 1.7 11.7 1.31944 11.7 0.85C11.7 0.380558 11.3194 0 10.85 0H6.7H5Z" fill="currentColor" />
    </svg>
  )
}

function ZoomInIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ width: 11.7, height: 11.7, flexShrink: 0 }}>
      <path d="M6.7 0.85C6.7 0.380558 6.31944 0 5.85 0C5.38056 0 5 0.380558 5 0.85V5H0.85C0.380558 5 0 5.38056 0 5.85C0 6.31944 0.380558 6.7 0.85 6.7H5V10.85C5 11.3194 5.38056 11.7 5.85 11.7C6.31944 11.7 6.7 11.3194 6.7 10.85V6.7H10.85C11.3194 6.7 11.7 6.31944 11.7 5.85C11.7 5.38056 11.3194 5 10.85 5H6.7V0.85Z" fill="currentColor" />
    </svg>
  )
}

function FitToScreenIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <rect x="0.6" y="0.6" width="8.8" height="8.8" rx="0.7" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

function ListViewIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <line x1="0" y1="0.6" x2="10" y2="0.6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="0" y1="4.6" x2="10" y2="4.6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="0" y1="8.6" x2="10" y2="8.6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

/* ─── Map Controls overlay ──────────────────────────────────────── */

export type CardViewMode = "compact" | "detailed"

function MapControls({
  scale,
  cardViewMode = "compact",
  onZoomIn,
  onZoomOut,
  onZoomToFit,
  onScaleChange,
  onToggleCardViewMode,
}: {
  scale: number
  cardViewMode?: CardViewMode
  onZoomIn: () => void
  onZoomOut: () => void
  onZoomToFit: () => void
  onScaleChange: (next: number) => void
  onToggleCardViewMode?: () => void
}) {
  const pct = Math.round(scale * 10) * 10
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState("")
  const inputRef = useRef<HTMLInputElement | null>(null)

  const commitEdit = () => {
    setEditing(false)
    const parsed = parseInt(editValue.replace(/[^0-9]/g, ""), 10)
    if (!Number.isNaN(parsed) && parsed > 0) {
      const snapped = Math.round(parsed / 10) * 10
      onScaleChange(clamp(snapped / 100, 0.2, 2.5))
    }
  }

  return (
    <div
      className="absolute bottom-[12px] right-[16px] z-10 flex items-center gap-[10px] rounded-[6px] bg-white px-[12px] py-[8px] shadow-[0px_1px_1px_0px_rgba(0,0,0,0.12),0px_2px_5px_0px_rgba(48,49,61,0.08)]"
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Zoom controls */}
      <div className="flex items-center">
        {/* Zoom out */}
        <button
          type="button"
          className="flex h-[28px] w-[28px] items-center justify-center rounded-[6px] text-[#3C4F69] transition-colors hover:bg-[#F5F6F8]"
          onClick={onZoomOut}
          aria-label="Zoom out"
        >
          <ZoomOutIcon />
        </button>
        {/* Zoom percentage — clickable input */}
        {editing ? (
          <input
            ref={inputRef}
            type="text"
            className="h-[28px] w-[56px] rounded-[6px] border border-[#D4DEE9] bg-transparent text-center text-[12px] tabular-nums text-[#1A2C44] outline-none ring-2 ring-blue-400"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitEdit()
              if (e.key === "Escape") setEditing(false)
            }}
          />
        ) : (
          <button
            type="button"
            className="flex h-[28px] w-[56px] items-center justify-center text-[12px] tabular-nums text-[#1A2C44] select-none rounded-[6px] border border-transparent hover:border-[#ECF1F6] transition-colors"
            onClick={() => {
              setEditValue(`${pct}%`)
              setEditing(true)
              requestAnimationFrame(() => inputRef.current?.select())
            }}
          >
            {pct}%
          </button>
        )}
        {/* Zoom in */}
        <button
          type="button"
          className="flex h-[28px] w-[28px] items-center justify-center rounded-[6px] text-[#3C4F69] transition-colors hover:bg-[#F5F6F8]"
          onClick={onZoomIn}
          aria-label="Zoom in"
        >
          <ZoomInIcon />
        </button>
      </div>
      {/* Segmented control — compact / detailed toggle */}
      <div className="flex h-[28px] items-center overflow-hidden rounded-[6px] bg-[#ECF1F6]">
        <ControlTooltip label="Compact">
          <button
            type="button"
            className={`flex h-full items-center justify-center px-[8px] py-[6px] transition-colors text-[#3C4F69] ${
              cardViewMode === "compact"
                ? "rounded-[6px] border border-[#D4DEE9] bg-white"
                : "rounded-[4px] border border-transparent hover:bg-[#D4DEE9]"
            }`}
            onClick={() => { if (cardViewMode !== "compact") onToggleCardViewMode?.() }}
            aria-label="Compact view"
          >
            <ListViewIcon />
          </button>
        </ControlTooltip>
        <ControlTooltip label="Detailed">
          <button
            type="button"
            className={`flex h-full items-center justify-center px-[8px] py-[6px] transition-colors text-[#3C4F69] ${
              cardViewMode === "detailed"
                ? "rounded-[6px] border border-[#D4DEE9] bg-white"
                : "rounded-[4px] border border-transparent hover:bg-[#D4DEE9]"
            }`}
            onClick={() => { if (cardViewMode !== "detailed") onToggleCardViewMode?.() }}
            aria-label="Detailed view"
          >
            <FitToScreenIcon />
          </button>
        </ControlTooltip>
      </div>
    </div>
  )
}

export type ViewportBounds = {
  worldLeft: number
  worldTop: number
  worldRight: number
  worldBottom: number
}

export function PanZoomCanvas({
  layout,
  children,
  topInsetPx,
  centerKey,
  layoutDirection,
  onBackgroundClick,
  cardViewMode,
  onToggleCardViewMode,
}: {
  layout: LayoutResult
  children: (panZoom: PanZoom, viewport: ViewportBounds) => ReactNode
  topInsetPx?: number
  centerKey?: string
  /** Current layout direction — used to re-center when direction changes. */
  layoutDirection?: "horizontal" | "vertical"
  /** Called when user clicks the empty canvas background (not a node). */
  onBackgroundClick?: () => void
  /** Current card view mode for the segmented control. */
  cardViewMode?: CardViewMode
  /** Called when user toggles the compact/detailed view. */
  onToggleCardViewMode?: () => void
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [panZoom, setPanZoom] = useState<PanZoom>({ x: 24, y: (topInsetPx ?? 0) + 56, scale: 1 })
  const panZoomRef = useRef(panZoom)
  panZoomRef.current = panZoom
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const isActiveRef = useRef(false)
  const hasAutoFitRef = useRef(false)
  const [hasAutoFit, setHasAutoFit] = useState(false)
  const hasUserInteractedRef = useRef(false)

  const dragRef = useRef<{
    isDragging: boolean
    startX: number
    startY: number
    originX: number
    originY: number
  } | null>(null)

  const boundsUnionRef = useRef(layout.bounds)
  const { minX, minY, maxX, maxY } = layout.bounds
  useEffect(() => {
    boundsUnionRef.current = unionBounds(boundsUnionRef.current, { minX, minY, maxX, maxY })
  }, [maxX, maxY, minX, minY])

  // Clamp pan position to prevent scrolling too far from content
  const topInsetRef = useRef(topInsetPx ?? 0)
  topInsetRef.current = topInsetPx ?? 0
  const clampPan = useCallback((x: number, y: number, scale: number): { x: number; y: number } => {
    const el = containerRef.current
    if (!el) return { x, y }
    const rect = el.getBoundingClientRect()
    if (rect.width < 1 || rect.height < 1) return { x, y }

    const world = boundsUnionRef.current
    const worldW = (world.maxX - world.minX) * scale
    const worldH = (world.maxY - world.minY) * scale
    const worldMinX = world.minX * scale
    const worldMinY = world.minY * scale

    const pad = 60
    const topPad = topInsetRef.current + pad

    // Content left edge can't go past pad from viewport left
    const rawMaxX = -worldMinX + pad
    // Content right edge can't go past pad from viewport right
    const rawMinX = rect.width - worldMinX - worldW - pad
    // Content top can't go below topInset + pad from viewport top
    const rawMaxY = -worldMinY + topPad
    // Content bottom can't go above pad from viewport bottom
    const rawMinY = rect.height - worldMinY - worldH - pad

    return {
      x: clamp(x, Math.min(rawMinX, rawMaxX), Math.max(rawMinX, rawMaxX)),
      y: clamp(y, Math.min(rawMinY, rawMaxY), Math.max(rawMinY, rawMaxY)),
    }
  }, [])

  const centerOnKey = useCallback(
    (key: string, scale: number) => {
      const el = containerRef.current
      if (!el) return
      const target = layout.nodeByKey[key]
      if (!target) return
      const rect = el.getBoundingClientRect()
      if (rect.width < 80 || rect.height < 80) return

      // Center horizontally on the anchor node
      const cx = target.x + target.w / 2
      const nextX = rect.width / 2 - cx * scale

      // Center vertically on the tree content
      const worldH = Math.max(1, layout.bounds.maxY - layout.bounds.minY)
      const cy = layout.bounds.minY + worldH / 2
      const nextY = (rect.height + (topInsetPx ?? 0)) / 2 - cy * scale
      setPanZoom({ x: nextX, y: nextY, scale })
    },
    [layout.nodeByKey, layout.bounds, topInsetPx]
  )

  const zoomToFit = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    if (rect.width < 80 || rect.height < 80) return
    const pad = 24
    const world = boundsUnionRef.current
    const worldW = Math.max(1, world.maxX - world.minX)
    const worldH = Math.max(1, world.maxY - world.minY)

    const availableW = Math.max(1, rect.width - pad * 2)
    const availableH = Math.max(1, rect.height - pad * 2 - (topInsetPx ?? 0))
    const nextScale = clamp(Math.floor(Math.min(availableW / worldW, availableH / worldH) * 10) / 10, 0.2, 1)

    const cx = world.minX + worldW / 2
    const cy = world.minY + worldH / 2
    const nextX = rect.width / 2 - cx * nextScale
    const nextY = (rect.height + (topInsetPx ?? 0)) / 2 - cy * nextScale
    setPanZoom({ x: nextX, y: nextY, scale: nextScale })
  }, [topInsetPx])

  const handleZoomIn = useCallback(() => {
    hasUserInteractedRef.current = true
    setPanZoom((p) => {
      const currentStep = Math.round(p.scale * 10)
      const newScale = clamp((currentStep + 1) / 10, 0.2, 2.5)
      const clamped = clampPan(p.x, p.y, newScale)
      return { x: clamped.x, y: clamped.y, scale: newScale }
    })
  }, [clampPan])

  const handleZoomOut = useCallback(() => {
    hasUserInteractedRef.current = true
    setPanZoom((p) => {
      const currentStep = Math.round(p.scale * 10)
      const newScale = clamp((currentStep - 1) / 10, 0.2, 2.5)
      const clamped = clampPan(p.x, p.y, newScale)
      return { x: clamped.x, y: clamped.y, scale: newScale }
    })
  }, [clampPan])

  const handleZoomToFit = useCallback(() => {
    hasUserInteractedRef.current = true
    zoomToFit()
  }, [zoomToFit])

  const handleScaleChange = useCallback((nextScale: number) => {
    hasUserInteractedRef.current = true
    const snapped = clamp(Math.round(nextScale * 10) / 10, 0.2, 2.5)
    setPanZoom((p) => {
      const clamped = clampPan(p.x, p.y, snapped)
      return { x: clamped.x, y: clamped.y, scale: snapped }
    })
  }, [clampPan])

  const ensureNodeVisible = useCallback((nodeKey: string, panZoomState: PanZoom) => {
    const el = containerRef.current
    const node = layout.nodeByKey[nodeKey]
    if (!el || !node) return
    const rect = el.getBoundingClientRect()
    if (rect.width < 1 || rect.height < 1) return

    const margin = 40
    const topSafe = (topInsetPx ?? 0) + margin
    const rightSafe = rect.width - margin
    const bottomSafe = rect.height - margin

    const nodeLeft = node.x * panZoomState.scale + panZoomState.x
    const nodeRight = (node.x + node.w) * panZoomState.scale + panZoomState.x
    const nodeTop = node.y * panZoomState.scale + panZoomState.y
    const nodeBottom = (node.y + node.h) * panZoomState.scale + panZoomState.y

    let nextX = panZoomState.x
    let nextY = panZoomState.y

    if (nodeLeft < margin) nextX += margin - nodeLeft
    else if (nodeRight > rightSafe) nextX -= nodeRight - rightSafe

    if (nodeTop < topSafe) nextY += topSafe - nodeTop
    else if (nodeBottom > bottomSafe) nextY -= nodeBottom - bottomSafe

    const clamped = clampPan(nextX, nextY, panZoomState.scale)
    if (clamped.x !== panZoomState.x || clamped.y !== panZoomState.y) {
      setPanZoom((prev) => ({ ...prev, x: clamped.x, y: clamped.y }))
    }
  }, [clampPan, layout.nodeByKey, topInsetPx])

  // When layout direction changes, reset accumulated bounds and re-center the view.
  const prevDirectionRef = useRef(layoutDirection)
  useEffect(() => {
    if (prevDirectionRef.current !== layoutDirection) {
      prevDirectionRef.current = layoutDirection
      boundsUnionRef.current = layout.bounds
      if (centerKey) {
        centerOnKey(centerKey, panZoom.scale)
      } else {
        zoomToFit()
      }
    }
  }, [layoutDirection, layout.bounds, zoomToFit, centerOnKey, centerKey, panZoom.scale])

  const prevCardViewModeRef = useRef(cardViewMode)
  useEffect(() => {
    if (prevCardViewModeRef.current === cardViewMode) return
    prevCardViewModeRef.current = cardViewMode

    const el = containerRef.current
    const pz = panZoomRef.current
    if (!el || !layout.nodes.length) return
    const rect = el.getBoundingClientRect()
    if (rect.width < 1 || rect.height < 1) return

    const isAnyNodeVisible = layout.nodes.some((node) => {
      const left = node.x * pz.scale + pz.x
      const right = (node.x + node.w) * pz.scale + pz.x
      const top = node.y * pz.scale + pz.y
      const bottom = (node.y + node.h) * pz.scale + pz.y
      return right >= 0 && left <= rect.width && bottom >= 0 && top <= rect.height
    })
    if (isAnyNodeVisible) return

    const worldCX = (rect.width / 2 - pz.x) / pz.scale
    const worldCY = (rect.height / 2 - pz.y) / pz.scale
    let closestNodeKey = centerKey && layout.nodeByKey[centerKey] ? centerKey : layout.nodes[0]?.key
    let bestDistance = Infinity
    for (const node of layout.nodes) {
      const cx = node.x + node.w / 2
      const cy = node.y + node.h / 2
      const distance = Math.hypot(cx - worldCX, cy - worldCY)
      if (distance < bestDistance) {
        bestDistance = distance
        closestNodeKey = node.key
      }
    }
    if (closestNodeKey) {
      ensureNodeVisible(closestNodeKey, pz)
    }
  }, [cardViewMode, centerKey, ensureNodeVisible, layout.nodeByKey, layout.nodes])

  // Initial positioning: center on the target node at 100% zoom.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    if (hasAutoFitRef.current) return
    if (hasUserInteractedRef.current) return

    const tryFit = () => {
      if (hasAutoFitRef.current) return
      if (hasUserInteractedRef.current) return
      const r = el.getBoundingClientRect()
      if (r.width < 80 || r.height < 80) return
      if (centerKey) {
        centerOnKey(centerKey, 1)
      } else {
        zoomToFit()
      }
      hasAutoFitRef.current = true
      setHasAutoFit(true)
    }

    const raf = window.requestAnimationFrame(tryFit)
    const ro = new ResizeObserver(() => tryFit())
    ro.observe(el)

    return () => {
      window.cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [zoomToFit, centerOnKey, centerKey])

  // Track container size for viewport bounds (no zoomToFit on resize).
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setContainerSize({ width: entry.contentRect.width, height: entry.contentRect.height })
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const screenToWorld = useCallback(
    (clientX: number, clientY: number) => {
      const el = containerRef.current
      if (!el) return { x: 0, y: 0 }
      const r = el.getBoundingClientRect()
      const sx = clientX - r.left
      const sy = clientY - r.top
      return { x: (sx - panZoom.x) / panZoom.scale, y: (sy - panZoom.y) / panZoom.scale }
    },
    [panZoom.scale, panZoom.x, panZoom.y]
  )

  const onWheel = useCallback(
    (e: WheelEvent) => {
      const el = containerRef.current
      if (!el) return
      hasUserInteractedRef.current = true
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const delta = -e.deltaY
        const factor = delta > 0 ? 1.08 : 0.92
        const nextScale = clamp(Math.round(panZoom.scale * factor * 10) / 10, 0.2, 2.5)
        const w = screenToWorld(e.clientX, e.clientY)
        const r = el.getBoundingClientRect()
        const sx = e.clientX - r.left
        const sy = e.clientY - r.top
        const nextX = sx - w.x * nextScale
        const nextY = sy - w.y * nextScale
        const clamped = clampPan(nextX, nextY, nextScale)
        setPanZoom({ x: clamped.x, y: clamped.y, scale: nextScale })
        return
      }
      // trackpad pan
      setPanZoom((prev) => {
        const clamped = clampPan(prev.x - e.deltaX, prev.y - e.deltaY, prev.scale)
        return { ...prev, x: clamped.x, y: clamped.y }
      })
    },
    [panZoom.scale, screenToWorld, clampPan]
  )

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handler = (e: WheelEvent) => onWheel(e)
    el.addEventListener("wheel", handler, { passive: false })
    return () => el.removeEventListener("wheel", handler)
  }, [onWheel])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Only hijack keys while the user is interacting with the map (hover/focus).
      if (!isActiveRef.current) return

      // Intercept browser zoom shortcuts so we can zoom the canvas instead (Figma-style).
      const isZoomCombo = (e.metaKey || e.ctrlKey) && (e.key === "-" || e.key === "+" || e.key === "=" || e.key === "0")
      if (isZoomCombo) {
        e.preventDefault()
        e.stopPropagation()
      }

      if (e.key === "+" || e.key === "=") {
        setPanZoom((p) => {
          const currentStep = Math.round(p.scale * 10)
          const newScale = clamp((currentStep + 1) / 10, 0.2, 2.5)
          const clamped = clampPan(p.x, p.y, newScale)
          return { x: clamped.x, y: clamped.y, scale: newScale }
        })
      } else if (e.key === "-") {
        setPanZoom((p) => {
          const currentStep = Math.round(p.scale * 10)
          const newScale = clamp((currentStep - 1) / 10, 0.2, 2.5)
          const clamped = clampPan(p.x, p.y, newScale)
          return { x: clamped.x, y: clamped.y, scale: newScale }
        })
      } else if (e.key === "0") {
        setPanZoom((p) => {
          const clamped = clampPan(p.x, p.y, 1)
          return { x: clamped.x, y: clamped.y, scale: 1 }
        })
      } else if ((e.key === "F" || e.key === "f") || (e.key === "1" && e.shiftKey)) {
        zoomToFit()
      } else if (e.key === "ArrowLeft") {
        setPanZoom((p) => {
          const clamped = clampPan(p.x + 30, p.y, p.scale)
          return { ...p, x: clamped.x }
        })
      } else if (e.key === "ArrowRight") {
        setPanZoom((p) => {
          const clamped = clampPan(p.x - 30, p.y, p.scale)
          return { ...p, x: clamped.x }
        })
      } else if (e.key === "ArrowUp") {
        setPanZoom((p) => {
          const clamped = clampPan(p.x, p.y + 30, p.scale)
          return { ...p, y: clamped.y }
        })
      } else if (e.key === "ArrowDown") {
        setPanZoom((p) => {
          const clamped = clampPan(p.x, p.y - 30, p.scale)
          return { ...p, y: clamped.y }
        })
      }
    }
    window.addEventListener("keydown", onKeyDown, true)
    return () => window.removeEventListener("keydown", onKeyDown, true)
  }, [zoomToFit, clampPan])

  const viewport = useMemo<ViewportBounds>(() => ({
    worldLeft: -panZoom.x / panZoom.scale,
    worldTop: -panZoom.y / panZoom.scale,
    worldRight: (containerSize.width - panZoom.x) / panZoom.scale,
    worldBottom: (containerSize.height - panZoom.y) / panZoom.scale,
  }), [panZoom.x, panZoom.y, panZoom.scale, containerSize.width, containerSize.height])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden outline-none"
      tabIndex={0}
      style={{
        backgroundImage: `radial-gradient(circle, #E2E6EB ${Math.max(0.75, 1 * panZoom.scale)}px, transparent ${Math.max(0.75, 1 * panZoom.scale)}px)`,
        backgroundSize: `${14 * panZoom.scale}px ${14 * panZoom.scale}px`,
        backgroundPosition: `${panZoom.x % (14 * panZoom.scale)}px ${panZoom.y % (14 * panZoom.scale)}px`,
      }}
      onFocus={() => {
        isActiveRef.current = true
      }}
      onBlur={() => {
        isActiveRef.current = false
      }}
      onMouseEnter={() => {
        isActiveRef.current = true
      }}
      onMouseLeave={() => {
        isActiveRef.current = false
      }}
      onPointerDown={(e) => {
        // drag-to-pan (left button)
        if (e.button !== 0) return

        // Don't start panning when interacting with a node (buttons, clickable cards, etc).
        const target = e.target as HTMLElement | null
        if (target && target.closest?.("[data-object-map-node]")) return

        hasUserInteractedRef.current = true
        ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
        dragRef.current = { isDragging: true, startX: e.clientX, startY: e.clientY, originX: panZoom.x, originY: panZoom.y }
      }}
      onPointerMove={(e) => {
        const d = dragRef.current
        if (!d?.isDragging) return
        const dx = e.clientX - d.startX
        const dy = e.clientY - d.startY
        setPanZoom((p) => {
          const clamped = clampPan(d.originX + dx, d.originY + dy, p.scale)
          return { ...p, x: clamped.x, y: clamped.y }
        })
      }}
      onPointerUp={(e) => {
        const d = dragRef.current
        if (d?.isDragging) {
          const dx = Math.abs(e.clientX - d.startX)
          const dy = Math.abs(e.clientY - d.startY)
          if (dx < 5 && dy < 5) {
            onBackgroundClick?.()
          }
        }
        dragRef.current = null
      }}
      onDoubleClick={() => zoomToFit()}
      aria-label="Object map canvas"
    >
      <div
        className="absolute left-0 top-0"
        style={{
          transform: `translate(${panZoom.x}px, ${panZoom.y}px) scale(${panZoom.scale})`,
          transformOrigin: "0 0",
          willChange: "transform",
          visibility: hasAutoFit ? "visible" as const : "hidden" as const,
        }}
      >
        {children(panZoom, viewport)}
      </div>
      {/* Map zoom & view controls */}
      <MapControls
        scale={panZoom.scale}
        cardViewMode={cardViewMode}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomToFit={handleZoomToFit}
        onScaleChange={handleScaleChange}
        onToggleCardViewMode={onToggleCardViewMode}
      />
    </div>
  )
}
