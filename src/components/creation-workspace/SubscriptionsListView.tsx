'use client'

import { useState, useRef } from "react"
import { cn } from "@/lib/utils"
import type { SubscriptionRecord } from "@/lib/subscriptions"

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-[#eafcdd] text-[#2b8700] border border-[#a8f170]/50" },
  Active: { label: "Active", className: "bg-[#eafcdd] text-[#2b8700] border border-[#a8f170]/50" },
  trialing: { label: "Trialing", className: "bg-[#EEF1FF] text-[#533AFD] border border-[#533AFD]/20" },
  past_due: { label: "Past due", className: "bg-[#FFF4E5] text-[#B45309] border border-[#fbd992]/50" },
  canceled: { label: "Canceled", className: "bg-[#fef4f6] text-[#e61947] border border-[#fbd3dc]/50" },
  Canceled: { label: "Canceled", className: "bg-[#fef4f6] text-[#e61947] border border-[#fbd3dc]/50" },
  incomplete: { label: "Incomplete", className: "bg-[#FFF4E5] text-[#B45309] border border-[#fbd992]/50" },
  Ended: { label: "Ended", className: "bg-[#F5F6F8] text-[#6c7688] border border-[#d8dee4]/50" },
  Draft: { label: "Draft", className: "bg-[#fbd992]/30 text-[#cc4b00] border border-[#fbd992]/50" },
}

function formatDate(dateStr: string) {
  if (!dateStr || dateStr === "—") return "—"
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function getSubscriptionPrice(sub: SubscriptionRecord): string {
  if (!sub.treeData) return "—"
  const allProducts = [
    ...(sub.treeData.products ?? []),
    ...(sub.treeData.priceGroups ?? []).flatMap((pg) => pg.products ?? []),
    ...(sub.treeData.plans ?? []).flatMap((pl) => [
      ...(pl.products ?? []),
      ...(pl.priceGroups ?? []).flatMap((pg) => pg.products ?? []),
    ]),
  ]

  let flatTotal = 0
  let hasUsage = false

  for (const product of allProducts) {
    const price = product.prices?.[0]
    if (!price?.amount) {
      hasUsage = true
      continue
    }
    const num = parseFloat(price.amount)
    if (Number.isNaN(num) || num === 0) {
      hasUsage = true
    } else if (!product.isUsageBased) {
      flatTotal += num
    } else {
      hasUsage = true
    }
  }

  if (flatTotal > 0 && hasUsage) return `$${flatTotal.toFixed(2)}/mo + usage`
  if (flatTotal > 0) return `$${flatTotal.toFixed(2)}/mo`
  if (hasUsage) return "Usage-based"
  return "—"
}

export interface AdvancedSubscription {
  id: string
  status: string
  startDate: string
  endDate: string
  pricing: string
  committedSpend?: string
  customer: string
  email: string
  paymentBrand?: "visa" | "mastercard" | "link"
  paymentLast4?: string
  paymentInitial?: string
}

interface UnifiedRow {
  id: string
  type: "subscription" | "advanced"
  status: string
  startDate: string
  endDate: string
  pricing: string
  committedSpend: string
  customer: string
  email: string
  paymentBrand?: "visa" | "mastercard" | "link"
  paymentLast4?: string
  paymentInitial?: string
  originalSub?: SubscriptionRecord
  originalAdv?: AdvancedSubscription
}

function VisaIcon() {
  return (
    <div className="w-8 h-5 rounded bg-[#00579f] flex items-center justify-center flex-shrink-0">
      <span className="text-white text-[8px] font-bold tracking-tight italic">VISA</span>
    </div>
  )
}

function MastercardIcon() {
  return (
    <div className="w-8 h-5 rounded bg-[#1a1a2e] flex items-center justify-center flex-shrink-0 relative overflow-hidden">
      <div className="absolute left-1 top-0.5 w-4 h-4 rounded-full bg-[#eb001b] opacity-90" />
      <div className="absolute right-1 top-0.5 w-4 h-4 rounded-full bg-[#f79e1b] opacity-90" />
    </div>
  )
}

function LinkIcon() {
  return (
    <div className="w-8 h-5 rounded bg-[#00d66f] flex items-center justify-center flex-shrink-0">
      <span className="text-[#011e0f] text-[7px] font-bold tracking-tight">link</span>
    </div>
  )
}

function PaymentMethod({ brand, last4, initial }: { brand?: "visa" | "mastercard" | "link"; last4?: string; initial?: string }) {
  if (!brand) return <span className="text-[#A0A8B4]">—</span>
  return (
    <div className="flex items-center gap-2">
      {brand === "visa" && <VisaIcon />}
      {brand === "mastercard" && <MastercardIcon />}
      {brand === "link" && <LinkIcon />}
      <span className="text-sm text-[#596171]">···· {last4}</span>
      {initial && (
        <div className="w-5 h-5 rounded-full bg-[#ecf1f6] flex items-center justify-center flex-shrink-0">
          <span className="text-[10px] font-medium text-[#596171]">{initial}</span>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_STYLES[status] ?? { label: status, className: "bg-[#F5F6F8] text-[#6c7688] border border-[#d8dee4]/50" }
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium", config.className)}>
      {config.label}
    </span>
  )
}

export type SubscriptionData = SubscriptionRecord

export function SubscriptionsListView({ subscriptions, onEdit, onDelete, filterOptions, advancedSubscriptions, onAdvancedClick, hideColumns }: {
  subscriptions: SubscriptionRecord[]
  onEdit?: (sub: SubscriptionRecord) => void
  onDelete?: (id: string) => void
  filterOptions?: string[]
  hideColumns?: string[]
  advancedSubscriptions?: AdvancedSubscription[]
  onAdvancedClick?: (adv: AdvancedSubscription) => void
}) {
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const hidden = new Set(hideColumns ?? [])

  const subRows: UnifiedRow[] = subscriptions.map((sub) => ({
    id: sub.id,
    type: "subscription" as const,
    status: sub.status,
    startDate: sub.createdAt,
    endDate: "—",
    pricing: getSubscriptionPrice(sub),
    committedSpend: "—",
    customer: sub.customer,
    email: sub.email ?? "—",
    paymentBrand: sub.paymentBrand,
    paymentLast4: sub.paymentLast4,
    paymentInitial: sub.paymentInitial,
    originalSub: sub,
  }))

  const advRows: UnifiedRow[] = (advancedSubscriptions ?? []).map((adv) => ({
    id: adv.id,
    type: "advanced" as const,
    status: adv.status,
    startDate: adv.startDate,
    endDate: adv.endDate,
    pricing: adv.pricing,
    committedSpend: adv.committedSpend ?? adv.pricing,
    customer: adv.customer,
    email: adv.email,
    paymentBrand: adv.paymentBrand,
    paymentLast4: adv.paymentLast4,
    paymentInitial: adv.paymentInitial,
    originalAdv: adv,
  }))

  // Interleave sub and advanced rows for the full list
  const allRows: UnifiedRow[] = []
  let si = 0, ai = 0
  while (si < subRows.length || ai < advRows.length) {
    if (si < subRows.length) allRows.push(subRows[si++])
    if (ai < advRows.length) allRows.push(advRows[ai++])
  }

  let rows: UnifiedRow[]
  if (!activeFilter) {
    rows = allRows
  } else if (activeFilter === "Subscriptions" || activeFilter === "No commitments") {
    rows = subRows
  } else if (activeFilter === "Advanced subscriptions" || activeFilter === "Subscription agreements" || activeFilter === "Has overrides") {
    rows = advRows
  } else if (activeFilter === "Has commits") {
    rows = advRows.filter((r) => r.committedSpend !== "—")
  } else {
    rows = allRows
  }

  const allSelected = rows.length > 0 && rows.every((r) => selectedRows.has(r.id))
  const someSelected = rows.some((r) => selectedRows.has(r.id))

  function toggleAll() {
    if (allSelected) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(rows.map((r) => r.id)))
    }
  }

  function toggleRow(id: string) {
    const next = new Set(selectedRows)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedRows(next)
  }

  return (
    <div className="pt-6">
      {filterOptions && filterOptions.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <button
            type="button"
            className={cn(
              "px-3 py-1 rounded-full text-sm font-medium transition-colors border",
              !activeFilter ? "bg-[#353A44] text-white border-[#353A44]" : "bg-white text-[#596171] border-[#d8dee4] hover:bg-[#F5F6F8] hover:border-[#B6C0CD]"
            )}
            onClick={() => setActiveFilter(null)}
          >
            All
          </button>
          {filterOptions.map((filter) => (
            <button
              key={filter}
              type="button"
              className={cn(
                "px-3 py-1 rounded-full text-sm font-medium transition-colors border",
                activeFilter === filter ? "bg-[#353A44] text-white border-[#353A44]" : "bg-white text-[#596171] border-[#d8dee4] hover:bg-[#F5F6F8] hover:border-[#B6C0CD]"
              )}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden">
        <table className="w-full text-sm table-fixed">
          <thead>
            <tr className="border-b border-[#EBEEF1]">
              <th className="w-10 px-3 py-3 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected }}
                  onChange={toggleAll}
                  className="w-3.5 h-3.5 rounded border-[#d8dee4] accent-[#533AFD] cursor-pointer"
                />
              </th>
              <th className="px-3 py-3 text-left font-medium text-[#6c7688] text-xs tracking-wide whitespace-nowrap">
                Subscription number
              </th>
              <th className="px-3 py-3 text-left font-medium text-[#6c7688] text-xs tracking-wide whitespace-nowrap">
                Status
              </th>
              <th className="px-3 py-3 text-left font-medium text-[#6c7688] text-xs tracking-wide whitespace-nowrap">
                Start date
              </th>
              {!hidden.has("endDate") && <th className="px-3 py-3 text-left font-medium text-[#6c7688] text-xs tracking-wide whitespace-nowrap">
                End date
              </th>}
              <th className="px-3 py-3 text-left font-medium text-[#6c7688] text-xs tracking-wide whitespace-nowrap">
                Pricing
              </th>
              {!hidden.has("committedSpend") && <th className="px-3 py-3 text-left font-medium text-[#6c7688] text-xs tracking-wide whitespace-nowrap">
                Committed spend
              </th>}
              <th className="px-3 py-3 text-left font-medium text-[#6c7688] text-xs tracking-wide whitespace-nowrap">
                Customer
              </th>
              <th className="px-3 py-3 text-left font-medium text-[#6c7688] text-xs tracking-wide whitespace-nowrap">
                Default payment
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-16 text-center text-sm text-[#A0A8B4]">
                  No subscriptions found
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => {
                    if (row.type === "subscription" && row.originalSub) onEdit?.(row.originalSub)
                    else if (row.type === "advanced" && row.originalAdv) onAdvancedClick?.(row.originalAdv)
                  }}
                  className={cn(
                    "group border-b border-[#EBEEF1] last:border-0 cursor-pointer transition-colors",
                    selectedRows.has(row.id) ? "bg-[#F7F5FD]" : "hover:bg-[#FAFBFC]"
                  )}
                >
                  <td className="w-10 px-3 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedRows.has(row.id)}
                      onChange={() => toggleRow(row.id)}
                      className="w-3.5 h-3.5 rounded border-[#d8dee4] accent-[#533AFD] cursor-pointer"
                    />
                  </td>
                  <td className="px-3 py-3.5">
                    <span className="font-semibold text-[#353A44]">{row.id}</span>
                  </td>
                  <td className="px-3 py-3.5">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-3 py-3.5 text-[#596171] whitespace-nowrap">{formatDate(row.startDate)}</td>
                  {!hidden.has("endDate") && <td className="px-3 py-3.5 text-[#596171] whitespace-nowrap">{formatDate(row.endDate)}</td>}
                  <td className="px-3 py-3.5 text-[#596171] whitespace-nowrap font-medium">{row.pricing}</td>
                  {!hidden.has("committedSpend") && <td className="px-3 py-3.5 text-[#596171] whitespace-nowrap font-medium">{row.committedSpend}</td>}
                  <td className="px-3 py-3.5 text-[#596171] whitespace-nowrap">{row.customer}</td>
                  <td className="px-3 py-3.5">
                    <PaymentMethod brand={row.paymentBrand} last4={row.paymentLast4} initial={row.paymentInitial} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
