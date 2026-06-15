'use client'

import { useEffect, useMemo, useState } from "react"

import { Selector } from "@/components/Selector"
import { CurrencyFlag } from "@/components/CurrencyFlag"
import { ProductObjectMapView } from "@/components/product-catalog/ObjectMapView"
import { PlanCodeView } from "@/components/product-catalog/PlanCodeView"
import { generateProductCode, type ProductCodeGeneratorInput } from "@/components/product-catalog/StripeCodeGenerator"
import { AccountLogo } from "@/components/ProductAssistantPanel"
import { cn } from "@/lib/utils"

const SCALLOP_TOP_BG = `url("data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 350 27'><path fill='white' d='M350 27L350 0L343.748 5.46605e-07C339.715 2.02948 337.812 7.19271 333.18 7.19271C327.879 7.19271 326.859 1.99963 323.201 2.34287e-06L316.926 2.89146e-06C313.267 1.98969 312.248 7.19271 306.947 7.19271C301.646 7.19271 300.626 1.99964 296.968 4.63624e-06L290.693 5.18482e-06C287.034 1.98969 286.015 7.19271 280.714 7.19271C275.413 7.19271 274.393 1.99964 270.735 6.9296e-06L264.46 7.47818e-06C260.801 1.98969 259.782 7.19271 254.481 7.19271C249.18 7.19271 248.16 1.99964 244.502 9.22296e-06L238.227 9.77155e-06C234.568 1.98969 233.549 7.19272 228.248 7.19272C222.947 7.19272 221.927 1.99964 218.269 1.15163e-05L211.994 1.20649e-05C208.335 1.9897 207.316 7.19272 202.015 7.19272C196.714 7.19272 195.694 1.99965 192.036 1.38097e-05L185.761 1.43583e-05C182.102 1.9897 181.083 7.19272 175.782 7.19272C170.481 7.19272 169.461 1.99965 165.803 1.6103e-05L159.528 1.66516e-05C155.869 1.9897 154.85 7.19272 149.549 7.19272C144.248 7.19272 143.228 1.99965 139.57 1.83964e-05L133.294 1.8945e-05C129.636 1.9897 128.617 7.19272 123.316 7.19272C118.015 7.19273 116.995 1.99965 113.337 2.06898e-05L107.061 2.12384e-05C103.403 1.9897 102.384 7.19273 97.0825 7.19273C91.7816 7.19273 90.7621 1.99965 87.1036 2.29831e-05L80.8285 2.35317e-05C77.1699 1.98971 76.1505 7.19273 70.8495 7.19273C65.5486 7.19273 64.5291 1.99966 60.8706 2.52765e-05L54.5955 2.58251e-05C50.9369 1.98971 49.9175 7.19273 44.6165 7.19273C39.3156 7.19273 38.2961 1.99966 34.6375 2.75699e-05L28.3625 2.81184e-05C24.7039 1.98971 23.6845 7.19273 18.3835 7.19273C13.0825 7.19273 12.0631 1.99966 8.40456 2.98632e-05L2.12944 3.04118e-05C1.31391 0.447709 0.622965 1.04461 -1.18668e-05 1.71116L-9.65595e-06 27'/></svg>"
)}")`

const SCALLOP_BOTTOM_BG = `url("data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 350 27'><path fill='white' d='M0 0V27H6.25243C10.2848 24.9705 12.1877 19.8073 16.8204 19.8073C22.1214 19.8073 23.1408 25.0004 26.7994 27H33.0744C36.733 25.0103 37.7524 19.8073 43.0534 19.8073C48.3544 19.8073 49.3738 25.0004 53.0324 27H59.3074C62.966 25.0103 63.9854 19.8073 69.2864 19.8073C74.5874 19.8073 75.6068 25.0004 79.2654 27H85.5405C89.199 25.0103 90.2185 19.8073 95.5194 19.8073C100.82 19.8073 101.84 25.0004 105.498 27H111.773C115.432 25.0103 116.451 19.8073 121.752 19.8073C127.053 19.8073 128.073 25.0004 131.731 27H138.006C141.665 25.0103 142.684 19.8073 147.985 19.8073C153.286 19.8073 154.306 25.0004 157.964 27H164.239C167.898 25.0103 168.917 19.8073 174.218 19.8073C179.519 19.8073 180.539 25.0004 184.197 27H190.473C194.131 25.0103 195.15 19.8073 200.451 19.8073C205.752 19.8073 206.772 25.0004 210.43 27H216.706C220.364 25.0103 221.384 19.8073 226.684 19.8073C231.985 19.8073 233.005 25.0004 236.663 27H242.939C246.597 25.0103 247.617 19.8073 252.917 19.8073C258.218 19.8073 259.238 25.0004 262.896 27H269.172C272.83 25.0103 273.85 19.8073 279.15 19.8073C284.451 19.8073 285.471 25.0004 289.129 27H295.405C299.063 25.0103 300.083 19.8073 305.383 19.8073C310.684 19.8073 311.704 25.0004 315.362 27H321.638C325.296 25.0103 326.316 19.8073 331.617 19.8073C336.917 19.8073 337.937 25.0004 341.595 27H347.871C348.686 26.5523 349.377 25.9554 350 25.2889V0'/></svg>"
)}")`

type SavedPriceConfig = {
  chargeFrequency: string
  pricingModel: string
  billingPeriod: string
  includeTax: string
  currencies: { id: number; code: string }[]
  currencyAmounts: Record<number, string>
  tiers: number[]
  tierToValues: Record<number, string>
  tierUnitPrices: Record<number, string>
  tierFlatFees: Record<number, string>
  usageBasis: string
  tieredBy: string
  meter: string
}

type PriceSummary = {
  id: number
  label: string
  config: SavedPriceConfig
}

type ProductPreviewAreaProps = {
  t: (key: string) => string

  customerPreviewMode: string
  setCustomerPreviewMode: (next: string) => void
  customerPreviewOptions: string[]

  // Object map
  activeObjectForm: "product" | "meter" | "price"
  productName: string
  productDescription: string
  productLookupKey: string
  setActiveObjectForm: (next: "product" | "meter" | "price") => void
  setMeterName: (updater: (prev: string) => string) => void
  selectedNodeKey?: string | null
  onOpenAssistant?: (ref: import("@/components/ProductAssistantPanel").AssistantReference) => void

  pricingCurrencies: { id: number; code: string }[]
  currencyAmounts: Record<number, string>
  primaryCurrencyCode: string

  pricingModel: string
  chargeFrequency: string
  billingPeriod: string
  includeTax: string
  usageBasis: string
  tieredBy: string

  tiers: number[]
  tierToValues: Record<number, string>
  tierUnitPrices: Record<number, string>
  tierFlatFees: Record<number, string>

  previewUnitQuantity: string
  setPreviewUnitQuantity: (next: string) => void
  previewLocation: string
  setPreviewLocation: (next: string) => void
  previewState: string
  setPreviewState: (next: string) => void

  locationOptions: string[]
  stateOptions: string[]
  getLocationLabel: (code: string) => string

  numberFormatter: Intl.NumberFormat
  parseNumberValue: (value: string) => number
  formatCurrencyValue: (value: number, currency: string, minimumFractionDigits?: number) => string

  collapsedPrices: PriceSummary[]
  getPriceLabel: (price: PriceSummary | null) => string
  activeTreePriceId: number | null
  onSelectPrice: (priceId: number) => void
  draftPriceName: string

  vercelIconDarkSrc: string
}

export function ProductPreviewArea(props: ProductPreviewAreaProps) {
  const {
    t,
    customerPreviewMode,
    productName,
    productDescription,
    productLookupKey,
    activeObjectForm,
    setActiveObjectForm,
    setMeterName,
    selectedNodeKey,
    onOpenAssistant,
    pricingCurrencies,
    currencyAmounts,
    primaryCurrencyCode,
    pricingModel,
    chargeFrequency,
    billingPeriod,
    includeTax,
    usageBasis,
    tieredBy,
    tiers,
    tierToValues,
    tierUnitPrices,
    tierFlatFees,
    previewUnitQuantity,
    setPreviewUnitQuantity,
    previewLocation,
    setPreviewLocation,
    previewState,
    setPreviewState,
    locationOptions,
    stateOptions,
    getLocationLabel,
    numberFormatter,
    parseNumberValue,
    formatCurrencyValue,
    collapsedPrices,
    getPriceLabel,
    activeTreePriceId,
    onSelectPrice,
    draftPriceName,
  } = props
  const normalizedPreviewMode =
    customerPreviewMode === "Customer preview"
      ? "Preview"
      : customerPreviewMode === "Customer preview code"
        ? "Code"
        : customerPreviewMode === "Object map"
          ? "Map"
          : customerPreviewMode
  const previewMode = (["Preview", "Map", "Code"] as const).includes(normalizedPreviewMode as any)
    ? (normalizedPreviewMode as "Preview" | "Map" | "Code")
    : "Preview"
  const isObjectMap = previewMode === "Map"
  const isCode = previewMode === "Code"

  const [isDraggingUnitQuantity, setIsDraggingUnitQuantity] = useState(false)
  const [isThumbHoveredUnitQuantity, setIsThumbHoveredUnitQuantity] = useState(false)
  const [isPriceRowHovered, setIsPriceRowHovered] = useState(false)

  // Generate code sections for the code view
  const codeSections = useMemo(() => {
    const codeInput: ProductCodeGeneratorInput = {
      productName,
      productDescription,
      productLookupKey,
      prices: collapsedPrices.map((price) => ({
        id: price.id,
        name: price.label,
        chargeFrequency: price.config.chargeFrequency,
        pricingModel: price.config.pricingModel,
        billingPeriod: price.config.billingPeriod,
        includeTax: price.config.includeTax,
        currencies: price.config.currencies,
        currencyAmounts: price.config.currencyAmounts,
        tiers: price.config.tiers,
        tierToValues: price.config.tierToValues,
        tierUnitPrices: price.config.tierUnitPrices,
        tierFlatFees: price.config.tierFlatFees,
        usageBasis: price.config.usageBasis,
        tieredBy: price.config.tieredBy,
        meter: price.config.meter,
      })),
    }
    return generateProductCode(codeInput)
  }, [productName, productDescription, productLookupKey, collapsedPrices])

  useEffect(() => {
    const handlePointerUp = () => setIsDraggingUnitQuantity(false)
    window.addEventListener("pointerup", handlePointerUp)
    window.addEventListener("pointercancel", handlePointerUp)
    return () => {
      window.removeEventListener("pointerup", handlePointerUp)
      window.removeEventListener("pointercancel", handlePointerUp)
    }
  }, [])

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div
        className={cn(
          "relative flex-1 group overflow-hidden bg-[#F5F6F8]",
          !isObjectMap && !isCode && "rounded-[12px]"
        )}
      >
        {isObjectMap ? (
          <div className="min-h-[400px] lg:absolute lg:inset-0">
            <ProductObjectMapView
              t={t}
              productName={productName}
              prices={collapsedPrices.map((p) => ({ id: p.id, label: getPriceLabel(p), meter: p.config.meter }))}
              setActiveObjectForm={setActiveObjectForm}
              setMeterName={setMeterName}
              onSelectPrice={onSelectPrice}
              selectedNodeKey={selectedNodeKey}
              onOpenAssistant={onOpenAssistant}
            />
          </div>
        ) : isCode ? (
          <div className="min-h-[400px] lg:absolute lg:inset-0">
            <PlanCodeView t={t} sections={codeSections} />
          </div>
        ) : (
        <div className="px-4 sm:p-6 flex h-full w-full flex-col items-center justify-start pb-6 sm:justify-center sm:pb-0">
          {(() => {
            const getBillingLabelForPeriod = (period: string) => {
              const map: Record<string, string> = {
                Daily: "day",
                Weekly: "week",
                Monthly: "month",
                Yearly: "year",
                "Every 3 months": "3 months",
                "Every 6 months": "6 months",
              }
              return map[period] ?? period.toLowerCase()
            }

            const previewCurrencyCode =
              pricingCurrencies.find((currency) => getLocationLabel(currency.code) === previewLocation)?.code ||
              primaryCurrencyCode ||
              "USD"

            const hasAnyPrices = collapsedPrices.length > 0
            const draftLabel = draftPriceName.trim() ? draftPriceName.trim() : t("Untitled price")
            const selectedPrice =
              activeTreePriceId != null ? collapsedPrices.find((price) => price.id === activeTreePriceId) ?? null : null

            // When the user is editing a price, the preview should reflect live edits (not the last saved snapshot).
            // When they're not in the price form, show the saved config for the selected price (if any).
            const editorConfig = {
              chargeFrequency,
              pricingModel,
              billingPeriod,
              includeTax,
              usageBasis,
              tieredBy,
              currencies: pricingCurrencies,
              currencyAmounts,
              tiers,
              tierToValues,
              tierUnitPrices,
              tierFlatFees,
              meter: "",
            }
            const effectiveConfig =
              activeObjectForm === "price"
                ? editorConfig
                : (selectedPrice?.config ?? editorConfig)

            const effectiveChargeFrequency = effectiveConfig.chargeFrequency
            const effectivePricingModel = effectiveConfig.pricingModel
            const effectiveBillingPeriod = effectiveConfig.billingPeriod
            const effectiveIncludeTax = effectiveConfig.includeTax
            const effectiveUsageBasis = effectiveConfig.usageBasis
            const effectiveTieredBy = effectiveConfig.tieredBy
            const effectiveCurrencies = effectiveConfig.currencies
            const effectiveCurrencyAmounts = effectiveConfig.currencyAmounts
            const effectiveTiers = effectiveConfig.tiers
            const effectiveTierToValues = effectiveConfig.tierToValues
            const effectiveTierUnitPrices = effectiveConfig.tierUnitPrices
            const effectiveTierFlatFees = effectiveConfig.tierFlatFees

            const isTieredPreview =
              effectivePricingModel === "Tiered pricing" || (effectivePricingModel === "Usage-based" && effectiveUsageBasis === "Tier")
            const isPackagePreview =
              effectivePricingModel === "Package pricing" || (effectivePricingModel === "Usage-based" && effectiveUsageBasis === "Package")

            const rawQuantity = parseNumberValue(previewUnitQuantity)
            const tierRanges = effectiveTiers.reduce<{ id: number; from: number; to: number; unitPrice: number; flatFee: number }[]>(
              (acc, id, index) => {
                const isLast = index === effectiveTiers.length - 1
                const defaultTo = (index + 1) * 1000
                const toRaw = effectiveTierToValues[id] || numberFormatter.format(defaultTo)
                const parsedTo = isLast ? Infinity : parseNumberValue(toRaw || `${defaultTo}`)
                const previousTo = acc[index - 1]?.to ?? 0
                acc.push({
                  id,
                  from: index === 0 ? 0 : previousTo + 1,
                  to: isLast ? Infinity : parsedTo,
                  unitPrice: parseNumberValue(effectiveTierUnitPrices[id] || "0"),
                  flatFee: parseNumberValue(effectiveTierFlatFees[id] || "0"),
                })
                return acc
              },
              []
            )
            const lastFrom = tierRanges.length ? tierRanges[tierRanges.length - 1]!.from : 0
            const sliderMax = isTieredPreview ? Math.max(100, lastFrom * 2) : Math.max(100, lastFrom * 2, 100)
            const sliderValue = Math.min(rawQuantity, sliderMax)
            const sliderPercent = sliderMax ? (sliderValue / sliderMax) * 100 : 0

            const getActiveTier = () => {
              if (!tierRanges.length) return null
              return tierRanges.find((tier) => rawQuantity <= tier.to) ?? tierRanges[tierRanges.length - 1]
            }

            const activeTier = getActiveTier()
            const baseUnitPrice = parseNumberValue(
              effectiveCurrencies[0] ? effectiveCurrencyAmounts[effectiveCurrencies[0]!.id] ?? "0" : "0"
            ) ?? 0

            const PACKAGE_SIZE = 10
            const displayUnitPrice = isTieredPreview ? activeTier?.unitPrice ?? 0 : baseUnitPrice
            const displayFlatFee = isTieredPreview ? activeTier?.flatFee ?? 0 : 0

            const usageTotal = (() => {
              if (isTieredPreview) {
                if (effectiveTieredBy === "Graduated") {
                  return tierRanges.reduce((total, tier, index) => {
                    const prevBoundary = index === 0 ? 0 : (tierRanges[index - 1]?.to ?? 0)
                    const upper = tier.to === Infinity ? rawQuantity : Math.min(rawQuantity, tier.to)
                    const units = Math.max(0, upper - prevBoundary)
                    if (!units) return total
                    return total + units * tier.unitPrice + tier.flatFee
                  }, 0)
                }
                // Volume: all units priced at the active tier.
                return rawQuantity * displayUnitPrice + displayFlatFee
              }
              if (isPackagePreview) {
                const packages = PACKAGE_SIZE > 0 ? Math.ceil(rawQuantity / PACKAGE_SIZE) : rawQuantity
                return packages * displayUnitPrice
              }
              return rawQuantity * displayUnitPrice
            })()

            const usageAmount = Math.max(usageTotal - displayFlatFee, 0)
            const salesTax =
              effectiveIncludeTax === "Taxes included"
                ? 0
                : // "Taxes excluded" or "Auto" (placeholder): show the 5% line.
                  usageTotal * 0.05
            const totalWithTax = usageTotal + salesTax
            const unitPriceLabel =
              displayUnitPrice === 0
                ? formatCurrencyValue(0, previewCurrencyCode, 2)
                : formatCurrencyValue(displayUnitPrice, previewCurrencyCode, displayUnitPrice < 1 ? 4 : 2)
            const flatFeeLabel = formatCurrencyValue(displayFlatFee, previewCurrencyCode, 2)
            const totalLabel = formatCurrencyValue(usageTotal, previewCurrencyCode, 2)

            const priceOptions = [
              ...(!hasAnyPrices
                ? [
                    {
                      id: "draft",
                      label: draftLabel,
                      isPlaceholder: draftPriceName.trim() === "",
                    },
                  ]
                : []),
              ...collapsedPrices.map((price) => {
                const label = getPriceLabel(price)
                return {
                  id: String(price.id),
                  label,
                  isPlaceholder: label === t("Untitled price"),
                }
              }),
            ]
            const selectedPriceId =
              activeTreePriceId != null ? String(activeTreePriceId) : priceOptions[0]?.id ?? (hasAnyPrices ? "" : "draft")
            const selectedPriceLabel = hasAnyPrices ? getPriceLabel(selectedPrice) : draftLabel
            const selectedPriceIsPlaceholder = selectedPriceLabel === t("Untitled price") || (!hasAnyPrices && draftPriceName.trim() === "")
            const shouldShowPriceSelector = collapsedPrices.length > 1
            const isQuantityInteracting = isDraggingUnitQuantity || isThumbHoveredUnitQuantity
            const highlightValueClass =
              "rounded-[3px] bg-[#E0D9FB] px-[3px] -mx-[3px] transition-colors"

            return (
              <div className="w-full sm:max-w-[820px] lg:max-w-[1040px] flex flex-col items-center gap-[24px] lg:flex lg:flex-row lg:items-center lg:justify-center lg:gap-[24px]">
                {/* Receipt */}
                <div className="w-full min-w-0 max-w-none sm:max-w-[460px] lg:basis-[460px] lg:max-w-[460px]">
                  <div className="overflow-visible rounded-[12px]">
                    <div
                      aria-hidden="true"
                      className="h-[27px] w-full bg-repeat-x"
                      style={{ backgroundImage: SCALLOP_TOP_BG, backgroundSize: "350px 27px" }}
                    />
                    <div className="bg-white px-[16px] pb-[16px] pt-0">
                      <div className="flex items-center gap-[12px]">
                        <Selector
                          ariaLabel={t("Location")}
                          size="sm"
                          value={previewLocation}
                          onChange={setPreviewLocation}
                          options={locationOptions}
                          getDisplayValue={t}
                          triggerIcon={<CurrencyFlag currency={previewCurrencyCode} size={14} />}
                          buttonClassName="h-[32px] gap-[6px] justify-between border border-[#D8DEE4] bg-white px-[12px] py-[8px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44]"
                          simpleDropdownPosition
                        />
                        <Selector
                          ariaLabel={t("State")}
                          size="sm"
                          value={previewState}
                          onChange={setPreviewState}
                          options={stateOptions}
                          getDisplayValue={t}
                          buttonClassName="h-[32px] justify-between border border-[#D8DEE4] bg-white px-[12px] py-[8px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44]"
                          simpleDropdownPosition
                        />
                      </div>
                    </div>

                    <div className="bg-white">
                      <div className="flex flex-col gap-[48px] px-[24px] pb-[24px] pt-[4px]">
                        <AccountLogo size={32} />
                        <div className="flex flex-col gap-[2px]">
                          <p className="text-[16px] font-[500] leading-[24px] tracking-[-0.31px] text-[#353A44]">
                            {productName.trim() || t("Untitled product")}
                          </p>
                          <p className="text-[14px] font-[500] leading-[16px] tracking-[-0.028px] text-[#596171]">
                            {(() => {
                              const periodLabel = getBillingLabelForPeriod(effectiveBillingPeriod || "Monthly")
                              if (effectiveChargeFrequency === "One-off") {
                                return `${formatCurrencyValue(usageTotal, previewCurrencyCode, 2)} ${t("one-time")}`
                              }
                              if (isTieredPreview) {
                                return `${formatCurrencyValue(displayFlatFee, previewCurrencyCode, 2)} ${t("per")} ${periodLabel} + ${formatCurrencyValue(
                                  usageAmount,
                                  previewCurrencyCode,
                                  2
                                )} ${t("usage")}`
                              }
                              return `${formatCurrencyValue(usageTotal, previewCurrencyCode, 2)} ${t("per")} ${periodLabel}`
                            })()}
                          </p>
                        </div>
                      </div>

                      <div className="border-t border-[#EBEEF1] px-[24px] pb-[8px] pt-[16px]">
                        <div className="flex flex-col gap-[12px]">
                          <div className="flex items-end justify-between text-nowrap text-[#353A44]">
                            <span className="text-[12px] font-[400] leading-[15px]">{t("Subtotal")}</span>
                                <span
                                  className={cn(
                                    "text-[14px] font-[500] leading-[16px] tracking-[-0.028px]",
                                    isQuantityInteracting && highlightValueClass
                                  )}
                                >
                              {formatCurrencyValue(usageTotal, previewCurrencyCode, 2)}
                            </span>
                          </div>
                          <div className="flex items-end justify-between text-nowrap">
                            <div className="flex items-center gap-[2px] text-[12px] font-[400] leading-[15px]">
                              <span className="text-[#353A44]">{t("Sales tax")}</span>
                              <span className="text-[#6C7688]">∙</span>
                              <span className="text-[#353A44]">
                                {effectiveIncludeTax === "Taxes included" ? t("included") : "5%"}
                              </span>
                            </div>
                                <span
                                  className={cn(
                                    "text-[14px] font-[500] leading-[16px] tracking-[-0.028px] text-[#353A44]",
                                    isQuantityInteracting && highlightValueClass
                                  )}
                                >
                              {formatCurrencyValue(salesTax, previewCurrencyCode, 2)}
                            </span>
                          </div>
                          <div className="flex items-end justify-between">
                            <span className="text-[14px] font-[500] leading-[22px] tracking-[-0.028px] text-[#353A44]">
                              {effectiveChargeFrequency === "One-off" ? t("Total") : t("Total per period")}
                            </span>
                                <div
                                  className={cn(
                                    "flex items-end gap-[4px] text-nowrap font-[500]",
                                    isQuantityInteracting && highlightValueClass
                                  )}
                                >
                              <span className="text-[14px] leading-[22px] tracking-[-0.028px] text-[#596171]">
                                {previewCurrencyCode}
                              </span>
                              <span className="text-[16px] leading-[24px] tracking-[-0.31px] text-[#353A44]">
                                {formatCurrencyValue(totalWithTax, previewCurrencyCode, 2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div
                      aria-hidden="true"
                      className="h-[27px] w-full bg-repeat-x"
                      style={{ backgroundImage: SCALLOP_BOTTOM_BG, backgroundSize: "350px 27px" }}
                    />
                  </div>
                </div>

                {/* Controls */}
                <div className="flex w-full min-w-0 max-w-none sm:max-w-[380px] flex-col overflow-visible px-0 py-[16px] lg:basis-[360px] lg:max-w-[360px]">
                  <div className="flex w-full flex-col gap-[16px]">
                    <p className="text-[14px] font-[500] leading-[16px] tracking-[-0.028px] text-[#353A44]">
                      {t("Price modelling")}
                    </p>
                    <div className="flex flex-col gap-[16px]">
                      <div className="flex flex-col gap-[16px]">
                        <div
                          className="flex items-center"
                          onMouseEnter={() => setIsPriceRowHovered(true)}
                          onMouseLeave={() => setIsPriceRowHovered(false)}
                        >
                          {shouldShowPriceSelector ? (
                            <Selector
                              ariaLabel={t("Price")}
                              size="sm"
                              value={selectedPriceId}
                              onChange={(next) => {
                                const id = Number(next)
                                // "draft" is a UI-only placeholder when no prices exist yet.
                                if (next === "draft") return
                                if (Number.isFinite(id)) onSelectPrice(id)
                              }}
                              options={priceOptions.map((option) => option.id)}
                              getDisplayValue={(value) => priceOptions.find((option) => option.id === value)?.label ?? selectedPriceLabel}
                              renderOption={(value) => {
                                const option = priceOptions.find((o) => o.id === value) ?? null
                                const isPlaceholder = option?.isPlaceholder ?? false
                                const label = option?.label ?? selectedPriceLabel
                                return <span className={isPlaceholder ? "text-[#6C7688]" : "text-[#353A44]"}>{label}</span>
                              }}
                              chevronVisibility="hover"
                              buttonClassName={cn(
                                // Match plan flow: borderless + no chevron until interaction.
                                "!h-[24px] !min-h-[24px] !px-[6px] !py-[4px] !text-[12px] !leading-[16px] !tracking-[-0.024px] !shadow-none",
                                "!border !border-transparent !bg-transparent",
                                selectedPriceIsPlaceholder && "!text-[#6C7688]",
                                isPriceRowHovered && "!border-[#D8DEE4] !bg-white",
                                "hover:!border-[#D8DEE4] hover:!bg-white focus-visible:!border-[#D8DEE4] focus-visible:!bg-white"
                              )}
                              dropdownLeftOffset={-6}
                            />
                          ) : (
                            <p
                              className={cn(
                                "h-[24px] flex items-center max-w-[220px] overflow-hidden text-ellipsis whitespace-nowrap rounded-[6px] px-[6px] py-[4px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px]",
                                selectedPriceIsPlaceholder ? "text-[#6C7688]" : "text-[#596171]"
                              )}
                            >
                              {selectedPriceLabel}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-[16px]">
                            {(() => {
                              const DOT_COUNT = 7

                              return (
                                <div
                                  className={cn(
                                    // Grow to fill available width on larger screens (panel can be wider than the controls).
                                    "relative h-[18px] w-full px-[6px] sm:min-w-[170px] sm:flex-1",
                                    isDraggingUnitQuantity ? "cursor-grabbing" : "cursor-grab"
                                  )}
                                  onMouseMove={(event) => {
                                    const rect = event.currentTarget.getBoundingClientRect()
                                    const ratio = sliderMax ? sliderValue / sliderMax : 0
                                    const thumbCenterX = 6 + (rect.width - 18) * ratio
                                    const x = event.clientX - rect.left
                                    const y = event.clientY - rect.top
                                    setIsThumbHoveredUnitQuantity(Math.abs(x - thumbCenterX) <= 10 && y >= 0 && y <= rect.height)
                                  }}
                                  onMouseLeave={() => setIsThumbHoveredUnitQuantity(false)}
                                >
                                  {/* Track */}
                                  <div className="pointer-events-none absolute left-[6px] right-[6px] top-1/2 h-[6px] -translate-y-1/2 rounded-[12px] bg-[#EBEEF1]" />

                                  {/* Magnet dots */}
                                  <div className="pointer-events-none absolute left-[6px] right-[6px] top-1/2 -translate-y-1/2 flex items-center justify-between">
                                    {Array.from({ length: DOT_COUNT }, (_, i) => (
                                      <div key={i} className="h-[4px] w-[4px] rounded-[12px] bg-[#818DA0] opacity-40" />
                                    ))}
                                  </div>

                                  {/* Thumb */}
                                  <div
                                    className={cn(
                                      "pointer-events-none absolute top-1/2 h-[18px] w-[18px] -translate-y-1/2 -translate-x-1/2 rounded-full bg-white",
                                      !isDraggingUnitQuantity && "shadow-[0_0.667px_2px_rgba(0,0,0,0.30)]",
                                      (isThumbHoveredUnitQuantity || isDraggingUnitQuantity) &&
                                        "scale-[1.12] shadow-[0_1.25px_3.5px_rgba(0,0,0,0.36)]",
                                      "origin-center transition-[transform,box-shadow] duration-150 ease-out"
                                    )}
                                    style={{ left: `calc(6px + (100% - 18px) * ${sliderPercent / 100})` }}
                                  />

                                  {/* Tooltip */}
                                  {isDraggingUnitQuantity || isThumbHoveredUnitQuantity ? (
                                    <div
                                      className="pointer-events-none absolute -top-[38px] z-10 -translate-x-1/2"
                                      style={{ left: `calc(6px + (100% - 18px) * ${sliderPercent / 100})` }}
                                    >
                                      <div className="rounded-[4px] bg-[#474E5A] px-[6px] py-[3px] text-[12px] font-[500] leading-[16px] text-[#D8DEE4] shadow-[0_2px_5px_rgba(64,68,82,0.08),0_3px_9px_rgba(64,68,82,0.08)]">
                                        {numberFormatter.format(sliderValue)}
                                      </div>
                                      <div className="mx-auto h-0 w-0 border-x-[5px] border-t-[6px] border-x-transparent border-t-[#474E5A]" />
                                    </div>
                                  ) : null}

                                  <input
                                    type="range"
                                    min={0}
                                    max={sliderMax}
                                    value={sliderValue}
                                    onPointerDown={() => setIsDraggingUnitQuantity(true)}
                                    onInput={(event) => {
                                      const nextRaw = Number(event.currentTarget.value)
                                      const next = Number.isFinite(nextRaw) ? Math.max(0, Math.round(nextRaw)) : 0
                                      setPreviewUnitQuantity(numberFormatter.format(next))
                                    }}
                                    className={cn(
                                      "absolute inset-0 z-20 h-full w-full opacity-0 touch-none",
                                      isDraggingUnitQuantity ? "cursor-grabbing" : "cursor-grab",
                                      "active:cursor-grabbing"
                                    )}
                                    aria-label={t("Unit quantity")}
                                  />
                                </div>
                              )
                            })()}
                            <input
                              type="text"
                              inputMode="numeric"
                              value={previewUnitQuantity}
                              onChange={(event) => {
                                const digits = event.target.value.replace(/[^0-9]/g, "")
                                setPreviewUnitQuantity(digits ? numberFormatter.format(Number(digits)) : "")
                              }}
                              className={cn(
                                "w-[52px] rounded-[6px] border border-[#D8DEE4] bg-transparent px-[8px] py-[5px] text-left text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] outline-none",
                                "hover:bg-white focus:bg-white",
                                isDraggingUnitQuantity && "bg-white"
                              )}
                            />
                        </div>
                      </div>

                      <div className="mt-[23px] flex flex-col gap-[4px]">
                        <div className="flex items-center gap-[16px] text-[12px] font-[400] leading-[16px] text-[#353A44] text-left">
                          <span className="flex-1 text-left text-nowrap">{t("Units")}</span>
                          <span className="flex-1 text-left text-nowrap">{isPackagePreview ? t("Package price") : t("Unit price")}</span>
                          {isTieredPreview && <span className="flex-1 text-left text-nowrap">{t("Flat fee")}</span>}
                          <span className="flex-1 text-left text-nowrap">{t("Total")}</span>
                        </div>
                        <div className="flex items-center">
                          <div className="flex flex-1 items-center justify-start rounded-bl-[6px] rounded-tl-[6px] border border-[#D8DEE4] bg-[#F5F6F8] px-[12px] py-[8px] text-[12px] font-[500] text-[#353A44]">
                            <span className={cn(isQuantityInteracting && highlightValueClass)}>
                              {previewUnitQuantity || "0"}
                            </span>
                          </div>
                          <div className="w-[24px] border-y border-[#D8DEE4] bg-white px-[8px] py-[8px] text-[12px] font-[500] text-[#6C7688]">
                            ×
                          </div>
                          <div className="flex flex-1 items-center justify-start border border-l-0 border-[#D8DEE4] bg-[#F5F6F8] px-[12px] py-[8px] text-[12px] font-[500] text-[#353A44]">
                            <span className={cn(isQuantityInteracting && highlightValueClass)}>
                              {unitPriceLabel}
                            </span>
                          </div>
                          {isTieredPreview && (
                            <>
                              <div className="border-y border-[#D8DEE4] bg-white px-[8px] py-[8px] text-[12px] font-[500] text-[#6C7688]">
                                +
                              </div>
                              <div className="flex flex-1 items-center justify-start border border-l-0 border-[#D8DEE4] bg-[#F5F6F8] px-[12px] py-[8px] text-[12px] font-[500] text-[#353A44]">
                                <span className={cn(isQuantityInteracting && highlightValueClass)}>
                                  {flatFeeLabel}
                                </span>
                              </div>
                            </>
                          )}
                          <div className="border-y border-[#D8DEE4] bg-white px-[8px] py-[8px] text-[12px] font-[500] text-[#6C7688]">
                            =
                          </div>
                          <div className="flex flex-1 items-center justify-start rounded-br-[6px] rounded-tr-[6px] border border-l-0 border-[#D8DEE4] bg-[#F5F6F8] px-[12px] py-[8px] text-[12px] font-[500] text-[#353A44]">
                            <span className={cn(isQuantityInteracting && highlightValueClass)}>
                              {totalLabel}
                            </span>
                          </div>
                        </div>
                        {isPackagePreview ? (
                          <p className="pt-[6px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#6C7688]">
                            {t("Charged in packages of")} {PACKAGE_SIZE} {t("units")}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
        )}
      </div>
    </div>
  )
}


