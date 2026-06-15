"use client"

import { memo, useEffect, useRef } from "react"
import { getGlyphTextColor } from "@/components/product-catalog/iconography"
import type { LayoutResult, PanZoom } from "./objectMapTypes"
import { nodeKeyToGlyphKind } from "./objectMapTypes"

const MINIMAP_WIDTH = 120
const MINIMAP_HEIGHT = 80
const PADDING = 8

/**
 * Canvas-drawn node dots — only re-paints when layout changes,
 * not on every pan/zoom frame.
 */
const MinimapCanvas = memo(function MinimapCanvas({
  layout,
  minimapScale,
}: {
  layout: LayoutResult
  minimapScale: number
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = MINIMAP_WIDTH * dpr
    canvas.height = MINIMAP_HEIGHT * dpr
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT)

    const { minX, minY } = layout.bounds

    for (const node of layout.nodes) {
      const x = PADDING + (node.x - minX) * minimapScale
      const y = PADDING + (node.y - minY) * minimapScale
      const w = Math.max(2, node.w * minimapScale)
      const h = Math.max(2, node.h * minimapScale)
      const color = node.muted ? "#E8ECF0" : getGlyphTextColor(nodeKeyToGlyphKind(node.key))

      ctx.globalAlpha = 0.5
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.roundRect(x, y, w, h, 1)
      ctx.fill()
    }
  }, [layout, minimapScale, dpr])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0"
      style={{ width: MINIMAP_WIDTH, height: MINIMAP_HEIGHT }}
    />
  )
})

export function Minimap({
  layout,
  panZoom,
  containerWidth,
  containerHeight,
  onNavigate,
}: {
  layout: LayoutResult
  panZoom: PanZoom
  containerWidth: number
  containerHeight: number
  onNavigate: (worldX: number, worldY: number) => void
}) {
  const { minX, minY, maxX, maxY } = layout.bounds
  const worldWidth = Math.max(1, maxX - minX)
  const worldHeight = Math.max(1, maxY - minY)

  const scaleX = (MINIMAP_WIDTH - PADDING * 2) / worldWidth
  const scaleY = (MINIMAP_HEIGHT - PADDING * 2) / worldHeight
  const minimapScale = Math.min(scaleX, scaleY)

  const viewportWorldX = -panZoom.x / panZoom.scale
  const viewportWorldY = -panZoom.y / panZoom.scale
  const viewportWorldW = containerWidth / panZoom.scale
  const viewportWorldH = containerHeight / panZoom.scale

  const viewportMinimapX = PADDING + (viewportWorldX - minX) * minimapScale
  const viewportMinimapY = PADDING + (viewportWorldY - minY) * minimapScale
  const viewportMinimapW = viewportWorldW * minimapScale
  const viewportMinimapH = viewportWorldH * minimapScale

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top

    const worldX = minX + (clickX - PADDING) / minimapScale
    const worldY = minY + (clickY - PADDING) / minimapScale
    onNavigate(worldX, worldY)
  }

  return (
    <div
      className="absolute top-[72px] lg:top-[24px] right-[24px] lg:right-[24px] rounded-[8px] bg-white/90 backdrop-blur-sm border border-[#D8DEE4] shadow-sm cursor-pointer"
      style={{ width: MINIMAP_WIDTH, height: MINIMAP_HEIGHT }}
      onClick={handleClick}
      aria-label="Minimap navigation"
    >
      <MinimapCanvas layout={layout} minimapScale={minimapScale} />
      {/* Viewport rectangle */}
      <div
        className="absolute border border-[#D8DEE4] rounded-[6px] pointer-events-none"
        style={{
          left: Math.max(0, viewportMinimapX),
          top: Math.max(0, viewportMinimapY),
          width: Math.min(viewportMinimapW, MINIMAP_WIDTH - Math.max(0, viewportMinimapX)),
          height: Math.min(viewportMinimapH, MINIMAP_HEIGHT - Math.max(0, viewportMinimapY)),
        }}
      />
    </div>
  )
}
