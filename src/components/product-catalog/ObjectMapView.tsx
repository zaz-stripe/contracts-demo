/**
 * ObjectMapView - Re-export for backward compatibility
 *
 * This file re-exports all components from the modularized ObjectMapView folder.
 * The implementation has been split into smaller, focused modules:
 *
 * - objectMapTypes.ts: Type definitions
 * - objectMapUtils.ts: Layout algorithm and utilities
 * - objectMapIcons.tsx: Icon components
 * - NodeCard.tsx: Individual node card component
 * - Minimap.tsx: Navigation minimap
 * - PanZoomCanvas.tsx: Pan/zoom canvas wrapper
 * - NodeActionsPopover.tsx: Action popover for nodes
 * - ObjectMapBase.tsx: Base map component
 * - PlanObjectMapView.tsx: Plan visualization
 * - ProductObjectMapView.tsx: Product visualization
 */

// Re-export everything from the modular implementation
export * from "./ObjectMapView/index"
