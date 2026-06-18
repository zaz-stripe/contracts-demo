"use client"

import { useMemo, useState, type ReactNode } from "react"
import {
  ChevronRight,
  Copy,
  Pencil,
  MoreHorizontal,
  CreditCard,
  FileText,
  ArrowUpRight,
  Receipt,
  Info,
  Tag,
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface V4PlanLine {
  id: string
  name: string
  monthlyPrice: number
  quantity: number
  startDate: string
  endDate: string
  priceOverrides: {
    id: string
    startDate: string
    endDate: string
    price: string
    // Optional: how the contract price was derived. When omitted, the table
    // computes a "% off sticker" label automatically.
    overrideType?: "Override price" | "Multiplier"
    multiplier?: number
  }[]
  quantityUpdates: { id: string; effectiveDate: string; quantity: number }[]
  discounts?: {
    id: string
    name: string
    percentage: number
    startDate: string
    endDate: string
    scope?: "everything" | "specific"
    appliedItemIds?: string[]
  }[]
}

export interface ContractDetailV4Data {
  id: string
  status: "Draft" | "Active" | "Canceled" | "Ended"
  customer: string
  email: string
  contractValue: string
  startDate: string
  endDate: string
  currency?: string
  billingCadence?: string
  draftExpiry?: string
  planLines?: V4PlanLine[]
}

const TABS = ["Overview", "Pricing lines", "Billing and collections", "Invoices", "Audit log"] as const
type Tab = (typeof TABS)[number]

const statusStyles: Record<string, string> = {
  Active: "bg-[#eafcdd] text-[#2b8700] border border-[#a8f170]/50",
  Canceled: "bg-[#fef4f6] text-[#e61947] border border-[#fbd3dc]/50",
  Ended: "bg-[#F5F6F8] text-[#6c7688] border border-[#d8dee4]/50",
  Draft: "bg-[#fbd992]/30 text-[#cc4b00] border border-[#fbd992]/50",
}

function fmtMoney(n: number, currency = "USD") {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`
}

function fmtDate(value: string) {
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function fmtDateTime(d: Date) {
  return d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })
}

export default function ContractDetailV4({
  data,
  onBack,
  onEdit,
}: {
  data: ContractDetailV4Data
  onBack: () => void
  onEdit?: () => void
}) {
  const [activeTab, setActiveTab] = useState<Tab>("Overview")
  const currency = data.currency || "USD"
  const planLines = useMemo(() => data.planLines ?? [], [data.planLines])

  // Annual contract value derived from the plan lines.
  const annualValue = useMemo(
    () => planLines.reduce((sum, p) => sum + p.monthlyPrice * p.quantity * 12, 0),
    [planLines],
  )
  const monthlyValue = useMemo(
    () => planLines.reduce((sum, p) => sum + p.monthlyPrice * p.quantity, 0),
    [planLines],
  )

  return (
    <div className="flex flex-col min-h-full bg-[#ffffff]">
      {/* Header */}
      <div className="flex gap-[20px] items-start pb-[8px] pt-[24px]">
        <div className="flex flex-1 flex-col gap-[4px] items-start min-w-0">
          {/* Breadcrumb */}
          <div className="flex gap-[8px] items-center">
            <button
              onClick={onBack}
              className="text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#533AFD] hover:underline"
            >
              Agreements
            </button>
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M3 1.5L5.5 4L3 6.5" stroke="#667691" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>

          {/* Title row */}
          <div className="flex gap-[8px] items-center">
            <p className="text-[28px] font-[700] leading-[36px] text-[#1A2C44] truncate" style={{ fontFeatureSettings: "'lnum' 1, 'pnum' 1" }}>Contract #{data.id}</p>
            <span className={cn("inline-flex items-center rounded-[4px] px-[6px] py-[2px] text-[12px] font-[500]", statusStyles[data.status])}>
              {data.status}
            </span>
          </div>

          {/* Email */}
          <p className="text-[16px] font-[400] leading-[24px] tracking-[-0.31px] text-[#50617A]">{data.email || "—"}</p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-[8px] items-center shrink-0">
          <button
            onClick={onEdit}
            className="bg-[#F4F7FA] flex gap-[4px] h-[32px] items-center overflow-hidden pl-[8px] pr-[12px] rounded-[16px]"
          >
            <Pencil className="w-[14px] h-[14px] text-[#273951]" />
            <span className="text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#273951]">Edit</span>
          </button>
          <button className="bg-[#F4F7FA] flex h-[32px] w-[32px] items-center justify-center rounded-[16px]">
            <MoreHorizontal className="w-[16px] h-[16px] text-[#273951]" />
          </button>
        </div>
      </div>

      <div className="hidden">
        {/* Subtitle — kept for compatibility */}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm text-[#533AFD]">{data.email || "—"}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-end border-b border-[#EBEEF1] mt-[16px]">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-0 mr-6 pb-3 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap",
              activeTab === tab
                ? "text-[#533AFD] border-[#533AFD]"
                : "text-[#6c7688] border-transparent hover:text-[#353A44]",
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1">
        {activeTab === "Overview" && (
          <OverviewTab data={data} currency={currency} annualValue={annualValue} monthlyValue={monthlyValue} />
        )}
        {activeTab === "Pricing lines" && (
          <PricingLinesTab planLines={planLines} />
        )}
        {activeTab === "Billing and collections" && <BillingTab data={data} currency={currency} />}
        {activeTab === "Invoices" && (
          <InvoicesTab data={data} currency={currency} monthlyValue={monthlyValue} />
        )}
        {activeTab === "Audit log" && <AuditLogTab data={data} />}
      </div>
    </div>
  )
}

// ===========================================================================
// OVERVIEW
// ===========================================================================
function OverviewTab({
  data,
  currency,
  annualValue,
  monthlyValue,
}: {
  data: ContractDetailV4Data
  currency: string
  annualValue: number
  monthlyValue: number
}) {
  // Total spend mirrors V3: months elapsed since the contract started (capped at
  // the term and at 12 periods), zeroed out for drafts / not-yet-started terms.
  const totalSpend = (() => {
    const start = new Date(data.startDate)
    const end = new Date(data.endDate)
    const now = new Date()
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0
    if (now < start || data.status === "Draft") return 0
    let monthCount = 0
    const current = new Date(start)
    while (current < end && monthCount < 12) {
      if (current < now) monthCount++
      else break
      current.setMonth(current.getMonth() + 1)
    }
    return monthlyValue * monthCount
  })()

  const fmtSpend = (n: number) =>
    n >= 1000000
      ? `$${(n / 1000000).toFixed(2)}M`
      : `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <div className="py-6">
      {/* Summary bar — total contract value, term, spend (matches V3) */}
      <div className="border border-[#EBEEF1] rounded-lg grid grid-cols-3 divide-x divide-[#EBEEF1] mb-8">
        <div className="px-6 py-5">
          <div className="text-xs text-[#6c7688] mb-1.5">Total contract value</div>
          <div className="text-xl font-semibold text-[#353A44]">{fmtMoney(annualValue, currency)}</div>
        </div>
        <div className="px-6 py-5">
          <div className="text-xs text-[#6c7688] mb-1.5">Contract term</div>
          <div className="text-xl font-semibold text-[#353A44]">
            {fmtDate(data.startDate)} <span className="text-[#A0A8B4] font-normal">→</span> {fmtDate(data.endDate)}
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="text-xs text-[#6c7688] mb-1.5">Total spend</div>
          <div className="text-xl font-semibold text-[#353A44]">{fmtSpend(totalSpend)}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8">
        {/* Details column */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[#353A44]">Details</h2>
            <button className="text-[#A0A8B4] hover:text-[#596171]">
              <Pencil className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-xs font-medium text-[#6c7688] mb-1">Contract ID</div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#353A44]">{data.id}</span>
                <button className="text-[#A0A8B4] hover:text-[#596171]">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-[#6c7688] mb-1">Created</div>
              <div className="text-sm text-[#353A44]">Jul 10, 2024</div>
            </div>

            <div>
              <div className="text-xs font-medium text-[#6c7688] mb-1">Billing emails</div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#353A44]">{data.email || "—"}</span>
                <button className="text-[#A0A8B4] hover:text-[#596171]">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-[#6c7688] mb-1">Business name</div>
              <div className="text-sm text-[#A0A8B4]">—</div>
            </div>

            <div>
              <div className="text-xs font-medium text-[#6c7688] mb-1">Individual name</div>
              <div className="text-sm text-[#353A44]">{data.customer || "—"}</div>
            </div>
          </div>
        </div>

        {/* Billing details column */}
        <div className="pt-11">
          <div className="space-y-4">
            <div>
              <div className="text-xs font-medium text-[#353A44] mb-1">Billing details</div>
              <div className="text-sm text-[#596171]">
                Attn: {data.customer || "—"}<br />
                354 Oyster Point Boulevard<br />
                South San Francisco, CA 94080 US
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-[#6c7688] mb-1">Language</div>
              <div className="text-sm text-[#353A44]">English (United States)</div>
            </div>

            <div>
              <div className="text-xs font-medium text-[#6c7688] mb-1">Tax location status</div>
              <div className="text-sm text-[#353A44]">Valid (United States)</div>
            </div>

            <div>
              <div className="text-xs font-medium text-[#6c7688] mb-1">Tax status and IDs</div>
              <div className="text-sm text-[#353A44]">Taxable</div>
            </div>

            <div>
              <div className="text-xs font-medium text-[#6c7688] mb-1">Currency</div>
              <div className="text-sm text-[#353A44]">{currency}</div>
            </div>
          </div>
        </div>

        {/* Notes, Metadata, Entitlements column */}
        <div className="space-y-6">
          {/* Notes */}
          <div>
            <h2 className="text-base font-semibold text-[#353A44] mb-4">Notes</h2>
            <div className="border border-[#EBEEF1] rounded-lg p-4">
              <p className="text-sm text-[#596171] mb-3">
                Create a subscription to collect recurring payments. Use flat-rate, seat-based, tiered, or usage-base...
              </p>
              <div className="flex items-center justify-between text-xs text-[#A0A8B4]">
                <span>Darren Jodorowski</span>
                <span>1 of 3 notes</span>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-[#353A44]">Metadata</h2>
              <button className="text-[#A0A8B4] hover:text-[#596171]">
                <Pencil className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-xs font-medium text-[#6c7688]">Acme ID</div>
                <div className="text-sm text-[#353A44]">AC 6828</div>
              </div>
              <div>
                <div className="text-xs font-medium text-[#6c7688]">Customer segment</div>
                <div className="text-sm text-[#353A44]">Starter</div>
              </div>
              <div>
                <div className="text-xs font-medium text-[#6c7688]">Acquisition source</div>
                <div className="text-sm text-[#353A44]">Google ads</div>
              </div>
              <div>
                <div className="text-xs font-medium text-[#6c7688]">Account manager</div>
                <div className="text-sm text-[#353A44]">Omar Ismail</div>
              </div>
            </div>
          </div>

          {/* Entitlements */}
          <div>
            <div className="flex items-center gap-1 mb-4">
              <h2 className="text-base font-semibold text-[#353A44]">Entitlements</h2>
              <Info className="w-3.5 h-3.5 text-[#A0A8B4]" />
            </div>
            <div className="space-y-2 border-t border-[#EBEEF1] pt-3">
              <div className="text-sm text-[#533AFD] hover:underline cursor-pointer">1. Feature link</div>
              <div className="text-sm text-[#533AFD] hover:underline cursor-pointer">2. Feature link</div>
              <div className="text-sm text-[#533AFD] hover:underline cursor-pointer">3. Feature link</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ===========================================================================
// PRICING LINES
// ===========================================================================
// Compact unit-price formatter: "$11,100" for whole numbers, "$1,297.50" otherwise.
function fmtUnit(n: number) {
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: n % 1 === 0 ? 0 : 2 })}`
}

function PricingLinesTab({
  planLines,
}: {
  planLines: V4PlanLine[]
}) {
  if (planLines.length === 0) {
    return (
      <div className="py-16 flex flex-col items-center justify-center text-center">
        <div className="w-10 h-10 rounded-full bg-[#F5F6F8] flex items-center justify-center mb-3">
          <Tag className="w-5 h-5 text-[#A0A8B4]" />
        </div>
        <p className="text-sm font-medium text-[#353A44] mb-1">No pricing lines</p>
        <p className="text-xs text-[#A0A8B4]">Recurring products will appear here once added to the contract.</p>
      </div>
    )
  }

  return (
    <div className="py-6">
      <h2 className="text-base font-semibold text-[#353A44] mb-5">Recurring pricing lines</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#EBEEF1]">
            <th className="pb-2.5 text-left font-medium text-[#6c7688] text-xs">Product</th>
            <th className="pb-2.5 text-left font-medium text-[#6c7688] text-xs">Start date</th>
            <th className="pb-2.5 text-left font-medium text-[#6c7688] text-xs">End date</th>
            <th className="pb-2.5 text-left font-medium text-[#6c7688] text-xs">Service interval</th>
            <th className="pb-2.5 text-left font-medium text-[#6c7688] text-xs">Qty</th>
            <th className="pb-2.5 text-right font-medium text-[#6c7688] text-xs">Sticker unit price</th>
            <th className="pb-2.5 text-left font-medium text-[#6c7688] text-xs pl-8">Override type</th>
            <th className="pb-2.5 text-right font-medium text-[#6c7688] text-xs">Contract unit price</th>
            <th className="pb-2.5 w-8" />
          </tr>
        </thead>
        <tbody>
          {planLines.map((p) => (
            <PricingRow key={p.id} plan={p} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PricingRow({ plan }: { plan: V4PlanLine }) {
  const sticker = plan.monthlyPrice
  const cellBase = "py-3.5 align-top"
  const muted = "text-[#A0A8B4]"

  return (
    <>
      {/* Base / sticker pricing row */}
      <tr className="border-b border-[#EBEEF1]">
        <td className={cn(cellBase, "font-medium text-[#353A44]")}>{plan.name}</td>
        <td className={cn(cellBase, "text-[#596171]")}>{fmtDate(plan.startDate)}</td>
        <td className={cn(cellBase, "text-[#596171]")}>{fmtDate(plan.endDate)}</td>
        <td className={cn(cellBase, "text-[#596171]")}>Monthly</td>
        <td className={cn(cellBase, "text-[#596171]")}>{plan.quantity}</td>
        <td className={cn(cellBase, "text-right text-[#596171]")}>{fmtUnit(sticker)}</td>
        <td className={cn(cellBase, "text-[#A0A8B4] pl-8")}>—</td>
        <td className={cn(cellBase, "text-right font-medium text-[#353A44]")}>{fmtUnit(sticker)}</td>
        <td className={cellBase}>
          <button className="text-[#A0A8B4] hover:text-[#596171]">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </td>
      </tr>

      {/* Price override rows — show how the contract unit price is derived */}
      {plan.priceOverrides.map((o) => {
        const contract = parseFloat(o.price || "0")
        const pct = sticker > 0 ? Math.round((1 - contract / sticker) * 100) : 0
        // Build the "Override type" label. Prefer explicit override metadata;
        // otherwise fall back to a computed "% off sticker" descriptor.
        let typeLabel: ReactNode
        if (o.overrideType === "Multiplier" && o.multiplier != null) {
          typeLabel = `Multiplier (${o.multiplier}%)`
        } else {
          typeLabel = (
            <>
              Override price
              {pct !== 0 && (
                <span className="text-[#A0A8B4]"> ({pct > 0 ? `${pct}% off` : `${Math.abs(pct)}% up`})</span>
              )}
            </>
          )
        }
        return (
          <tr key={o.id} className="border-b border-[#EBEEF1]">
            <td className={cellBase} />
            <td className={cn(cellBase, "text-[#596171]")}>{fmtDate(o.startDate)}</td>
            <td className={cn(cellBase, "text-[#596171]")}>{fmtDate(o.endDate)}</td>
            <td className={cn(cellBase, "text-[#596171]")}>Monthly</td>
            <td className={cn(cellBase, muted)}>—</td>
            <td className={cn(cellBase, "text-right", muted)}>{fmtUnit(sticker)}</td>
            <td className={cn(cellBase, "text-[#596171] pl-8")}>{typeLabel}</td>
            <td className={cn(cellBase, "text-right font-medium text-[#353A44]")}>{fmtUnit(contract)}</td>
            <td className={cellBase}>
              <button className="text-[#A0A8B4] hover:text-[#596171]">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </td>
          </tr>
        )
      })}

      {/* Discount rows */}
      {(plan.discounts ?? []).map((d) => {
        const discountedPrice = sticker * (1 - d.percentage / 100)
        return (
          <tr key={d.id} className="border-b border-[#EBEEF1]">
            <td className={cellBase} />
            <td className={cn(cellBase, "text-[#596171]")}>{fmtDate(d.startDate)}</td>
            <td className={cn(cellBase, "text-[#596171]")}>{fmtDate(d.endDate)}</td>
            <td className={cn(cellBase, "text-[#596171]")}>Monthly</td>
            <td className={cn(cellBase, muted)}>—</td>
            <td className={cn(cellBase, "text-right", muted)}>{fmtUnit(sticker)}</td>
            <td className={cn(cellBase, "text-[#596171] pl-8")}>
              Discount
              <span className="text-[#A0A8B4]"> ({d.percentage}% off)</span>
            </td>
            <td className={cn(cellBase, "text-right font-medium text-[#353A44]")}>{fmtUnit(discountedPrice)}</td>
            <td className={cellBase}>
              <button className="text-[#A0A8B4] hover:text-[#596171]">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </td>
          </tr>
        )
      })}

      {/* Quantity update rows — show when the seat count changes */}
      {plan.quantityUpdates.map((q) => (
        <tr key={q.id} className="border-b border-[#EBEEF1]">
          <td className={cellBase} />
          <td className={cn(cellBase, "text-[#596171]")}>{fmtDate(q.effectiveDate)}</td>
          <td className={cn(cellBase, muted)}>—</td>
          <td className={cn(cellBase, "text-[#596171]")}>Monthly</td>
          <td className={cn(cellBase, "text-[#596171]")}>{q.quantity}</td>
          <td className={cn(cellBase, "text-right", muted)}>{fmtUnit(sticker)}</td>
          <td className={cn(cellBase, "text-[#596171] pl-8")}>Quantity update</td>
          <td className={cn(cellBase, "text-right font-medium text-[#353A44]")}>{fmtUnit(sticker)}</td>
          <td className={cellBase}>
            <button className="text-[#A0A8B4] hover:text-[#596171]">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </td>
        </tr>
      ))}
    </>
  )
}

// ===========================================================================
// BILLING AND COLLECTIONS
// ===========================================================================
function BillingTab({ data, currency }: { data: ContractDetailV4Data; currency: string }) {
  return (
    <div className="py-6 space-y-8">
      {/* Billing details */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold text-[#353A44]">Billing details</h2>
          <button className="text-[#A0A8B4] hover:text-[#596171]">
            <Pencil className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-x-16 gap-y-6">
          <div>
            <div className="text-xs font-medium text-[#6c7688] mb-1">Invoice interval</div>
            <div className="text-sm text-[#353A44]">{data.billingCadence || "1st of the month at 9:00 AM"}</div>
          </div>

          <div>
            <div className="text-xs font-medium text-[#6c7688] mb-1">Tax calculation</div>
            <div className="text-sm text-[#353A44]">No tax rate applied</div>
          </div>

          <div>
            <div className="text-xs font-medium text-[#6c7688] mb-1">Collection method</div>
            <div className="text-sm text-[#353A44]">Charge default payment method automatically</div>
          </div>

          <div>
            <div className="text-xs font-medium text-[#6c7688] mb-1">Currency</div>
            <div className="text-sm text-[#353A44]">{currency}</div>
          </div>
        </div>
      </div>

      {/* Payment method */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[#353A44]">Payment method</h2>
          <button className="text-[#A0A8B4] hover:text-[#596171]">
            <Pencil className="w-4 h-4" />
          </button>
        </div>

        <div className="border border-[#EBEEF1] rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-7 rounded bg-gradient-to-r from-[#eb001b] to-[#f79e1b] flex items-center justify-center">
                  <div className="flex">
                    <div className="w-3 h-3 rounded-full bg-[#eb001b] -mr-1" />
                    <div className="w-3 h-3 rounded-full bg-[#f79e1b]" />
                  </div>
                </div>
                <span className="text-sm text-[#353A44] font-medium">{"Mastercard •••• 4280"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#596171]">
                <span>🇬🇧</span>
                <span>United Kingdom</span>
              </div>
              <div className="text-sm text-[#596171]">Expires Sep 2027</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[#0072e9]">Default</span>
              <span className="text-xs font-medium text-[#2b8700]">Verified</span>
              <button className="text-[#A0A8B4] hover:text-[#596171]">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ===========================================================================
// INVOICES
// ===========================================================================
interface InvoiceRow {
  id: string
  date: Date
  amount: number
  status: "Paid" | "Scheduled" | "Uncollectible" | "Draft"
}

function InvoicesTab({
  data,
  currency,
  monthlyValue,
}: {
  data: ContractDetailV4Data
  currency: string
  monthlyValue: number
}) {
  const { past, upcoming } = useMemo(() => {
    const start = new Date(data.startDate)
    const end = new Date(data.endDate)
    const now = new Date()
    const past: InvoiceRow[] = []
    const upcoming: InvoiceRow[] = []
    if (isNaN(start.getTime()) || monthlyValue <= 0) return { past, upcoming }

    const current = new Date(start)
    let invoiceNum = 1
    while (current <= end && invoiceNum <= 12) {
      const year = current.getFullYear()
      const id = `INV-${year}-${String(invoiceNum).padStart(3, "0")}`
      const row: InvoiceRow = { id, date: new Date(current), amount: monthlyValue, status: "Scheduled" }
      if (data.status === "Draft") {
        upcoming.push({ ...row, status: "Scheduled" })
      } else if (current < now) {
        past.push({ ...row, status: "Paid" })
      } else {
        upcoming.push({ ...row, status: "Scheduled" })
      }
      current.setMonth(current.getMonth() + 1)
      invoiceNum++
    }
    return { past: past.reverse().slice(0, 6), upcoming: upcoming.slice(0, 4) }
  }, [data.startDate, data.endDate, data.status, monthlyValue])

  const hasNoInvoices = past.length === 0 && upcoming.length === 0

  if (hasNoInvoices) {
    return (
      <div className="py-16 flex flex-col items-center justify-center text-center">
        <div className="w-10 h-10 rounded-full bg-[#F5F6F8] flex items-center justify-center mb-3">
          <FileText className="w-5 h-5 text-[#A0A8B4]" />
        </div>
        <p className="text-sm font-medium text-[#353A44] mb-1">No invoices yet</p>
        <p className="text-xs text-[#A0A8B4]">Invoices will appear here once the contract becomes active.</p>
      </div>
    )
  }

  return (
    <div className="py-6 space-y-8">
      {upcoming.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[#353A44]">Upcoming invoices</h2>
          </div>
          <InvoiceTable rows={upcoming} currency={currency} />
        </div>
      )}
      {past.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[#353A44]">Past invoices</h2>
          </div>
          <InvoiceTable rows={past} currency={currency} />
        </div>
      )}
    </div>
  )
}

const invoiceStatusStyles: Record<string, string> = {
  Paid: "bg-[#eafcdd] text-[#2b8700]",
  Scheduled: "bg-[#F5F6F8] text-[#6c7688]",
  Uncollectible: "bg-[#fef4f6] text-[#e61947]",
  Draft: "bg-[#fbd992]/30 text-[#cc4b00]",
}

function InvoiceTable({ rows, currency }: { rows: InvoiceRow[]; currency: string }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-[#EBEEF1]">
          <th className="pb-2.5 text-left font-medium text-[#6c7688] text-xs">Invoice ID</th>
          <th className="pb-2.5 text-left font-medium text-[#6c7688] text-xs pl-4">Status</th>
          <th className="pb-2.5 text-left font-medium text-[#6c7688] text-xs">Date</th>
          <th className="pb-2.5 text-right font-medium text-[#6c7688] text-xs">Amount</th>
          <th className="pb-2.5 w-8" />
        </tr>
      </thead>
      <tbody>
        {rows.map((invoice, i) => (
          <tr key={i} className="border-b border-[#EBEEF1] last:border-0 group hover:bg-[#FAFBFC] cursor-pointer">
            <td className="py-3 text-[#533AFD] font-medium">{invoice.id}</td>
            <td className="py-3 pl-4">
              <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium", invoiceStatusStyles[invoice.status])}>
                {invoice.status}
              </span>
            </td>
            <td className="py-3 text-[#596171]">{fmtDate(invoice.date.toISOString())}</td>
            <td className="py-3 text-right text-[#353A44] font-medium">{fmtMoney(invoice.amount, currency)}</td>
            <td className="py-3">
              <button className="opacity-0 group-hover:opacity-100 transition-opacity text-[#A0A8B4] hover:text-[#596171]">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ===========================================================================
// AUDIT LOG
// ===========================================================================
interface AuditEvent {
  id: string
  title: string
  detail: string
  type: "create" | "update" | "billing" | "payment" | "api"
  at: Date
}

function AuditLogTab({ data }: { data: ContractDetailV4Data }) {
  const events = useMemo<AuditEvent[]>(() => {
    const now = new Date()
    const min = (n: number) => new Date(now.getTime() - n * 60000)
    const list: AuditEvent[] = [
      {
        id: "evt_1",
        title: "Contract created",
        detail: `contract.created · ${data.id}`,
        type: "create",
        at: min(0),
      },
      {
        id: "evt_2",
        title: "Draft saved",
        detail: `contract.updated · status set to ${data.status}`,
        type: "update",
        at: min(1),
      },
      {
        id: "evt_3",
        title: "Customer attached",
        detail: `customer.linked · ${data.email || data.customer}`,
        type: "update",
        at: min(2),
      },
      {
        id: "evt_4",
        title: "Pricing lines configured",
        detail: `price.schedule.created · ${data.planLines?.length ?? 0} line(s)`,
        type: "billing",
        at: min(3),
      },
      {
        id: "evt_5",
        title: "Upcoming invoice scheduled",
        detail: "invoiceitem.created · first billing period",
        type: "billing",
        at: min(4),
      },
      {
        id: "evt_6",
        title: "API request",
        detail: "POST /v1/contracts · 200 OK · 142ms",
        type: "api",
        at: min(5),
      },
    ]
    return list
  }, [data])

  const iconFor = (type: AuditEvent["type"]) => {
    switch (type) {
      case "create":
        return <FileText className="w-3.5 h-3.5 text-[#533AFD]" />
      case "update":
        return <Pencil className="w-3.5 h-3.5 text-[#3b6fe0]" />
      case "billing":
        return <Receipt className="w-3.5 h-3.5 text-[#cc4b00]" />
      case "payment":
        return <CreditCard className="w-3.5 h-3.5 text-[#2b8700]" />
      case "api":
        return <ArrowUpRight className="w-3.5 h-3.5 text-[#6c7688]" />
    }
  }

  return (
    <div className="py-6 max-w-2xl">
      <h2 className="text-base font-semibold text-[#353A44] mb-6">Audit log</h2>
      <div className="relative">
        {/* vertical line */}
        <div className="absolute left-3 top-1 bottom-1 w-px bg-[#EBEEF1]" aria-hidden="true" />
        <ul className="space-y-6">
          {events.map((evt) => (
            <li key={evt.id} className="relative flex items-start gap-4 pl-0">
              <div className="relative z-10 w-6 h-6 rounded-full bg-white border border-[#EBEEF1] flex items-center justify-center flex-shrink-0">
                {iconFor(evt.type)}
              </div>
              <div className="flex-1 -mt-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-[#353A44]">{evt.title}</span>
                  <span className="text-xs text-[#A0A8B4] whitespace-nowrap">{fmtDateTime(evt.at)}</span>
                </div>
                <div className="text-xs text-[#6c7688] font-mono mt-0.5">{evt.detail}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
