'use client'

import { EntityDropdown } from "./EntityDropdown"

const EXISTING_CUSTOMERS = [
  { id: "cus_1", name: "Acme Corporation", detail: "cus_1@example.com" },
  { id: "cus_2", name: "Globex Corp", detail: "cus_2@example.com" },
  { id: "cus_3", name: "Initech", detail: "cus_3@example.com" },
  { id: "cus_4", name: "Umbrella Corp", detail: "cus_4@example.com" },
]

const EXISTING_PRODUCTS = [
  { id: "prod_1", name: "API Access", detail: "$99.00/mo" },
  { id: "prod_2", name: "Analytics Dashboard", detail: "$49.00/mo" },
  { id: "prod_3", name: "Enterprise Support", detail: "$199.00/mo" },
]

const EXISTING_COUPONS: (import("./EntityDropdown").EntityItem & { amount: string; discountType: string })[] = [
  { id: "cpn_1", name: "WELCOME10", detail: "10% off", amount: "10", discountType: "percent" },
  { id: "cpn_2", name: "SAVE5", detail: "$5.00 off", amount: "5", discountType: "fixed" },
  { id: "cpn_3", name: "HALFOFF", detail: "50% off", amount: "50", discountType: "percent" },
]

const labelClass = "text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#3C4F69]"
const inputClass =
  "h-[32px] w-full rounded-[6px] border border-[#D4DEE9] bg-white px-[10px] text-[13px] font-[400] text-[#353A44] placeholder:text-[#9CA3B0] outline-none transition-colors focus:border-[#533AFD] focus:ring-1 focus:ring-[#533AFD]/20"
const textareaClass =
  "min-h-[80px] w-full resize-none rounded-[6px] border border-[#D4DEE9] bg-white px-[10px] py-[8px] text-[13px] font-[400] text-[#353A44] placeholder:text-[#9CA3B0] outline-none transition-colors focus:border-[#533AFD] focus:ring-1 focus:ring-[#533AFD]/20"
const errorInputClass =
  "h-[32px] w-full rounded-[6px] border border-[#DF1B41] bg-[#FFF5F5] px-[10px] text-[13px] font-[400] text-[#353A44] placeholder:text-[#9CA3B0] outline-none transition-colors focus:border-[#DF1B41] focus:ring-1 focus:ring-[#DF1B41]/20"

function SelectField({ label, value, onChange, children }: {
  label: string
  value: string
  onChange: (value: string) => void
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-[4px]">
      <label className={labelClass}>{label}</label>
      <div className="relative">
        <select
          className="h-[32px] w-full appearance-none rounded-[6px] border border-[#D4DEE9] bg-white px-[10px] pr-[28px] text-[13px] font-[400] text-[#353A44] outline-none transition-colors focus:border-[#533AFD] focus:ring-1 focus:ring-[#533AFD]/20"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {children}
        </select>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="pointer-events-none absolute right-[10px] top-1/2 -translate-y-1/2">
          <path d="M3 4.5L6 7.5L9 4.5" stroke="#6C7688" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  )
}

type InvoiceFormProps = {
  data: Record<string, any>
  onChange: (data: Record<string, any>) => void
  errorFields?: Set<string>
  onAddObject?: (kind: string) => void
}

export function InvoiceForm({ data, onChange, errorFields, onAddObject }: InvoiceFormProps) {
  const set = (key: string, value: string) => onChange({ [key]: value })
  const ic = (field: string) => errorFields?.has(field) ? errorInputClass : inputClass

  return (
    <div className="flex flex-col gap-[16px]">
      <EntityDropdown
        label="Customer"
        placeholder="Find or add a customer..."
        searchPlaceholder="Search customers..."
        items={EXISTING_CUSTOMERS}
        selectedId={data.customerId ?? ""}
        selectedLabel={data.customerName}
        onSelect={(id) => {
          const customer = EXISTING_CUSTOMERS.find((c) => c.id === id)
          onChange({ customerId: id, customerName: customer?.name ?? "" })
        }}
        addNewLabel="Add new customer"
        onAddNew={() => {
          onAddObject?.("customer")
          onChange({ customerId: "_new", customerName: "New customer" })
        }}
        hasError={errorFields?.has("customerId")}
        errorMessage="Select a customer"
      />

      <EntityDropdown
        label="Product"
        placeholder="Find or add a product..."
        searchPlaceholder="Search products..."
        items={EXISTING_PRODUCTS}
        selectedId={data.productId ?? ""}
        selectedLabel={data.productName}
        onSelect={(id) => {
          const product = EXISTING_PRODUCTS.find((p) => p.id === id)
          onChange({ productId: id, productName: product?.name ?? "" })
        }}
        addNewLabel="Add new product"
        onAddNew={() => {
          onAddObject?.("product")
          onChange({ productId: "_new", productName: "New product" })
        }}
        hasError={errorFields?.has("productId")}
        errorMessage="Select a product"
      />

      <div className="flex flex-col gap-[4px]">
        <label className={labelClass}>Invoice number</label>
        <input
          className={ic("name")}
          placeholder="INV-001"
          value={data.name ?? ""}
          onChange={(e) => set("name", e.target.value)}
        />
        {errorFields?.has("name") && (
          <p className="text-[11px] text-[#DF1B41]">Enter an invoice number</p>
        )}
      </div>

      <div className="flex gap-[12px]">
        <div className="flex flex-1 flex-col gap-[4px]">
          <label className={labelClass}>Amount</label>
          <div className="relative">
            <span className="absolute left-[10px] top-1/2 -translate-y-1/2 text-[13px] text-[#6C7688]">$</span>
            <input
              className={`${ic("amount")} pl-[22px]`}
              placeholder="0.00"
              value={data.amount ?? ""}
              onChange={(e) => set("amount", e.target.value)}
            />
          </div>
        </div>
        <div className="flex w-[100px] flex-col gap-[4px]">
          <label className={labelClass}>Currency</label>
          <div className="relative">
            <select
              className="h-[32px] w-full appearance-none rounded-[6px] border border-[#D4DEE9] bg-white px-[10px] pr-[28px] text-[13px] font-[400] text-[#353A44] outline-none transition-colors focus:border-[#533AFD] focus:ring-1 focus:ring-[#533AFD]/20"
              value={data.currency ?? "USD"}
              onChange={(e) => set("currency", e.target.value)}
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="JPY">JPY</option>
            </select>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="pointer-events-none absolute right-[10px] top-1/2 -translate-y-1/2">
              <path d="M3 4.5L6 7.5L9 4.5" stroke="#6C7688" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>

      <EntityDropdown
        label="Coupon"
        placeholder="Select a coupon..."
        searchPlaceholder="Search coupons..."
        items={EXISTING_COUPONS}
        selectedId={data.couponId ?? ""}
        selectedLabel={data.couponName}
        onSelect={(id) => {
          const cpn = EXISTING_COUPONS.find((c) => c.id === id)
          onChange({
            couponId: id,
            couponName: cpn?.name ?? "",
            couponAmount: cpn?.amount ?? "",
            couponDiscountType: cpn?.discountType ?? "percent",
          })
        }}
        addNewLabel="Add new coupon"
        onAddNew={() => {
          onAddObject?.("coupon")
          onChange({ couponId: "_new", couponName: "New coupon" })
        }}
      />

      <div className="flex flex-col gap-[4px]">
        <label className={labelClass}>Due date</label>
        <input
          type="date"
          className={inputClass}
          value={data.dueDate ?? ""}
          onChange={(e) => set("dueDate", e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-[4px]">
        <label className={labelClass}>Description</label>
        <textarea
          className={textareaClass}
          placeholder="What is this invoice for?"
          value={data.description ?? ""}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>

      <SelectField label="Collection method" value={data.collectionMethod ?? "charge_automatically"} onChange={(v) => set("collectionMethod", v)}>
        <option value="charge_automatically">Charge automatically</option>
        <option value="send_invoice">Send invoice</option>
      </SelectField>

      <SelectField label="Tax behavior" value={data.taxBehavior ?? "none"} onChange={(v) => set("taxBehavior", v)}>
        <option value="none">No tax</option>
        <option value="exclusive">Exclusive</option>
        <option value="inclusive">Inclusive</option>
      </SelectField>

      <div className="flex flex-col gap-[4px]">
        <label className={labelClass}>Memo</label>
        <input
          className={inputClass}
          placeholder="Internal note (not visible to customer)"
          value={data.memo ?? ""}
          onChange={(e) => set("memo", e.target.value)}
        />
      </div>
    </div>
  )
}
