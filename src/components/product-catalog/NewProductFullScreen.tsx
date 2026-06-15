'use client'

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Selector } from "@/components/Selector"
import { SegmentedControl } from "@/components/SegmentedControl"
import { CurrencyFlag } from "@/components/CurrencyFlag"
import { CatalogObjectGlyph } from "@/components/product-catalog/iconography"
import { AddSmallIcon, CreditGrantMiniIcon } from "@/components/ProductCatalogIcons"
import { defaultMeterOptions } from "@/components/product-catalog/productCatalogPage.constants"

const labelClasses = "text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44]"
const inputClasses = "h-[32px] w-full rounded-[6px] border border-[#D8DEE4] bg-white p-[8px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] placeholder:text-[#6C7688] outline-none hover:border-[#B6C0CD] focus:border-[#A0D0F7] focus:shadow-[0_0_0_1.5px_#A0D0F7] transition-all"

const taxCodeOptions = ["Account default", "Digital", "Physical", "Service"]
const taxBehaviorOptions = ["Unspecified", "Inclusive", "Exclusive"]
const pricingModelOptions = ["Flat rate", "Package", "Graduated", "Volume"]
const includeTaxOptions = ["Auto", "Inclusive", "Exclusive"]
const billingPeriodOptions = ["Monthly", "Yearly", "Weekly", "Daily"]
const currencyOptions = ["USD", "EUR", "GBP", "JPY"]

type CreditGrantEntry = {
  id: number
  name: string
  amount: string
  period: string
}

type PriceEntry = {
  id: number
  chargeType: "Recurring" | "One-off"
  pricingModel: string
  amount: string
  currency: string
  includeTax: string
  billingPeriod: string
  unitLabel: string
  creditGrant?: CreditGrantEntry
}

function makeDefaultPrice(id: number): PriceEntry {
  return { id, chargeType: "Recurring", pricingModel: "Flat rate", amount: "", currency: "USD", includeTax: "Auto", billingPeriod: "Monthly", unitLabel: "" }
}

type InitialPrice = {
  chargeType?: "Recurring" | "One-off"
  pricingModel?: string
  amount?: string
  currency?: string
  billingPeriod?: string
  unitLabel?: string
  meter?: string
}

type NewProductFullScreenProps = {
  isOpen: boolean
  onClose: () => void
  initialData?: {
    name?: string
    description?: string
    taxCode?: string
    taxBehavior?: string
    chargeType?: string
    amount?: string
    currency?: string
    cadence?: string
    productType?: string
    meter?: string
    prices?: InitialPrice[]
  }
  onSubmit?: (data: {
    name: string
    description: string
    taxCode: string
    taxBehavior: string
    prices: PriceEntry[]
  }) => void
}

export function NewProductFullScreen({ isOpen, onClose, initialData, onSubmit }: NewProductFullScreenProps) {
  const [name, setName] = useState(initialData?.name ?? "")
  const [description, setDescription] = useState(initialData?.description ?? "")
  const [productType, setProductType] = useState<"Flat" | "Usage-based" | "Composite">((initialData?.productType as "Flat" | "Usage-based" | "Composite") ?? "Flat")
  const [taxCode, setTaxCode] = useState(initialData?.taxCode ?? "Account default")
  const [taxBehavior, setTaxBehavior] = useState(initialData?.taxBehavior ?? "Unspecified")

  const [prices, setPrices] = useState<PriceEntry[]>(() => {
    if (initialData?.prices && initialData.prices.length > 0) {
      return initialData.prices.map((p, i) => ({
        id: i,
        chargeType: p.chargeType ?? "Recurring",
        pricingModel: p.pricingModel ?? "Flat rate",
        amount: p.amount ?? "",
        currency: p.currency ?? "USD",
        includeTax: "Auto",
        billingPeriod: p.billingPeriod ?? "Monthly",
        unitLabel: p.unitLabel ?? "",
      }))
    }
    if (initialData?.amount || initialData?.chargeType) {
      return [{
        id: 0,
        chargeType: (initialData.chargeType as "Recurring" | "One-off") ?? "Recurring",
        pricingModel: "Flat rate",
        amount: initialData.amount ?? "",
        currency: initialData.currency ?? "USD",
        includeTax: "Auto",
        billingPeriod: initialData.cadence ?? "Monthly",
        unitLabel: "",
      }]
    }
    return []
  })

  const [activeNav, setActiveNav] = useState<"product" | number>(prices.length > 0 ? prices[0].id : "product")

  const activePrice = typeof activeNav === "number" ? prices.find((p) => p.id === activeNav) : null

  const updatePrice = (id: number, updates: Partial<PriceEntry>) => {
    setPrices((prev) => prev.map((p) => p.id === id ? { ...p, ...updates } : p))
  }

  const addPrice = () => {
    const newId = prices.length > 0 ? Math.max(...prices.map((p) => p.id)) + 1 : 0
    const newPrice = makeDefaultPrice(newId)
    setPrices((prev) => [...prev, newPrice])
    setActiveNav(newId)
  }

  const handleSubmit = () => {
    onSubmit?.({ name, description, taxCode, taxBehavior, prices })
    onClose()
  }

  const productDisplayName = name.trim() || "Untitled product"

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[900] flex flex-col bg-white"
          initial={{ opacity: 0, scale: 0.96, borderRadius: "12px" }}
          animate={{ opacity: 1, scale: 1, borderRadius: "0px" }}
          exit={{ opacity: 0, scale: 0.96, borderRadius: "12px" }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Header */}
          <div className="relative z-10 flex items-center justify-between border-b border-[#EBEEF1] bg-white px-[16px] py-[10px]">
            <p className="text-[12px] font-[500] leading-[20px] tracking-[-0.15px] text-[#353A44]">New product</p>
            <div className="flex items-center gap-[10px]">
              <button
                type="button"
                className="h-[28px] rounded-[6px] border border-[#D8DEE4] bg-white px-[10px] py-[6px] text-[12px] font-[600] leading-[14px] tracking-[-0.024px] text-[#353A44] shadow-[0_1px_1px_rgba(33,37,44,0.16)] transition-colors hover:bg-[#F5F6F8]"
                onClick={onClose}
              >
                Discard
              </button>
              <button
                type="button"
                className="h-[28px] whitespace-nowrap rounded-[6px] bg-[#675DFF] px-[10px] py-[6px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-white shadow-[0_1px_1px_rgba(47,14,99,0.32)] transition-colors hover:bg-[#5B52F0]"
                onClick={handleSubmit}
              >
                Create product
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex flex-1 min-h-0 bg-[#F5F6F8]">
            {/* Sidebar nav */}
            <aside className="relative z-10 flex h-full w-[220px] min-w-[220px] shrink-0 flex-col gap-[2px] border-r border-[#EBEEF1] bg-white pt-[12px] px-[8px]">
              <button
                type="button"
                className={`flex w-full items-center gap-[8px] rounded-[6px] px-[8px] py-[4px] text-[12px] font-[400] leading-[16px] transition-colors ${activeNav === "product" ? "bg-[#F5F6F8]" : "hover:bg-[#F5F6F8]"}`}
                onClick={() => setActiveNav("product")}
              >
                <span className="flex h-[16px] shrink-0 items-center justify-center">
                  <CatalogObjectGlyph kind={productType === "Flat" ? "subscriptionFee" : "product"} />
                </span>
                <span className={`min-w-0 truncate ${name.trim() ? "text-[#1A2C44]" : "text-[#6C7688]"}`}>
                  {name.trim() || "Untitled product"}
                </span>
              </button>

              {/* Prices nested under product */}
              <div className="flex flex-col gap-[2px] pl-[15px]">
                {prices.map((p) => {
                  const priceSummary = p.amount ? `$${p.amount}${p.chargeType === "Recurring" ? ` / ${p.billingPeriod.toLowerCase().replace("ly", "")}` : " one-time"}` : ""
                  return (
                    <button
                      key={p.id}
                      type="button"
                      className={`flex w-full items-center gap-[8px] rounded-[6px] px-[8px] py-[4px] text-[12px] font-[400] leading-[16px] transition-colors ${activeNav === p.id ? "bg-[#F5F6F8]" : "hover:bg-[#F5F6F8]"}`}
                      onClick={() => setActiveNav(p.id)}
                    >
                      <span className="flex h-[16px] shrink-0 items-center justify-center">
                        <CatalogObjectGlyph kind="price" />
                      </span>
                      <span className={`min-w-0 truncate ${priceSummary ? "text-[#1A2C44]" : "text-[#6C7688]"}`}>
                        {priceSummary || "Price"}
                      </span>
                    </button>
                  )
                })}

                <button
                  type="button"
                  className="flex w-full items-center gap-[8px] rounded-[6px] px-[8px] py-[4px] text-[12px] font-[600] leading-[16px] text-[#533AFD] hover:bg-[#F5F6F8] transition-colors"
                  onClick={addPrice}
                >
                  <AddSmallIcon />
                  <span className="min-w-0 truncate">Add price</span>
                </button>
              </div>
            </aside>

            {/* Form panel */}
            <div className="relative z-10 flex min-w-0 flex-col bg-white w-[320px] min-w-[320px] max-w-[320px] border-r border-[#EBEEF1]">
              <div className="flex-1 overflow-y-auto py-4">
                <div className="px-4">
                  {activeNav === "product" ? (
                    <ProductForm
                      name={name}
                      setName={setName}
                      description={description}
                      setDescription={setDescription}
                      productType={productType}
                      setProductType={setProductType}
                      taxCode={taxCode}
                      setTaxCode={setTaxCode}
                      taxBehavior={taxBehavior}
                      setTaxBehavior={setTaxBehavior}
                      initialMeter={initialData?.meter}
                    />
                  ) : activePrice ? (
                    <PriceForm price={activePrice} onChange={(updates) => updatePrice(activePrice.id, updates)} productType={productType} />
                  ) : null}
                </div>
              </div>
            </div>

            {/* Preview area */}
            <div className="flex flex-1 min-w-0 items-start justify-center pt-[80px]">
              <PreviewCard productName={productDisplayName} prices={prices} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const productTypeOptions = ["Flat", "Usage-based", "Composite"]

function ProductForm({ name, setName, description, setDescription, productType, setProductType, taxCode, setTaxCode, taxBehavior, setTaxBehavior, initialMeter }: {
  name: string; setName: (v: string) => void
  description: string; setDescription: (v: string) => void
  productType: string; setProductType: (v: "Flat" | "Usage-based" | "Composite") => void
  taxCode: string; setTaxCode: (v: string) => void
  taxBehavior: string; setTaxBehavior: (v: string) => void
  initialMeter?: string
}) {
  const [applicableProducts, setApplicableProducts] = useState<string[]>([])
  const [meterOptions, setMeterOptions] = useState<string[]>(defaultMeterOptions)
  const [meterValue, setMeterValue] = useState(initialMeter ?? "")

  return (
    <div className="flex flex-col gap-[12px]">
      <h3 className="text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#353A44]">Product</h3>

      <div className="flex flex-col gap-[3px]">
        <label className={labelClasses}>Product name</label>
        <input className={inputClasses} placeholder="API access" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="flex flex-col gap-[3px]">
        <label className={labelClasses}>Description</label>
        <textarea
          className="min-h-[72px] w-full resize-none rounded-[6px] border border-[#D8DEE4] bg-white p-[8px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] placeholder:text-[#6C7688] outline-none hover:border-[#B6C0CD] focus:border-[#A0D0F7] focus:shadow-[0_0_0_1.5px_#A0D0F7] transition-all"
          placeholder="Describe the product or service"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-[3px]">
        <label className={labelClasses}>Type</label>
        <SegmentedControl
          value={productType as typeof productTypeOptions[number]}
          onChange={(v) => setProductType(v as "Flat" | "Usage-based" | "Composite")}
          options={productTypeOptions as unknown as readonly string[]}
        />
      </div>

      {productType === "Usage-based" && (
        <div className="flex flex-col gap-[3px]">
          <label className={labelClasses}>Meter</label>
          <Selector
            ariaLabel="Meter"
            size="sm"
            value={meterValue}
            onChange={setMeterValue}
            options={meterOptions}
            placeholder="Select a meter"
            searchable
            searchPlaceholder="Search meters"
            fullWidth
            footerLabel="Create new meter"
            onFooterClick={() => {
              const name = prompt("Meter name:")
              if (name?.trim()) {
                setMeterOptions((prev) => [...prev, name.trim()])
                setMeterValue(name.trim())
              }
            }}
            buttonClassName="h-[32px] rounded-[6px] border border-[#D8DEE4] px-[8px] text-[12px] font-[500] text-[#353A44]"
          />
        </div>
      )}

      {productType === "Composite" && (
        <div className="flex flex-col gap-[3px]">
          <label className={labelClasses}>Applicable products</label>
          <p className="text-[11px] font-[400] leading-[14px] text-[#6C7688]">Specify products and/or families</p>
          <div className="flex min-h-[32px] flex-wrap items-center gap-[4px] rounded-[6px] border border-[#D8DEE4] bg-white px-[8px] py-[4px] hover:border-[#B6C0CD] focus-within:border-[#A0D0F7] focus-within:shadow-[0_0_0_1.5px_#A0D0F7] transition-all">
            {applicableProducts.map((p) => (
              <span key={p} className="inline-flex items-center gap-[4px] rounded-full border border-[#D8DEE4] bg-white px-[8px] py-[2px] text-[11px] font-[600] text-[#1A2C44]">
                {p}
                <button type="button" className="text-[#6C7688] hover:text-[#353A44]" onClick={() => setApplicableProducts((prev) => prev.filter((x) => x !== p))}>
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M6 2L2 6M2 2l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </button>
              </span>
            ))}
            <input
              type="text"
              placeholder={applicableProducts.length === 0 ? "e.g. All usage" : ""}
              className="min-w-[60px] flex-1 bg-transparent text-[12px] font-[500] text-[#353A44] placeholder:text-[#6C7688] outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.currentTarget.value.trim()) {
                  e.preventDefault()
                  setApplicableProducts((prev) => [...prev, e.currentTarget.value.trim()])
                  e.currentTarget.value = ""
                }
              }}
            />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-[3px]">
        <label className={labelClasses}>Tax code</label>
        <Selector ariaLabel="Tax code" size="sm" value={taxCode} onChange={setTaxCode} options={taxCodeOptions} buttonClassName="h-[32px] w-full justify-between rounded-[6px] border border-[#D8DEE4] px-[8px] text-[12px] font-[500] text-[#353A44]" />
      </div>

      <div className="flex flex-col gap-[3px]">
        <label className={labelClasses}>Tax behavior</label>
        <Selector ariaLabel="Tax behavior" size="sm" value={taxBehavior} onChange={setTaxBehavior} options={taxBehaviorOptions} buttonClassName="h-[32px] w-full justify-between rounded-[6px] border border-[#D8DEE4] px-[8px] text-[12px] font-[500] text-[#353A44]" />
      </div>
    </div>
  )
}

const compositePricingModelOptions = ["Percent", "Flat fee", "Per unit"]

function PriceForm({ price, onChange, productType }: { price: PriceEntry; onChange: (updates: Partial<PriceEntry>) => void; productType: string }) {

  if (productType === "Composite") {
    return (
      <div className="flex flex-col gap-[12px]">
        <div className="flex flex-col gap-[2px]">
          <h3 className="text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#353A44]">Pricing</h3>
          <p className="text-[11px] font-[400] leading-[14px] text-[#6C7688]">Optionally setup your list pricing for this product</p>
        </div>

        <div className="flex flex-col gap-[3px]">
          <label className={labelClasses}>Pricing model</label>
          <Selector
            ariaLabel="Pricing model"
            size="sm"
            value={price.pricingModel === "Flat rate" ? "Percent" : price.pricingModel}
            onChange={(v) => onChange({ pricingModel: v })}
            options={compositePricingModelOptions}
            buttonClassName="h-[32px] w-full justify-between rounded-[6px] border border-[#D8DEE4] px-[8px] text-[12px] font-[500] text-[#353A44]"
          />
        </div>

        <div className="flex flex-col gap-[3px]">
          <label className={labelClasses}>Price</label>
          <div className="flex h-[32px] items-center rounded-[6px] border border-[#D8DEE4] bg-white px-[8px] hover:border-[#B6C0CD] focus-within:border-[#A0D0F7] focus-within:shadow-[0_0_0_1.5px_#A0D0F7] transition-all">
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              className="min-w-0 flex-1 bg-transparent text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] placeholder:text-[#6C7688] outline-none"
              value={price.amount}
              onChange={(e) => onChange({ amount: e.target.value.replace(/[^0-9.]/g, "") })}
            />
            <span className="text-[12px] font-[600] text-[#353A44] ml-[4px]">
              {(price.pricingModel === "Percent" || price.pricingModel === "Flat rate") ? "%" : "$"}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-[12px]">
      <h3 className="text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#353A44]">Price</h3>

      <SegmentedControl
        value={price.chargeType}
        onChange={(v) => onChange({ chargeType: v as "Recurring" | "One-off" })}
        options={["Recurring", "One-off"] as const}
      />

      <div className="flex flex-col gap-[3px]">
        <label className={labelClasses}>Pricing model</label>
        <Selector ariaLabel="Pricing model" size="sm" value={price.pricingModel} onChange={(v) => onChange({ pricingModel: v })} options={pricingModelOptions} buttonClassName="h-[32px] w-full justify-between rounded-[6px] border border-[#D8DEE4] px-[8px] text-[12px] font-[500] text-[#353A44]" />
      </div>

      <div className="flex flex-col gap-[3px]">
        <label className={labelClasses}>Amount</label>
        <div className="flex h-[32px] items-center rounded-[6px] border border-[#D8DEE4] bg-white px-[8px] hover:border-[#B6C0CD] focus-within:border-[#A0D0F7] focus-within:shadow-[0_0_0_1.5px_#A0D0F7] transition-all">
          <span className="text-[12px] font-[500] text-[#6C7688] mr-[4px]">$</span>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            className="min-w-0 flex-1 bg-transparent text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] placeholder:text-[#6C7688] outline-none"
            value={price.amount}
            onChange={(e) => onChange({ amount: e.target.value.replace(/[^0-9.]/g, "") })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-[3px]">
        <label className={labelClasses}>Currency</label>
        <Selector
          ariaLabel="Currency"
          size="sm"
          value={price.currency}
          onChange={(v) => onChange({ currency: v })}
          options={currencyOptions}
          searchable
          searchPlaceholder="Search currencies"
          fullWidth
          triggerIcon={<CurrencyFlag currency={price.currency} />}
          renderOption={(code) => (
            <div className="flex min-w-0 flex-1 items-center gap-[8px]">
              <CurrencyFlag currency={code} className="shrink-0" />
              <span className="font-[500] text-[#353A44]">{code}</span>
            </div>
          )}
          buttonClassName="h-[32px] rounded-[6px] border border-[#D8DEE4] px-[8px] text-[12px] font-[500] text-[#353A44]"
        />
      </div>

      <div className="flex flex-col gap-[3px]">
        <label className={labelClasses}>Include tax in price</label>
        <Selector ariaLabel="Include tax in price" size="sm" value={price.includeTax} onChange={(v) => onChange({ includeTax: v })} options={includeTaxOptions} buttonClassName="h-[32px] w-full justify-between rounded-[6px] border border-[#D8DEE4] px-[8px] text-[12px] font-[500] text-[#353A44]" />
      </div>

      {price.chargeType === "Recurring" && (
        <div className="flex flex-col gap-[3px]">
          <label className={labelClasses}>Billing period</label>
          <Selector ariaLabel="Billing period" size="sm" value={price.billingPeriod} onChange={(v) => onChange({ billingPeriod: v })} options={billingPeriodOptions} buttonClassName="h-[32px] w-full justify-between rounded-[6px] border border-[#D8DEE4] px-[8px] text-[12px] font-[500] text-[#353A44]" />
        </div>
      )}

      <div className="flex flex-col gap-[3px]">
        <label className={labelClasses}>Unit label</label>
        <input
          className={inputClasses}
          placeholder="e.g. seat, request, token"
          value={price.unitLabel}
          onChange={(e) => onChange({ unitLabel: e.target.value })}
        />
        <p className="text-[11px] font-[400] leading-[14px] text-[#6C7688] mt-[1px]">Describes how you sell your product. Appears on invoices and receipts.</p>
      </div>

      {price.chargeType === "One-off" && (
        <CreditGrantRuleSection
          creditGrant={price.creditGrant}
          onAdd={() => {
            const grantId = Date.now()
            onChange({ creditGrant: { id: grantId, name: "", amount: "", period: "One-time" } })
          }}
          onUpdate={(updates) => {
            if (price.creditGrant) {
              onChange({ creditGrant: { ...price.creditGrant, ...updates } })
            }
          }}
        />
      )}
    </div>
  )
}

function CreditGrantRuleSection({
  creditGrant,
  onAdd,
  onUpdate,
}: {
  creditGrant?: CreditGrantEntry
  onAdd: () => void
  onUpdate: (updates: Partial<CreditGrantEntry>) => void
  editing?: boolean
  setEditing?: (v: boolean) => void
}) {
  if (!creditGrant) {
    return (
      <div className="border-t border-[#ECF1F6] pt-[12px]">
        <button
          type="button"
          className="flex items-center gap-[4px] text-[12px] font-[500] leading-[16px] text-[#533AFD] hover:text-[#4229E3] cursor-pointer"
          onClick={onAdd}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8" fill="none" className="shrink-0">
            <path
              d="M4.75 0.75C4.75 0.335786 4.41421 0 4 0C3.58579 0 3.25 0.335786 3.25 0.75V3.25H0.75C0.335786 3.25 0 3.58579 0 4C0 4.41421 0.335786 4.75 0.75 4.75H3.25V7.25C3.25 7.66421 3.58579 8 4 8C4.41421 8 4.75 7.66421 4.75 7.25V4.75H7.25C7.66421 4.75 8 4.41421 8 4C8 3.58579 7.66421 3.25 7.25 3.25H4.75V0.75Z"
              fill="currentColor"
            />
          </svg>
          <span>Grant credits</span>
        </button>
      </div>
    )
  }

  return (
    <div className="border-t border-[#ECF1F6] pt-[12px]">
      <div className="flex flex-col gap-[10px] rounded-[8px] border border-[#D8DEE4] bg-[#FAFBFC] p-[12px]">
        <div className="flex items-center gap-[6px]">
          <CreditGrantMiniIcon style={{ color: "#3C4F69" }} />
          <span className="text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#1A2C44]">Credit grant</span>
        </div>
        <div className="flex flex-col gap-[3px]">
          <label className={labelClasses}>Name</label>
          <input
            className={inputClasses}
            placeholder="e.g. Starter credits"
            value={creditGrant.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-[3px]">
          <label className={labelClasses}>Amount</label>
          <div className="flex h-[32px] items-center rounded-[6px] border border-[#D8DEE4] bg-white px-[8px] hover:border-[#B6C0CD] focus-within:border-[#A0D0F7] focus-within:shadow-[0_0_0_1.5px_#A0D0F7] transition-all">
            <span className="text-[12px] font-[500] text-[#6C7688] mr-[4px]">$</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              className="min-w-0 flex-1 bg-transparent text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] placeholder:text-[#6C7688] outline-none"
              value={creditGrant.amount}
              onChange={(e) => onUpdate({ amount: e.target.value.replace(/[^0-9.]/g, "") })}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function PreviewCard({ productName, prices }: { productName: string; prices: PriceEntry[] }) {
  if (prices.length === 0) {
    return (
      <div className="w-[360px] rounded-[8px] border border-[#EBEEF1] bg-white px-[24px] py-[20px]">
        <p className="text-[14px] font-[600] leading-[20px] text-[#353A44]">Product</p>
        <p className="mt-[4px] text-[12px] font-[400] leading-[16px] text-[#6C7688]">Add prices to see how this product will be billed.</p>
      </div>
    )
  }

  return (
    <div className="w-[360px] rounded-[8px] border border-[#EBEEF1] bg-white px-[24px] py-[20px]">
      <p className="text-[15px] font-[600] leading-[20px] text-[#353A44] mb-[16px]">{productName}</p>
      <div className="flex flex-col gap-[14px]">
        {prices.map((p) => {
          const amountDisplay = p.amount ? `$${p.amount}` : "$0.00"
          const typeLabel = p.pricingModel === "Flat rate" ? "Fixed price" : p.pricingModel
          const periodLabel = p.chargeType === "Recurring" ? `Billed ${p.billingPeriod.toLowerCase()}` : "One-time"
          const perLabel = p.chargeType === "Recurring" ? `Per ${p.billingPeriod === "Monthly" ? "month" : p.billingPeriod === "Yearly" ? "year" : p.billingPeriod.toLowerCase().replace("ly", "")}` : ""
          const hasCreditGrant = p.creditGrant && (p.creditGrant.name || p.creditGrant.amount)
          return (
            <div key={p.id} className="flex flex-col gap-[10px]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[12px] font-[600] leading-[16px] text-[#353A44]">{typeLabel}</p>
                  <p className="text-[11px] font-[400] leading-[14px] text-[#6C7688]">{periodLabel}</p>
                </div>
                <div className="text-right">
                  <p className="text-[12px] font-[600] leading-[16px] text-[#353A44]">{amountDisplay}</p>
                  {perLabel && <p className="text-[11px] font-[400] leading-[14px] text-[#6C7688]">{perLabel}</p>}
                </div>
              </div>
              {hasCreditGrant && (
                <div className="ml-[12px] flex items-center gap-[8px] rounded-[6px] border-l-[2px] border-[#C3B6FB] bg-[#FAFBFC] px-[10px] py-[8px]">
                  <CreditGrantMiniIcon style={{ color: "#675DFF" }} />
                  <div className="flex min-w-0 flex-1 flex-col gap-[1px]">
                    <span className="truncate text-[11px] font-[600] leading-[14px] text-[#353A44]">
                      {p.creditGrant!.name || "Credit grant"}
                    </span>
                    {p.creditGrant!.amount && (
                      <span className="text-[11px] font-[400] leading-[14px] text-[#667691]">
                        ${p.creditGrant!.amount} one-time
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
