"use client"

import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"
import { GLYPH_CONFIG_BY_KIND, normalizeKind, CatalogObjectGlyph } from "@/components/product-catalog/iconography"
import type { AssistantReference } from "@/components/ProductAssistantPanel"
import { getTooltipPosition } from "@/components/product-catalog/tooltipPositioning"
import type { PositionedNode, DetailRow } from "./objectMapTypes"
import { nodeKeyToGlyphKind } from "./objectMapTypes"
import type { CardViewMode } from "./PanZoomCanvas"
import { PlusCircleIcon12, MinusCircleIcon12 } from "./objectMapIcons"
import { getNodeReferenceKind } from "./nodeKeyUtils"

export type NodeContextMenuInfo = {
  position: { top: number; left: number }
  nodeKey: string
  label: string
}

export type NodeCardLayoutTransition = {
  /** 0–1 progress of compact ↔ detailed morph */
  progress: number
  /** Layout mode after the transition completes (current committed mode while animating). */
  targetMode: CardViewMode
}

function detailOpacityDuringTransition(
  transition: NodeCardLayoutTransition,
  hasDetailedContent: boolean,
): number {
  if (!hasDetailedContent) return 0
  const { progress, targetMode } = transition
  if (targetMode === "detailed") {
    if (progress <= 0.18) return 0
    return Math.min(1, (progress - 0.18) / 0.58)
  }
  // Morphing toward compact: fade details out before the box finishes shrinking
  if (progress >= 0.48) return 0
  return Math.max(0, 1 - progress / 0.42)
}

export const NodeCard = memo(function NodeCard({
  node,
  cardViewMode = "compact",
  layoutTransition,
  isExpanded,
  isCollapsible,
  onToggleExpanded,
  onOpenActions,
  isSelected,
  onOpenAssistant,
  onContextMenu,
}: {
  node: PositionedNode
  cardViewMode?: CardViewMode
  layoutTransition?: NodeCardLayoutTransition
  isExpanded: boolean
  isCollapsible: boolean
  onToggleExpanded?: () => void
  onOpenActions?: (rect: DOMRect) => void
  isSelected?: boolean
  onOpenAssistant?: (ref: AssistantReference) => void
  onContextMenu?: (info: NodeContextMenuInfo) => void
}) {

  // Get glyph config for icon color
  const glyphKind = normalizeKind(nodeKeyToGlyphKind(node.key))
  const glyphConfig = GLYPH_CONFIG_BY_KIND[glyphKind]

  const textSize = "text-[12px] font-[400] leading-[20px] tracking-[-0.15px]"
  const titleTextColor = node.titleIsPlaceholder ? "text-[#6C7688]" : "text-[#1A2C44]"

  const isMeteredItem = node.key.includes("meteredItem:")
  const isDetailed = cardViewMode === "detailed"

  // Display name: use title (object name) if available, fall back to headerLabel (type name)
  const displayName = node.title?.trim() || node.headerLabel

  const hasDetailedContent = (
    (node.detailRows && node.detailRows.length > 0) ||
    (node.pricingTiers && node.pricingTiers.length > 0)
  )
  const showDetailSection =
    hasDetailedContent &&
    (layoutTransition
      ? layoutTransition.targetMode === "detailed"
        ? true
        : layoutTransition.progress < 0.52
      : isDetailed)
  const detailOpacityStyle =
    layoutTransition && hasDetailedContent
      ? { opacity: detailOpacityDuringTransition(layoutTransition, hasDetailedContent) }
      : undefined

  // Type tooltip: show object type (headerLabel) on card hover
  const [showIconTooltip, setShowIconTooltip] = useState(false)
  const [iconTooltipPos, setIconTooltipPos] = useState<{ top: number; left: number } | null>(null)
  const cardRef = useRef<HTMLDivElement | null>(null)
  const iconTooltipRef = useRef<HTMLDivElement | null>(null)

  const updateIconTooltipPosition = useCallback(() => {
    if (!showIconTooltip || !cardRef.current || !iconTooltipRef.current) return
    const next = getTooltipPosition({
      anchorRect: cardRef.current.getBoundingClientRect(),
      tooltipRect: iconTooltipRef.current.getBoundingClientRect(),
      preferredSide: "top",
    })
    setIconTooltipPos({ top: next.top, left: next.left })
  }, [showIconTooltip])

  useLayoutEffect(() => {
    if (!showIconTooltip) {
      setIconTooltipPos(null)
      return
    }
    updateIconTooltipPosition()
  }, [showIconTooltip, node.headerLabel, updateIconTooltipPosition])

  useEffect(() => {
    if (!showIconTooltip) return
    window.addEventListener("resize", updateIconTooltipPosition)
    window.addEventListener("scroll", updateIconTooltipPosition, true)
    return () => {
      window.removeEventListener("resize", updateIconTooltipPosition)
      window.removeEventListener("scroll", updateIconTooltipPosition, true)
    }
  }, [showIconTooltip, updateIconTooltipPosition])

  const cardContent = (
    <div
      className={cn(
        "h-full w-full overflow-hidden rounded-[6px]",
        isMeteredItem
          ? "border border-dashed border-[#BAC8DA] bg-[#F4F7FA]"
          : cn(
              "bg-white shadow-[0px_2px_5px_0px_rgba(48,49,61,0.08),0px_1px_1px_0px_rgba(0,0,0,0.12)]",
              isSelected && "shadow-[0_15px_35px_rgba(48,49,61,0.08),0_5px_15px_rgba(0,0,0,0.12)]"
            )
      )}
      style={{ width: "100%", height: "100%" }}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Title row: icon + name */}
      <div className="flex items-center gap-[6px] px-[8px] py-[4px]">
        <span
          className="shrink-0 relative top-[1px]"
          style={{ color: glyphConfig.iconColor }}
        >
          <CatalogObjectGlyph kind={glyphKind} />
        </span>
        <span className={cn("min-w-0 truncate", textSize, titleTextColor)}>
          {displayName}
        </span>
      </div>
      {/* Detail section — shown in detailed mode */}
      {showDetailSection && (
        <div
          className={cn(
            "border-t border-[#ECF1F6] px-[8px] py-[6px]",
            layoutTransition && "motion-reduce:transition-none",
          )}
          style={detailOpacityStyle}
        >
          <div className="flex flex-col gap-[8px]">
            {/* Pricing tiers (for rates) */}
            {node.pricingTiers && node.pricingTiers.length > 0 ? (
              node.pricingTiers.map((tier, idx) => (
                <div key={idx} className="flex items-start gap-[14px] text-[10px] font-[400] leading-[10px] tracking-[0.1px] text-[#50617A]">
                  <span className="w-[51px] shrink-0">{tier.label}</span>
                  <span className="whitespace-nowrap">{tier.price}</span>
                </div>
              ))
            ) : (
              /* Detail rows (for subscription fees, credit grants, rate cards) */
              node.detailRows?.map((row, idx) => (
                <div key={idx} className="flex items-start gap-[14px] text-[10px] font-[400] leading-[10px] tracking-[0.1px] text-[#50617A]">
                  <span className="shrink-0">{row.label}</span>
                  <span className={cn("whitespace-nowrap", row.isPlaceholder ? "text-[#667691] italic" : "font-[500]")}>{row.value}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )

  const tooltipPortal = showIconTooltip && typeof document !== "undefined" && createPortal(
    <div
      ref={iconTooltipRef}
      className="fixed z-[9999] rounded-[8px] border border-[#D4DEE9] bg-white px-[10px] py-[4px] shadow-[0px_5px_15px_0px_rgba(0,0,0,0.12),0px_15px_35px_0px_rgba(48,49,61,0.08)]"
      style={{
        top: iconTooltipPos?.top ?? 0,
        left: iconTooltipPos?.left ?? 0,
        visibility: iconTooltipPos ? "visible" : "hidden",
      }}
    >
      <p className="whitespace-nowrap text-[12px] font-medium leading-[20px] tracking-[-0.15px] text-[#353A44]">{node.headerLabel}</p>
    </div>,
    document.body,
  )

  if (!node.onClick) {
    return (
      <div
        ref={cardRef}
        className="h-full w-full"
        data-coachmark={node.coachmarkId}
        data-object-map-node={node.key}
        onMouseEnter={() => setShowIconTooltip(true)}
        onMouseLeave={() => setShowIconTooltip(false)}
      >
        {cardContent}
        {tooltipPortal}
      </div>
    )
  }

  return (
    <div
      ref={cardRef}
      role="button"
      tabIndex={0}
      className="h-full w-full text-left outline-none"
      data-object-map-node={node.key}
      data-coachmark={node.coachmarkId}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseEnter={() => setShowIconTooltip(true)}
      onMouseLeave={() => setShowIconTooltip(false)}
      onClick={(e) => {
        // Support both Shift and Command/Ctrl for multi-select
        const isMultiSelect = e.shiftKey || e.metaKey || e.ctrlKey
        node.onClick?.(isMultiSelect)
        onOpenActions?.((e.currentTarget as HTMLElement).getBoundingClientRect())
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          node.onClick?.()
          onOpenActions?.((e.currentTarget as HTMLElement).getBoundingClientRect())
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onContextMenu?.({
          position: { top: e.clientY, left: e.clientX },
          nodeKey: node.key,
          label: node.title?.trim() || node.headerLabel,
        })
      }}
      aria-label={`${node.headerLabel}: ${node.title}`}
    >
      {cardContent}
      {tooltipPortal}
    </div>
  )
})
