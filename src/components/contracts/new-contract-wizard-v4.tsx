"use client"

import { useState, useMemo, useCallback, useEffect, useRef, Fragment } from "react"
import {
  Search, Calendar, ArrowRight, Package, X, Check, ChevronDown, ChevronRight, ChevronLeft,
  FileText, User, Tag, Hash, Plus, Trash2, Percent, Eye, MoreHorizontal,
  Upload, UploadCloud, Pencil, Sparkles, Loader2, Send, AlertTriangle, Paperclip,
  Receipt, TrendingUp
} from "lucide-react"
import { cn } from "@/lib/utils"
import { planCatalog, type PlanTemplate } from "@/lib/plan-catalog"
import { SailDatePicker } from "./sail-date-picker"

// =============================================================================
// TYPES
// =============================================================================
export interface V4PlanLine {
  id: string
  name: string
  monthlyPrice: number
  quantity: number
  startDate: string
  endDate: string
  priceOverrides: { id: string; startDate: string; endDate: string; price: string }[]
  quantityUpdates: { id: string; effectiveDate: string; quantity: number }[]
  discounts?: { id: string; name: string; percentage: number; startDate: string; endDate: string; scope?: "everything" | "specific"; appliedItemIds?: string[] }[]
}

export interface NewContractResultV4 {
  id: string
  status: "Draft" | "Active"
  startDate: string
  endDate: string
  contractValue: string
  customer: string
  email: string
  savedLineGroups?: SavedLineGroup[]
  billingCadence?: string
  currency?: string
  draftExpiry?: string
  planLines?: V4PlanLine[]
}

interface SavedLineGroup {
  dateRange: string
  planName?: string
  lines: { description: string; unitPrice: string; qty: number; serviceInterval: string; totalServicePeriods: number; amount: string }[]
  editedPrice?: string
  editedQty?: number
}

interface SelectedPlanEntry {
  plan: PlanTemplate
  startDate: string
  endDate: string
  quantity: number
  priceOverrides: PriceOverride[]
  quantityUpdates: QuantityUpdate[]
  discounts: Discount[]
}

interface PriceOverride {
  id: string
  startDate: string
  endDate: string
  price: string
}

interface QuantityUpdate {
  id: string
  effectiveDate: string
  quantity: number
}

interface Discount {
  id: string
  name: string
  percentage: number
  startDate: string
  endDate: string
  // Which contract items this discount applies to. "everything" (default)
  // covers every line; "specific" limits it to the plan ids in appliedItemIds.
  scope?: "everything" | "specific"
  appliedItemIds?: string[]
  type?: "discount" | "markup"
}

interface OneTimeFee {
  id: string
  name: string
  amount: string        // e.g. "5000"
  billingDate: string   // ISO date, or "on_activation"
  description?: string
}

// Tree node types
type TreeNodeType =
  | "contract-root"
  | "customer"
  | "plan"
  | "price"
  | "price-override"
  | "quantity-update"
  | "discount"
  | "markup"
  | "one-time-fee"
  | "schedule"
  | "add-schedule"
  | "add-discount"
  | "add"

interface TreeNode {
  id: string
  type: TreeNodeType
  label: string
  planId?: string
  overrideId?: string
  quantityUpdateId?: string
  discountId?: string
  children?: TreeNode[]
  expanded?: boolean
}

// =============================================================================
// HELPERS
// =============================================================================
const customerOptions = [
  { name: "Bailey Williams", email: "bailey@example.com" },
  { name: "Jenny Rosen", email: "jenny@example.com" },
  { name: "Michael Lee", email: "michael@example.com" },
  { name: "Emily Johnson", email: "emily@example.com" },
]

function generateContractId() {
  const num = Math.floor(10000000 + Math.random() * 90000000)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ"
  const suffix = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
  return `C-2026-001`
}

function generateId() {
  return Math.random().toString(36).substring(2, 9)
}

function makeCustomPlan(name: string, monthlyPrice: number): PlanTemplate {
  const safeName = name.trim() || "Custom product"
  return {
    id: `custom-${generateId()}`,
    name: safeName,
    description: "Custom product",
    defaultMonthlyPrice: monthlyPrice,
    lines: [
      {
        description: `${safeName} — flat rate`,
        unitPrice: `$${monthlyPrice.toFixed(2)}`,
        qty: 1,
        serviceInterval: "Monthly",
        totalServicePeriods: 12,
        amount: `$${(monthlyPrice * 12).toFixed(2)}`,
      },
    ],
  }
}

function addMonths(date: Date, months: number) {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

// A new draft expires exactly one month after it's created. Returns an ISO
// (yyyy-mm-dd) string suitable for seeding the draft-expiration date input.
function defaultDraftExpiry() {
  return addMonths(new Date(), 1).toISOString().slice(0, 10)
}

function formatDateValue(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function formatDateShort(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function toIso(display: string) {
  const d = new Date(display)
  if (isNaN(d.getTime())) return ""
  return d.toISOString().slice(0, 10)
}

function fromIso(iso: string) {
  if (!iso) return ""
  const d = new Date(iso + "T00:00:00")
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

// Shift an ISO (yyyy-mm-dd) date by a number of days. Used to derive the latest
// allowed draft-expiration date (the day before the contract term starts).
function isoAddDays(iso: string, days: number) {
  if (!iso) return ""
  const d = new Date(iso + "T00:00:00")
  if (isNaN(d.getTime())) return ""
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

// The earliest contract term start across all plan lines, as an ISO string.
function earliestTermStartIso(plans: { startDate: string }[]) {
  const isos = plans.map(p => toIso(p.startDate)).filter(Boolean).sort()
  return isos[0] ?? ""
}

// Servicing window control: two individual date fields (start + end) shown side
// by side. Editing either one writes back through the shared change handler.
// Sub-labels and input styling match the rest of the editor forms for a
// consistent look across the price-override, plan, and discount forms.
function DurationFields({
  start,
  end,
  onChange,
}: {
  start: string
  end: string
  onChange: (next: { start?: string; end?: string }) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <SailDatePicker
        label="Start date"
        value={toIso(start)}
        onChange={v => onChange({ start: fromIso(v) })}
      />
      <SailDatePicker
        label="End date"
        value={toIso(end)}
        onChange={v => onChange({ end: fromIso(v) })}
        disableBefore={toIso(start)}
      />
    </div>
  )
}

// Parse a price that may be a number or a "$1,234.50" style string.
function parsePriceValue(p: string | number) {
  return typeof p === "number" ? p : parseFloat(String(p).replace(/[^0-9.]/g, "")) || 0
}

// Compact currency formatter: "$1,250" with an optional currency suffix.
function fmtMoney(value: number, currency?: string) {
  const num = Math.round(value).toLocaleString("en-US")
  return currency ? `$${num} ${currency}` : `$${num}`
}

// First day of the month after the supplied date — the natural billing boundary.
function nextMonthStart(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 1)
}

// The monthly price in effect at a given date (latest applicable override, else base).
function priceInEffectAt(entry: SelectedPlanEntry, date: Date) {
  const t = date.getTime()
  const active = entry.priceOverrides
    .map(o => ({ s: new Date(o.startDate).getTime(), e: new Date(o.endDate).getTime(), price: parsePriceValue(o.price) }))
    .filter(o => !isNaN(o.s) && !isNaN(o.e) && o.s <= t && o.e >= t)
    .sort((a, b) => b.s - a.s)
  return active.length ? active[0].price : entry.plan.defaultMonthlyPrice
}

// The seat count in effect at a given date (latest applicable update, else base).
function seatsInEffectAt(entry: SelectedPlanEntry, date: Date) {
  const t = date.getTime()
  const past = entry.quantityUpdates
    .map(q => ({ d: new Date(q.effectiveDate).getTime(), qty: q.quantity }))
    .filter(q => !isNaN(q.d) && q.d <= t)
    .sort((a, b) => b.d - a.d)
  return past.length ? past[0].qty : entry.quantity
}

// The active discount percentage at a given date (0 if none).
function discountInEffectAt(entry: SelectedPlanEntry, date: Date) {
  const t = date.getTime()
  const active = entry.discounts
    .map(d => ({ s: new Date(d.startDate).getTime(), e: new Date(d.endDate).getTime(), pct: d.percentage }))
    .filter(d => !isNaN(d.s) && !isNaN(d.e) && d.s <= t && d.e >= t)
    .sort((a, b) => b.pct - a.pct)
  return active.length ? active[0].pct : 0
}

// Fully resolved monthly state for a line at a point in time.
function lineStateAt(entry: SelectedPlanEntry, date: Date) {
  const price = priceInEffectAt(entry, date)
  const seats = seatsInEffectAt(entry, date)
  const t = date.getTime()
  let multiplier = 1
  for (const d of entry.discounts) {
    const s = new Date(d.startDate).getTime()
    const e = new Date(d.endDate).getTime()
    if (!isNaN(s) && !isNaN(e) && s <= t && e >= t) {
      if (d.type === "markup") multiplier *= (1 + d.percentage / 100)
      else multiplier *= (1 - d.percentage / 100)
    }
  }
  const mrr = price * seats * multiplier
  return { price, seats, discountPct: 0, mrr }
}

// True when a discount (owned by `ownerId`) applies to the line `planId`,
// honoring its scope. "everything" (default) covers all lines; "specific"
// limits to appliedItemIds (falling back to the owning line if none chosen).
function discountAppliesToPlan(discount: Discount, ownerId: string, planId: string) {
  const scope = discount.scope ?? "everything"
  if (scope === "specific") {
    const ids = discount.appliedItemIds ?? [ownerId]
    return ids.includes(planId)
  }
  return true
}

// Every discount across the contract that applies to a given line.
function discountsApplyingTo(plans: SelectedPlanEntry[], planId: string): Discount[] {
  return plans.flatMap(p => p.discounts.filter(d => discountAppliesToPlan(d, p.plan.id, planId)))
}

// Redistribute contract discounts onto the lines they apply to (per scope), so
// pricing totals, the timeline, the invoice, and the PDF all reflect targeting.
// Used for computation/display only — editing still uses the raw plan list.
function resolveDiscountScopes(plans: SelectedPlanEntry[]): SelectedPlanEntry[] {
  const hasAnyDiscount = plans.some(p => p.discounts.length > 0)
  if (!hasAnyDiscount) return plans
  return plans.map(p => ({ ...p, discounts: discountsApplyingTo(plans, p.plan.id) }))
}

// Smart defaults for a new price override: start at the next billing boundary
// after any existing change, run to the plan end, and seed the price with the
// value currently in effect so the common case needs no typing.
function smartPriceOverride(entry: SelectedPlanEntry): PriceOverride {
  const planStart = new Date(entry.startDate)
  const planEnd = new Date(entry.endDate)
  const now = new Date()
  let anchor = planStart.getTime() > now.getTime() ? planStart : now
  const lastEnd = entry.priceOverrides
    .map(o => new Date(o.endDate).getTime())
    .filter(t => !isNaN(t))
    .sort((a, b) => b - a)[0]
  if (lastEnd && lastEnd > anchor.getTime()) anchor = new Date(lastEnd)
  let start = nextMonthStart(anchor)
  if (start.getTime() >= planEnd.getTime()) start = new Date(anchor)
  const price = priceInEffectAt(entry, start)
  return {
    id: generateId(),
    startDate: formatDateValue(start),
    endDate: entry.endDate,
    price: price.toFixed(2),
  }
}

// Smart defaults for a new quantity update: effective at the next billing
// boundary after any existing change, seeded with the seats currently in effect.
function smartQuantityUpdate(entry: SelectedPlanEntry): QuantityUpdate {
  const planStart = new Date(entry.startDate)
  const now = new Date()
  let anchor = planStart.getTime() > now.getTime() ? planStart : now
  const lastDate = entry.quantityUpdates
    .map(q => new Date(q.effectiveDate).getTime())
    .filter(t => !isNaN(t))
    .sort((a, b) => b - a)[0]
  if (lastDate && lastDate > anchor.getTime()) anchor = new Date(lastDate)
  const eff = nextMonthStart(anchor)
  return {
    id: generateId(),
    effectiveDate: formatDateValue(eff),
    quantity: seatsInEffectAt(entry, eff),
  }
}

// =============================================================================
// TREE SIDEBAR COMPONENT
// =============================================================================
function TreeSidebar({
  contractId,
  customer,
  selectedPlans,
  oneTimeFees,
  selectedNodeId,
  onSelectNode,
  expandedNodes,
  onToggleExpand,
  filterText,
  onFilterChange,
  onAddPriceOverride,
  onAddQuantityUpdate,
  onShowAddMenu,
  scheduleMenuPlanId,
  setScheduleMenuPlanId,
  className,
}: {
  contractId: string
  customer: { name: string; email: string } | null
  selectedPlans: SelectedPlanEntry[]
  oneTimeFees: OneTimeFee[]
  selectedNodeId: string
  onSelectNode: (id: string) => void
  expandedNodes: Set<string>
  onToggleExpand: (id: string) => void
  filterText: string
  onFilterChange: (v: string) => void
  onAddPriceOverride: (planId: string) => void
  onAddQuantityUpdate: (planId: string) => void
  onShowAddMenu: () => void
  scheduleMenuPlanId: string | null
  setScheduleMenuPlanId: (id: string | null) => void
  className?: string
}) {

  // Build tree structure
  const treeNodes: TreeNode[] = useMemo(() => {
    const nodes: TreeNode[] = []
    
    // Contract root
    nodes.push({
      id: "contract-root",
      type: "contract-root",
      label: contractId,
      expanded: true,
    })
    
    // Customer — always shown so it's always accessible in the tree
    nodes.push({
      id: "customer",
      type: "customer",
      label: customer?.name || "Customer",
    })
    
    // Plans
    selectedPlans.forEach((entry, planIdx) => {
      const planNodeId = `plan-${entry.plan.id}`
      const planChildren: TreeNode[] = []
      
      // Base price
      planChildren.push({
        id: `${planNodeId}-price`,
        type: "price",
        label: `$${entry.plan.defaultMonthlyPrice.toFixed(2)}/mo`,
        planId: entry.plan.id,
      })

      // Price overrides
      entry.priceOverrides.forEach(override => {
        planChildren.push({
          id: `${planNodeId}-override-${override.id}`,
          type: "price-override",
          label: `$${override.price}/mo`,
          planId: entry.plan.id,
          overrideId: override.id,
        })
      })

      // Quantity updates
      entry.quantityUpdates.forEach(qu => {
        planChildren.push({
          id: `${planNodeId}-qty-${qu.id}`,
          type: "quantity-update",
          label: `${qu.quantity} units`,
          planId: entry.plan.id,
          quantityUpdateId: qu.id,
        })
      })

      // Schedule action
      planChildren.push({
        id: `${planNodeId}-add-schedule`,
        type: "add-schedule",
        label: "Schedule",
        planId: entry.plan.id,
      })

      nodes.push({
        id: planNodeId,
        type: "plan",
        label: entry.plan.name,
        planId: entry.plan.id,
        children: planChildren,
        expanded: expandedNodes.has(planNodeId),
      })
    })

    // Discounts and markups — one node per item so every one the user adds
    // shows up in the tree immediately (not collapsed into a single entry).
    selectedPlans.forEach(entry => {
      entry.discounts.forEach(discount => {
        if (discount.type === "markup") {
          nodes.push({
            id: `discount-${entry.plan.id}-${discount.id}`,
            type: "markup",
            label: `Markup - ${discount.percentage}%`,
            planId: entry.plan.id,
            discountId: discount.id,
          })
        } else {
          nodes.push({
            id: `discount-${entry.plan.id}-${discount.id}`,
            type: "discount",
            label: `Discount - ${discount.percentage}%`,
            planId: entry.plan.id,
            discountId: discount.id,
          })
        }
      })
    })

    // One-time fees
    oneTimeFees.forEach(fee => {
      nodes.push({
        id: `one-time-fee-${fee.id}`,
        type: "one-time-fee",
        label: fee.name || "One-time fee",
      })
    })

    // Add button
    nodes.push({
      id: "add-plan",
      type: "add",
      label: "Add",
    })

    return nodes
  }, [contractId, customer, selectedPlans, oneTimeFees, expandedNodes])

  const renderNode = (node: TreeNode, depth: number = 0) => {
    const isSelected = selectedNodeId === node.id
    const isExpanded = expandedNodes.has(node.id)
    const hasChildren = node.children && node.children.length > 0
    // Scheduled changes (price overrides, quantity updates) and the "+ Schedule"
    // link are nested one level deeper than the base price row so they read as
    // adjustments hanging off the plan's pricing.
    const isScheduledChange =
      node.type === "price-override" || node.type === "quantity-update" || node.type === "add-schedule"
    // The contract root sits flush; everything below it gets a base offset so it
    // reads as a child of the contract, plus the usual per-level nesting.
    const indent = Math.max(0, (depth - 1) * 24) + (isScheduledChange ? 24 : 0)

    // Icon based on type. Price + scheduled updates share one size and color
    // so they read as siblings on the same level.
    const getIcon = () => {
      switch (node.type) {
        case "contract-root": return <FileText className="w-3.5 h-3.5 text-[#6c7688]" />
        case "customer": return <User className="w-3.5 h-3.5 text-[#6c7688]" />
        case "plan": return <Package className="w-3.5 h-3.5 text-[#6c7688]" />
        case "price": return <Tag className="w-3.5 h-3.5 text-[#6c7688]" />
        case "price-override": return <Calendar className="w-3.5 h-3.5 text-[#6c7688]" />
        case "quantity-update": return <Hash className="w-3.5 h-3.5 text-[#6c7688]" />
        case "discount": return <Percent className="w-3.5 h-3.5 text-[#6c7688]" />
        case "markup": return <TrendingUp className="w-3.5 h-3.5 text-[#6c7688]" />
        case "one-time-fee": return <Receipt className="w-3.5 h-3.5 text-[#6c7688]" />
        case "add-schedule": return <Plus className="w-3.5 h-3.5 text-[#533AFD]" />
        case "add-discount": return <Percent className="w-3.5 h-3.5" />
        case "add": return <Plus className="w-3.5 h-3.5 text-[#533AFD]" />
        default: return null
      }
    }

    const isAction = node.type === "add-schedule" || node.type === "add-discount" || node.type === "add"

    // Handle "+ Schedule" as dropdown
    if (node.type === "add-schedule" && node.planId) {
      const isMenuOpen = scheduleMenuPlanId === node.planId
      return (
        <div key={node.id} className="relative">
          <button
            onClick={() => setScheduleMenuPlanId(isMenuOpen ? null : node.planId!)}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-xs transition-colors text-[#533AFD] font-medium",
              isMenuOpen ? "bg-[#F7F5FD]" : "hover:bg-[#f5f6f8]"
            )}
            style={{ paddingLeft: `${8 + indent}px` }}
          >
            <span className="w-4 h-4 shrink-0" />
            <span className="w-4 h-4 flex items-center justify-center shrink-0">
              <Plus className="w-3.5 h-3.5 text-[#533AFD]" />
            </span>
            <span>Schedule</span>
          </button>
          {isMenuOpen && (
            <div
              className="absolute top-full mt-1 w-48 bg-white rounded-lg border border-[#ebeef1] shadow-lg py-1 z-50"
              style={{ left: `${8 + indent}px` }}
            >
              <button
                onClick={() => {
                  onAddPriceOverride(node.planId!)
                  setScheduleMenuPlanId(null)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#353A44] hover:bg-[#f5f6f8]"
              >
                <Calendar className="w-3.5 h-3.5 text-[#533AFD]" />
                <span>Price override</span>
              </button>
              <button
                onClick={() => {
                  onAddQuantityUpdate(node.planId!)
                  setScheduleMenuPlanId(null)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#353A44] hover:bg-[#f5f6f8]"
              >
                <Hash className="w-3.5 h-3.5 text-[#533AFD]" />
                <span>Quantity update</span>
              </button>
            </div>
          )}
        </div>
      )
    }

    // Handle "+ Add" as trigger
    if (node.type === "add") {
      return (
        <div key={node.id}>
          <button
            onClick={onShowAddMenu}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-xs transition-colors text-[#533AFD] font-medium hover:bg-[#f5f6f8]"
            style={{ paddingLeft: `${8 + indent}px` }}
          >
            <span className="w-4 h-4 flex items-center justify-center shrink-0">
              <Plus className="w-3.5 h-3.5 text-[#533AFD]" />
            </span>
            <span>Add</span>
          </button>
        </div>
      )
    }

    return (
      <div key={node.id}>
        <button
          onClick={() => {
            // The product (plan) row opens its product-detail form, and also
            // expands the pricing rows beneath it so they're visible. Use the
            // chevron to collapse it again. All other rows simply select.
            if (node.type === "plan") {
              onSelectNode(node.id)
              if (hasChildren && !isExpanded) onToggleExpand(node.id)
            } else {
              if (hasChildren) onToggleExpand(node.id)
              onSelectNode(node.id)
            }
          }}
          className={cn(
            "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-xs transition-colors",
            isSelected ? "bg-[#F7F5FD] text-[#353A44]" : "hover:bg-[#f5f6f8] text-[#353A44]",
            isAction && "text-[#533AFD]"
          )}
          style={{ paddingLeft: `${8 + indent}px` }}
        >
          {hasChildren && (
            <span
              role="button"
              tabIndex={-1}
              onClick={e => {
                // Toggle expansion without changing the selected form.
                e.stopPropagation()
                onToggleExpand(node.id)
              }}
              className="w-4 h-4 flex items-center justify-center shrink-0 rounded hover:bg-[#e9eaee]"
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3 text-[#A0A8B4]" />
              ) : (
                <ChevronRight className="w-3 h-3 text-[#A0A8B4]" />
              )}
            </span>
          )}
          {!hasChildren && depth > 0 && <span className="w-4 h-4 shrink-0" />}
          <span className="w-4 h-4 flex items-center justify-center shrink-0">{getIcon()}</span>
          <span className={cn("truncate", isAction && "font-medium")}>{node.label}</span>
        </button>
        {hasChildren && isExpanded && (
          <div>
            {node.children!.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn("w-[260px] border-r border-[#ebeef1] flex flex-col bg-white", className)}>
      {/* Search */}
      <div className="h-12 flex items-center px-3 shrink-0">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A0A8B4]" />
          <input
            type="text"
            placeholder="Filter list"
            value={filterText}
            onChange={e => onFilterChange(e.target.value)}
            className="w-full h-8 pl-8 pr-3 rounded-md border border-[#ebeef1] bg-white text-xs text-[#353A44] placeholder:text-[#A0A8B4] outline-none focus:border-[#533AFD] focus:ring-1 focus:ring-[#533AFD]"
          />
        </div>
      </div>
      
      {/* Tree */}
      <div className="flex-1 overflow-auto p-2">
        {treeNodes.map(node => {
          if (node.type === "customer") {
            return (
              <Fragment key={node.id}>
                {renderNode(node, 0)}
                <hr className="my-2 mx-2 border-[#ebeef1]" />
                <div className="px-2 pt-1 pb-1 text-[11px] font-semibold text-[#A0A8B4]">Pricing lines</div>
              </Fragment>
            )
          }
          return renderNode(node, node.type === "contract-root" ? 0 : 1)
        })}
      </div>
    </div>
  )
}

// =============================================================================
// PRODUCT DETAIL FORM
// Stripe-style "Update a product" form, rendered in the 320px sidebar so it
// matches the rest of the editor. Name + Description write back to the plan;
// image, category, and pricing presentation are demo affordances.
// =============================================================================
function ProductForm({
  plan,
  currency,
  onUpdatePlan,
  onRemove,
}: {
  plan: PlanTemplate
  currency: string
  onUpdatePlan: (planId: string, updates: Partial<SelectedPlanEntry>) => void
  onRemove: () => void
}) {
  const [imageName, setImageName] = useState<string | null>(null)
  const [showMore, setShowMore] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex-1 min-w-0 border-r border-[#ebeef1] flex flex-col bg-white overflow-hidden">
      <div className="flex items-center justify-between px-5 h-12 shrink-0">
        <h2 className="text-sm font-semibold text-[#353A44] truncate">Update a product</h2>
        <button
          onClick={onRemove}
          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#fef4f6] text-[#A0A8B4] hover:text-[#e61947] transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-auto p-5">
        {/* Name */}
        <div className="mb-4">
          <label className="block text-xs font-normal text-[#596171] mb-1.5">Name</label>
          <input
            type="text"
            value={plan.name}
            onChange={e => onUpdatePlan(plan.id, { plan: { ...plan, name: e.target.value } })}
            className="w-full h-9 px-3 rounded-md border border-[#dfe1e6] bg-white text-sm text-[#1A1A1A] outline-none focus:border-[#533AFD] focus:ring-[3px] focus:ring-[#533AFD]/15 transition-all"
          />
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="block text-xs font-normal text-[#596171] mb-1.5">Description</label>
          <textarea
            value={plan.description}
            onChange={e => onUpdatePlan(plan.id, { plan: { ...plan, description: e.target.value } })}
            rows={3}
            className="w-full px-3 py-2 rounded-md border border-[#dfe1e6] bg-white text-sm text-[#1A1A1A] outline-none resize-y focus:border-[#533AFD] focus:ring-[3px] focus:ring-[#533AFD]/15 transition-all"
          />
        </div>

        {/* Image */}
        <div className="mb-4">
          <label className="block text-xs font-normal text-[#596171] mb-1.5">Image</label>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={e => setImageName(e.target.files?.[0]?.name ?? null)}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#d8dee4] bg-white hover:bg-[#f5f6f8] text-sm font-medium text-[#353A44] transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-[#475569]" />
            Upload
          </button>
          {imageName && <p className="text-xs text-[#6c7688] mt-1.5 truncate">{imageName}</p>}
        </div>

        {/* Product category */}
        <div className="mb-4">
          <label className="block text-xs font-normal text-[#596171] mb-1.5">Product category</label>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#d8dee4] bg-white hover:bg-[#f5f6f8] text-sm font-semibold text-[#353A44] transition-colors">
            Use preset: Website Hosting
            <Pencil className="w-3 h-3 text-[#A0A8B4]" />
          </button>
          <p className="flex items-center gap-1.5 text-xs text-[#353A44] mt-2">
            <Check className="w-3.5 h-3.5 text-[#353A44]" />
            <span><span className="font-semibold">Eligible</span> for Managed Payments</span>
          </p>
        </div>

        <button
          onClick={() => setShowMore(v => !v)}
          className="flex items-center gap-1 text-sm font-medium text-[#533AFD] hover:text-[#4730E0] transition-colors"
        >
          More options
          <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showMore && "rotate-180")} />
        </button>
        {showMore && (
          <div className="mt-3 space-y-2 text-xs text-[#6c7688]">
            <p>Statement descriptor, unit label, and tax code can be configured here.</p>
          </div>
        )}

        <div className="border-t border-[#ebeef1] my-5" />

        {/* Pricing */}
        <h3 className="text-sm font-semibold text-[#353A44] mb-3">Pricing</h3>
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-sm font-semibold text-[#533AFD]">${plan.defaultMonthlyPrice.toFixed(2)} {currency}</div>
            <div className="text-xs text-[#6c7688] mt-0.5">Per month</div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded text-[11px] font-medium text-[#533AFD] bg-[#F7F5FD] border border-[#F0ECFC]">Default</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-medium text-[#596171] bg-white border border-[#d4dee9]">Limited Access</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// DISCOUNT FORM
// Matches the Figma "Discounts form": servicing duration (date range), discount
// amount (%), and application scope.
// =============================================================================
function DiscountForm({
  planId,
  discount,
  selectedPlans,
  onUpdate,
  onRemove,
}: {
  planId: string
  discount: Discount
  selectedPlans: SelectedPlanEntry[]
  onUpdate: (planId: string, discountId: string, updates: Partial<Discount>) => void
  onRemove: () => void
}) {
  const allItemIds = selectedPlans.map(p => p.plan.id)
  const scope = discount.scope ?? "everything"
  const [application, setApplication] = useState(scope === "specific" ? "specific" : "everything")
  // Which contract items the discount applies to, sourced from the model so the
  // selection persists into pricing, the timeline, and the PDF preview.
  const appliedItems = scope === "specific" ? (discount.appliedItemIds ?? allItemIds) : allItemIds

  const handleApplicationChange = (value: string) => {
    setApplication(value)
    if (value === "specific") {
      onUpdate(planId, discount.id, {
        scope: "specific",
        appliedItemIds: discount.appliedItemIds && discount.appliedItemIds.length ? discount.appliedItemIds : allItemIds,
      })
    } else {
      onUpdate(planId, discount.id, { scope: "everything", appliedItemIds: [] })
    }
  }

  const toggleItem = (id: string) => {
    const current = discount.appliedItemIds && discount.appliedItemIds.length ? discount.appliedItemIds : allItemIds
    const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id]
    onUpdate(planId, discount.id, { scope: "specific", appliedItemIds: next })
  }

  return (
    <div className="flex-1 min-w-0 border-r border-[#ebeef1] flex flex-col bg-white overflow-hidden">
      <div className="flex items-center justify-between px-5 h-12 shrink-0">
        <h2 className="text-sm font-semibold text-[#353A44] truncate">{discount.type === "markup" ? "Markup" : "Discount"}</h2>
        <button
          onClick={onRemove}
          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#fef4f6] text-[#A0A8B4] hover:text-[#e61947] transition-colors shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-auto p-5">
        {/* Duration */}
        <div className="mb-4">
          <label className="block text-xs font-normal text-[#596171] mb-1.5">Duration</label>
          <DurationFields
            start={discount.startDate}
            end={discount.endDate}
            onChange={next =>
              onUpdate(planId, discount.id, {
                ...(next.start !== undefined ? { startDate: next.start } : {}),
                ...(next.end !== undefined ? { endDate: next.end } : {}),
              })
            }
          />
        </div>

        {/* Discount/Markup amount */}
        <div className="mb-4">
          <label className="block text-xs font-normal text-[#596171] mb-1.5">{discount.type === "markup" ? "Markup amount" : "Discount amount"}</label>
          <div className="relative w-28">
            <input
              type="number"
              min={0}
              max={100}
              value={discount.percentage}
              onChange={e => onUpdate(planId, discount.id, { percentage: parseFloat(e.target.value) || 0 })}
              className="w-full h-9 pl-3 pr-7 rounded-md border border-[#dfe1e6] bg-white text-sm text-[#1A1A1A] outline-none focus:border-[#533AFD] focus:ring-[3px] focus:ring-[#533AFD]/15 transition-all"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#A0A8B4]">%</span>
          </div>
        </div>

        {/* Application */}
        <div className="mb-4">
          <label className="block text-xs font-normal text-[#596171] mb-1.5">Application</label>
          <div className="relative">
            <select
              value={application}
              onChange={e => handleApplicationChange(e.target.value)}
              className="w-full h-9 pl-3 pr-8 rounded-md border border-[#d8dee4] bg-white text-sm text-[#353A44] outline-none appearance-none cursor-pointer focus:border-[#533AFD] focus:ring-1 focus:ring-[#533AFD]"
            >
              <option value="everything">Everything in this contract</option>
              <option value="specific">Specific items in this contract</option>
              <option value="one-time">One-time items only</option>
              <option value="recurring">Recurring items only</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A0A8B4]" />
          </div>
        </div>

        {/* Specific-item picker (only when scoped to specific items) */}
        {application === "specific" && (
          <div className="mb-4">
            <label className="block text-xs font-normal text-[#596171] mb-1.5">Items</label>
            <div className="rounded-md border border-[#dfe1e6] divide-y divide-[#f0f1f4] overflow-hidden">
              {selectedPlans.length === 0 && (
                <p className="px-3 py-2.5 text-xs text-[#A0A8B4]">No items in this contract yet.</p>
              )}
              {selectedPlans.map(p => {
                const checked = appliedItems.includes(p.plan.id)
                return (
                  <button
                    key={p.plan.id}
                    type="button"
                    onClick={() => toggleItem(p.plan.id)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-[#f8f9fb] transition-colors"
                  >
                    <span
                      className={cn(
                        "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                        checked ? "bg-[#533AFD] border-[#533AFD]" : "bg-white border-[#cdd3db]",
                      )}
                    >
                      {checked && <Check className="w-3 h-3 text-white" />}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm text-[#353A44] truncate">{p.plan.name}</span>
                      <span className="block text-xs text-[#6c7688]">${p.plan.defaultMonthlyPrice.toFixed(2)} per month</span>
                    </span>
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-[#6c7688] mt-1.5">
              {appliedItems.length} of {selectedPlans.length} item{selectedPlans.length === 1 ? "" : "s"} selected
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Small inline summary of the discounts applying to a line, shown in the
// pricing form overview so "specific item" targeting is visible while editing.
// Each chip is clickable and navigates to that discount's form section — the
// same destination as clicking the discount in the tree or timeline.
function LineDiscountSummary({
  plans,
  planId,
  selectedNodeId,
  onSelectNode,
}: {
  plans: SelectedPlanEntry[]
  planId: string
  selectedNodeId: string
  onSelectNode: (id: string) => void
}) {
  const applied = discountsApplyingTo(plans, planId)
  if (applied.length === 0) return null
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      {applied.map(d => {
        // Resolve the plan that owns this discount so the node id matches the
        // tree's `discount-${ownerId}-${discountId}` exactly.
        const owner = plans.find(p => p.discounts.some(x => x.id === d.id))
        const nodeId = owner ? `discount-${owner.plan.id}-${d.id}` : null
        const isActive = nodeId !== null && selectedNodeId === nodeId
        return (
          <button
            key={d.id}
            type="button"
            onClick={() => nodeId && onSelectNode(nodeId)}
            aria-pressed={isActive}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
              isActive
                ? "text-white bg-[#533AFD] border border-[#533AFD]"
                : "text-[#533AFD] bg-[#F7F5FD] border border-[#F0ECFC] hover:bg-[#F0ECFC]"
            }`}
          >
            <Percent className="w-3 h-3" />
            {d.percentage}% off
          </button>
        )
      })}
    </div>
  )
}

// Whether a price override spans the product's entire servicing duration.
function overrideCoversFullDuration(entry: SelectedPlanEntry, override: PriceOverride): boolean {
  const same = (a: string, b: string) => new Date(a).getTime() === new Date(b).getTime()
  return same(override.startDate, entry.startDate) && same(override.endDate, entry.endDate)
}

// Shows the product's sticker (list) price next to an overridden price. When the
// override covers the whole duration, also surfaces the per-month delta vs
// sticker so the difference for the contract is obvious at a glance.
function StickerVsOverride({ entry, override }: { entry: SelectedPlanEntry; override: PriceOverride }) {
  const sticker = entry.plan.defaultMonthlyPrice
  const overridden = parseFloat(override.price) || 0
  const fullDuration = overrideCoversFullDuration(entry, override)
  const delta = overridden - sticker
  const isDiscount = delta < 0
  if (!fullDuration || delta === 0) return null
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
      <span className={`font-medium ${isDiscount ? "text-[#0a7d3f]" : "text-[#b3501e]"}`}>
        {isDiscount ? "−" : "+"}${Math.abs(delta).toFixed(2)}/mo
      </span>
    </div>
  )
}

// =============================================================================
// FORM PANEL COMPONENT
// =============================================================================
function FormPanel({
  selectedNodeId,
  selectedPlans,
  hideScheduleModule,
  contractId,
  customer,
  currency,
  draftExpiry,
  language,
  billingMethod,
  paymentMethod,
  oneTimeFees,
  onUpdateContractId,
  onUpdateCustomer,
  onUpdateCurrency,
  onUpdateDraftExpiry,
  onUpdateLanguage,
  onUpdateBillingMethod,
  onUpdatePaymentMethod,
  onUpdatePlan,
  onApplyEndDateToAll,
  onApplyStartDateToAll,
  onAddPriceOverride,
  onAddQuantityUpdate,
  onRemovePlan,
  onShowScheduleModal,
  onUpdatePriceOverride,
  onUpdateQuantityUpdate,
  onRemovePriceOverride,
  onRemoveQuantityUpdate,
  onUpdateDiscount,
  onRemoveDiscount,
  onOpenScheduleInTree,
  onSelectNode,
  onUpdateOneTimeFee,
  onRemoveOneTimeFee,
  onQuantityFocus,
}: {
  selectedNodeId: string
  selectedPlans: SelectedPlanEntry[]
  hideScheduleModule?: boolean
  contractId: string
  customer: { name: string; email: string } | null
  currency: string
  draftExpiry: string
  language: string
  billingMethod: "auto" | "manual"
  paymentMethod: "visa-4242" | "mc-5555" | "none"
  oneTimeFees: OneTimeFee[]
  onUpdateContractId: (v: string) => void
  onUpdateCustomer: (c: { name: string; email: string }) => void
  onUpdateCurrency: (v: string) => void
  onUpdateDraftExpiry: (v: string) => void
  onUpdateLanguage: (v: string) => void
  onUpdateBillingMethod: (v: "auto" | "manual") => void
  onUpdatePaymentMethod: (v: "visa-4242" | "mc-5555" | "none") => void
  onUpdatePlan: (planId: string, updates: Partial<SelectedPlanEntry>) => void
  onApplyEndDateToAll: (endDate: string) => void
  onApplyStartDateToAll: (startDate: string) => void
  onAddPriceOverride: (planId: string) => void
  onAddQuantityUpdate: (planId: string) => void
  onRemovePlan: (planId: string) => void
  onShowScheduleModal: (planId: string) => void
  onUpdatePriceOverride: (planId: string, overrideId: string, updates: Partial<PriceOverride>) => void
  onUpdateQuantityUpdate: (planId: string, quId: string, updates: Partial<QuantityUpdate>) => void
  onRemovePriceOverride: (planId: string, overrideId: string) => void
  onRemoveQuantityUpdate: (planId: string, quId: string) => void
  onUpdateDiscount: (planId: string, discountId: string, updates: Partial<Discount>) => void
  onRemoveDiscount: (planId: string, discountId: string) => void
  onOpenScheduleInTree: (planId: string) => void
  onSelectNode: (id: string) => void
  onUpdateOneTimeFee: (id: string, updates: Partial<OneTimeFee>) => void
  onRemoveOneTimeFee: (id: string) => void
  onQuantityFocus?: (planId: string | null) => void
  }) {

  // When the user extends/changes one product's end date and other products
  // still end on a different date, we offer to apply the new end date to all of
  // them. Holds the end date being offered, or null when there's nothing to ask.
  const [applyEndDatePrompt, setApplyEndDatePrompt] = useState<string | null>(null)
  // Same idea for the start date — offer to align every product's start.
  const [applyStartDatePrompt, setApplyStartDatePrompt] = useState<string | null>(null)

  // Update a single plan's end date, then decide whether to surface the
  // "apply to all products" prompt (only when other products differ).
  const handleEndDateChange = (planId: string, isoValue: string) => {
    const newEnd = fromIso(isoValue)
    onUpdatePlan(planId, { endDate: newEnd })
    const others = selectedPlans.filter(p => p.plan.id !== planId)
    const someoneDiffers = others.some(p => p.endDate !== newEnd)
    setApplyEndDatePrompt(others.length > 0 && someoneDiffers ? newEnd : null)
  }

  // Update a single plan's start date, then offer to align the other products
  // when they currently start on a different date.
  const handleStartDateChange = (planId: string, isoValue: string) => {
    const newStart = fromIso(isoValue)
    onUpdatePlan(planId, { startDate: newStart })
    const others = selectedPlans.filter(p => p.plan.id !== planId)
    const someoneDiffers = others.some(p => p.startDate !== newStart)
    setApplyStartDatePrompt(others.length > 0 && someoneDiffers ? newStart : null)
  }

  // Dismiss the prompts when navigating to a different node so they never linger
  // under an unrelated product.
  useEffect(() => {
    setApplyEndDatePrompt(null)
    setApplyStartDatePrompt(null)
  }, [selectedNodeId])

  // Inline banner offering to align every product to the same end date.
  const renderEndDatePrompt = (planId: string) => {
    if (!applyEndDatePrompt) return null
    const count = selectedPlans.filter(p => p.plan.id !== planId).length
    return (
      <div className="mt-2.5 rounded-md border border-[#e3e0fc] bg-[#f7f6fe] p-3">
        <p className="text-xs text-[#596171] leading-relaxed">
          Apply this end date ({formatDateShort(new Date(applyEndDatePrompt))}) to your{" "}
          {count === 1 ? "other product" : `other ${count} products`} too?
        </p>
        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={() => {
              onApplyEndDateToAll(applyEndDatePrompt)
              setApplyEndDatePrompt(null)
            }}
            className="px-2.5 py-1 rounded-md bg-[#533AFD] hover:bg-[#4730E0] text-xs font-medium text-white transition-colors"
          >
            Apply to all
          </button>
          <button
            onClick={() => setApplyEndDatePrompt(null)}
            className="px-2.5 py-1 rounded-md border border-[#d8dee4] bg-white hover:bg-[#f5f6f8] text-xs font-medium text-[#353A44] transition-colors"
          >
            Keep separate
          </button>
        </div>
      </div>
    )
  }

  // Inline banner offering to align every product to the same start date.
  const renderStartDatePrompt = (planId: string) => {
    if (!applyStartDatePrompt) return null
    const count = selectedPlans.filter(p => p.plan.id !== planId).length
    return (
      <div className="mt-2.5 rounded-md border border-[#e3e0fc] bg-[#f7f6fe] p-3">
        <p className="text-xs text-[#596171] leading-relaxed">
          Apply this start date ({formatDateShort(new Date(applyStartDatePrompt))}) to your{" "}
          {count === 1 ? "other product" : `other ${count} products`} too?
        </p>
        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={() => {
              onApplyStartDateToAll(applyStartDatePrompt)
              setApplyStartDatePrompt(null)
            }}
            className="px-2.5 py-1 rounded-md bg-[#533AFD] hover:bg-[#4730E0] text-xs font-medium text-white transition-colors"
          >
            Apply to all
          </button>
          <button
            onClick={() => setApplyStartDatePrompt(null)}
            className="px-2.5 py-1 rounded-md border border-[#d8dee4] bg-white hover:bg-[#f5f6f8] text-xs font-medium text-[#353A44] transition-colors"
          >
            Keep separate
          </button>
        </div>
      </div>
    )
  }

  // Find the relevant plan and data based on selected node
  const getPlanFromNodeId = (nodeId: string): SelectedPlanEntry | null => {
    let best: SelectedPlanEntry | null = null
    let bestLen = 0
    for (const entry of selectedPlans) {
      if (nodeId === `plan-${entry.plan.id}`) return entry
      const prefix = `plan-${entry.plan.id}-`
      if (nodeId.startsWith(prefix) && prefix.length > bestLen) {
        best = entry
        bestLen = prefix.length
      }
    }
    return best
  }

  const selectedPlan = getPlanFromNodeId(selectedNodeId)
  
  // Check if this is a price override node
  const isPriceOverrideNode = selectedNodeId.includes("-override-")
  const isQuantityUpdateNode = selectedNodeId.includes("-qty-")
  const isScheduleNode = selectedNodeId.includes("-add-schedule")
  const isPriceNode = selectedNodeId.endsWith("-price")
  
  // Get specific override/quantity update if selected
  const getSelectedOverride = (): PriceOverride | null => {
    if (!selectedPlan || !isPriceOverrideNode) return null
    const overrideId = selectedNodeId.split("-override-")[1]
    return selectedPlan.priceOverrides.find(o => o.id === overrideId) || null
  }
  
  const getSelectedQuantityUpdate = (): QuantityUpdate | null => {
    if (!selectedPlan || !isQuantityUpdateNode) return null
    const quId = selectedNodeId.split("-qty-")[1]
    return selectedPlan.quantityUpdates.find(q => q.id === quId) || null
  }

  const selectedOverride = getSelectedOverride()
  const selectedQuantityUpdate = getSelectedQuantityUpdate()

  // The product node itself (e.g. "Enterprise Seats") — the tree row that sits
  // directly above the price. Selecting it opens the product detail form, while
  // the price child node keeps the pricing/servicing form.
  const isPlanRootNode = !!selectedPlan && selectedNodeId === `plan-${selectedPlan.plan.id}`

  // One-time fee node
  const isOneTimeFeeNode = selectedNodeId.startsWith("one-time-fee-")
  const selectedOneTimeFee = isOneTimeFeeNode
    ? oneTimeFees.find(f => `one-time-fee-${f.id}` === selectedNodeId) ?? null
    : null

  // Each discount has its own tree node (id: `discount-${planId}-${discountId}`).
  // Resolve the exact plan + discount the selected node points at.
  const isDiscountNode = selectedNodeId.startsWith("discount-")
  let discountEntry: SelectedPlanEntry | null = null
  let selectedDiscount: Discount | null = null
  if (isDiscountNode) {
    for (const p of selectedPlans) {
      const match = p.discounts.find(d => `discount-${p.plan.id}-${d.id}` === selectedNodeId)
      if (match) {
        discountEntry = p
        selectedDiscount = match
        break
      }
    }
  }

  // Draft-expiration guardrail: the draft must expire before the contract term
  // begins. Derive the earliest term start and the latest allowed expiry.
  const termStartIso = earliestTermStartIso(selectedPlans)
  const maxDraftExpiryIso = termStartIso ? isoAddDays(termStartIso, -1) : ""
  const draftExpiryInvalid = !!(termStartIso && draftExpiry && draftExpiry >= termStartIso)

  // General information form (contract root)
  if (selectedNodeId === "contract-root") {
    return (
      <div className="flex-1 min-w-0 border-r border-[#ebeef1] flex flex-col bg-white overflow-hidden">
        <div className="flex items-center justify-between px-5 h-12 shrink-0">
          <h2 className="text-sm font-semibold text-[#353A44] truncate">{contractId}</h2>
          <button className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#f5f6f8] text-[#A0A8B4]">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-5">
          <h3 className="text-base font-semibold text-[#353A44] mb-4">General information</h3>

          <div className="mb-4">
            <label className="block text-xs font-normal text-[#596171] mb-1.5">Contract number</label>
            <input
              type="text"
              value={contractId}
              onChange={e => onUpdateContractId(e.target.value)}
              className="w-full h-9 px-3 rounded-md border border-[#dfe1e6] bg-white text-sm text-[#1A1A1A] outline-none focus:border-[#533AFD] focus:ring-[3px] focus:ring-[#533AFD]/15 transition-all"
            />
          </div>

          <div className="mb-4">
            <label className="block text-xs font-normal text-[#596171] mb-1.5">Customer</label>
            <div className="relative">
              <select
                value={customer?.name || ""}
                onChange={e => {
                  const c = customerOptions.find(o => o.name === e.target.value)
                  if (c) onUpdateCustomer(c)
                }}
                className="w-full h-9 pl-3 pr-8 rounded-md border border-[#dfe1e6] bg-white text-sm text-[#1A1A1A] outline-none appearance-none cursor-pointer focus:border-[#533AFD] focus:ring-[3px] focus:ring-[#533AFD]/15 transition-all"
              >
                {customerOptions.map(c => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A0A8B4]" />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-normal text-[#596171] mb-1.5">Currency</label>
            <div className="relative">
              <select
                value={currency}
                onChange={e => onUpdateCurrency(e.target.value)}
                className="w-full h-9 pl-3 pr-8 rounded-md border border-[#dfe1e6] bg-white text-sm text-[#1A1A1A] outline-none appearance-none cursor-pointer focus:border-[#533AFD] focus:ring-[3px] focus:ring-[#533AFD]/15 transition-all"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="CAD">CAD</option>
                <option value="AUD">AUD</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A0A8B4]" />
            </div>
          </div>

          <div className="mb-6">
            <SailDatePicker
              label="Draft expiration"
              value={draftExpiry}
              onChange={v => {
                let clamped = v
                if (maxDraftExpiryIso && clamped > maxDraftExpiryIso) clamped = maxDraftExpiryIso
                onUpdateDraftExpiry(clamped)
              }}
              disableAfter={maxDraftExpiryIso || undefined}
              error={draftExpiryInvalid}
            />
            {draftExpiryInvalid ? (
              <p className="mt-1.5 text-xs text-[#e61947]">
                Draft expiration must be before the contract starts ({formatDateShort(new Date(termStartIso + "T00:00:00"))}).
              </p>
            ) : termStartIso ? (
              <p className="mt-1.5 text-xs text-[#A0A8B4]">
                Must be on or before {formatDateShort(new Date(maxDraftExpiryIso + "T00:00:00"))}, the day before the term starts.
              </p>
            ) : null}
          </div>

          <h3 className="text-base font-semibold text-[#353A44] mb-3">Billing and collections</h3>
          <button
            onClick={() => onUpdateBillingMethod("auto")}
            className="w-full flex items-start gap-3 text-left mb-4"
          >
            <span
              className={cn(
                "mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                billingMethod === "auto" ? "border-[#533AFD]" : "border-[#d8dee4]",
              )}
            >
              {billingMethod === "auto" && <span className="w-2 h-2 rounded-full bg-[#533AFD]" />}
            </span>
            <span className="flex-1">
              <span className="block text-sm font-medium text-[#353A44]">
                Automatically charge a payment method on file
              </span>
            </span>
          </button>

          {billingMethod === "auto" && (
            <div className="mt-1 mb-4 p-3 rounded-md border border-[#dfe1e6] bg-[#fafbfc]">
              <div className="text-xs font-medium text-[#596171] mb-2">Payment method</div>
              {[
                { id: "visa-4242", label: "Visa •••• 4242", badge: "VISA", color: "#1a1f71" },
                { id: "mc-5555", label: "Mastercard •••• 5555", badge: "MC", color: "#eb001b" },
              ].map(pm => (
                <button
                  key={pm.id}
                  onClick={() => onUpdatePaymentMethod(pm.id as "visa-4242" | "mc-5555" | "none")}
                  className="w-full flex items-center gap-2.5 py-1.5 text-left"
                >
                  <span className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                    paymentMethod === pm.id ? "border-[#533AFD]" : "border-[#d8dee4]")}>
                    {paymentMethod === pm.id && <span className="w-2 h-2 rounded-full bg-[#533AFD]" />}
                  </span>
                  <span className="w-8 h-5 rounded flex items-center justify-center text-[8px] font-bold text-white shrink-0"
                    style={{ background: pm.color }}>
                    {pm.badge}
                  </span>
                  <span className="text-sm text-[#353A44]">{pm.label}</span>
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => onUpdateBillingMethod("manual")}
            className="w-full flex items-start gap-3 text-left mb-4"
          >
            <span
              className={cn(
                "mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                billingMethod === "manual" ? "border-[#533AFD]" : "border-[#d8dee4]",
              )}
            >
              {billingMethod === "manual" && <span className="w-2 h-2 rounded-full bg-[#533AFD]" />}
            </span>
            <span className="flex-1">
              <span className="block text-sm font-medium text-[#353A44]">
                Email invoice to the customer to pay manually
              </span>
              <span className="block text-xs text-[#6c7688] mt-1 leading-relaxed">
                Set your payment preferences, and we&apos;ll take care of the rest.
              </span>
            </span>
          </button>

          {/* Collection status */}
          <div className="flex items-center gap-2 py-2 px-3 rounded-md border border-[#ebeef1] bg-[#fafbfc]">
            <span className={cn("w-2 h-2 rounded-full shrink-0",
              billingMethod === "auto" && paymentMethod !== "none"
                ? "bg-[#2b8700]"
                : "bg-[#f59e0b]"
            )} />
            <span className="text-xs text-[#596171]">
              Collection status:{" "}
              <span className="font-medium text-[#353A44]">
                {billingMethod === "auto" && paymentMethod !== "none" ? "Active" : "Pending payment method"}
              </span>
            </span>
          </div>
        </div>
      </div>
    )
  }

  // Account information form (customer)
  if (selectedNodeId === "customer") {
    return (
      <div className="flex-1 min-w-0 border-r border-[#ebeef1] flex flex-col bg-white overflow-hidden">
        <div className="flex items-center justify-between px-5 h-12 shrink-0">
          <h2 className="text-sm font-semibold text-[#353A44] truncate">{customer?.name || "Customer"}</h2>
          <button className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#f5f6f8] text-[#A0A8B4]">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-5">
          <h3 className="text-base font-semibold text-[#353A44] mb-4">Account information</h3>

          <div className="mb-4">
            <label className="block text-xs font-normal text-[#596171] mb-1.5">Name</label>
            <input
              type="text"
              value={customer?.name || ""}
              onChange={e => onUpdateCustomer({ name: e.target.value, email: customer?.email || "" })}
              className="w-full h-9 px-3 rounded-md border border-[#dfe1e6] bg-white text-sm text-[#1A1A1A] outline-none focus:border-[#533AFD] focus:ring-[3px] focus:ring-[#533AFD]/15 transition-all"
            />
          </div>

          <div className="mb-4">
            <label className="block text-xs font-normal text-[#596171] mb-1.5">Email</label>
            <input
              type="email"
              value={customer?.email || ""}
              onChange={e => onUpdateCustomer({ name: customer?.name || "", email: e.target.value })}
              className="w-full h-9 px-3 rounded-md border border-[#dfe1e6] bg-white text-sm text-[#1A1A1A] outline-none focus:border-[#533AFD] focus:ring-[3px] focus:ring-[#533AFD]/15 transition-all"
            />
          </div>

          <div className="mb-6">
            <label className="block text-xs font-normal text-[#596171] mb-1.5">Language</label>
            <div className="relative">
              <select
                value={language}
                onChange={e => onUpdateLanguage(e.target.value)}
                className="w-full h-9 pl-3 pr-8 rounded-md border border-[#dfe1e6] bg-white text-sm text-[#1A1A1A] outline-none appearance-none cursor-pointer focus:border-[#533AFD] focus:ring-[3px] focus:ring-[#533AFD]/15 transition-all"
              >
                <option>English</option>
                <option>Spanish</option>
                <option>French</option>
                <option>German</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A0A8B4]" />
            </div>
          </div>

          <div className="-mx-5 border-t border-[#ebeef1]">
            {["Billing information", "Tax information", "Shipping information", "Invoice settings"].map(
              section => (
                <button
                  key={section}
                  className="w-full flex items-center justify-between px-5 py-3.5 border-b border-[#ebeef1] hover:bg-[#f5f6f8] transition-colors text-left"
                >
                  <span className="text-base font-semibold text-[#353A44]">{section}</span>
                  <ChevronRight className="w-4 h-4 text-[#A0A8B4]" />
                </button>
              ),
            )}
          </div>
        </div>
      </div>
    )
  }

  // Schedule price override form
  if (isPriceOverrideNode && selectedPlan && selectedOverride) {
    return (
      <div className="flex-1 min-w-0 border-r border-[#ebeef1] flex flex-col bg-white overflow-hidden">
        <div className="flex items-center justify-between px-5 h-12 shrink-0">
          <h2 className="text-sm font-semibold text-[#353A44] truncate">Schedule price override</h2>
          <button 
            onClick={() => onRemovePriceOverride(selectedPlan.plan.id, selectedOverride.id)}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#fef4f6] text-[#A0A8B4] hover:text-[#e61947] transition-colors shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-5">

        {/* Duration */}
        <div className="mb-4">
          <label className="block text-xs font-normal text-[#596171] mb-1.5">Duration</label>
          <DurationFields
            start={selectedOverride.startDate}
            end={selectedOverride.endDate}
            onChange={next =>
              onUpdatePriceOverride(selectedPlan.plan.id, selectedOverride.id, {
                ...(next.start !== undefined ? { startDate: next.start } : {}),
                ...(next.end !== undefined ? { endDate: next.end } : {}),
              })
            }
          />
        </div>

        {/* Price per unit */}
        <div className="mb-5">
          <label className="block text-xs font-normal text-[#596171] mb-1.5">Price per unit</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#A0A8B4]">$</span>
            <input
              type="text"
              value={selectedOverride.price}
              onChange={e => onUpdatePriceOverride(selectedPlan.plan.id, selectedOverride.id, { price: e.target.value })}
              className="w-full h-9 pl-7 pr-3 rounded-md border border-[#dfe1e6] bg-white text-sm text-[#1A1A1A] outline-none focus:border-[#533AFD] focus:ring-[3px] focus:ring-[#533AFD]/15 transition-all"
            />
          </div>
        </div>
        </div>
      </div>
    )
  }

  // Schedule quantity update form
  if (isQuantityUpdateNode && selectedPlan && selectedQuantityUpdate) {
    return (
      <div className="flex-1 min-w-0 border-r border-[#ebeef1] flex flex-col bg-white overflow-hidden">
        <div className="flex items-center justify-between px-5 h-12 shrink-0">
          <h2 className="text-sm font-semibold text-[#353A44] truncate">Schedule quantity update</h2>
          <button 
            onClick={() => onRemoveQuantityUpdate(selectedPlan.plan.id, selectedQuantityUpdate.id)}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#fef4f6] text-[#A0A8B4] hover:text-[#e61947] transition-colors shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-5">

        {/* Effective date */}
        <div className="mb-4">
          <SailDatePicker
            label="Effective date"
            value={toIso(selectedQuantityUpdate.effectiveDate)}
            onChange={v => onUpdateQuantityUpdate(selectedPlan.plan.id, selectedQuantityUpdate.id, { effectiveDate: fromIso(v) })}
          />
        </div>

        {/* Quantity */}
        <div className="mb-5">
          <label className="block text-xs font-normal text-[#596171] mb-1.5">Quantity</label>
          <input
            type="number"
            value={selectedQuantityUpdate.quantity}
            onChange={e => onUpdateQuantityUpdate(selectedPlan.plan.id, selectedQuantityUpdate.id, { quantity: parseInt(e.target.value) || 1 })}
            className="w-full h-9 px-3 rounded-md border border-[#dfe1e6] bg-white text-sm text-[#1A1A1A] outline-none focus:border-[#533AFD] focus:ring-[3px] focus:ring-[#533AFD]/15 transition-all"
          />
        </div>
        </div>
      </div>
    )
  }

  // Schedule action node - show modal trigger
  if (isScheduleNode && selectedPlan) {
    return (
      <div className="flex-1 min-w-0 border-r border-[#ebeef1] flex flex-col bg-white overflow-hidden">
        <div className="flex items-center justify-between px-5 h-12 shrink-0">
          <h2 className="text-sm font-semibold text-[#353A44] truncate">{selectedPlan.plan.name}</h2>
          <button 
            onClick={() => onRemovePlan(selectedPlan.plan.id)}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#fef4f6] text-[#A0A8B4] hover:text-[#e61947] transition-colors shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-5">

        {/* Sticker price */}
        <div className="mb-5">
          <div className="text-[11px] font-medium text-[#A0A8B4] mb-0.5">Sticker price</div>
          <div className="text-lg font-semibold text-[#353A44]">${selectedPlan.plan.defaultMonthlyPrice.toFixed(2)} USD</div>
          <div className="text-xs text-[#6c7688] mt-0.5">{selectedPlan.plan.description}</div>
          <LineDiscountSummary
            plans={selectedPlans}
            planId={selectedPlan.plan.id}
            selectedNodeId={selectedNodeId}
            onSelectNode={onSelectNode}
          />
        </div>

        {/* Duration */}
        <div className="mb-5">
          <label className="block text-xs font-normal text-[#596171] mb-1.5">Duration</label>
          <DurationFields
            start={selectedPlan.startDate}
            end={selectedPlan.endDate}
            onChange={next => {
              if (next.start !== undefined) handleStartDateChange(selectedPlan.plan.id, toIso(next.start))
              if (next.end !== undefined) handleEndDateChange(selectedPlan.plan.id, toIso(next.end))
            }}
          />
          {renderStartDatePrompt(selectedPlan.plan.id)}
          {renderEndDatePrompt(selectedPlan.plan.id)}
        </div>

        {/* Quantity */}
        <div className="mb-5">
          <label className="block text-xs font-normal text-[#596171] mb-1.5">Quantity</label>
          <input
            type="number"
            value={selectedPlan.quantity}
            onChange={e => onUpdatePlan(selectedPlan.plan.id, { quantity: parseInt(e.target.value) || 1 })}
            onFocus={() => onQuantityFocus?.(selectedPlan.plan.id)}
            onBlur={() => onQuantityFocus?.(null)}
            className="w-full h-9 px-3 rounded-md border border-[#dfe1e6] bg-white text-sm text-[#1A1A1A] outline-none focus:border-[#3BABFD] focus:ring-[3px] focus:ring-[#3BABFD]/15 transition-all"
          />
        </div>

        {/* Schedule updates card */}
        {!hideScheduleModule && (
        <div className="border border-[#ebeef1] rounded-lg p-4 bg-[#fafbfc]">
          <h3 className="text-sm font-semibold text-[#353A44] mb-3">Schedule updates</h3>
          
          {/* Mini timeline visualization */}
          <div className="bg-white rounded-md border border-[#ebeef1] p-3 mb-3">
            <div className="flex items-center gap-4 text-[10px] text-[#A0A8B4] mb-2">
              <span>Jan 2026</span>
              <span>Jan 2027</span>
              <span>Jan 2028</span>
            </div>
            <div className="space-y-1.5">
              <div className="h-3 bg-[#e6e9ed] rounded-full w-full relative">
                <div className="absolute left-0 top-0 h-3 bg-[#475569] rounded-full w-1/3" />
              </div>
              <div className="h-3 bg-[#eef0f3] rounded-full w-2/3" />
              <div className="h-3 bg-[#f5f6f8] rounded-full w-1/2" />
            </div>
          </div>

          <p className="text-xs text-[#6c7688] mb-4">
            Schedule custom pricing, discounts, or quantity updates without changing the foundational contract structure.
          </p>

          <div className="relative inline-block">
            <button
              onClick={() => onOpenScheduleInTree(selectedPlan.plan.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#d8dee4] bg-white hover:bg-[#f5f6f8] text-sm font-medium text-[#353A44] transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-[#475569]" />
              Schedule
            </button>
          </div>
        </div>
        )}
        </div>
      </div>
    )
  }

  // Product detail form (when the product node itself is selected)
  if (isPlanRootNode && selectedPlan) {
    return (
      <ProductForm
        plan={selectedPlan.plan}
        currency={currency}
        onUpdatePlan={onUpdatePlan}
        onRemove={() => onRemovePlan(selectedPlan.plan.id)}
      />
    )
  }

  // Discount form (when a discount node is selected)
  if (isDiscountNode && discountEntry && selectedDiscount) {
    return (
      <DiscountForm
        planId={discountEntry.plan.id}
        discount={selectedDiscount}
        selectedPlans={selectedPlans}
        onUpdate={onUpdateDiscount}
        onRemove={() => onRemoveDiscount(discountEntry.plan.id, selectedDiscount.id)}
      />
    )
  }

  // Default plan form (when plan node is selected)
  if (selectedNodeId.startsWith("plan-") && selectedPlan) {
    return (
      <div className="flex-1 min-w-0 border-r border-[#ebeef1] flex flex-col bg-white overflow-hidden">
        <div className="flex items-center justify-between px-5 h-12 shrink-0">
          <h2 className="text-sm font-semibold text-[#353A44] truncate">{selectedPlan.plan.name}</h2>
          <button 
            onClick={() => onRemovePlan(selectedPlan.plan.id)}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#fef4f6] text-[#A0A8B4] hover:text-[#e61947] transition-colors shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-5">

        {/* Sticker price */}
        <div className="mb-5">
          <div className="text-[11px] font-medium text-[#A0A8B4] mb-0.5">Sticker price</div>
          <div className="text-lg font-semibold text-[#353A44]">${selectedPlan.plan.defaultMonthlyPrice.toFixed(2)} USD</div>
          <div className="text-xs text-[#6c7688] mt-0.5">{selectedPlan.plan.description}</div>
          <LineDiscountSummary
            plans={selectedPlans}
            planId={selectedPlan.plan.id}
            selectedNodeId={selectedNodeId}
            onSelectNode={onSelectNode}
          />
        </div>

        {/* Duration */}
        <div className="mb-5">
          <label className="block text-xs font-normal text-[#596171] mb-1.5">Duration</label>
          <DurationFields
            start={selectedPlan.startDate}
            end={selectedPlan.endDate}
            onChange={next => {
              if (next.start !== undefined) handleStartDateChange(selectedPlan.plan.id, toIso(next.start))
              if (next.end !== undefined) handleEndDateChange(selectedPlan.plan.id, toIso(next.end))
            }}
          />
          {renderStartDatePrompt(selectedPlan.plan.id)}
          {renderEndDatePrompt(selectedPlan.plan.id)}
        </div>

        {/* Quantity */}
        <div className="mb-5">
          <label className="block text-xs font-normal text-[#596171] mb-1.5">Quantity</label>
          <input
            type="number"
            value={selectedPlan.quantity}
            onChange={e => onUpdatePlan(selectedPlan.plan.id, { quantity: parseInt(e.target.value) || 1 })}
            onFocus={() => onQuantityFocus?.(selectedPlan.plan.id)}
            onBlur={() => onQuantityFocus?.(null)}
            className="w-full h-9 px-3 rounded-md border border-[#dfe1e6] bg-white text-sm text-[#1A1A1A] outline-none focus:border-[#3BABFD] focus:ring-[3px] focus:ring-[#3BABFD]/15 transition-all"
          />
        </div>

        {/* Pricing overrides */}
        {selectedPlan.priceOverrides.length > 0 && (
          <div className="mb-5">
            <label className="block text-xs font-normal text-[#596171] mb-2">Pricing overrides</label>
            <div className="space-y-2">
              {selectedPlan.priceOverrides.map(override => (
                <div key={override.id} className="border border-[#ebeef1] rounded-lg p-3 cursor-pointer hover:border-[#533AFD] transition-colors">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="text-xs text-[#6c7688]">
                      {formatDateShort(new Date(override.startDate))} → {formatDateShort(new Date(override.endDate))}
                    </div>
                    {overrideCoversFullDuration(selectedPlan, override) && (
                      <span className="text-[10px] font-medium text-[#533AFD] bg-[#F7F5FD] border border-[#F0ECFC] rounded-full px-1.5 py-0.5 shrink-0">
                        Full term
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-[#353A44]">${override.price} USD per month</div>
                  <StickerVsOverride entry={selectedPlan} override={override} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quantity updates */}
        {selectedPlan.quantityUpdates.length > 0 && (
          <div className="mb-5">
            <label className="block text-xs font-normal text-[#596171] mb-2">Quantity updates</label>
            <div className="space-y-2">
              {selectedPlan.quantityUpdates.map(qu => (
                <div key={qu.id} className="border border-[#ebeef1] rounded-lg p-3 cursor-pointer hover:border-[#533AFD] transition-colors">
                  <div className="text-xs text-[#6c7688] mb-1">
                    Effective {formatDateShort(new Date(qu.effectiveDate))}
                  </div>
                  <div className="text-sm font-semibold text-[#353A44]">{qu.quantity} units</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Schedule updates card - ONLY show when NO scheduled items exist and none scheduled this session */}
        {!hideScheduleModule && selectedPlan.priceOverrides.length === 0 && selectedPlan.quantityUpdates.length === 0 && (
          <div className="border border-[#ebeef1] rounded-lg p-4 bg-[#fafbfc]">
            <h3 className="text-sm font-semibold text-[#353A44] mb-3">Schedule updates</h3>
            
            {/* Mini timeline visualization */}
            <div className="bg-white rounded-md border border-[#ebeef1] p-3 mb-3">
              <div className="flex items-center gap-4 text-[10px] text-[#A0A8B4] mb-2">
                <span>Jan 2026</span>
                <span>Jan 2027</span>
                <span>Jan 2028</span>
              </div>
              <div className="space-y-1.5">
                <div className="h-3 bg-[#e6e9ed] rounded-full w-full relative">
                  <div className="absolute left-0 top-0 h-3 bg-[#475569] rounded-full w-1/3" />
                </div>
                <div className="h-3 bg-[#eef0f3] rounded-full w-2/3" />
                <div className="h-3 bg-[#f5f6f8] rounded-full w-1/2" />
              </div>
            </div>

            <p className="text-xs text-[#6c7688] mb-4">
              Schedule custom pricing, discounts, or quantity updates without changing the foundational contract structure.
            </p>

            <div className="relative inline-block">
              <button
                onClick={() => onOpenScheduleInTree(selectedPlan.plan.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#d8dee4] bg-white hover:bg-[#f5f6f8] text-sm font-medium text-[#353A44] transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-[#475569]" />
                Schedule
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    )
  }

  // One-time fee form
  if (isOneTimeFeeNode && selectedOneTimeFee) {
    const fee = selectedOneTimeFee
    const isSpecificDate = fee.billingDate !== "on_activation"
    return (
      <div className="flex-1 min-w-0 border-r border-[#ebeef1] flex flex-col bg-white overflow-hidden">
        <div className="flex items-center justify-between px-5 h-12 shrink-0">
          <h2 className="text-sm font-semibold text-[#353A44] truncate">{fee.name || "One-time fee"}</h2>
          <button
            onClick={() => onRemoveOneTimeFee(fee.id)}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#fef4f6] text-[#A0A8B4] hover:text-[#e61947] transition-colors shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-5">
          {/* Name */}
          <div className="mb-4">
            <label className="block text-xs font-normal text-[#596171] mb-1.5">Name</label>
            <input
              type="text"
              value={fee.name}
              onChange={e => onUpdateOneTimeFee(fee.id, { name: e.target.value })}
              className="w-full h-9 px-3 rounded-md border border-[#dfe1e6] bg-white text-sm text-[#1A1A1A] outline-none focus:border-[#533AFD] focus:ring-[3px] focus:ring-[#533AFD]/15 transition-all"
            />
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-xs font-normal text-[#596171] mb-1.5">Description</label>
            <input
              type="text"
              value={fee.description ?? ""}
              onChange={e => onUpdateOneTimeFee(fee.id, { description: e.target.value })}
              className="w-full h-9 px-3 rounded-md border border-[#dfe1e6] bg-white text-sm text-[#1A1A1A] outline-none focus:border-[#533AFD] focus:ring-[3px] focus:ring-[#533AFD]/15 transition-all"
            />
          </div>

          {/* Amount */}
          <div className="mb-4">
            <label className="block text-xs font-normal text-[#596171] mb-1.5">Amount ($)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#A0A8B4]">$</span>
              <input
                type="number"
                min={0}
                value={fee.amount}
                onChange={e => onUpdateOneTimeFee(fee.id, { amount: e.target.value })}
                className="w-full h-9 pl-7 pr-3 rounded-md border border-[#dfe1e6] bg-white text-sm text-[#1A1A1A] outline-none focus:border-[#533AFD] focus:ring-[3px] focus:ring-[#533AFD]/15 transition-all"
              />
            </div>
          </div>

          {/* Billing date */}
          <div className="mb-4">
            <label className="block text-xs font-normal text-[#596171] mb-1.5">Billing date</label>
            <div className="space-y-2">
              <button
                onClick={() => onUpdateOneTimeFee(fee.id, { billingDate: "on_activation" })}
                className="w-full flex items-center gap-2.5 text-left"
              >
                <span className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                  !isSpecificDate ? "border-[#533AFD]" : "border-[#d8dee4]")}>
                  {!isSpecificDate && <span className="w-2 h-2 rounded-full bg-[#533AFD]" />}
                </span>
                <span className="text-sm text-[#353A44]">On contract activation</span>
              </button>
              <button
                onClick={() => {
                  if (!isSpecificDate) {
                    const today = new Date().toISOString().slice(0, 10)
                    onUpdateOneTimeFee(fee.id, { billingDate: today })
                  }
                }}
                className="w-full flex items-center gap-2.5 text-left"
              >
                <span className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                  isSpecificDate ? "border-[#533AFD]" : "border-[#d8dee4]")}>
                  {isSpecificDate && <span className="w-2 h-2 rounded-full bg-[#533AFD]" />}
                </span>
                <span className="text-sm text-[#353A44]">Specific date</span>
              </button>
            </div>
            {isSpecificDate && (
              <div className="mt-2">
                <SailDatePicker
                  label=""
                  value={fee.billingDate}
                  onChange={v => onUpdateOneTimeFee(fee.id, { billingDate: v })}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Empty state
  return (
    <div className="flex-1 min-w-0 border-r border-[#ebeef1] p-5 flex items-center justify-center bg-white">
      <p className="text-sm text-[#A0A8B4]">Select an item to edit</p>
    </div>
  )
}

// =============================================================================
// SHARED ORDER FORM DOCUMENT
// One canonical order-form rendering used by BOTH the get-started live preview
// and the editor's PDF view, so the two surfaces can never drift apart. Any
// change to the order form's look happens here, in one place.
// =============================================================================
const ORDER_FORM_LABEL = "text-[11px] text-[#A0A8B4] font-semibold mb-1"

function OrderFormDocument({
  contractId,
  customer,
  currency,
  draftExpiry,
  documentName = null,
  selectedPlans,
  billingMethod = "auto",
}: {
  contractId: string
  customer: { name: string; email: string } | null
  currency: string
  draftExpiry: string
  documentName?: string | null
  selectedPlans: SelectedPlanEntry[]
  billingMethod?: "auto" | "manual"
}) {
  const currencyCode = currency || "USD"
  const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

  // First invoice date = earliest pricing-line start date, if any.
  const startDates = selectedPlans
    .map(p => new Date(p.startDate))
    .filter(d => !isNaN(d.getTime()))
  const firstInvoiceDate = startDates.length
    ? new Date(Math.min(...startDates.map(d => d.getTime())))
    : null
  const firstInvoice = firstInvoiceDate
    ? firstInvoiceDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "On signature"
  // The order form is effective on the contract start date (first invoice).
  const effectiveDate = (firstInvoiceDate ?? new Date()).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })

  // Total contract value: sum each line's actual monthly invoices across its own
  // term, honoring scheduled price overrides, quantity updates, and discounts.
  // A flat price × qty × 12 would ignore promos and mid-term seat ramps.
  const lineContractValue = (p: SelectedPlanEntry) => {
    const start = new Date(p.startDate)
    const end = new Date(p.endDate)
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return p.plan.defaultMonthlyPrice * p.quantity * 12
    }
    let total = 0
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1)
    while (cursor.getTime() <= end.getTime()) {
      total += lineStateAt(p, cursor).mrr
      cursor.setMonth(cursor.getMonth() + 1)
    }
    return total
  }
  const totalContractValue = selectedPlans.reduce((sum, p) => sum + lineContractValue(p), 0)
  // Recurring total = the MRR in effect at the first invoice (the opening monthly
  // charge), which can differ from later months when a ramp or promo applies.
  const totalMonthly = firstInvoiceDate
    ? selectedPlans.reduce((sum, p) => sum + lineStateAt(p, firstInvoiceDate).mrr, 0)
    : selectedPlans.reduce((sum, p) => sum + p.plan.defaultMonthlyPrice * p.quantity, 0)

  return (
    <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(16,24,40,0.06)] border border-[#ececf1] overflow-hidden text-[#1A1A1A]">
      {/* Document header */}
      <div className="px-10 pt-9 pb-6 border-b border-[#f1f2f4]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-md bg-[#eafcdd] flex items-center justify-center">
                <span className="text-[#2b8700] text-xs font-bold">C</span>
              </div>
              <span className="text-sm font-semibold text-[#1A1A1A]">Cactus Practice</span>
            </div>
            <h1 className="text-lg font-semibold text-[#1A1A1A] tracking-[-0.01em]">Order form</h1>
            <p className="text-xs text-[#A0A8B4] mt-0.5">Master Services Agreement · {contractId}</p>
          </div>
          <span className="inline-flex items-center px-2 h-6 rounded-full bg-[#fff4e5] text-[11px] font-semibold text-[#b9741b]">
            Draft
          </span>
        </div>
      </div>

      <div className="px-10 py-7">
        <p className="text-sm text-[#596171] mb-6 leading-relaxed">
          This order form is entered into between Cactus Practice and the customer named below, effective {effectiveDate}.
        </p>

        {/* Parties */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <div className={ORDER_FORM_LABEL}>Provider</div>
            <div className="text-sm font-medium text-[#1A1A1A]">Cactus Practice</div>
            <div className="text-xs text-[#A0A8B4] mt-0.5">billing@cactuspractice.com</div>
          </div>
          <div>
            <div className={ORDER_FORM_LABEL}>Customer</div>
            <div className="text-sm font-medium text-[#1A1A1A]">{customer?.name || "—"}</div>
            <div className="text-xs text-[#A0A8B4] mt-0.5">{customer?.email || "—"}</div>
          </div>
        </div>

        {/* Terms summary */}
        <div className="grid grid-cols-3 gap-4 mb-7 rounded-lg bg-[#fafbfc] border border-[#f1f2f4] p-4">
          <div>
            <div className={ORDER_FORM_LABEL}>Currency</div>
            <div className="text-sm text-[#1A1A1A]">{currencyCode}</div>
          </div>
          <div>
            <div className={ORDER_FORM_LABEL}>Draft expiration</div>
            <div className="text-sm text-[#1A1A1A]">
              {draftExpiry ? new Date(draftExpiry).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
            </div>
          </div>
          <div>
            <div className={ORDER_FORM_LABEL}>Products</div>
            <div className="text-sm text-[#1A1A1A]">{selectedPlans.length}</div>
          </div>
        </div>

        {documentName && (
          <p className="text-xs text-[#A0A8B4] mb-7 -mt-3">
            Reference document: <span className="text-[#596171] font-medium">{documentName}</span>
          </p>
        )}

        {/* Pricing schedule */}
        <h2 className="text-sm font-semibold text-[#1A1A1A] mb-3">1. Pricing schedule</h2>
        <div className="border border-[#f1f2f4] rounded-lg overflow-hidden mb-7">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#fafbfc] border-b border-[#f1f2f4] text-[#A0A8B4]">
                <th className="text-left font-semibold px-3 py-2 text-[10px]">Product</th>
                <th className="text-left font-semibold px-3 py-2 text-[10px]">Term</th>
                <th className="text-right font-semibold px-3 py-2 text-[10px]">Unit price</th>
                <th className="text-right font-semibold px-3 py-2 text-[10px]">Qty</th>
                <th className="text-right font-semibold px-3 py-2 text-[10px]">Annual</th>
              </tr>
            </thead>
            <tbody>
              {selectedPlans.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-xs text-[#A0A8B4]">
                    No products added
                  </td>
                </tr>
              ) : (
                selectedPlans.map(p => {
                  const parsePrice = (v: string | number) =>
                    typeof v === "number" ? v : parseFloat(String(v).replace(/[^0-9.]/g, "")) || 0
                  // Diff is measured against the value in effect immediately
                  // before the change (step-over-step), as a monthly recurring delta.
                  const mrrDelta = (changeDate: Date) => {
                    const t = changeDate.getTime()
                    const before = lineStateAt(p, new Date(t - 86400000)).mrr
                    const after = lineStateAt(p, changeDate).mrr
                    return after - before
                  }
                  const scheduled = [
                    ...(p.priceOverrides ?? []).map(o => ({
                      kind: "price" as const,
                      sortDate: new Date(o.startDate).getTime(),
                      term: `${formatDateShort(new Date(o.startDate))} → ${formatDateShort(new Date(o.endDate))}`,
                      label: "Scheduled price override",
                      unit: `$${parsePrice(o.price).toFixed(2)}/mo`,
                      qty: seatsInEffectAt(p, new Date(o.startDate)),
                      delta: mrrDelta(new Date(o.startDate)),
                    })),
                    ...(p.quantityUpdates ?? []).map(q => ({
                      kind: "qty" as const,
                      sortDate: new Date(q.effectiveDate).getTime(),
                      term: `Effective ${formatDateShort(new Date(q.effectiveDate))}`,
                      label: "Scheduled quantity update",
                      unit: `$${priceInEffectAt(p, new Date(q.effectiveDate)).toFixed(2)}/mo`,
                      qty: q.quantity,
                      delta: mrrDelta(new Date(q.effectiveDate)),
                    })),
                  ].sort((a, b) => a.sortDate - b.sortDate)

                  return (
                    <Fragment key={p.plan.id}>
                      <tr className="border-b border-[#f1f2f4] last:border-0">
                        <td className="px-3 py-2.5 font-medium text-[#1A1A1A]">{p.plan.name}</td>
                        <td className="px-3 py-2.5 text-[#A0A8B4] text-xs">
                          {formatDateShort(new Date(p.startDate))} → {formatDateShort(new Date(p.endDate))}
                        </td>
                        <td className="px-3 py-2.5 text-right text-[#1A1A1A]">${p.plan.defaultMonthlyPrice.toFixed(2)}/mo</td>
                        <td className="px-3 py-2.5 text-right text-[#1A1A1A]">{p.quantity}</td>
                        <td className="px-3 py-2.5 text-right font-medium text-[#1A1A1A]">
                          ${lineContractValue(p).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                      {scheduled.map((s, i) => (
                        <tr key={i} className="border-b border-[#f1f2f4] last:border-0 bg-[#fafbfc]">
                          <td className="px-3 py-2 pl-6 text-xs text-[#596171]">
                            <span className="inline-flex items-center gap-1.5">
                              {s.kind === "price" ? (
                                <Tag className="w-3 h-3 text-[#A0A8B4]" />
                              ) : (
                                <Hash className="w-3 h-3 text-[#A0A8B4]" />
                              )}
                              {s.label}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-[#A0A8B4] text-xs">{s.term}</td>
                          <td className="px-3 py-2 text-right text-xs text-[#596171]">{s.unit}</td>
                          <td className="px-3 py-2 text-right text-xs text-[#596171]">{s.qty}</td>
                          <td className="px-3 py-2 text-right text-xs font-medium">
                            {Math.abs(s.delta) < 0.005 ? (
                              <span className="text-[#A0A8B4]">no change</span>
                            ) : (
                              <span className={s.delta > 0 ? "text-[#2b8700]" : "text-[#e61947]"}>
                                {s.delta > 0 ? "+" : "−"}${Math.abs(s.delta).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/mo
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  )
                })
              )}
            </tbody>
            <tfoot>
              <tr className="bg-[#fafbfc] border-t border-[#f1f2f4]">
                <td colSpan={4} className="px-3 py-2.5 text-right text-xs font-semibold text-[#596171]">
                  Estimated total contract value
                </td>
                <td className="px-3 py-2.5 text-right font-semibold text-[#1A1A1A]">
                  ${totalContractValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencyCode}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Payment & collections — replaces legal boilerplate with the billing
            details that actually matter for this contract. */}
        <h2 className="text-sm font-semibold text-[#1A1A1A] mb-3">2. Payment &amp; collections</h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-lg bg-[#fafbfc] border border-[#f1f2f4] p-4 mb-8">
          <div>
            <div className={ORDER_FORM_LABEL}>Billing schedule</div>
            <div className="text-sm text-[#1A1A1A]">Monthly, in advance</div>
          </div>
          <div>
            <div className={ORDER_FORM_LABEL}>Payment terms</div>
            <div className="text-sm text-[#1A1A1A]">Net 30</div>
          </div>
          <div>
            <div className={ORDER_FORM_LABEL}>Collection method</div>
            <div className="text-sm text-[#1A1A1A]">{billingMethod === "manual" ? "Send invoice" : "Automatic — card on file"}</div>
          </div>
          <div>
            <div className={ORDER_FORM_LABEL}>First invoice</div>
            <div className="text-sm text-[#1A1A1A]">{firstInvoice}</div>
          </div>
          <div>
            <div className={ORDER_FORM_LABEL}>Recurring total</div>
            <div className="text-sm text-[#1A1A1A]">{money(totalMonthly)}/mo</div>
          </div>
          <div>
            <div className={ORDER_FORM_LABEL}>Total contract value</div>
            <div className="text-sm font-semibold text-[#1A1A1A]">{money(totalContractValue)} {currencyCode}</div>
          </div>
        </div>

        {/* Signature block */}
        <div className="grid grid-cols-2 gap-8 pt-6 border-t border-[#f1f2f4]">
          <div>
            <div className="h-10 border-b border-[#dfe1e6]" />
            <div className="text-xs text-[#A0A8B4] mt-1">Cactus Practice</div>
          </div>
          <div>
            <div className="h-10 border-b border-[#dfe1e6]" />
            <div className="text-xs text-[#A0A8B4] mt-1">{customer?.name || "Customer"}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Editor PDF view — thin wrapper that drops the shared order form onto the
// scrollable canvas. Identical markup to the get-started live preview.
function ServiceAgreementPdf({
  contractId,
  customer,
  currency,
  draftExpiry,
  selectedPlans,
  billingMethod = "auto",
}: {
  contractId: string
  customer: { name: string; email: string } | null
  currency: string
  draftExpiry: string
  selectedPlans: SelectedPlanEntry[]
  billingMethod?: "auto" | "manual"
}) {
  return (
    <div className="flex-1 overflow-auto bg-[#fbfbfc] p-8">
      <div className="mx-auto max-w-[680px]">
        <OrderFormDocument
          contractId={contractId}
          customer={customer}
          currency={currency}
          draftExpiry={draftExpiry}
          selectedPlans={selectedPlans}
          billingMethod={billingMethod}
        />
      </div>
    </div>
  )
}

// Shared segment-building helpers used by both timeline variants
type TlSeg = { start: Date; end: Date; value: number; id: string | null; active: boolean }

function buildPriceSegments(
  start: Date, end: Date, base: number,
  windows: { start: Date; end: Date; value: number; id: string }[],
): TlSeg[] {
  const sMs = start.getTime(), eMs = end.getTime()
  if (!(sMs < eMs)) return []
  const bounds = new Set<number>([sMs, eMs])
  windows.forEach(w => {
    const ws = Math.max(w.start.getTime(), sMs), we = Math.min(w.end.getTime(), eMs)
    if (ws < we) { bounds.add(ws); bounds.add(we) }
  })
  const pts = [...bounds].filter(t => t >= sMs && t <= eMs).sort((a, b) => a - b)
  const segs: TlSeg[] = []
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1]
    if (a >= b) continue
    const mid = (a + b) / 2
    const win = windows.find(w => w.start.getTime() <= mid && w.end.getTime() >= mid)
    segs.push({ start: new Date(a), end: new Date(b), value: win ? win.value : base, id: win ? win.id : null, active: !!win })
  }
  return segs
}

function buildQtySegments(
  start: Date, end: Date, base: number,
  updates: { date: Date; qty: number; id: string }[],
): TlSeg[] {
  const sMs = start.getTime(), eMs = end.getTime()
  if (!(sMs < eMs)) return []
  const sorted = [...updates].filter(u => !isNaN(u.date.getTime())).sort((a, b) => a.date.getTime() - b.date.getTime())
  const bounds = new Set<number>([sMs, eMs])
  sorted.forEach(u => { const t = u.date.getTime(); if (t > sMs && t < eMs) bounds.add(t) })
  const pts = [...bounds].sort((a, b) => a - b)
  const segs: TlSeg[] = []
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1]
    if (a >= b) continue
    let qty = base, id: string | null = null, active = false
    sorted.forEach(u => { if (u.date.getTime() <= a) { qty = u.qty; id = u.id; active = true } })
    segs.push({ start: new Date(a), end: new Date(b), value: qty, id, active })
  }
  return segs
}

// =============================================================================
// TIMELINE VISUALIZATION COMPONENT
// =============================================================================
function TimelineVisualization({
  selectedPlans,
  selectedNodeId,
  onSelectNode,
  onShowInvoicePreview,
  contractId,
  customer,
  currency,
  draftExpiry,
  billingMethod = "auto",
  quantityFocusedPlanId = null,
}: {
  selectedPlans: SelectedPlanEntry[]
  selectedNodeId: string
  onSelectNode: (id: string) => void
  onShowInvoicePreview: (date: Date) => void
  contractId: string
  customer: { name: string; email: string } | null
  currency: string
  draftExpiry: string
  billingMethod?: "auto" | "manual"
  quantityFocusedPlanId?: string | null
}) {
  const [viewMode, setViewMode] = useState<"timeline" | "pdf">("timeline")
  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(() =>
    new Set(selectedPlans.map(e => e.plan.id))
  )

  // Auto-expand newly added plans (up to 10)
  useEffect(() => {
    if (selectedPlans.length <= 10) {
      setExpandedPlans(prev => {
        const next = new Set(prev)
        selectedPlans.forEach(e => next.add(e.plan.id))
        return next
      })
    }
  }, [selectedPlans])

  // As-of scrubber: the date the playhead is pointing at (null = not engaged).
  const [scrubDate, setScrubDate] = useState<Date | null>(null)

  // Shared floating tooltip driven by hovering segments and markers.
  const [tip, setTip] = useState<
    | { x: number; y: number; title: string; rows: { label: string; value: string; tone?: "pos" | "neg" }[] }
    | null
  >(null)
  const showTip = (
    e: React.MouseEvent,
    title: string,
    rows: { label: string; value: string; tone?: "pos" | "neg" }[],
  ) => setTip({ x: e.clientX, y: e.clientY, title, rows })
  const hideTip = () => setTip(null)

  // The underlying discount currently selected (in the tree, or by clicking any
  // of its timeline instances). A single discount can be redistributed across
  // multiple product lines, so we resolve the selected node to its discount id
  // and highlight every applied instance — not only the owning line.
  const selectedDiscountId = useMemo(() => {
    if (!selectedNodeId.startsWith("discount-")) return null
    for (const p of selectedPlans) {
      const match = p.discounts.find(d => `discount-${p.plan.id}-${d.id}` === selectedNodeId)
      if (match) return match.id
    }
    return null
  }, [selectedNodeId, selectedPlans])

  // Calculate timeline range
  const allDates = selectedPlans.flatMap(p => [
    new Date(p.startDate),
    new Date(p.endDate),
    ...p.priceOverrides.flatMap(o => [new Date(o.startDate), new Date(o.endDate)]),
    ...p.quantityUpdates.map(q => new Date(q.effectiveDate)),
  ]).filter(d => !isNaN(d.getTime()))

  const now = new Date()
  const earliest = allDates.length ? new Date(Math.min(...allDates.map(d => d.getTime()))) : now
  const latest = allDates.length ? new Date(Math.max(...allDates.map(d => d.getTime()))) : addMonths(now, 24)

  // Build month columns spanning from earliest to latest
  const months: { label: string; year: number; month: number; date: Date }[] = []
  const cur = new Date(earliest.getFullYear(), earliest.getMonth(), 1)
  while (cur <= latest && months.length < 36) {
    months.push({
      label: cur.toLocaleDateString("en-US", { month: "short" }),
      year: cur.getFullYear(),
      month: cur.getMonth(),
      date: new Date(cur),
    })
    cur.setMonth(cur.getMonth() + 1)
  }

  // Group months by year
  const yearGroups: { year: number; months: typeof months }[] = []
  months.forEach(m => {
    const existing = yearGroups.find(g => g.year === m.year)
    if (existing) {
      existing.months.push(m)
    } else {
      yearGroups.push({ year: m.year, months: [m] })
    }
  })

  const MIN_COL_WIDTH = 56 // px per month column (minimum; grows to fill width)
  const labelW = 188 // px for the fixed left label column

  // Measure the scroll container so the timeline can stretch to fill the
  // available editor width on larger screens instead of leaving empty space.
  // The container is conditionally mounted (only in timeline view with plans),
  // so a callback ref re-attaches the ResizeObserver every time it mounts —
  // a one-time effect would miss the node or lose the observer on view toggles.
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const resizeObsRef = useRef<ResizeObserver | null>(null)
  const [availableWidth, setAvailableWidth] = useState(0)
  const setScrollEl = useCallback((el: HTMLDivElement | null) => {
    resizeObsRef.current?.disconnect()
    scrollRef.current = el
    if (!el) return
    setAvailableWidth(el.clientWidth)
    const ro = new ResizeObserver(() => setAvailableWidth(el.clientWidth))
    ro.observe(el)
    resizeObsRef.current = ro
  }, [])

  // Distribute any extra space across the month columns so they fill the
  // container, but never shrink below the minimum (keeps horizontal scroll
  // available when there are many months).
  const colWidth = months.length
    ? Math.max(MIN_COL_WIDTH, Math.floor((availableWidth - labelW) / months.length))
    : MIN_COL_WIDTH
  const timelineWidth = months.length * colWidth

  // Compute months where the total billed MRR changes — driven by actual event
  // dates so events after the 15th aren't missed by mid-month sampling.
  const changeMonths = new Map<string, { delta: number; totalAfter: number }>()
  const eventDates = new Set<string>()
  selectedPlans.forEach(entry => {
    if (entry.startDate) eventDates.add(entry.startDate)
    entry.priceOverrides?.forEach(o => { if (o.startDate) eventDates.add(o.startDate) })
    entry.quantityUpdates?.forEach(q => { if (q.effectiveDate) eventDates.add(q.effectiveDate) })
  })
  // lineStateAt doesn't check plan active status — wrap it to return 0 outside the plan window
  const activeMrr = (entry: SelectedPlanEntry, date: Date): number => {
    const t = date.getTime()
    const s = new Date(entry.startDate).getTime()
    const e = new Date(entry.endDate).getTime()
    if (isNaN(s) || isNaN(e) || t < s || t > e) return 0
    return lineStateAt(entry, date).mrr
  }

  Array.from(eventDates).forEach(dateStr => {
    // Dates are stored as "Jun 1, 2026" (local time) — parse directly, no ISO shift needed
    const eventDate = new Date(dateStr)
    if (isNaN(eventDate.getTime())) return
    const monthKey = `${eventDate.getFullYear()}-${eventDate.getMonth()}`
    const dayBefore = new Date(eventDate.getTime() - 86400000)
    const totalBefore = selectedPlans.reduce((sum, p) => sum + activeMrr(p, dayBefore), 0)
    const totalAfter = selectedPlans.reduce((sum, p) => sum + activeMrr(p, eventDate), 0)
    // Diamonds always generate an invoice; pro-rate if mid-month
    const daysInMonth = new Date(eventDate.getFullYear(), eventDate.getMonth() + 1, 0).getDate()
    const dayOfEvent = eventDate.getDate()
    const proRatedTotal = (totalBefore * (dayOfEvent - 1) + totalAfter * (daysInMonth - dayOfEvent + 1)) / daysInMonth
    const delta = totalAfter - totalBefore
    changeMonths.set(monthKey, { delta, totalAfter: proRatedTotal })
  })

  // Calculate horizontal position (px) for a date along the time axis
  const getPosition = (date: Date) => {
    const monthIdx = months.findIndex(
      m => m.year === date.getFullYear() && m.month === date.getMonth(),
    )
    if (monthIdx === -1) {
      return date.getTime() <= earliest.getTime() ? 0 : timelineWidth
    }
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
    const dayFraction = (date.getDate() - 1) / daysInMonth
    return (monthIdx + dayFraction) * colWidth
  }

  const getWidth = (start: Date, end: Date) => {
    return Math.max(getPosition(end) - getPosition(start), 6)
  }

  // Inverse of getPosition: map an x-offset (px) on the time axis back to a date.
  const dateForX = (x: number) => {
    if (!months.length) return now
    const clamped = Math.max(0, Math.min(x, timelineWidth))
    const colPos = clamped / colWidth
    const monthIdx = Math.min(Math.floor(colPos), months.length - 1)
    const frac = colPos - monthIdx
    const m = months[monthIdx]
    const daysInMonth = new Date(m.year, m.month + 1, 0).getDate()
    const day = Math.min(daysInMonth, Math.max(1, Math.round(frac * daysInMonth) + 1))
    return new Date(m.year, m.month, day)
  }

  // Contract-wide bounds (earliest start → latest end across all lines) used to
  // constrain the scrubber to meaningful dates.
  const contractStart = selectedPlans.length
    ? new Date(Math.min(...selectedPlans.map(p => new Date(p.startDate).getTime())))
    : earliest
  const contractEnd = selectedPlans.length
    ? new Date(Math.max(...selectedPlans.map(p => new Date(p.endDate).getTime())))
    : latest

  // Translate a pointer event into a clamped as-of date and store it.
  const handleScrub = (clientX: number) => {
    const el = scrollRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = clientX - rect.left - labelW + el.scrollLeft
    let d = dateForX(x)
    if (d < contractStart) d = contractStart
    if (d > contractEnd) d = contractEnd
    setScrubDate(d)
  }

  // Active as-of date (defaults to "today" within range, else contract start).
  const asOf = scrubDate ?? (now >= contractStart && now <= contractEnd ? now : contractStart)
  const asOfPos = getPosition(asOf)

  // Today marker position (only shown when within the visible range)
  const todayPos = now >= earliest && now <= latest ? getPosition(now) : null

  const parsePrice = (p: string | number) =>
    typeof p === "number" ? p : parseFloat(String(p).replace(/[^0-9.]/g, "")) || 0

  type Seg = { start: Date; end: Date; value: number; id: string | null; active: boolean }

  // Build non-overlapping value segments across [start, end].
  // Overlapping windows win over the base value; gaps fall back to base.
  const buildSegments = (
    start: Date,
    end: Date,
    base: number,
    windows: { start: Date; end: Date; value: number; id: string }[],
  ): Seg[] => {
    const sMs = start.getTime()
    const eMs = end.getTime()
    if (!(sMs < eMs)) return []
    const bounds = new Set<number>([sMs, eMs])
    windows.forEach(w => {
      const ws = Math.max(w.start.getTime(), sMs)
      const we = Math.min(w.end.getTime(), eMs)
      if (ws < we) {
        bounds.add(ws)
        bounds.add(we)
      }
    })
    const pts = [...bounds].filter(t => t >= sMs && t <= eMs).sort((a, b) => a - b)
    const segs: Seg[] = []
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i]
      const b = pts[i + 1]
      if (a >= b) continue
      const mid = (a + b) / 2
      const win = windows.find(
        w => w.start.getTime() <= mid && w.end.getTime() >= mid,
      )
      segs.push({
        start: new Date(a),
        end: new Date(b),
        value: win ? win.value : base,
        id: win ? win.id : null,
        active: !!win,
      })
    }
    return segs
  }

  // Build a step function of seat counts across the plan lifespan.
  const buildSeatSegments = (
    start: Date,
    end: Date,
    base: number,
    updates: { date: Date; qty: number; id: string }[],
  ): Seg[] => {
    const sMs = start.getTime()
    const eMs = end.getTime()
    if (!(sMs < eMs)) return []
    const sorted = [...updates]
      .filter(u => !isNaN(u.date.getTime()))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
    const bounds = new Set<number>([sMs, eMs])
    sorted.forEach(u => {
      const t = u.date.getTime()
      if (t > sMs && t < eMs) bounds.add(t)
    })
    const pts = [...bounds].sort((a, b) => a - b)
    const segs: Seg[] = []
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i]
      const b = pts[i + 1]
      if (a >= b) continue
      let qty = base
      let id: string | null = null
      let active = false
      sorted.forEach(u => {
        if (u.date.getTime() <= a) {
          qty = u.qty
          id = u.id
          active = true
        }
      })
      segs.push({ start: new Date(a), end: new Date(b), value: qty, id, active })
    }
    return segs
  }

  // Reusable vertical gridlines + today marker for any track
  const TrackGrid = () => (
    <>
      <div className="absolute inset-0 flex pointer-events-none">
        {months.map((m, i) => (
          <div
            key={i}
            className={m.month === 0 ? "h-full border-l border-[#c8cdd8]" : "h-full"}
            style={{ width: colWidth }}
          />
        ))}
      </div>
      {todayPos !== null && (
        <div
          className="absolute top-0 bottom-0 w-px bg-[#e61947]/40 pointer-events-none z-10"
          style={{ left: todayPos }}
        />
      )}
      {/* As-of scrubber playhead, spanning every track */}
      <div
        className="absolute top-0 bottom-0 w-px bg-[#533AFD] pointer-events-none z-20"
        style={{ left: asOfPos }}
      />
    </>
  )

  return (
    <div className="flex-1 bg-[#f5f6f8] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center px-4 h-12 bg-white shrink-0">
        <div className="inline-flex items-center gap-0.5 p-0.5 rounded-md bg-[#f5f6f8] border border-[#ebeef1]">
          <button
            onClick={() => setViewMode("timeline")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 h-7 rounded text-xs font-medium transition-colors",
              viewMode === "timeline"
                ? "bg-white text-[#353A44] shadow-sm"
                : "text-[#6c7688] hover:text-[#353A44]",
            )}
          >
            <Eye className="w-3.5 h-3.5" />
            Timeline
          </button>
          <button
            onClick={() => setViewMode("pdf")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 h-7 rounded text-xs font-medium transition-colors",
              viewMode === "pdf"
                ? "bg-white text-[#353A44] shadow-sm"
                : "text-[#6c7688] hover:text-[#353A44]",
            )}
          >
            <FileText className="w-3.5 h-3.5" />
            Agreement PDF
          </button>
        </div>
      </div>

      {viewMode === "pdf" ? (
        <div className="flex-1 min-h-0 overflow-auto bg-[#f5f6f8] p-4">
          <ServiceAgreementPdf
            contractId={contractId}
            customer={customer}
            currency={currency}
            draftExpiry={draftExpiry}
            selectedPlans={selectedPlans}
            billingMethod={billingMethod}
          />
        </div>
      ) : selectedPlans.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-[#A0A8B4]">Add a pricing plan to see the timeline</p>
        </div>
      ) : (
        <div ref={setScrollEl} className="flex-1 overflow-auto bg-white">
          <div style={{ width: Math.max(labelW + timelineWidth, availableWidth) }}>
            {/* ===== Header: year + month axis ===== */}
            <div className="sticky top-0 z-20 bg-white border-b-[0.5px] border-[#ebeef1]">
              {/* Year row */}
              <div className="flex">
                <div
                  className="shrink-0 sticky left-0 z-10 bg-white border-r border-[#ebeef1]"
                  style={{ width: labelW }}
                />
                {yearGroups.map((group, gi) => (
                  <div
                    key={group.year}
                    className={cn(
                      "text-xs font-semibold text-[#353A44] px-2 py-2",
                      gi > 0 && "border-l border-[#c8cdd8]",
                    )}
                    style={{ width: group.months.length * colWidth }}
                  >
                    {group.year}
                  </div>
                ))}
              </div>
              {/* Month row */}
              <div className="flex border-t border-[#f0f1f4]">
                <div
                  className="shrink-0 sticky left-0 z-10 bg-white border-r border-[#ebeef1]"
                  style={{ width: labelW }}
                />
                {months.map((m, i) => (
                  <div
                    key={i}
                    className={cn(
                      "text-[10px] text-center py-2",
                      m.month === 0
                        ? "text-[#353A44] font-medium border-l border-[#c8cdd8]"
                        : "text-[#A0A8B4]",
                    )}
                    style={{ width: colWidth }}
                  >
                    {m.label}
                  </div>
                ))}
              </div>
            </div>

            {/* ===== As-of scrubber ruler ===== */}
            <div className="sticky top-[57px] z-20 flex items-stretch bg-[#f8f9fb] border-b border-[#ebeef1]">
              <div
                className="shrink-0 sticky left-0 z-10 flex flex-col justify-center px-3 py-1.5 bg-[#f8f9fb] border-r border-[#ebeef1]"
                style={{ width: labelW }}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#533AFD]" />
                  <span className="text-[10px] text-[#533AFD] font-semibold">
                    As of {formatDateShort(asOf)}
                  </span>
                </div>
              </div>
              <div
                className="relative flex-1 cursor-ew-resize select-none"
                style={{ height: 40 }}
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId)
                  handleScrub(e.clientX)
                }}
                onPointerMove={(e) => {
                  if (e.currentTarget.hasPointerCapture(e.pointerId)) handleScrub(e.clientX)
                }}
              >
                <TrackGrid />
                {/* Inline change markers: clickable pins that jump to edit */}
                {selectedPlans.flatMap(entry => [
                  ...entry.priceOverrides.map(o => ({
                    nodeId: `plan-${entry.plan.id}-override-${o.id}`,
                    date: new Date(o.startDate),
                    tone: "price" as const,
                    label: `${entry.plan.name}: price override`,
                  })),
                  ...entry.quantityUpdates.map(q => ({
                    nodeId: `plan-${entry.plan.id}-qty-${q.id}`,
                    date: new Date(q.effectiveDate),
                    tone: "qty" as const,
                    label: `${entry.plan.name}: quantity update`,
                  })),
                ])
                  .filter(m => !isNaN(m.date.getTime()))
                  .map((m, i) => {
                    const before = (() => {
                      const e = selectedPlans.find(p => m.nodeId.startsWith(`plan-${p.plan.id}-`))!
                      return lineStateAt(e, new Date(m.date.getTime() - 86400000)).mrr
                    })()
                    const after = (() => {
                      const e = selectedPlans.find(p => m.nodeId.startsWith(`plan-${p.plan.id}-`))!
                      return lineStateAt(e, m.date).mrr
                    })()
                    const delta = after - before
                    return (
                      <button
                        key={i}
                        onClick={() => onSelectNode(m.nodeId)}
                        onMouseEnter={(e) =>
                          showTip(e, m.label, [
                            { label: "Effective", value: formatDateShort(m.date) },
                            {
                              label: "Change",
                              value: `${delta >= 0 ? "+" : "−"}${fmtMoney(Math.abs(delta), currency)}/mo`,
                              tone: delta >= 0 ? "pos" : "neg",
                            },
                          ])
                        }
                        onMouseMove={(e) => tip && showTip(e, tip.title, tip.rows)}
                        onMouseLeave={hideTip}
                        className={cn(
                          "absolute bottom-0 z-30 -translate-x-1/2 w-3 h-3 rotate-45 rounded-[2px] border border-white shadow-sm transition-transform hover:scale-125",
                          m.tone === "price" ? "bg-[#533AFD]" : "bg-[#0a7ea4]",
                        )}
                        style={{ left: getPosition(m.date) }}
                        aria-label={m.label}
                      />
                    )
                  })}
                {/* Draggable handle */}
                <div
                  className="absolute top-0 bottom-0 z-30 flex items-start pointer-events-none"
                  style={{ left: asOfPos }}
                >
                  <div className="-translate-x-1/2 mt-1 px-1.5 py-0.5 rounded bg-[#533AFD] text-white text-[10px] font-medium whitespace-nowrap shadow-sm">
                    {formatDateShort(asOf)}
                  </div>
                </div>
              </div>
            </div>

            {/* ===== Plan rows ===== */}
            {(() => {
              // Longest-prefix match so "enterprise" prefix doesn't fire on "enterprise-seats" nodes
              let _selPlanId: string | null = null
              let _bestLen = 0
              for (const e of selectedPlans) {
                if (selectedNodeId === `plan-${e.plan.id}`) { _selPlanId = e.plan.id; break }
                const px = `plan-${e.plan.id}-`
                if (selectedNodeId.startsWith(px) && px.length > _bestLen) {
                  _selPlanId = e.plan.id; _bestLen = px.length
                }
              }
              const selectedPlanId = _selPlanId
              return selectedPlans.map((entry) => {
              const planStart = new Date(entry.startDate)
              const planEnd = new Date(entry.endDate)
              const planLeft = getPosition(planStart)
              const planWidth = getWidth(planStart, planEnd)
              const priceSelected = selectedNodeId === `plan-${entry.plan.id}-price`
              const planSelected = selectedPlanId === entry.plan.id
              const basePrice = entry.plan.defaultMonthlyPrice
              const isExpanded = expandedPlans.has(entry.plan.id)

              const priceSegs = buildSegments(
                planStart,
                planEnd,
                basePrice,
                entry.priceOverrides
                  .map(o => ({
                    start: new Date(o.startDate),
                    end: new Date(o.endDate),
                    value: parsePrice(o.price),
                    id: o.id,
                  }))
                  .filter(w => !isNaN(w.start.getTime()) && !isNaN(w.end.getTime())),
              )

              const seatSegs = buildSeatSegments(
                planStart,
                planEnd,
                entry.quantity,
                entry.quantityUpdates.map(q => ({
                  date: new Date(q.effectiveDate),
                  qty: q.quantity,
                  id: q.id,
                })),
              )

              return (
                <div
                  key={entry.plan.id}
                  className="border-b-[0.5px] border-[#d4d8e0] bg-white"
                >
                  {/* Plan header row */}
                  <div className="flex items-stretch">
                    <button
                      onClick={() => {
                        setExpandedPlans(prev => {
                          const next = new Set(prev)
                          if (next.has(entry.plan.id)) next.delete(entry.plan.id)
                          else next.add(entry.plan.id)
                          return next
                        })
                        onSelectNode(`plan-${entry.plan.id}-price`)
                      }}
                      className={cn(
                        "shrink-0 sticky left-0 z-10 flex items-center gap-2 px-3 py-2.5 border-r-[0.5px] border-[#ebeef1] text-left transition-colors",
                        planSelected ? "bg-white" : "bg-white hover:bg-[#f5f6f8]",
                      )}
                      style={{ width: labelW }}
                    >
                      <span className="w-3.5 h-3.5 flex items-center justify-center shrink-0 text-[#A0A8B4]">
                        {isExpanded
                          ? <ChevronDown className="w-3 h-3" />
                          : <ChevronRight className="w-3 h-3" />
                        }
                      </span>
                      <Package className="w-3.5 h-3.5 text-[#6c7688] shrink-0" />
                      <span className="text-sm font-medium text-[#353A44] truncate">
                        {entry.plan.name}
                      </span>
                    </button>
                    <div className="relative flex-1" style={{ height: 36 }}>
                      <TrackGrid />
                      <button
                        onClick={() => onSelectNode(`plan-${entry.plan.id}-price`)}
                        className={cn(
                          "absolute top-1/2 -translate-y-1/2 h-[6px] rounded-full transition-all",
                          planSelected
                            ? "bg-[#3BABFD] hover:bg-[#2a9be0]"
                            : "bg-[#D4DEE9] hover:bg-[#b8cad8]",
                        )}
                        style={{ left: planLeft, width: planWidth }}
                      />
                    </div>
                  </div>

                  {/* Sub-rows — visible when expanded */}
                  {isExpanded && (
                    <>
                  {/* Pricing sub-row */}
                  <div className="flex items-stretch">
                    <div
                      className="shrink-0 sticky left-0 z-10 flex items-center pl-9 pr-3 py-2 bg-white border-r-[0.5px] border-[#ebeef1]"
                      style={{ width: labelW }}
                    >
                      <span className="text-xs text-[#9aa0ac]">Pricing</span>
                    </div>
                    <div className="relative flex-1 bg-white" style={{ height: 40 }}>
                      <TrackGrid />
                      {priceSegs.map((seg, i) => {
                        const left = getPosition(seg.start)
                        const width = getWidth(seg.start, seg.end)
                        const segSelected = seg.id
                          ? selectedNodeId === `plan-${entry.plan.id}-override-${seg.id}`
                          : priceSelected
                        const before = lineStateAt(entry, new Date(seg.start.getTime() - 86400000)).mrr
                        const after = lineStateAt(entry, seg.start).mrr
                        const delta = seg.id ? after - before : 0
                        return (
                          <button
                            key={i}
                            onClick={() =>
                              seg.id
                                ? onSelectNode(`plan-${entry.plan.id}-override-${seg.id}`)
                                : onSelectNode(`plan-${entry.plan.id}-price`)
                            }
                            onMouseEnter={(e) =>
                              showTip(e, seg.active ? "Price override" : "Base price", [
                                { label: "Price", value: `$${seg.value.toFixed(2)}/mo` },
                                { label: "Period", value: `${formatDateShort(seg.start)} → ${formatDateShort(seg.end)}` },
                                ...(seg.id
                                  ? [{
                                      label: "Change",
                                      value: `${delta >= 0 ? "+" : "−"}${fmtMoney(Math.abs(delta), currency)}/mo`,
                                      tone: (delta >= 0 ? "pos" : "neg") as "pos" | "neg",
                                    }]
                                  : []),
                              ])
                            }
                            onMouseMove={(e) => tip && showTip(e, tip.title, tip.rows)}
                            onMouseLeave={hideTip}
                            className={cn(
                              "absolute top-2 bottom-2 flex items-center gap-1.5 px-2 text-[10px] font-medium overflow-hidden whitespace-nowrap rounded-md border transition-all",
                              segSelected
                                ? "bg-white border-[#3BABFD] text-[#353A44]"
                                : "bg-white border-[#d4d8e0] text-[#353A44] hover:border-[#a0a8b4]",
                            )}
                            style={{ left: left + 1, width: Math.max(width - 2, 8) }}
                          >
                            {seg.id
                              ? <Calendar className={cn("w-3 h-3 shrink-0", segSelected ? "text-[#3BABFD]" : "text-[#A0A8B4]")} />
                              : <Tag className={cn("w-3 h-3 shrink-0", segSelected ? "text-[#3BABFD]" : "text-[#A0A8B4]")} />
                            }
                            ${seg.value.toFixed(seg.value % 1 === 0 ? 0 : 2)} USD per month
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Discounts & Markups sub-row */}
                  {entry.discounts.length > 0 && (
                    <div className="flex items-stretch">
                      <div
                        className="shrink-0 sticky left-0 z-10 flex items-center pl-9 pr-3 py-2 bg-white border-r-[0.5px] border-[#ebeef1]"
                        style={{ width: labelW }}
                      >
                        <span className="text-xs text-[#9aa0ac]">Discounts & Markups</span>
                      </div>
                      <div className="relative flex-1 bg-white" style={{ height: 40 }}>
                        <TrackGrid />
                        {entry.discounts.map(discount => {
                          const dStart = new Date(discount.startDate)
                          const dEnd = new Date(discount.endDate)
                          const discountNodeId = `discount-${entry.plan.id}-${discount.id}`
                          const discountSelected =
                            selectedNodeId === discountNodeId || discount.id === selectedDiscountId
                          const isMarkup = discount.type === "markup"
                          return (
                            <button
                              key={discount.id}
                              onClick={() => onSelectNode(discountNodeId)}
                              onMouseEnter={(e) =>
                                showTip(e, isMarkup ? "Markup" : "Discount", [
                                  { label: "Rate", value: `${discount.percentage}%` },
                                  { label: "Period", value: `${formatDateShort(dStart)} → ${formatDateShort(dEnd)}` },
                                ])
                              }
                              onMouseMove={(e) => tip && showTip(e, tip.title, tip.rows)}
                              onMouseLeave={hideTip}
                              className={cn(
                                "absolute top-2 bottom-2 flex items-center gap-1.5 px-2 text-[10px] font-medium overflow-hidden whitespace-nowrap transition-all border rounded-md",
                                discountSelected
                                  ? "bg-white border-[#3BABFD] text-[#353A44]"
                                  : "bg-white border-[#d4d8e0] text-[#6c7688] hover:border-[#a0a8b4]",
                              )}
                              style={{ left: getPosition(dStart) + 1, width: Math.max(getWidth(dStart, dEnd) - 2, 8) }}
                            >
                              <Percent className={cn("w-2.5 h-2.5 shrink-0", discountSelected ? "text-[#3BABFD]" : "text-[#9aa0ac]")} />
                              {discount.percentage}% {isMarkup ? "markup" : "discount"}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Quantity sub-row */}
                  <div className="flex items-stretch">
                    <div
                      className="shrink-0 sticky left-0 z-10 flex items-center pl-9 pr-3 py-2 bg-white border-r-[0.5px] border-[#ebeef1]"
                      style={{ width: labelW }}
                    >
                      <span className="text-xs text-[#9aa0ac]">Quantity</span>
                    </div>
                    <div className="relative flex-1 bg-white" style={{ height: 40 }}>
                      <TrackGrid />
                      {seatSegs.map((seg, i) => {
                        const left = getPosition(seg.start)
                        const width = getWidth(seg.start, seg.end)
                        const segSelected =
                          (seg.id && selectedNodeId === `plan-${entry.plan.id}-qty-${seg.id}`) ||
                          (!seg.id && quantityFocusedPlanId === entry.plan.id)
                        const before = lineStateAt(entry, new Date(seg.start.getTime() - 86400000)).mrr
                        const after = lineStateAt(entry, seg.start).mrr
                        const delta = seg.id ? after - before : 0
                        return (
                          <button
                            key={i}
                            onClick={() =>
                              seg.id
                                ? onSelectNode(`plan-${entry.plan.id}-qty-${seg.id}`)
                                : onSelectNode(`plan-${entry.plan.id}-price`)
                            }
                            onMouseEnter={(e) =>
                              showTip(e, seg.active ? "Scheduled quantity update" : "Base quantity", [
                                { label: "Units", value: `${seg.value}` },
                                { label: "Period", value: `${formatDateShort(seg.start)} → ${formatDateShort(seg.end)}` },
                                ...(seg.id
                                  ? [{
                                      label: "Change",
                                      value: `${delta >= 0 ? "+" : "−"}${fmtMoney(Math.abs(delta), currency)}/mo`,
                                      tone: (delta >= 0 ? "pos" : "neg") as "pos" | "neg",
                                    }]
                                  : []),
                              ])
                            }
                            onMouseMove={(e) => tip && showTip(e, tip.title, tip.rows)}
                            onMouseLeave={hideTip}
                            className={cn(
                              "absolute top-2 bottom-2 flex items-center gap-1.5 px-2 text-[10px] font-medium overflow-hidden whitespace-nowrap transition-all border rounded-md",
                              segSelected
                                ? "bg-white border-[#3BABFD] text-[#353A44]"
                                : "bg-white border-[#d4d8e0] text-[#475569] hover:border-[#a0a8b4]",
                            )}
                            style={{ left: left + 1, width: Math.max(width - 2, 8) }}
                          >
                            <Hash className={cn("w-2.5 h-2.5 shrink-0", segSelected ? "text-[#3BABFD]" : "text-[#9aa0ac]")} />
                            {seg.value} seats
                          </button>
                        )
                      })}
                    </div>
                  </div>
                    </>
                  )}{/* end isExpanded */}
                </div>
              )
            })})()}

          {/* ===== Invoices — sticky bottom, shown only at billing-change months ===== */}
          <div className="sticky bottom-0 z-20 flex items-stretch bg-white border-t-[0.5px] border-[#ebeef1]">
            <div
              className="shrink-0 sticky left-0 z-10 flex items-center px-3 py-3 bg-white border-r border-[#ebeef1]"
              style={{ width: labelW }}
            >
              <span className="text-[11px] font-medium text-[#353A44]">Invoices</span>
            </div>
            <div className="relative flex-1" style={{ height: 64 }}>
              <TrackGrid />
              {months.map((m, i) => {
                const key = `${m.year}-${m.month}`
                const change = changeMonths.get(key)
                if (!change) return null
                return (
                  <button
                    key={i}
                    onClick={() => onShowInvoicePreview(m.date)}
                    onMouseEnter={(e) =>
                      showTip(e, `${m.label} ${m.year} invoice`, [
                        {
                          label: "Change",
                          value: `${change.delta >= 0 ? "+" : "−"}${fmtMoney(Math.abs(change.delta), currency)}/mo`,
                          tone: change.delta >= 0 ? "pos" : "neg",
                        },
                        { label: "New total", value: `${fmtMoney(change.totalAfter, currency)}/mo` },
                      ])
                    }
                    onMouseMove={(e) => tip && showTip(e, tip.title, tip.rows)}
                    onMouseLeave={hideTip}
                    className="absolute top-1/2 -translate-y-1/2 w-9 h-11 rounded-lg bg-white border border-[#ebeef1] hover:border-[#533AFD] hover:bg-[#f8f7ff] transition-all flex flex-col items-center justify-center gap-0.5 shadow-sm"
                    style={{ left: i * colWidth + (colWidth - 36) / 2 }}
                  >
                    <FileText className="w-3.5 h-3.5 text-[#6c7688]" />
                    <span className="text-[8px] font-medium text-[#9aa0ac]">{m.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
          </div>
        </div>
      )}

      {/* Floating tooltip */}
      {tip && (
        <div
          className="fixed z-50 pointer-events-none rounded-md bg-[#353A44] text-white shadow-lg px-2.5 py-2 text-xs"
          style={{
            left: Math.min(tip.x + 12, (typeof window !== "undefined" ? window.innerWidth : 9999) - 200),
            top: tip.y + 12,
            minWidth: 150,
          }}
        >
          <div className="font-semibold mb-1">{tip.title}</div>
          {tip.rows.map((r, i) => (
            <div key={i} className="flex items-center justify-between gap-4">
              <span className="text-[#aab3c0]">{r.label}</span>
              <span
                className={cn(
                  "font-medium",
                  r.tone === "pos" && "text-[#7ee2a8]",
                  r.tone === "neg" && "text-[#ff9bb0]",
                )}
              >
                {r.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// BILLING TIMELINE V2 — cashflow-anchored preview
// Multi-lane: duration bar, monthly charge events, discount overlays
// =============================================================================
function BillingTimelineV2({
  selectedPlans,
  selectedNodeId,
  onSelectNode,
  currency,
  contractId,
  customer,
  draftExpiry,
  billingMethod = "auto",
}: {
  selectedPlans: SelectedPlanEntry[]
  selectedNodeId: string
  onSelectNode: (id: string) => void
  currency: string
  contractId: string
  customer: { name: string; email: string } | null
  draftExpiry: string
  billingMethod?: "auto" | "manual"
}) {
  type Zoom = "week" | "month" | "quarter" | "year"
  const [zoom, setZoom] = useState<Zoom>("month")
  const [viewMode, setViewMode] = useState<"timeline" | "pdf">("timeline")
  const scrollRef = useRef<HTMLDivElement>(null)
  const [tip, setTip] = useState<{ x: number; y: number; title: string; rows: { label: string; value: string; tone?: "pos" | "neg" }[] } | null>(null)

  const today = useMemo(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d
  }, [])

  const pxPerDay: number = zoom === "week" ? 38 : zoom === "month" ? 10 : zoom === "quarter" ? 3 : 1.3
  const labelW = 188

  // Derive visible date range from plan dates + padding
  const { viewStart, viewEnd } = useMemo(() => {
    const allDates = selectedPlans.flatMap(e => [new Date(e.startDate), new Date(e.endDate)]).filter(d => !isNaN(d.getTime()))
    const rStart = allDates.length ? new Date(Math.min(...allDates.map(d => d.getTime()))) : addMonths(today, -1)
    const rEnd = allDates.length ? new Date(Math.max(...allDates.map(d => d.getTime()))) : addMonths(today, 12)
    return {
      viewStart: new Date(Math.min(rStart.getTime() - 45 * 86400000, addMonths(today, -2).getTime())),
      viewEnd: new Date(rEnd.getTime() + 45 * 86400000),
    }
  }, [selectedPlans, today])

  const getX = (d: Date) => Math.max(0, (d.getTime() - viewStart.getTime()) / 86400000 * pxPerDay)
  const totalWidth = (viewEnd.getTime() - viewStart.getTime()) / 86400000 * pxPerDay + 60
  const todayX = getX(today)

  // Scroll today to ~22% from left on mount / zoom change
  useEffect(() => {
    if (!scrollRef.current) return
    scrollRef.current.scrollLeft = Math.max(0, todayX - scrollRef.current.clientWidth * 0.22)
  }, [zoom, todayX])

  // Month tick marks for the axis
  const monthTicks = useMemo(() => {
    const ticks: { date: Date; label: string; isJan: boolean }[] = []
    const cur = new Date(viewStart.getFullYear(), viewStart.getMonth(), 1)
    while (cur <= viewEnd) {
      ticks.push({ date: new Date(cur), label: cur.toLocaleDateString("en-US", { month: "short" }), isJan: cur.getMonth() === 0 })
      cur.setMonth(cur.getMonth() + 1)
    }
    return ticks
  }, [viewStart, viewEnd])

  // Generate monthly billing dates for a plan
  function billingDates(entry: SelectedPlanEntry): Date[] {
    const start = new Date(entry.startDate), end = new Date(entry.endDate)
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return []
    const dates: Date[] = []
    const cur = new Date(start)
    let guard = 72
    while (cur <= end && guard-- > 0) { dates.push(new Date(cur)); cur.setMonth(cur.getMonth() + 1) }
    return dates
  }

  const fmtAmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : `$${n % 1 === 0 ? n : n.toFixed(0)}`
  const hideTip = () => setTip(null)
  const showTip = (e: React.MouseEvent, title: string, rows: typeof tip extends null ? never : NonNullable<typeof tip>["rows"]) =>
    setTip({ x: e.clientX, y: e.clientY, title, rows })

  // Axis grid lines shared renderer
  const GridLines = () => (
    <>
      {monthTicks.map((m, i) => (
        <div key={i} className={cn("absolute top-0 bottom-0 border-l pointer-events-none", m.isJan ? "border-[#d6d9e0]" : "border-[#f0f1f4]")} style={{ left: getX(m.date) }} />
      ))}
      <div className="absolute top-0 bottom-0 w-[2px] bg-[#533AFD]/25 pointer-events-none" style={{ left: todayX }} />
    </>
  )

  const v2Header = (
    <div className="flex items-center justify-between px-4 h-12 border-b border-[#ebeef1] shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-[#353A44]">Cashflow preview</span>
        {viewMode === "timeline" && <TodayChip today={today} />}
      </div>
      <div className="flex items-center gap-2">
        {/* Preview / PDF toggle */}
        <div className="flex bg-[#f0f1f3] rounded-[7px] p-[3px] gap-[2px]">
          {(["timeline", "pdf"] as const).map(v => (
            <button
              key={v}
              onClick={() => setViewMode(v)}
              className={cn(
                "text-[11px] font-medium rounded-[5px] px-2 py-1 transition-all",
                viewMode === v ? "bg-white text-[#353A44] shadow-[0_1px_2px_rgba(0,0,0,0.12)]" : "text-[#6c7688] hover:text-[#353A44]",
              )}
            >
              {v === "timeline" ? "Preview" : "PDF"}
            </button>
          ))}
        </div>
        {viewMode === "timeline" && <ZoomControls zoom={zoom} onChange={setZoom} />}
      </div>
    </div>
  )

  if (selectedPlans.length === 0) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        {v2Header}
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-[#A0A8B4]">Add a pricing plan to see the cashflow</p>
        </div>
      </div>
    )
  }

  if (viewMode === "pdf") {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        {v2Header}
        <div className="flex-1 overflow-auto">
          <ServiceAgreementPdf
            contractId={contractId}
            customer={customer}
            currency={currency}
            draftExpiry={draftExpiry}
            selectedPlans={selectedPlans}
            billingMethod={billingMethod}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* ── Header ── */}
      {v2Header}

      {/* ── Scrollable body ── */}
      <div ref={scrollRef} className="flex-1 overflow-auto relative">
        <div style={{ width: labelW + totalWidth, position: "relative" }}>

          {/* Today line — spans full content height */}
          <div className="absolute top-0 bottom-0 w-[2px] bg-[#533AFD]/20 pointer-events-none z-[5]" style={{ left: labelW + todayX }} />

          {/* ── Sticky axis header ── */}
          <div className="sticky top-0 z-20 flex bg-white border-b border-[#ebeef1]">
            <div className="shrink-0 sticky left-0 z-10 bg-white border-r border-[#ebeef1]" style={{ width: labelW, height: 44 }} />
            <div className="relative flex-1" style={{ height: 44 }}>
              <GridLines />
              {/* Today pin in axis */}
              <div className="absolute top-0 bottom-0 w-[2px] bg-[#533AFD] pointer-events-none z-10" style={{ left: todayX }} />
              {/* Month / year labels */}
              {monthTicks.map((m, i) => (
                <span
                  key={i}
                  className={cn("absolute bottom-2 text-[10px] tabular-nums -translate-x-1/2 select-none",
                    m.isJan ? "text-[#353A44] font-semibold" : "text-[#A0A8B4]")}
                  style={{ left: getX(m.date) }}
                >
                  {m.isJan ? String(m.date.getFullYear()) : m.label}
                </span>
              ))}
              {/* Today label */}
              <div className="absolute top-2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-20" style={{ left: todayX }}>
                <span className="text-[10px] font-bold text-[#533AFD] whitespace-nowrap">Today</span>
              </div>
            </div>
          </div>

          {/* ── Plan groups ── */}
          {(() => {
            let _selPlanId2: string | null = null
            let _bestLen2 = 0
            for (const e of selectedPlans) {
              if (selectedNodeId === `plan-${e.plan.id}`) { _selPlanId2 = e.plan.id; break }
              const px = `plan-${e.plan.id}-`
              if (selectedNodeId.startsWith(px) && px.length > _bestLen2) {
                _selPlanId2 = e.plan.id; _bestLen2 = px.length
              }
            }
            const selectedPlanId2 = _selPlanId2
            return selectedPlans.map((entry) => {
            const planStart = new Date(entry.startDate)
            const planEnd = new Date(entry.endDate)
            const bDates = billingDates(entry)
            const priceSelected = selectedNodeId === `plan-${entry.plan.id}-price`
            const planSelected = selectedPlanId2 === entry.plan.id
            const barLeft = getX(planStart)
            const barWidth = Math.max(6, getX(planEnd) - barLeft)

            return (
              <div key={entry.plan.id} className="border-b border-[#ebeef1]">

                {/* ─ Plan header / duration bar row ─ */}
                <div className="flex items-stretch">
                  <button
                    onClick={() => onSelectNode(`plan-${entry.plan.id}-price`)}
                    className={cn("shrink-0 sticky left-0 z-10 flex items-center gap-2 px-3 border-r border-[#ebeef1] text-left transition-colors bg-white",
                      planSelected ? "bg-[#f7f5ff]" : "hover:bg-[#f9fafb]")}
                    style={{ width: labelW, height: 36 }}
                  >
                    <span className={cn("w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors",
                      planSelected ? "bg-[#533AFD] text-white" : "bg-[#eef0f3] text-[#475569]")}>
                      <Package className="w-2.5 h-2.5" />
                    </span>
                    <span className="text-xs font-semibold text-[#353A44] truncate">{entry.plan.name}</span>
                  </button>
                  <div className="relative flex-1" style={{ height: 36 }}>
                    <GridLines />
                    {/* Duration bar */}
                    <button
                      onClick={() => onSelectNode(`plan-${entry.plan.id}-price`)}
                      onMouseEnter={e => showTip(e, entry.plan.name, [
                        { label: "Start", value: formatDateShort(planStart) },
                        { label: "End", value: formatDateShort(planEnd) },
                        { label: "Duration", value: `${Math.round((planEnd.getTime() - planStart.getTime()) / (86400000 * 30))} months` },
                      ])}
                      onMouseMove={e => tip && showTip(e, tip.title, tip.rows)}
                      onMouseLeave={hideTip}
                      className={cn("absolute top-1/2 -translate-y-1/2 rounded-full h-2 transition-all hover:h-3",
                        planSelected ? "bg-[#533AFD]" : "bg-[#c7cad3]")}
                      style={{ left: barLeft, width: barWidth }}
                    />
                    {/* Start cap label */}
                    <span className="absolute top-1/2 -translate-y-1/2 -translate-x-full pr-1.5 text-[9px] text-[#A0A8B4] tabular-nums whitespace-nowrap pointer-events-none" style={{ left: barLeft }}>
                      {formatDateShort(planStart)}
                    </span>
                    {/* End cap label */}
                    <span className="absolute top-1/2 -translate-y-1/2 translate-x-1.5 text-[9px] text-[#A0A8B4] tabular-nums whitespace-nowrap pointer-events-none" style={{ left: barLeft + barWidth }}>
                      {formatDateShort(planEnd)}
                    </span>
                  </div>
                </div>

                {/* ─ Charges lane ─ */}
                <div className="flex items-stretch">
                  <div className="shrink-0 sticky left-0 z-10 flex items-center gap-1.5 px-3 border-r border-[#ebeef1] bg-white" style={{ width: labelW, height: 52 }}>
                    <Receipt className="w-3 h-3 text-[#A0A8B4] shrink-0" />
                    <span className="text-[11px] text-[#6c7688]">Charges / mo</span>
                  </div>
                  <div className="relative flex-1" style={{ height: 52 }}>
                    <GridLines />
                    {bDates.map((date, i) => {
                      const x = getX(date)
                      const mrr = lineStateAt(entry, date).mrr
                      const isPast = date < today
                      const isFirst = i === 0
                      const certainty = isFirst ? "confirmed" : "estimated"
                      const nodeId = `plan-${entry.plan.id}-price`
                      const isSel = selectedNodeId === nodeId
                      // Only show amount if different from previous or first visible future charge
                      const prevMrr = i > 0 ? lineStateAt(entry, bDates[i - 1]).mrr : -1
                      const amtChanged = mrr !== prevMrr
                      const showAmt = !isPast && (isFirst || amtChanged || i === bDates.findIndex(d => d >= today))
                      return (
                        <button
                          key={i}
                          onClick={() => onSelectNode(nodeId)}
                          onMouseEnter={e => showTip(e, certainty === "confirmed" ? "Confirmed charge" : "Estimated charge", [
                            { label: "Date", value: date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
                            { label: "Amount", value: fmtMoney(mrr, currency) },
                            { label: "Certainty", value: certainty === "confirmed" ? "Confirmed" : "Estimated (monthly)" },
                          ])}
                          onMouseMove={e => tip && showTip(e, tip.title, tip.rows)}
                          onMouseLeave={hideTip}
                          className="absolute flex flex-col items-center gap-0.5 group"
                          style={{ left: x, top: "50%", transform: "translate(-50%, -50%)" }}
                        >
                          {/* Diamond marker */}
                          <div className={cn(
                            "w-[10px] h-[10px] rotate-45 rounded-[2px] transition-all group-hover:scale-125",
                            isPast
                              ? "bg-[#e2e4e9]"
                              : isSel
                                ? "bg-[#353A44] shadow-md"
                                : certainty === "confirmed"
                                  ? "bg-[#533AFD] shadow-sm"
                                  : "bg-[#533AFD]/40 border border-[#533AFD]/60",
                          )} />
                          {/* Amount label */}
                          {showAmt && (
                            <span className={cn("text-[9px] font-semibold tabular-nums whitespace-nowrap",
                              isSel ? "text-[#353A44]" : isPast ? "text-[#c0c4cc]" : "text-[#533AFD]")}>
                              {fmtAmt(mrr)}
                            </span>
                          )}
                        </button>
                      )
                    })}
                    {/* "···" continuation */}
                    {bDates.length > 1 && (() => {
                      const lastX = getX(bDates[bDates.length - 1])
                      return <span className="absolute text-[11px] text-[#A0A8B4] pointer-events-none" style={{ left: lastX + 14, top: "50%", transform: "translateY(-60%)" }}>···</span>
                    })()}
                  </div>
                </div>

                {/* ─ Price / month lane ─ */}
                {(() => {
                  const priceSegs = buildPriceSegments(
                    planStart, planEnd,
                    entry.plan.defaultMonthlyPrice,
                    entry.priceOverrides.map(o => ({
                      start: new Date(o.startDate), end: new Date(o.endDate),
                      value: typeof o.price === "number" ? o.price : parseFloat(String(o.price).replace(/[^0-9.]/g, "")) || 0,
                      id: o.id,
                    })).filter(w => !isNaN(w.start.getTime()) && !isNaN(w.end.getTime())),
                  )
                  return (
                    <div className="flex items-stretch">
                      <div className="shrink-0 sticky left-0 z-10 flex items-center gap-1.5 px-3 border-r border-[#ebeef1] bg-white" style={{ width: labelW, height: 32 }}>
                        <Tag className="w-3 h-3 text-[#A0A8B4] shrink-0" />
                        <span className="text-[11px] text-[#6c7688]">Price / month</span>
                      </div>
                      <div className="relative flex-1" style={{ height: 32 }}>
                        <GridLines />
                        {priceSegs.map((seg, i) => {
                          const left = getX(seg.start), width = Math.max(2, getX(seg.end) - left)
                          const segSel = seg.id
                            ? selectedNodeId === `plan-${entry.plan.id}-override-${seg.id}`
                            : priceSelected
                          return (
                            <button
                              key={i}
                              onClick={() => onSelectNode(seg.id ? `plan-${entry.plan.id}-override-${seg.id}` : `plan-${entry.plan.id}-price`)}
                              onMouseEnter={e => showTip(e, seg.active ? "Price override" : "Base price", [
                                { label: "Unit price", value: `$${seg.value.toFixed(seg.value % 1 === 0 ? 0 : 2)}/mo` },
                                { label: "Period", value: `${formatDateShort(seg.start)} → ${formatDateShort(seg.end)}` },
                              ])}
                              onMouseMove={e => tip && showTip(e, tip.title, tip.rows)}
                              onMouseLeave={hideTip}
                              className={cn(
                                "absolute top-1/2 -translate-y-1/2 h-5 rounded flex items-center px-2 text-[10px] font-medium overflow-hidden whitespace-nowrap transition-colors",
                                segSel ? "bg-[#353A44] text-white" : seg.active ? "bg-[#ede9ff] text-[#533AFD]" : "bg-[#f0f1f4] text-[#6c7688]",
                              )}
                              style={{ left, width }}
                            >
                              ${seg.value.toFixed(seg.value % 1 === 0 ? 0 : 2)}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}

                {/* ─ Units lane ─ */}
                {(() => {
                  const qtySegs = buildQtySegments(
                    planStart, planEnd, entry.quantity,
                    entry.quantityUpdates.map(q => ({ date: new Date(q.effectiveDate), qty: q.quantity, id: q.id })),
                  )
                  return (
                    <div className="flex items-stretch">
                      <div className={cn("shrink-0 sticky left-0 z-10 flex items-center gap-1.5 px-3 border-r border-[#ebeef1] bg-white", priceSelected && "bg-[#f7f5ff]")} style={{ width: labelW, height: 32 }}>
                        <Hash className="w-3 h-3 text-[#A0A8B4] shrink-0" />
                        <span className="text-[11px] text-[#6c7688]">Units</span>
                      </div>
                      <div className="relative flex-1" style={{ height: 32 }}>
                        <GridLines />
                        {qtySegs.map((seg, i) => {
                          const left = getX(seg.start), width = Math.max(2, getX(seg.end) - left)
                          const segSel = seg.id
                            ? selectedNodeId === `plan-${entry.plan.id}-qty-${seg.id}`
                            : priceSelected
                          return (
                            <button
                              key={i}
                              onClick={() => onSelectNode(seg.id ? `plan-${entry.plan.id}-qty-${seg.id}` : `plan-${entry.plan.id}-price`)}
                              onMouseEnter={e => showTip(e, seg.active ? "Quantity update" : "Base quantity", [
                                { label: "Units", value: `${seg.value}` },
                                { label: "Period", value: `${formatDateShort(seg.start)} → ${formatDateShort(seg.end)}` },
                              ])}
                              onMouseMove={e => tip && showTip(e, tip.title, tip.rows)}
                              onMouseLeave={hideTip}
                              className={cn(
                                "absolute top-1/2 -translate-y-1/2 h-5 rounded flex items-center px-2 text-[10px] font-medium overflow-hidden whitespace-nowrap transition-colors",
                                segSel ? "bg-[#353A44] text-white" : seg.active ? "bg-[#e8f4fb] text-[#0a7ea4]" : "bg-[#f0f1f4] text-[#6c7688]",
                              )}
                              style={{ left, width }}
                            >
                              {seg.value} units
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}

                {/* ─ Discount / markup lanes ─ */}
                {entry.discounts.map(discount => {
                  const dStart = new Date(discount.startDate)
                  const dEnd = new Date(discount.endDate)
                  if (isNaN(dStart.getTime()) || isNaN(dEnd.getTime())) return null
                  const dnId = `discount-${entry.plan.id}-${discount.id}`
                  const dSel = selectedNodeId === dnId
                  const dLeft = getX(dStart)
                  const dWidth = Math.max(6, getX(dEnd) - dLeft)
                  const isMarkup = discount.type === "markup"
                  return (
                    <div key={discount.id} className="flex items-stretch">
                      <button
                        onClick={() => onSelectNode(dnId)}
                        className="shrink-0 sticky left-0 z-10 flex items-center gap-1.5 px-3 border-r border-[#ebeef1] bg-white hover:bg-[#f9fafb] transition-colors text-left"
                        style={{ width: labelW, height: 26 }}
                      >
                        <Percent className="w-3 h-3 text-[#A0A8B4] shrink-0" />
                        <span className="text-[11px] text-[#6c7688] truncate">{isMarkup ? "+" : "−"}{discount.percentage}% {isMarkup ? "markup" : "discount"}</span>
                      </button>
                      <div className="relative flex-1" style={{ height: 26 }}>
                        <GridLines />
                        <button
                          onClick={() => onSelectNode(dnId)}
                          onMouseEnter={e => showTip(e, isMarkup ? "Markup" : "Discount", [
                            { label: "Rate", value: `${discount.percentage}%` },
                            { label: "Start", value: formatDateShort(dStart) },
                            { label: "End", value: formatDateShort(dEnd) },
                          ])}
                          onMouseMove={e => tip && showTip(e, tip.title, tip.rows)}
                          onMouseLeave={hideTip}
                          className={cn(
                            "absolute top-1/2 -translate-y-1/2 h-3 rounded-full transition-all hover:h-4",
                            isMarkup
                              ? dSel ? "bg-[#059669] ring-1 ring-[#059669]" : "bg-[#d1fae5]"
                              : dSel ? "bg-[#f59e0b] ring-1 ring-[#f59e0b]" : "bg-[#fde68a]/80",
                          )}
                          style={{ left: dLeft, width: dWidth }}
                        />
                        {/* Rate label on the bar */}
                        {dWidth > 40 && (
                          <span className="absolute top-1/2 -translate-y-1/2 text-[9px] font-semibold pointer-events-none px-1 truncate"
                            style={{ left: dLeft + 4, maxWidth: dWidth - 8, color: isMarkup ? "#059669" : "#b45309" }}>
                            {discount.percentage}%
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })})()}
        </div>
      </div>

      {/* ── Tooltip ── */}
      {tip && (
        <div className="fixed z-50 pointer-events-none rounded-lg bg-[#22263a] text-white shadow-xl px-3 py-2 text-xs"
          style={{
            left: Math.min(tip.x + 14, (typeof window !== "undefined" ? window.innerWidth : 9999) - 220),
            top: tip.y + 14,
            minWidth: 168,
          }}>
          <div className="font-semibold mb-1.5">{tip.title}</div>
          {tip.rows.map((r, i) => (
            <div key={i} className="flex justify-between gap-5">
              <span className="text-white/50">{r.label}</span>
              <span className={cn("font-medium tabular-nums", r.tone === "pos" && "text-emerald-400", r.tone === "neg" && "text-red-400")}>{r.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Small sub-components used by BillingTimelineV2
function TodayChip({ today }: { today: Date }) {
  return (
    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#eef0ff] border border-[#533AFD]/20">
      <span className="w-1.5 h-1.5 rounded-full bg-[#533AFD]" />
      <span className="text-[10px] font-semibold text-[#533AFD] tabular-nums">
        {today.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
      </span>
    </div>
  )
}

function ZoomControls({ zoom, onChange }: { zoom: "week" | "month" | "quarter" | "year"; onChange: (z: "week" | "month" | "quarter" | "year") => void }) {
  const opts: { label: string; key: "week" | "month" | "quarter" | "year" }[] = [
    { label: "W", key: "week" }, { label: "M", key: "month" }, { label: "Q", key: "quarter" }, { label: "Y", key: "year" },
  ]
  return (
    <div className="flex items-center gap-0.5 bg-[#f5f6f8] rounded-md p-0.5">
      {opts.map(o => (
        <button key={o.key} onClick={() => onChange(o.key)}
          className={cn("w-7 h-7 rounded text-[11px] font-semibold transition-colors",
            zoom === o.key ? "bg-white text-[#353A44] shadow-sm" : "text-[#A0A8B4] hover:text-[#353A44]")}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

// =============================================================================
// SCHEDULE MODAL COMPONENT
// =============================================================================
function ScheduleModal({
  planId,
  plan,
  onClose,
  onAddPriceOverride,
  onAddQuantityUpdate,
  onAddDiscount,
}: {
  planId: string
  plan: SelectedPlanEntry
  onClose: () => void
  onAddPriceOverride: (planId: string, override: PriceOverride) => void
  onAddQuantityUpdate: (planId: string, update: QuantityUpdate) => void
  onAddDiscount: (planId: string, discount: Discount) => void
}) {
  const [scheduleType, setScheduleType] = useState<"price" | "quantity" | "discount">("price")
  const [startDate, setStartDate] = useState(toIso(plan.startDate))
  const [endDate, setEndDate] = useState(toIso(plan.endDate))
  const [price, setPrice] = useState("")
  const [quantity, setQuantity] = useState("")
  const [discountName, setDiscountName] = useState("")
  const [discountPercent, setDiscountPercent] = useState("")

  const handleSubmit = () => {
    if (scheduleType === "price" && price) {
      onAddPriceOverride(planId, {
        id: generateId(),
        startDate: fromIso(startDate),
        endDate: fromIso(endDate),
        price: `$${parseFloat(price).toFixed(2)}`,
      })
    } else if (scheduleType === "quantity" && quantity) {
      onAddQuantityUpdate(planId, {
        id: generateId(),
        effectiveDate: fromIso(startDate),
        quantity: parseInt(quantity),
      })
    } else if (scheduleType === "discount" && discountPercent) {
      onAddDiscount(planId, {
        id: generateId(),
        name: discountName || `${discountPercent}% Discount`,
        percentage: parseInt(discountPercent),
        startDate: fromIso(startDate),
        endDate: fromIso(endDate),
      })
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#ebeef1]">
          <h2 className="text-base font-semibold text-[#353A44]">Schedule update</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#f5f6f8] text-[#A0A8B4]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Type selector */}
          <div>
            <label className="block text-xs font-medium text-[#596171] mb-2">Update type</label>
            <div className="flex gap-2">
              {[
                { id: "price", label: "Price override", icon: Tag },
                { id: "quantity", label: "Quantity update", icon: Hash },
                { id: "discount", label: "Discount", icon: Percent },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setScheduleType(id as typeof scheduleType)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md border text-sm font-medium transition-colors",
                    scheduleType === id 
                      ? "border-[#533AFD] bg-[#F7F5FD] text-[#533AFD]" 
                      : "border-[#d8dee4] bg-white text-[#6c7688] hover:bg-[#f5f6f8]"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <SailDatePicker
              label={scheduleType === "quantity" ? "Effective date" : "Start date"}
              value={startDate}
              onChange={setStartDate}
            />
            {scheduleType !== "quantity" && (
              <SailDatePicker
                label="End date"
                value={endDate}
                onChange={setEndDate}
                disableBefore={startDate}
              />
            )}
          </div>

          {/* Value input */}
          {scheduleType === "price" && (
            <div>
              <label className="block text-xs font-medium text-[#596171] mb-1.5">Price (USD per month)</label>
              <input
                type="number"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="100.00"
                className="w-full h-9 px-3 rounded-md border border-[#dfe1e6] bg-white text-sm text-[#1A1A1A] outline-none focus:border-[#533AFD] focus:ring-[3px] focus:ring-[#533AFD]/15 transition-all"
              />
            </div>
          )}
          {scheduleType === "quantity" && (
            <div>
                    <label className="block text-xs font-medium text-[#596171] mb-1.5">Quantity (units)</label>
              <input
                type="number"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                placeholder="100"
                className="w-full h-9 px-3 rounded-md border border-[#dfe1e6] bg-white text-sm text-[#1A1A1A] outline-none focus:border-[#533AFD] focus:ring-[3px] focus:ring-[#533AFD]/15 transition-all"
              />
            </div>
          )}
          {scheduleType === "discount" && (
            <>
              <div>
                <label className="block text-xs font-medium text-[#596171] mb-1.5">Discount name (optional)</label>
                <input
                  type="text"
                  value={discountName}
                  onChange={e => setDiscountName(e.target.value)}
                  placeholder="e.g. Early adopter discount"
                  className="w-full h-9 px-3 rounded-md border border-[#dfe1e6] bg-white text-sm text-[#1A1A1A] outline-none focus:border-[#533AFD] focus:ring-[3px] focus:ring-[#533AFD]/15 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#596171] mb-1.5">Percentage</label>
                <input
                  type="number"
                  value={discountPercent}
                  onChange={e => setDiscountPercent(e.target.value)}
                  placeholder="10"
                  className="w-full h-9 px-3 rounded-md border border-[#dfe1e6] bg-white text-sm text-[#1A1A1A] outline-none focus:border-[#533AFD] focus:ring-[3px] focus:ring-[#533AFD]/15 transition-all"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-[#ebeef1] bg-[#fafbfc]">
          <button onClick={onClose} className="px-4 py-2 rounded-md border border-[#d8dee4] bg-white hover:bg-[#f5f6f8] text-sm font-medium text-[#353A44] transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} className="px-4 py-2 rounded-md bg-[#533AFD] hover:bg-[#4730E0] text-sm font-medium text-white transition-colors">
            Add schedule
          </button>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// INVOICE PREVIEW MODAL
// =============================================================================
function InvoicePreviewModal({
  date,
  selectedPlans,
  customer,
  currency,
  onClose,
}: {
  date: Date
  selectedPlans: SelectedPlanEntry[]
  customer: { name: string; email: string } | null
  currency?: string
  onClose: () => void
}) {
  const monthLabel = date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
  const currencyCode = currency || "USD"

  const parsePrice = (p: string | number) =>
    typeof p === "number" ? p : parseFloat(String(p).replace(/[^0-9.]/g, "")) || 0

  // Use the last day of the invoice month as the point-in-time the invoice covers,
  // so a line counts if it is active at any point during the billing month.
  const asOf = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
  // A window is billed this month if it overlaps the invoice month at all.
  const within = (start: Date, end: Date) =>
    !isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= asOf && end >= monthStart

  // Build accurate line items for the invoice month, reflecting overrides + quantity updates + discounts
  const lineItems = selectedPlans
    .map(entry => {
      const planStart = new Date(entry.startDate)
      const planEnd = new Date(entry.endDate)
      const active = within(planStart, planEnd)
      if (!active) return null

      // Effective unit price: latest override window covering the invoice month, else base price
      let unitPrice = entry.plan.defaultMonthlyPrice
      let priceIsOverridden = false
      entry.priceOverrides.forEach(o => {
        if (within(new Date(o.startDate), new Date(o.endDate))) {
          unitPrice = parsePrice(o.price)
          priceIsOverridden = true
        }
      })

      // Effective quantity: most recent quantity update on/before the invoice month end, else base quantity
      let quantity = entry.quantity
      const sortedUpdates = [...entry.quantityUpdates]
        .filter(q => !isNaN(new Date(q.effectiveDate).getTime()))
        .sort((a, b) => new Date(a.effectiveDate).getTime() - new Date(b.effectiveDate).getTime())
      sortedUpdates.forEach(q => {
        if (new Date(q.effectiveDate) <= asOf) quantity = q.quantity
      })

      // Effective discount: any discount window covering the invoice month
      let discountPct = 0
      entry.discounts.forEach(d => {
        if (within(new Date(d.startDate), new Date(d.endDate))) {
          discountPct += d.percentage
        }
      })
      discountPct = Math.min(discountPct, 100)

      const subtotal = unitPrice * quantity
      const discountAmount = subtotal * (discountPct / 100)
      const amount = subtotal - discountAmount

      return {
        id: entry.plan.id,
        name: entry.plan.name,
        unitPrice,
        priceIsOverridden,
        quantity,
        discountPct,
        discountAmount,
        amount,
      }
    })
    .filter((l): l is NonNullable<typeof l> => l !== null)

  const subtotalAll = lineItems.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0)
  const discountAll = lineItems.reduce((sum, l) => sum + l.discountAmount, 0)
  const total = subtotalAll - discountAll

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#ebeef1]">
          <h2 className="text-base font-semibold text-[#353A44]">Invoice preview — {monthLabel}</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#f5f6f8] text-[#A0A8B4]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          <div className="border border-[#ebeef1] rounded-lg overflow-hidden">
            {/* Invoice header */}
            <div className="bg-[#f5f6f8] border-b border-[#ebeef1] px-4 py-3">
              <div className="text-[#353A44] font-semibold">Invoice</div>
              <div className="text-[#6c7688] text-xs mt-0.5">{monthLabel}</div>
            </div>

            {/* Customer */}
            <div className="px-4 py-3 border-b border-[#ebeef1]">
              <div className="text-[10px] text-[#A0A8B4] mb-1">Bill to</div>
              <div className="text-sm font-medium text-[#353A44]">{customer?.name || "Customer"}</div>
              <div className="text-xs text-[#6c7688]">{customer?.email || "customer@example.com"}</div>
            </div>

            {/* Line items */}
            <div className="px-4 py-3">
              {lineItems.length === 0 ? (
                <p className="text-sm text-[#A0A8B4] py-2 text-center">
                  No plans are active during {monthLabel}.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] text-[#A0A8B4]">
                      <th className="text-left pb-2">Description</th>
                      <th className="text-right pb-2">Unit price</th>
                      <th className="text-right pb-2">Qty</th>
                      <th className="text-right pb-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map(l => (
                      <tr key={l.id} className="align-top">
                        <td className="py-1.5 text-[#353A44]">
                          {l.name}
                          {l.priceIsOverridden && (
                            <span className="ml-1.5 inline-block text-[10px] text-[#6c7688] border border-[#d8dee4] rounded px-1 py-px align-middle">
                              custom price
                            </span>
                          )}
                          {l.discountPct > 0 && (
                            <div className="text-[11px] text-[#6c7688] mt-0.5">{l.discountPct}% discount applied</div>
                          )}
                        </td>
                        <td className="py-1.5 text-right text-[#6c7688] whitespace-nowrap">${l.unitPrice.toFixed(2)}</td>
                        <td className="py-1.5 text-right text-[#6c7688]">{l.quantity}</td>
                        <td className="py-1.5 text-right text-[#353A44] whitespace-nowrap">${l.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Totals */}
            {lineItems.length > 0 && (
              <div className="px-4 py-3 border-t border-[#ebeef1] bg-[#fafbfc] space-y-1.5">
                <div className="flex items-center justify-between text-sm text-[#6c7688]">
                  <span>Subtotal</span>
                  <span>${subtotalAll.toFixed(2)}</span>
                </div>
                {discountAll > 0 && (
                  <div className="flex items-center justify-between text-sm text-[#6c7688]">
                    <span>Discounts</span>
                    <span>-${discountAll.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1.5 border-t border-[#ebeef1]">
                  <span className="text-sm font-semibold text-[#353A44]">Total</span>
                  <span className="text-sm font-semibold text-[#353A44]">${total.toFixed(2)} {currencyCode}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-5 py-4 border-t border-[#ebeef1] bg-[#fafbfc]">
          <button onClick={onClose} className="px-4 py-2 rounded-md border border-[#d8dee4] bg-white hover:bg-[#f5f6f8] text-sm font-medium text-[#353A44] transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// PLAN SELECTOR MODAL (for adding plans)
// =============================================================================
function PlanSelectorModal({
  onClose,
  onSelectPlan,
  onAddDiscount,
  onAddMarkup,
  onAddOneTimeFee,
  canAddDiscount,
  existingPlanIds,
}: {
  onClose: () => void
  onSelectPlan: (plan: PlanTemplate) => void
  onAddDiscount: () => void
  onAddMarkup: () => void
  onAddOneTimeFee: () => void
  canAddDiscount: boolean
  existingPlanIds: string[]
}) {
  const [search, setSearch] = useState("")
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState("")
  const [newPrice, setNewPrice] = useState("")
  const availablePlans = planCatalog.filter(p => 
    !existingPlanIds.includes(p.id) &&
    (search === "" || p.name.toLowerCase().includes(search.toLowerCase()))
  )

  function submitNewProduct() {
    if (!newName.trim()) return
    onSelectPlan(makeCustomPlan(newName, parseFloat(newPrice) || 0))
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      {/* Position the dropdown near the Add button in the tree */}
      <div 
        className="absolute left-[20px] top-[300px] w-72 bg-white rounded-lg border border-[#ebeef1] shadow-xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {creating ? (
          <div className="p-3 space-y-3">
            <div className="text-sm font-semibold text-[#353A44]">New product</div>
            <div>
              <label className="block text-xs font-normal text-[#596171] mb-1.5">Name</label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                autoFocus
                placeholder="e.g. Onboarding fee"
                className="w-full h-8 px-2.5 rounded-md border border-[#dfe1e6] bg-white text-sm text-[#1A1A1A] outline-none focus:border-[#533AFD] focus:ring-[3px] focus:ring-[#533AFD]/15 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-normal text-[#596171] mb-1.5">Price per month</label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-[#A0A8B4]">$</span>
                <input
                  type="number"
                  value={newPrice}
                  onChange={e => setNewPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-8 pl-6 pr-2.5 rounded-md border border-[#dfe1e6] bg-white text-sm text-[#1A1A1A] outline-none focus:border-[#533AFD] focus:ring-[3px] focus:ring-[#533AFD]/15 transition-all"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setCreating(false)}
                className="px-3 py-1.5 rounded-md border border-[#d8dee4] bg-white hover:bg-[#f5f6f8] text-xs font-medium text-[#353A44]"
              >
                Cancel
              </button>
              <button
                onClick={submitNewProduct}
                disabled={!newName.trim()}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium text-white",
                  newName.trim() ? "bg-[#533AFD] hover:bg-[#4730E0]" : "bg-[#C4BBF8] cursor-not-allowed",
                )}
              >
                Add product
              </button>
            </div>
          </div>
        ) : (
        <>
        {/* Search */}
        <div className="px-3 py-2 border-b border-[#ebeef1]">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A0A8B4]" />
            <input
              type="text"
              placeholder="Search product catalog"
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
              className="w-full h-8 pl-8 pr-3 rounded-md border border-[#ebeef1] bg-white text-sm text-[#353A44] placeholder:text-[#A0A8B4] outline-none focus:border-[#533AFD]"
            />
          </div>
        </div>

        {/* Action options */}
        <div className="border-b border-[#ebeef1]">
          <button
            onClick={() => setCreating(true)}
            className="w-full flex items-center justify-between px-3 py-2 text-sm text-[#533AFD] hover:bg-[#f5f6f8] transition-colors"
          >
            <span className="flex items-center gap-2">
              <Plus className="w-3.5 h-3.5" />
              <span>New product</span>
            </span>
            <span className="text-xs text-[#A0A8B4]">Create custom</span>
          </button>
          <button
            onClick={onAddDiscount}
            disabled={!canAddDiscount}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 text-sm transition-colors",
              canAddDiscount ? "text-[#533AFD] hover:bg-[#f5f6f8]" : "text-[#C4BBF8] cursor-not-allowed",
            )}
          >
            <span className="flex items-center gap-2">
              <Plus className="w-3.5 h-3.5" />
              <span>Discount</span>
            </span>
            <span className="text-xs text-[#A0A8B4]">{canAddDiscount ? "Add % discount" : "Add a product first"}</span>
          </button>
          <button
            onClick={() => { onAddMarkup(); onClose(); }}
            disabled={!canAddDiscount}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 text-sm transition-colors",
              canAddDiscount ? "text-[#533AFD] hover:bg-[#f5f6f8]" : "text-[#C4BBF8] cursor-not-allowed",
            )}
          >
            <span className="flex items-center gap-2">
              <Plus className="w-3.5 h-3.5" />
              <span>Markup</span>
            </span>
            <span className="text-xs text-[#A0A8B4]">{canAddDiscount ? "Add % markup" : "Add a product first"}</span>
          </button>
          <button
            onClick={() => { onAddOneTimeFee(); onClose(); }}
            className="w-full flex items-center justify-between px-3 py-2 text-sm text-[#533AFD] hover:bg-[#f5f6f8] transition-colors"
          >
            <span className="flex items-center gap-2">
              <Plus className="w-3.5 h-3.5" />
              <span>One-time fee</span>
            </span>
            <span className="text-xs text-[#A0A8B4]">Flat charge</span>
          </button>
        </div>

        {/* Plan list */}
        <div className="max-h-[280px] overflow-auto">
          {availablePlans.map(plan => (
            <div key={plan.id} className="border-b border-[#ebeef1] last:border-b-0">
              {/* Product name — non-clickable label */}
              <div className="flex items-center gap-2 px-3 pt-2.5 pb-1">
                <Package className="w-3.5 h-3.5 text-[#A0A8B4] shrink-0" />
                <span className="text-xs font-semibold text-[#596171]">{plan.name}</span>
              </div>
              {/* Monthly price — the clickable item */}
              <button
                onClick={() => { onSelectPlan(plan); onClose() }}
                className="w-full flex items-center justify-between px-3 py-1.5 pb-2.5 hover:bg-[#f5f6f8] transition-colors text-left pl-8"
              >
                <span className="text-sm text-[#353A44]">${plan.defaultMonthlyPrice.toFixed(2)} USD</span>
                <span className="text-xs text-[#A0A8B4]">per month</span>
              </button>
            </div>
          ))}
          {availablePlans.length === 0 && (
            <div className="px-3 py-4 text-center text-xs text-[#A0A8B4]">
              No plans available
            </div>
          )}
        </div>
        </>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// GET STARTED SCREEN
// =============================================================================
interface GetStartedConfig {
  contractId: string
  customer: { name: string; email: string }
  currency: string
  draftExpiry: string
  documentName: string | null
  // Full plan entries (with overrides, seat ramps, and discounts) so the editor
  // opens with exactly what the get-started live preview showed.
  plans: SelectedPlanEntry[]
  // When the user uploads a document, we load the canonical demo contract
  // (Enterprise Seats + Edge Storage Units with its promo + seat ramp).
  loadDemo?: boolean
  // Contract start date the user requested (e.g. "Jan 1, 2027"). When set, the
  // demo template is shifted to begin on this date.
  startDate?: string
  // The AI conversation from the get-started screen, carried into the editor's
  // assistant so the user can keep chatting where they left off.
  conversation?: { role: "user" | "assistant"; text: string }[]
  }

// Get-started live preview — the SAME order form as the editor PDF view, wrapped
// with a "Live preview" caption. Renders OrderFormDocument so the two surfaces
// stay pixel-identical.
function ContractPreview({
  contractId,
  customer,
  currency,
  draftExpiry,
  documentName,
  selectedPlans,
}: {
  contractId: string
  customer: { name: string; email: string }
  currency: string
  draftExpiry: string
  documentName: string | null
  selectedPlans: SelectedPlanEntry[]
}) {
  return (
    <div className="mx-auto max-w-[680px]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold text-[#A0A8B4]">
          Live preview
        </span>
        <span className="text-[11px] font-medium text-[#A0A8B4] tabular-nums">{contractId}</span>
      </div>
      <OrderFormDocument
        contractId={contractId}
        customer={customer}
        currency={currency}
        draftExpiry={draftExpiry}
        documentName={documentName}
        selectedPlans={selectedPlans}
      />
    </div>
  )
}

function GetStartedScreen({
  contractId,
  onDiscard,
  onContinue,
}: {
  contractId: string
  onDiscard: () => void
  onContinue: (config: GetStartedConfig) => void
}) {
  const [customer, setCustomer] = useState<{ name: string; email: string }>({ name: "", email: "" })
  const [currency, setCurrency] = useState("")
  // Drafts auto-expire exactly one month after creation (now). The user can
  // still override this in the form.
  const [draftExpiry, setDraftExpiry] = useState(defaultDraftExpiry)
  const [documentName, setDocumentName] = useState<string | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  // In AI mode, an attached document waits here until the user hits send — we
  // only read/apply it to the draft on send, never the moment it's attached.
  const [pendingFile, setPendingFile] = useState<string | null>(null)
  const [mode, setMode] = useState<"agent" | "manual">("agent")
  const [agentPrompt, setAgentPrompt] = useState("")
  const [agentMessages, setAgentMessages] = useState<
    { role: "user" | "assistant"; text: string; attachment?: string }[]
  >([])
  const [agentThinking, setAgentThinking] = useState(false)
  // A pending question the assistant is waiting on the user to answer with the
  // inline quick-reply buttons (e.g. confirming the customer it detected).
  const [pendingAction, setPendingAction] = useState<
    | { kind: "confirm-customer"; customer: { name: string; email: string } }
    | { kind: "confirm-new-customer"; name: string }
    | { kind: "choose-customer" }
    | null
  >(null)
  const [planSearch, setPlanSearch] = useState("")
  const [creatingProduct, setCreatingProduct] = useState(false)
  const [newProductName, setNewProductName] = useState("")
  const [newProductPrice, setNewProductPrice] = useState("")
  const [selectedPlans, setSelectedPlans] = useState<SelectedPlanEntry[]>([])
  // Set once a document is uploaded — signals the editor to hydrate the full
  // demo contract (with overrides, seat ramp, and the launch promo discount).
  const [loadDemo, setLoadDemo] = useState(false)
  // The contract start date requested when uploading a document (e.g. via
  // "starting Jan 1, 2027"). Carried into the editor so it shifts to match.
  const [demoStartDate, setDemoStartDate] = useState<string | undefined>(undefined)

  const defaultStart = formatDateValue(new Date())
  const defaultEnd = formatDateValue(addMonths(new Date(), 12))

  const filteredPlans = useMemo(
    () =>
      planCatalog.filter(
        p =>
          planSearch === "" ||
          p.name.toLowerCase().includes(planSearch.toLowerCase()) ||
          p.description.toLowerCase().includes(planSearch.toLowerCase()),
      ),
    [planSearch],
  )
  const unselectedPlans = filteredPlans.filter(p => !selectedPlans.some(s => s.plan.id === p.id))

  const canContinue = selectedPlans.length > 0 && customer.name !== "" && currency !== ""

  function togglePlan(plan: PlanTemplate) {
    setSelectedPlans(prev => {
      if (prev.some(s => s.plan.id === plan.id)) {
        return prev.filter(s => s.plan.id !== plan.id)
      }
      return [
        ...prev,
        { plan, startDate: defaultStart, endDate: defaultEnd, quantity: 1, priceOverrides: [], quantityUpdates: [], discounts: [] },
      ]
    })
  }

  function updatePlan(planId: string, updates: Partial<{ startDate: string; endDate: string; quantity: number }>) {
    setSelectedPlans(prev => prev.map(s => (s.plan.id === planId ? { ...s, ...updates } : s)))
  }

  function addCustomProduct() {
    if (!newProductName.trim()) return
    const plan = makeCustomPlan(newProductName, parseFloat(newProductPrice) || 0)
    setSelectedPlans(prev => [
      ...prev,
      { plan, startDate: defaultStart, endDate: defaultEnd, quantity: 1, priceOverrides: [], quantityUpdates: [], discounts: [] },
    ])
    setNewProductName("")
    setNewProductPrice("")
    setCreatingProduct(false)
  }

  function applyParsedDocument(opts?: { startDate?: string; customer?: { name: string; email: string } }) {
    // Simulate extracting contract details from the uploaded document. We load
    // the canonical demo contract so the parsed result is rich and consistent
    // (Enterprise Seats + Edge Storage Units, with the seat ramp + launch promo).
    // We populate the FULL entries here so the live preview shows the exact same
    // schedule the editor will open with — they never drift apart.
    setCustomer(opts?.customer ?? demoV4Contract.customer)
    setCurrency(demoV4Contract.currency)
    setDraftExpiry(defaultDraftExpiry())
    setSelectedPlans(buildDemoEntries(opts?.startDate))
    setDemoStartDate(opts?.startDate)
    setLoadDemo(true)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setDocumentName(file.name)
    // Reset the input so re-selecting the same file still fires onChange.
    e.target.value = ""

    if (mode === "agent") {
      // AI mode: just attach the file. We don't touch the draft until the user
      // actually hits send (handled in handleAgentSend).
      setPendingFile(file.name)
      return
    }

    // Manual mode: analyze immediately and auto-fill the form.
    setIsParsing(true)
    window.setTimeout(() => {
      applyParsedDocument()
      setIsParsing(false)
    }, 1800)
  }

  // ---- Conversational helpers -------------------------------------------------

  function pushAssistant(text: string) {
    setAgentMessages(prev => [...prev, { role: "assistant", text }])
  }

  // Try to match a customer the user named to a known customer record.
  function findCustomerInText(text: string) {
    const lower = text.toLowerCase()
    return customerOptions.find(
      c =>
        lower.includes(c.name.toLowerCase()) ||
        lower.includes(c.name.split(" ")[0].toLowerCase()),
    )
  }

  // Pull a proper-noun name following "for/to/customer/named" when it isn't a
  // known customer (e.g. "generate this for Northwind Labs").
  function extractNameAfterPreposition(text: string) {
    const m = text.match(/\b(?:for|to|customer|client|named?)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/)
    return m ? m[1].trim() : null
  }

  function addFirstAvailablePlan() {
    const next = planCatalog.find(p => !selectedPlans.some(s => s.plan.id === p.id)) ?? planCatalog[0]
    setSelectedPlans(prev =>
      prev.some(s => s.plan.id === next.id)
        ? prev
        : [...prev, { plan: next, startDate: defaultStart, endDate: defaultEnd, quantity: 1, priceOverrides: [], quantityUpdates: [], discounts: [] }],
    )
    return next
  }

  // Commit a customer to the draft, then fill any remaining gaps (currency,
  // at least one plan) so the contract becomes ready to configure.
  function finishWithCustomer(cust: { name: string; email: string }, opts?: { isTemplate?: boolean }) {
    setCustomer(cust)
    setPendingAction(null)
    const gaps: string[] = []
    if (!currency) {
      setCurrency("USD")
      gaps.push("set the currency to USD")
    }
    if (selectedPlans.length === 0) {
      const p = addFirstAvailablePlan()
      gaps.push(`added the ${p.name} plan`)
    }
    const lead = opts?.isTemplate
      ? `Done — I reused the current terms for ${cust.name}.`
      : `Done — this contract is now set for ${cust.name}.`
    const extra = gaps.length
      ? ` I also ${gaps.length === 2 ? `${gaps[0]} and ${gaps[1]}` : gaps[0]}.`
      : ""
    pushAssistant(`${lead}${extra} Your draft is ready on the right — hit Start configuring whenever you want, and I'll carry our conversation into the editor so we can keep going.`)
  }

  // Decide how to respond to a free-text message.
  function respondToMessage(text: string) {
    const lower = text.toLowerCase()

    const templateIntent =
      /\b(template|duplicate|copy|reuse|same (deal|terms|contract|pricing)|generate (it|this)|create .* for|apply .* (to|for))\b/.test(
        lower,
      )
    const found = findCustomerInText(text)
    const explicitName = extractNameAfterPreposition(text)
    const startDate = extractStartDateFromText(text)

    // If a start date is mentioned and we're working from the uploaded template,
    // shift the whole schedule now so the preview updates immediately.
    if (startDate && loadDemo) {
      setSelectedPlans(buildDemoEntries(startDate))
      setDemoStartDate(startDate)
    }

    // Intent: use the current draft as a template for another customer.
    if (templateIntent || found || explicitName) {
      // Only block on an empty draft when no specific customer was named —
      // if they named someone, we confirm them and fill the plan gap after.
      if (templateIntent && selectedPlans.length === 0 && !found && !explicitName) {
        pushAssistant(
          "There's nothing to use as a template yet — add a plan or upload a document first, and then I can reuse those terms for another customer.",
        )
        return
      }
      if (found) {
        pushAssistant(
          `I found ${found.name} (${found.email}) in your customers and I'll reuse the current ${selectedPlans.length || "draft"}${
            selectedPlans.length ? ` plan${selectedPlans.length > 1 ? "s" : ""}` : ""
          } for them. Is that the right customer?`,
        )
        setPendingAction({ kind: "confirm-customer", customer: found })
        return
      }
      if (explicitName) {
        pushAssistant(
          `I couldn't find "${explicitName}" in your customer list. Want me to create a new customer named ${explicitName} and apply these terms to them?`,
        )
        setPendingAction({ kind: "confirm-new-customer", name: explicitName })
        return
      }
      pushAssistant("Sure — which customer should I generate this contract for?")
      setPendingAction({ kind: "choose-customer" })
      return
    }

    // Intent: add a plan / product, or bootstrap an empty draft.
    if (lower.includes("plan") || lower.includes("product") || lower.includes("add") || selectedPlans.length === 0) {
      if (!customer.name) setCustomer(customerOptions[0])
      if (!currency) setCurrency("USD")
      const next = addFirstAvailablePlan()
      pushAssistant(
        `Added the ${next.name} plan${!customer.name ? ` and set ${customerOptions[0].name} as the customer in USD` : ""}. Want to add anything else, or should I generate this for a specific customer?`,
      )
      return
    }

    // Fallback — nudge toward whatever is still missing.
    if (!customer.name) {
      pushAssistant("Who is this contract for? Tell me a customer name and I'll set it up.")
      setPendingAction({ kind: "choose-customer" })
      return
    }
    pushAssistant("Done — I've updated the draft on the right. Anything else you'd like to change?")
  }

  // Handle a document that was uploaded together with an instruction, e.g.
  // "use it as a template to apply it to customer Helix starting Jan 1, 2027".
  // We parse the doc into the demo template, then honor the named customer and
  // requested start date so the live preview reflects the final contract exactly.
  function handleUploadInstruction(text: string, fileName: string) {
    const found = findCustomerInText(text)
    const explicitName = found ? null : extractNameAfterPreposition(text)
    const startDate = extractStartDateFromText(text)
    const chosen = found ?? (explicitName ? { name: explicitName, email: emailForName(explicitName) } : null)

    // Re-apply the parsed template with the chosen customer + start date so the
    // order form on the right matches what the editor will open with.
    applyParsedDocument({ customer: chosen ?? undefined, startDate: startDate ?? undefined })

    // No customer was named — fall back to confirming the one we detected.
    if (!chosen) {
      const parsed = customerOptions[0]
      pushAssistant(
        `I read ${fileName} as a template — I pulled out USD, the seat ramp (30 → 50 seats), and the Launch Promo discount${
          startDate ? `, and set the term to start ${startDate}` : ""
        }. I matched the customer to ${parsed.name} (${parsed.email}) — is that correct?`,
      )
      setPendingAction({ kind: "confirm-customer", customer: parsed })
      return
    }

    const parts: string[] = [`I used ${fileName} as a template`]
    parts.push(
      found
        ? `applied it to ${chosen.name} (${chosen.email})`
        : `created a new customer, ${chosen.name}, and applied it to them`,
    )
    if (startDate) parts.push(`set the term to start ${startDate}`)
    const sentence =
      parts.length === 1
        ? parts[0]
        : `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`
    pushAssistant(
      `Done — ${sentence}. Your draft is ready on the right — hit Start configuring whenever you want, and I'll carry our conversation into the editor so we can keep going.`,
    )
  }

  function handleAgentSend() {
    const text = agentPrompt.trim()
    const fileToProcess = pendingFile
    // Allow sending with just an attached file, or just text, or both.
    if (!text && !fileToProcess) return

    // The sent message carries any attached document so it reads as part of
    // the user's turn (not lingering in the composer).
    if (text || fileToProcess) {
      setAgentMessages(prev => [
        ...prev,
        { role: "user", text, attachment: fileToProcess ?? undefined },
      ])
    }
    setAgentPrompt("")
    // A new free-text turn supersedes any pending quick-reply.
    setPendingAction(null)

    // If a document is attached, this is when we read it and update the draft.
    if (fileToProcess) {
      setPendingFile(null)
      setIsParsing(true)
      setAgentThinking(true)
      window.setTimeout(() => {
        setIsParsing(false)
        setAgentThinking(false)
        if (text) {
          // The user uploaded the doc with an instruction (e.g. "use as a
          // template for customer Helix starting Jan 1, 2027") — act on it.
          handleUploadInstruction(text, fileToProcess)
        } else {
          applyParsedDocument()
          const parsed = customerOptions[0]
          pushAssistant(
            `I read ${fileToProcess} and pulled out the currency (USD), the seat ramp (30 → 50 seats), and the Launch Promo discount. I matched the customer to ${parsed.name} (${parsed.email}) — is that correct?`,
          )
          setPendingAction({ kind: "confirm-customer", customer: parsed })
        }
      }, 1800)
      return
    }

    setAgentThinking(true)
    window.setTimeout(() => {
      respondToMessage(text)
      setAgentThinking(false)
    }, 1300)
  }

  // ---- Quick-reply handlers ---------------------------------------------------

  function handleConfirmCustomer(cust: { name: string; email: string }) {
    setAgentMessages(prev => [...prev, { role: "user", text: `Yes, ${cust.name} is correct` }])
    setPendingAction(null)
    setAgentThinking(true)
    window.setTimeout(() => {
      finishWithCustomer(cust, { isTemplate: selectedPlans.length > 0 })
      setAgentThinking(false)
    }, 900)
  }

  function handleRejectCustomer() {
    setAgentMessages(prev => [...prev, { role: "user", text: "No, use a different customer" }])
    setAgentThinking(true)
    window.setTimeout(() => {
      pushAssistant("No problem — who should I use instead?")
      setPendingAction({ kind: "choose-customer" })
      setAgentThinking(false)
    }, 700)
  }

  function handleCreateNewCustomer(name: string) {
    const email = `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`
    setAgentMessages(prev => [...prev, { role: "user", text: `Yes, create ${name}` }])
    setPendingAction(null)
    setAgentThinking(true)
    window.setTimeout(() => {
      finishWithCustomer({ name, email }, { isTemplate: selectedPlans.length > 0 })
      setAgentThinking(false)
    }, 900)
  }

  function handleChooseCustomer(cust: { name: string; email: string }) {
    setAgentMessages(prev => [...prev, { role: "user", text: cust.name }])
    setPendingAction(null)
    setAgentThinking(true)
    window.setTimeout(() => {
      finishWithCustomer(cust, { isTemplate: selectedPlans.length > 0 })
      setAgentThinking(false)
    }, 900)
  }

  function clearDocument() {
    setDocumentName(null)
    setPendingFile(null)
    setCustomer({ name: "", email: "" })
    setCurrency("")
    setDraftExpiry("")
    setSelectedPlans([])
    setLoadDemo(false)
    setDemoStartDate(undefined)
  }

  // Removing a document that hasn't been applied yet (AI mode, pre-send) should
  // only detach the file — it must not wipe the draft the user already has.
  function detachPendingFile() {
    setDocumentName(null)
    setPendingFile(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between h-14 px-5 shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onDiscard}
            className="w-7 h-7 -ml-1 flex items-center justify-center rounded-md text-[#A0A8B4] hover:bg-[#f3f4f6] hover:text-[#353A44] transition-colors"
            aria-label="Back"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h1 className="text-sm font-medium text-[#353A44]">New contract</h1>
          <span className="text-xs text-[#A0A8B4] font-medium tabular-nums">{contractId}</span>
        </div>
        <button
          onClick={onDiscard}
          className="w-7 h-7 flex items-center justify-center rounded-md text-[#A0A8B4] hover:bg-[#f3f4f6] hover:text-[#353A44] transition-colors"
          aria-label="Discard"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body — form on the left (40%), live preview on the right (60%).
          The two panes scroll independently so the preview stays put while
          the form scrolls. */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left: form */}
        <div className="w-2/5 min-w-[400px] h-full overflow-auto border-r border-[#ececf1] bg-white">
          <div className="px-8 py-10">
          {/* Mode toggle — sits above the intro so the user picks how they want
              to build before reading the lead-in copy. */}
          <div className="inline-flex items-center p-0.5 mb-5 rounded-lg bg-[#f1f2f4] border border-[#ececf1]">
            <button
              onClick={() => setMode("agent")}
              className={cn(
                "flex items-center gap-1.5 px-3 h-7 rounded-[6px] text-[13px] font-medium transition-all",
                mode === "agent"
                  ? "bg-white text-[#1A1A1A] shadow-[0_1px_2px_rgba(16,24,40,0.08)]"
                  : "text-[#596171] hover:text-[#1A1A1A]",
              )}
            >
              <Sparkles className={cn("w-3.5 h-3.5", mode === "agent" ? "text-[#533AFD]" : "text-[#A0A8B4]")} />
              Draft with AI
            </button>
            <button
              onClick={() => setMode("manual")}
              className={cn(
                "flex items-center gap-1.5 px-3 h-7 rounded-[6px] text-[13px] font-medium transition-all",
                mode === "manual"
                  ? "bg-white text-[#1A1A1A] shadow-[0_1px_2px_rgba(16,24,40,0.08)]"
                  : "text-[#596171] hover:text-[#1A1A1A]",
              )}
            >
              <Pencil className="w-3.5 h-3.5 text-[#A0A8B4]" />
              Fill out manually
            </button>
          </div>

          {/* Intro */}
          <div className="mb-7">
            <h2 className="text-[22px] font-semibold text-[#1A1A1A] tracking-[-0.02em]">
              Let&apos;s get started
            </h2>
            <p className="text-sm text-[#596171] mt-1.5 leading-relaxed">
              {mode === "agent"
                ? "Describe the deal or drop in a document and watch the contract build on the right. Switch to manual entry anytime."
                : "Fill in the basics and watch the contract take shape on the right. You can fine-tune pricing and schedules in the next step."}
            </p>
          </div>

          {/* Agent conversation — a plain chat surface (no card wrapper) so the
              left pane reads like a real chat interface. The composer + any
              attached document live in the sticky footer below. */}
          {mode === "agent" && (
            <div className="space-y-4 mb-2">
              {agentMessages.length === 0 && !agentThinking && (
                <div className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#F7F5FD] flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-[#533AFD]" />
                  </div>
                  <div className="text-sm leading-relaxed text-[#596171] rounded-lg bg-[#f5f6f8] px-3 py-2 max-w-[85%]">
                    Describe the deal, or attach a document below, and I&apos;ll start
                    building the contract on the right.
                  </div>
                </div>
              )}
              {agentMessages.map((m, i) => (
                <div key={i} className={cn("flex gap-2.5", m.role === "user" && "flex-row-reverse")}>
                  <div
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
                      m.role === "assistant" ? "bg-[#F7F5FD]" : "bg-[#353A44]",
                    )}
                  >
                    {m.role === "assistant" ? (
                      <Sparkles className="w-3.5 h-3.5 text-[#533AFD]" />
                    ) : (
                      <User className="w-3.5 h-3.5 text-white" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "text-sm leading-relaxed rounded-lg px-3 py-2 max-w-[80%]",
                      m.role === "assistant"
                        ? "bg-[#f5f6f8] text-[#353A44]"
                        : "bg-[#533AFD] text-white",
                    )}
                  >
                    {m.attachment && (
                      <div
                        className={cn(
                          "flex items-center gap-2 rounded-md px-2 py-1.5",
                          m.text && "mb-1.5",
                          m.role === "user" ? "bg-white/15" : "bg-white",
                        )}
                      >
                        <FileText className={cn("w-3.5 h-3.5 shrink-0", m.role === "user" ? "text-white" : "text-[#475569]")} />
                        <span className="text-[12px] font-medium truncate">{m.attachment}</span>
                      </div>
                    )}
                    {m.text && <div>{m.text}</div>}
                  </div>
                </div>
              ))}
              {agentThinking && (
                <div className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#F7F5FD] flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-[#533AFD]" />
                  </div>
                  <div className="flex items-center gap-1 bg-[#f5f6f8] rounded-lg px-3 py-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A0A8B4] animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A0A8B4] animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A0A8B4] animate-bounce" />
                  </div>
                </div>
              )}

              {/* Inline quick replies for whatever the assistant just asked. */}
              {pendingAction && !agentThinking && (
                <div className="flex flex-wrap gap-2 pl-9">
                  {pendingAction.kind === "confirm-customer" && (
                    <>
                      <button
                        onClick={() => handleConfirmCustomer(pendingAction.customer)}
                        className="h-8 px-3 rounded-md text-[13px] font-medium bg-[#1A1A1A] text-white hover:bg-[#353A44] transition-colors"
                      >
                        Yes, that&apos;s correct
                      </button>
                      <button
                        onClick={handleRejectCustomer}
                        className="h-8 px-3 rounded-md text-[13px] font-medium bg-white border border-[#dfe1e6] text-[#353A44] hover:bg-[#f5f6f8] transition-colors"
                      >
                        No, choose another
                      </button>
                    </>
                  )}
                  {pendingAction.kind === "confirm-new-customer" && (
                    <>
                      <button
                        onClick={() => handleCreateNewCustomer(pendingAction.name)}
                        className="h-8 px-3 rounded-md text-[13px] font-medium bg-[#1A1A1A] text-white hover:bg-[#353A44] transition-colors"
                      >
                        Yes, create {pendingAction.name}
                      </button>
                      <button
                        onClick={handleRejectCustomer}
                        className="h-8 px-3 rounded-md text-[13px] font-medium bg-white border border-[#dfe1e6] text-[#353A44] hover:bg-[#f5f6f8] transition-colors"
                      >
                        Pick an existing customer
                      </button>
                    </>
                  )}
                  {pendingAction.kind === "choose-customer" &&
                    customerOptions.map(c => (
                      <button
                        key={c.email}
                        onClick={() => handleChooseCustomer(c)}
                        className="h-8 px-3 rounded-md text-[13px] font-medium bg-white border border-[#dfe1e6] text-[#353A44] hover:border-[#533AFD] hover:text-[#533AFD] transition-colors"
                      >
                        {c.name}
                      </button>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Quick start: upload — manual mode only. In AI mode uploads happen
              from the chat composer in the footer. */}
          {mode === "manual" && (
          <div className="bg-white rounded-[10px] border border-[#ececf1] shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-5 mb-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-[#353A44]">Quick start</h3>
              <span className="text-[11px] font-medium text-[#A0A8B4]">
                Optional
              </span>
            </div>
            <p className="text-xs text-[#6c7688] mb-4 leading-relaxed">
              Upload an existing order form or signed agreement and we&apos;ll use it as a
              reference while you build the contract.
            </p>

            {isParsing ? (
              <div className="flex items-center gap-3 rounded-lg border border-[#ebeef1] bg-[#fafbfc] px-4 py-3">
                <div className="w-9 h-9 rounded-md bg-[#F7F5FD] flex items-center justify-center shrink-0">
                  <Loader2 className="w-4 h-4 text-[#533AFD] animate-spin" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[#353A44] truncate">
                    Analyzing {documentName}…
                  </div>
                  <div className="text-xs text-[#6c7688]">
                    Extracting customer, currency, and pricing lines
                  </div>
                </div>
              </div>
            ) : documentName ? (
              <div className="flex items-center gap-3 rounded-lg border border-[#ebeef1] bg-[#fafbfc] px-4 py-3">
                <div className="w-9 h-9 rounded-md bg-[#eef0f3] flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-[#475569]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[#353A44] truncate">{documentName}</div>
                  <div className="text-xs text-[#6c7688]">Attached to this contract</div>
                </div>
                <button
                  onClick={clearDocument}
                  className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#f5f6f8] text-[#A0A8B4] hover:text-[#e61947] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[#d8dee4] bg-[#fafbfc] px-4 py-7 cursor-pointer hover:border-[#353A44] hover:bg-[#f5f6f8] transition-colors">
                <div className="w-10 h-10 rounded-full bg-[#eef0f3] flex items-center justify-center">
                  <UploadCloud className="w-5 h-5 text-[#475569]" />
                </div>
                <div className="text-sm font-medium text-[#353A44]">Upload a document</div>
                <div className="text-xs text-[#6c7688]">PDF, DOCX, or images up to 10MB</div>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            )}
          </div>
          )}

          {/* Contract details + pricing — manual mode only. In AI mode the left
              pane stays a focused chat + upload surface (Gemini/v0 style) and the
              draft is reflected live in the preview on the right. */}
          {mode === "manual" && (
          <>
          {/* Contract details */}
          <div className="bg-white rounded-[10px] border border-[#ececf1] shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-5 mb-4">
            <h3 className="text-sm font-semibold text-[#353A44] mb-4">Contract details</h3>
            <div className="grid grid-cols-2 gap-4">
              {/* Customer */}
              <div className="col-span-2">
                <label className="block text-xs font-medium text-[#596171] mb-1.5">Customer</label>
                <div className="relative">
                  <select
                    value={customer.name}
                    onChange={e => {
                      const c = customerOptions.find(o => o.name === e.target.value)
                      setCustomer(c ?? { name: "", email: "" })
                    }}
                    className="w-full h-9 pl-3 pr-8 rounded-md border border-[#dfe1e6] bg-white text-sm text-[#1A1A1A] outline-none appearance-none cursor-pointer focus:border-[#533AFD] focus:ring-[3px] focus:ring-[#533AFD]/15 transition-all"
                  >
                    <option value="">Select a customer</option>
                    {customerOptions.map(c => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A0A8B4]" />
                </div>
              </div>

              {/* Currency */}
              <div>
                <label className="block text-xs font-medium text-[#596171] mb-1.5">Currency</label>
                <div className="relative">
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className="w-full h-9 pl-3 pr-8 rounded-md border border-[#dfe1e6] bg-white text-sm text-[#1A1A1A] outline-none appearance-none cursor-pointer focus:border-[#533AFD] focus:ring-[3px] focus:ring-[#533AFD]/15 transition-all"
                  >
                    <option value="">Select currency</option>
                    <option value="USD">USD — US Dollar</option>
                    <option value="EUR">EUR — Euro</option>
                    <option value="GBP">GBP — British Pound</option>
                    <option value="CAD">CAD — Canadian Dollar</option>
                    <option value="AUD">AUD — Australian Dollar</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A0A8B4]" />
                </div>
              </div>

              {/* Draft expiration */}
              <SailDatePicker
                label="Draft expiration"
                value={draftExpiry}
                onChange={setDraftExpiry}
              />
            </div>
          </div>

          {/* Pricing plans */}
          <div className="bg-white rounded-[10px] border border-[#ececf1] shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-5">
            <h3 className="text-sm font-semibold text-[#353A44] mb-1">Pricing plans</h3>
            <p className="text-xs text-[#6c7688] mb-4">
              Add one or more plans to start the contract. You can schedule overrides later.
            </p>

            {/* Selected plans */}
            {selectedPlans.length > 0 && (
              <div className="space-y-2 mb-4">
                {selectedPlans.map(entry => (
                  <div
                    key={entry.plan.id}
                    className="rounded-lg border border-[#ebeef1] bg-[#f5f6f8] p-3"
                  >
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-7 h-7 rounded-md bg-[#353A44] flex items-center justify-center shrink-0">
                        <Package className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-[#353A44] truncate">
                          {entry.plan.name}
                        </div>
                        <div className="text-xs text-[#6c7688]">
                          ${entry.plan.defaultMonthlyPrice.toLocaleString("en-US")}/mo
                        </div>
                      </div>
                      <button
                        onClick={() => togglePlan(entry.plan)}
                        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white text-[#A0A8B4] hover:text-[#e61947] transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-[1fr_auto_1fr_auto] items-end gap-2">
                      <SailDatePicker
                        label="Start"
                        value={toIso(entry.startDate)}
                        onChange={v => updatePlan(entry.plan.id, { startDate: fromIso(v) })}
                        size="sm"
                      />
                      <ArrowRight className="w-3.5 h-3.5 text-[#A0A8B4] mb-2" />
                      <SailDatePicker
                        label="End"
                        value={toIso(entry.endDate)}
                        onChange={v => updatePlan(entry.plan.id, { endDate: fromIso(v) })}
                        size="sm"
                        disableBefore={toIso(entry.startDate)}
                      />
                      <div className="w-16">
                        <label className="block text-[10px] font-medium text-[#6c7688] mb-1">Qty</label>
                        <input
                          type="number"
                          min={1}
                          value={entry.quantity}
                          onChange={e => updatePlan(entry.plan.id, { quantity: parseInt(e.target.value) || 1 })}
                          className="w-full h-8 px-2 rounded-md border border-[#d8dee4] bg-white text-xs text-[#353A44] outline-none focus:border-[#353A44]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A0A8B4]" />
              <input
                type="text"
                value={planSearch}
                onChange={e => setPlanSearch(e.target.value)}
                placeholder="Search product catalog"
                className="w-full h-9 pl-8 pr-3 rounded-md border border-[#dfe1e6] bg-white text-sm text-[#1A1A1A] placeholder:text-[#A0A8B4] outline-none focus:border-[#533AFD] focus:ring-[3px] focus:ring-[#533AFD]/15 transition-all"
              />
            </div>

            {/* New product creation */}
            {creatingProduct ? (
              <div className="mb-3 rounded-lg border border-[#533AFD] bg-[#F7F5FD] p-3">
                <div className="text-sm font-semibold text-[#353A44] mb-2">New product</div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="block text-[10px] font-medium text-[#6c7688] mb-1">Name</label>
                    <input
                      type="text"
                      value={newProductName}
                      onChange={e => setNewProductName(e.target.value)}
                      autoFocus
                      placeholder="e.g. Onboarding fee"
                      className="w-full h-8 px-2 rounded-md border border-[#d8dee4] bg-white text-xs text-[#353A44] outline-none focus:border-[#533AFD]"
                    />
                  </div>
                  <div className="w-24">
                    <label className="block text-[10px] font-medium text-[#6c7688] mb-1">Price / mo</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[#A0A8B4]">$</span>
                      <input
                        type="number"
                        value={newProductPrice}
                        onChange={e => setNewProductPrice(e.target.value)}
                        placeholder="0.00"
                        className="w-full h-8 pl-5 pr-2 rounded-md border border-[#d8dee4] bg-white text-xs text-[#353A44] outline-none focus:border-[#533AFD]"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 mt-3">
                  <button
                    onClick={() => { setCreatingProduct(false); setNewProductName(""); setNewProductPrice("") }}
                    className="px-3 py-1.5 rounded-md border border-[#d8dee4] bg-white hover:bg-[#f5f6f8] text-xs font-medium text-[#353A44]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addCustomProduct}
                    disabled={!newProductName.trim()}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-xs font-medium text-white",
                      newProductName.trim() ? "bg-[#533AFD] hover:bg-[#4730E0]" : "bg-[#C4BBF8] cursor-not-allowed",
                    )}
                  >
                    Add product
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setCreatingProduct(true)}
                className="w-full flex items-center gap-2 mb-3 px-3 h-9 rounded-lg border border-dashed border-[#C4BBF8] text-sm font-medium text-[#533AFD] hover:bg-[#F7F5FD] transition-colors"
              >
                <Plus className="w-4 h-4" />
                New product
              </button>
            )}

            {/* Catalog */}
            <div className="space-y-2">
              {unselectedPlans.map(plan => (
                <button
                  key={plan.id}
                  onClick={() => togglePlan(plan)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-[#d8dee4] bg-white hover:border-[#353A44] hover:bg-[#f5f6f8] transition-colors text-left group"
                >
                  <div className="w-8 h-8 rounded-md bg-[#f5f6f8] group-hover:bg-[#eef0f3] flex items-center justify-center shrink-0 transition-colors">
                    <Package className="w-4 h-4 text-[#6c7688] group-hover:text-[#353A44]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="text-sm font-semibold text-[#353A44] truncate">{plan.name}</div>
                      <div className="text-xs font-semibold text-[#353A44] shrink-0">
                        ${plan.defaultMonthlyPrice.toLocaleString("en-US")}
                        <span className="text-[#A0A8B4] font-normal">/mo</span>
                      </div>
                    </div>
                    <div className="text-xs text-[#6c7688] leading-relaxed mt-0.5 truncate">
                      {plan.description}
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-[#A0A8B4] group-hover:text-[#353A44] shrink-0" />
                </button>
              ))}
              {unselectedPlans.length === 0 && (
                <p className="text-sm text-[#A0A8B4] text-center py-3">
                  {planSearch ? "No plans match your search" : "All plans added"}
                </p>
              )}
            </div>
          </div>
          </>
          )}
          </div>
        </div>

        {/* Right: live contract preview */}
        <div className="w-3/5 h-full overflow-auto bg-[#fbfbfc]">
          <div className="px-10 py-10">
            <ContractPreview
              contractId={contractId}
              customer={customer}
              currency={currency}
              draftExpiry={draftExpiry}
              documentName={documentName}
              selectedPlans={selectedPlans}
            />
          </div>
        </div>
      </div>

      {/* Footer — in agent mode the composer is constrained to the form column
          (left) so the AI input sits only within the form area and never spans
          across into the preview, which stays visually separate on the right. */}
      {mode === "agent" && (
        <div className="flex shrink-0">
          <div className="w-2/5 min-w-[400px] border-t border-r border-[#ececf1] bg-white px-6 py-4">
            {/* Ready-to-configure card — lives right in the chat column so the
                primary action sits with the conversation instead of being lost
                at the far edge of the screen. */}
            {canContinue && (
              <div className="mb-3 flex items-center gap-3 rounded-lg border border-[#cdeed8] bg-[#f3faf5] px-3 py-2.5">
                <div className="w-7 h-7 rounded-full bg-[#1f9d57] flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-[#353A44]">Draft ready to configure</div>
                  <div className="text-[11px] text-[#596171] truncate">
                    {selectedPlans.length} plan{selectedPlans.length > 1 ? "s" : ""} · {customer.name} · {currency}
                  </div>
                </div>
                <button
                  onClick={() =>
                    onContinue({ contractId, customer, currency, draftExpiry, documentName, plans: selectedPlans, loadDemo, startDate: demoStartDate, conversation: mode === "agent" && agentMessages.length > 0 ? agentMessages.map(m => ({ role: m.role, text: m.text })) : undefined })
                  }
                  className="flex items-center justify-center gap-1.5 h-8 px-3 rounded-md text-[13px] font-semibold bg-[#1A1A1A] hover:bg-[#353A44] text-white transition-colors shrink-0"
                >
                  Start configuring
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {/* Attached document — pinned directly above the composer until the
                user hits send, at which point it moves into their message. */}
            {pendingFile && (
              <div className="flex items-center gap-2.5 rounded-t-lg border border-b-0 border-[#dfe1e6] bg-[#fafbfc] px-3 py-2">
                <div className="w-7 h-7 rounded-md bg-[#eef0f3] flex items-center justify-center shrink-0">
                  <FileText className="w-3.5 h-3.5 text-[#475569]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-[#353A44] truncate">{pendingFile}</div>
                  <div className="text-[11px] text-[#6c7688]">Send to add it to the draft</div>
                </div>
                <button
                  onClick={detachPendingFile}
                  className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-[#eef0f3] text-[#A0A8B4] hover:text-[#e61947] transition-colors shrink-0"
                  aria-label="Remove document"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <div
              className={cn(
                "flex items-center gap-1 border border-[#dfe1e6] bg-white px-2 py-1.5 focus-within:border-[#533AFD] focus-within:ring-[3px] focus-within:ring-[#533AFD]/15 transition-all",
                pendingFile ? "rounded-b-lg" : "rounded-lg",
              )}
            >
              <label
                className="w-8 h-8 flex items-center justify-center rounded-md text-[#A0A8B4] hover:bg-[#f3f4f6] hover:text-[#353A44] transition-colors cursor-pointer shrink-0"
                aria-label="Attach document"
              >
                <Paperclip className="w-4 h-4" />
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
              <input
                type="text"
                value={agentPrompt}
                onChange={e => setAgentPrompt(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleAgentSend()
                  }
                }}
                placeholder={
                  agentMessages.length === 0
                    ? "Describe the deal, e.g. “Annual contract for Acme on the Growth plan, 25 units”"
                    : "Ask the assistant to adjust the draft…"
                }
                className="flex-1 h-8 bg-transparent text-sm text-[#1A1A1A] placeholder:text-[#A0A8B4] outline-none"
              />
              <button
                onClick={handleAgentSend}
                disabled={(!agentPrompt.trim() && !pendingFile) || agentThinking}
                className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-md transition-colors shrink-0",
                  (agentPrompt.trim() || pendingFile) && !agentThinking
                    ? "bg-[#533AFD] hover:bg-[#4730E0] text-white"
                    : "bg-[#f1f2f4] text-[#A0A8B4] cursor-not-allowed",
                )}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          {/* Preview side — kept separate, no input bar here. */}
          <div className="flex-1 border-t border-[#ececf1] bg-[#fbfbfc]" />
        </div>
      )}
      {mode === "manual" && (
        <div className="border-t border-[#ececf1] bg-white px-6 py-4 shrink-0">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-[#596171]">
              {canContinue
                ? `${selectedPlans.length} plan${selectedPlans.length > 1 ? "s" : ""} · ${customer.name} · ${currency}`
                : "Add a customer, currency, and at least one plan to continue"}
            </p>
            <button
              onClick={() =>
                canContinue &&
                onContinue({ contractId, customer, currency, draftExpiry, documentName, plans: selectedPlans, loadDemo, startDate: demoStartDate })
              }
              disabled={!canContinue}
              className={cn(
                "flex items-center justify-center gap-1.5 h-9 px-4 rounded-lg text-[13px] font-semibold transition-colors",
                canContinue
                  ? "bg-[#1A1A1A] hover:bg-[#353A44] text-white cursor-pointer shadow-[0_1px_2px_rgba(16,24,40,0.12)]"
                  : "bg-[#e7e9ee] text-[#b4b9c4] cursor-not-allowed",
              )}
            >
              Start configuring
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// CONFIRM SAVE MODAL
// =============================================================================
type ContractWarning = { level: "warning" | "error"; message: string }

// Validate the contract for issues worth surfacing before save. Warnings are
// non-blocking nudges; errors should block confirmation.
function validateContract(
  selectedPlans: SelectedPlanEntry[],
  customer: { name: string; email: string } | null,
  currency: string,
): ContractWarning[] {
  const out: ContractWarning[] = []
  if (!selectedPlans.length) out.push({ level: "error", message: "No pricing lines have been added to this contract." })
  if (!customer?.name?.trim()) out.push({ level: "error", message: "No customer is assigned to this contract." })
  if (!currency?.trim()) out.push({ level: "error", message: "No billing currency is set." })

  selectedPlans.forEach(p => {
    const planStart = new Date(p.startDate).getTime()
    const planEnd = new Date(p.endDate).getTime()
    const name = p.plan.name

    if (p.plan.defaultMonthlyPrice <= 0) {
      out.push({ level: "warning", message: `"${name}" has a $0 base price.` })
    }
    if (p.quantity <= 0) {
      out.push({ level: "warning", message: `"${name}" has a quantity of 0.` })
    }

    // Price overrides: out-of-term windows, $0 prices, and overlaps.
    const sortedOverrides = [...p.priceOverrides]
      .map(o => ({ ...o, s: new Date(o.startDate).getTime(), e: new Date(o.endDate).getTime() }))
      .sort((a, b) => a.s - b.s)
    sortedOverrides.forEach((o, i) => {
      if (o.s < planStart || o.e > planEnd) {
        out.push({ level: "warning", message: `"${name}" has a price override outside the plan term.` })
      }
      if (parsePriceValue(o.price) <= 0) {
        out.push({ level: "warning", message: `"${name}" has a $0 scheduled price override.` })
      }
      const next = sortedOverrides[i + 1]
      if (next && o.e > next.s) {
        out.push({ level: "warning", message: `"${name}" has overlapping price override windows.` })
      }
    })

    // Quantity updates: out-of-term effective dates and zero seats.
    p.quantityUpdates.forEach(q => {
      const t = new Date(q.effectiveDate).getTime()
      if (t < planStart || t > planEnd) {
        out.push({ level: "warning", message: `"${name}" has a quantity update outside the plan term.` })
      }
      if (q.quantity <= 0) {
        out.push({ level: "warning", message: `"${name}" has a quantity update setting units to 0.` })
      }
    })
  })

  return out
}

function ConfirmSaveModal({
  contractId,
  customer,
  currency,
  selectedPlans,
  onClose,
  onConfirm,
}: {
  contractId: string
  customer: { name: string; email: string } | null
  currency: string
  selectedPlans: SelectedPlanEntry[]
  onClose: () => void
  onConfirm: () => void
}) {
  const warnings = validateContract(selectedPlans, customer, currency)
  const errors = warnings.filter(w => w.level === "error")
  const advisories = warnings.filter(w => w.level === "warning")

  // Recurring monthly total at contract start and a rough annualized value.
  const startMrr = selectedPlans.reduce((sum, p) => {
    const start = new Date(p.startDate)
    return sum + lineStateAt(p, start).mrr
  }, 0)
  const acv = startMrr * 12

  // Flatten every scheduled change with its step-over-step MRR delta.
  const changes = selectedPlans
    .flatMap(p => [
      ...p.priceOverrides.map(o => ({
        plan: p.plan.name,
        kind: "Price override",
        date: new Date(o.startDate),
        detail: `$${parsePriceValue(o.price).toFixed(2)}/mo`,
        delta: lineStateAt(p, new Date(o.startDate)).mrr - lineStateAt(p, new Date(new Date(o.startDate).getTime() - 86400000)).mrr,
      })),
      ...p.quantityUpdates.map(q => ({
        plan: p.plan.name,
        kind: "Quantity update",
        date: new Date(q.effectiveDate),
              detail: `${q.quantity} units`,
        delta: lineStateAt(p, new Date(q.effectiveDate)).mrr - lineStateAt(p, new Date(new Date(q.effectiveDate).getTime() - 86400000)).mrr,
      })),
    ])
    .filter(c => !isNaN(c.date.getTime()))
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[85vh] flex flex-col rounded-xl bg-white shadow-xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-[#353A44]">Review &amp; save contract</h2>
            <p className="text-xs text-[#6c7688] mt-0.5">{contractId}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-md text-[#6c7688] hover:bg-[#f5f6f8]"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto px-5 py-4">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-lg border border-[#ebeef1] p-3">
              <div className="text-[10px] text-[#A0A8B4] font-semibold">Customer</div>
              <div className="text-sm font-medium text-[#353A44] mt-1 truncate">
                {customer?.name || <span className="text-[#e61947]">Not assigned</span>}
              </div>
            </div>
            <div className="rounded-lg border border-[#ebeef1] p-3">
              <div className="text-[10px] text-[#A0A8B4] font-semibold">Currency</div>
              <div className="text-sm font-medium text-[#353A44] mt-1">{currency || "—"}</div>
            </div>
            <div className="rounded-lg border border-[#ebeef1] p-3">
              <div className="text-[10px] text-[#A0A8B4] font-semibold">Recurring</div>
              <div className="text-sm font-medium text-[#353A44] mt-1">{fmtMoney(startMrr, currency)}/mo</div>
            </div>
            <div className="rounded-lg border border-[#ebeef1] p-3">
              <div className="text-[10px] text-[#A0A8B4] font-semibold">Est. annual (ACV)</div>
              <div className="text-sm font-medium text-[#353A44] mt-1">{fmtMoney(acv, currency)}</div>
            </div>
          </div>

          {/* Lines */}
          <div className="mb-4">
            <div className="text-[10px] text-[#A0A8B4] font-semibold mb-2">
              Pricing lines ({selectedPlans.length})
            </div>
            <div className="space-y-1.5">
              {selectedPlans.map(p => (
                <div key={p.plan.id} className="flex items-center justify-between text-sm">
                  <span className="text-[#353A44] truncate">{p.plan.name}</span>
                  <span className="text-[#6c7688] shrink-0 ml-3">
                    {p.quantity} × ${p.plan.defaultMonthlyPrice.toFixed(0)}/mo
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Scheduled changes */}
          {changes.length > 0 && (
            <div className="mb-4">
              <div className="text-[10px] text-[#A0A8B4] font-semibold mb-2">
                Scheduled changes ({changes.length})
              </div>
              <div className="space-y-1.5">
                {changes.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="min-w-0">
                      <span className="text-[#353A44]">{c.plan}</span>
                      <span className="text-[#A0A8B4]"> · {c.kind} · {c.detail}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span className="text-[#6c7688]">{formatDateShort(c.date)}</span>
                      {Math.abs(c.delta) >= 0.5 && (
                        <span className={cn("font-medium", c.delta > 0 ? "text-[#2b8700]" : "text-[#e61947]")}>
                          {c.delta > 0 ? "+" : "−"}{fmtMoney(Math.abs(c.delta))}/mo
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="rounded-lg border border-[#ffe0b3] bg-[#fff8ef] p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-3.5 h-3.5 text-[#a85b00]" />
                <span className="text-xs font-semibold text-[#a85b00]">
                  {errors.length > 0 ? "Issues to resolve" : "Before you save"}
                </span>
              </div>
              <ul className="space-y-1">
                {[...errors, ...advisories].map((w, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs">
                    <span className={cn("mt-1 w-1 h-1 rounded-full shrink-0", w.level === "error" ? "bg-[#e61947]" : "bg-[#a85b00]")} />
                    <span className={w.level === "error" ? "text-[#e61947]" : "text-[#7a4a08]"}>{w.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-[#ebeef1] shrink-0">
          <span className="text-xs text-[#A0A8B4]">
            {errors.length > 0
              ? "Resolve the issues above to continue."
              : advisories.length > 0
                ? "Warnings won't block saving."
                : "Everything looks good."}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-md border border-[#d8dee4] bg-white hover:bg-[#f5f6f8] text-sm font-medium text-[#353A44]"
            >
              Back to editing
            </button>
            <button
              onClick={onConfirm}
              disabled={errors.length > 0}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium text-white",
                errors.length > 0 ? "bg-[#C4BBF8] cursor-not-allowed" : "bg-[#533AFD] hover:bg-[#4730E0]",
              )}
            >
              Confirm &amp; save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// MAIN V4 WIZARD COMPONENT
// =============================================================================
// An existing contract handed to the wizard so the editor opens pre-populated
// (used by the "Edit" action on the contract detail page). When present, the
// wizard skips the get-started screen and lands straight in the editor.
export interface V4EditableContract {
  id: string
  customer: { name: string; email: string }
  currency: string
  draftExpiry: string
  billingMethod?: "auto" | "manual"
  planLines: V4PlanLine[]
}

// Demo contract used to showcase the V4 editor. Mirrors the sample order form:
// Enterprise Seats at a $200 sticker price with a $165 contracted rate applied
// as a price override for the full term, a 20% "Launch Promo" for Q1, and a seat
// increase (30 → 50) on Jul 1, plus a flat Edge Storage line.
// Term: Jan 1 – Dec 31, 2027.
export const demoV4Contract: V4EditableContract = {
  id: "C-2027-001",
  customer: { name: "Bailey Williams", email: "bailey@example.com" },
  currency: "USD",
  draftExpiry: "",
  billingMethod: "manual",
  planLines: [
    {
      id: "enterprise-seats",
      name: "Enterprise Seats",
      monthlyPrice: 200,
      quantity: 30,
      startDate: "Jan 1, 2027",
      endDate: "Dec 31, 2027",
      priceOverrides: [
        { id: "po-ent-contracted", startDate: "Jan 1, 2027", endDate: "Dec 31, 2027", price: "165" },
      ],
      quantityUpdates: [{ id: "qu-ent-1", effectiveDate: "Jul 1, 2027", quantity: 50 }],
      discounts: [
        {
          id: "disc-launch-promo",
          name: "Launch Promo",
          percentage: 20,
          startDate: "Jan 1, 2027",
          endDate: "Mar 31, 2027",
          scope: "specific",
          appliedItemIds: ["enterprise-seats"],
        },
      ],
    },
    {
      id: "edge-storage",
      name: "Edge Storage Units",
      monthlyPrice: 150,
      quantity: 10,
      startDate: "Jan 1, 2027",
      endDate: "Dec 31, 2027",
      priceOverrides: [],
      quantityUpdates: [],
      discounts: [],
    },
  ],
}

// Map a stored plan line back into the editor's richer SelectedPlanEntry shape,
// resolving the catalog template by id (falling back to a synthetic template so
// custom/one-off products still load).
function planLineToEntry(line: V4PlanLine): SelectedPlanEntry {
  const template: PlanTemplate =
    planCatalog.find(p => p.id === line.id) ?? {
      id: line.id,
      name: line.name,
      description: "",
      defaultMonthlyPrice: line.monthlyPrice,
      lines: [],
    }
  return {
    plan: { ...template, name: line.name, defaultMonthlyPrice: line.monthlyPrice },
    startDate: line.startDate,
    endDate: line.endDate,
    quantity: line.quantity,
    priceOverrides: line.priceOverrides.map(o => ({ ...o })),
    quantityUpdates: line.quantityUpdates.map(q => ({ ...q })),
    discounts: (line.discounts ?? []).map(d => ({ ...d })),
  }
}

// Shift a display date string by a number of days, preserving the display format.
function shiftDateStr(dateStr: string, offsetDays: number): string {
  if (offsetDays === 0) return dateStr
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  d.setDate(d.getDate() + offsetDays)
  return formatDateValue(d)
}

// Deep-clone a plan entry so editing the editor's copy never mutates config.
function clonePlanEntry(p: SelectedPlanEntry): SelectedPlanEntry {
  return {
    ...p,
    priceOverrides: (p.priceOverrides ?? []).map(o => ({ ...o })),
    quantityUpdates: (p.quantityUpdates ?? []).map(q => ({ ...q })),
    discounts: (p.discounts ?? []).map(d => ({ ...d })),
  }
}

// Build the full canonical demo plan entries (Enterprise Seats + Edge Storage,
// with the seat ramp and Launch Promo intact). When a startDate is given, the
// whole schedule is shifted so the term begins on that date — every line,
// override, quantity update, and discount moves by the same offset. This is what
// both the get-started live preview AND the editor render, so they always match.
function buildDemoEntries(startDate?: string): SelectedPlanEntry[] {
  const base = demoV4Contract.planLines.map(planLineToEntry)
  if (!startDate) return base
  const demoStart = new Date(demoV4Contract.planLines[0].startDate)
  const target = new Date(startDate)
  if (isNaN(demoStart.getTime()) || isNaN(target.getTime())) return base
  const offsetDays = Math.round((target.getTime() - demoStart.getTime()) / 86400000)
  if (offsetDays === 0) return base
  return base.map(e => ({
    ...e,
    startDate: shiftDateStr(e.startDate, offsetDays),
    endDate: shiftDateStr(e.endDate, offsetDays),
    priceOverrides: e.priceOverrides.map(o => ({
      ...o,
      startDate: shiftDateStr(o.startDate, offsetDays),
      endDate: shiftDateStr(o.endDate, offsetDays),
    })),
    quantityUpdates: e.quantityUpdates.map(q => ({
      ...q,
      effectiveDate: shiftDateStr(q.effectiveDate, offsetDays),
    })),
    discounts: e.discounts.map(d => ({
      ...d,
      startDate: shiftDateStr(d.startDate, offsetDays),
      endDate: shiftDateStr(d.endDate, offsetDays),
    })),
  }))
}

// Pull a contract start date out of a free-text instruction, e.g.
// "starting Jan 1, 2027", "from January 1 2027", or "beginning 1/1/2027".
function extractStartDateFromText(text: string): string | null {
  const monthRe =
    /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2}(?:st|nd|rd|th)?(?:,)?\s+\d{4}\b/i
  const numRe = /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/
  const m = text.match(monthRe) || text.match(numRe)
  if (!m) return null
  const cleaned = m[0].replace(/(\d{1,2})(?:st|nd|rd|th)/i, "$1")
  const d = new Date(cleaned)
  if (isNaN(d.getTime())) return null
  return formatDateValue(d)
}

// Synthesize an email for a brand-new customer named in conversation.
function emailForName(name: string): string {
  return `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`
}

// Parse a date like "Dec 31, 2028" or "12/31/2028" out of free text, returning
// it in the app's display format (e.g. "Dec 31, 2028") or null when none found.
function parseDateFromText(text: string): string | null {
  const monthRe =
    /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2}(?:st|nd|rd|th)?(?:,)?\s+\d{4}\b/i
  const numRe = /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/
  const m = text.match(monthRe) || text.match(numRe)
  if (!m) return null
  const cleaned = m[0].replace(/(\d{1,2})(?:st|nd|rd|th)/i, "$1")
  const d = new Date(cleaned)
  if (isNaN(d.getTime())) return null
  return formatDateValue(d)
}

// =============================================================================
// EDITOR ASSISTANT
// =============================================================================
// Lives in the editor's bottom bar (within the form column only) and turns
// natural-language requests into the SAME mutations the tree/form already
// expose — extend duration, add/override price, change quantity — then posts a
// short confirmation and focuses the affected node. No new workflows.
interface EditorAssistantMessage {
  role: "user" | "assistant"
  text: string
}

// Returned by the deterministic parser when it doesn't recognize a request.
// The assistant detects this exact value to decide when to fall through to the
// AI model for free-form language understanding.
const ASSISTANT_GENERIC_FALLBACK =
  "I can make the same edits as the form. Try: “set customer to Acme Corp”, “start Enterprise Seats on Jan 1, 2027”, “extend all products to Dec 31, 2028”, “add a 15% discount to Edge Storage”, “set Edge Storage to $120”, or “set Enterprise Seats to 50 units”."

interface EditorAssistantProps {
  selectedPlans: SelectedPlanEntry[]
  // The currently focused tree node, so the assistant can infer which product a
  // request targets when none is named �� exactly like the form, which always
  // acts on the selected node's plan.
  selectedNodeId: string
  // Current contract-level values, so the assistant can read back state and run
  // the same validations the forms do (e.g. draft-expiry vs. term start).
  customer: { name: string; email: string } | null
  currency: string
  draftExpiry: string
  onSelectNode: (id: string) => void
  onUpdatePlan: (planId: string, updates: Partial<SelectedPlanEntry>) => void
  onApplyEndDateToAll: (endDate: string) => void
  onApplyStartDateToAll: (startDate: string) => void
  onAddPriceOverride: (planId: string, override: PriceOverride) => void
  onAddQuantityUpdate: (planId: string, update: QuantityUpdate) => void
  onAddDiscount: (planId: string, discount: Discount) => void
  onUpdateDiscount: (planId: string, discountId: string, updates: Partial<Discount>) => void
  onRemoveDiscount: (planId: string, discountId: string) => void
  onAddPlan: (plan: PlanTemplate) => void
  onRemovePlan: (planId: string) => void
  onUpdateCustomer: (customer: { name: string; email: string }) => void
  onUpdateCurrency: (currency: string) => void
  onUpdateDraftExpiry: (value: string) => void
  initialMessages?: EditorAssistantMessage[]
}

function EditorAssistant({
  selectedPlans,
  selectedNodeId,
  customer,
  currency,
  draftExpiry,
  onSelectNode,
  onUpdatePlan,
  onApplyEndDateToAll,
  onApplyStartDateToAll,
  onAddPriceOverride,
  onAddQuantityUpdate,
  onAddDiscount,
  onUpdateDiscount,
  onRemoveDiscount,
  onAddPlan,
  onRemovePlan,
  onUpdateCustomer,
  onUpdateCurrency,
  onUpdateDraftExpiry,
  initialMessages,
}: EditorAssistantProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<EditorAssistantMessage[]>(
    initialMessages ?? [{ role: "assistant", text: "Hi! I can help you configure this contract. Try: \"set customer to Acme Corp\", \"add Enterprise Seats\", or \"add a 10% discount\"." }]
  )
  const [prompt, setPrompt] = useState("")
  // True while the AI model is translating a free-form request to commands.
  const [thinking, setThinking] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, open, thinking])

  // Match a product the user explicitly named, ignoring short words so partial
  // references like "edge storage" or "enterprise" still resolve.
  function findNamedPlan(text: string): SelectedPlanEntry | null {
    const lower = text.toLowerCase()
    const exact = selectedPlans.find(p => lower.includes(p.plan.name.toLowerCase()))
    if (exact) return exact
    return (
      selectedPlans.find(p => {
        const words = p.plan.name.toLowerCase().split(/\s+/).filter(w => w.length > 3)
        return words.some(w => lower.includes(w))
      }) ?? null
    )
  }

  // Match a catalog product the user named that isn't already on the contract,
  // so "add Enterprise Seats" resolves to the same template the Add menu uses.
  function catalogMatch(text: string): PlanTemplate | null {
    const lower = text.toLowerCase()
    const taken = new Set(selectedPlans.map(p => p.plan.id))
    const available = planCatalog.filter(p => !taken.has(p.id))
    // Prefer the longest name match so "Enterprise Seats" beats "Enterprise".
    return (
      available
        .filter(p => lower.includes(p.name.toLowerCase()))
        .sort((a, b) => b.name.length - a.name.length)[0] ?? null
    )
  }

  // The plan implied by the currently focused tree node (price line, override,
  // quantity update, discount, or the product itself).
  function planFromSelection(): SelectedPlanEntry | null {
    return (
      selectedPlans.find(
        p => selectedNodeId === `plan-${p.plan.id}` || selectedNodeId.startsWith(`plan-${p.plan.id}-`),
      ) ??
      selectedPlans.find(p => selectedNodeId.startsWith(`discount-${p.plan.id}-`)) ??
      null
    )
  }

  // Resolve the target product the way the form does: an explicitly named plan
  // wins; otherwise fall back to the selected node's plan, or the only plan.
  function findPlan(text: string): SelectedPlanEntry | null {
    return findNamedPlan(text) ?? planFromSelection() ?? (selectedPlans.length === 1 ? selectedPlans[0] : null)
  }

  // Find the discount the user is referring to: prefer one on the named plan,
  // otherwise the first discount anywhere. Returns the owning plan + discount.
  function findDiscount(plan: SelectedPlanEntry | null): { entry: SelectedPlanEntry; discount: Discount } | null {
    if (plan && plan.discounts.length > 0) return { entry: plan, discount: plan.discounts[0] }
    for (const p of selectedPlans) {
      if (p.discounts.length > 0) return { entry: p, discount: p.discounts[0] }
    }
    return null
  }

  // Translate a message into an editor mutation and return a confirmation line.
  // Every branch calls the SAME handlers the tree/forms use, so the tree nav,
  // timeline preview, and form sections all stay in sync, and focuses the
  // affected node so its form opens — exactly as a manual edit would.
  function runIntent(text: string): string {
    const plan = findPlan(text)
    const lowerFull = text.toLowerCase()
    // Strip the matched product name so its own words (e.g. "Seats") don't
    // trip the seat/price keyword detection below.
    const lower = plan ? lowerFull.split(plan.plan.name.toLowerCase()).join(" ") : lowerFull
    const date = parseDateFromText(text)
    const appliesToAll =
      /\bto all\b/.test(lower) ||
      (/\b(all|every|each|both)\b/.test(lower) && /\b(product|plan|item|line)s?\b/.test(lower))
    const wantsRemove = /\b(remove|delete|drop|cancel|get rid of)\b/.test(lower)
    const percentMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:%|percent)/)
    const wantsAdd = /\b(add|include|create|new|put|attach)\b/.test(lowerFull)
    // Detect when an "add" request actually targets a discount/override/ramp or
    // a quantity change (e.g. "add 10 seats") rather than a new product line.
    // Product names themselves can contain words like "Units"/"Seats", so we
    // only treat a number+unit phrase (or an explicit discount/override/ramp)
    // as a sub-entity — not the bare noun.
    const numberQty = /\b\d+\s*(seats?|units?|licenses?|qty)\b/.test(lower)
    const subEntity = /\b(discount|override|ramp)\b/.test(lower) || numberQty || !!percentMatch

    // Intent: add a product/plan line. Mirrors the tree's "Add product" menu —
    // matches a catalog plan by name, or creates a custom plan with an optional
    // price. Excluded when the request targets a discount/override/ramp instead.
    if (wantsAdd && (/\b(product|plan|line|item|subscription)\b/.test(lowerFull) || catalogMatch(text)) && !subEntity) {
      const fromCatalog = catalogMatch(text)
      if (fromCatalog) {
        onAddPlan(fromCatalog)
        return `Added ${fromCatalog.name} to the contract.`
      }
      // Create a custom product from a quoted/explicit name + optional price.
      const nameMatch =
        text.match(/["“']([^"”']+)["”']/) ||
        text.match(/(?:product|plan|line|item)\s+(?:called|named|for)?\s*([A-Z][\w'’.&\- ]{1,40})/)
      const priceMatch = text.match(/\$\s?(\d+(?:\.\d{1,2})?)/)
      const name = nameMatch?.[1]?.trim()
      if (!name) {
        return "What product should I add? Name one from the catalog (e.g. “add Enterprise Seats”) or give a custom name and price (e.g. “add product \u201cOnboarding\u201d at $500”)."
      }
      const price = priceMatch ? parseFloat(priceMatch[1]) : 0
      const custom = makeCustomPlan(name, price)
      onAddPlan(custom)
      return `Added ${name} ($${price.toFixed(2)}/mo) to the contract.`
    }

    // Intent: change the customer (contract-level). Mirrors the customer field.
    if (/\b(customer|client|account|buyer|bill to|sold to)\b/.test(lower)) {
      const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)
      const nameMatch = text.match(
        /(?:customer|client|account|buyer)\s+(?:to|is|=|:|name)?\s*([A-Z][\w'’.&-]+(?:\s+[A-Z][\w'’.&-]+){0,3})/,
      )
      const name = nameMatch?.[1]?.trim()
      if (!name && !emailMatch) {
        return "Who's the customer? Try “set customer to Acme Corp” (optionally with an email)."
      }
      const finalName = name ?? customer?.name ?? "New customer"
      const finalEmail = emailMatch?.[0] ?? (name ? emailForName(name) : customer?.email ?? emailForName(finalName))
      onUpdateCustomer({ name: finalName, email: finalEmail })
      onSelectNode("contract-root")
      return `Set the customer to ${finalName} (${finalEmail}).`
    }

    // Intent: change the contract currency. Mirrors the currency dropdown.
    {
      const curMatch = lower.match(/\b(usd|eur|gbp|cad|aud)\b/)
      if (curMatch && (/\bcurrency\b/.test(lower) || /\b(set|change|switch|use|make)\b/.test(lower))) {
        const cur = curMatch[1].toUpperCase()
        onUpdateCurrency(cur)
        onSelectNode("contract-root")
        return `Set the contract currency to ${cur}.`
      }
    }

    // Intent: set the draft expiration. Mirrors the field's guardrail — it must
    // fall before the contract term starts, so we clamp anything on/after it.
    if (/\b(draft )?(expiration|expiry|expires?)\b/.test(lower)) {
      if (!date) return "What draft expiration date should I use? For example: “set draft expiration to Aug 1, 2026”."
      const iso = toIso(date)
      const termStartIso = earliestTermStartIso(selectedPlans)
      if (termStartIso && iso >= termStartIso) {
        const clamped = isoAddDays(termStartIso, -1)
        onUpdateDraftExpiry(clamped)
        onSelectNode("contract-root")
        return `That's on/after the term start, so I set the draft expiration to ${formatDateShort(new Date(clamped + "T00:00:00"))} — the latest allowed (the day before the term begins).`
      }
      onUpdateDraftExpiry(iso)
      onSelectNode("contract-root")
      return `Set the draft expiration to ${formatDateShort(new Date(iso + "T00:00:00"))}.`
    }

    // Intent: remove a product line entirely. Mirrors the form's Remove button.
    if (wantsRemove && plan && /\b(product|plan|line|item)\b/.test(lower) && !/\bdiscount\b/.test(lower)) {
      onRemovePlan(plan.plan.id)
      return `Removed ${plan.plan.name} from the contract.`
    }

    // Intent: remove a discount. Mirrors the discount form's Remove button.
    if (wantsRemove && /\bdiscount\b/.test(lower)) {
      const found = findDiscount(plan)
      if (!found) return "There aren't any discounts to remove yet."
      onRemoveDiscount(found.entry.plan.id, found.discount.id)
      return `Removed the ${found.discount.percentage}% discount from ${found.entry.plan.name}.`
    }

    // Intent: add or update a discount. Mirrors the discount form + Add menu.
    if (/\bdiscount\b/.test(lower) || (percentMatch && /\b(discount|off)\b/.test(lower))) {
      const wantsAdd = /\b(add|create|new|apply|give|put)\b/.test(lower)
      const existing = findDiscount(plan)
      // Update an existing discount's percentage when not explicitly adding.
      if (percentMatch && existing && !wantsAdd) {
        const pct = parseFloat(percentMatch[1])
        onUpdateDiscount(existing.entry.plan.id, existing.discount.id, { percentage: pct })
        onSelectNode(`discount-${existing.entry.plan.id}-${existing.discount.id}`)
        return `Set the discount on ${existing.entry.plan.name} to ${pct}%.`
      }
      // Otherwise create a new discount on the named plan (or the first plan).
      const target = plan ?? selectedPlans[0]
      if (!target) return "Add a product first, then I can attach a discount."
      const pct = percentMatch ? parseFloat(percentMatch[1]) : 10
      const discount: Discount = {
        id: `discount-${Date.now()}`,
        name: "",
        percentage: pct,
        startDate: target.startDate,
        endDate: target.endDate,
        scope: "everything",
        appliedItemIds: [],
      }
      onAddDiscount(target.plan.id, discount)
      onSelectNode(`discount-${target.plan.id}-${discount.id}`)
      return `Added a ${pct}% discount to ${target.plan.name}.`
    }

    // Intent: change the start date (duration). Mirrors the Start date field and
    // its "apply to all products" prompt when "to all" is requested.
    if (/\b(start|starts|begin|begins|commence|effective)\b/.test(lower) && !/\bend\b/.test(lower)) {
      if (!date) return "What start date should I use? For example: “start Enterprise Seats on Jan 1, 2027”."
      if (appliesToAll && selectedPlans.length > 0) {
        onApplyStartDateToAll(date)
        onSelectNode(`plan-${selectedPlans[0].plan.id}-price`)
        return `Set all ${selectedPlans.length} products to start ${date}.`
      }
      if (plan) {
        onUpdatePlan(plan.plan.id, { startDate: date })
        onSelectNode(`plan-${plan.plan.id}-price`)
        return `Set ${plan.plan.name} to start ${date}.`
      }
      return "Which product should start then? Try “start Enterprise Seats on Jan 1, 2027”."
    }

    // Intent: extend / change the end date (duration).
    if (/\b(extend|end date|ends?|expire|expires|duration|term|until|through|run to)\b/.test(lower)) {
      if (!date) {
        return "What end date should I use? For example: “extend Enterprise Seats to Dec 31, 2028”."
      }
      if (appliesToAll && selectedPlans.length > 0) {
        onApplyEndDateToAll(date)
        onSelectNode(`plan-${selectedPlans[0].plan.id}-price`)
        return `Extended all ${selectedPlans.length} products to ${date}.`
      }
      if (plan) {
        onUpdatePlan(plan.plan.id, { endDate: date })
        onSelectNode(`plan-${plan.plan.id}-price`)
        return `Extended ${plan.plan.name} to ${date}.`
      }
      return "Which product should I extend? Try “extend Enterprise Seats to Dec 31, 2028”."
    }

    const priceMatch = lower.match(/\$\s?(\d+(?:\.\d{1,2})?)|(\d+(?:\.\d{1,2})?)\s*(?:\/mo|per month|dollars?)/)
    const hasPriceKeyword = /\bprice\b|\brate\b|\bcharge\b|\$/.test(lower)

    // Intent: set a price — applied as a price override across the full term.
    if (hasPriceKeyword && /\b(set|change|make|override|update|reduce|lower|raise)\b/.test(lower) && priceMatch) {
      if (!plan) return "Which product's price should I change? Try “set Edge Storage to $120”."
      const amount = parseFloat(priceMatch[1] ?? priceMatch[2])
      const override: PriceOverride = {
        id: generateId(),
        startDate: plan.startDate,
        endDate: plan.endDate,
        price: amount.toFixed(2),
      }
      onAddPriceOverride(plan.plan.id, override)
      onSelectNode(`plan-${plan.plan.id}-override-${override.id}`)
      const sticker = plan.plan.defaultMonthlyPrice
      const delta = amount - sticker
      const diff =
        delta === 0
          ? ""
          : ` (${delta < 0 ? "−" : "+"}$${Math.abs(delta).toFixed(2)}/mo vs sticker $${sticker.toFixed(2)})`
      return `Set ${plan.plan.name} to $${amount.toFixed(2)}/mo for the full term${diff}.`
    }

    // Intent: add a price override with smart defaults.
    if (/\b(price )?override\b/.test(lower) && /\b(add|create|new|schedule)\b/.test(lower)) {
      if (!plan) return "Which product needs a price override? Try “add a price override to Enterprise Seats”."
      const override = smartPriceOverride(plan)
      onAddPriceOverride(plan.plan.id, override)
      onSelectNode(`plan-${plan.plan.id}-override-${override.id}`)
      return `Added a price override to ${plan.plan.name} starting ${override.startDate} at $${override.price}/mo.`
    }

    const numMatch = lower.match(/\b(\d+)\b/)
    const hasQtyKeyword = /\b(seat|seats|unit|units|license|licenses|quantity|qty)\b/.test(lower)

    // Intent: add a quantity update (seat ramp) with smart defaults.
    if (/\b(quantity update|quantity change|seat change|seat ramp|ramp)\b/.test(lower)) {
      if (!plan) return "Which product needs a quantity update? Try “add a quantity update to Enterprise Seats”."
      const update = smartQuantityUpdate(plan)
      onAddQuantityUpdate(plan.plan.id, update)
      onSelectNode(`plan-${plan.plan.id}-qty-${update.id}`)
      return `Added a quantity update to ${plan.plan.name} effective ${update.effectiveDate}.`
    }

    // Intent: change the base quantity / number of seats. Focuses the price line
    // — the same node clicking the base seats bar in the timeline focuses.
    if (hasQtyKeyword && /\b(set|change|make|update|to|=)\b/.test(lower) && numMatch && !hasPriceKeyword) {
      if (!plan) return "Which product's quantity should I change? Try “set Enterprise Seats to 50 units”."
      const qty = parseInt(numMatch[1], 10)
      onUpdatePlan(plan.plan.id, { quantity: qty })
      onSelectNode(`plan-${plan.plan.id}-price`)
      return `Set ${plan.plan.name} to ${qty} ${qty === 1 ? "unit" : "units"}.`
    }

    // Intent: focus / show a product's price (or its base seats).
    if (plan && /\b(show|open|focus|go to|jump to|view|see|select|price|pricing|seats?)\b/.test(lower)) {
      onSelectNode(`plan-${plan.plan.id}-price`)
      return `Focused ${plan.plan.name}'s pricing line.`
    }

    // Intent: focus a product's detail form.
    if (plan && /\b(show|open|focus|go to|jump to|view|see|select|product|details?)\b/.test(lower)) {
      onSelectNode(`plan-${plan.plan.id}`)
      return `Focused ${plan.plan.name}.`
    }

    return ASSISTANT_GENERIC_FALLBACK
  }

  // Build the contract snapshot the AI model needs to resolve exact product
  // names and honor current state when translating a free-form request.
  function buildContext() {
    const taken = new Set(selectedPlans.map(p => p.plan.id))
    return {
      plans: selectedPlans.map(p => ({
        name: p.plan.name,
        price: p.plan.defaultMonthlyPrice,
        quantity: p.quantity,
        startDate: p.startDate,
        endDate: p.endDate,
        discounts: p.discounts.map(d => d.percentage),
      })),
      catalog: planCatalog.filter(p => !taken.has(p.id)).map(p => p.name),
      selectedPlanName: planFromSelection()?.plan.name ?? null,
      customer,
      currency,
      draftExpiry,
      today: formatDateShort(new Date()),
    }
  }

  // Free-form requests the deterministic parser can't classify are sent to the
  // AI model, which translates them into canonical commands that we then run
  // through the SAME `runIntent` parser — so every AI-driven edit flows through
  // the exact handlers the tree/forms use and stays fully in sync.
  async function runWithAI(text: string) {
    setThinking(true)
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, context: buildContext() }),
      })
      const data = (await res.json()) as { reply: string; commands: string[] }
      // Execute each translated command through the deterministic parser so the
      // mutations are identical to a typed command or a manual form edit.
      const executed: string[] = []
      for (const cmd of data.commands ?? []) {
        const result = runIntent(cmd)
        if (result !== ASSISTANT_GENERIC_FALLBACK) executed.push(result)
      }
      const reply =
        data.reply?.trim() ||
        (executed.length ? executed.join(" ") : ASSISTANT_GENERIC_FALLBACK)
      setMessages(prev => [...prev, { role: "assistant", text: reply }])
    } catch {
      // Model unreachable — fall back to the deterministic parser so direct
      // commands still work, and only show an error if that can't handle it.
      const reply = runIntent(text)
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          text:
            reply === ASSISTANT_GENERIC_FALLBACK
              ? "I couldn't reach the assistant just now. Try a direct command like “set Enterprise Seats to $120”."
              : reply,
        },
      ])
    } finally {
      setThinking(false)
    }
  }

  // Submit a request to the assistant. Two paths share this:
  //  - `viaAI: true`  (typed messages): always route to the AI model so natural
  //    language is understood, with the deterministic parser as a safety net if
  //    the model is unreachable.
  //  - `viaAI: false` (suggestion chips): these are already canonical commands,
  //    so run them instantly through the deterministic parser — no round-trip.
  function submitText(raw: string, viaAI = false) {
    const text = raw.trim()
    if (!text || thinking) return
    setMessages(prev => [...prev, { role: "user", text }])
    setPrompt("")
    setOpen(true)
    if (viaAI) {
      void runWithAI(text)
      return
    }
    const reply = runIntent(text)
    if (reply === ASSISTANT_GENERIC_FALLBACK) {
      void runWithAI(text)
      return
    }
    setMessages(prev => [...prev, { role: "assistant", text: reply }])
  }

  function handleSend() {
    submitText(prompt, true)
  }

  // Context-aware example commands. They adapt to the current draft (a real
  // product name when one exists) so a tap always produces a valid edit.
  const sampleName = selectedPlans[0]?.plan.name ?? "Enterprise Seats"
  const suggestions: string[] = [
    `Set ${sampleName} to 50 units`,
    `Add a 15% discount to ${sampleName}`,
    `Extend all products to Dec 31, 2028`,
    `Set ${sampleName} to $120`,
    `Add Edge Storage Units`,
    `Set customer to Acme Corp`,
  ]

  function MessageStream({ maxH }: { maxH: string }) {
    return (
      <div ref={scrollRef} className={cn("overflow-y-auto px-3 py-3 flex flex-col gap-2 bg-[#fbfbfc]", maxH)}>
        {messages.length === 0 && (
          <p className="text-xs text-[#6c7688] leading-relaxed">
            I make the same edits as the form. Try asking me to add a product or adjust pricing.
          </p>
        )}
        {messages.map((m, i) => {
          return (
            <div
              key={i}
              className={cn(
                "max-w-[88%] rounded-lg px-3 py-2 text-xs leading-relaxed",
                m.role === "user"
                  ? "self-end bg-[#533AFD] text-white"
                  : "self-start bg-white border border-[#ebeef1] text-[#353A44]",
              )}
            >
              {m.text}
            </div>
          )
        })}
        {thinking && (
          <div className="self-start flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs bg-white border border-[#ebeef1] text-[#6c7688]">
            <Sparkles className="w-3 h-3 text-[#533AFD] animate-pulse" />
            Thinking…
          </div>
        )}
      </div>
    )
  }

  function InputRow() {
    return (
      <div className="p-2 border-t border-[#ebeef1]">
        <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-0.5 px-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {suggestions.map(s => (
            <button
              key={s}
              onClick={() => submitText(s)}
              className="shrink-0 px-2.5 py-1 rounded-full border border-[#dfe1e6] bg-white text-[11px] whitespace-nowrap text-[#3c4350] hover:border-[#533AFD] hover:text-[#533AFD] transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 border border-[#dfe1e6] bg-white rounded-lg pl-2 pr-1 py-1 focus-within:border-[#533AFD] focus-within:ring-[3px] focus-within:ring-[#533AFD]/15 transition-all">
          <input
            type="text"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder={thinking ? "Thinking…" : "Ask the assistant…"}
            disabled={thinking}
            className="flex-1 h-8 bg-transparent text-sm text-[#1A1A1A] placeholder:text-[#A0A8B4] outline-none px-1 disabled:opacity-60"
          />
          <button
            onClick={handleSend}
            disabled={!prompt.trim() || thinking}
            className={cn(
              "w-8 h-8 flex items-center justify-center rounded-md transition-colors shrink-0",
              prompt.trim() && !thinking
                ? "bg-[#533AFD] hover:bg-[#4730E0] text-white"
                : "bg-[#f1f2f4] text-[#A0A8B4] cursor-not-allowed",
            )}
            aria-label="Send message"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Compact popover — opens above the launcher */}
      {open && (
        <div className="absolute bottom-16 right-4 z-40 w-80 rounded-xl border border-[#ebeef1] bg-white shadow-xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#ebeef1]">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-[#353A44]">
              <Sparkles className="w-3.5 h-3.5 text-[#533AFD]" />
              Assistant
            </span>
            <button
              onClick={() => setOpen(false)}
              className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-[#f1f2f4] text-[#A0A8B4] hover:text-[#353A44] transition-colors"
              aria-label="Close assistant"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <MessageStream maxH="max-h-64" />
          <InputRow />
        </div>
      )}

      {/* Floating launcher */}
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          "absolute bottom-4 right-4 z-30 flex items-center gap-1.5 h-9 pl-2.5 pr-3 rounded-full border shadow-sm text-xs font-medium transition-colors",
          open
            ? "bg-[#533AFD] border-[#533AFD] text-white"
            : "bg-white border-[#dfe1e6] text-[#353A44] hover:bg-[#f7f6fe]",
        )}
        aria-label="Toggle AI assistant"
      >
        <Sparkles className={cn("w-3.5 h-3.5", open ? "text-white" : "text-[#533AFD]")} />
        Ask AI
        {messages.length > 0 && !open && (
          <span className="ml-0.5 min-w-4 h-4 px-1 flex items-center justify-center rounded-full bg-[#f0eefe] text-[10px] font-semibold text-[#533AFD]">
            {messages.length}
          </span>
        )}
      </button>
    </>
  )
}

// =============================================================================
// CONTRACT CONSOLE — full-column agentic experience
// =============================================================================
type ConsoleMessage =
  | { role: "user"; text: string; attachmentName?: string }
  | { role: "assistant"; text: string }
  | { role: "action"; text: string }

interface PendingAttachment {
  filename: string
  base64: string
  mediaType: string
}

const STARTERS = [
  "Add Enterprise Seats and set it to $180/mo",
  "Set up a contract for Acme Corp in USD",
  "Add Edge Storage Units with a 15% discount",
  "Walk me through building this contract",
]

function ContractConsole({
  selectedPlans,
  customer,
  currency,
  draftExpiry,
  onExecuteCommand,
  onDismiss,
}: {
  selectedPlans: SelectedPlanEntry[]
  customer: { name: string; email: string } | null
  currency: string
  draftExpiry: string
  onExecuteCommand: (command: string) => void
  onDismiss?: () => void
}) {
  const [messages, setMessages] = useState<ConsoleMessage[]>([])
  const [input, setInput] = useState("")
  const [thinking, setThinking] = useState(false)
  const [pendingAttachment, setPendingAttachment] = useState<PendingAttachment | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, thinking])

  useEffect(() => { inputRef.current?.focus() }, [])

  function handleFileSelect(file: File) {
    const mediaType = file.type || "text/plain"
    const reader = new FileReader()
    if (mediaType === "application/pdf") {
      reader.onload = () => {
        const base64 = btoa(String.fromCharCode(...new Uint8Array(reader.result as ArrayBuffer)))
        setPendingAttachment({ filename: file.name, base64, mediaType })
      }
      reader.readAsArrayBuffer(file)
    } else {
      reader.onload = () => {
        const base64 = btoa(unescape(encodeURIComponent(reader.result as string)))
        setPendingAttachment({ filename: file.name, base64, mediaType: "text/plain" })
      }
      reader.readAsText(file)
    }
  }

  async function send(text?: string) {
    const raw = (text ?? input).trim()
    const attachment = pendingAttachment
    if (!raw && !attachment || thinking) return
    setInput("")
    setPendingAttachment(null)
    const displayText = raw || `Analyze this document`
    setMessages(prev => [...prev, { role: "user", text: displayText, attachmentName: attachment?.filename }])
    setThinking(true)
    try {
      const ctx = {
        plans: selectedPlans.map(p => ({
          name: p.plan.name,
          price: p.plan.defaultMonthlyPrice,
          quantity: p.quantity,
          startDate: p.startDate,
          endDate: p.endDate,
          discounts: p.discounts.map(d => d.percentage),
        })),
        catalog: planCatalog.map(p => p.name),
        selectedPlanName: selectedPlans[0]?.plan.name ?? null,
        customer,
        currency,
        draftExpiry,
        today: new Date().toISOString().slice(0, 10),
      }
      // Pass conversation history (user + assistant turns only) for multi-turn context
      const history = messages
        .filter(m => m.role === "user" || m.role === "assistant")
        .map(m => ({ role: m.role as "user" | "assistant", content: m.text }))
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: raw || "Analyze this document and populate the contract.", context: ctx, attachment, history }),
      })
      const data = (await res.json()) as { reply: string; commands: string[] }
      if (data.reply) {
        setMessages(prev => [...prev, { role: "assistant", text: data.reply }])
      }
      for (const cmd of data.commands ?? []) {
        onExecuteCommand(cmd)
        setMessages(prev => [...prev, { role: "action", text: cmd }])
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", text: "Couldn't reach the assistant. Try again." }])
    } finally {
      setThinking(false)
    }
  }

  const isEmpty = messages.length === 0 && !thinking

  return (
    <div className="flex flex-col h-full w-full bg-white text-[#353A44] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 h-12 border-b border-[#ebeef1] shrink-0">
        <span className="text-sm font-semibold text-[#353A44]">New conversation</span>
        <div className="flex items-center gap-3">
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="text-xs text-[#9aa0ac] hover:text-[#6c7688] transition-colors"
            >
              Clear
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-xs text-[#9aa0ac] hover:text-[#6c7688] transition-colors flex items-center gap-1"
              title="Hide console"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              Editor only
            </button>
          )}
        </div>
      </div>

      {/* Message stream */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
        {isEmpty && (
          <div className="flex flex-col gap-4 mt-1">
            <p className="text-xs text-[#9aa0ac] leading-relaxed">
              Describe the contract you need, upload an existing document, or try a suggestion:
            </p>
            <div className="flex flex-col gap-1.5">
              {STARTERS.map(s => (
                <button
                  key={s}
                  onClick={() => void send(s)}
                  className="text-left text-xs text-[#596171] hover:text-[#353A44] py-2 px-3 rounded-md border border-[#ebeef1] hover:border-[#d4d8e0] bg-white hover:bg-[#f5f6f8] transition-all"
                >
                  {s}
                </button>
              ))}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-left text-xs text-[#596171] hover:text-[#353A44] py-2 px-3 rounded-md border border-[#ebeef1] hover:border-[#d4d8e0] bg-white hover:bg-[#f5f6f8] transition-all flex items-center gap-2"
              >
                <Paperclip className="w-3 h-3 text-[#9aa0ac] shrink-0" />
                Upload a contract or pricing sheet
              </button>
            </div>
          </div>
        )}

        {messages.map((m, i) => {
          if (m.role === "action") {
            return (
              <div key={i} className="flex items-center gap-2 py-1">
                <div className="flex-1 h-px bg-[#ebeef1]" />
                <span className="text-[10px] text-[#9aa0ac] whitespace-nowrap px-1">{m.text}</span>
                <div className="flex-1 h-px bg-[#ebeef1]" />
              </div>
            )
          }
          return (
            <div key={i} className="flex flex-col gap-1">
              {m.role === "user" ? (
                <div className="self-end max-w-[85%] bg-[#f5f6f8] rounded-xl px-3 py-2 text-sm text-[#353A44] leading-relaxed">
                  {m.attachmentName && (
                    <span className="inline-flex items-center gap-1 mr-2 px-1.5 py-0.5 rounded bg-[#ebeef1] text-[11px] text-[#6c7688]">
                      <Paperclip className="w-2.5 h-2.5" />{m.attachmentName}
                    </span>
                  )}
                  {m.text}
                </div>
              ) : (
                <div className="self-start max-w-[90%] text-sm text-[#596171] leading-relaxed">
                  {m.text}
                </div>
              )}
            </div>
          )
        })}

        {thinking && (
          <div className="flex gap-1.5 px-1 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d4d8e0] animate-pulse" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#d4d8e0] animate-pulse" style={{ animationDelay: "150ms" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-[#d4d8e0] animate-pulse" style={{ animationDelay: "300ms" }} />
          </div>
        )}
      </div>

      {/* Pending attachment pill */}
      {pendingAttachment && (
        <div className="px-5 pt-2 shrink-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#f5f6f8] border border-[#ebeef1] text-[11px] text-[#6c7688]">
            <Paperclip className="w-3 h-3 text-[#9aa0ac]" />
            <span className="max-w-[180px] truncate">{pendingAttachment.filename}</span>
            <button
              onClick={() => setPendingAttachment(null)}
              className="ml-1 text-[#444] hover:text-[#888] transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-5 py-4 border-t border-[#ebeef1] shrink-0">
        <div className="flex items-center gap-2.5 bg-white rounded-lg px-3.5 py-2.5 border border-[#dfe1e6] focus-within:border-[#3BABFD] focus-within:ring-[3px] focus-within:ring-[#3BABFD]/10 transition-colors">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-[#9aa0ac] hover:text-[#6c7688] transition-colors shrink-0"
            title="Upload document"
          >
            <Paperclip className="w-3.5 h-3.5" />
          </button>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") void send() }}
            placeholder="Ask anything"
            disabled={thinking}
            className="bg-transparent text-[#353A44] text-[13px] flex-1 outline-none placeholder:text-[#A0A8B4] disabled:opacity-40"
          />
          {(input.trim() || pendingAttachment) && (
            <button
              onClick={() => void send()}
              disabled={thinking}
              className="text-[#9aa0ac] hover:text-[#3BABFD] transition-colors disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt,.csv,.md,.png,.jpg,.jpeg,.gif,.webp,.svg,.heic,.xlsx,.xls,.docx,.doc,.pptx,.ppt,.rtf,.json"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) handleFileSelect(file)
          e.target.value = ""
        }}
      />
    </div>
  )
}

// =============================================================================
// AI MODE OVERLAYS — rendered on top of the editor when aiMode !== "chat"
// =============================================================================
type AiMode = "chat" | "ghosting" | "cmd-k" | "review" | "console"

type AiContractState = {
  contractId: string
  customer: { name: string; email: string } | null
  currency: string
  plans: { name: string; monthlyPrice: number; quantity: number; startDate: string; endDate: string }[]
}

type AiAction =
  | { type: "set_customer"; name: string; email: string }
  | { type: "set_currency"; value: string }

async function aiChat<T>(system: string, user: string, fallback: T): Promise<T> {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gpt-4o", messages: [{ role: "system", content: system }, { role: "user", content: user }] }),
    })
    const data = await res.json()
    return JSON.parse(data.content ?? "{}") as T
  } catch { return fallback }
}

// V1 — Ghosting: floating suggestions panel anchored to the form area
function AiGhostingOverlay({ state, onApply }: { state: AiContractState; onApply: (a: AiAction) => void }) {
  const [suggestions, setSuggestions] = useState<{ field: string; label: string; value: string; action: AiAction }[]>([])
  const [loading, setLoading] = useState(false)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const prevKey = useRef("")

  useEffect(() => {
    const key = JSON.stringify({ c: state.customer, curr: state.currency, plans: state.plans.length })
    if (key === prevKey.current) return
    prevKey.current = key
    setLoading(true)
    aiChat<{ suggestions: { field: string; label: string; value: string; customerName?: string; customerEmail?: string; currency?: string }[] }>(
      `You are an AI assistant for a Stripe contract editor. Given the current contract state, suggest 1–3 quick improvements or completions for empty or improvable fields. Return JSON: {"suggestions": [{"field": "customer_name"|"customer_email"|"currency", "label": "short label", "value": "display value", "customerName"?: "...", "customerEmail"?: "...", "currency"?: "..."}]}`,
      `Contract: ${JSON.stringify(state)}`,
      { suggestions: [] }
    ).then(r => {
      setSuggestions((r.suggestions ?? []).map(s => ({
        field: s.field, label: s.label, value: s.value,
        action: s.field === "currency"
          ? { type: "set_currency", value: s.currency ?? s.value }
          : { type: "set_customer", name: s.customerName ?? state.customer?.name ?? "", email: s.customerEmail ?? state.customer?.email ?? "" },
      })))
      setDismissed(new Set())
      setLoading(false)
    })
  }, [state.customer, state.currency, state.plans.length])

  const visible = suggestions.filter(s => !dismissed.has(s.field))
  if (!visible.length && !loading) return null

  return (
    <div className="fixed top-16 right-4 z-[190] flex flex-col gap-1.5 pointer-events-none">
      {loading && (
        <div className="flex items-center gap-2 bg-white border border-[#ebeef1] rounded-xl px-3 py-2 shadow-sm pointer-events-auto">
          <Loader2 size={12} className="animate-spin text-[#9aa0ac]" />
          <span className="text-[11px] text-[#9aa0ac]">Generating suggestions…</span>
        </div>
      )}
      {visible.map(s => (
        <div key={s.field} className="flex items-center gap-2 bg-white border border-[#ebeef1] rounded-xl pl-3 pr-2 py-2 shadow-sm pointer-events-auto">
          <Sparkles size={11} className="text-[#533AFD] flex-shrink-0" />
          <span className="text-[11px] text-[#6c7688] flex-shrink-0">{s.label}:</span>
          <span className="text-[11px] font-medium text-[#353A44] truncate max-w-[140px]">{s.value}</span>
          <button onClick={() => { onApply(s.action); setDismissed(p => new Set([...p, s.field])) }} className="ml-1 text-[10px] font-semibold text-[#533AFD] hover:text-[#4730e0] flex-shrink-0">Apply</button>
          <button onClick={() => setDismissed(p => new Set([...p, s.field]))} className="text-[#d8dee4] hover:text-[#9aa0ac]"><X size={11} /></button>
        </div>
      ))}
    </div>
  )
}

// V2 — Command bar: ⌘K natural language overlay
function AiCommandBarOverlay({ state, onApply }: { state: AiContractState; onApply: (a: AiAction) => void }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string>()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setOpen(o => !o) } }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 50); else { setQuery(""); setResult(undefined) } }, [open])

  async function submit(e?: React.FormEvent) {
    e?.preventDefault()
    if (!query.trim() || loading) return
    setLoading(true)
    const parsed = await aiChat<{ message: string; actions: AiAction[] }>(
      `You are a Stripe contract editor assistant. Parse natural language instructions and return actions. Current state: ${JSON.stringify(state)}. Return JSON: {"message": "what you did", "actions": [{"type": "set_customer", "name": "...", "email": "..."} | {"type": "set_currency", "value": "..."}]}`,
      query, { message: "Done.", actions: [] }
    )
    parsed.actions?.forEach(a => onApply(a))
    setResult(parsed.message)
    setQuery("")
    setLoading(false)
    setTimeout(() => { setOpen(false); setResult(undefined) }, 1600)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed top-[58px] right-4 z-[190] flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-[#ebeef1] rounded-full text-[11px] text-[#6c7688] hover:border-[#d8dee4] shadow-sm transition-colors"
      >
        <Sparkles size={11} className="text-[#533AFD]" />
        Ask AI
        <kbd className="text-[10px] bg-[#f5f6f8] border border-[#ebeef1] rounded px-1">⌘K</kbd>
      </button>
      {open && (
        <div className="fixed inset-0 z-[300] flex items-start justify-center pt-[20vh]">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md border border-[#ebeef1] overflow-hidden mx-4">
            <form onSubmit={submit}>
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#f0f1f3]">
                {loading ? <Loader2 size={15} className="text-[#533AFD] animate-spin flex-shrink-0" /> : <Sparkles size={15} className="text-[#533AFD] flex-shrink-0" />}
                <input ref={inputRef} className="flex-1 text-sm outline-none placeholder-[#9aa0ac] bg-transparent" value={query} onChange={e => setQuery(e.target.value)} placeholder="Set customer to Acme Corp, billing@example.com…" disabled={loading} />
                {query && !loading && <button type="submit" className="text-[#533AFD] hover:text-[#4730e0]"><ArrowRight size={15} /></button>}
                <button type="button" onClick={() => setOpen(false)} className="text-[#d8dee4] hover:text-[#9aa0ac] ml-1"><X size={14} /></button>
              </div>
            </form>
            {result && <div className="px-4 py-3 text-sm text-green-700 bg-green-50 flex items-center gap-2"><Check size={13} className="text-green-500 flex-shrink-0" />{result}</div>}
            {!result && !loading && (
              <div className="p-3">
                <p className="text-[10px] font-semibold text-[#9aa0ac] uppercase tracking-wide px-1 mb-1.5">Try</p>
                {["Set customer to Acme Corp, billing@example.com", "Change currency to EUR", "Set billing to manual"].map(s => (
                  <button key={s} className="block w-full text-left text-sm text-[#353A44] hover:bg-[#f5f6f8] rounded-lg px-3 py-2 transition-colors" onClick={() => setQuery(s)}>{s}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

// V4 — Guided review: bottom slide-up panel
function AiReviewPanel({ state }: { state: AiContractState }) {
  type Step = { id: string; field: string; severity: "ok" | "warning" | "info"; question: string; recommendation: string; actionLabel?: string }
  const [phase, setPhase] = useState<"idle" | "loading" | "reviewing" | "done">("idle")
  const [steps, setSteps] = useState<Step[]>([])
  const [current, setCurrent] = useState(0)
  const [accepted, setAccepted] = useState(0)
  const [skipped, setSkipped] = useState(0)

  async function start() {
    setPhase("loading")
    const r = await aiChat<{ steps: Step[] }>(
      `You are a senior enterprise deal reviewer. Review the contract and return 3–5 review steps. Return JSON: {"steps": [{"id": "1", "field": "field name", "severity": "ok"|"warning"|"info", "question": "...", "recommendation": "...", "actionLabel": "optional button label"}]}`,
      `Contract: ${JSON.stringify(state)}`, { steps: [] }
    )
    if (!r.steps?.length) { setPhase("idle"); return }
    setSteps(r.steps); setCurrent(0); setAccepted(0); setSkipped(0); setPhase("reviewing")
  }

  function advance(accept: boolean) {
    if (accept) setAccepted(n => n + 1); else setSkipped(n => n + 1)
    if (current + 1 >= steps.length) setPhase("done"); else setCurrent(i => i + 1)
  }

  const step = steps[current]
  const progress = steps.length ? ((accepted + skipped) / steps.length) * 100 : 0
  const severityIcon = step?.severity === "ok" ? <Check size={14} className="text-green-500" /> : step?.severity === "warning" ? <AlertTriangle size={14} className="text-amber-500" /> : <Sparkles size={14} className="text-blue-500" />

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[190] border-t border-[#ebeef1] bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
      {phase === "idle" && (
        <div className="flex items-center justify-between px-6 py-3">
          <div><p className="text-sm font-semibold text-[#353A44]">AI deal review</p><p className="text-[11px] text-[#9aa0ac]">Walk through your contract line by line</p></div>
          <button onClick={start} className="flex items-center gap-1.5 bg-[#353A44] text-white text-[12px] font-semibold px-3.5 py-2 rounded-lg hover:bg-[#22262d] transition-colors"><Sparkles size={12} />Review deal</button>
        </div>
      )}
      {phase === "loading" && (
        <div className="flex items-center justify-center gap-2 px-6 py-4"><Loader2 size={14} className="animate-spin text-[#9aa0ac]" /><span className="text-sm text-[#9aa0ac]">Reviewing your deal…</span></div>
      )}
      {phase === "reviewing" && step && (
        <div>
          <div className="h-0.5 bg-[#f0f1f3]"><div className="h-full bg-[#533AFD] transition-all duration-500" style={{ width: `${progress}%` }} /></div>
          <div className="flex items-start gap-3 px-6 py-3">
            <div className="mt-0.5 flex-shrink-0">{severityIcon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-[#9aa0ac] uppercase tracking-wide mb-0.5">{step.field}</p>
              <p className="text-sm font-semibold text-[#353A44]">{step.question}</p>
              <p className="text-[12px] text-[#6c7688] mt-0.5">{step.recommendation}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => advance(false)} className="text-[11px] text-[#6c7688] hover:text-[#353A44] px-3 py-1.5 border border-[#ebeef1] rounded-lg bg-white">Skip</button>
              <button onClick={() => advance(true)} className="text-[11px] text-white bg-[#353A44] hover:bg-[#22262d] px-3 py-1.5 rounded-lg font-medium">{step.actionLabel ?? "Got it"}</button>
            </div>
          </div>
          <div className="flex gap-1 px-6 pb-3">{steps.map((s, i) => <div key={s.id} className={cn("h-1 flex-1 rounded-full transition-colors", i < accepted + skipped ? (i < accepted ? "bg-green-400" : "bg-[#ebeef1]") : i === current ? "bg-[#533AFD]" : "bg-[#f0f1f3]")} />)}</div>
        </div>
      )}
      {phase === "done" && (
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2"><Check size={15} className="text-green-500" /><div><p className="text-sm font-semibold text-[#353A44]">Review complete</p><p className="text-[11px] text-[#9aa0ac]">{accepted} applied · {skipped} skipped</p></div></div>
          <button onClick={start} className="text-[11px] text-[#6c7688] hover:text-[#353A44] px-3 py-1.5 border border-[#ebeef1] rounded-lg">Re-review</button>
        </div>
      )}
    </div>
  )
}

// V5 — Console: dark bottom JSON + prompt panel
function AiConsoleOverlay({ state }: { state: AiContractState }) {
  type Entry = { id: number; type: "prompt" | "response" | "error"; content: string; ts: string }
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<"console" | "state">("console")
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [entries, setEntries] = useState<Entry[]>([])
  const [copied, setCopied] = useState(false)
  const idRef = useRef(1)
  const bottomRef = useRef<HTMLDivElement>(null)
  const H = 260

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [entries, open])

  function ts() { const d = new Date(); return [d.getHours(), d.getMinutes(), d.getSeconds()].map(n => String(n).padStart(2, "0")).join(":") }
  function push(type: Entry["type"], content: string) { setEntries(p => [...p, { id: idRef.current++, type, content, ts: ts() }]) }

  async function run() {
    if (!prompt.trim() || loading) return
    const p = prompt; setPrompt(""); push("prompt", p); setLoading(true)
    const r = await aiChat<{ response: string }>(
      `You are a contract state console. Answer questions about this contract state. Return JSON: {"response": "..."}`,
      `State: ${JSON.stringify(state)}\nQuestion: ${p}`, { response: "Error." }
    )
    push("response", r.response ?? "")
    setLoading(false)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[190] bg-[#0d0f12] border-t border-[#1e2328] transition-all duration-200" style={{ height: open ? H : 36 }}>
      <div className="flex items-center justify-between px-4 h-9 border-b border-[#1e2328] cursor-pointer select-none" onClick={() => setOpen(o => !o)}>
        <div className="flex items-center gap-2">
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><rect x="0.5" y="0.5" width="10" height="10" rx="2" stroke="#4ade80" strokeOpacity="0.8"/><path d="M2.5 4h6M2.5 5.5h4M2.5 7h4.5" stroke="#4ade80" strokeOpacity="0.8" strokeWidth="1.1" strokeLinecap="round"/></svg>
          <span className="text-[11px] font-mono text-[#4b5563]">contract.console</span>
          {!open && <span className="text-[10px] font-mono text-[#374151] ml-2">{state.customer?.name || "unnamed"} · {state.plans.length} plan{state.plans.length !== 1 ? "s" : ""}</span>}
        </div>
        <div className="flex items-center gap-2">
          {open && (
            <>
              {(["console", "state"] as const).map(t => (
                <button key={t} onClick={e => { e.stopPropagation(); setTab(t) }} className={cn("text-[10px] px-2 py-0.5 rounded transition-colors", tab === t ? "bg-[#1e2328] text-[#e5e7eb]" : "text-[#4b5563] hover:text-[#9ca3af]")}>{t === "console" ? "Console" : "State"}</button>
              ))}
            </>
          )}
          <span className="text-[10px] text-[#374151]">{open ? "▾" : "▴"}</span>
        </div>
      </div>
      {open && (
        <div className="flex flex-col overflow-hidden" style={{ height: H - 36 }}>
          {tab === "state" ? (
            <div className="flex-1 overflow-auto p-3 relative">
              <button onClick={() => { navigator.clipboard.writeText(JSON.stringify(state, null, 2)); setCopied(true); setTimeout(() => setCopied(false), 1500) }} className="absolute top-2 right-2 text-[10px] text-[#4b5563] hover:text-[#9ca3af] bg-[#1e2328] border border-[#374151] rounded px-2 py-1 flex items-center gap-1">{copied ? <Check size={9} className="text-green-400" /> : <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><rect x="0.5" y="2.5" width="6" height="6" rx="1" stroke="currentColor"/><path d="M2.5 2.5V1.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-1" stroke="currentColor"/></svg>}{copied ? "Copied" : "Copy"}</button>
              <pre className="text-[11px] font-mono text-[#4ade80] leading-relaxed whitespace-pre-wrap">{JSON.stringify(state, null, 2)}</pre>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-auto p-3 space-y-1 font-mono text-[11px]">
                {entries.length === 0 && <span className="text-[#374151]"><span className="text-[#4ade80]">$</span> Ready. Ask anything about this contract.</span>}
                {entries.map(e => (
                  <div key={e.id}><span className="text-[#374151] select-none">{e.ts} </span>{e.type === "prompt" ? <span className="text-blue-400">▶ {e.content}</span> : e.type === "error" ? <span className="text-red-400">{e.content}</span> : <span className="text-[#d1d5db] whitespace-pre-wrap">{e.content}</span>}</div>
                ))}
                {loading && <div className="flex items-center gap-2 text-[#4b5563]"><Loader2 size={10} className="animate-spin" />Processing…</div>}
                <div ref={bottomRef} />
              </div>
              <div className="flex items-center gap-2 border-t border-[#1e2328] px-3 py-2">
                <span className="text-[#4ade80] font-mono text-[11px] flex-shrink-0">$</span>
                <input className="flex-1 bg-transparent text-[11px] font-mono text-[#e5e7eb] outline-none placeholder-[#374151]" value={prompt} onChange={e => setPrompt(e.target.value)} onKeyDown={e => { if (e.key === "Enter") run() }} placeholder="what's the total contract value…" disabled={loading} />
                <button onClick={run} disabled={!prompt.trim() || loading} className="text-[#4b5563] hover:text-[#9ca3af] disabled:opacity-30"><Send size={11} /></button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// CONTROL PANEL — Cmd+/ floating options panel
// =============================================================================
type ConsolePosition = "off" | "right" | "left" | "l+hdr" | "over" | "inline"

function SegmentedRow({
  label,
  options,
  value,
  onChange,
  highlight,
}: {
  label: string
  options: string[]
  value: string
  onChange: (v: string) => void
  highlight?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        {highlight ? (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#533AFD] text-white tracking-wide uppercase">
            {label}
          </span>
        ) : (
          <span className="text-[10px] font-medium text-[#9aa0ac] uppercase tracking-wide">{label}</span>
        )}
      </div>
      <div className="flex bg-[#f0f1f3] rounded-[7px] p-[3px] gap-[2px]">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => onChange(opt.toLowerCase().replace("+", "+"))}
            className={cn(
              "flex-1 text-[11px] font-medium rounded-[5px] py-1 transition-all",
              value === opt.toLowerCase() || value === opt.toLowerCase().replace("l+hdr", "l+hdr")
                ? "bg-white text-[#353A44] shadow-[0_1px_2px_rgba(0,0,0,0.12)]"
                : "text-[#6c7688] hover:text-[#353A44]",
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

function ControlPanel({
  onClose,
  consolePosition,
  setConsolePosition,
  consoleHeight,
  setConsoleHeight,
  consoleWidth,
  setConsoleWidth,
  timelineView,
  setTimelineView,
  layoutMode,
  setLayoutMode,
  aiMode,
  setAiMode,
}: {
  onClose: () => void
  consolePosition: ConsolePosition
  setConsolePosition: (p: ConsolePosition) => void
  consoleHeight: number
  setConsoleHeight: (h: number) => void
  consoleWidth: number
  setConsoleWidth: (w: number) => void
  timelineView: "gantt" | "cashflow"
  setTimelineView: (v: "gantt" | "cashflow") => void
  layoutMode: "split" | "north-star"
  setLayoutMode: (m: "split" | "north-star") => void
  aiMode: AiMode
  setAiMode: (m: AiMode) => void
}) {
  return (
    <div className="fixed bottom-4 right-4 z-[200] w-[272px] bg-white rounded-[14px] border border-[#ebeef1] shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f1f3]">
        <span className="text-[13px] font-semibold text-[#353A44]">Options</span>
        <button
          onClick={onClose}
          className="text-[13px] text-[#6c7688] hover:text-[#353A44] transition-colors font-medium"
        >
          Close
        </button>
      </div>

      <div className="px-4 py-3 flex flex-col gap-3.5">
        <div className="flex flex-col gap-1.5">
          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#533AFD] text-white tracking-wide uppercase self-start">AI mode</span>
          <div className="flex bg-[#f0f1f3] rounded-[7px] p-[3px] gap-[2px]">
            {([["chat", "Chat"], ["ghosting", "Ghost"], ["cmd-k", "⌘K"], ["review", "Review"], ["console", "Console"]] as [AiMode, string][]).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setAiMode(id)}
                className={cn(
                  "flex-1 text-[11px] font-medium rounded-[5px] py-1 transition-all",
                  aiMode === id ? "bg-white text-[#353A44] shadow-[0_1px_2px_rgba(0,0,0,0.12)]" : "text-[#6c7688] hover:text-[#353A44]",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <SegmentedRow
          label="Console slide"
          options={["Off", "Right", "Left", "L+Hdr", "Over", "Inline"]}
          value={consolePosition === "off" ? "Off" : consolePosition}
          onChange={v => setConsolePosition(v === "Off" ? "off" : v as ConsolePosition)}
          highlight
        />

        <SegmentedRow
          label="Width"
          options={["Compact", "Default", "Wide"]}
          value={consoleWidth === 460 ? "Compact" : consoleWidth === 700 ? "Wide" : "Default"}
          onChange={v => setConsoleWidth(v === "Compact" ? 460 : v === "Wide" ? 700 : 580)}
        />

        {consolePosition === "inline" && (
          <SegmentedRow
            label="Chat height"
            options={["25%", "40%", "50%", "65%"]}
            value={`${consoleHeight}%`}
            onChange={v => setConsoleHeight(parseInt(v))}
          />
        )}

        <div className="flex flex-col gap-1.5">
          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#533AFD] text-white tracking-wide uppercase self-start">Timeline</span>
          <div className="flex bg-[#f0f1f3] rounded-[7px] p-[3px] gap-[2px]">
            {(["gantt", "cashflow"] as const).map(v => (
              <button
                key={v}
                onClick={() => setTimelineView(v)}
                className={cn(
                  "flex-1 text-[11px] font-medium rounded-[5px] py-1 transition-all capitalize",
                  timelineView === v ? "bg-white text-[#353A44] shadow-[0_1px_2px_rgba(0,0,0,0.12)]" : "text-[#6c7688] hover:text-[#353A44]",
                )}
              >
                {v === "gantt" ? "Gantt" : "Cashflow"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-medium text-[#9aa0ac] uppercase tracking-wide">Layout</span>
            {layoutMode === "north-star" && (
              <span className="px-1 py-0.5 rounded text-[9px] font-semibold bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0]">North star</span>
            )}
          </div>
          <div className="flex bg-[#f0f1f3] rounded-[7px] p-[3px] gap-[2px]">
            {([["split", "Split"], ["north-star", "Timeline only"]] as const).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setLayoutMode(id)}
                className={cn(
                  "flex-1 text-[11px] font-medium rounded-[5px] py-1 transition-all",
                  layoutMode === id ? "bg-white text-[#353A44] shadow-[0_1px_2px_rgba(0,0,0,0.12)]" : "text-[#6c7688] hover:text-[#353A44]",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end pb-1">
          <button
            onClick={() => { setConsolePosition("off"); setConsoleHeight(50); setConsoleWidth(580) }}
            className="px-3 py-1.5 rounded-[7px] bg-[#f0f1f3] text-[11px] font-medium text-[#6c7688] hover:bg-[#e8e9ec] transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  )
}

interface NewContractWizardV4Props {
  onDiscard: () => void
  onGetStarted: (result: NewContractResultV4) => void
  initialContract?: V4EditableContract
}

export default function NewContractWizardV4({ onDiscard, onGetStarted, initialContract }: NewContractWizardV4Props) {
  // Contract state
  const [contractId, setContractId] = useState(() => initialContract?.id ?? generateContractId())
  const [customer, setCustomer] = useState<{ name: string; email: string } | null>(initialContract?.customer ?? null)
  const [currency, setCurrency] = useState(initialContract?.currency || "USD")
  const [draftExpiry, setDraftExpiry] = useState(initialContract?.draftExpiry ?? defaultDraftExpiry())
  const [language, setLanguage] = useState("English")
  const [billingMethod, setBillingMethod] = useState<"auto" | "manual">(initialContract?.billingMethod ?? "auto")
  const [paymentMethod, setPaymentMethod] = useState<"visa-4242" | "mc-5555" | "none">("visa-4242")
  const [oneTimeFees, setOneTimeFees] = useState<OneTimeFee[]>([])
  const defaultStart = formatDateValue(new Date())
  const defaultEnd = formatDateValue(addMonths(new Date(), 24))

  // Get started flow. When editing an existing contract, seed config immediately
  // so the wizard skips the get-started screen and opens in the editor.
  const [config, setConfig] = useState<GetStartedConfig | null>(
    initialContract
      ? {
          contractId: initialContract.id,
          customer: initialContract.customer,
          currency: initialContract.currency,
          draftExpiry: initialContract.draftExpiry,
          documentName: null,
          plans: initialContract.planLines.map(planLineToEntry),
        }
      : null,
  )
  const [documentName, setDocumentName] = useState<string | null>(null)
  // Once an update/override is scheduled this session, hide the "Schedule updates" module
  const [hasScheduled, setHasScheduled] = useState(false)

  // AI mode
  const [aiMode, setAiMode] = useState<AiMode>("chat")

  // Demo control panel (Cmd+/)
  const [consolePosition, setConsolePosition] = useState<ConsolePosition>("right")
  const [consoleHeight, setConsoleHeight] = useState(50)
  const [consoleWidth, setConsoleWidth] = useState(580)
  const [showControlPanel, setShowControlPanel] = useState(false)
  const widthDragRef = useRef<{ x: number; width: number } | null>(null)
  const heightDragRef = useRef<{ y: number; height: number; containerH: number } | null>(null)

  const [timelineView, setTimelineView] = useState<"gantt" | "cashflow">("gantt")
  const [layoutMode, setLayoutMode] = useState<"split" | "north-star">("split")
  const [isMobile, setIsMobile] = useState(false)
  const [mobileBottomView, setMobileBottomView] = useState<"tree" | "form">("tree")
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)")
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault()
        setShowControlPanel(p => !p)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  // Plans state — populated from the get started screen, or pre-seeded from the
  // contract being edited (with full override/quantity-update detail).
  const [selectedPlans, setSelectedPlans] = useState<SelectedPlanEntry[]>(
    () => initialContract?.planLines.map(planLineToEntry) ?? [],
  )

  // Plans with each discount distributed onto the lines it actually applies to
  // (per its scope). Drives all pricing/visual surfaces — the timeline, invoice,
  // and PDF — so "specific items" targeting is reflected everywhere. Editing
  // (tree + forms) still operates on the raw selectedPlans.
  const resolvedPlans = useMemo(() => resolveDiscountScopes(selectedPlans), [selectedPlans])

  // UI state
  const [selectedNodeId, setSelectedNodeId] = useState("contract-root")
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [filterText, setFilterText] = useState("")
  const [showPlanSelector, setShowPlanSelector] = useState(false)
  const [scheduleModalPlanId, setScheduleModalPlanId] = useState<string | null>(null)
  const [invoicePreviewDate, setInvoicePreviewDate] = useState<Date | null>(null)
  // Pre-save confirmation modal (read-back of the contract before committing).
  // Only shown when updating an existing contract; new contracts save directly.
  const isExistingContract = !!initialContract
  const [showConfirm, setShowConfirm] = useState(false)
  // Lifted so the FormPanel "Schedule" module can open the dropdown that lives
  // in the tree navigation, teaching the user where this action lives.
  const [scheduleMenuPlanId, setScheduleMenuPlanId] = useState<string | null>(null)
  const [quantityFocusedPlanId, setQuantityFocusedPlanId] = useState<string | null>(null)

  // Continue from the get started screen into the editor. The editor opens with
  // EXACTLY what the get-started live preview showed: the same contract id,
  // customer, and the full plan entries (overrides, seat ramp, promo) the user
  // saw on the right — no re-derivation that could drift from the preview.
  const handleContinue = useCallback((cfg: GetStartedConfig) => {
    setContractId(cfg.contractId)
    setCustomer(cfg.customer)
    setCurrency(cfg.currency)
    setDraftExpiry(cfg.draftExpiry)
    setDocumentName(cfg.documentName)
    // A document was uploaded — open the schedule on the price node and expand
    // the first plan so the rich detail (overrides/ramp/promo) is front and center.
    if (cfg.loadDemo) {
      setBillingMethod(demoV4Contract.billingMethod ?? "auto")
    }
    const plans = cfg.plans.map(clonePlanEntry)
    setSelectedPlans(plans)
    const firstPlanId = plans[0]?.plan.id
    if (firstPlanId) {
      setSelectedNodeId(cfg.loadDemo ? `plan-${firstPlanId}-price` : `plan-${firstPlanId}`)
      setExpandedNodes(new Set([`plan-${firstPlanId}`]))
    }
    setConfig(cfg)
  }, [])

  // Handlers
  const handleToggleExpand = useCallback((id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const handleSelectNode = useCallback((id: string) => {
    setSelectedNodeId(id)

    // When a sub-node (e.g. the price, an override, or a quantity update) is
    // selected — such as by clicking a product in the Gantt preview, which now
    // focuses the price — expand its owning plan so the node is visible and
    // highlighted in the tree navigation rather than the collapsed product line.
    const owningPlan = selectedPlans.find(
      p => id !== `plan-${p.plan.id}` && id.startsWith(`plan-${p.plan.id}-`),
    )
    if (owningPlan) {
      const planNodeId = `plan-${owningPlan.plan.id}`
      setExpandedNodes(prev => {
        if (prev.has(planNodeId)) return prev
        const next = new Set(prev)
        next.add(planNodeId)
        return next
      })
    }

    // Handle action nodes
    if (id === "add-plan") {
      setShowPlanSelector(true)
    }

    // On mobile with console off, tapping a node opens the form panel
    if (window.innerWidth < 768 && consolePosition === "off") {
      setMobileBottomView("form")
    }
  }, [selectedPlans, consolePosition])

  const handleUpdatePlan = useCallback((planId: string, updates: Partial<SelectedPlanEntry>) => {
    setSelectedPlans(prev => prev.map(p => 
      p.plan.id === planId ? { ...p, ...updates } : p
    ))
  }, [])

  // Align every product's end date to the same value (used by the
  // "apply to all" prompt after a product's duration is extended/changed).
  const handleApplyEndDateToAll = useCallback((endDate: string) => {
    setSelectedPlans(prev => prev.map(p => ({ ...p, endDate })))
  }, [])

  const handleApplyStartDateToAll = useCallback((startDate: string) => {
    setSelectedPlans(prev => prev.map(p => ({ ...p, startDate })))
  }, [])

  const handleAddPlan = useCallback((plan: PlanTemplate) => {
    setSelectedPlans(prev => {
      if (prev.some(p => p.plan.id === plan.id)) return prev
      return [...prev, {
        plan,
        startDate: defaultStart,
        endDate: defaultEnd,
        quantity: 1,
        priceOverrides: [],
        quantityUpdates: [],
        discounts: [],
      }]
    })
    // Focus the pricing line (not the product) so the user lands on the
    // servicing/quantity/pricing form rather than the product-detail form.
    setSelectedNodeId(`plan-${plan.id}-price`)
    setExpandedNodes(prev => new Set([...prev, `plan-${plan.id}`]))
  }, [defaultStart, defaultEnd])

  const handleRemovePlan = useCallback((planId: string) => {
    setSelectedPlans(prev => prev.filter(p => p.plan.id !== planId))
    setSelectedNodeId("contract-root")
  }, [])

  const handleAddPriceOverride = useCallback((planId: string, override: PriceOverride) => {
    setSelectedPlans(prev => prev.map(p =>
      p.plan.id === planId
        ? { ...p, priceOverrides: [...p.priceOverrides, override] }
        : p
    ))
    setHasScheduled(true)
  }, [selectedPlans])

  const handleAddQuantityUpdate = useCallback((planId: string, update: QuantityUpdate) => {
    setSelectedPlans(prev => prev.map(p =>
      p.plan.id === planId
        ? { ...p, quantityUpdates: [...p.quantityUpdates, update] }
        : p
    ))
    setHasScheduled(true)
  }, [selectedPlans])

  const handleAddDiscount = useCallback((planId: string, discount: Discount) => {
    setSelectedPlans(prev => prev.map(p =>
      p.plan.id === planId
        ? { ...p, discounts: [...p.discounts, discount] }
        : p
    ))
    setHasScheduled(true)
  }, [selectedPlans])

  // One-time fee handlers
  const handleAddOneTimeFee = useCallback(() => {
    const fee: OneTimeFee = {
      id: generateId(),
      name: "Setup fee",
      amount: "0",
      billingDate: "on_activation",
      description: "",
    }
    setOneTimeFees(prev => [...prev, fee])
    setSelectedNodeId(`one-time-fee-${fee.id}`)
  }, [])

  const handleUpdateOneTimeFee = useCallback((id: string, updates: Partial<OneTimeFee>) => {
    setOneTimeFees(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f))
  }, [])

  const handleRemoveOneTimeFee = useCallback((id: string) => {
    setOneTimeFees(prev => prev.filter(f => f.id !== id))
    setSelectedNodeId("contract-root")
  }, [])

  // Markup handler — identical to handleCreateDiscount but with type: "markup"
  const handleCreateMarkup = useCallback(() => {
    setSelectedPlans(prev => {
      if (prev.length === 0) return prev
      const target = prev[0]
      const newMarkup: Discount = {
        id: `discount-${Date.now()}`,
        name: "",
        percentage: 10,
        startDate: target.startDate,
        endDate: target.endDate,
        scope: "everything",
        appliedItemIds: [],
        type: "markup",
      }
      setSelectedNodeId(`discount-${target.plan.id}-${newMarkup.id}`)
      return prev.map((p, i) => (i === 0 ? { ...p, discounts: [...p.discounts, newMarkup] } : p))
    })
    setHasScheduled(true)
    setShowPlanSelector(false)
  }, [])

  // Executes a command string from the console agent — mirrors the same mutations
  // the form and tree expose so the AI-driven path stays fully in sync.
  const executeContractCommand = useCallback((command: string) => {
    const lower = command.toLowerCase().trim()

    // add [product]
    for (const p of planCatalog) {
      if (lower.includes("add") && lower.includes(p.name.toLowerCase()) && !selectedPlans.some(s => s.plan.id === p.id)) {
        handleAddPlan(p)
        return
      }
    }

    // remove [product]
    for (const entry of selectedPlans) {
      if ((lower.startsWith("remove") || lower.startsWith("delete")) && lower.includes(entry.plan.name.toLowerCase())) {
        handleRemovePlan(entry.plan.id)
        return
      }
    }

    // set customer to [name] (with email [email])
    const custMatch = lower.match(/set customer to (.+?)(?:\s+with email (.+))?$/)
    if (custMatch) {
      setCustomer({ name: custMatch[1].trim(), email: custMatch[2]?.trim() ?? "" })
      return
    }

    // set currency to [XXX]
    const currMatch = lower.match(/set currency to ([a-z]{3})/i)
    if (currMatch) {
      setCurrency(currMatch[1].toUpperCase())
      return
    }

    // set [product] to $[price]
    const priceMatch = lower.match(/set (.+?) to \$?([\d,]+(?:\.\d+)?)/)
    if (priceMatch) {
      const ref = priceMatch[1].trim()
      const price = parseFloat(priceMatch[2].replace(",", ""))
      const entry = selectedPlans.find(p => p.plan.name.toLowerCase().includes(ref))
      if (entry) {
        const override: PriceOverride = {
          id: `override-${Date.now()}`,
          startDate: entry.startDate,
          endDate: entry.endDate,
          price: String(price),
        }
        handleAddPriceOverride(entry.plan.id, override)
      }
      return
    }

    // add a [N]% discount to [product]
    const discountMatch = lower.match(/add (?:a )?(\d+)% discount to (.+)/)
    if (discountMatch) {
      const pct = parseInt(discountMatch[1])
      const ref = discountMatch[2].trim()
      const entry = selectedPlans.find(p => p.plan.name.toLowerCase().includes(ref)) ?? selectedPlans[0]
      if (entry) {
        const discount: Discount = {
          id: `discount-${Date.now()}`,
          name: `${pct}% discount`,
          percentage: pct,
          startDate: entry.startDate,
          endDate: entry.endDate,
          scope: "everything",
          appliedItemIds: [],
        }
        handleAddDiscount(entry.plan.id, discount)
      }
    }

    // shift contract start to [YYYY-MM-DD] — shifts ALL plan dates by the delta
    const shiftMatch = lower.match(/(?:shift|move|set|change).*start.*?(\d{4}-\d{2}-\d{2}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{4})/i)
    if (shiftMatch) {
      const rawDate = shiftMatch[1]
      const parsed = new Date(rawDate)
      if (!isNaN(parsed.getTime())) {
        const newStart = formatDateValue(parsed)
        setSelectedPlans(prev => {
          if (!prev.length) return prev
          const oldStart = new Date(prev[0].startDate).getTime()
          const deltaMs = parsed.getTime() - oldStart
          return prev.map(p => ({
            ...p,
            startDate: formatDateValue(new Date(new Date(p.startDate).getTime() + deltaMs)),
            endDate: formatDateValue(new Date(new Date(p.endDate).getTime() + deltaMs)),
          }))
        })
        void newStart
      }
    }
  }, [selectedPlans, handleAddPlan, handleRemovePlan, handleAddPriceOverride, handleAddDiscount])

  // Create a brand-new discount from the "Add → Discount" menu and open its
  // form so it can be filled out. Attaches to the first plan with sensible
  // defaults (whole-contract scope, runs the plan's full term).
  const handleCreateDiscount = useCallback(() => {
    setSelectedPlans(prev => {
      if (prev.length === 0) return prev
      const target = prev[0]
      const newDiscount: Discount = {
        id: `discount-${Date.now()}`,
        name: "",
        percentage: 10,
        startDate: target.startDate,
        endDate: target.endDate,
        scope: "everything",
        appliedItemIds: [],
      }
      // Focus the newly created discount's own tree node so its form opens.
      setSelectedNodeId(`discount-${target.plan.id}-${newDiscount.id}`)
      return prev.map((p, i) => (i === 0 ? { ...p, discounts: [...p.discounts, newDiscount] } : p))
    })
    setHasScheduled(true)
    setShowPlanSelector(false)
  }, [])

  const handleUpdateDiscount = useCallback((planId: string, discountId: string, updates: Partial<Discount>) => {
    setSelectedPlans(prev => prev.map(p =>
      p.plan.id === planId
        ? { ...p, discounts: p.discounts.map(d => d.id === discountId ? { ...d, ...updates } : d) }
        : p
    ))
  }, [])

  const handleRemoveDiscount = useCallback((planId: string, discountId: string) => {
    setSelectedPlans(prev => prev.map(p =>
      p.plan.id === planId
        ? { ...p, discounts: p.discounts.filter(d => d.id !== discountId) }
        : p
    ))
    setSelectedNodeId("contract-root")
  }, [])

  const handleUpdatePriceOverride = useCallback((planId: string, overrideId: string, updates: Partial<PriceOverride>) => {
    setSelectedPlans(prev => prev.map(p => 
      p.plan.id === planId 
        ? { 
            ...p, 
            priceOverrides: p.priceOverrides.map(o => 
              o.id === overrideId ? { ...o, ...updates } : o
            ) 
          }
        : p
    ))
  }, [])

  const handleUpdateQuantityUpdate = useCallback((planId: string, quId: string, updates: Partial<QuantityUpdate>) => {
    setSelectedPlans(prev => prev.map(p => 
      p.plan.id === planId 
        ? { 
            ...p, 
            quantityUpdates: p.quantityUpdates.map(q => 
              q.id === quId ? { ...q, ...updates } : q
            ) 
          }
        : p
    ))
  }, [])

  const handleRemovePriceOverride = useCallback((planId: string, overrideId: string) => {
    setSelectedPlans(prev => prev.map(p => 
      p.plan.id === planId 
        ? { ...p, priceOverrides: p.priceOverrides.filter(o => o.id !== overrideId) }
        : p
    ))
    setSelectedNodeId(`plan-${planId}`)
  }, [])

  const handleRemoveQuantityUpdate = useCallback((planId: string, quId: string) => {
    setSelectedPlans(prev => prev.map(p => 
      p.plan.id === planId 
        ? { ...p, quantityUpdates: p.quantityUpdates.filter(q => q.id !== quId) }
        : p
    ))
    setSelectedNodeId(`plan-${planId}`)
  }, [])

  const handleSave = useCallback(() => {
    // Calculate contract value
    const totalValue = selectedPlans.reduce((sum, p) => {
      const months = 24 // Approximate
      return sum + (p.plan.defaultMonthlyPrice * p.quantity * months)
    }, 0)

    const planLines: V4PlanLine[] = selectedPlans.map(p => ({
      id: p.plan.id,
      name: p.plan.name,
      monthlyPrice: p.plan.defaultMonthlyPrice,
      quantity: p.quantity,
      startDate: p.startDate,
      endDate: p.endDate,
      priceOverrides: p.priceOverrides.map(o => ({
        id: o.id,
        startDate: o.startDate,
        endDate: o.endDate,
        price: o.price,
      })),
      quantityUpdates: p.quantityUpdates.map(q => ({
        id: q.id,
        effectiveDate: q.effectiveDate,
        quantity: q.quantity,
      })),
      discounts: p.discounts.map(d => ({
        id: d.id,
        name: d.name,
        percentage: d.percentage,
        startDate: d.startDate,
        endDate: d.endDate,
        scope: d.scope,
        appliedItemIds: d.appliedItemIds,
      })),
    }))

    const result: NewContractResultV4 = {
      id: contractId,
      status: "Draft",
      startDate: selectedPlans[0]?.startDate || defaultStart,
      endDate: selectedPlans[0]?.endDate || defaultEnd,
      contractValue: `$${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      customer: customer?.name || "",
      email: customer?.email || "",
      billingCadence: "1st of every month at 9:00 AM",
      currency,
      draftExpiry,
      planLines,
    }

    onGetStarted(result)
  }, [contractId, selectedPlans, customer, currency, defaultStart, defaultEnd, draftExpiry, onGetStarted])

  const schedulePlan = scheduleModalPlanId ? selectedPlans.find(p => p.plan.id === scheduleModalPlanId) : null

  const consoleColumnEl = consolePosition !== "off" ? (
    <ContractConsole
      selectedPlans={selectedPlans}
      customer={customer}
      currency={currency}
      draftExpiry={draftExpiry}
      onExecuteCommand={executeContractCommand}
      onDismiss={() => setConsolePosition("off")}
    />
  ) : null

  // "Inline" mode: tree+form in top half, console in bottom half of the same column.
  // When contract is empty, console fills the full height; once content is added it
  // transitions to 50/50 so the editor reveals itself.
  const hasContractContent = selectedPlans.length > 0 || customer !== null

  const inlineLeftColumn = (
    <div className="relative flex flex-col shrink-0 border-r border-[#ebeef1] overflow-hidden" style={{ width: consoleWidth }}>
      {/* Right edge drag handle for width */}
      <div
        className="absolute top-0 right-0 bottom-0 w-1.5 cursor-col-resize z-50 group flex items-center justify-center"
        onPointerDown={e => {
          e.currentTarget.setPointerCapture(e.pointerId)
          widthDragRef.current = { x: e.clientX, width: consoleWidth }
        }}
        onPointerMove={e => {
          if (!widthDragRef.current) return
          const dx = e.clientX - widthDragRef.current.x
          setConsoleWidth(Math.max(300, Math.min(900, widthDragRef.current.width + dx)))
        }}
        onPointerUp={() => { widthDragRef.current = null }}
      >
        <div className="w-0.5 h-8 rounded-full bg-[#2a2a2a] group-hover:bg-[#533AFD] transition-colors" />
      </div>
      <div
        className="flex overflow-hidden min-h-0"
        style={{
          height: hasContractContent ? `${100 - consoleHeight}%` : "0%",
          transition: "height 0.4s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <TreeSidebar
          contractId={contractId}
          customer={customer}
          selectedPlans={selectedPlans}
          oneTimeFees={oneTimeFees}
          selectedNodeId={selectedNodeId}
          onSelectNode={handleSelectNode}
          expandedNodes={expandedNodes}
          onToggleExpand={handleToggleExpand}
          filterText={filterText}
          onFilterChange={setFilterText}
          onAddPriceOverride={(planId) => {
            const plan = selectedPlans.find(p => p.plan.id === planId)
            if (plan) {
              const newOverride = smartPriceOverride(plan)
              handleAddPriceOverride(planId, newOverride)
              setSelectedNodeId(`plan-${planId}-override-${newOverride.id}`)
            }
          }}
          onAddQuantityUpdate={(planId) => {
            const plan = selectedPlans.find(p => p.plan.id === planId)
            if (plan) {
              const newUpdate = smartQuantityUpdate(plan)
              handleAddQuantityUpdate(planId, newUpdate)
              setSelectedNodeId(`plan-${planId}-qty-${newUpdate.id}`)
            }
          }}
          onShowAddMenu={() => setShowPlanSelector(true)}
          scheduleMenuPlanId={scheduleMenuPlanId}
          setScheduleMenuPlanId={setScheduleMenuPlanId}
        />
        <FormPanel
          selectedNodeId={selectedNodeId}
          selectedPlans={selectedPlans}
          hideScheduleModule={hasScheduled || consolePosition === "inline" || consolePosition === "right"}
          contractId={contractId}
          customer={customer}
          currency={currency}
          draftExpiry={draftExpiry}
          language={language}
          billingMethod={billingMethod}
          paymentMethod={paymentMethod}
          oneTimeFees={oneTimeFees}
          onUpdateContractId={setContractId}
          onUpdateCustomer={setCustomer}
          onUpdateCurrency={setCurrency}
          onUpdateDraftExpiry={setDraftExpiry}
          onUpdateLanguage={setLanguage}
          onUpdateBillingMethod={setBillingMethod}
          onUpdatePaymentMethod={setPaymentMethod}
          onUpdatePlan={handleUpdatePlan}
          onApplyEndDateToAll={handleApplyEndDateToAll}
          onApplyStartDateToAll={handleApplyStartDateToAll}
          onAddPriceOverride={(planId) => {
            const plan = selectedPlans.find(p => p.plan.id === planId)
            if (plan) {
              const newOverride = smartPriceOverride(plan)
              handleAddPriceOverride(planId, newOverride)
              setSelectedNodeId(`plan-${planId}-override-${newOverride.id}`)
            }
          }}
          onAddQuantityUpdate={(planId) => {
            const plan = selectedPlans.find(p => p.plan.id === planId)
            if (plan) {
              const newUpdate = smartQuantityUpdate(plan)
              handleAddQuantityUpdate(planId, newUpdate)
              setSelectedNodeId(`plan-${planId}-qty-${newUpdate.id}`)
            }
          }}
          onRemovePlan={handleRemovePlan}
          onShowScheduleModal={(planId) => setScheduleModalPlanId(planId)}
          onUpdatePriceOverride={handleUpdatePriceOverride}
          onUpdateQuantityUpdate={handleUpdateQuantityUpdate}
          onRemovePriceOverride={handleRemovePriceOverride}
          onRemoveQuantityUpdate={handleRemoveQuantityUpdate}
          onUpdateDiscount={handleUpdateDiscount}
          onRemoveDiscount={handleRemoveDiscount}
          onOpenScheduleInTree={(planId) => {
            setSelectedNodeId(`plan-${planId}`)
            setExpandedNodes(prev => new Set([...prev, `plan-${planId}`]))
            setScheduleMenuPlanId(planId)
          }}
          onSelectNode={handleSelectNode}
          onUpdateOneTimeFee={handleUpdateOneTimeFee}
          onRemoveOneTimeFee={handleRemoveOneTimeFee}
          onQuantityFocus={setQuantityFocusedPlanId}
        />
      </div>
      {hasContractContent && (
        <div
          className="shrink-0 h-1 cursor-row-resize group flex items-center justify-center bg-[#111] hover:bg-[#533AFD]/40 transition-colors z-30"
          onPointerDown={e => {
            e.currentTarget.setPointerCapture(e.pointerId)
            heightDragRef.current = {
              y: e.clientY,
              height: consoleHeight,
              containerH: e.currentTarget.parentElement?.clientHeight ?? 600,
            }
          }}
          onPointerMove={e => {
            if (!heightDragRef.current) return
            const { y, height, containerH } = heightDragRef.current
            const dy = e.clientY - y
            setConsoleHeight(Math.max(15, Math.min(85, Math.round(height - (dy / containerH) * 100))))
          }}
          onPointerUp={() => { heightDragRef.current = null }}
        >
          <div className="w-8 h-0.5 rounded-full bg-[#2a2a2a] group-hover:bg-[#533AFD] transition-colors" />
        </div>
      )}
      <div
        className="flex overflow-hidden"
        style={{
          height: hasContractContent ? `${consoleHeight}%` : "100%",
          borderTop: hasContractContent ? "1px solid #1c1c1c" : "none",
          transition: "height 0.4s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {consoleColumnEl}
      </div>
    </div>
  )

  const persistentOverlay = (
    <>
      {!showControlPanel && (
        consolePosition === "off" ? (
          <button
            onClick={() => setConsolePosition("right")}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/80 backdrop-blur-sm text-white text-[11px] font-medium hover:bg-black transition-colors cursor-pointer select-none"
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><rect x="0.5" y="0.5" width="10" height="10" rx="2.5" stroke="white" strokeOpacity="0.7"/><path d="M2.5 4h6M2.5 5.5h4M2.5 7h4.5" stroke="white" strokeOpacity="0.7" strokeWidth="1.1" strokeLinecap="round"/></svg>
            AI Console
          </button>
        ) : (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm text-white text-[11px] font-medium pointer-events-none select-none">
            <kbd className="font-sans">⌘</kbd><kbd className="font-sans">/</kbd>
            <span className="text-white/60">options</span>
          </div>
        )
      )}
      {showControlPanel && (
        <ControlPanel
          onClose={() => setShowControlPanel(false)}
          consolePosition={consolePosition}
          setConsolePosition={setConsolePosition}
          consoleHeight={consoleHeight}
          setConsoleHeight={setConsoleHeight}
          consoleWidth={consoleWidth}
          setConsoleWidth={setConsoleWidth}
          timelineView={timelineView}
          setTimelineView={setTimelineView}
          layoutMode={layoutMode}
          setLayoutMode={setLayoutMode}
          aiMode={aiMode}
          setAiMode={setAiMode}
        />
      )}
    </>
  )

  // Only show GetStartedScreen when console is off — when console is active
  // it replaces the onboarding flow entirely.
  if (!config && consolePosition === "off") {
    return (
      <>
        <GetStartedScreen
          contractId={contractId}
          onContinue={handleContinue}
          onDiscard={onDiscard}
        />
        {persistentOverlay}
      </>
    )
  }

  // Shared sub-trees extracted to avoid repeating them across layout modes.
  const editorHeader = (
    <div className="flex items-center justify-between h-14 px-5 border-b border-[#ebeef1] shrink-0">
      <h1 className="text-sm font-semibold text-[#353A44]">Contract {contractId}</h1>
      <div className="flex items-center gap-2">
        {consolePosition === "off" && (
          <button
            onClick={() => setConsolePosition("right")}
            className="px-3 py-1.5 rounded-md border border-[#d8dee4] bg-white hover:bg-[#f5f6f8] text-sm font-medium text-[#353A44] transition-colors flex items-center gap-1.5"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="0.5" y="0.5" width="11" height="11" rx="2.5" stroke="currentColor"/><path d="M3 4.5h6M3 6h4M3 7.5h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
            AI Console
          </button>
        )}
        <button
          onClick={onDiscard}
          className="px-3 py-1.5 rounded-md border border-[#d8dee4] bg-white hover:bg-[#f5f6f8] text-sm font-medium text-[#353A44] transition-colors"
        >
          Discard
        </button>
        <button
          onClick={() => (isExistingContract ? setShowConfirm(true) : handleSave())}
          className="px-3 py-1.5 rounded-md bg-[#533AFD] hover:bg-[#4730E0] text-sm font-medium text-white transition-colors"
        >
          Save draft contract
        </button>
      </div>
    </div>
  )

  const leftColumn = (
    <div className="relative flex flex-col shrink-0 border-r border-[#ebeef1] overflow-hidden" style={{ width: consoleWidth }}>
      {/* "Over" mode: console overlays this column */}
      {consolePosition === "over" && (
        <div className="absolute inset-0 z-20 flex">
          <div className="w-[400px] h-full shrink-0">{consoleColumnEl}</div>
          <button
            className="flex-1 bg-black/30 cursor-default"
            onClick={() => setConsolePosition("off")}
            aria-label="Close console"
          />
        </div>
      )}
      <div className="flex flex-1 overflow-hidden min-h-0">
        <TreeSidebar
          contractId={contractId}
          customer={customer}
          selectedPlans={selectedPlans}
          oneTimeFees={oneTimeFees}
          selectedNodeId={selectedNodeId}
          onSelectNode={handleSelectNode}
          expandedNodes={expandedNodes}
          onToggleExpand={handleToggleExpand}
          filterText={filterText}
          onFilterChange={setFilterText}
          onAddPriceOverride={(planId) => {
            const plan = selectedPlans.find(p => p.plan.id === planId)
            if (plan) {
              const newOverride = smartPriceOverride(plan)
              handleAddPriceOverride(planId, newOverride)
              setSelectedNodeId(`plan-${planId}-override-${newOverride.id}`)
            }
          }}
          onAddQuantityUpdate={(planId) => {
            const plan = selectedPlans.find(p => p.plan.id === planId)
            if (plan) {
              const newUpdate = smartQuantityUpdate(plan)
              handleAddQuantityUpdate(planId, newUpdate)
              setSelectedNodeId(`plan-${planId}-qty-${newUpdate.id}`)
            }
          }}
          onShowAddMenu={() => setShowPlanSelector(true)}
          scheduleMenuPlanId={scheduleMenuPlanId}
          setScheduleMenuPlanId={setScheduleMenuPlanId}
        />
        <FormPanel
          selectedNodeId={selectedNodeId}
          selectedPlans={selectedPlans}
          hideScheduleModule={hasScheduled || consolePosition === "inline" || consolePosition === "right"}
          contractId={contractId}
          customer={customer}
          currency={currency}
          draftExpiry={draftExpiry}
          language={language}
          billingMethod={billingMethod}
          paymentMethod={paymentMethod}
          oneTimeFees={oneTimeFees}
          onUpdateContractId={setContractId}
          onUpdateCustomer={setCustomer}
          onUpdateCurrency={setCurrency}
          onUpdateDraftExpiry={setDraftExpiry}
          onUpdateLanguage={setLanguage}
          onUpdateBillingMethod={setBillingMethod}
          onUpdatePaymentMethod={setPaymentMethod}
          onUpdatePlan={handleUpdatePlan}
          onApplyEndDateToAll={handleApplyEndDateToAll}
          onApplyStartDateToAll={handleApplyStartDateToAll}
          onAddPriceOverride={(planId) => {
            const plan = selectedPlans.find(p => p.plan.id === planId)
            if (plan) {
              const newOverride = smartPriceOverride(plan)
              handleAddPriceOverride(planId, newOverride)
              setSelectedNodeId(`plan-${planId}-override-${newOverride.id}`)
            }
          }}
          onAddQuantityUpdate={(planId) => {
            const plan = selectedPlans.find(p => p.plan.id === planId)
            if (plan) {
              const newUpdate = smartQuantityUpdate(plan)
              handleAddQuantityUpdate(planId, newUpdate)
              setSelectedNodeId(`plan-${planId}-qty-${newUpdate.id}`)
            }
          }}
          onRemovePlan={handleRemovePlan}
          onShowScheduleModal={(planId) => setScheduleModalPlanId(planId)}
          onUpdatePriceOverride={handleUpdatePriceOverride}
          onUpdateQuantityUpdate={handleUpdateQuantityUpdate}
          onRemovePriceOverride={handleRemovePriceOverride}
          onRemoveQuantityUpdate={handleRemoveQuantityUpdate}
          onUpdateDiscount={handleUpdateDiscount}
          onRemoveDiscount={handleRemoveDiscount}
          onOpenScheduleInTree={(planId) => {
            setSelectedNodeId(`plan-${planId}`)
            setExpandedNodes(prev => new Set([...prev, `plan-${planId}`]))
            setScheduleMenuPlanId(planId)
          }}
          onSelectNode={handleSelectNode}
          onUpdateOneTimeFee={handleUpdateOneTimeFee}
          onRemoveOneTimeFee={handleRemoveOneTimeFee}
          onQuantityFocus={setQuantityFocusedPlanId}
        />
      </div>
      {consolePosition !== "inline" && (
        <EditorAssistant
          selectedPlans={selectedPlans}
          selectedNodeId={selectedNodeId}
          customer={customer}
          currency={currency}
          draftExpiry={draftExpiry}
          onSelectNode={handleSelectNode}
          onUpdatePlan={handleUpdatePlan}
          onApplyEndDateToAll={handleApplyEndDateToAll}
          onApplyStartDateToAll={handleApplyStartDateToAll}
          onAddPriceOverride={handleAddPriceOverride}
          onAddQuantityUpdate={handleAddQuantityUpdate}
          onAddDiscount={handleAddDiscount}
          onUpdateDiscount={handleUpdateDiscount}
          onRemoveDiscount={handleRemoveDiscount}
          onAddPlan={handleAddPlan}
          onRemovePlan={handleRemovePlan}
          onUpdateCustomer={setCustomer}
          onUpdateCurrency={setCurrency}
          onUpdateDraftExpiry={setDraftExpiry}
        />
      )}
    </div>
  )

  const timeline = timelineView === "cashflow" ? (
    <BillingTimelineV2
      selectedPlans={resolvedPlans}
      selectedNodeId={selectedNodeId}
      onSelectNode={handleSelectNode}
      currency={currency}
      contractId={contractId}
      customer={customer}
      draftExpiry={draftExpiry}
      billingMethod={billingMethod}
    />
  ) : (
    <TimelineVisualization
      selectedPlans={resolvedPlans}
      selectedNodeId={selectedNodeId}
      onSelectNode={handleSelectNode}
      onShowInvoicePreview={(date) => setInvoicePreviewDate(date)}
      contractId={contractId}
      customer={customer}
      currency={currency}
      draftExpiry={draftExpiry}
      billingMethod={billingMethod}
      quantityFocusedPlanId={quantityFocusedPlanId}
    />
  )

  const modals = (
    <>
      {showPlanSelector && (
        <PlanSelectorModal
          onClose={() => setShowPlanSelector(false)}
          onSelectPlan={handleAddPlan}
          onAddDiscount={handleCreateDiscount}
          onAddMarkup={handleCreateMarkup}
          onAddOneTimeFee={handleAddOneTimeFee}
          canAddDiscount={selectedPlans.length > 0}
          existingPlanIds={selectedPlans.map(p => p.plan.id)}
        />
      )}
      {scheduleModalPlanId && schedulePlan && (
        <ScheduleModal
          planId={scheduleModalPlanId}
          plan={schedulePlan}
          onClose={() => setScheduleModalPlanId(null)}
          onAddPriceOverride={handleAddPriceOverride}
          onAddQuantityUpdate={handleAddQuantityUpdate}
          onAddDiscount={handleAddDiscount}
        />
      )}
      {invoicePreviewDate && (
        <InvoicePreviewModal
          date={invoicePreviewDate}
          selectedPlans={resolvedPlans}
          customer={customer}
          currency={currency}
          onClose={() => setInvoicePreviewDate(null)}
        />
      )}
      {showConfirm && (
        <ConfirmSaveModal
          contractId={contractId}
          customer={customer}
          currency={currency}
          selectedPlans={resolvedPlans}
          onClose={() => setShowConfirm(false)}
          onConfirm={() => { setShowConfirm(false); handleSave() }}
        />
      )}
    </>
  )

  // The main column: console replaces tree+form when console mode is active
  const mainColumn = consolePosition === "inline"
    ? inlineLeftColumn
    : consolePosition === "left" || consolePosition === "l+hdr"
      ? (
        <div className="flex shrink-0 border-r border-[#ebeef1] overflow-hidden relative" style={{ width: consoleWidth }}>
          {consoleColumnEl}
          <div
            className="absolute top-0 right-0 bottom-0 w-1.5 cursor-col-resize z-50 group flex items-center justify-center"
            onPointerDown={e => {
              e.currentTarget.setPointerCapture(e.pointerId)
              widthDragRef.current = { x: e.clientX, width: consoleWidth }
            }}
            onPointerMove={e => {
              if (!widthDragRef.current) return
              const dx = e.clientX - widthDragRef.current.x
              setConsoleWidth(Math.max(300, Math.min(900, widthDragRef.current.width + dx)))
            }}
            onPointerUp={() => { widthDragRef.current = null }}
          >
            <div className="w-0.5 h-8 rounded-full bg-[#d4d8e0] group-hover:bg-[#3BABFD] transition-colors" />
          </div>
        </div>
      )
      : leftColumn

  // Mobile layout — stacks preview on top, action panel on bottom
  if (isMobile) {
    const mobileBottomPanel = consolePosition !== "off" ? (
      <div className="shrink-0 flex flex-col overflow-hidden" style={{ height: "50%" }}>
        {consoleColumnEl}
      </div>
    ) : mobileBottomView === "form" && selectedNodeId ? (
      <div className="shrink-0 flex flex-col overflow-hidden border-t border-[#ebeef1] bg-white" style={{ height: "55%" }}>
        <div className="flex items-center gap-2 px-4 h-11 border-b border-[#ebeef1] shrink-0">
          <button
            onClick={() => { setMobileBottomView("tree"); setSelectedNodeId("contract-root") }}
            className="flex items-center gap-1.5 text-sm text-[#533AFD] font-medium"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Overview
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <FormPanel
            selectedNodeId={selectedNodeId}
            selectedPlans={selectedPlans}
            hideScheduleModule={hasScheduled}
            contractId={contractId}
            customer={customer}
            currency={currency}
            draftExpiry={draftExpiry}
            language={language}
            billingMethod={billingMethod}
            paymentMethod={paymentMethod}
            oneTimeFees={oneTimeFees}
            onUpdateContractId={setContractId}
            onUpdateCustomer={setCustomer}
            onUpdateCurrency={setCurrency}
            onUpdateDraftExpiry={setDraftExpiry}
            onUpdateLanguage={setLanguage}
            onUpdateBillingMethod={setBillingMethod}
            onUpdatePaymentMethod={setPaymentMethod}
            onUpdatePlan={handleUpdatePlan}
            onApplyEndDateToAll={handleApplyEndDateToAll}
            onApplyStartDateToAll={handleApplyStartDateToAll}
            onAddPriceOverride={(planId) => {
              const plan = selectedPlans.find(p => p.plan.id === planId)
              if (plan) {
                const newOverride = smartPriceOverride(plan)
                handleAddPriceOverride(planId, newOverride)
                setSelectedNodeId(`plan-${planId}-override-${newOverride.id}`)
              }
            }}
            onAddQuantityUpdate={(planId) => {
              const plan = selectedPlans.find(p => p.plan.id === planId)
              if (plan) {
                const newUpdate = smartQuantityUpdate(plan)
                handleAddQuantityUpdate(planId, newUpdate)
                setSelectedNodeId(`plan-${planId}-qty-${newUpdate.id}`)
              }
            }}
            onRemovePlan={handleRemovePlan}
            onShowScheduleModal={(planId) => setScheduleModalPlanId(planId)}
            onUpdatePriceOverride={handleUpdatePriceOverride}
            onUpdateQuantityUpdate={handleUpdateQuantityUpdate}
            onRemovePriceOverride={handleRemovePriceOverride}
            onRemoveQuantityUpdate={handleRemoveQuantityUpdate}
            onUpdateDiscount={handleUpdateDiscount}
            onRemoveDiscount={handleRemoveDiscount}
            onOpenScheduleInTree={(planId) => {
              setSelectedNodeId(`plan-${planId}`)
              setExpandedNodes(prev => new Set([...prev, `plan-${planId}`]))
              setScheduleMenuPlanId(planId)
            }}
            onSelectNode={handleSelectNode}
            onUpdateOneTimeFee={handleUpdateOneTimeFee}
            onRemoveOneTimeFee={handleRemoveOneTimeFee}
            onQuantityFocus={setQuantityFocusedPlanId}
          />
        </div>
      </div>
    ) : (
      <div className="shrink-0 flex flex-col overflow-hidden border-t border-[#ebeef1] bg-white" style={{ height: "50%" }}>
        <TreeSidebar
          contractId={contractId}
          customer={customer}
          selectedPlans={selectedPlans}
          oneTimeFees={oneTimeFees}
          selectedNodeId={selectedNodeId}
          onSelectNode={handleSelectNode}
          expandedNodes={expandedNodes}
          onToggleExpand={handleToggleExpand}
          filterText={filterText}
          onFilterChange={setFilterText}
          onAddPriceOverride={(planId) => {
            const plan = selectedPlans.find(p => p.plan.id === planId)
            if (plan) {
              const newOverride = smartPriceOverride(plan)
              handleAddPriceOverride(planId, newOverride)
              setSelectedNodeId(`plan-${planId}-override-${newOverride.id}`)
            }
          }}
          onAddQuantityUpdate={(planId) => {
            const plan = selectedPlans.find(p => p.plan.id === planId)
            if (plan) {
              const newUpdate = smartQuantityUpdate(plan)
              handleAddQuantityUpdate(planId, newUpdate)
              setSelectedNodeId(`plan-${planId}-qty-${newUpdate.id}`)
            }
          }}
          onShowAddMenu={() => setShowPlanSelector(true)}
          scheduleMenuPlanId={scheduleMenuPlanId}
          setScheduleMenuPlanId={setScheduleMenuPlanId}
          className="flex-1 min-w-0 border-r-0"
        />
      </div>
    )

    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-white">
        {editorHeader}
        <div className="flex-1 min-h-0 overflow-hidden">
          {timeline}
        </div>
        {mobileBottomPanel}
        {modals}
        {persistentOverlay}
      </div>
    )
  }

  // "L+Hdr" — console spans full height including the header row
  if (consolePosition === "l+hdr") {
    return (
      <div className="fixed inset-0 z-50 flex flex-row bg-white">
        <div className="flex shrink-0 h-full relative" style={{ width: consoleWidth }}>
          {consoleColumnEl}
          <div
            className="absolute top-0 right-0 bottom-0 w-1.5 cursor-col-resize z-50 group flex items-center justify-center"
            onPointerDown={e => {
              e.currentTarget.setPointerCapture(e.pointerId)
              widthDragRef.current = { x: e.clientX, width: consoleWidth }
            }}
            onPointerMove={e => {
              if (!widthDragRef.current) return
              const dx = e.clientX - widthDragRef.current.x
              setConsoleWidth(Math.max(300, Math.min(900, widthDragRef.current.width + dx)))
            }}
            onPointerUp={() => { widthDragRef.current = null }}
          >
            <div className="w-0.5 h-8 rounded-full bg-[#2a2a2a] group-hover:bg-[#533AFD] transition-colors" />
          </div>
        </div>
        <div className="flex flex-col flex-1 overflow-hidden">
          {editorHeader}
          <div className="flex flex-1 overflow-hidden">
            {timeline}
          </div>
          {modals}
        </div>
        {persistentOverlay}
      </div>
    )
  }

  // Shared contract state snapshot passed to AI mode overlays
  const aiContractState: AiContractState = {
    contractId,
    customer,
    currency,
    plans: selectedPlans.map(e => ({
      name: e.plan.name,
      monthlyPrice: e.plan.defaultMonthlyPrice,
      quantity: e.quantity,
      startDate: e.startDate,
      endDate: e.endDate,
    })),
  }

  function handleAiApply(action: AiAction) {
    if (action.type === "set_customer") setCustomer({ name: action.name, email: action.email })
    else if (action.type === "set_currency") setCurrency(action.value)
  }

  // "Left", "Right", "Over", and "Off"
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {editorHeader}
      <div className="flex flex-1 overflow-hidden">
        {layoutMode !== "north-star" && mainColumn}
        <div className="relative flex-1 overflow-hidden flex">
          {/* Collapse / expand affordance */}
          <button
            onClick={() => setLayoutMode(layoutMode === "north-star" ? "split" : "north-star")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-30 h-10 w-4 bg-white border-y border-r border-[#ebeef1] rounded-r flex items-center justify-center hover:bg-[#f5f6f8] transition-colors shadow-sm"
            title={layoutMode === "north-star" ? "Show editor" : "Hide editor"}
          >
            {layoutMode === "north-star"
              ? <ChevronRight className="w-2.5 h-2.5 text-[#9aa0ac]" />
              : <ChevronLeft className="w-2.5 h-2.5 text-[#9aa0ac]" />
            }
          </button>
          <div className="flex-1 overflow-hidden">
            {timeline}
          </div>
        </div>
        {consolePosition === "right" && (
          <div className="relative flex shrink-0 border-l border-[#ebeef1] overflow-hidden" style={{ width: consoleWidth }}>
            {consoleColumnEl}
            <div
              className="absolute top-0 left-0 bottom-0 w-1.5 cursor-col-resize z-50 group flex items-center justify-center"
              onPointerDown={e => {
                e.currentTarget.setPointerCapture(e.pointerId)
                widthDragRef.current = { x: e.clientX, width: consoleWidth }
              }}
              onPointerMove={e => {
                if (!widthDragRef.current) return
                const dx = e.clientX - widthDragRef.current.x
                setConsoleWidth(Math.max(300, Math.min(900, widthDragRef.current.width - dx)))
              }}
              onPointerUp={() => { widthDragRef.current = null }}
            >
              <div className="w-0.5 h-8 rounded-full bg-[#d4d8e0] group-hover:bg-[#3BABFD] transition-colors" />
            </div>
          </div>
        )}
      </div>
      {modals}
      {persistentOverlay}
      {aiMode === "ghosting" && <AiGhostingOverlay state={aiContractState} onApply={handleAiApply} />}
      {aiMode === "cmd-k" && <AiCommandBarOverlay state={aiContractState} onApply={handleAiApply} />}
      {aiMode === "review" && <AiReviewPanel state={aiContractState} />}
      {aiMode === "console" && <AiConsoleOverlay state={aiContractState} />}
    </div>
  )
}
