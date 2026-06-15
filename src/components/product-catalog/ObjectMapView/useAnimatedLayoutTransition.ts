"use client"

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import type { LayoutResult, PositionedNode } from "./objectMapTypes"

export const CARD_VIEW_ANIMATION_MS = 320

function lerp(from: number, to: number, progress: number) {
  return from + (to - from) * progress
}

function easeOutCubic(progress: number) {
  return 1 - Math.pow(1 - progress, 3)
}

/**
 * Interpolate every node's x/y/w/h between two layout snapshots so nodes and edges
 * share one geometry source during compact/detailed transitions.
 */
export function interpolateLayout(from: LayoutResult, to: LayoutResult, progress: number): LayoutResult {
  const eased = easeOutCubic(progress)
  const nodes = to.nodes.map((node) => {
    const previous = from.nodeByKey[node.key] ?? node
    return {
      ...node,
      x: lerp(previous.x, node.x, eased),
      y: lerp(previous.y, node.y, eased),
      w: lerp(previous.w, node.w, eased),
      h: lerp(previous.h, node.h, eased),
    }
  })
  const nodeByKey: Record<string, PositionedNode> = {}
  for (const node of nodes) nodeByKey[node.key] = node
  return {
    ...to,
    nodes,
    nodeByKey,
    bounds: {
      minX: Math.min(from.bounds.minX, to.bounds.minX),
      minY: Math.min(from.bounds.minY, to.bounds.minY),
      maxX: Math.max(from.bounds.maxX, to.bounds.maxX),
      maxY: Math.max(from.bounds.maxY, to.bounds.maxY),
    },
  }
}

/**
 * Single source of truth for compact/detailed layout morphing.
 * Call beginTransition() synchronously before updating cardViewMode so the "from"
 * snapshot is the last settled layout.
 */
export function useAnimatedLayoutTransition(
  toLayout: LayoutResult,
  durationMs: number = CARD_VIEW_ANIMATION_MS,
) {
  const stableLayoutRef = useRef<LayoutResult | null>(null)
  const fromLayoutRef = useRef<LayoutResult | null>(null)
  const rafRef = useRef<number | null>(null)

  const [phase, setPhase] = useState<"idle" | "running">("idle")
  const [progress, setProgress] = useState(1)

  // While idle, keep a ref to the last committed layout for the next transition's "from".
  useLayoutEffect(() => {
    if (phase === "idle") {
      stableLayoutRef.current = toLayout
    }
  }, [toLayout, phase])

  const beginTransition = useCallback(() => {
    const from = stableLayoutRef.current
    if (!from) return
    fromLayoutRef.current = from
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    setPhase("running")
    setProgress(0)
  }, [])

  useEffect(() => {
    if (phase !== "running" || !fromLayoutRef.current) return

    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs)
      setProgress(p)
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        rafRef.current = null
        fromLayoutRef.current = null
        setPhase("idle")
        setProgress(1)
      }
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [phase, durationMs])

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const renderedLayout = useMemo(() => {
    if (phase !== "running" || !fromLayoutRef.current) return toLayout
    return interpolateLayout(fromLayoutRef.current, toLayout, progress)
  }, [phase, toLayout, progress])

  const isTransitioning = phase === "running"

  return {
    renderedLayout,
    isTransitioning,
    progress,
    beginTransition,
  }
}
