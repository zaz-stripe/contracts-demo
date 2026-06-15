'use client'

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { defaultMeterOptions, textFieldInputClasses } from "@/components/product-catalog/productCatalogPage.constants"
import { SegmentedControl } from "@/components/SegmentedControl"
import { Selector } from "@/components/Selector"
import { FormRow } from "@/components/FormRow"
import { CatalogObjectGlyph } from "@/components/product-catalog/iconography"
import { AddSmallIcon, TrashIcon } from "@/components/ProductCatalogIcons"
import { MetersListView } from "@/components/product-catalog/MetersListView"
import { TableRowActions } from "@/components/product-catalog/TableRowActions"

type ProductCatalogTab = "plans" | "products" | "meters" | "features" | "coupons" | "shipping-rates" | "tax-rates" | "pricing-table"

type SavedPrice = {
  id: number
  name: string
  pricingModel: string
  price: string
  currency: string
  cadence: string
  meter: string
  priceType: string
  sellAs: string
  unitLabel: string
}

type ProductEntry = {
  id: number
  name: string
  description: string
  type: "Flat" | "Usage"
  price: string
  currency: string
  cadence: string
  status: "active" | "draft"
  prices?: SavedPrice[]
}

type PlanSummary = {
  id: number
  name: string
  status?: "draft" | "live"
  amount: string
  currency: string
  billingPeriod: string
}

type ProductCatalogViewProps = {
  onCreatePricingPlan: () => void
  pricingPlans: PlanSummary[]
  onPlanClick: (planId: number) => void
  onProductClick?: (product: ProductEntry) => void
  onMorePricingOptions?: (data: { name: string; description: string; price: string; currency: string; cadence: string; chargeType: string; taxCode: string; taxBehavior: string }) => void
}

const TABS: { id: ProductCatalogTab; label: string }[] = [
  { id: "plans", label: "Plans" },
  { id: "products", label: "Products" },
  { id: "meters", label: "Meters" },
  { id: "features", label: "Features" },
  { id: "coupons", label: "Coupons" },
  { id: "shipping-rates", label: "Shipping rates" },
  { id: "tax-rates", label: "Tax rates" },
  { id: "pricing-table", label: "Pricing table" },
]

type ProductFilter = "products" | "price-groups"

const PRODUCT_STORAGE_KEY = "product-catalog-standalone-products"
const PRODUCT_DATA_VERSION = "v7"

if (typeof window !== "undefined" && window.localStorage.getItem("product-catalog-data-version") !== PRODUCT_DATA_VERSION) {
  // Keep user-created items (positive IDs), only reset defaults (negative IDs)
  try {
    const rawP = window.localStorage.getItem(PRODUCT_STORAGE_KEY)
    if (rawP) {
      const stored = JSON.parse(rawP) as { id: number }[]
      const userOnly = stored.filter((p) => p.id > 0)
      window.localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(userOnly))
    }
    const rawG = window.localStorage.getItem("product-catalog-price-groups")
    if (rawG) {
      const stored = JSON.parse(rawG) as { id: number }[]
      const userOnly = stored.filter((g) => g.id > 0)
      window.localStorage.setItem("product-catalog-price-groups", JSON.stringify(userOnly))
    }
    const rawPlans = window.localStorage.getItem("product-catalog-pricing-plans-v2")
    if (rawPlans) {
      const stored = JSON.parse(rawPlans) as { id: number }[]
      const userOnly = stored.filter((p) => p.id > 0)
      window.localStorage.setItem("product-catalog-pricing-plans-v2", JSON.stringify(userOnly))
    }
  } catch {}
  window.localStorage.setItem("product-catalog-data-version", PRODUCT_DATA_VERSION)
}

const DEFAULT_VERCEL_PRODUCTS: ProductEntry[] = [
  // Flat products (subscription fees)
  { id: -2001, name: "Pro Seat", description: "Per-user subscription for Pro plan", type: "Flat", price: "20.00", currency: "USD", cadence: "Monthly", status: "active", prices: [{ id: 1, name: "$20/month per seat", pricingModel: "Flat rate", price: "20.00", currency: "USD", cadence: "Monthly", meter: "", priceType: "Flat fee", sellAs: "Per unit", unitLabel: "seat" }] },
  { id: -2002, name: "Enterprise Seat", description: "Per-user subscription for Enterprise plan", type: "Flat", price: "99.00", currency: "USD", cadence: "Monthly", status: "active", prices: [{ id: 2, name: "$99/month per seat", pricingModel: "Flat rate", price: "99.00", currency: "USD", cadence: "Monthly", meter: "", priceType: "Flat fee", sellAs: "Per unit", unitLabel: "seat" }] },
  // Usage-based products
  { id: -2010, name: "Functions — Active CPU", description: "Serverless compute active CPU time (Fluid Compute)", type: "Usage", price: "$0.128 / hour", currency: "USD", cadence: "Monthly", status: "active", prices: [{ id: 10, name: "$0.128 per CPU-hour", pricingModel: "Usage-based", price: "0.128", currency: "USD", cadence: "Monthly", meter: "function_active_cpu_hrs", priceType: "Flat fee", sellAs: "Per unit", unitLabel: "CPU-hour" }] },
  { id: -2011, name: "Functions — Memory", description: "Serverless provisioned memory (GB-hours)", type: "Usage", price: "$0.0106 / GB-hr", currency: "USD", cadence: "Monthly", status: "active", prices: [{ id: 11, name: "$0.0106 per GB-hr", pricingModel: "Usage-based", price: "0.0106", currency: "USD", cadence: "Monthly", meter: "function_memory_gb_hrs", priceType: "Flat fee", sellAs: "Per unit", unitLabel: "GB-hr" }] },
  { id: -2012, name: "Functions — Invocations", description: "Number of serverless function invocations", type: "Usage", price: "$0.60 / 1M", currency: "USD", cadence: "Monthly", status: "active", prices: [{ id: 12, name: "$0.60 per 1M invocations", pricingModel: "Usage-based", price: "0.60", currency: "USD", cadence: "Monthly", meter: "function_invocations", priceType: "Flat fee", sellAs: "Per unit", unitLabel: "1M invocations" }] },
  { id: -2013, name: "Edge Requests", description: "Requests served at the Vercel edge network", type: "Usage", price: "$2.00 / 1M", currency: "USD", cadence: "Monthly", status: "active", prices: [{ id: 13, name: "$2.00 per 1M requests", pricingModel: "Usage-based", price: "2.00", currency: "USD", cadence: "Monthly", meter: "edge_requests", priceType: "Graduated", sellAs: "Per unit", unitLabel: "1M requests" }] },
  { id: -2014, name: "Fast Data Transfer", description: "Data transfer from Vercel edge to end users", type: "Usage", price: "$0.15 / GB", currency: "USD", cadence: "Monthly", status: "active", prices: [{ id: 14, name: "$0.15 per GB", pricingModel: "Usage-based", price: "0.15", currency: "USD", cadence: "Monthly", meter: "fast_data_transfer_gb", priceType: "Graduated", sellAs: "Per unit", unitLabel: "GB" }] },
  { id: -2015, name: "Image Optimization", description: "Image transformations, resizing, and format conversion", type: "Usage", price: "$0.05 / 1K transforms", currency: "USD", cadence: "Monthly", status: "active", prices: [{ id: 15, name: "$0.05 per 1K transformations", pricingModel: "Usage-based", price: "0.05", currency: "USD", cadence: "Monthly", meter: "image_transformations", priceType: "Graduated", sellAs: "Per unit", unitLabel: "1K transformations" }] },
  { id: -2016, name: "Blob Storage", description: "Object storage for files, images, and static assets", type: "Usage", price: "$0.023 / GB", currency: "USD", cadence: "Monthly", status: "active", prices: [{ id: 16, name: "$0.023 per GB stored", pricingModel: "Usage-based", price: "0.023", currency: "USD", cadence: "Monthly", meter: "blob_storage_gb", priceType: "Flat fee", sellAs: "Per unit", unitLabel: "GB" }] },
  { id: -2017, name: "Web Analytics", description: "Privacy-friendly, real-user analytics with Core Web Vitals", type: "Usage", price: "$3.00 / 100K events", currency: "USD", cadence: "Monthly", status: "active", prices: [{ id: 17, name: "$3.00 per 100K events", pricingModel: "Usage-based", price: "3.00", currency: "USD", cadence: "Monthly", meter: "web_analytics_events", priceType: "Flat fee", sellAs: "Per unit", unitLabel: "100K events" }] },
  { id: -2018, name: "ISR", description: "Incremental Static Regeneration reads and writes", type: "Usage", price: "$0.40 / 1M reads", currency: "USD", cadence: "Monthly", status: "active", prices: [{ id: 18, name: "$0.40 per 1M reads", pricingModel: "Usage-based", price: "0.40", currency: "USD", cadence: "Monthly", meter: "isr_reads", priceType: "Graduated", sellAs: "Per unit", unitLabel: "1M reads" }] },
  { id: -2019, name: "Edge Config", description: "Global edge configuration store reads and writes", type: "Usage", price: "$3.00 / 1M reads", currency: "USD", cadence: "Monthly", status: "active", prices: [{ id: 19, name: "$3.00 per 1M reads", pricingModel: "Usage-based", price: "3.00", currency: "USD", cadence: "Monthly", meter: "edge_config_reads", priceType: "Graduated", sellAs: "Per unit", unitLabel: "1M reads" }] },
]

function loadProducts(): ProductEntry[] {
  if (typeof window === "undefined") return DEFAULT_VERCEL_PRODUCTS
  try {
    const raw = window.localStorage.getItem(PRODUCT_STORAGE_KEY)
    const stored: ProductEntry[] = raw ? JSON.parse(raw) : []
    const defaultIds = new Set(DEFAULT_VERCEL_PRODUCTS.map((p) => p.id))
    const userProducts = stored.filter((p) => !defaultIds.has(p.id))
    const all = [...DEFAULT_VERCEL_PRODUCTS, ...userProducts]
    // Always persist full list so other components can read from localStorage
    window.localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(all))
    return all
  } catch {
    return DEFAULT_VERCEL_PRODUCTS
  }
}

function saveProducts(products: ProductEntry[]) {
  window.localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(products))
}

function CurrencyFlag({ code }: { code: string }) {
  const flags: Record<string, string> = { USD: "\u{1F1FA}\u{1F1F8}", EUR: "\u{1F1EA}\u{1F1FA}", GBP: "\u{1F1EC}\u{1F1E7}", JPY: "\u{1F1EF}\u{1F1F5}" }
  return <span className="text-[12px]">{flags[code] ?? "\u{1F4B0}"}</span>
}

const pricingModelOptions = ["One-off", "Recurring", "Usage-based"] as const
const priceTypeOptions = ["Flat fee", "Volume", "Graduated"] as const
const sellAsOptions = ["Individual units", "Package"] as const
const cadenceOptions = ["Monthly", "Yearly"]
const currencyOptions = ["USD", "EUR", "GBP"]

type ProductPriceState = {
  id: number
  name: string
  pricingModel: string
  price: string
  currency: string
  cadence: string
  meter: string
  priceType: string
  sellAs: string
  unitLabel: string
  tiers: number[]
  tierToValues: Record<number, string>
  tierUnitPrices: Record<number, string>
  tierFlatFees: Record<number, string>
}

function makeDefaultPrice(id: number): ProductPriceState {
  return { id, name: "", pricingModel: "Usage-based", price: "", currency: "USD", cadence: "Monthly", meter: "", priceType: "Flat fee", sellAs: "Individual units", unitLabel: "", tiers: [0, 1], tierToValues: { 0: "1,000" }, tierUnitPrices: {}, tierFlatFees: {} }
}

function priceTreeLabel(ps: ProductPriceState): string {
  const parts: string[] = []
  if (ps.cadence) parts.push(ps.cadence)
  if (ps.price) parts.push(`$${ps.price}`)
  return parts.length > 0 ? parts.join(", ") : "Price"
}

function PriceFormFields({ ps, onChange, hideMeter }: { ps: ProductPriceState; onChange: (next: ProductPriceState) => void; hideMeter?: boolean }) {
  const priceInputClasses = "flex h-[30px] items-center rounded-[6px] border border-[#D8DEE4] bg-white px-3 hover:border-[#B6C0CD] focus-within:shadow-[0_0_0_1.5px_#A0D0F7] focus-within:border-[#A0D0F7] transition-all"

  const isUsage = ps.pricingModel === "Usage-based"
  const isTiered = isUsage && (ps.priceType === "Volume" || ps.priceType === "Graduated")
  const isPackage = ps.sellAs === "Package"
  const nextTierId = () => (ps.tiers.length > 0 ? Math.max(...ps.tiers) + 1 : 0)

  return (
    <div className="flex flex-col gap-[12px]">

      {!isUsage && (
        <>
          <FormRow label="Price">
            <div className="flex items-center">
              <div className={`${priceInputClasses} rounded-r-none`}>
                <span className="text-[12px] font-[500] text-[#6C7688] mr-[4px]">$</span>
                <input className="w-[48px] bg-transparent text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] outline-none placeholder:text-[#6C7688]" placeholder="0.00" value={ps.price} onChange={(e) => onChange({ ...ps, price: e.target.value.replace(/[^0-9.]/g, "") })} />
              </div>
              <div className="-ml-px">
                <Selector ariaLabel="Currency" size="sm" value={ps.currency} onChange={(v) => onChange({ ...ps, currency: v })} options={currencyOptions} buttonClassName="h-[30px] rounded-l-none" />
              </div>
            </div>
          </FormRow>
          {ps.pricingModel === "Recurring" && (
            <FormRow label="Cadence">
              <Selector ariaLabel="Cadence" size="sm" value={ps.cadence} onChange={(v) => onChange({ ...ps, cadence: v })} options={cadenceOptions} />
            </FormRow>
          )}
        </>
      )}

      {isUsage && (
        <>
          {!hideMeter && (
            <FormRow label="Meter">
              <Selector ariaLabel="Meter" size="sm" value={ps.meter} onChange={(v) => onChange({ ...ps, meter: v })} options={defaultMeterOptions} placeholder="Add or select a meter" fullWidth />
            </FormRow>
          )}
          <FormRow label="Price type">
            <SegmentedControl
              value={ps.priceType}
              options={priceTypeOptions}
              onChange={(v) => {
                const next = { ...ps, priceType: v }
                if ((v === "Volume" || v === "Graduated") && ps.tiers.length < 2) {
                  next.tiers = [0, 1]; next.tierToValues = { 0: "1,000" }
                }
                onChange(next)
              }}
            />
          </FormRow>
          <FormRow label="Sell as">
            <SegmentedControl value={ps.sellAs} options={sellAsOptions} onChange={(v) => onChange({ ...ps, sellAs: v })} />
          </FormRow>

          {!isTiered && (
            <FormRow label="Price per unit">
              <div className={priceInputClasses}>
                <span className="text-[12px] font-[500] text-[#6C7688] mr-[4px]">$</span>
                <input className="w-[48px] bg-transparent text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] outline-none placeholder:text-[#6C7688]" placeholder="0.00" value={ps.price} onChange={(e) => onChange({ ...ps, price: e.target.value.replace(/[^0-9.]/g, "") })} />
              </div>
            </FormRow>
          )}

          {isTiered && (
            <div className="px-4">
              <div className="rounded-[6px] border border-[#D8DEE4] overflow-hidden">
                <div className="grid w-full grid-cols-4 items-center border-b border-[#EBEEF1] bg-[#F9FAFB] text-[11px] font-[500] leading-[16px] text-[#6C7688]">
                  <div className="px-[8px] py-[6px]">From</div>
                  <div className="px-[8px] py-[6px] border-l border-[#EBEEF1]">To</div>
                  <div className="px-[8px] py-[6px] border-l border-[#EBEEF1]">Unit price</div>
                  <div className="px-[8px] py-[6px] border-l border-[#EBEEF1]">Flat fee</div>
                </div>
                {ps.tiers.map((id, index) => {
                  const isLast = index === ps.tiers.length - 1
                  const prevTo = index > 0 ? (parseInt((ps.tierToValues[ps.tiers[index - 1]] ?? "").replace(/[^0-9]/g, ""), 10) || (index * 1000)) : 0
                  const fromVal = index === 0 ? 0 : prevTo + 1
                  return (
                    <div key={id} className={`group relative grid w-full grid-cols-4 items-center ${index < ps.tiers.length - 1 ? "border-b border-[#EBEEF1]" : ""}`}>
                      <div className="flex h-[28px] items-center px-[8px] text-[11px] font-[500] text-[#353A44] bg-[#F9FAFB]">{fromVal.toLocaleString()}</div>
                      <div className="border-l border-[#EBEEF1]">
                        {isLast ? (
                          <div className="flex h-[28px] items-center px-[8px] text-[11px] font-[500] text-[#353A44] bg-[#F9FAFB]">∞</div>
                        ) : (
                          <input className="flex h-[28px] w-full items-center bg-white px-[8px] text-[11px] font-[500] text-[#353A44] outline-none focus:shadow-[0_0_0_1.5px_#A0D0F7] focus:relative focus:z-10" value={ps.tierToValues[id] ?? ""} placeholder="1,000" onChange={(e) => onChange({ ...ps, tierToValues: { ...ps.tierToValues, [id]: e.target.value.replace(/[^0-9,]/g, "") } })} />
                        )}
                      </div>
                      <div className="border-l border-[#EBEEF1]">
                        <div className="flex h-[28px] w-full items-center gap-[2px] bg-white px-[8px] focus-within:shadow-[0_0_0_1.5px_#A0D0F7] focus-within:relative focus-within:z-10">
                          <span className="text-[11px] text-[#6C7688]">$</span>
                          <input className="w-full bg-transparent text-[11px] font-[500] text-[#353A44] outline-none placeholder:text-[#818DA0]" placeholder="0.00" value={ps.tierUnitPrices[id] ?? ""} onChange={(e) => onChange({ ...ps, tierUnitPrices: { ...ps.tierUnitPrices, [id]: e.target.value.replace(/[^0-9.]/g, "") } })} />
                        </div>
                      </div>
                      <div className="border-l border-[#EBEEF1]">
                        <div className="flex h-[28px] w-full items-center gap-[2px] bg-white px-[8px] focus-within:shadow-[0_0_0_1.5px_#A0D0F7] focus-within:relative focus-within:z-10">
                          <span className="text-[11px] text-[#6C7688]">$</span>
                          <input className="w-full bg-transparent text-[11px] font-[500] text-[#353A44] outline-none placeholder:text-[#818DA0]" placeholder="0.00" value={ps.tierFlatFees[id] ?? ""} onChange={(e) => onChange({ ...ps, tierFlatFees: { ...ps.tierFlatFees, [id]: e.target.value.replace(/[^0-9.]/g, "") } })} />
                        </div>
                      </div>
                      {index > 0 && (
                        <button type="button" className="absolute right-[-24px] top-1/2 -translate-y-1/2 flex h-[20px] w-[20px] items-center justify-center rounded-[4px] text-[#9CA3B0] opacity-0 group-hover:opacity-100 hover:bg-[#FEF4F6] hover:text-[#DF1B41] transition-all" onClick={() => onChange({ ...ps, tiers: ps.tiers.filter((t) => t !== id) })}>
                          <TrashIcon />
                        </button>
                      )}
                    </div>
                  )
                })}
                <button type="button" className="flex h-[28px] w-full items-center gap-[6px] border-t border-[#EBEEF1] bg-white px-[8px] text-[11px] font-[500] leading-[16px] text-[#533AFD] hover:bg-[#F9FAFB] transition-colors" onClick={() => onChange({ ...ps, tiers: [...ps.tiers, nextTierId()] })}>
                  <AddSmallIcon />
                  Add tier
                </button>
              </div>
            </div>
          )}

          <FormRow label={isPackage ? "Package label" : "Unit label"}>
            <input className={`${textFieldInputClasses} !w-[88px]`} placeholder={isPackage ? "e.g. seats" : "e.g. token"} value={ps.unitLabel} onChange={(e) => onChange({ ...ps, unitLabel: e.target.value })} />
          </FormRow>
          <FormRow label="Cadence">
            <Selector ariaLabel="Cadence" size="sm" value={ps.cadence} onChange={(v) => onChange({ ...ps, cadence: v })} options={cadenceOptions} />
          </FormRow>
        </>
      )}
    </div>
  )
}

function pricesToSaved(prices: ProductPriceState[]): SavedPrice[] {
  return prices.map((p) => ({ id: p.id, name: p.name, pricingModel: p.pricingModel, price: p.price, currency: p.currency, cadence: p.cadence, meter: p.meter, priceType: p.priceType, sellAs: p.sellAs, unitLabel: p.unitLabel }))
}

function savedToState(saved: SavedPrice[]): ProductPriceState[] {
  return saved.map((s) => ({ ...makeDefaultPrice(s.id), ...s }))
}

function CreateProductModal({ onClose, onSave, initial, onMorePricingOptions }: {
  onClose: () => void
  onSave: (product: Omit<ProductEntry, "id" | "status">) => void
  initial?: ProductEntry
  onMorePricingOptions?: (data: { name: string; description: string; price: string; currency: string; cadence: string; chargeType: string; taxCode: string; taxBehavior: string }) => void
}) {
  const isEditing = Boolean(initial)
  const [name, setName] = useState(initial?.name ?? "")
  const [description, setDescription] = useState(initial?.description ?? "")
  const [productType, setProductType] = useState<"Flat" | "Usage-based" | "Composite">(initial?.type === "Usage" ? "Usage-based" : "Flat")
  const [meter, setMeter] = useState("")
  const [applicableProducts, setApplicableProducts] = useState<string[]>([])
  const [compositePricingModel, setCompositePricingModel] = useState("Percent")
  const [chargeType, setChargeType] = useState<"Recurring" | "One-off">(() => {
    if (initial?.cadence === "One time") return "One-off"
    return "Recurring"
  })
  const [price, setPrice] = useState(() => initial?.price ?? "")
  const [currency, setCurrency] = useState(() => initial?.currency ?? "USD")
  const [cadence, setCadence] = useState(() => initial?.cadence ?? "Monthly")
  const [taxCode, setTaxCode] = useState("Account default")
  const [taxBehavior, setTaxBehavior] = useState("Unspecified")
  const [showAdvanced, setShowAdvanced] = useState(false)

  const canSubmit = name.trim().length > 0

  const buildSaveData = (): Omit<ProductEntry, "id" | "status"> => ({
    name: name.trim(),
    description,
    type: productType === "Usage-based" ? "Usage" : "Flat",
    price,
    currency,
    cadence: chargeType === "One-off" ? "One time" : cadence,
    prices: [{
      id: 0,
      name: "",
      pricingModel: chargeType === "One-off" ? "One-off" : "Recurring",
      price,
      currency,
      cadence: chargeType === "One-off" ? "One time" : cadence,
      meter: "",
      priceType: "Flat fee",
      sellAs: "Individual units",
      unitLabel: "",
    }],
  })

  const labelClasses = "text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44]"
  const inputClasses = "h-[32px] w-full rounded-[6px] border border-[#D8DEE4] bg-white p-[8px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] placeholder:text-[#6C7688] outline-none hover:border-[#B6C0CD] focus:border-[#A0D0F7] focus:shadow-[0_0_0_1.5px_#A0D0F7] transition-all"

  const billingPeriodOptions = ["Monthly", "Yearly", "Weekly", "Daily"]
  const taxCodeOptions = ["Account default", "Digital", "Physical", "Service"]
  const taxBehaviorOptions = ["Unspecified", "Inclusive", "Exclusive"]

  return (
    <div className="fixed inset-0 z-[900] flex items-center justify-center">
      <div className="absolute inset-0 bg-[#1A2C44]/20 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 flex w-full max-w-[480px] max-h-[90vh] flex-col overflow-hidden rounded-[12px] border border-[#D4DEE9] bg-white shadow-[0px_15px_35px_0px_rgba(48,49,61,0.08),0px_5px_15px_0px_rgba(0,0,0,0.12)]">
        {/* Header */}
        <div className="px-[24px] pt-[24px] pb-[4px]">
          <h2 className="text-[16px] font-[600] leading-[24px] text-[#1A2C44]">{isEditing ? "Edit product" : "New product"}</h2>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-[12px] px-[24px] py-[16px]">
            {/* Product name */}
            <div className="flex flex-col gap-[3px]">
              <label className={labelClasses}>Product name</label>
              <input
                className={inputClasses}
                placeholder="API access"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-[3px]">
              <label className={labelClasses}>Description</label>
              <textarea
                className="min-h-[72px] w-full resize-none rounded-[6px] border border-[#D8DEE4] bg-white p-[8px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] placeholder:text-[#6C7688] outline-none hover:border-[#B6C0CD] focus:border-[#A0D0F7] focus:shadow-[0_0_0_1.5px_#A0D0F7] transition-all"
                placeholder="Describe the product or service"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Product type */}
            <div className="flex flex-col gap-[3px]">
              <label className={labelClasses}>Type</label>
              <SegmentedControl
                value={productType}
                onChange={(v) => setProductType(v as "Flat" | "Usage-based" | "Composite")}
                options={["Flat", "Usage-based", "Composite"] as const}
              />
            </div>

            {/* Meter (Usage-based only) */}
            {productType === "Usage-based" && (
              <div className="flex flex-col gap-[3px]">
                <label className={labelClasses}>Meter</label>
                <Selector
                  ariaLabel="Meter"
                  size="sm"
                  value={meter}
                  onChange={setMeter}
                  options={defaultMeterOptions}
                  placeholder="Select a meter"
                  searchable
                  searchPlaceholder="Search meters"
                  footerLabel="Create new meter"
                  onFooterClick={() => {
                    const name = prompt("Meter name:")
                    if (name?.trim()) setMeter(name.trim())
                  }}
                  buttonClassName="h-[32px] w-full justify-between rounded-[6px] border border-[#D8DEE4] px-[8px] text-[12px] font-[500] text-[#353A44]"
                />
              </div>
            )}

            {/* Applicable products (Composite only) */}
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

            {/* Pricing header */}
            <div className="flex flex-col gap-[2px] pt-[8px]">
              <span className="text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#353A44]">Pricing</span>
              <p className="text-[12px] font-[400] leading-[16px] text-[#6C7688]">Optionally add pricing</p>
            </div>

            {/* Pricing section */}
            {productType === "Composite" ? (
              <>
                <div className="flex flex-col gap-[3px]">
                  <label className={labelClasses}>Pricing model</label>
                  <Selector
                    ariaLabel="Pricing model"
                    size="sm"
                    value={compositePricingModel}
                    onChange={setCompositePricingModel}
                    options={["Percent", "Flat fee", "Per unit"]}
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
                      value={price}
                      onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ""))}
                    />
                    <span className="text-[12px] font-[600] text-[#353A44] ml-[4px]">{compositePricingModel === "Percent" ? "%" : "$"}</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Charge type toggle */}
                <div className="flex flex-col gap-[3px]">
                  <label className={labelClasses}>Charge type</label>
                  <SegmentedControl
                    value={chargeType}
                    onChange={(v) => setChargeType(v as "Recurring" | "One-off")}
                    options={["Recurring", "One-off"] as const}
                  />
                </div>

                {/* Amount + Currency */}
                <div className="flex flex-col gap-[3px]">
                  <label className={labelClasses}>Amount</label>
                  <div className="flex items-stretch">
                    <div className="flex min-w-0 flex-1 h-[32px] items-center gap-[4px] rounded-l-[6px] border border-[#D8DEE4] bg-white px-[8px] text-[12px] font-[500] text-[#6C7688] hover:border-[#B6C0CD] focus-within:border-[#A0D0F7] focus-within:shadow-[0_0_0_1.5px_#A0D0F7] transition-all">
                      <span className="text-[#6C7688]">$</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0.00"
                        className="min-w-0 flex-1 bg-transparent text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] placeholder:text-[#6C7688] outline-none"
                        value={price}
                        onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ""))}
                      />
                    </div>
                    <Selector
                      ariaLabel="Currency"
                      size="sm"
                      value={currency}
                      onChange={setCurrency}
                      options={currencyOptions}
                      buttonClassName="h-[32px] w-[64px] rounded-l-none border-l-0 px-[8px] text-[12px] font-[500] text-[#353A44]"
                    />
                  </div>
                </div>

                {/* Billing period (only for Recurring) */}
                {chargeType === "Recurring" && (
                  <div className="flex flex-col gap-[3px]">
                    <label className={labelClasses}>Billing period</label>
                    <Selector
                      ariaLabel="Billing period"
                      size="sm"
                      value={cadence}
                      onChange={setCadence}
                      options={billingPeriodOptions}
                      buttonClassName="h-[32px] w-full justify-between rounded-[6px] border border-[#D8DEE4] px-[8px] text-[12px] font-[500] text-[#353A44]"
                    />
                  </div>
                )}
              </>
            )}

            {/* More pricing options link */}
            {onMorePricingOptions && (
              <button
                type="button"
                className="flex items-center gap-[4px] self-start text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#675DFF] hover:text-[#5B52F0] transition-colors"
                onClick={() => {
                  onMorePricingOptions({ name, description, price, currency, cadence, chargeType, taxCode, taxBehavior })
                  onClose()
                }}
              >
                More pricing options
                <span aria-hidden="true">&rarr;</span>
              </button>
            )}

            {/* Advanced settings */}
            <button
              type="button"
              className="flex w-full items-center justify-between py-[8px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#1A2C44] hover:text-[#353A44] transition-colors"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <span>Advanced settings</span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`transition-transform ${showAdvanced ? "rotate-180" : ""}`}>
                <path d="M3 4.5L6 7.5L9 4.5" stroke="#6C7688" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {showAdvanced && (
              <div className="flex flex-col gap-[12px]">
                <div className="flex flex-col gap-[3px]">
                  <label className={labelClasses}>Tax code</label>
                  <Selector
                    ariaLabel="Tax code"
                    size="sm"
                    value={taxCode}
                    onChange={setTaxCode}
                    options={taxCodeOptions}
                    buttonClassName="h-[32px] w-full justify-between rounded-[6px] border border-[#D8DEE4] px-[8px] text-[12px] font-[500] text-[#353A44]"
                  />
                </div>
                <div className="flex flex-col gap-[3px]">
                  <label className={labelClasses}>Tax behavior</label>
                  <Selector
                    ariaLabel="Tax behavior"
                    size="sm"
                    value={taxBehavior}
                    onChange={setTaxBehavior}
                    options={taxBehaviorOptions}
                    buttonClassName="h-[32px] w-full justify-between rounded-[6px] border border-[#D8DEE4] px-[8px] text-[12px] font-[500] text-[#353A44]"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-[8px] border-t border-[#EBEEF1] px-[24px] py-[12px]">
          <button
            type="button"
            className="h-[28px] rounded-[6px] border border-[#D8DEE4] bg-white px-[10px] py-[6px] text-[12px] font-[600] leading-[14px] tracking-[-0.024px] text-[#353A44] shadow-[0_1px_1px_rgba(33,37,44,0.16)] hover:bg-[#F5F6F8] transition-colors"
            onClick={onClose}
          >
            Discard
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            className={`h-[28px] rounded-[6px] px-[10px] py-[6px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-white shadow-[0_1px_1px_rgba(47,14,99,0.32)] transition-colors ${canSubmit ? "bg-[#675DFF] hover:bg-[#5B52F0]" : "bg-[#A99CFE] cursor-not-allowed"}`}
            onClick={() => { onSave(buildSaveData()); onClose() }}
          >
            {isEditing ? "Save product" : "Create product"}
          </button>
        </div>
      </div>
    </div>
  )
}
function EmptyState({ tab, onCreate }: { tab: string; onCreate: () => void }) {
  const labels: Record<string, { title: string; description: string; button: string }> = {
    products: { title: "No products yet", description: "Create a product to get started with your catalog.", button: "Create product" },
    "price-groups": { title: "No price groups yet", description: "Price groups are created when you import prices across plans.", button: "Create price group" },
    plans: { title: "No plans yet", description: "Create a pricing plan to bundle prices, credits, and fees.", button: "Add pricing plan" },
    meters: { title: "No meters yet", description: "Meters track usage events from your application for billing.", button: "Create meter" },
  }
  const { title, description, button } = labels[tab]
  return (
    <div className="flex flex-col items-center justify-center gap-[12px] py-[80px]">
      <div className="flex h-[48px] w-[48px] items-center justify-center rounded-[12px] bg-[#F4F7FA]">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="2" y="2" width="7" height="7" rx="2" fill="#B6C0CD" />
          <rect x="11" y="2" width="7" height="7" rx="2" fill="#B6C0CD" opacity="0.5" />
          <rect x="2" y="11" width="7" height="7" rx="2" fill="#B6C0CD" opacity="0.5" />
          <rect x="11" y="11" width="7" height="7" rx="2" fill="#B6C0CD" opacity="0.3" />
        </svg>
      </div>
      <p className="text-[14px] font-[600] leading-[20px] text-[#1A2C44]">{title}</p>
      <p className="text-[13px] font-[400] leading-[18px] text-[#6C7688]">{description}</p>
      <button
        type="button"
        className="mt-[4px] flex h-[34px] items-center rounded-[6px] bg-[#533AFD] px-[12px] text-[13px] font-[600] leading-[18px] text-white hover:bg-[#4730E0] transition-colors"
        onClick={onCreate}
      >
        {button}
      </button>
    </div>
  )
}

function PriceTag({ label }: { label: string }) {
  return (
    <span className="inline-flex h-[20px] items-center rounded-[4px] border border-[#D4DEE9] bg-white px-[6px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#1A2C44]">
      {label}
    </span>
  )
}

function generateProductId(productId: number): string {
  const suffix = Math.abs(productId * 2654435761 | 0).toString(36).slice(0, 8)
  return `prod_${suffix}`
}

function generatePriceId(productId: number, priceIndex: number): string {
  const combined = productId * 31 + priceIndex * 7919
  const suffix = Math.abs(combined * 2654435761 | 0).toString(36).slice(0, 8)
  return `price_${suffix}`
}

function ProductTable({ products, onDelete, onEdit, onProductClick }: { products: ProductEntry[]; onDelete: (id: number) => void; onEdit: (id: number) => void; onProductClick?: (product: ProductEntry) => void }) {
  return (
    <div className="mt-2">
      <div>
        {/* Header row */}
        <div className="border-b border-[#EBEEF1] bg-white">
          <div className="grid h-[40px] grid-cols-[1.5fr_0.8fr_1fr_60px] items-center gap-8 text-[12px] font-[500] text-[#6C7688]">
            <span>Product</span>
            <span>Type</span>
            <span>Pricing</span>
            <span />
          </div>
        </div>

        {/* Data rows */}
        <div className="divide-y divide-[#EBEEF1] bg-white">
          {products.map((p) => {
            const allPrices = p.prices && p.prices.length > 0
              ? p.prices
              : p.price ? [{ id: 0, name: "", pricingModel: p.type === "Usage" ? "Usage-based" : "Recurring", price: p.price, currency: p.currency, cadence: p.cadence, meter: "", priceType: "", sellAs: "", unitLabel: "" }] : []

            const priceCount = allPrices.length
            const pricingSummary = priceCount === 0
              ? "No prices"
              : priceCount === 1
                ? (() => {
                    const sp = allPrices[0]
                    const amount = sp.price ? `$${sp.price}` : "—"
                    const unit = sp.unitLabel ? `/${sp.unitLabel}` : ""
                    const type = sp.priceType && sp.priceType !== "Flat fee" && sp.priceType !== "Usage" ? ` (${sp.priceType})` : ""
                    return `${amount}${unit}${type}`
                  })()
                : `${priceCount} prices`

            return (
              <button
                key={p.id}
                type="button"
                className="group/row grid h-[40px] w-full grid-cols-[1.5fr_0.8fr_1fr_60px] items-center gap-8 text-left text-[13px] font-[500] text-[#353A44] hover:bg-[#F7F8FA] transition-colors"
                onClick={() => onProductClick ? onProductClick(p) : onEdit(p.id)}
              >
                <span className="truncate">{p.name}</span>
                <span>
                  {(() => {
                    const raw = allPrices[0]?.pricingModel ?? (p.type === "Usage" ? "Usage-based" : "Flat")
                    const label = raw.toLowerCase().includes("usage") ? "Usage-based"
                      : raw.toLowerCase().includes("compos") || raw.toLowerCase().includes("tiered") || raw.toLowerCase().includes("graduated") || raw.toLowerCase().includes("volume") ? "Composite"
                      : "Flat rate"
                    const colorClass = label === "Usage-based" ? "bg-[#E8F5FF] text-[#0369A1]"
                      : label === "Composite" ? "bg-[#FFF4E5] text-[#B45309]"
                      : "bg-[#F0EBFE] text-[#533AFD]"
                    return (
                      <span className={cn("inline-flex items-center rounded-[4px] px-[6px] py-[2px] text-[12px] font-[500]", colorClass)}>
                        {label}
                      </span>
                    )
                  })()}
                </span>
                <span className="truncate text-[#596171]">{pricingSummary}</span>
                <TableRowActions onEdit={() => onProductClick ? onProductClick(p) : onEdit(p.id)} onDelete={() => onDelete(p.id)} />
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

type PriceGroupRate = { id: number; name: string }

type PriceGroupEntry = {
  id: number
  name: string
  serviceInterval: string
  rates: PriceGroupRate[]
  selectedProductIds: number[]
}

const PRICE_GROUP_STORAGE_KEY = "product-catalog-price-groups"

const DEFAULT_VERCEL_PRICE_GROUPS: PriceGroupEntry[] = [
  {
    id: -3001,
    name: "Usage",
    serviceInterval: "Monthly",
    rates: [
      { id: 1, name: "Functions — Active CPU" },
      { id: 2, name: "Functions — Memory" },
      { id: 3, name: "Functions — Invocations" },
      { id: 4, name: "Edge Requests" },
      { id: 5, name: "Fast Data Transfer" },
      { id: 6, name: "Image Optimization" },
      { id: 7, name: "Blob Storage" },
      { id: 8, name: "Web Analytics" },
      { id: 9, name: "ISR" },
      { id: 10, name: "Edge Config" },
    ],
    selectedProductIds: [-2010, -2011, -2012, -2013, -2014, -2015, -2016, -2017, -2018, -2019],
  },
]

function loadPriceGroups(): PriceGroupEntry[] {
  if (typeof window === "undefined") return DEFAULT_VERCEL_PRICE_GROUPS
  try {
    const raw = window.localStorage.getItem(PRICE_GROUP_STORAGE_KEY)
    const stored: PriceGroupEntry[] = raw ? JSON.parse(raw) : []
    const defaultIds = new Set(DEFAULT_VERCEL_PRICE_GROUPS.map((g) => g.id))
    const userGroups = stored.filter((g) => !defaultIds.has(g.id))
    const all = [...DEFAULT_VERCEL_PRICE_GROUPS, ...userGroups]
    window.localStorage.setItem(PRICE_GROUP_STORAGE_KEY, JSON.stringify(all))
    return all
  } catch { return DEFAULT_VERCEL_PRICE_GROUPS }
}

function savePriceGroups(groups: PriceGroupEntry[]) {
  window.localStorage.setItem(PRICE_GROUP_STORAGE_KEY, JSON.stringify(groups))
}

function CreatePriceGroupOverlay({ onClose, onSave, products, initial }: {
  onClose: () => void
  onSave: (group: Omit<PriceGroupEntry, "id">) => void
  products: ProductEntry[]
  initial?: PriceGroupEntry
}) {
  const isEditing = Boolean(initial)
  const [displayName, setDisplayName] = useState(initial?.name ?? "")
  const [serviceInterval, setServiceInterval] = useState(initial?.serviceInterval ?? "Monthly")
  const [rates, setRates] = useState<PriceGroupRate[]>(initial?.rates ?? [{ id: 0, name: "" }])
  const [activeRateId, setActiveRateId] = useState<number | null>(null)
  const [activeView, setActiveView] = useState<"group" | "product" | "price">("group")
  const [showAddPricePopover, setShowAddPricePopover] = useState(false)
  const [addPriceSearch, setAddPriceSearch] = useState("")
  const addPricePopoverRef = useRef<HTMLDivElement>(null)
  const [rateTypeValues, setRateTypeValues] = useState<Record<number, string>>({})
  const [rateDescValues, setRateDescValues] = useState<Record<number, string>>({})
  const [rateChargeType, setRateChargeType] = useState<Record<number, string>>({})
  const [rateMeterValues, setRateMeterValues] = useState<Record<number, string>>({})
  const [ratePriceTypeValues, setRatePriceTypeValues] = useState<Record<number, string>>({})
  const [rateSellAsValues, setRateSellAsValues] = useState<Record<number, string>>({})
  const [ratePriceValues, setRatePriceValues] = useState<Record<number, string>>({})
  const [rateUnitLabelValues, setRateUnitLabelValues] = useState<Record<number, string>>({})
  const [rateTiersMap, setRateTiersMap] = useState<Record<number, number[]>>({})
  const [rateTierToMap, setRateTierToMap] = useState<Record<number, Record<number, string>>>({})
  const [rateTierUnitPriceMap, setRateTierUnitPriceMap] = useState<Record<number, Record<number, string>>>({})
  const [rateTierFlatFeeMap, setRateTierFlatFeeMap] = useState<Record<number, Record<number, string>>>({})
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([])

  const nextRateId = () => (rates.length > 0 ? Math.max(...rates.map((r) => r.id)) + 1 : 0)

  const addRate = () => {
    const id = nextRateId()
    setRates((prev) => [...prev, { id, name: "" }])
    setActiveRateId(id)
  }

  const updateRateName = (id: number, name: string) => {
    setRates((prev) => prev.map((r) => (r.id === id ? { ...r, name } : r)))
  }

  const removeRate = (id: number) => {
    setRates((prev) => prev.filter((r) => r.id !== id))
    if (activeRateId === id) setActiveRateId(null)
  }

  const addRateFromProduct = (product: ProductEntry) => {
    const savedPrices = product.prices && product.prices.length > 0 ? product.prices : null
    if (savedPrices && savedPrices.length > 0) {
      let firstId = -1
      for (const sp of savedPrices) {
        const id = nextRateId()
        if (firstId < 0) firstId = id
        const priceSuffix = [sp.cadence, sp.price ? `$${sp.price}` : ""].filter(Boolean).join(", ")
        const rateName = sp.name || (priceSuffix ? `${product.name} — ${priceSuffix}` : product.name)
        setRates((prev) => [...prev, { id, name: rateName }])
        setRateMeterValues((prev) => ({ ...prev, [id]: sp.meter || "" }))
        setRatePriceTypeValues((prev) => ({ ...prev, [id]: sp.priceType || "Flat fee" }))
        setRateSellAsValues((prev) => ({ ...prev, [id]: sp.sellAs || "Individual units" }))
        setRatePriceValues((prev) => ({ ...prev, [id]: sp.price || "" }))
        setRateUnitLabelValues((prev) => ({ ...prev, [id]: sp.unitLabel || "" }))
      }
      setActiveRateId(firstId)
    } else {
      const id = nextRateId()
      setRates((prev) => [...prev, { id, name: product.name }])
      setRateMeterValues((prev) => ({ ...prev, [id]: "" }))
      setRatePriceTypeValues((prev) => ({ ...prev, [id]: product.type === "Usage" ? "Flat fee" : "Flat fee" }))
      setRateSellAsValues((prev) => ({ ...prev, [id]: "Individual units" }))
      setRatePriceValues((prev) => ({ ...prev, [id]: product.price || "" }))
      setRateUnitLabelValues((prev) => ({ ...prev, [id]: "" }))
      setActiveRateId(id)
    }
    setShowAddPricePopover(false)
    setAddPriceSearch("")
  }

  // Close popover on outside click
  useEffect(() => {
    if (!showAddPricePopover) return
    const handle = (e: MouseEvent) => {
      if (addPricePopoverRef.current && !addPricePopoverRef.current.contains(e.target as Node)) {
        setShowAddPricePopover(false)
        setAddPriceSearch("")
      }
    }
    document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [showAddPricePopover])

  const filteredAddPriceProducts = addPriceSearch.trim()
    ? products.filter((p) => p.name.toLowerCase().includes(addPriceSearch.trim().toLowerCase()))
    : products

  const activeRate = rates.find((r) => r.id === activeRateId)
  const showRateForm = activeRateId != null && activeRate

  const canSubmit = displayName.trim().length > 0

  const rowBase = "flex w-full items-center gap-[8px] rounded-[6px] px-[8px] py-[4px] text-left text-[12px] font-[400] leading-[16px] text-[#1A2C44]"
  const planRowBase = "flex w-full items-center gap-[8px] rounded-[6px] pl-[12px] pr-[8px] py-[4px] text-left text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#1A2C44]"
  const childRowIndent = "pl-[15px]"
  const inlineAddRowBase = "flex w-full items-center gap-[8px] rounded-[6px] px-[8px] py-[4px] text-left text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#533AFD] hover:bg-[#F5F6F8]"

  return (
    <div className="fixed inset-0 z-[900] flex flex-col bg-white">
      {/* Header */}
      <div className="flex h-[48px] shrink-0 items-center justify-between border-b border-[#EBEEF1] px-[16px]">
        <p className="text-[14px] font-[500] leading-[20px] tracking-[-0.15px] text-[#1A2C44]">Price group</p>
        <div className="flex items-center gap-[8px]">
          <button
            type="button"
            className="flex h-[26px] items-center rounded-[6px] border border-[#D8DEE4] bg-white px-[8px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#353A44] hover:bg-[#F5F6F8] transition-colors"
            onClick={onClose}
          >
            Discard
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            className={`flex h-[26px] items-center rounded-[6px] px-[8px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-white transition-colors ${
              canSubmit ? "bg-[#533AFD] hover:bg-[#4730E0]" : "bg-[#A99CFE] cursor-not-allowed"
            }`}
            onClick={() => {
              onSave({ name: displayName.trim(), serviceInterval, rates, selectedProductIds })
              onClose()
            }}
          >
            {isEditing ? "Save price group" : "Create price group"}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        {/* Left sidebar — matches PlanSidebarNav structure */}
        <aside className="flex w-[280px] shrink-0 flex-col border-r border-[#EBEEF1] bg-white pt-[12px]">
          {/* Tree */}
          <div className="flex flex-1 min-h-0 flex-col gap-[2px] overflow-y-auto px-[8px]">
            {/* Price group node */}
            <button
              type="button"
              className={`${planRowBase} ${activeView === "group" && activeRateId == null ? "bg-[#F7F5FD]" : "hover:bg-[#F4F7FA]"}`}
              onClick={() => { setActiveRateId(null); setActiveView("group") }}
            >
              <span className="flex h-[14px] min-w-[14px] shrink-0 items-center justify-center">
                <CatalogObjectGlyph kind="rateCard" />
              </span>
              <span className={`min-w-0 flex-1 truncate ${displayName ? "" : "text-[#6C7688]"}`}>
                {displayName || "Price group"}
              </span>
            </button>

            {/* Products with prices */}
            {rates.map((rate) => {
              const meterVal = rateMeterValues[rate.id]
              const priceVal = ratePriceValues[rate.id]
              const priceSummary = priceVal ? `$${priceVal}${serviceInterval ? ` / ${serviceInterval.toLowerCase().replace("ly", "")}` : ""}` : ""
              return (
                <div key={rate.id} className="flex flex-col gap-[2px]">
                  <button
                    type="button"
                    className={`${rowBase} ${childRowIndent} ${activeRateId === rate.id && activeView === "product" ? "bg-[#F7F5FD]" : "hover:bg-[#F4F7FA]"}`}
                    onClick={() => { setActiveRateId(rate.id); setActiveView("product") }}
                  >
                    <span className="w-[12px] shrink-0" />
                    <span className="flex h-[14px] min-w-[14px] shrink-0 items-center justify-center">
                      <CatalogObjectGlyph kind="product" />
                    </span>
                    <span className={`min-w-0 flex-1 truncate ${rate.name ? "" : "text-[#6C7688]"}`}>
                      {rate.name || "Product"}
                    </span>
                  </button>
                  {/* Price nested under product */}
                  <button
                    type="button"
                    className={`${rowBase} pl-[37px] ${activeRateId === rate.id && activeView === "price" ? "bg-[#F7F5FD]" : "hover:bg-[#F4F7FA]"}`}
                    onClick={() => { setActiveRateId(rate.id); setActiveView("price") }}
                  >
                    <span className="w-[12px] shrink-0" />
                    <span className="flex h-[14px] min-w-[14px] shrink-0 items-center justify-center">
                      <CatalogObjectGlyph kind="price" />
                    </span>
                    <span className={`min-w-0 flex-1 truncate ${priceSummary ? "" : "text-[#6C7688]"}`}>
                      {priceSummary || "Price"}
                    </span>
                  </button>
                </div>
              )
            })}

            {/* Add price — inline link under tree, matching pricing plan sidebar */}
            <div className="relative">
              <button
                type="button"
                className={`${inlineAddRowBase} ${childRowIndent}`}
                onClick={() => setShowAddPricePopover(!showAddPricePopover)}
              >
                <span className="w-[12px] shrink-0" />
                <span className="flex h-[14px] min-w-[14px] shrink-0 items-center justify-center text-[#533AFD]">
                  <AddSmallIcon />
                </span>
                <span>Add price</span>
              </button>

              {showAddPricePopover && (
                <div
                  ref={addPricePopoverRef}
                  className="absolute top-[calc(100%+4px)] left-[8px] z-[100] w-[248px] rounded-[8px] border border-[#D4DEE9] bg-white shadow-[0px_15px_35px_0px_rgba(48,49,61,0.08),0px_5px_15px_0px_rgba(0,0,0,0.12)] overflow-hidden"
                >
                  <div className="px-[12px] pt-[8px] pb-[4px]">
                    <div className="flex h-[30px] items-center gap-[8px] rounded-[6px] border border-[#D8DEE4] bg-white px-3 focus-within:shadow-[0_0_0_1.5px_#A0D0F7] focus-within:border-[#A0D0F7] transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0 text-[#6C7688]">
                        <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.2" />
                        <path d="M8.5 8.5L11 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                      </svg>
                      <input
                        className="w-full bg-transparent text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] outline-none placeholder:text-[#6C7688]"
                        placeholder="Search prices"
                        value={addPriceSearch}
                        onChange={(e) => setAddPriceSearch(e.target.value)}
                        autoFocus
                      />
                    </div>
                  </div>

                  {filteredAddPriceProducts.length > 0 && (
                    <div className="flex flex-col py-[4px] max-h-[200px] overflow-y-auto">
                      {filteredAddPriceProducts.map((product) => {
                        const isFlat = product.type === "Flat"
                        const iconKind = isFlat ? "subscriptionFee" : "product"
                        const savedPrices = product.prices && product.prices.length > 0 ? product.prices : null
                        return (
                          <div key={product.id} className="flex flex-col">
                            {/* Product header — not clickable */}
                            <div className="flex w-full items-center gap-[8px] px-[12px] py-[4px]">
                              <span className="flex h-[14px] min-w-[14px] shrink-0 items-center justify-center">
                                <CatalogObjectGlyph kind={iconKind} />
                              </span>
                              <span className="text-[12px] font-[500] leading-[16px] text-[#1A2C44] truncate">{product.name}</span>
                            </div>
                            {/* Nested prices — clickable */}
                            {savedPrices ? savedPrices.map((sp, i) => (
                              <button
                                key={`${product.id}-sp-${i}`}
                                type="button"
                                className="flex w-full items-center justify-between rounded-[4px] pl-[32px] pr-[12px] py-[4px] text-left hover:bg-[#F4F7FA] transition-colors"
                                onMouseDown={(e) => {
                                  e.preventDefault()
                                  // Remove empty placeholder rates
                                  setRates((prev) => prev.filter((r) => r.name.trim() !== ""))
                                  const id = nextRateId()
                                  const rateName = product.name
                                  setRates((prev) => [...prev, { id, name: rateName }])
                                  setRatePriceValues((prev) => ({ ...prev, [id]: sp.price || "" }))
                                  setRateMeterValues((prev) => ({ ...prev, [id]: sp.meter || "" }))
                                  setActiveRateId(id)
                                  setActiveView("product")
                                  setShowAddPricePopover(false)
                                  setAddPriceSearch("")
                                }}
                              >
                                <div className="flex items-center gap-[6px] min-w-0">
                                  <CatalogObjectGlyph kind="price" />
                                  <span className="text-[12px] font-[400] leading-[16px] text-[#1A2C44] truncate">
                                    {sp.name || [sp.cadence, sp.price ? `$${sp.price}` : ""].filter(Boolean).join(", ") || "Price"}
                                  </span>
                                </div>
                                <span className="shrink-0 ml-[8px] text-[11px] font-[400] leading-[16px] text-[#667691]">
                                  {sp.price ? `$${sp.price}` : ""}
                                </span>
                              </button>
                            )) : (
                              <button
                                type="button"
                                className="flex w-full items-center rounded-[4px] pl-[32px] pr-[12px] py-[4px] text-left hover:bg-[#F4F7FA] transition-colors"
                                onMouseDown={(e) => {
                                  e.preventDefault()
                                  addRateFromProduct(product)
                                }}
                              >
                                <div className="flex items-center gap-[6px] min-w-0">
                                  <CatalogObjectGlyph kind="price" />
                                  <span className="text-[12px] font-[400] leading-[16px] text-[#6C7688]">Add price</span>
                                </div>
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  <div className="border-t border-[#ECF1F6] px-[12px] py-[6px]">
                    <button
                      type="button"
                      className="flex items-center gap-[6px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#533AFD] hover:text-[#4730E0] transition-colors"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        addRate()
                        setShowAddPricePopover(false)
                        setAddPriceSearch("")
                      }}
                    >
                      <AddSmallIcon />
                      New price
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main form panel */}
        <div className="w-[320px] shrink-0 overflow-y-auto border-r border-[#EBEEF1] py-[12px]">
          {activeView === "product" && activeRate ? (
            /* Product form — matches pricing plan RateCardForm */
            <div className="flex flex-col gap-[12px] min-w-0">
              <FormRow label="Product name">
                <input
                  className={textFieldInputClasses}
                  placeholder="e.g. API calls"
                  value={activeRate.name}
                  onChange={(e) => updateRateName(activeRate.id, e.target.value)}
                  autoFocus
                />
              </FormRow>
              <FormRow label="Description">
                <textarea
                  className="min-h-[56px] w-full resize-none rounded-[6px] border border-[#D8DEE4] bg-white px-[8px] py-[6px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] placeholder:text-[#6C7688] outline-none hover:border-[#B6C0CD] focus:border-[#A0D0F7] focus:shadow-[0_0_0_1.5px_#A0D0F7] transition-all"
                  placeholder="Describe the product or service"
                  value={rateDescValues[activeRate.id] ?? ""}
                  onChange={(e) => setRateDescValues((prev) => ({ ...prev, [activeRate.id]: e.target.value }))}
                />
              </FormRow>
              <FormRow label="Type">
                <SegmentedControl
                  value={(rateTypeValues[activeRate.id] ?? "Flat") as "Flat" | "Usage-based" | "Composite"}
                  onChange={(v) => setRateTypeValues((prev) => ({ ...prev, [activeRate.id]: v }))}
                  options={["Flat", "Usage-based", "Composite"] as const}
                />
              </FormRow>
              {(rateTypeValues[activeRate.id] ?? "Flat") === "Usage-based" && (
                <FormRow label="Meter">
                  <Selector
                    ariaLabel="Meter"
                    size="sm"
                    value={rateMeterValues[activeRate.id] ?? ""}
                    onChange={(v) => setRateMeterValues((prev) => ({ ...prev, [activeRate.id]: v }))}
                    options={defaultMeterOptions}
                    placeholder="Add or select a meter"
                    fullWidth
                  />
                </FormRow>
              )}
            </div>
          ) : activeView === "price" && activeRate ? (
            /* Price form — matches pricing plan RateForm (flat) */
            <div className="flex flex-col gap-[12px] min-w-0">
              <FormRow label="Charge type">
                <SegmentedControl
                  value={(rateChargeType[activeRate.id] ?? "Recurring") as "Recurring" | "One-off"}
                  onChange={(v) => setRateChargeType((prev) => ({ ...prev, [activeRate.id]: v }))}
                  options={["Recurring", "One-off"] as const}
                />
              </FormRow>
              <FormRow label="Pricing model">
                <Selector
                  ariaLabel="Pricing model"
                  size="sm"
                  value={ratePriceTypeValues[activeRate.id] ?? "Flat rate"}
                  onChange={(v) => {
                    setRatePriceTypeValues((prev) => ({ ...prev, [activeRate.id]: v }))
                    if ((v === "Volume" || v === "Graduated") && !(rateTiersMap[activeRate.id]?.length >= 2)) {
                      setRateTiersMap((prev) => ({ ...prev, [activeRate.id]: [0, 1] }))
                      setRateTierToMap((prev) => ({ ...prev, [activeRate.id]: { 0: "1,000" } }))
                    }
                  }}
                  options={["Flat rate", "Package", "Graduated", "Volume"]}
                  fullWidth
                  buttonClassName="h-[30px] justify-between px-[12px] py-[6px] text-[12px] font-[500] leading-[16px] text-[#353A44]"
                />
              </FormRow>
              <FormRow label="Amount">
                <div className="flex h-[30px] w-full items-center gap-[8px] rounded-[6px] border border-[#D8DEE4] bg-white px-[12px] text-[12px] font-[500] text-[#353A44]">
                  <span className="text-[#6C7688]">$</span>
                  <input
                    className="w-full bg-transparent outline-none placeholder:text-[#6C7688]"
                    placeholder="0.00"
                    value={ratePriceValues[activeRate.id] ?? ""}
                    onChange={(e) => setRatePriceValues((prev) => ({ ...prev, [activeRate.id]: e.target.value.replace(/[^0-9.]/g, "") }))}
                  />
                </div>
              </FormRow>
              <FormRow label="Include tax in price">
                <Selector
                  ariaLabel="Include tax in price"
                  size="sm"
                  value="Auto"
                  onChange={() => {}}
                  options={["Auto", "Inclusive", "Exclusive"]}
                  fullWidth
                  buttonClassName="h-[30px] justify-between px-[12px] py-[6px] text-[12px] font-[500] leading-[16px] text-[#353A44]"
                />
              </FormRow>
              {(rateChargeType[activeRate.id] ?? "Recurring") === "Recurring" && (
                <FormRow label="Billing period">
                  <SegmentedControl
                    value={serviceInterval as "Monthly" | "Yearly" | "Custom"}
                    onChange={setServiceInterval}
                    options={["Monthly", "Yearly", "Custom"] as const}
                  />
                </FormRow>
              )}
              <FormRow label="Unit label">
                <input
                  className={textFieldInputClasses}
                  placeholder="e.g. seat, request, token"
                  value={rateUnitLabelValues[activeRate.id] ?? ""}
                  onChange={(e) => setRateUnitLabelValues((prev) => ({ ...prev, [activeRate.id]: e.target.value }))}
                />
              </FormRow>
            </div>
          ) : (
            /* Price group form */
            <div className="flex flex-col gap-[12px] min-w-0">
              <FormRow label="Display name">
                <input
                  className={textFieldInputClasses}
                  placeholder="e.g. API Usage"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  autoFocus
                />
              </FormRow>
              <FormRow label="Service interval">
                <SegmentedControl
                  value={serviceInterval}
                  options={["Monthly", "Annually", "Custom"] as const}
                  onChange={setServiceInterval}
                />
              </FormRow>
            </div>
          )}
        </div>

        {/* Right preview — mirrors pricing plan structure preview */}
        <div className="hidden flex-1 items-start justify-center bg-[#F9FAFB] p-[40px] lg:flex">
          <div className="w-full max-w-[432px]">
            <div className="flex flex-col overflow-clip rounded-[12px] border border-[#D4DEE9] bg-white">
              {/* Price group header */}
              <div className="flex flex-col gap-[4px] p-[24px] pb-[16px]">
                <div className="flex items-start justify-between gap-[12px]">
                  <p className={cn(
                    "truncate text-[14px] font-[600] leading-[20px] tracking-[-0.15px]",
                    activeRateId == null ? "text-[#533AFD]" : "text-[#1A2C44]"
                  )}>
                    {displayName || "Price group"}
                  </p>
                  <span className="shrink-0 whitespace-nowrap rounded-[10px] bg-[#ECF1F6] px-[6px] py-[2px] text-center text-[11px] font-[400] leading-[16px] text-[#3C4F69]">
                    {rates.length} {rates.length === 1 ? "price" : "prices"}
                  </span>
                </div>
                <p className="text-[12px] font-[400] leading-[16px] text-[#3C4F69]">
                  Usage billed {serviceInterval.toLowerCase()}
                </p>
              </div>

              {/* Rate items */}
              {rates.length > 0 && (
                <div className="flex flex-col gap-[16px] px-[24px] pt-[8px] pb-[24px]">
                  <AnimatePresence initial={false}>
                    {rates.map((rate) => {
                      const isSelected = activeRateId === rate.id
                      const priceVal = ratePriceValues[rate.id]
                      const unitLbl = (rateUnitLabelValues[rate.id] ?? "").trim() || "unit"
                      const priceDisplay = priceVal ? `$${priceVal} per ${unitLbl}` : "$0.00"

                      return (
                        <motion.div
                          key={rate.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1, transition: { duration: 0.25, ease: "easeOut" } }}
                          exit={{ opacity: 0, transition: { duration: 0.15, ease: "easeIn" } }}
                          className="flex gap-[12px] items-stretch"
                        >
                          <div className={cn("w-px shrink-0", isSelected ? "bg-[#7B61FF]" : "bg-[#C3B6FB]")} />
                          <div className="flex flex-1 flex-col gap-[4px] min-w-0">
                            <div className="flex items-start justify-between gap-[16px]">
                              <div className="flex flex-col gap-[2px] min-w-0">
                                <p className={cn(
                                  "truncate text-[12px] font-[600] leading-[16px] tracking-[-0.024px]",
                                  isSelected ? "text-[#533AFD]" : "text-[#1A2C44]"
                                )}>
                                  {rate.name || "Price"}
                                </p>
                                {rateMeterValues[rate.id] && (
                                  <p className="truncate text-[11px] font-[400] leading-[16px] text-[#3C4F69]">
                                    {rateMeterValues[rate.id].replace(/\s+/g, "_")}
                                  </p>
                                )}
                              </div>
                              <p className="shrink-0 text-[12px] font-[400] leading-[16px] text-[#1A2C44] whitespace-nowrap">
                                {priceDisplay}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PlansTable({ plans, onClick }: { plans: PlanSummary[]; onClick: (id: number) => void }) {
  return (
    <div className="mt-2">
      <div>
        {/* Header row */}
        <div className="border-b border-[#EBEEF1] bg-white">
          <div className="grid h-[40px] grid-cols-[1.5fr_0.8fr_1fr_0.8fr_60px] items-center gap-8 text-[12px] font-[500] text-[#6C7688]">
            <span>Name</span>
            <span>Amount</span>
            <span>Billing period</span>
            <span>Status</span>
            <span />
          </div>
        </div>

        {/* Data rows */}
        <div className="divide-y divide-[#EBEEF1] bg-white">
          {plans.map((p) => (
            <div
              key={p.id}
              className="group/row grid h-[40px] w-full grid-cols-[1.5fr_0.8fr_1fr_0.8fr_60px] items-center gap-8 text-left text-[13px] font-[500] text-[#353A44] hover:bg-[#F7F8FA] transition-colors cursor-pointer"
              onClick={() => onClick(p.id)}
            >
              <span className="truncate">{p.name || "Untitled plan"}</span>
              <span className="truncate text-[#596171]">{p.amount || "—"}</span>
              <span className="truncate text-[#596171]">{p.billingPeriod || "—"}</span>
              <span>
                <span className={cn(
                  "inline-flex items-center rounded-[4px] px-[6px] py-[2px] text-[12px] font-[500]",
                  p.status === "live" ? "bg-[#E7F9ED] text-[#1A7F37]" : "bg-[#F4F7FA] text-[#596171]"
                )}>
                  {p.status === "live" ? "Live" : "Draft"}
                </span>
              </span>
              <TableRowActions onEdit={() => onClick(p.id)} onDelete={() => {}} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ProductCatalogView({ onCreatePricingPlan, pricingPlans, onPlanClick, onProductClick, onMorePricingOptions }: ProductCatalogViewProps) {
  const [activeTab, setActiveTab] = useState<ProductCatalogTab>("plans")
  const [productFilter, setProductFilter] = useState<ProductFilter>("products")
  const [showCreateProduct, setShowCreateProduct] = useState(false)
  const [showCreatePriceGroup, setShowCreatePriceGroup] = useState(false)
  const [editingProductId, setEditingProductId] = useState<number | null>(null)
  const [editingPriceGroupId, setEditingPriceGroupId] = useState<number | null>(null)
  const [products, setProducts] = useState<ProductEntry[]>(() => loadProducts())
  const [priceGroups, setPriceGroups] = useState<PriceGroupEntry[]>(() => loadPriceGroups())

  const handleSaveProduct = useCallback((data: Omit<ProductEntry, "id" | "status">) => {
    setProducts((prev) => {
      const next = [...prev, { ...data, id: Date.now(), status: "draft" as const }]
      saveProducts(next)
      return next
    })
  }, [])

  const handleDeleteProduct = useCallback((id: number) => {
    setProducts((prev) => {
      const next = prev.filter((p) => p.id !== id)
      saveProducts(next)
      return next
    })
  }, [])

  const handleUpdateProduct = useCallback((id: number, data: Omit<ProductEntry, "id" | "status">) => {
    setProducts((prev) => {
      const next = prev.map((p) => p.id === id ? { ...p, ...data } : p)
      saveProducts(next)
      return next
    })
  }, [])

  const handleUpdatePriceGroup = useCallback((id: number, data: Omit<PriceGroupEntry, "id">) => {
    setPriceGroups((prev) => {
      const next = prev.map((g) => g.id === id ? { ...g, ...data } : g)
      savePriceGroups(next)
      return next
    })
  }, [])

  const handleSavePriceGroup = useCallback((data: Omit<PriceGroupEntry, "id">) => {
    setPriceGroups((prev) => {
      const next = [...prev, { ...data, id: Date.now() }]
      savePriceGroups(next)
      return next
    })
  }, [])

  const handleDeletePriceGroup = useCallback((id: number) => {
    setPriceGroups((prev) => {
      const next = prev.filter((g) => g.id !== id)
      savePriceGroups(next)
      return next
    })
  }, [])

  const handleCreate = () => {
    if (activeTab === "products") {
      if (productFilter === "price-groups") setShowCreatePriceGroup(true)
      else setShowCreateProduct(true)
    } else if (activeTab === "plans") onCreatePricingPlan()
  }

  const createLabel = activeTab === "plans"
    ? "Add pricing plan"
    : productFilter === "price-groups"
      ? "Create price group"
      : "Create product"

  const filterChips: { id: ProductFilter; label: string; count: number }[] = [
    { id: "products", label: "Products", count: products.length },
    { id: "price-groups", label: "Price groups", count: priceGroups.length },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-[4px]">
        <h1 className="text-[28px] font-[700] leading-[36px] tracking-[0.38px] text-[#353A44]">Product catalog</h1>
        <div className="flex items-center gap-[8px]">
          {activeTab === "products" && productFilter !== "price-groups" && (
            <button
              type="button"
              className="flex h-[34px] items-center rounded-[6px] border border-[#D8DEE4] bg-white px-[12px] text-[13px] font-[600] leading-[18px] text-[#353A44] hover:border-[#B6C0CD] hover:bg-[#F5F6F8] transition-colors"
              onClick={() => setShowCreatePriceGroup(true)}
            >
              Create price group
            </button>
          )}
          <button
            type="button"
            className="flex h-[34px] items-center rounded-[6px] bg-[#533AFD] px-[12px] text-[13px] font-[600] leading-[18px] text-white hover:bg-[#4730E0] transition-colors"
            onClick={handleCreate}
          >
            {createLabel}
          </button>
        </div>
      </div>

      {/* Tabs — Sail underline style */}
      <div className="flex border-b border-[#E3E8EF]" role="tablist">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          const isClickable = tab.id === "products" || tab.id === "plans" || tab.id === "meters"
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              disabled={!isClickable}
              className={cn(
                "relative px-[12px] py-[10px] text-[13px] font-[500] leading-[16px] transition-colors",
                isActive
                  ? "text-[#533AFD]"
                  : isClickable
                    ? "text-[#596171] hover:text-[#353A44]"
                    : "text-[#596171] cursor-default"
              )}
              onClick={isClickable ? () => { setActiveTab(tab.id); if (tab.id !== "products") setProductFilter("products") } : undefined}
            >
              {tab.label}
              {isActive && (
                <span className="absolute bottom-0 left-[12px] right-[12px] h-[2px] rounded-full bg-[#533AFD]" />
              )}
            </button>
          )
        })}
      </div>

      {/* Filter chips — only on products tab */}
      {activeTab === "products" && (
        <div className="flex gap-[8px] py-[16px]">
          {filterChips.map((chip) => {
            const isActive = productFilter === chip.id
            return (
              <button
                key={chip.id}
                type="button"
                className={cn(
                  "flex items-center gap-[8px] rounded-[8px] px-[12px] py-[8px] text-[14px] leading-[20px] tracking-[-0.15px] transition-all",
                  isActive
                    ? "border-2 border-[#353A44] font-[600] text-[#353A44] shadow-[0px_2px_3px_0px_rgba(33,37,44,0.16)]"
                    : "border border-[#EBEEF1] font-[600] text-[#596171] hover:border-[#D8DEE4]"
                )}
                onClick={() => setProductFilter(chip.id)}
              >
                <span>{chip.label}</span>
                <span className={isActive ? "font-[400] text-[#353A44]" : "font-[400] text-[#596171]"}>{chip.count}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Tab content */}
      {activeTab === "products" && productFilter === "products" && (
        products.length > 0
          ? <ProductTable products={products} onDelete={handleDeleteProduct} onEdit={setEditingProductId} onProductClick={onProductClick} />
          : <EmptyState tab="products" onCreate={() => setShowCreateProduct(true)} />
      )}


      {activeTab === "products" && productFilter === "price-groups" && (
        priceGroups.length > 0
          ? (
            <div className="mt-2">
              <div>
                {/* Header row */}
                <div className="border-b border-[#EBEEF1] bg-white">
                  <div className="grid h-[40px] grid-cols-[1.5fr_1fr_1fr_60px] items-center gap-8 text-[12px] font-[500] text-[#6C7688]">
                    <span>Name</span>
                    <span>Products (prices)</span>
                    <span>Service interval</span>
                    <span />
                  </div>
                </div>

                {/* Data rows */}
                <div className="divide-y divide-[#EBEEF1] bg-white">
                  {priceGroups.map((g) => {
                    const n = g.rates.length
                    const productPriceSummary = `${n} price${n !== 1 ? "s" : ""}`
                    return (
                      <div
                        key={g.id}
                        className="group/row grid h-[40px] w-full grid-cols-[1.5fr_1fr_1fr_60px] items-center gap-8 text-left text-[13px] font-[500] text-[#353A44] hover:bg-[#F7F8FA] transition-colors cursor-pointer"
                        onClick={() => setEditingPriceGroupId(g.id)}
                      >
                        <span className="truncate">{g.name || "Untitled"}</span>
                        <span className="truncate text-[#596171]">{productPriceSummary}</span>
                        <span className="truncate text-[#596171]">{g.serviceInterval}</span>
                        <TableRowActions onEdit={() => setEditingPriceGroupId(g.id)} onDelete={() => handleDeletePriceGroup(g.id)} />
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )
          : <EmptyState tab="price-groups" onCreate={() => setShowCreatePriceGroup(true)} />
      )}

      {activeTab === "plans" && (
        <div className="pt-[16px]">
          {pricingPlans.length > 0
            ? <PlansTable plans={pricingPlans} onClick={onPlanClick} />
            : <EmptyState tab="plans" onCreate={onCreatePricingPlan} />}
        </div>
      )}

      {activeTab === "meters" && (
        <MetersListView />
      )}

      {showCreateProduct && (
        <CreateProductModal
          onClose={() => setShowCreateProduct(false)}
          onSave={handleSaveProduct}
          onMorePricingOptions={onMorePricingOptions}
        />
      )}

      {showCreatePriceGroup && (
        <CreatePriceGroupOverlay
          onClose={() => setShowCreatePriceGroup(false)}
          onSave={handleSavePriceGroup}
          products={products}
        />
      )}

      {editingProductId != null && (() => {
        const product = products.find((p) => p.id === editingProductId)
        if (!product) return null
        return (
          <CreateProductModal
            onClose={() => setEditingProductId(null)}
            onSave={(data) => {
              handleUpdateProduct(editingProductId, data)
              setEditingProductId(null)
            }}
            initial={product}
          />
        )
      })()}

      {editingPriceGroupId != null && (() => {
        const group = priceGroups.find((g) => g.id === editingPriceGroupId)
        if (!group) return null
        return (
          <CreatePriceGroupOverlay
            onClose={() => setEditingPriceGroupId(null)}
            onSave={(data) => {
              handleUpdatePriceGroup(editingPriceGroupId, data)
              setEditingPriceGroupId(null)
            }}
            products={products}
            initial={group}
          />
        )
      })()}
    </div>
  )
}
