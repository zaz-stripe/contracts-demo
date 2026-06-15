'use client'

import { useState } from "react"
import { cn } from "@/lib/utils"
import { ChevronDownTiny } from "@/components/ProductCatalogIcons"
import { CatalogObjectGlyph } from "@/components/product-catalog/iconography"

// ── Shared tree node types ──────────────────────────────────────────

export type TreeNodeType = "subscription" | "plan" | "price-group" | "product" | "price" | "customer" | "credit-grant"

export type TreeNodeId = { type: TreeNodeType; id?: string }

export type PriceNode = {
  id: string
  name: string
  amount?: string
  cadence?: string
  unitLabel?: string
}

export type ProductNode = {
  id: string
  name: string
  prices?: PriceNode[]
  isUsageBased?: boolean
}

export type PriceGroupNode = {
  id: string
  name: string
  products?: ProductNode[]
}

export type PlanNode = {
  id: string
  name: string
  description?: string
  priceGroups?: PriceGroupNode[]
  products?: ProductNode[]
  creditGrants?: { id: string; name: string; amount?: string; period?: string }[]
}

export type CustomerNode = {
  id: string
  name: string
}

export type CatalogTreeData = {
  subscription?: { duration?: string }
  customer?: CustomerNode
  plans?: PlanNode[]
  priceGroups?: PriceGroupNode[]
  products?: ProductNode[]
  creditGrants?: { id: string; name: string; amount?: string; period?: string }[]
}

type CatalogTreeNavProps = {
  data: CatalogTreeData
  activeNode: TreeNodeId
  onSelectNode: (node: TreeNodeId) => void
  onAddItem?: (e: React.MouseEvent) => void
  rootLabel?: string
  rootType: "subscription" | "plan" | "price-group"
}

// ── Shared styling constants ────────────────────────────────────────

const textPrimary = "text-[#353A44]"
const textSecondary = "text-[#6C7688]"
const hoverBg = "hover:bg-[#F4F7FA]"
const activeBg = "bg-[#F7F5FD]"

const rootRowBase = `flex w-full items-center gap-[8px] rounded-[6px] pl-[12px] pr-[8px] py-[4px] text-left text-[12px] font-[500] leading-[16px] tracking-[-0.024px] ${textPrimary}`
const rowBase = `flex w-full items-center gap-[8px] rounded-[6px] px-[8px] py-[4px] text-left text-[12px] font-[400] leading-[16px] ${textPrimary}`

function indentClass(level: number) {
  if (level === 1) return "pl-[20px]"
  if (level === 2) return "pl-[36px]"
  if (level === 3) return "pl-[52px]"
  if (level === 4) return "pl-[68px]"
  return "pl-[84px]"
}

function IconSlot({ children }: { children: React.ReactNode }) {
  return <span className="flex h-[14px] min-w-[14px] shrink-0 items-center justify-center">{children}</span>
}

function PersonIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="6" cy="4" r="2.25" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2.5 11c0-1.93 1.57-3.5 3.5-3.5s3.5 1.57 3.5 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function SubscriptionIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 12 12" fill="none" className={className} aria-hidden="true">
      <path d="M9.86599 8.26403C10.1577 8.10138 10.623 8.10649 10.9051 8.27477C11.1871 8.44313 11.1799 8.71149 10.8885 8.87438L6.63748 11.2474C6.00951 11.5979 5.01096 11.5953 4.38845 11.2416L0.219507 8.87145C-0.0696369 8.70715 -0.0736995 8.43884 0.210718 8.27184C0.495324 8.10504 0.960577 8.10284 1.24978 8.26696L5.42068 10.6371C5.47475 10.6676 5.5615 10.6683 5.61599 10.6381L9.86599 8.26403Z" fill="currentColor" />
      <path d="M9.86599 5.55212C10.1577 5.38945 10.623 5.39455 10.9051 5.56286C11.1871 5.73123 11.1799 5.99958 10.8885 6.16247L6.63748 8.53552C6.00951 8.88598 5.01095 8.88339 4.38845 8.52966L0.219507 6.15954C-0.0696369 5.99523 -0.0736995 5.72692 0.210718 5.55993C0.495331 5.39311 0.96057 5.3909 1.24978 5.55505L5.42068 7.92517C5.47475 7.95564 5.56151 7.95639 5.61599 7.92614L9.86599 5.55212Z" fill="currentColor" />
      <path fillRule="evenodd" clipRule="evenodd" d="M4.37576 0.271845C5.0042 -0.0906524 6.02165 -0.0905775 6.65017 0.271845L10.4138 2.4447C11.0419 2.80755 11.042 3.39533 10.4138 3.75817L6.65017 5.93102C6.02172 6.29325 5.00413 6.29332 4.37576 5.93102L0.612085 3.75817C-0.0160347 3.39533 -0.0159895 2.80755 0.612085 2.4447L4.37576 0.271845ZM5.61208 0.871454C5.55751 0.840175 5.46841 0.840175 5.41384 0.871454L1.65017 3.04431C1.59651 3.07579 1.59633 3.12714 1.65017 3.15856L5.41384 5.33142C5.46835 5.36263 5.55752 5.36258 5.61208 5.33142L9.37576 3.15856C9.42985 3.12711 9.42968 3.07582 9.37576 3.04431L5.61208 0.871454Z" fill="currentColor" />
    </svg>
  )
}

// ── Tree row component ──────────────────────────────────────────────

function TreeRow({ nodeId, activeNode, onSelectNode, label, level, icon, trailing, isExpanded, onToggleExpand }: {
  nodeId: TreeNodeId
  activeNode: TreeNodeId
  onSelectNode: (node: TreeNodeId) => void
  label: string
  level: number
  icon: React.ReactNode
  trailing?: React.ReactNode
  isExpanded?: boolean
  onToggleExpand?: () => void
}) {
  const isActive = activeNode.type === nodeId.type && activeNode.id === nodeId.id
  const isRoot = level === 0

  return (
    <button
      type="button"
      className={cn(
        isRoot ? rootRowBase : rowBase,
        isRoot ? "" : indentClass(level),
        isRoot ? "justify-between" : "",
        isActive ? activeBg : hoverBg,
      )}
      onClick={() => onSelectNode(nodeId)}
    >
      <div className="flex min-w-0 flex-1 items-center justify-start gap-[8px] text-left">
        {!isRoot && onToggleExpand != null ? (
          <span
            role="button"
            tabIndex={-1}
            className="flex w-[12px] shrink-0 items-center justify-center text-[#3C4F69] opacity-0 group-hover/nav:opacity-100 transition-opacity"
            onClick={(e) => { e.stopPropagation(); onToggleExpand() }}
          >
            <ChevronDownTiny className={cn("transition-transform", isExpanded ? "" : "-rotate-90")} />
          </span>
        ) : !isRoot ? (
          <span className="w-[12px] shrink-0" />
        ) : null}
        <IconSlot>{icon}</IconSlot>
        <span className="min-w-0 flex-1 truncate">{label}</span>
      </div>
      {trailing && <span className={cn("text-[11px] font-[400] shrink-0", textSecondary)}>{trailing}</span>}
    </button>
  )
}

// ── Render helpers for each level ───────────────────────────────────

type ExpandState = Record<string, boolean>

function renderPrices(prices: PriceNode[], level: number, activeNode: TreeNodeId, onSelectNode: (node: TreeNodeId) => void) {
  return prices.map((price) => (
    <TreeRow
      key={`price-${price.id}`}
      nodeId={{ type: "price", id: price.id }}
      activeNode={activeNode}
      onSelectNode={onSelectNode}
      label={price.name || [price.cadence, price.amount ? `$${price.amount}` : ""].filter(Boolean).join(" · ") || "Price"}
      level={level}
      icon={<CatalogObjectGlyph kind="price" />}
      trailing={price.amount ? `$${price.amount}` : undefined}
    />
  ))
}

function renderProducts(products: ProductNode[], level: number, activeNode: TreeNodeId, onSelectNode: (node: TreeNodeId) => void, expanded: ExpandState, setExpanded: (fn: (prev: ExpandState) => ExpandState) => void, parentKind?: "plan" | "price-group") {
  return products.map((product) => {
    const hasChildren = product.prices && product.prices.length > 0
    const isExpanded = expanded[`product-${product.id}`] ?? false
    const glyphKind = product.isUsageBased ? "product" : "subscriptionFee"
    return (
      <div key={`product-${product.id}`} className="flex flex-col gap-[2px]">
        <TreeRow
          nodeId={{ type: "product", id: product.id }}
          activeNode={activeNode}
          onSelectNode={onSelectNode}
          label={product.name}
          level={level}
          icon={<CatalogObjectGlyph kind={glyphKind} />}
          isExpanded={isExpanded}
          onToggleExpand={hasChildren ? () => setExpanded((prev) => ({ ...prev, [`product-${product.id}`]: !isExpanded })) : undefined}
        />
        {hasChildren && isExpanded && renderPrices(product.prices!, level + 1, activeNode, onSelectNode)}
      </div>
    )
  })
}

function renderPriceGroups(priceGroups: PriceGroupNode[], level: number, activeNode: TreeNodeId, onSelectNode: (node: TreeNodeId) => void, expanded: ExpandState, setExpanded: (fn: (prev: ExpandState) => ExpandState) => void) {
  return priceGroups.map((pg) => {
    const hasChildren = pg.products && pg.products.length > 0
    const isExpanded = expanded[`pg-${pg.id}`] ?? false
    return (
      <div key={`pg-${pg.id}`} className="flex flex-col gap-[2px]">
        <TreeRow
          nodeId={{ type: "price-group", id: pg.id }}
          activeNode={activeNode}
          onSelectNode={onSelectNode}
          label={pg.name}
          level={level}
          icon={<CatalogObjectGlyph kind="rateCard" />}
          isExpanded={isExpanded}
          onToggleExpand={hasChildren ? () => setExpanded((prev) => ({ ...prev, [`pg-${pg.id}`]: !isExpanded })) : undefined}
        />
        {hasChildren && isExpanded && renderProducts(pg.products!, level + 1, activeNode, onSelectNode, expanded, setExpanded)}
      </div>
    )
  })
}

function renderPlans(plans: PlanNode[], level: number, activeNode: TreeNodeId, onSelectNode: (node: TreeNodeId) => void, expanded: ExpandState, setExpanded: (fn: (prev: ExpandState) => ExpandState) => void) {
  return plans.map((plan) => {
    const hasChildren = (plan.priceGroups && plan.priceGroups.length > 0) || (plan.products && plan.products.length > 0) || (plan.creditGrants && plan.creditGrants.length > 0)
    const isExpanded = expanded[`plan-${plan.id}`] ?? false
    return (
      <div key={`plan-${plan.id}`} className="flex flex-col gap-[2px]">
        <TreeRow
          nodeId={{ type: "plan", id: plan.id }}
          activeNode={activeNode}
          onSelectNode={onSelectNode}
          label={plan.name}
          level={level}
          icon={<CatalogObjectGlyph kind="plan" />}
          isExpanded={isExpanded}
          onToggleExpand={hasChildren ? () => setExpanded((prev) => ({ ...prev, [`plan-${plan.id}`]: !isExpanded })) : undefined}
        />
        {isExpanded && (
          <>
            {plan.priceGroups && plan.priceGroups.length > 0 && renderPriceGroups(plan.priceGroups, level + 1, activeNode, onSelectNode, expanded, setExpanded)}
            {plan.products && plan.products.length > 0 && renderProducts(plan.products, level + 1, activeNode, onSelectNode, expanded, setExpanded, "plan")}
            {plan.creditGrants && plan.creditGrants.length > 0 && plan.creditGrants.map((cg) => (
              <TreeRow
                key={`cg-${cg.id}`}
                nodeId={{ type: "credit-grant", id: cg.id }}
                activeNode={activeNode}
                onSelectNode={onSelectNode}
                label={cg.name}
                level={level + 1}
                icon={<CatalogObjectGlyph kind="creditGrant" />}
              />
            ))}
          </>
        )}
      </div>
    )
  })
}

// ── Main component ──────────────────────────────────────────────────

export function CatalogTreeNav({ data, activeNode, onSelectNode, onAddItem, rootLabel, rootType }: CatalogTreeNavProps) {
  const [expanded, setExpanded] = useState<ExpandState>({})

  return (
    <aside className="group/nav relative z-10 flex h-full w-full flex-col bg-white/[0.97] backdrop-blur-[6px] pt-[12px] sm:w-[280px] sm:min-w-[280px] sm:max-w-[280px] sm:shrink-0 sm:border-r border-[#EBEEF1]">
      <div className="flex min-h-0 flex-1 flex-col gap-[2px]">
        <div className="min-h-0 flex-1 overflow-y-auto px-[8px]">
          <div className="flex flex-col gap-[2px]">
            {/* Root node */}
            <TreeRow
              nodeId={{ type: rootType }}
              activeNode={activeNode}
              onSelectNode={onSelectNode}
              label={rootLabel ?? (rootType === "subscription" ? "Subscription" : rootType === "plan" ? "Plan" : "Price group")}
              level={0}
              icon={
                rootType === "subscription" ? <SubscriptionIcon className="text-[#3C4F69]" /> :
                rootType === "plan" ? <CatalogObjectGlyph kind="plan" /> :
                <CatalogObjectGlyph kind="rateCard" />
              }
              trailing={data.subscription?.duration}
            />

            {/* Customer (subscription only) */}
            {data.customer && (
              <TreeRow
                nodeId={{ type: "customer", id: data.customer.id }}
                activeNode={activeNode}
                onSelectNode={onSelectNode}
                label={data.customer.name}
                level={1}
                icon={<PersonIcon />}
              />
            )}

            {/* Plans */}
            {data.plans && data.plans.length > 0 && renderPlans(data.plans, 1, activeNode, onSelectNode, expanded, setExpanded)}

            {/* Price groups (top-level, not inside a plan) */}
            {data.priceGroups && data.priceGroups.length > 0 && renderPriceGroups(data.priceGroups, 1, activeNode, onSelectNode, expanded, setExpanded)}

            {/* Products (top-level, not inside a price group) */}
            {data.products && data.products.length > 0 && renderProducts(data.products, 1, activeNode, onSelectNode, expanded, setExpanded)}

            {/* Credit grants (top-level, not inside a plan) */}
            {data.creditGrants && data.creditGrants.length > 0 && data.creditGrants.map((cg) => (
              <TreeRow
                key={`cg-${cg.id}`}
                nodeId={{ type: "credit-grant", id: cg.id }}
                activeNode={activeNode}
                onSelectNode={onSelectNode}
                label={cg.name}
                level={1}
                icon={<CatalogObjectGlyph kind="creditGrant" />}
              />
            ))}

            {/* Add item row */}
            {onAddItem && (
              <button
                type="button"
                className={cn(
                  "flex w-full items-center gap-[8px] rounded-[6px] px-[8px] py-[4px] text-left text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#533AFD] hover:bg-[#F5F6F8]",
                  indentClass(1),
                )}
                onClick={(e) => onAddItem(e)}
              >
                <IconSlot>
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M5.75 0.75C5.75 0.335786 5.41421 0 5 0C4.58579 0 4.25 0.335786 4.25 0.75V4.25H0.75C0.335786 4.25 0 4.58579 0 5C0 5.41421 0.335786 5.75 0.75 5.75H4.25V9.25C4.25 9.66421 4.58579 10 5 10C5.41421 10 5.75 9.66421 5.75 9.25V5.75H9.25C9.66421 5.75 10 5.41421 10 5C10 4.58579 9.66421 4.25 9.25 4.25H5.75V0.75Z" fill="#533AFD"/>
                  </svg>
                </IconSlot>
                <span>Add item</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}
