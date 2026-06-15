"use client"

import { useMemo, useState } from "react"
import { FormRow } from "@/components/FormRow"
import { SegmentedControl } from "@/components/SegmentedControl"
import { Selector } from "@/components/Selector"
import type { PlanFormContext } from "./planFormTypes"

const taxCodeOptions = ["Account default", "Digital", "Physical", "Service"]
const taxBehaviorOptions = ["Unspecified", "Inclusive", "Exclusive"]

type RateCardFormProps = {
  ctx: PlanFormContext
  isHighlighted: (key: string) => boolean
  highlightInputClass: (key: string) => string
  isLoading: (key: string) => boolean
  validationErrorClass: (key: string) => string
  validationErrorMessage: (key: string) => string | undefined
}

export function RateCardForm({ ctx, isHighlighted, highlightInputClass, isLoading, validationErrorClass, validationErrorMessage }: RateCardFormProps) {
  const {
    t,
    textFieldInputClasses,
    activePlanNode,
    activePlanRateCardId,
    planRateCards,
    rateCardServicingPeriods,
    setRateCardServicingPeriods,
    updateRateCardName,
    meterOptions,
    rateCardLookupKeys,
    setRateCardLookupKeys,
    rateMeters,
    setRateMeters,
    onOpenMeterBuilderForRate,
  } = ctx

  const rateCardId = activePlanNode.id ?? activePlanRateCardId
  const rateCard = planRateCards.find((card) => card.id === rateCardId)

  const catalogProductNames = useMemo(() => {
    if (typeof window === "undefined") return []
    try {
      const raw = window.localStorage.getItem("product-catalog-standalone-products")
      const prods: { name: string }[] = raw ? JSON.parse(raw) : []
      return prods.map((p) => p.name).filter(Boolean)
    } catch { return [] }
  }, [])
  const productType = rateCardServicingPeriods[rateCardId] ?? ""
  const isComposite = productType === "Composite"
  const isUsageBased = productType === "Usage-based"
  const firstRateId = rateCard?.rates[0]?.id ?? 0

  const [description, setDescription] = useState("")
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [taxCode, setTaxCode] = useState("Account default")
  const [taxBehavior, setTaxBehavior] = useState("Unspecified")
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [productDropdownOpen, setProductDropdownOpen] = useState(false)
  const [productSearch, setProductSearch] = useState("")

  const otherProducts = planRateCards
    .filter((card) => card.id !== rateCardId && card.name.trim())
    .map((card) => card.name)

  const filteredProducts = otherProducts
    .filter((p) => !selectedProducts.includes(p))
    .filter((p) => !productSearch || p.toLowerCase().includes(productSearch.toLowerCase()))

  return (
    <div className="flex flex-col gap-[12px] min-w-0">
      <FormRow label={t("Product name")} fieldDescriptionId="ratecard-name">
        <div data-field-description="ratecard-name" className="w-full">
          <Selector
            ariaLabel={t("Product name")}
            size="sm"
            value={rateCard?.name ?? ""}
            onChange={(next) => updateRateCardName(rateCardId, next)}
            options={catalogProductNames}
            placeholder={t("Select or create product")}
            searchable
            searchPlaceholder={t("Search products")}
            fullWidth
            footerLabel={t("Create new product")}
            onFooterClick={() => {
              const name = prompt(t("Product name:"))
              if (name?.trim()) updateRateCardName(rateCardId, name.trim())
            }}
            buttonClassName={`h-[32px] w-full justify-between rounded-[6px] border border-[#D8DEE4] px-[8px] text-[12px] font-[500] text-[#353A44]`}
          />
        </div>
      </FormRow>
      <FormRow label={t("Description")} fieldDescriptionId="ratecard-description">
        <div data-field-description="ratecard-description" className="w-full">
          <textarea
            className={`min-h-[56px] w-full resize-none rounded-[6px] border border-[#D8DEE4] bg-white px-[8px] py-[6px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] placeholder:text-[#6C7688] outline-none hover:border-[#B6C0CD] focus:border-[#A0D0F7] focus:shadow-[0_0_0_1.5px_#A0D0F7] transition-all`}
            placeholder={t("Describe the product or service")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </FormRow>
      <FormRow label={t("Type")} fieldDescriptionId="ratecard-servicing-period">
        <div data-field-description="ratecard-servicing-period" className="w-full">
          <SegmentedControl
            value={rateCardServicingPeriods[rateCardId] || "Flat"}
            onChange={(next) => setRateCardServicingPeriods((prev) => ({ ...prev, [rateCardId]: next }))}
            options={["Flat", "Usage-based", "Composite"] as const}
            getDisplayValue={t}
          />
        </div>
      </FormRow>
      {isUsageBased && (
        <FormRow label={t("Meter")} fieldDescriptionId="ratecard-meter">
          <div data-field-description="ratecard-meter" className="w-full">
            <Selector
              ariaLabel={t("Meter")}
              size="sm"
              value={rateMeters[firstRateId] ?? ""}
              onChange={(next) => setRateMeters((prev) => ({ ...prev, [firstRateId]: next }))}
              options={meterOptions}
              placeholder={t("Add meter")}
              searchable
              searchPlaceholder={t("Search or create meter")}
              fullWidth
              footerLabel={t("Create new meter")}
              onFooterClick={() => onOpenMeterBuilderForRate(firstRateId)}
              buttonClassName={`h-[32px] w-full justify-between rounded-[6px] border border-[#D8DEE4] px-[8px] text-[12px] font-[500] ${
                !(rateMeters[firstRateId] ?? "").trim() ? "text-[#6C7688]" : "text-[#353A44]"
              }`}
            />
          </div>
        </FormRow>
      )}
      {isComposite && (
        <FormRow label={t("Applicable products")} fieldDescriptionId="ratecard-applicable-products">
          <div data-field-description="ratecard-applicable-products" className="w-full">
            <p className="mb-[4px] text-[11px] font-[400] leading-[14px] text-[#6C7688]">{t("Specify products and/or families")}</p>
            <div className="flex min-h-[30px] flex-wrap items-center gap-[4px] rounded-[6px] border border-[#D8DEE4] bg-white px-[8px] py-[4px] hover:border-[#B6C0CD] focus-within:border-[#A0D0F7] focus-within:shadow-[0_0_0_1.5px_#A0D0F7] transition-all">
              {selectedProducts.map((p) => (
                <span key={p} className="inline-flex items-center gap-[4px] rounded-full border border-[#D8DEE4] bg-white px-[8px] py-[1px] text-[11px] font-[600] leading-[16px] text-[#1A2C44]">
                  {p}
                  <button type="button" className="text-[#6C7688] hover:text-[#353A44]" onClick={() => setSelectedProducts((prev) => prev.filter((x) => x !== p))}>
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M6 2L2 6M2 2l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  </button>
                </span>
              ))}
              <div className="relative min-w-[60px] flex-1">
                <input
                  type="text"
                  placeholder={selectedProducts.length === 0 ? t("Select products") : t("Add more...")}
                  className="w-full bg-transparent text-[12px] font-[500] text-[#353A44] placeholder:text-[#6C7688] outline-none"
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value)
                    setProductDropdownOpen(true)
                  }}
                  onFocus={() => setProductDropdownOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && productSearch.trim()) {
                      e.preventDefault()
                      if (!selectedProducts.includes(productSearch.trim())) {
                        setSelectedProducts((prev) => [...prev, productSearch.trim()])
                      }
                      setProductSearch("")
                      setProductDropdownOpen(false)
                    }
                    if (e.key === "Escape") {
                      setProductDropdownOpen(false)
                    }
                  }}
                  onBlur={() => setTimeout(() => setProductDropdownOpen(false), 150)}
                />
                {productDropdownOpen && filteredProducts.length > 0 && (
                  <div className="absolute left-0 top-full z-50 mt-[4px] w-[200px] max-h-[160px] overflow-y-auto rounded-[6px] border border-[#D8DEE4] bg-white py-[4px] shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
                    {filteredProducts.map((p) => (
                      <button
                        key={p}
                        type="button"
                        className="flex w-full items-center px-[10px] py-[6px] text-[12px] font-[500] text-[#353A44] hover:bg-[#F5F6F8] transition-colors"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setSelectedProducts((prev) => [...prev, p])
                          setProductSearch("")
                          setProductDropdownOpen(false)
                        }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </FormRow>
      )}
      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-between rounded-[8px] px-4 py-[8px] transition-colors duration-150 hover:bg-[#F5F6F8]"
        onClick={() => setShowAdvanced(!showAdvanced)}
      >
        <span className="text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#1A2C44]">{t("Advanced settings")}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`transition-transform ${showAdvanced ? "rotate-180" : ""}`}>
          <path d="M3 4.5L6 7.5L9 4.5" stroke="#6C7688" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {showAdvanced && (
        <div className="flex flex-col gap-[12px]">
          <FormRow label={t("Tax code")} fieldDescriptionId="ratecard-tax-code">
            <div data-field-description="ratecard-tax-code" className="w-full">
              <Selector
                ariaLabel={t("Tax code")}
                size="sm"
                value={taxCode}
                onChange={setTaxCode}
                options={taxCodeOptions}
                fullWidth
                buttonClassName="h-[32px] w-full justify-between rounded-[6px] border border-[#D8DEE4] px-[8px] text-[12px] font-[500] text-[#353A44]"
              />
            </div>
          </FormRow>
          <FormRow label={t("Tax behavior")} fieldDescriptionId="ratecard-tax-behavior">
            <div data-field-description="ratecard-tax-behavior" className="w-full">
              <Selector
                ariaLabel={t("Tax behavior")}
                size="sm"
                value={taxBehavior}
                onChange={setTaxBehavior}
                options={taxBehaviorOptions}
                fullWidth
                buttonClassName="h-[32px] w-full justify-between rounded-[6px] border border-[#D8DEE4] px-[8px] text-[12px] font-[500] text-[#353A44]"
              />
            </div>
          </FormRow>
        </div>
      )}
    </div>
  )
}
