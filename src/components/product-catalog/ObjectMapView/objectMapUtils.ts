/**
 * Utility functions for ObjectMapView tree layout and positioning
 */

import type { TreeNode, PositionedNode, LayoutResult } from "./objectMapTypes"
import type { CascadeAlignment } from "../cascadeAlignment"

// Connector gap: space between the right edge of one column and the left edge of the next
export const CONNECTOR_GAP_X = 30
export const ROW_GAP_Y = 24

// Legacy export kept for any external consumers
export const GRID_COL_X = 270

// For vertical layout, we need different spacing
export const VERTICAL_DEPTH_GAP = 140  // Vertical gap between depth levels
export const VERTICAL_SIBLING_GAP = 28  // Horizontal gap between siblings

export type LayoutDirection = "horizontal" | "vertical"

/**
 * Compute the tree layout for a hierarchical node structure.
 * Places nodes in columns based on depth, with adaptive column widths
 * that match the widest node at each depth level.
 *
 * Horizontal (default): depth increases X (left-to-right), siblings stack Y (top-to-bottom)
 * Vertical: depth increases Y (top-to-bottom), siblings stack X (left-to-right)
 */
export function computeTreeLayout(args: {
  root: TreeNode
  isExpandedByKey: Record<string, boolean>
  rowGapY?: number
  colGapX?: number
  origin?: { x: number; y: number }
  direction?: LayoutDirection
  cascadeAlignment?: CascadeAlignment
}): LayoutResult {
  const direction = args.direction ?? "horizontal"
  const cascadeAlignment = args.cascadeAlignment ?? "top"
  const connectorGap = args.colGapX ?? CONNECTOR_GAP_X
  const origin = args.origin ?? { x: 0, y: 0 }

  // For vertical layout, use different gap values
  const siblingGap = direction === "horizontal"
    ? (args.rowGapY ?? ROW_GAP_Y)
    : VERTICAL_SIBLING_GAP

  const nodes: PositionedNode[] = []
  const edges: { from: string; to: string }[] = []
  const nodeByKey: Record<string, PositionedNode> = {}

  // --- Pass 1: collect the max node size at each depth level ---
  const maxSizeByDepth: Record<number, number> = {}

  const collectDepthSizes = (n: TreeNode, depth: number) => {
    if (n.hidden) {
      for (const child of n.children ?? []) {
        collectDepthSizes(child, depth) // hidden nodes don't increment depth
      }
      return
    }
    const size = direction === "horizontal" ? n.w : n.h
    maxSizeByDepth[depth] = Math.max(maxSizeByDepth[depth] ?? 0, size)

    const expanded = args.isExpandedByKey[n.key] !== false
    const kids = expanded ? (n.children ?? []) : []
    for (const child of kids) {
      collectDepthSizes(child, depth + 1)
    }
    // Attached nodes live at depth+1 (same column as normal children)
    for (const attached of n.attachedNodes ?? []) {
      const aSize = direction === "horizontal" ? attached.w : attached.h
      maxSizeByDepth[depth + 1] = Math.max(maxSizeByDepth[depth + 1] ?? 0, aSize)
    }
  }
  collectDepthSizes(args.root, 0)

  // Compute cumulative positions for each depth level
  const maxDepth = Math.max(0, ...Object.keys(maxSizeByDepth).map(Number))
  const depthStart: Record<number, number> = {}
  const depthOrigin = direction === "horizontal" ? origin.x : origin.y
  depthStart[0] = depthOrigin
  for (let d = 1; d <= maxDepth; d++) {
    depthStart[d] = depthStart[d - 1] + (maxSizeByDepth[d - 1] ?? 0) + connectorGap
  }

  // For vertical layout, depth gap for non-adaptive fallback
  const verticalDepthGap = VERTICAL_DEPTH_GAP

  // --- Contour-based layout helpers (for "top" cascade) ---
  // A contour maps depth → maxY (relative to subtree start at Y=0).
  // This enables packing siblings as tightly as possible without overlap at any depth level.
  type DepthContour = Record<number, number>

  const getNodeSize = (n: TreeNode) => direction === "horizontal" ? n.h : n.w

  /**
   * Compute the bottom contour of a subtree using contour-based child packing.
   * Returns: for each depth level, the max Y extent relative to the subtree starting at Y=0.
   */
  const computeSubtreeContour = (n: TreeNode, depth: number): DepthContour => {
    if (n.hidden) {
      const kids = n.children ?? []
      if (!kids.length) return {}
      return packChildrenContour(kids, depth)
    }

    const nodeSize = getNodeSize(n)
    const result: DepthContour = { [depth]: nodeSize }

    const expanded = args.isExpandedByKey[n.key] !== false
    const kids = expanded ? (n.children ?? []) : []

    // Merge children contour first
    if (kids.length) {
      const childrenContour = packChildrenContour(kids, depth + 1)
      for (const dStr of Object.keys(childrenContour)) {
        const d = Number(dStr)
        result[d] = Math.max(result[d] ?? 0, childrenContour[d])
      }
    }

    // Attached nodes at depth+1 — placed AFTER children's extent at that depth
    if (n.attachedNodes?.length && direction === "horizontal") {
      const childrenExtent = result[depth + 1] ?? nodeSize
      let y = childrenExtent
      for (const a of n.attachedNodes) {
        y += siblingGap + a.h
      }
      result[depth + 1] = y
    }

    return result
  }

  /**
   * Pack a list of sibling nodes using contour-based merging.
   * Returns the combined contour for the packed children.
   */
  const packChildrenContour = (kids: TreeNode[], startDepth: number): DepthContour => {
    const childContours = kids.map(child => computeSubtreeContour(child, startDepth))
    const accumulated: DepthContour = {}

    for (let i = 0; i < kids.length; i++) {
      const childContour = childContours[i]

      let offset = 0
      for (const dStr of Object.keys(childContour)) {
        const d = Number(dStr)
        if (d in accumulated) {
          offset = Math.max(offset, accumulated[d] + siblingGap)
        }
      }

      for (const dStr of Object.keys(childContour)) {
        const d = Number(dStr)
        accumulated[d] = Math.max(accumulated[d] ?? 0, offset + childContour[d])
      }
    }

    return accumulated
  }

  /**
   * Compute compact Y offsets for children using contour-based packing.
   * Returns an array of Y offsets (relative to the parent's startPos).
   */
  const computeCompactOffsets = (kids: TreeNode[], startDepth: number): number[] => {
    const childContours = kids.map(child => computeSubtreeContour(child, startDepth))
    const offsets: number[] = []
    const accumulated: DepthContour = {}

    for (let i = 0; i < kids.length; i++) {
      const childContour = childContours[i]

      let offset = 0
      for (const dStr of Object.keys(childContour)) {
        const d = Number(dStr)
        if (d in accumulated) {
          offset = Math.max(offset, accumulated[d] + siblingGap)
        }
      }

      offsets.push(offset)

      for (const dStr of Object.keys(childContour)) {
        const d = Number(dStr)
        accumulated[d] = Math.max(accumulated[d] ?? 0, offset + childContour[d])
      }
    }

    return offsets
  }

  // --- Pass 2: measure subtree sizes and place nodes ---

  // Measure subtree size in the sibling-stacking dimension
  const measureSubtreeSize = (n: TreeNode): number => {
    // Hidden nodes contribute no size themselves
    if (n.hidden) {
      const kids = n.children ?? []
      if (!kids.length) return 0
      if (cascadeAlignment === "top") {
        const contour = packChildrenContour(kids, 0)
        const values = Object.values(contour)
        return values.length > 0 ? Math.max(...values) : 0
      }
      const kidsSizes = kids.map(measureSubtreeSize)
      return kidsSizes.reduce((a, b) => a + b, 0) + siblingGap * Math.max(0, kids.length - 1)
    }
    const expanded = args.isExpandedByKey[n.key] !== false
    const kids = expanded ? (n.children ?? []) : []
    // In horizontal: siblings stack vertically, so measure height
    // In vertical: siblings stack horizontally, so measure width
    const nodeSize = getNodeSize(n)

    // Attached nodes are placed directly below this node (not stacked after children).
    // We must ensure the subtree is tall enough so they don't overflow when this node is centered.
    // When centered: attachedEnd = (subtreeSize + nodeSize)/2 + attachedSpace
    // Constraint: attachedEnd <= subtreeSize  →  subtreeSize >= nodeSize + 2 * attachedSpace
    let attachedSpace = 0
    if (n.attachedNodes?.length && direction === "horizontal") {
      for (const a of n.attachedNodes) {
        attachedSpace += siblingGap + a.h
      }
    }
    const minForAttached = cascadeAlignment === "top"
      ? nodeSize + attachedSpace
      : nodeSize + 2 * attachedSpace

    if (!kids.length) return Math.max(nodeSize, minForAttached)

    if (cascadeAlignment === "top") {
      // Use contour-based measurement for compact packing
      const contour = computeSubtreeContour(n, 0)
      const values = Object.values(contour)
      return values.length > 0 ? Math.max(...values, minForAttached) : Math.max(nodeSize, minForAttached)
    }

    const kidsSizes = kids.map(measureSubtreeSize)
    const kidsTotal = kidsSizes.reduce((a, b) => a + b, 0) + siblingGap * Math.max(0, kids.length - 1)
    return Math.max(nodeSize, kidsTotal, minForAttached)
  }

  const place = (n: TreeNode, depth: number, startPos: number) => {
    // Hidden nodes are not rendered, but their children are placed at the same depth
    if (n.hidden) {
      const kids = n.children ?? []
      if (cascadeAlignment === "top" && kids.length > 0) {
        const offsets = computeCompactOffsets(kids, depth)
        for (let i = 0; i < kids.length; i++) {
          place(kids[i], depth, startPos + offsets[i])
        }
      } else {
        let cursor = startPos
        for (const child of kids) {
          const childSize = measureSubtreeSize(child)
          place(child, depth, cursor)  // Same depth, not depth+1
          cursor += childSize + siblingGap
        }
      }
      return
    }

    const subtreeSize = measureSubtreeSize(n)
    const nodeSize = getNodeSize(n)
    const centeredPos = cascadeAlignment === "top"
      ? startPos
      : startPos + (subtreeSize - nodeSize) / 2

    let x: number, y: number
    if (direction === "horizontal") {
      // Horizontal: use adaptive depth position for X, sibling position for Y
      x = depthStart[depth] ?? (depthOrigin + depth * connectorGap)
      y = centeredPos
    } else {
      // Vertical: use adaptive depth position for Y, sibling position for X
      x = centeredPos
      y = depthStart[depth] ?? (depthOrigin + depth * verticalDepthGap)
    }

    const positioned: PositionedNode = { ...n, x, y }
    nodes.push(positioned)
    nodeByKey[n.key] = positioned

    const expanded = args.isExpandedByKey[n.key] !== false
    const kids = expanded ? (n.children ?? []) : []

    // Place children first (before attached nodes) so we know the max extent at depth+1
    let childrenMaxY = y + nodeSize // fallback: just below this node
    if (kids.length > 0 && cascadeAlignment === "top") {
      // Use contour-based compact packing for children
      const offsets = computeCompactOffsets(kids, depth + 1)
      for (let i = 0; i < kids.length; i++) {
        edges.push({ from: n.key, to: kids[i].key })
        place(kids[i], depth + 1, startPos + offsets[i])
        // Track the max Y of direct children at depth+1 for attached node placement
        const placed = nodeByKey[kids[i].key]
        if (placed) {
          childrenMaxY = Math.max(childrenMaxY, placed.y + placed.h)
        }
      }
    } else if (kids.length > 0) {
      // Center: children are centered under the parent.
      const kidsSizes = kids.map(measureSubtreeSize)
      const kidsTotal = kidsSizes.reduce((a, b) => a + b, 0) + siblingGap * Math.max(0, kids.length - 1)
      const childrenOffset = (subtreeSize - kidsTotal) / 2

      let cursor = startPos + childrenOffset
      for (let i = 0; i < kids.length; i++) {
        const child = kids[i]
        edges.push({ from: n.key, to: child.key })
        place(child, depth + 1, cursor)
        cursor += kidsSizes[i] + siblingGap
      }
    }

    // Place attached nodes at depth+1. For top cascade, place them after all children
    // at that depth to avoid overlap. For center, place below the parent node.
    if (n.attachedNodes?.length && direction === "horizontal") {
      const attachX = depthStart[depth + 1] ?? (x + n.w + connectorGap)
      let attachCursor = cascadeAlignment === "top"
        ? childrenMaxY + siblingGap
        : y + nodeSize + siblingGap
      for (const attached of n.attachedNodes) {
        const ap: PositionedNode = { ...attached, x: attachX, y: attachCursor }
        nodes.push(ap)
        nodeByKey[attached.key] = ap
        edges.push({ from: n.key, to: attached.key })
        attachCursor += attached.h + siblingGap
      }
    }
  }

  // Start position depends on direction
  const startPos = direction === "horizontal" ? origin.y : origin.x
  place(args.root, 0, startPos)

  // Snap node positions to 14px grid on the depth axis only.
  // The centering (sibling-stacking) axis is left exact so children stay
  // perfectly centered under their parents.
  const GRID = 14
  for (const n of nodes) {
    if (direction === "vertical") {
      n.y = Math.round(n.y / GRID) * GRID
    } else {
      n.x = Math.round(n.x / GRID) * GRID
    }
    nodeByKey[n.key] = n
  }

  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY
  for (const n of nodes) {
    minX = Math.min(minX, n.x)
    minY = Math.min(minY, n.y)
    maxX = Math.max(maxX, n.x + n.w)
    maxY = Math.max(maxY, n.y + n.h)
  }
  if (!nodes.length) {
    minX = 0
    minY = 0
    maxX = 0
    maxY = 0
  }

  return { nodes, edges, bounds: { minX, minY, maxX, maxY }, nodeByKey }
}

/**
 * Union two bounding rectangles
 */
export function unionBounds(a: LayoutResult["bounds"], b: LayoutResult["bounds"]): LayoutResult["bounds"] {
  return {
    minX: Math.min(a.minX, b.minX),
    minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX),
    maxY: Math.max(a.maxY, b.maxY),
  }
}

/**
 * Clamp a number between min and max bounds
 */
export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}
