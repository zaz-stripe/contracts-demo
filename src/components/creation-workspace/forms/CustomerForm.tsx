'use client'

const labelClass = "text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#3C4F69]"
const inputClass =
  "h-[32px] w-full rounded-[6px] border border-[#D4DEE9] bg-white px-[10px] text-[13px] font-[400] text-[#353A44] placeholder:text-[#9CA3B0] outline-none transition-colors focus:border-[#533AFD] focus:ring-1 focus:ring-[#533AFD]/20"

type CustomerFormProps = {
  data: Record<string, any>
  onChange: (data: Record<string, any>) => void
  errorFields?: Set<string>
}

const errorInputClass =
  "h-[32px] w-full rounded-[6px] border border-[#DF1B41] bg-[#FFF5F5] px-[10px] text-[13px] font-[400] text-[#353A44] placeholder:text-[#9CA3B0] outline-none transition-colors focus:border-[#DF1B41] focus:ring-1 focus:ring-[#DF1B41]/20"

export function CustomerForm({ data, onChange, errorFields }: CustomerFormProps) {
  const set = (key: string, value: string) => onChange({ [key]: value })
  const ic = (field: string) => errorFields?.has(field) ? errorInputClass : inputClass

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex flex-col gap-[4px]">
        <label className={labelClass}>Name</label>
        <input
          className={ic("name")}
          placeholder="Acme Corporation"
          value={data.name ?? ""}
          onChange={(e) => set("name", e.target.value)}
        />
        {errorFields?.has("name") && (
          <p className="text-[11px] text-[#DF1B41]">Enter a customer name</p>
        )}
      </div>

      <div className="flex flex-col gap-[4px]">
        <label className={labelClass}>Email</label>
        <input
          type="email"
          className={ic("email")}
          placeholder="email@example.com"
          value={data.email ?? ""}
          onChange={(e) => set("email", e.target.value)}
        />
        {errorFields?.has("email") && (
          <p className="text-[11px] text-[#DF1B41]">Enter an email address</p>
        )}
      </div>

      <div className="flex flex-col gap-[4px]">
        <label className={labelClass}>Phone</label>
        <input
          type="tel"
          className={inputClass}
          placeholder="+1 (555) 123-4567"
          value={data.phone ?? ""}
          onChange={(e) => set("phone", e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-[4px]">
        <label className={labelClass}>Address line 1</label>
        <input
          className={inputClass}
          placeholder="123 Main St"
          value={data.address1 ?? ""}
          onChange={(e) => set("address1", e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-[4px]">
        <label className={labelClass}>Address line 2</label>
        <input
          className={inputClass}
          placeholder="Suite 100"
          value={data.address2 ?? ""}
          onChange={(e) => set("address2", e.target.value)}
        />
      </div>

      <div className="flex gap-[12px]">
        <div className="flex flex-1 flex-col gap-[4px]">
          <label className={labelClass}>City</label>
          <input
            className={inputClass}
            placeholder="San Francisco"
            value={data.city ?? ""}
            onChange={(e) => set("city", e.target.value)}
          />
        </div>
        <div className="flex w-[80px] flex-col gap-[4px]">
          <label className={labelClass}>State</label>
          <input
            className={inputClass}
            placeholder="CA"
            value={data.state ?? ""}
            onChange={(e) => set("state", e.target.value)}
          />
        </div>
        <div className="flex w-[100px] flex-col gap-[4px]">
          <label className={labelClass}>ZIP</label>
          <input
            className={inputClass}
            placeholder="94105"
            value={data.zip ?? ""}
            onChange={(e) => set("zip", e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-[4px]">
        <label className={labelClass}>Tax ID</label>
        <input
          className={inputClass}
          placeholder="US tax ID or VAT number"
          value={data.taxId ?? ""}
          onChange={(e) => set("taxId", e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-[4px]">
        <label className={labelClass}>Default payment method</label>
        <select
          className={inputClass}
          value={data.paymentMethod ?? ""}
          onChange={(e) => set("paymentMethod", e.target.value)}
        >
          <option value="">None</option>
          <option value="visa_4242">Visa ending in 4242</option>
          <option value="mc_5555">Mastercard ending in 5555</option>
          <option value="amex_0005">Amex ending in 0005</option>
        </select>
      </div>
    </div>
  )
}
