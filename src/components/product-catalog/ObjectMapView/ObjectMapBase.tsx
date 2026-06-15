"use client"

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import type { AssistantReference, AssistantReferenceKind } from "@/components/ProductAssistantPanel"
import { getTooltipPosition } from "@/components/product-catalog/tooltipPositioning"
import type { TreeNode, PositionedNode } from "./objectMapTypes"
import { computeTreeLayout } from "./objectMapUtils"
import { PanZoomCanvas, type ViewportBounds, type CardViewMode } from "./PanZoomCanvas"
import { useAnimatedLayoutTransition } from "./useAnimatedLayoutTransition"
import { NodeCard, type NodeContextMenuInfo } from "./NodeCard"
import { NodeActionsPopover } from "./NodeActionsPopover"
import { EdgePlusIcon16 } from "./objectMapIcons"
import { useLayoutDirection } from "../layoutDirection"
import { useCascadeAlignment } from "../cascadeAlignment"
import { useMapInteractivity } from "../mapInteractivity"

/** Plus button with styled tooltip on hover */
function PlusButton({
  x,
  y,
  label,
  onClick,
  isVisible,
  onGroupEnter,
  onGroupLeave,
  interactionDisabled,
}: {
  x: number
  y: number
  label: string
  onClick: (e: React.MouseEvent) => void
  isVisible: boolean
  onGroupEnter?: () => void
  onGroupLeave?: () => void
  /** During layout morph, disable hit targets so hover does not thrash. */
  interactionDisabled?: boolean
}) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const updateTooltipPosition = useCallback(() => {
    if (!showTooltip || !buttonRef.current || !tooltipRef.current) return
    const next = getTooltipPosition({
      anchorRect: buttonRef.current.getBoundingClientRect(),
      tooltipRect: tooltipRef.current.getBoundingClientRect(),
      preferredSide: "top",
    })
    setTooltipPos({ top: next.top, left: next.left })
  }, [showTooltip])

  useLayoutEffect(() => {
    if (!showTooltip) {
      setTooltipPos(null)
      return
    }
    updateTooltipPosition()
  }, [showTooltip, label, updateTooltipPosition])

  useEffect(() => {
    if (!showTooltip) return
    window.addEventListener("resize", updateTooltipPosition)
    window.addEventListener("scroll", updateTooltipPosition, true)
    return () => {
      window.removeEventListener("resize", updateTooltipPosition)
      window.removeEventListener("scroll", updateTooltipPosition, true)
    }
  }, [showTooltip, updateTooltipPosition])

  const tooltip = showTooltip && typeof document !== "undefined"
    ? createPortal(
        <div
          ref={tooltipRef}
          className="fixed z-[9999] rounded-[4px] border border-[#D8DEE4] bg-white px-2 py-1 shadow-[0_4px_12px_rgba(28,32,40,0.12)]"
          style={{
            top: tooltipPos?.top ?? 0,
            left: tooltipPos?.left ?? 0,
            visibility: tooltipPos ? "visible" : "hidden",
          }}
        >
          <p className="whitespace-nowrap text-[11px] font-medium text-[#596171]">{label}</p>
        </div>,
        document.body
      )
    : null

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={`absolute flex items-center justify-center rounded-[4px] border border-[#D8DEE4] bg-white p-[2px] text-[#353A44] transition-opacity duration-150 ${isVisible ? "opacity-100" : "opacity-0"}`}
        style={{ left: x - 8, top: y - 8, pointerEvents: interactionDisabled ? "none" : undefined }}
        onClick={onClick}
        onPointerDown={(ev) => ev.stopPropagation()}
        onMouseDown={(ev) => ev.stopPropagation()}
        onMouseEnter={() => { setShowTooltip(true); onGroupEnter?.() }}
        onMouseLeave={() => { setShowTooltip(false); onGroupLeave?.() }}
        aria-label={label}
      >
        <EdgePlusIcon16 />
      </button>
      {tooltip}
    </>
  )
}

/** Relationship label shown on an edge (e.g., "contains") */
function EdgeLabel({
  x,
  y,
  text,
  isVisible,
  onGroupEnter,
  onGroupLeave,
  interactionDisabled,
}: {
  x: number
  y: number
  text: string
  isVisible: boolean
  onGroupEnter?: () => void
  onGroupLeave?: () => void
  interactionDisabled?: boolean
}) {
  return (
    <div
      className={`absolute inline-flex items-center rounded-[2px] bg-[#F5F6F8] px-[5px] py-[2px] transition-opacity duration-150 ${isVisible ? "opacity-100" : "opacity-0"}`}
      style={{
        left: x,
        top: y,
        transform: "translate(-50%, -50%)",
        width: "fit-content",
        pointerEvents: interactionDisabled || !isVisible ? "none" : "auto",
      }}
      onMouseEnter={onGroupEnter}
      onMouseLeave={onGroupLeave}
    >
      <span className="whitespace-nowrap text-[10px] italic leading-[9px] tracking-[0.1px] text-[#353A44]">
        {text}
      </span>
    </div>
  )
}

/**
 * Get the relationship label text for an edge between two nodes.
 * Returns null if no label should be shown for this edge.
 */
function getRelationshipLabel(fromKey: string, toKey: string): string | null {
  // Only show labels for edges within the pricing plan structure
  // (not for edges to external nodes like checkout, subscription, etc.)

  // Rate → Meter: rates "use" a meter (Stripe docs: rates reference an existing meter)
  if (toKey.includes("rateMeter:")) return "uses"

  // Plan → {rate card, subscription fee, credit grant}: plans "include" components
  // (Stripe docs: "a pricing plan that includes rate cards, subscription fees, and service actions")
  if (toKey.includes("rateCard:") || toKey.includes("creditGrant:") || toKey.includes("subscriptionFee:")) {
    return "includes"
  }

  // Rate card → Rate: rate cards "include" rates
  // (Stripe docs: "Attach a rate to the rate card")
  if (toKey.includes("rate:") && !toKey.includes("rateCard:")) {
    return "includes"
  }

  return null
}

/**
 * Calculate the position for an edge relationship label.
 * Placed on the vertical segment (horizontal layout) or horizontal segment (vertical layout).
 * Labels are centered on the edge. Plus buttons sit near the source node,
 * so there is no overlap.
 */
function calculateEdgeLabelPosition(
  a: PositionedNode,
  b: PositionedNode,
  direction: "horizontal" | "vertical"
): { x: number; y: number } | null {
  if (direction === "vertical") {
    const x1 = a.x + a.w / 2
    const y1 = a.y + a.h
    const x2 = b.x + b.w / 2
    const y2 = b.y

    if ((y2 - y1) <= RECT_CHANGE_THRESHOLD) return null

    // Always place label at the midpoint between parent exit and child entry.
    // This is predictable regardless of whether the edge bends.
    return { x: (x1 + x2) / 2, y: (y1 + y2) / 2 }
  }

  // Horizontal layout
  const x1 = a.x + a.w
  const y1 = a.y + a.h / 2
  const x2 = b.x
  const y2 = b.y + b.h / 2

  if ((x2 - x1) <= RECT_CHANGE_THRESHOLD) return null

  // Always place label at the midpoint between parent exit and child entry.
  return { x: (x1 + x2) / 2, y: (y1 + y2) / 2 }
}

// Feature flag: Set to true to show the "Ask for changes" popover when clicking nodes
const SHOW_NODE_ACTIONS_POPOVER = false

// Edge drawing constants
const EDGE_LANE_WIDTH = 24
const EDGE_MIN_LANE = 8
const EDGE_MIN_CORNER_RADIUS = 4
const EDGE_MAX_CORNER_RADIUS = 10
const EDGE_HORIZONTAL_THRESHOLD = 8 // Minimum offset before drawing anything other than a straight line
const RECT_CHANGE_THRESHOLD = 0.5 // Pixel threshold for detecting rect changes

// Viewport culling margin — nodes within this many world-pixels of the visible
// area are still rendered so they don't pop in/out at the edges.
const VIEWPORT_MARGIN = 300

function isNodeVisible(n: PositionedNode, vp: ViewportBounds): boolean {
  return (
    n.x + n.w >= vp.worldLeft - VIEWPORT_MARGIN &&
    n.x <= vp.worldRight + VIEWPORT_MARGIN &&
    n.y + n.h >= vp.worldTop - VIEWPORT_MARGIN &&
    n.y <= vp.worldBottom + VIEWPORT_MARGIN
  )
}

/** Check if the bounding box spanning two nodes intersects the viewport. */
function isEdgeVisible(a: PositionedNode, b: PositionedNode, vp: ViewportBounds): boolean {
  const minX = Math.min(a.x, b.x)
  const maxX = Math.max(a.x + a.w, b.x + b.w)
  const minY = Math.min(a.y, b.y)
  const maxY = Math.max(a.y + a.h, b.y + b.h)
  return (
    maxX >= vp.worldLeft - VIEWPORT_MARGIN &&
    minX <= vp.worldRight + VIEWPORT_MARGIN &&
    maxY >= vp.worldTop - VIEWPORT_MARGIN &&
    minY <= vp.worldBottom + VIEWPORT_MARGIN
  )
}

// Popover positioning constants
const ADD_BUTTON_HORIZONTAL_GAP = 4

/**
 * Calculate the lane and corner radius for orthogonal edge routing.
 * Used to ensure consistent edge drawing and plus button positioning.
 */
function calculateEdgeLane(dx: number, dy: number) {
  const lane = Math.max(EDGE_MIN_LANE, Math.min(EDGE_LANE_WIDTH, dx / 2))
  const r = Math.max(EDGE_MIN_CORNER_RADIUS, Math.min(EDGE_MAX_CORNER_RADIUS, lane, Math.abs(dy) / 2))
  return { lane, r }
}

/**
 * Calculate the turn point X coordinate for orthogonal edge routing.
 */
function calculateTurnX(x1: number, x2: number, lane: number, r: number) {
  let turnX = x1 + Math.max(lane, r + 0.5)
  // Ensure we have room to complete the second rounded corner before the target
  turnX = Math.min(turnX, x2 - r - 1)
  return turnX
}

export function ObjectMapBase({
  root,
  selectedNodeKey,
  selectedNodeKeys,
  stickyAnchorKey,
  topInsetPx,
  onOpenAssistant,
  onAddPlanObject,
  onAddRate,
  onNodeContextMenu,
  additionalEdges,
  onBackgroundClick,
}: {
  root: TreeNode
  /** @deprecated Use selectedNodeKeys for multi-select support */
  selectedNodeKey?: string | null
  /** Array of selected node keys (for multi-select support) */
  selectedNodeKeys?: string[]
  stickyAnchorKey?: string
  topInsetPx?: number
  onOpenAssistant?: (ref: AssistantReference) => void
  /** Callback when clicking plus button after plan node - shows dropdown */
  onAddPlanObject?: (position: { top: number; left: number }) => void
  /** Callback when clicking plus button after rate card - adds a rate */
  onAddRate?: (rateCardId: number) => void
  /** Callback when right-clicking on a node */
  onNodeContextMenu?: (info: NodeContextMenuInfo) => void
  /** Additional edges to draw (e.g., for shared meters connecting to multiple rates) */
  additionalEdges?: { from: string; to: string }[]
  /** Called when user clicks the empty canvas background (not a node). */
  onBackgroundClick?: () => void
}) {
  const { direction } = useLayoutDirection()
  const { cascadeAlignment } = useCascadeAlignment()
  const { mapInteractive } = useMapInteractivity()
  const [expandedByKey, setExpandedByKey] = useState<Record<string, boolean>>({})
  const [cardViewMode, setCardViewMode] = useState<CardViewMode>("compact")

  // Hover state: a single bounding-box zone covers the entire plan tree.
  // Enter = show all plus buttons & edge labels; leave = hide them.
  const [isHoverActive, setIsHoverActive] = useState(false)

  // Keep per-node enter/leave callbacks (used by PlusButton/EdgeLabel onGroupEnter/Leave)
  // but they just forward to the zone-level state.
  const handleNodeMouseEnter = useCallback((_key: string) => {
    setIsHoverActive(true)
  }, [])

  const handleNodeMouseLeave = useCallback(() => {
    // no-op: only the bounding-box onMouseLeave hides interactive elements
  }, [])

  // When in detailed mode, swap node w/h with detailedW/detailedH
  const effectiveRoot = useMemo(() => {
    if (cardViewMode === "compact") return root
    const swapSizes = (node: TreeNode): TreeNode => ({
      ...node,
      w: node.detailedW ?? node.w,
      h: node.detailedH ?? node.h,
      children: node.children?.map(swapSizes),
      attachedNodes: node.attachedNodes?.map(swapSizes),
    })
    return swapSizes(root)
  }, [root, cardViewMode])

  const layout = useMemo(() => computeTreeLayout({ root: effectiveRoot, isExpandedByKey: expandedByKey, direction, colGapX: cardViewMode === "detailed" ? 60 : undefined, rowGapY: cardViewMode === "detailed" ? 32 : undefined, cascadeAlignment }), [expandedByKey, effectiveRoot, direction, cardViewMode, cascadeAlignment])

  // Stabilize collapses/expands by keeping the main/root node pinned in world Y.
  const pinnedWorldYRef = useRef<number | null>(null)
  const prevPinnedYRef = useRef<number | null>(null)
  const layoutRef = useRef(layout)
  useEffect(() => {
    layoutRef.current = layout
  }, [layout])

  useEffect(() => {
    const key = stickyAnchorKey ?? root.key
    const current = layout.nodeByKey[key]
    if (!current) return
    if (pinnedWorldYRef.current == null) pinnedWorldYRef.current = current.y
    prevPinnedYRef.current = current.y
  }, [layout.nodeByKey, root.key, stickyAnchorKey])

  // action popover
  const [actionsNodeKey, setActionsNodeKey] = useState<string | null>(null)
  const [actionsRect, setActionsRect] = useState<DOMRect | null>(null)
  const actionsRectRef = useRef<DOMRect | null>(null)

  const openActions = useCallback((nodeKey: string, rect: DOMRect) => {
    setActionsNodeKey(nodeKey)
    setActionsRect(rect)
    actionsRectRef.current = rect
  }, [])

  const closeActions = useCallback(() => {
    setActionsNodeKey(null)
    setActionsRect(null)
    actionsRectRef.current = null
  }, [])

  // Keep the popover anchored to the node as the canvas transforms.
  useEffect(() => {
    if (!actionsNodeKey) return
    let raf = 0
    const tick = () => {
      const el = document.querySelector(
        `[data-object-map-node="${CSS.escape(actionsNodeKey)}"]`
      ) as HTMLElement | null
      if (!el) {
        closeActions()
        return
      }
      const rect = el.getBoundingClientRect()
      const prev = actionsRectRef.current
      const changed =
        !prev ||
        Math.abs(prev.left - rect.left) > RECT_CHANGE_THRESHOLD ||
        Math.abs(prev.top - rect.top) > RECT_CHANGE_THRESHOLD ||
        Math.abs(prev.width - rect.width) > RECT_CHANGE_THRESHOLD ||
        Math.abs(prev.height - rect.height) > RECT_CHANGE_THRESHOLD
      if (changed) {
        actionsRectRef.current = rect
        setActionsRect(rect)
      }
      raf = window.requestAnimationFrame(tick)
    }
    raf = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(raf)
  }, [actionsNodeKey, closeActions])

  // map pin adjustment is applied by shifting the root origin
  const pinDeltaY = useMemo(() => {
    const key = stickyAnchorKey ?? root.key
    const current = layout.nodeByKey[key]
    if (!current) return 0
    const pinned = pinnedWorldYRef.current
    if (pinned == null) return 0
    return pinned - current.y
  }, [layout.nodeByKey, root.key, stickyAnchorKey])

  const shiftedLayout = useMemo(() => {
    // Combine regular edges with additional edges (for shared meters)
    const allEdges = additionalEdges ? [...layout.edges, ...additionalEdges] : layout.edges

    if (pinDeltaY === 0) {
      return { ...layout, edges: allEdges }
    }
    const nodes = layout.nodes.map((n) => ({ ...n, y: n.y + pinDeltaY }))
    const nodeByKey: Record<string, PositionedNode> = {}
    for (const n of nodes) nodeByKey[n.key] = n
    const bounds = { ...layout.bounds, minY: layout.bounds.minY + pinDeltaY, maxY: layout.bounds.maxY + pinDeltaY }
    return { ...layout, nodes, nodeByKey, bounds, edges: allEdges }
  }, [layout, pinDeltaY, additionalEdges])

  const {
    renderedLayout,
    isTransitioning: isCardViewTransitioning,
    progress: cardViewTransitionProgress,
    beginTransition: beginLayoutTransition,
  } = useAnimatedLayoutTransition(shiftedLayout)

  const handleToggleCardViewMode = useCallback(() => {
    beginLayoutTransition()
    setCardViewMode((mode) => (mode === "compact" ? "detailed" : "compact"))
  }, [beginLayoutTransition])

  return (
    <div className="absolute inset-0">
      <PanZoomCanvas layout={renderedLayout} topInsetPx={topInsetPx} centerKey={stickyAnchorKey ?? effectiveRoot.key} layoutDirection={direction} onBackgroundClick={onBackgroundClick} cardViewMode={cardViewMode} onToggleCardViewMode={handleToggleCardViewMode}>
        {(_panZoom, viewport) => (
          <div className="relative">
            {/* Invisible hover zone covering the entire plan tree (nodes + plus buttons).
                Mouse-enter shows all interactive elements; mouse-leave hides them. */}
            <div
              className="absolute"
              style={{
                left: renderedLayout.bounds.minX - 60,
                top: renderedLayout.bounds.minY - 60,
                width: renderedLayout.bounds.maxX - renderedLayout.bounds.minX + 120,
                height: renderedLayout.bounds.maxY - renderedLayout.bounds.minY + 120,
              }}
              onMouseEnter={() => setIsHoverActive(true)}
              onMouseLeave={() => setIsHoverActive(false)}
              aria-hidden
            />
            {/* edges */}
            <svg
              className="absolute left-0 top-0"
              width={Math.max(1, renderedLayout.bounds.maxX - renderedLayout.bounds.minX + 600)}
              height={Math.max(1, renderedLayout.bounds.maxY - renderedLayout.bounds.minY + 600)}
              style={{ overflow: "visible", pointerEvents: "none" }}
            >
              <defs>
                {/* Dot marker at edge origin (parent node) */}
                <marker id="edge-dot" markerWidth="6" markerHeight="6" refX="3" refY="3" markerUnits="userSpaceOnUse">
                  <circle cx="3" cy="3" r="2.5" fill="#6C7688" />
                </marker>
                {/* Arrow marker at edge destination (child node) – filled triangle */}
                <marker id="edge-arrow" markerWidth="4" markerHeight="8" refX="3.5" refY="3.5" orient="auto" markerUnits="userSpaceOnUse">
                  <path d="M3.53553 3.53553L0 0V7.07107L3.53553 3.53553Z" fill="#6C7688" />
                </marker>
              </defs>
              {renderedLayout.edges.map((e) => {
                const a = renderedLayout.nodeByKey[e.from]
                const b = renderedLayout.nodeByKey[e.to]
                if (!a || !b) return null
                if (!isCardViewTransitioning && !isEdgeVisible(a, b, viewport)) return null

                if (direction === "vertical") {
                  // Vertical layout: edges go from bottom of parent to top of child
                  const x1 = a.x + a.w / 2
                  const y1 = a.y + a.h
                  const x2 = b.x + b.w / 2
                  const y2 = b.y
                  const dx = x2 - x1
                  const dy = y2 - y1
                  const dxAbs = Math.abs(dx)

                  // If nearly vertical, draw straight vertical line
                  if (dxAbs < EDGE_HORIZONTAL_THRESHOLD || dy <= RECT_CHANGE_THRESHOLD) {
                    const d = `M ${x1} ${y1} V ${y2}`
                    return (
                      <path
                        key={`${e.from}->${e.to}`}
                        d={d}
                        stroke="#6C7688" markerStart="url(#edge-dot)" markerEnd="url(#edge-arrow)"
                        strokeWidth="0.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    )
                  }

                  const sign = dx > 0 ? 1 : -1
                  const { lane, r } = calculateEdgeLane(dy, dx)
                  let turnY = y1 + Math.max(lane, r + 0.5)
                  turnY = Math.min(turnY, y2 - r - 1)

                  // Fallback to curve if not enough room
                  if (turnY <= y1 + r + 1) {
                    const c = y1 + dy / 2
                    const d = `M ${x1} ${y1} C ${x1} ${c} ${x2} ${c} ${x2} ${y2}`
                    return (
                      <path
                        key={`${e.from}->${e.to}`}
                        d={d}
                        stroke="#6C7688" markerStart="url(#edge-dot)" markerEnd="url(#edge-arrow)"
                        strokeWidth="0.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    )
                  }

                  const d = [
                    `M ${x1} ${y1}`,
                    `V ${turnY - r}`,
                    `Q ${x1} ${turnY} ${x1 + sign * r} ${turnY}`,
                    `H ${x2 - sign * r}`,
                    `Q ${x2} ${turnY} ${x2} ${turnY + r}`,
                    `V ${y2}`,
                  ].join(" ")
                  return (
                    <path
                      key={`${e.from}->${e.to}`}
                      d={d}
                      stroke="#6C7688" markerStart="url(#edge-dot)" markerEnd="url(#edge-arrow)"
                      strokeWidth="0.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  )
                }

                // Horizontal layout (default): edges go from right of parent to left of child
                const x1 = a.x + a.w
                const y1 = a.y + a.h / 2
                const x2 = b.x
                const y2 = b.y + b.h / 2
                const dy = y2 - y1
                const dx = x2 - x1
                const dyAbs = Math.abs(dy)
                // If the connection is nearly horizontal, avoid the "double elbow" which can look like a squiggle.
                if (dyAbs < EDGE_HORIZONTAL_THRESHOLD || dx <= RECT_CHANGE_THRESHOLD) {
                  const d = `M ${x1} ${y1} H ${x2}`
                  return (
                    <path
                      key={`${e.from}->${e.to}`}
                      d={d}
                      stroke="#6C7688" markerStart="url(#edge-dot)" markerEnd="url(#edge-arrow)"
                      strokeWidth="0.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  )
                }

                const sign = dy > 0 ? 1 : -1
                // Use a stable "lane" like the design (straight -> curve -> straight -> curve -> straight).
                const { lane, r } = calculateEdgeLane(dx, dy)
                const turnX = calculateTurnX(x1, x2, lane, r)

                // If we don't have room for the orthogonal + rounded-corners pattern, fall back to a single smooth curve.
                if (turnX <= x1 + r + 1) {
                  const c = x1 + dx / 2
                  const d = `M ${x1} ${y1} C ${c} ${y1} ${c} ${y2} ${x2} ${y2}`
                  return (
                    <path
                      key={`${e.from}->${e.to}`}
                      d={d}
                      stroke="#6C7688" markerStart="url(#edge-dot)" markerEnd="url(#edge-arrow)"
                      strokeWidth="0.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  )
                }

                const d = [
                  `M ${x1} ${y1}`,
                  `H ${turnX - r}`,
                  `Q ${turnX} ${y1} ${turnX} ${y1 + sign * r}`,
                  `V ${y2 - sign * r}`,
                  `Q ${turnX} ${y2} ${turnX + r} ${y2}`,
                  `H ${x2}`,
                ].join(" ")
                return (
                  <path
                    key={`${e.from}->${e.to}`}
                    d={d}
                    stroke="#6C7688" markerStart="url(#edge-dot)" markerEnd="url(#edge-arrow)"
                    strokeWidth="0.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                )
              })}
            </svg>

            {renderedLayout.nodes.map((n) => {
              if (!isCardViewTransitioning && !isNodeVisible(n, viewport)) return null
              const isExpanded = expandedByKey[n.key] !== false
              const isCollapsible = Boolean((n.children?.length ?? 0) > 0)
              return (
                <div
                  key={n.key}
                  className="absolute"
                  style={{
                    left: n.x,
                    top: n.y,
                    width: n.w,
                    height: n.h,
                    pointerEvents: isCardViewTransitioning ? "none" : undefined,
                  }}
                  onMouseEnter={!isCardViewTransitioning ? () => handleNodeMouseEnter(n.key) : undefined}
                  onMouseLeave={!isCardViewTransitioning ? handleNodeMouseLeave : undefined}
                >
                  <NodeCard
                    node={n}
                    cardViewMode={cardViewMode}
                    layoutTransition={
                      isCardViewTransitioning
                        ? { progress: cardViewTransitionProgress, targetMode: cardViewMode }
                        : undefined
                    }
                    isExpanded={isExpanded}
                    isCollapsible={isCollapsible}
                    isSelected={
                      (selectedNodeKeys && selectedNodeKeys.includes(n.key)) ||
                      (selectedNodeKey != null && selectedNodeKey === n.key)
                    }
                    onToggleExpanded={() =>
                      setExpandedByKey((prev) => ({ ...prev, [n.key]: !(prev[n.key] !== false) }))
                    }
                    onOpenActions={(rect) => openActions(n.key, rect)}
                    onOpenAssistant={onOpenAssistant}
                    onContextMenu={onNodeContextMenu}
                  />
                </div>
              )
            })}

            {/* Relationship labels on edges (rendered before plus buttons so buttons appear on top).
                Deduplicated: only one label per parent+label combo to avoid duplicate "includes" on forks. */}
            {mapInteractive && (() => {
              const rendered = new Set<string>()
              return renderedLayout.edges.map((e) => {
                const a = renderedLayout.nodeByKey[e.from]
                const b = renderedLayout.nodeByKey[e.to]
                if (!a || !b) return null
                if (!isEdgeVisible(a, b, viewport)) return null

                const labelText = getRelationshipLabel(e.from, e.to)
                if (!labelText) return null

                // Deduplicate: only show one label per parent + label text combo
                const dedupKey = `${e.from}:${labelText}`
                if (rendered.has(dedupKey)) return null
                rendered.add(dedupKey)

                const pos = calculateEdgeLabelPosition(a, b, direction)
                if (!pos) return null

                return (
                  <EdgeLabel
                    key={`label-${e.from}->${e.to}`}
                    x={pos.x}
                    y={pos.y}
                    text={labelText}
                    isVisible={isHoverActive}
                    interactionDisabled={isCardViewTransitioning}
                    onGroupEnter={() => handleNodeMouseEnter(e.from)}
                    onGroupLeave={handleNodeMouseLeave}
                  />
                )
              })
            })()}

            {/* Plus buttons on edges */}
            {mapInteractive && renderedLayout.edges.map((e) => {
              const a = renderedLayout.nodeByKey[e.from]
              const b = renderedLayout.nodeByKey[e.to]
              if (!a || !b) return null
              if (!isEdgeVisible(a, b, viewport)) return null

              // Helper to check if key matches pattern (handles prefixed keys like "plan1:plan" or "plan1:rateCard:1")
              const keyEndsWith = (key: string, suffix: string) => key === suffix || key.endsWith(`:${suffix}`)
              const keyContains = (key: string, pattern: string) => key.includes(pattern)

              // Determine if this edge should have a plus button
              // Check for plan node (handles both "plan" and prefixed keys like "plan1:plan")
              const isPlanToChild = keyEndsWith(e.from, "plan") && onAddPlanObject
              // Check for rate card to rate edges (handles prefixed keys)
              const isRateCardToRate = keyContains(e.from, "rateCard:") && keyContains(e.to, "rate:") && !keyContains(e.to, "rateMeter:") && onAddRate

              if (!isPlanToChild && !isRateCardToRate) return null

              // Only show plus button on the first edge from plan (to avoid multiple buttons)
              if (isPlanToChild) {
                const planNode = renderedLayout.nodeByKey[e.from]
                const firstChildKey = planNode?.children?.[0]?.key
                if (firstChildKey !== e.to) return null
              }

              // Only show plus button on the first edge from rate card to rate
              if (isRateCardToRate) {
                const rateCardNode = renderedLayout.nodeByKey[e.from]
                const firstRateKey = rateCardNode?.children?.find(c => keyContains(c.key, "rate:") && !keyContains(c.key, "rateMeter:"))?.key
                if (firstRateKey !== e.to) return null
              }

              // Position the plus button:
              // - Multiple children: at the fork/junction (turnX/turnY) on the edge
              // - Single child: right next to the source node's edge
              const parentNode = renderedLayout.nodeByKey[e.from]
              const childCount = parentNode?.children?.length ?? 1
              const PLUS_OFFSET = 16 // Distance from the source node edge
              let btnX: number
              let btnY: number

              if (direction === "vertical") {
                btnX = a.x + a.w / 2
                if (childCount > 1) {
                  const y1 = a.y + a.h
                  const y2 = b.y
                  const dy = y2 - y1
                  const dx = (b.x + b.w / 2) - (a.x + a.w / 2)
                  const { lane, r } = calculateEdgeLane(dy, dx)
                  let turnY = y1 + Math.max(lane, r + 0.5)
                  turnY = Math.min(turnY, y2 - r - 1)
                  btnY = turnY
                } else {
                  btnY = a.y + a.h + PLUS_OFFSET
                }
              } else {
                btnY = a.y + a.h / 2
                if (childCount > 1) {
                  const x1 = a.x + a.w
                  const x2 = b.x
                  const dx = x2 - x1
                  const dy = (b.y + b.h / 2) - (a.y + a.h / 2)
                  const { lane, r } = calculateEdgeLane(dx, dy)
                  btnX = calculateTurnX(x1, x2, lane, r)
                } else {
                  btnX = a.x + a.w + PLUS_OFFSET
                }
              }

              const handleClick = (event: React.MouseEvent) => {
                event.stopPropagation()
                if (isPlanToChild && onAddPlanObject) {
                  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
                  onAddPlanObject({
                    top: rect.top,
                    left: rect.right + ADD_BUTTON_HORIZONTAL_GAP,
                  })
                } else if (isRateCardToRate && onAddRate) {
                  // Extract the rate card ID from the key (handles "rateCard:1" and "plan1:rateCard:1")
                  const match = e.from.match(/rateCard:(\d+)/)
                  const rateCardId = match ? parseInt(match[1], 10) : NaN
                  if (!Number.isNaN(rateCardId)) {
                    onAddRate(rateCardId)
                  }
                }
              }

              const label = isPlanToChild ? "Add object" : "Add rate"
              return (
                <PlusButton
                  key={`plus-${e.from}->${e.to}`}
                  x={btnX}
                  y={btnY}
                  label={label}
                  onClick={handleClick}
                  isVisible={isHoverActive}
                  interactionDisabled={isCardViewTransitioning}
                  onGroupEnter={() => handleNodeMouseEnter(e.from)}
                  onGroupLeave={handleNodeMouseLeave}
                />
              )
            })}

            {/* Plus buttons on plan nodes when they have no regular children (rate cards) */}
            {mapInteractive && onAddPlanObject && Object.entries(renderedLayout.nodeByKey)
              .filter(([key]) => key === "plan" || key.endsWith(":plan"))
              .filter(([, node]) => !(node.children?.length))
              .map(([planKey, planNode]) => {
                // Position button on the edge where children would connect
                const btnX = direction === "vertical"
                  ? planNode.x + planNode.w / 2
                  : planNode.x + planNode.w + 12
                const btnY = direction === "vertical"
                  ? planNode.y + planNode.h + 12
                  : planNode.y + planNode.h / 2
                return (
                  <PlusButton
                    key={`plus-empty-${planKey}`}
                    x={btnX}
                    y={btnY}
                    label="Add object"
                    isVisible={isHoverActive}
                    interactionDisabled={isCardViewTransitioning}
                    onGroupEnter={() => handleNodeMouseEnter(planKey)}
                    onGroupLeave={handleNodeMouseLeave}
                    onClick={(event) => {
                      event.stopPropagation()
                      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
                      onAddPlanObject({
                        top: rect.top,
                        left: rect.right + ADD_BUTTON_HORIZONTAL_GAP,
                      })
                    }}
                  />
                )
              })}

            {/* Plus buttons on rate card nodes when they have no rate children */}
            {mapInteractive && onAddRate && Object.entries(renderedLayout.nodeByKey)
              .filter(([key]) => key.includes("rateCard:"))
              .filter(([rateCardKey]) => {
                // Check if this rate card has any edges to rate nodes (not rateMeter nodes)
                const hasRateChildren = renderedLayout.edges.some(e =>
                  e.from === rateCardKey && e.to.includes("rate:") && !e.to.includes("rateMeter:")
                )
                return !hasRateChildren
              })
              .map(([rateCardKey, rateCardNode]) => {
                // Extract the rate card ID from the key (handles "rateCard:1" and "plan1:rateCard:1")
                const match = rateCardKey.match(/rateCard:(\d+)/)
                const rateCardId = match ? parseInt(match[1], 10) : NaN
                if (Number.isNaN(rateCardId)) return null

                // Position button on the edge where children would connect
                const btnX = direction === "vertical"
                  ? rateCardNode.x + rateCardNode.w / 2
                  : rateCardNode.x + rateCardNode.w + 12
                const btnY = direction === "vertical"
                  ? rateCardNode.y + rateCardNode.h + 12
                  : rateCardNode.y + rateCardNode.h / 2
                return (
                  <PlusButton
                    key={`plus-empty-rc-${rateCardKey}`}
                    x={btnX}
                    y={btnY}
                    label="Add rate"
                    isVisible={isHoverActive}
                    interactionDisabled={isCardViewTransitioning}
                    onGroupEnter={() => handleNodeMouseEnter(rateCardKey)}
                    onGroupLeave={handleNodeMouseLeave}
                    onClick={(event) => {
                      event.stopPropagation()
                      onAddRate(rateCardId)
                    }}
                  />
                )
              })}

          </div>
        )}
      </PanZoomCanvas>

      {SHOW_NODE_ACTIONS_POPOVER && actionsNodeKey && actionsRect && onOpenAssistant ? (
        <NodeActionsPopover
          anchorRect={actionsRect}
          onClose={closeActions}
          reference={(() => {
            const n = shiftedLayout.nodeByKey[actionsNodeKey]
            const label = n?.title?.trim() ? n.title : n?.headerLabel ?? "Item"
            const kind: AssistantReferenceKind =
              actionsNodeKey === "plan"
                ? "plan"
                : actionsNodeKey.startsWith("rateCard:")
                  ? "rateCard"
                  : actionsNodeKey.startsWith("rate:")
                    ? "rate"
                    : actionsNodeKey.startsWith("rateMeter:")
                      ? "rateMeter"
                      : actionsNodeKey.startsWith("creditGrant:")
                        ? "creditGrant"
                        : actionsNodeKey.startsWith("subscriptionFee:")
                          ? "subscriptionFee"
                          : actionsNodeKey === "product"
                            ? "product"
                            : actionsNodeKey.startsWith("price:")
                              ? "price"
                              : actionsNodeKey === "meter"
                                ? "meter"
                                : "product"
            return { kind, label }
          })()}
          onAskForChanges={(ref) => onOpenAssistant(ref)}
        />
      ) : null}
    </div>
  )
}
