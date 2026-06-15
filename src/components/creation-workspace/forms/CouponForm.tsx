'use client'

import { useState } from "react"

const labelClass = "text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#3C4F69]"
const inputClass =
  "h-[32px] w-full rounded-[6px] border border-[#D4DEE9] bg-white px-[10px] text-[13px] font-[400] text-[#353A44] placeholder:text-[#9CA3B0] outline-none transition-colors focus:border-[#533AFD] focus:ring-1 focus:ring-[#533AFD]/20"
const selectClass =
  "h-[32px] w-full appearance-none rounded-[6px] border border-[#D4DEE9] bg-white px-[10px] pr-[28px] text-[13px] font-[400] text-[#353A44] outline-none transition-colors focus:border-[#533AFD] focus:ring-1 focus:ring-[#533AFD]/20"

type CouponFormProps = {
  data: Record<string, any>
  onChange: (data: Record<string, any>) => void
  errorFields?: Set<string>
}

export function CouponForm({ data, onChange }: CouponFormProps) {
  const set = (key: string, value: string) => onChange({ [key]: value })
  const discountType = data.discountType ?? "percent"

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex flex-col gap-[4px]">
        <label className={labelClass}>Coupon name</label>
        <input
          className={inputClass}
          placeholder="e.g. SUMMER20"
          value={data.name ?? ""}
          onChange={(e) => set("name", e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-[4px]">
        <label className={labelClass}>Discount type</label>
        <div className="flex gap-[2px] rounded-[6px] border border-[#D4DEE9] bg-[#F5F6F8] p-[2px]">
          {["percent", "fixed"].map((type) => (
            <button
              key={type}
              type="button"
              className={`flex-1 rounded-[4px] py-[4px] text-[12px] font-[500] transition-colors ${
                discountType === type
                  ? "bg-white text-[#353A44] shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                  : "text-[#6C7688] hover:text-[#353A44]"
              }`}
              onClick={() => set("discountType", type)}
            >
              {type === "percent" ? "Percentage" : "Fixed amount"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-[4px]">
        <label className={labelClass}>
          {discountType === "percent" ? "Percentage off" : "Amount off"}
        </label>
        <div className="relative">
          {discountType === "fixed" && (
            <span className="absolute left-[10px] top-1/2 -translate-y-1/2 text-[13px] text-[#6C7688]">$</span>
          )}
          <input
            className={`${inputClass} ${discountType === "fixed" ? "pl-[22px]" : ""}`}
            placeholder={discountType === "percent" ? "20" : "10.00"}
            value={data.amount ?? ""}
            onChange={(e) => set("amount", e.target.value)}
          />
          {discountType === "percent" && (
            <span className="absolute right-[10px] top-1/2 -translate-y-1/2 text-[13px] text-[#6C7688]">%</span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-[4px]">
        <label className={labelClass}>Duration</label>
        <select
          className={selectClass}
          value={data.duration ?? "once"}
          onChange={(e) => set("duration", e.target.value)}
        >
          <option value="once">Once</option>
          <option value="repeating">Repeating</option>
          <option value="forever">Forever</option>
        </select>
      </div>

      {data.duration === "repeating" && (
        <div className="flex flex-col gap-[4px]">
          <label className={labelClass}>Number of months</label>
          <input
            className={inputClass}
            placeholder="3"
            value={data.durationMonths ?? ""}
            onChange={(e) => set("durationMonths", e.target.value)}
          />
        </div>
      )}

      <div className="flex flex-col gap-[4px]">
        <label className={labelClass}>Redemption limit</label>
        <input
          className={inputClass}
          placeholder="Unlimited"
          value={data.maxRedemptions ?? ""}
          onChange={(e) => set("maxRedemptions", e.target.value)}
        />
      </div>
    </div>
  )
}
