'use client'

import { useState, useRef, useEffect } from "react"

const labelClass = "text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#3C4F69]"
const inputClass =
  "h-[32px] w-full rounded-[6px] border border-[#D4DEE9] bg-white px-[10px] text-[13px] font-[400] text-[#353A44] placeholder:text-[#9CA3B0] outline-none transition-colors focus:border-[#533AFD] focus:ring-1 focus:ring-[#533AFD]/20"

const EXISTING_PLANS = [
  { id: "pro", name: "Pro Plan", price: "99.00", interval: "monthly" },
  { id: "starter", name: "Starter", price: "29.00", interval: "monthly" },
  { id: "enterprise", name: "Enterprise", price: "299.00", interval: "monthly" },
  { id: "growth-annual", name: "Growth (Annual)", price: "79.00", interval: "yearly" },
]

function ExternalLinkIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
      <path fillRule="evenodd" clipRule="evenodd" d="M2.25 2.99999C1.83579 2.99999 1.5 3.33577 1.5 3.74999V9.74999C1.5 10.1642 1.83579 10.5 2.25 10.5H8.25C8.66421 10.5 9 10.1642 9 9.74999V8.24999C9 7.83577 9.33579 7.49999 9.75 7.49999C10.1642 7.49999 10.5 7.83577 10.5 8.24999V9.74999C10.5 10.9926 9.49264 12 8.25 12H2.25C1.00736 12 0 10.9926 0 9.74999V3.74999C0 2.50735 1.00736 1.49999 2.25 1.49999H3.75C4.16421 1.49999 4.5 1.83577 4.5 2.24999C4.5 2.6642 4.16421 2.99999 3.75 2.99999H2.25Z" fill="currentColor"/>
      <path d="M7.00005 0C6.58583 0 6.25005 0.335786 6.25005 0.75C6.25005 1.16421 6.58583 1.5 7.00005 1.5H9.43939L3.71972 7.21967C3.42683 7.51256 3.42683 7.98744 3.71972 8.28033C4.01261 8.57322 4.48749 8.57322 4.78038 8.28033L10.5 2.56066V5C10.5 5.41421 10.8358 5.75 11.25 5.75C11.6643 5.75 12 5.41421 12 5V0.75C12 0.335786 11.6643 0 11.25 0H7.00005Z" fill="currentColor"/>
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <path d="M3 4.5L6 7.5L9 4.5" stroke="#9CA3B0" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

type PricingPlanFormProps = {
  data: Record<string, any>
  onChange: (data: Record<string, any>) => void
  errorFields?: Set<string>
}

export function PricingPlanForm({ data, onChange }: PricingPlanFormProps) {
  const selectedId = data.selectedPlanId ?? ""
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setSearch("")
      }
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [isOpen])

  const handleSelectPlan = (planId: string) => {
    const plan = EXISTING_PLANS.find((p) => p.id === planId)
    if (plan) {
      onChange({
        selectedPlanId: plan.id,
        name: plan.name,
        basePrice: plan.price,
        selectedPlan: plan.name,
      })
    }
    setIsOpen(false)
    setSearch("")
  }

  const filtered = EXISTING_PLANS.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const selectedPlan = EXISTING_PLANS.find((p) => p.id === selectedId)
  const displayText = selectedPlan
    ? `${selectedPlan.name} — $${selectedPlan.price}/${selectedPlan.interval === "yearly" ? "yr" : "mo"}`
    : ""

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex flex-col gap-[4px]" ref={containerRef}>
        <label className={labelClass}>Pricing plan</label>
        <div className="relative">
          {isOpen ? (
            <input
              ref={inputRef}
              className={inputClass}
              placeholder="Search pricing plans..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          ) : (
            <button
              type="button"
              className={`${inputClass} flex items-center justify-between text-left`}
              onClick={() => {
                setIsOpen(true)
                setTimeout(() => inputRef.current?.focus(), 0)
              }}
            >
              <span className={selectedPlan ? "text-[#353A44]" : "text-[#9CA3B0]"}>
                {selectedPlan ? displayText : "Select a pricing plan..."}
              </span>
              <ChevronDownIcon />
            </button>
          )}

          {isOpen && (
            <div className="absolute left-0 right-0 top-[36px] z-50 rounded-[8px] border border-[#E3E8EF] bg-white py-[4px] shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
              {filtered.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  className="flex w-full items-center justify-between px-[12px] py-[8px] text-left transition-colors hover:bg-[#F5F6F8]"
                  onClick={() => handleSelectPlan(plan.id)}
                >
                  <span className="text-[13px] font-[500] text-[#353A44]">{plan.name}</span>
                  <span className="text-[12px] text-[#6C7688]">
                    ${plan.price}/{plan.interval === "yearly" ? "yr" : "mo"}
                  </span>
                </button>
              ))}

              {filtered.length === 0 && search && (
                <div className="px-[12px] py-[8px] text-[12px] text-[#9CA3B0]">
                  No plans matching &ldquo;{search}&rdquo;
                </div>
              )}

              <div className="border-t border-[#F0F3F7] mt-[4px] pt-[4px]">
                <button
                  type="button"
                  className="flex w-full items-center gap-[6px] px-[12px] py-[8px] text-left text-[13px] font-[500] text-[#533AFD] transition-colors hover:bg-[#F5F6F8]"
                  onClick={() => {
                    window.open("/", "_blank")
                    setIsOpen(false)
                    setSearch("")
                  }}
                >
                  Create new pricing plan
                  <ExternalLinkIcon />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedPlan && (
        <div className="rounded-[6px] border border-[#E3E8EF] bg-[#FAFBFC] px-[12px] py-[10px]">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-[500] text-[#353A44]">{selectedPlan.name}</span>
            <span className="text-[12px] font-[600] text-[#1A2C44]">
              ${selectedPlan.price}/{selectedPlan.interval === "yearly" ? "yr" : "mo"}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
