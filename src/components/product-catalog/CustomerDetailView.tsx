'use client'

import { cn } from "@/lib/utils"
import type { Customer } from "@/lib/customers"

type CustomerDetailViewProps = {
  customer: Customer
  onBack: () => void
  agreementsLabel?: string
}

function MetricCard({ label, value, variant }: { label: string; value: string; variant?: "warning" | "brand" }) {
  return (
    <div className="bg-white flex flex-1 gap-[12px] h-[72px] items-center min-w-[192px] overflow-hidden pl-[12px] pr-[16px] py-[12px] rounded-[8px]">
      <div className="flex flex-1 flex-col gap-[2px] items-start min-w-0 pb-[2px] pt-[4px]">
        <div className="flex items-center pl-[4px] w-full">
          <p className="flex-1 text-[14px] font-[400] leading-[16px] tracking-[-0.15px] text-[#50617A] truncate">{label}</p>
        </div>
        <div className="flex items-center pl-[3px] w-full">
          <p className="flex-1 text-[20px] font-[400] leading-[24px] tracking-[-0.2px] text-[#273951]" style={{ fontFeatureSettings: "'lnum' 1, 'pnum' 1" }}>{value}</p>
        </div>
      </div>
      {variant === "brand" && (
        <div className="bg-[#F7F5FD] flex items-center justify-center p-[12px] rounded-[4px]">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1L10 5.5L15 6.5L11.5 10L12.5 15L8 12.5L3.5 15L4.5 10L1 6.5L6 5.5L8 1Z" fill="#675DFF"/></svg>
        </div>
      )}
      {variant === "warning" && (
        <div className="bg-[#FEF4F6] flex items-center justify-center p-[12px] rounded-[4px]">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="#E61947" strokeWidth="1.5"/><path d="M8 5v3.5M8 10.5v.5" stroke="#E61947" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </div>
      )}
    </div>
  )
}

function SubscriptionCard({ name, status, frequency, nextInvoice, servicePeriod }: { name: string; status: "active" | "scheduled" | "canceled"; frequency: string; nextInvoice: string; servicePeriod: string }) {
  const statusStyles = {
    active: { label: "Active", bg: "bg-[#E7F9ED]", text: "text-[#1A7F37]" },
    scheduled: { label: "Scheduled", bg: "bg-[#EEF1FF]", text: "text-[#533AFD]" },
    canceled: { label: "Canceled", bg: "bg-[#FEF4F6]", text: "text-[#E61947]" },
  }
  const style = statusStyles[status]

  return (
    <div className="bg-white border border-[#ECF1F6] flex flex-1 flex-col gap-[16px] min-w-[320px] max-w-[422px] overflow-hidden pb-[20px] pt-[24px] px-[24px] rounded-[16px] shadow-[0px_1px_2px_-0.5px_rgba(0,0,0,0.05)]">
      <div className="flex flex-col gap-[20px] flex-1">
        <div className="flex gap-[16px] items-start w-full">
          <div className="flex flex-1 flex-wrap gap-[4px] items-start min-w-0">
            <span className={cn("inline-flex items-center rounded-[4px] px-[6px] py-[2px] text-[12px] font-[500]", style.bg, style.text)}>{style.label}</span>
          </div>
        </div>
        <p className="text-[16px] font-[600] leading-[20px] tracking-[-0.32px] text-[#1A2C44] truncate" style={{ fontFeatureSettings: "'lnum' 1, 'pnum' 1" }}>{name}</p>
      </div>
      <div className="flex flex-col gap-[6px]">
        <div className="flex items-center justify-between">
          <p className="text-[14px] font-[400] leading-[20px] tracking-[-0.15px] text-[#50617A]">Invoice frequency</p>
          <p className="text-[14px] font-[400] leading-[20px] tracking-[-0.15px] text-[#1A2C44] text-right">{frequency}</p>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-[14px] font-[400] leading-[20px] tracking-[-0.15px] text-[#50617A]">Next invoice</p>
          <p className="text-[14px] font-[400] leading-[20px] tracking-[-0.15px] text-[#1A2C44] text-right">{nextInvoice}</p>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-[14px] font-[400] leading-[20px] tracking-[-0.15px] text-[#50617A]">Service period</p>
          <p className="text-[14px] font-[400] leading-[20px] tracking-[-0.15px] text-[#1A2C44] text-right">{servicePeriod}</p>
        </div>
      </div>
    </div>
  )
}

const SAMPLE_CREDIT_GRANTS = [
  { name: "Referral bonus", eligibility: "Active", amount: "$50.00 / $85.00", priority: "Usage-based prices", effectiveDate: "Jul 10, 2026", dateEnds: "Jul 31, 2026" },
  { name: "Seasonal discount", eligibility: "Active", amount: "$1,200.00 / $1,700.00", priority: "Specific prices", effectiveDate: "Dec 22, 2025", dateEnds: "Dec 31, 2026" },
  { name: "Membership benefits", eligibility: "Expired", amount: "$120.00 / $300.00", priority: "Usage-based prices", effectiveDate: "Jul 11, 2025", dateEnds: "Jul 11, 2026" },
  { name: "Free trial period", eligibility: "Active", amount: "$40.00 / $85.00", priority: "Specific prices", effectiveDate: "Sep 01, 2025", dateEnds: "Nov 30, 2026" },
  { name: "Cashback offer", eligibility: "Active", amount: "$430.00 / $430.42", priority: "Usage-based prices", effectiveDate: "Sep 10, 2025", dateEnds: "Oct 10, 2026" },
]

export function CustomerDetailView({ customer, onBack, agreementsLabel = "Agreements" }: CustomerDetailViewProps) {
  return (
    <div>
      {/* Header */}
      <div className="flex gap-[20px] items-start pb-[8px] pt-[24px]">
        <div className="flex flex-1 flex-col gap-[4px] items-start min-w-0">
          {/* Breadcrumb */}
          <div className="flex gap-[8px] items-center">
            <button type="button" onClick={onBack} className="text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#533AFD] hover:underline">
              Customers
            </button>
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M3 1.5L5.5 4L3 6.5" stroke="#667691" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          {/* Name + badge */}
          <div className="flex gap-[8px] items-center">
            <p className="text-[28px] font-[700] leading-[36px] text-[#1A2C44] truncate" style={{ fontFeatureSettings: "'lnum' 1, 'pnum' 1" }}>{customer.name}</p>
            <span className="inline-flex items-center rounded-[4px] px-[6px] py-[2px] text-[12px] font-[500] bg-[#E7F9ED] text-[#1A7F37]">Good</span>
          </div>
          {/* Email */}
          <p className="text-[16px] font-[400] leading-[24px] tracking-[-0.31px] text-[#50617A]">{customer.email}</p>
        </div>
        {/* Action buttons */}
        <div className="flex gap-[8px] items-center shrink-0">
          <button type="button" className="bg-[#F4F7FA] flex gap-[4px] h-[32px] items-center overflow-hidden pl-[8px] pr-[12px] rounded-[16px]">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 4v8M4 8h8" stroke="#273951" strokeWidth="1.5" strokeLinecap="round"/></svg>
            <span className="text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#273951]">Create</span>
          </button>
          <button type="button" className="bg-[#F4F7FA] flex gap-[4px] h-[32px] items-center overflow-hidden pl-[8px] pr-[12px] rounded-[16px]">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 8h8M4 5h8M4 11h8" stroke="#273951" strokeWidth="1.2" strokeLinecap="round"/></svg>
            <span className="text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#273951]">Refund</span>
          </button>
          <button type="button" className="bg-[#F4F7FA] flex gap-[4px] h-[32px] items-center overflow-hidden pl-[8px] pr-[12px] rounded-[999px]">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="3" y="5" width="10" height="7" rx="1.5" stroke="#273951" strokeWidth="1.2"/><path d="M3 7.5h10" stroke="#273951" strokeWidth="1.2"/></svg>
            <span className="text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#273951]">Add payment method</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E3E8EF] mt-[16px]" role="tablist">
        {["Overview", "Details", "Activity"].map((tab, i) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={i === 0}
            className={cn(
              "relative px-[12px] py-[10px] text-[14px] font-[500] leading-[20px] transition-colors",
              i === 0 ? "text-[#533AFD]" : "text-[#596171] hover:text-[#353A44]"
            )}
          >
            {tab}
            {i === 0 && <span className="absolute bottom-0 left-[12px] right-[12px] h-[2px] rounded-full bg-[#533AFD]" />}
          </button>
        ))}
      </div>

      {/* Metric cards */}
      <div className="bg-[#F4F7FA] flex gap-[8px] items-start p-[8px] rounded-[16px] mt-[24px]">
        <div className="flex flex-1 gap-[8px]">
          <MetricCard label="Total spend" value={customer.totalSpend} variant="brand" />
          <MetricCard label="Monthly recurring revenue" value="$3.88K" />
        </div>
        <div className="flex flex-1 gap-[8px]">
          <MetricCard label="Refunds" value="$0.00" variant="warning" />
          <MetricCard label="Lost disputes" value="$0.00" />
        </div>
      </div>

      {/* Agreements section */}
      <div className="flex flex-col gap-[16px] mt-[32px]">
        <div className="flex gap-[16px] items-center">
          <p className="text-[20px] font-[700] leading-[28px] text-[#353A44] flex-1">{agreementsLabel}</p>
          <p className="text-[12px] font-[400] leading-[16px] text-[#50617A]">2 results</p>
          <button type="button" className="flex items-center justify-center size-[28px] rounded-[6px] border border-[#D8DEE4] bg-white hover:bg-[#F5F6F8]">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2v8M2 6h8" stroke="#3C4F69" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div className="flex gap-[8px] overflow-x-auto">
          <SubscriptionCard name="Pro Seat" status="active" frequency="Monthly on day 1" nextInvoice="Jul 1 for $20.00" servicePeriod="Jun 10–Jul 9" />
          <SubscriptionCard name="Enterprise Plan" status="scheduled" frequency="Yearly on Jan 1" nextInvoice="Jan 1" servicePeriod="Jan 1–Dec 31" />
        </div>
      </div>

      {/* Credit grants section */}
      <div className="flex flex-col gap-[16px] mt-[32px]">
        <div className="flex gap-[16px] items-center">
          <p className="text-[20px] font-[700] leading-[28px] text-[#353A44] flex-1">Credit grants</p>
          <button type="button" className="flex items-center justify-center size-[28px] rounded-[6px] border border-[#D8DEE4] bg-white hover:bg-[#F5F6F8]">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2v8M2 6h8" stroke="#3C4F69" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>

        <div>
          {/* Table header */}
          <div className="border-b border-[#EBEEF1] bg-white">
            <div className="grid h-[40px] grid-cols-[1.5fr_0.8fr_1fr_1fr_1fr_1fr] items-center gap-6 text-[12px] font-[500] text-[#6C7688]">
              <span>Name</span>
              <span>Eligibility</span>
              <span>Amount</span>
              <span>Priority</span>
              <span>Effective date</span>
              <span>Date ends</span>
            </div>
          </div>
          {/* Rows */}
          <div className="divide-y divide-[#EBEEF1] bg-white">
            {SAMPLE_CREDIT_GRANTS.map((grant) => (
              <div key={grant.name} className="grid h-[40px] w-full grid-cols-[1.5fr_0.8fr_1fr_1fr_1fr_1fr] items-center gap-6 text-[13px] font-[500] text-[#353A44] hover:bg-[#F7F8FA] transition-colors cursor-pointer">
                <span className="truncate text-[#533AFD]">{grant.name}</span>
                <span>
                  <span className={cn(
                    "inline-flex items-center rounded-[4px] px-[6px] py-[2px] text-[12px] font-[500]",
                    grant.eligibility === "Active" ? "bg-[#E7F9ED] text-[#1A7F37]" : "bg-[#F4F7FA] text-[#596171]"
                  )}>
                    {grant.eligibility}
                  </span>
                </span>
                <span className="truncate text-[#596171]">{grant.amount}</span>
                <span className="truncate text-[#596171]">{grant.priority}</span>
                <span className="text-[#596171]">{grant.effectiveDate}</span>
                <span className="text-[#596171]">{grant.dateEnds}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
