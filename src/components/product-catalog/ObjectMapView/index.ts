/**
 * ObjectMapView - A modular pan/zoom canvas for visualizing hierarchical object trees
 *
 * This module provides components for rendering interactive tree visualizations
 * with features like:
 * - Pan and zoom with mouse/trackpad/keyboard
 * - Minimap navigation
 * - Collapsible nodes
 * - Action popovers for node interactions
 *
 * Main exports:
 * - PlanObjectMapView: For visualizing pricing plan structures
 * - ProductObjectMapView: For visualizing product structures
 */

// Types
export type {
  NodeKey,
  SetState,
  StateSetter,
  PricingTier,
  TreeNode,
  PositionedNode,
  LayoutEdge,
  LayoutResult,
  PanZoom,
} from "./objectMapTypes"

export { nodeKeyToGlyphKind } from "./objectMapTypes"

// Utilities
export { computeTreeLayout, unionBounds, clamp, GRID_COL_X, ROW_GAP_Y } from "./objectMapUtils"

// Components
export { NodeCard } from "./NodeCard"
export { Minimap } from "./Minimap"
export { PanZoomCanvas } from "./PanZoomCanvas"
export { NodeActionsPopover } from "./NodeActionsPopover"
export { ObjectMapBase } from "./ObjectMapBase"

// Main exported views
export { PlanObjectMapView } from "./PlanObjectMapView"
export { ProductObjectMapView } from "./ProductObjectMapView"

// Icons (for internal use or advanced customization)
export {
  PlusCircleIcon12,
  MinusCircleIcon12,
  SparkleIcon16,
  OpenInWorkbenchIcon16x14,
  DocsIcon16,
} from "./objectMapIcons"
