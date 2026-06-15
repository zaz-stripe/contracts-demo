'use client'

const labelClass = "text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#3C4F69]"
const inputClass =
  "h-[32px] w-full rounded-[6px] border border-[#D4DEE9] bg-white px-[10px] text-[13px] font-[400] text-[#353A44] placeholder:text-[#9CA3B0] outline-none transition-colors focus:border-[#533AFD] focus:ring-1 focus:ring-[#533AFD]/20"
const textareaClass =
  "min-h-[80px] w-full resize-none rounded-[6px] border border-[#D4DEE9] bg-white px-[10px] py-[8px] text-[13px] font-[400] text-[#353A44] placeholder:text-[#9CA3B0] outline-none transition-colors focus:border-[#533AFD] focus:ring-1 focus:ring-[#533AFD]/20"
const selectClass =
  "h-[32px] w-full appearance-none rounded-[6px] border border-[#D4DEE9] bg-white px-[10px] pr-[28px] text-[13px] font-[400] text-[#353A44] outline-none transition-colors focus:border-[#533AFD] focus:ring-1 focus:ring-[#533AFD]/20"

type ProductFormProps = {
  data: Record<string, any>
  onChange: (data: Record<string, any>) => void
  errorFields?: Set<string>
}

const errorInputClass =
  "h-[32px] w-full rounded-[6px] border border-[#DF1B41] bg-[#FFF5F5] px-[10px] text-[13px] font-[400] text-[#353A44] placeholder:text-[#9CA3B0] outline-none transition-colors focus:border-[#DF1B41] focus:ring-1 focus:ring-[#DF1B41]/20"

export function ProductForm({ data, onChange, errorFields }: ProductFormProps) {
  const set = (key: string, value: unknown) => onChange({ [key]: value })
  const ic = (field: string) => errorFields?.has(field) ? errorInputClass : inputClass

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex flex-col gap-[4px]">
        <label className={labelClass}>Product name</label>
        <input
          className={ic("name")}
          placeholder="API access"
          value={data.name ?? ""}
          onChange={(e) => set("name", e.target.value)}
        />
        {errorFields?.has("name") && (
          <p className="text-[11px] text-[#DF1B41]">Enter a product name</p>
        )}
      </div>

      <div className="flex flex-col gap-[4px]">
        <label className={labelClass}>Description</label>
        <textarea
          className={textareaClass}
          placeholder="Describe the product or service"
          value={data.description ?? ""}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>

      <div className="border-t border-[#F0F3F7] pt-[16px]">
        <p className="mb-[12px] text-[12px] font-[600] uppercase tracking-[0.5px] text-[#6C7688]">Price</p>

        <div className="flex flex-col gap-[12px]">
          <div className="flex flex-col gap-[4px]">
            <label className={labelClass}>Unit price</label>
            <div className="relative">
              <span className="absolute left-[10px] top-1/2 -translate-y-1/2 text-[13px] text-[#6C7688]">$</span>
              <input
                className={`${ic("unitPrice")} pl-[22px]`}
                placeholder="0.00"
                value={data.unitPrice ?? ""}
                onChange={(e) => set("unitPrice", e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-[12px]">
            <div className="flex flex-1 flex-col gap-[4px]">
              <label className={labelClass}>Currency</label>
              <select
                className={selectClass}
                value={data.currency ?? "USD"}
                onChange={(e) => set("currency", e.target.value)}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="JPY">JPY</option>
              </select>
            </div>
            <div className="flex flex-1 flex-col gap-[4px]">
              <label className={labelClass}>Billing period</label>
              <select
                className={selectClass}
                value={data.billingPeriod ?? "monthly"}
                onChange={(e) => set("billingPeriod", e.target.value)}
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="weekly">Weekly</option>
                <option value="one_time">One-time</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-[4px]">
            <label className={labelClass}>Pricing model</label>
            <select
              className={selectClass}
              value={data.pricingModel ?? "standard"}
              onChange={(e) => set("pricingModel", e.target.value)}
            >
              <option value="standard">Standard</option>
              <option value="package">Package</option>
              <option value="graduated">Graduated</option>
              <option value="volume">Volume</option>
            </select>
          </div>

          <div className="flex flex-col gap-[4px]">
            <label className={labelClass}>Unit label</label>
            <input
              className={inputClass}
              placeholder="e.g. seat, request, token"
              value={data.unitLabel ?? ""}
              onChange={(e) => set("unitLabel", e.target.value)}
            />
          </div>

        </div>
      </div>

      <div className="border-t border-[#F0F3F7] pt-[16px]">
        <div className="flex flex-col gap-[12px]">
          <div className="flex flex-col gap-[4px]">
            <label className={labelClass}>Tax code</label>
            <select
              className={selectClass}
              value={data.taxCode ?? "default"}
              onChange={(e) => set("taxCode", e.target.value)}
            >
              <option value="default">Account default</option>
              <option value="digital">Digital</option>
              <option value="physical">Physical</option>
              <option value="service">Service</option>
            </select>
          </div>
          <div className="flex flex-col gap-[4px]">
            <label className={labelClass}>Tax behavior</label>
            <select
              className={selectClass}
              value={data.taxBehavior ?? "unspecified"}
              onChange={(e) => set("taxBehavior", e.target.value)}
            >
              <option value="unspecified">Unspecified</option>
              <option value="inclusive">Inclusive</option>
              <option value="exclusive">Exclusive</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
