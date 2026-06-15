'use client'

import type { ReactNode } from "react"
import { useEffect, useMemo, useState } from "react"
// @ts-expect-error - framer-motion v12 type declaration issue with bundler resolution
import { motion, useDragControls, useMotionValue, useSpring } from "framer-motion"

type MobilePreviewSheetProps = {
  children: ReactNode
  /** Height of the visible "peek" state (grabber + a sliver of content). */
  collapsedHeightPx?: number
  /** Max fraction of viewport height the sheet can expand to. */
  maxHeightVh?: number
  /** Leave this much space at the top (e.g. to sit below the modal header). */
  topInsetPx?: number
  /** Start expanded instead of collapsed. */
  defaultExpanded?: boolean
}

export function MobilePreviewSheet({
  children,
  collapsedHeightPx = 44,
  maxHeightVh = 1,
  topInsetPx = 72,
  defaultExpanded = false,
}: MobilePreviewSheetProps) {
  const dragControls = useDragControls()
  const yRaw = useMotionValue(0)
  const y = useSpring(yRaw, { stiffness: 420, damping: 42 })
  const [expandedHeightPx, setExpandedHeightPx] = useState<number>(520)
  const [midHeightPx, setMidHeightPx] = useState<number>(380)

  useEffect(() => {
    if (typeof window === "undefined") return
    const compute = () => {
      const vh = window.innerHeight || 0
      const maxByInset = Math.max(240, vh - topInsetPx)
      const maxByVh = Math.max(240, Math.round(vh * maxHeightVh))
      const next = Math.max(320, Math.min(maxByInset, maxByVh))
      setExpandedHeightPx(next)
      // Middle stop: ~45% viewport, clamped to stay between collapsed and expanded.
      const mid = Math.max(collapsedHeightPx + 160, Math.min(Math.round(vh * 0.45), next - 120))
      setMidHeightPx(mid)
    }
    compute()
    window.addEventListener("resize", compute)
    return () => window.removeEventListener("resize", compute)
  }, [collapsedHeightPx, maxHeightVh, topInsetPx])

  const collapsedY = useMemo(() => Math.max(0, expandedHeightPx - collapsedHeightPx), [expandedHeightPx, collapsedHeightPx])
  const midY = useMemo(() => Math.max(0, expandedHeightPx - midHeightPx), [expandedHeightPx, midHeightPx])
  const stops = useMemo(() => [collapsedY, midY, 0].sort((a, b) => b - a), [collapsedY, midY])

  const snapTo = (targetY: number) => {
    yRaw.set(targetY)
  }

  useEffect(() => {
    // Initialize to collapsed so we just show the grabber (matches Figma behavior).
    yRaw.jump(defaultExpanded ? 0 : collapsedY)
  }, [collapsedY, defaultExpanded, yRaw])

  return (
    <motion.div
      className="fixed inset-x-0 bottom-0 z-40 sm:hidden"
      style={{ height: expandedHeightPx, y }}
      drag="y"
      dragListener={false}
      dragControls={dragControls}
      dragConstraints={{ top: 0, bottom: collapsedY }}
      dragElastic={0.06}
      onDragEnd={(_: unknown, info: { velocity: { y: number } }) => {
        const current = y.get()
        const v = info.velocity.y

        // If user "flicked", move to the next stop in that direction.
        if (Math.abs(v) > 220) {
          const sorted = stops.slice().sort((a, b) => a - b) // 0..collapsed
          const idx = sorted.findIndex((s) => Math.abs(s - current) < 0.5) // rarely exact
          const nearestIdx = idx >= 0 ? idx : sorted.reduce((best, s, i) => (Math.abs(s - current) < Math.abs(sorted[best]! - current) ? i : best), 0)
          const nextIdx = v > 0 ? Math.min(sorted.length - 1, nearestIdx + 1) : Math.max(0, nearestIdx - 1)
          snapTo(sorted[nextIdx]!)
          return
        }

        // Otherwise snap to nearest stop.
        const nearest = stops.reduce((best, s) => (Math.abs(s - current) < Math.abs(best - current) ? s : best), stops[0]!)
        snapTo(nearest)
      }}
    >
      <div className="h-full w-full overflow-hidden rounded-t-[12px] border border-[#EBEEF1] bg-[#F5F6F8] shadow-[0_-8px_24px_rgba(33,37,44,0.12)]">
        {/* Grabber */}
        <div
          className="flex h-[32px] w-full items-center justify-center"
          style={{ touchAction: "none" }}
          onPointerDown={(e) => dragControls.start(e)}
          onDoubleClick={() => {
            const current = y.get()
            // Toggle between middle and bottom (nice for quick access).
            snapTo(current > (collapsedY + midY) / 2 ? midY : collapsedY)
          }}
        >
          <div className="h-[6px] w-[32px] rounded-[40px] bg-[#D8DEE4]" />
        </div>

        {/* Content */}
        <div className="h-[calc(100%-32px)] overflow-y-auto">{children}</div>
      </div>
    </motion.div>
  )
}


