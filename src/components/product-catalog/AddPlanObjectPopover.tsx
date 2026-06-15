'use client'

import type { RefObject } from "react"
import { useDeferredValue, useMemo, useState } from "react"

import { SearchIcon } from "@/components/ProductCatalogIcons"
import { CatalogObjectGlyph } from "@/components/product-catalog/iconography"
import type { ComponentRecord, ComponentKind } from "@/components/product-catalog/componentTypes"

export type CatalogSearchItemPrice = {
  id: number
  name: string
  price: string
  cadence: string
  pricingModel: string
  meter: string
  priceType: string
  sellAs: string
  unitLabel: string
}

export type CatalogSearchItem = {
  id: number
  name: string
  kind: "product" | "priceGroup"
  productType?: "Flat" | "Usage" | "Usage-based" | "Composite"
  detail: string
  prices?: CatalogSearchItemPrice[]
}

type AddPlanObjectPopoverProps = {
  isOpen: boolean
  position: { top: number; left: number; above?: boolean; centerY?: boolean } | null
  popoverRef: RefObject<HTMLDivElement | null>
  t: (key: string) => string
  onAddObject: (kind: "rate-card" | "rate" | "credit-grant" | "subscription-fee" | "meter" | "product-with-price" | "price-group", rateCardId?: number) => void
  /** Whether the merchant has pre-existing components */
  hasComponents?: boolean
  /** Existing components available to add */
  existingComponents?: ComponentRecord[]
  /** Called when the user picks an existing component */
  onUseExistingComponent?: (componentId: string, kind: ComponentKind) => void
  /** Current number of rate cards in the plan */
  rateCardCount?: number
  /** Called when the user hovers over (or leaves) a menu item kind */
  onHoverKind?: (kind: "rate" | "subscription-fee" | "credit-grant" | "rate-card" | "product-with-price" | "price-group" | null) => void
  /** Searchable catalog items (products and price groups) */
  catalogItems?: CatalogSearchItem[]
  /** Called when user selects a catalog item */
  onSelectCatalogItem?: (item: CatalogSearchItem) => void
}

const MAX_RATE_CARDS = 2

function AddIcon({ disabled }: { disabled?: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8" fill="none" className="shrink-0">
      <path
        d="M4.75 0.75C4.75 0.335786 4.41421 0 4 0C3.58579 0 3.25 0.335786 3.25 0.75V3.25H0.75C0.335786 3.25 0 3.58579 0 4C0 4.41421 0.335786 4.75 0.75 4.75H3.25V7.25C3.25 7.66421 3.58579 8 4 8C4.41421 8 4.75 7.66421 4.75 7.25V4.75H7.25C7.66421 4.75 8 4.41421 8 4C8 3.58579 7.66421 3.25 7.25 3.25H4.75V0.75Z"
        fill={disabled ? "#C5CDD8" : "#675DFF"}
      />
    </svg>
  )
}

/** Format a dollar amount compactly: $3,200.00 → $3.2k, $29.00 → $29 */
function formatCompactAmount(raw: string): string {
  const cleaned = raw.replace(/[$,]/g, "")
  const num = parseFloat(cleaned)
  if (Number.isNaN(num)) return `$${raw}`
  if (num >= 1000) {
    const k = num / 1000
    const formatted = k % 1 === 0 ? `${k}k` : `${k.toFixed(1)}k`
    return `$${formatted}`
  }
  if (num === Math.floor(num)) return `$${num}`
  return `$${raw}`
}

const COMPONENT_ROW_CLASS =
  "flex w-full cursor-pointer items-center justify-between rounded-[6px] px-[16px] py-[4px] text-[12px] font-[400] leading-[16px] text-[#1A2C44] hover:bg-[#F5F6F8] transition-colors"

type MainOption = {
  label: string
  subtitle: string
  kind: "rate-card" | "rate" | "subscription-fee" | "credit-grant" | "product-with-price" | "price-group"
}

const MAIN_OPTIONS: MainOption[] = [
  { label: "Product", subtitle: "With pricing", kind: "product-with-price" },
  { label: "Price group", subtitle: "Group of products", kind: "price-group" },
  { label: "Credit grant", subtitle: "Included usage", kind: "credit-grant" },
]

function glyphKindForComponent(kind: ComponentKind): "rateCard" | "subscriptionFee" | "creditGrant" {
  return kind
}

export function AddPlanObjectPopover({
  isOpen,
  position,
  popoverRef,
  t,
  onAddObject,
  hasComponents,
  existingComponents,
  onUseExistingComponent,
  rateCardCount = 0,
  onHoverKind,
  catalogItems = [],
  onSelectCatalogItem,
}: AddPlanObjectPopoverProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const deferredQuery = useDeferredValue(searchQuery)
  const lowerQuery = deferredQuery.toLowerCase()

  const filteredMainOptions = useMemo(
    () =>
      lowerQuery
        ? MAIN_OPTIONS.filter((opt) => opt.label.toLowerCase().includes(lowerQuery) || opt.subtitle.toLowerCase().includes(lowerQuery))
        : MAIN_OPTIONS,
    [lowerQuery],
  )


  const filteredComponents = useMemo(
    () =>
      existingComponents
        ? lowerQuery
          ? existingComponents.filter((c) => c.name.toLowerCase().includes(lowerQuery))
          : existingComponents
        : [],
    [existingComponents, lowerQuery],
  )

  const filteredCatalogItems = useMemo(
    () =>
      catalogItems.length > 0
        ? lowerQuery
          ? catalogItems.filter((item) => item.name.toLowerCase().includes(lowerQuery))
          : catalogItems
        : [],
    [catalogItems, lowerQuery],
  )

  const showExisting = hasComponents && filteredComponents.length > 0
  const showCatalog = filteredCatalogItems.length > 0
  const rateCardAtMax = rateCardCount >= MAX_RATE_CARDS

  // Reset search when popover closes
  if (!isOpen) {
    if (searchQuery) setSearchQuery("")
    return null
  }
  if (!position) return null

  return (
    <div
      ref={popoverRef}
      data-onboarding="add-popover"
      className="fixed z-50 w-[264px] rounded-[8px] border border-[#D4DEE9] bg-white shadow-[0px_15px_35px_0px_rgba(48,49,61,0.08),0px_5px_15px_0px_rgba(0,0,0,0.12)]"
      style={{ top: position.top, left: position.left, transform: position.above ? "translateY(-100%)" : position.centerY ? "translateY(-50%)" : undefined }}
      onMouseLeave={() => onHoverKind?.(null)}
    >
      <div className="flex flex-col pt-[4px]">
        {/* Search input */}
        <div className="px-[12px] pt-[4px] pb-[4px]">
          <div className="flex items-center gap-[4px] rounded-[6px] border border-[#ECF1F6] bg-white px-[16px] py-[8px]">
            <SearchIcon className="h-[12px] w-[12px] shrink-0 text-[#667691]" />
            <input
              type="text"
              className="w-full bg-transparent text-[12px] font-[500] leading-[16px] text-[#1A2C44] placeholder:text-[#667691] outline-none"
              placeholder={t("Search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* Scrollable options area */}
        <div className="max-h-[300px] overflow-y-auto">
          {/* Content items — add rates, fees, credits */}
          {filteredMainOptions.length > 0 && (
            <div className="flex flex-col gap-[2px] px-[12px] py-[6px]">
              {filteredMainOptions.map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  className="flex w-full cursor-pointer items-center justify-between rounded-[6px] px-[16px] py-[4px] transition-colors hover:bg-[#F5F6F8]"
                  onClick={() => onAddObject(opt.kind)}
                  onMouseEnter={() => onHoverKind?.(opt.kind)}
                  onMouseLeave={() => onHoverKind?.(null)}
                >
                  <div className="flex items-center gap-[6px]">
                    <AddIcon />
                    <span className="text-[12px] font-[500] leading-[16px] text-[#533AFD]">{t(opt.label)}</span>
                  </div>
                  <span className="text-[12px] font-[400] leading-[16px] text-[#50617A]">{t(opt.subtitle)}</span>
                </button>
              ))}

            </div>
          )}


          {/* Existing components */}
          {showExisting && (
            <div className="flex flex-col gap-[2px] border-t border-[#ECF1F6] px-[12px] py-[6px]">
              {filteredComponents.map((comp) => (
                <button
                  key={comp.componentId}
                  type="button"
                  className={COMPONENT_ROW_CLASS}
                  onClick={() => onUseExistingComponent?.(comp.componentId, comp.kind)}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-[4px]">
                    <CatalogObjectGlyph kind={glyphKindForComponent(comp.kind)} />
                    <span className="truncate">{comp.name}</span>
                  </div>
                  <span className="ml-[8px] shrink-0 text-[12px] text-[#667691]">
                    {comp.summary.startsWith("$") ? formatCompactAmount(comp.summary.slice(1)) : comp.summary}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Catalog items (products & price groups) */}
          {showCatalog && (
            <div className="flex flex-col gap-[2px] border-t border-[#ECF1F6] px-[12px] py-[6px]">
              {filteredCatalogItems.map((item) => {
                const isFlat = item.productType === "Flat"
                const isPriceGroup = item.kind === "priceGroup"
                const iconKind = isPriceGroup ? "rateCard" : isFlat ? "subscriptionFee" : "product"
                const priceCount = item.prices?.length ?? 0

                return (
                  <div key={`${item.kind}-${item.id}`} className="flex flex-col">
                    {isPriceGroup ? (
                      <button
                        type="button"
                        className="flex w-full items-center justify-between rounded-[6px] px-[16px] py-[4px] hover:bg-[#F5F6F8] transition-colors"
                        onClick={() => onSelectCatalogItem?.(item)}
                      >
                        <div className="flex items-center gap-[6px] min-w-0">
                          <CatalogObjectGlyph kind={iconKind} />
                          <span className="text-[12px] font-[500] leading-[16px] text-[#1A2C44] truncate">{item.name}</span>
                        </div>
                        {priceCount > 0 && (
                          <span className="shrink-0 ml-[8px] text-[11px] font-[400] leading-[16px] text-[#667691]">
                            {priceCount} price{priceCount !== 1 ? "s" : ""}
                          </span>
                        )}
                      </button>
                    ) : (
                      <>
                        {/* Product header — not clickable */}
                        <div className="flex w-full items-center justify-between rounded-[6px] px-[16px] py-[4px]">
                          <div className="flex items-center gap-[6px] min-w-0">
                            <CatalogObjectGlyph kind={iconKind} />
                            <span className="text-[12px] font-[500] leading-[16px] text-[#1A2C44] truncate">{item.name}</span>
                          </div>
                        </div>
                        {/* Nested prices — clickable */}
                        {item.prices && item.prices.length > 0 && item.prices.map((sp, i) => (
                          <button
                            key={`${item.id}-sp-${i}`}
                            type="button"
                            className="flex w-full items-center justify-between rounded-[6px] pl-[36px] pr-[16px] py-[4px] text-left hover:bg-[#F5F6F8] transition-colors"
                            onClick={() => onSelectCatalogItem?.({ ...item, detail: "", prices: [sp] })}
                          >
                            <div className="flex items-center gap-[6px] min-w-0">
                              <CatalogObjectGlyph kind="price" />
                              <span className="text-[12px] font-[400] leading-[16px] text-[#1A2C44] truncate">
                                {sp.name || [sp.cadence, sp.price ? `$${sp.price}` : ""].filter(Boolean).join(", ") || "Price"}
                              </span>
                            </div>
                            <span className="shrink-0 ml-[8px] text-[12px] font-[400] leading-[16px] text-[#667691]">
                              {sp.price ? `$${sp.price}` : ""}
                            </span>
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <div className="h-[4px]" />
        </div>
      </div>
    </div>
  )
}
