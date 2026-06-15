/**
 * Type definitions for ObjectMapView components
 */

import type { AssistantReferenceKind } from "@/components/ProductAssistantPanel"

export type NodeKey = string
export type SetState<T> = T | ((prev: T) => T)
export type StateSetter<T> = (next: SetState<T>) => void

export type PricingTier = {
  label: string  // e.g., "First 1M" or "Over 1M"
  price: string  // e.g., "$0.05 per 100"
}

export type DetailRow = {
  label: string
  value: string
  isPlaceholder?: boolean  // When true, value is rendered in grey
}

export type TreeNode = {
  key: NodeKey
  headerLabel: string
  title: string
  subtitle?: string
  pricingTiers?: PricingTier[]  // For rate cards to show pricing details
  detailRows?: DetailRow[]  // For detailed view: key-value detail rows shown below title
  detailedW?: number  // Width override for detailed view mode
  detailedH?: number  // Height override for detailed view mode
  muted?: boolean
  emphasis?: boolean
  titleIsPlaceholder?: boolean  // When true, title is rendered in grey (for empty states)
  hidden?: boolean  // When true, this node is not rendered but its children are (used for synthetic roots)
  onClick?: (shiftKey?: boolean) => void
  children?: TreeNode[]
  /** Nodes positioned directly below this node (at depth+1), bypassing normal subtree stacking.
   *  Used for leaf children (e.g., subscription fees) that should stay close to their parent
   *  rather than being pushed down by sibling subtrees. */
  attachedNodes?: TreeNode[]
  w: number
  h: number
  coachmarkId?: string  // Optional identifier for coachmark targeting
}

export type PositionedNode = TreeNode & {
  x: number
  y: number
}

export type LayoutEdge = { from: NodeKey; to: NodeKey }

export type LayoutResult = {
  nodes: PositionedNode[]
  edges: LayoutEdge[]
  /** Additional edges that connect nodes outside the normal parent-child relationship (e.g., shared meters) */
  additionalEdges?: LayoutEdge[]
  bounds: { minX: number; minY: number; maxX: number; maxY: number }
  nodeByKey: Record<string, PositionedNode>
}

export type PanZoom = { x: number; y: number; scale: number }

/**
 * Map a node key to its corresponding AssistantReferenceKind for styling.
 * Handles both plain keys (e.g., "rateCard:123") and prefixed keys (e.g., "plan456:rateCard:123").
 */
export function nodeKeyToGlyphKind(key: string): AssistantReferenceKind {
  // Handle plan-prefixed keys (e.g., "plan123:rateCard:456")
  // Strip the plan prefix if present to get the base key type
  const baseKey = key.replace(/^plan-?\d+:/, "")

  if (baseKey === "plan") return "plan"
  if (baseKey === "product") return "product"
  if (baseKey === "meter") return "meter"
  if (baseKey === "prices") return "price"
  if (baseKey.startsWith("rateCard:")) return "rateCard"
  if (baseKey.startsWith("rate:")) return "rate"
  if (baseKey.startsWith("rateMeter:")) return "rateMeter"
  if (baseKey.startsWith("creditGrant:")) return "creditGrant"
  if (baseKey.startsWith("subscriptionFee:")) return "subscriptionFee"
  if (baseKey.startsWith("price:")) return "price"
  if (baseKey.startsWith("meteredItem:")) return "meteredItem"
  if (baseKey.startsWith("meter:")) return "meter"
  // Fallback: treat as product-adjacent.
  return "product"
}

/**
 * Node descriptions based on Stripe documentation.
 * Used for info tooltips in the object map.
 */
export const NODE_DESCRIPTIONS: Record<string, string> = {
  // Core plan objects
  "plan": "A pricing plan defines how customers are billed, including rates, meters, and any credits or fees.",
  "rateCard": "Groups related rates together for a pricing plan, organizing different pricing tiers and usage types.",
  "rate": "Defines how usage is priced, including unit costs and tier boundaries for graduated or volume pricing.",
  "rateMeter": "Tracks and aggregates customer usage events throughout the billing period for accurate billing.",
  "creditGrant": "Provides customers with prepaid credits that can be applied to usage charges.",
  "subscriptionFee": "A recurring fixed fee charged on each billing cycle, independent of usage.",

  // Subscription flow objects
  "checkout": "Stripe-hosted page for collecting payment details and starting subscriptions.",
  "customer": "Represents an end-user with payment methods, subscriptions, and billing history.",
  "subscription": "Manages recurring billing, linking customers to pricing plans with automatic payment collection.",
  "automaticTax": "Calculates and applies sales tax, VAT, and GST based on customer location.",
  "invoice": "Generated each billing period to itemize charges, track payments, and handle collection.",

  // Product objects
  "product": "Represents what you sell—the foundation for defining pricing and catalog organization.",
  "price": "Defines how a product is charged, including amount, currency, and billing interval.",
  "meter": "Records customer usage events with flexible aggregation methods for usage-based billing.",
}
