'use client'

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Selector } from "@/components/Selector"
import { AddSmallIcon, TrashIcon } from "@/components/ProductCatalogIcons"
import { CurrencyTabs } from "@/components/CurrencyTabs"
import { CurrencyFlag } from "@/components/CurrencyFlag"

const tieredCellBaseClasses =
  "flex h-[32px] w-full items-center px-[12px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44]"
const tieredMoneyCellClasses =
  "flex h-[32px] w-full min-w-0 items-center gap-[4px] bg-white px-[12px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] focus-within:shadow-[0_0_0_1.5px_#A0D0F7] focus-within:relative focus-within:z-10"

// Tooltip component for warning messages - only shows when message is provided
function WarningTooltip({ message, children }: { message: string | null; children: React.ReactNode }) {
  const [show, setShow] = useState(false)
  return (
    <div
      className="relative"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && message && (
        <div
          className="absolute z-[100] bottom-full left-1/2 -translate-x-1/2 mb-1 rounded-[4px] bg-[#474E5A] px-[8px] py-[4px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-white shadow-[0_2px_5px_rgba(64,68,82,0.08),0_3px_9px_rgba(64,68,82,0.08)] whitespace-nowrap"
        >
          {message}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#474E5A]" />
        </div>
      )}
    </div>
  )
}

// "To" cell input. Holds an in-progress draft while focused so the parent's
// re-formatted value can't yank characters back as the user types/deletes.
function TierToInput({
  value,
  ariaLabel,
  className,
  formatNumericInput,
  onCommit,
}: {
  value: string
  ariaLabel: string
  className: string
  formatNumericInput: (value: string, allowDecimal: boolean) => string
  onCommit: (next: string) => void
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const displayed = draft ?? value
  return (
    <input
      type="text"
      inputMode="numeric"
      value={displayed}
      aria-label={ariaLabel}
      className={className}
      onChange={(event) => {
        // While typing, only strip non-digit characters — don't reformat (which
        // would fight the user's caret as they edit). We commit a formatted
        // value on blur.
        const cleaned = event.currentTarget.value.replace(/[^0-9]/g, "")
        setDraft(cleaned)
      }}
      onFocus={(event) => {
        // Seed draft with the raw digits of the current value so editing starts
        // from what the user sees.
        setDraft(event.currentTarget.value.replace(/[^0-9]/g, ""))
      }}
      onBlur={() => {
        const next = draft != null ? formatNumericInput(draft, false) : value
        setDraft(null)
        if (next !== value) onCommit(next)
      }}
    />
  )
}

const includeTaxOptions = ["Taxes included", "Taxes excluded", "Auto"]

type TieredPricingEditorProps = {
  tiers: number[]
  tieredBy: string
  includeTax: string
  setIncludeTax: (value: string) => void
  showCurrencyControls?: boolean
  activeTierId?: number | null
  dimInactiveTiers?: boolean
  tierToValues: Record<number, string>
  onChangeTierTo: (id: number, value: string) => void
  tierUnitPrices: Record<number, string>
  onChangeTierUnitPrice: (id: number, value: string) => void
  tierFlatFees: Record<number, string>
  onChangeTierFlatFee: (id: number, value: string) => void
  pricingCurrencies: { id: number; code: string }[]
  activeCurrencyId: number
  setActiveCurrencyId: (id: number) => void
  currencyDisplayNames: Intl.DisplayNames | null
  currencyOptions: string[]
  onAddCurrency: (code: string) => void
  onAddTier: () => void
  onRemoveTier: (id: number) => void
  onDeleteCurrency: (id: number) => void
  highlightedId: string | null
  assistantHighlightedKeys?: string[]
  newFieldEffect: "highlight" | "blur"
}

export function TieredPricingEditor({
  tiers,
  includeTax,
  setIncludeTax,
  showCurrencyControls = true,
  activeTierId = null,
  dimInactiveTiers = false,
  tierToValues,
  onChangeTierTo,
  tierUnitPrices,
  onChangeTierUnitPrice,
  tierFlatFees,
  onChangeTierFlatFee,
  pricingCurrencies,
  activeCurrencyId,
  setActiveCurrencyId,
  currencyDisplayNames,
  currencyOptions,
  onAddCurrency,
  onAddTier,
  onRemoveTier,
  onDeleteCurrency,
  highlightedId,
  assistantHighlightedKeys = [],
  newFieldEffect,
}: TieredPricingEditorProps) {
  const { t } = useTranslation()
  const unitFormatter = new Intl.NumberFormat("en-US")
  const selectedCurrencyCodes = pricingCurrencies.map((c) => c.code).filter(Boolean)
  const rowSelectorButtonClasses =
    "h-[32px] px-[12px] py-[8px] text-[12px] leading-[16px] tracking-[-0.024px]"

  const formatNumericInput = (value: string, allowDecimal: boolean) => {
    const cleaned = value.replace(/[^0-9.]/g, "")
    if (cleaned === "") return ""
    if (!allowDecimal) {
      const digits = cleaned.replace(/\./g, "").replace(/^0+(?=\d)/, "")
      return digits === "" ? "" : unitFormatter.format(Number(digits))
    }
    if (cleaned.startsWith(".")) {
      return `0.${cleaned.slice(1).replace(/\./g, "")}`
    }
    const [wholeRaw, ...rest] = cleaned.split(".")
    let whole = wholeRaw.replace(/\./g, "").replace(/^0+(?=\d)/, "")
    const decimal = rest.join("").replace(/\./g, "")
    if (whole === "" && decimal) {
      whole = "0"
    }
    const formattedWhole = whole === "" ? "" : unitFormatter.format(Number(whole))
    // Preserve trailing decimal point when user is typing (e.g., "2." should stay as "2.")
    const hasTrailingDecimal = cleaned.includes(".") && rest.length > 0
    if (hasTrailingDecimal) {
      return `${formattedWhole}.${decimal}`
    }
    return formattedWhole
  }

  const parseNumericValue = (value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, "")
    if (!cleaned) return null
    const parsed = Number(cleaned)
    return Number.isFinite(parsed) ? parsed : null
  }

  const getFromToForIndex = (index: number, isLast: boolean) => {
    // Purely UI placeholder logic (tiers are not persisted yet).
    const STEP = 1000
    const from = index === 0 ? 0 : index * STEP + 1
    const to = isLast ? null : (index + 1) * STEP
    return {
      fromLabel: unitFormatter.format(from),
      toLabel: to == null ? "∞" : unitFormatter.format(to),
    }
  }

  const pricingHighlightClasses =
    highlightedId === "pricing"
      ? newFieldEffect === "blur"
        ? "highlight-blur highlight-blur-fade m-[2px]"
        : "highlight-ring highlight-ring-fade m-[2px]"
      : ""

  // Check if all tiers should be highlighted (generic rate.tier key for adding new tiers)
  const allTiersHighlighted = assistantHighlightedKeys.includes("rate.tier")
  // Check if a specific tier row is highlighted (for "From" column which doesn't have a specific action)
  const isTierHighlighted = (tierId: number) =>
    allTiersHighlighted ||
    assistantHighlightedKeys.some((k) =>
      k.startsWith(`rate.tier.${tierId}.`) || k === `rate.tier.${tierId}`
    )
  // Field-specific highlight checks - ONLY match the specific field key
  // allTiersHighlighted (from generic "rate.tier") only affects the From column via isTierHighlighted
  const isTierToHighlighted = (tierId: number) =>
    assistantHighlightedKeys.includes(`rate.tier.${tierId}.to`)
  const isTierUnitPriceHighlighted = (tierId: number) =>
    assistantHighlightedKeys.includes(`rate.tier.${tierId}.unitPrice`)
  const isTierFlatFeeHighlighted = (tierId: number) =>
    assistantHighlightedKeys.includes(`rate.tier.${tierId}.flatFee`)

  return (
    <div
      className={`rounded-[6px] bg-white ${pricingHighlightClasses}`}
    >
      {showCurrencyControls && (
        <div className="flex items-center justify-between border-b border-[#EBEEF1] px-4 py-4">
          <div className="flex items-center gap-3">
            <CurrencyTabs
              currencies={pricingCurrencies.filter((c) => c.code)}
              activeCurrencyId={activeCurrencyId}
              onSelectCurrency={setActiveCurrencyId}
              onDeleteCurrency={onDeleteCurrency}
              currencyDisplayNames={currencyDisplayNames}
              maxVisibleTabs={3}
              highlightedCurrencies={assistantHighlightedKeys
                .filter((k) => k.startsWith("rate.currency."))
                .map((k) => k.replace("rate.currency.", ""))}
            />
            <Selector
              ariaLabel={t("Add currency")}
              size="sm"
              value=""
              onChange={(code) => onAddCurrency(code)}
              options={currencyOptions}
              disabledOptions={selectedCurrencyCodes}
              searchable
              searchPlaceholder={t("Search currencies")}
              getSearchKey={(code) => {
                const name = currencyDisplayNames?.of(code) ?? ""
                return `${code} ${name}`
              }}
              renderOption={(code) => {
                const name = currencyDisplayNames?.of(code)
                return (
                  <div className="flex min-w-0 flex-1 items-center gap-[8px]">
                    <CurrencyFlag currency={code} className="shrink-0" />
                    <span className="w-[29px] flex-none font-[500] text-[#353A44]">{code}</span>
                    <span className="truncate font-[500] text-[#818DA0]">{name}</span>
                  </div>
                )
              }}
              triggerIcon={<AddSmallIcon className="text-[#474E5A]" />}
              collapsed
              hideChevron
              simpleDropdownPosition
              dropdownAlign="right"
              buttonClassName="h-[28px] w-[28px] justify-center border border-[#D8DEE4] bg-white px-[8px] py-[6px] hover:border-[#B6C0CD]"
            />
          </div>
        </div>
      )}

      {/* Column headers */}
      <div className="px-0 pt-2">
        <div className="grid w-full grid-cols-4 items-center text-[12px] font-[400] leading-[16px] text-[#353A44] pb-2">
          <div className="px-[12px] whitespace-nowrap">{t("From")}</div>
          <div className="px-[12px] whitespace-nowrap">{t("To")}</div>
          <div className="px-[12px] whitespace-nowrap">{t("Unit price")}</div>
          <div className="px-[12px] whitespace-nowrap">{t("Flat fee")}</div>
        </div>
      </div>

      {/* Tier rows */}
      <div className="flex flex-col px-0 pb-0">
        <div className="border-t border-[#EBEEF1] border-b border-[#EBEEF1] bg-white">
          {tiers.map((id, index) => {
            const isLast = index === tiers.length - 1
            const { toLabel } = getFromToForIndex(index, isLast)
            const tierHighlighted = isTierHighlighted(id)
            const toHighlighted = isTierToHighlighted(id)
            const unitPriceHighlighted = isTierUnitPriceHighlighted(id)
            const flatFeeHighlighted = isTierFlatFeeHighlighted(id)
            // Text-only highlight style (like Selector component)
            const textHighlightClass = tierHighlighted ? "rounded-[3px] bg-[#E0D9FB] px-0.5" : ""
            const fromClasses = `${tieredCellBaseClasses} bg-[#F5F6F8]`
            const toClasses = `${tieredCellBaseClasses} ${isLast ? "bg-[#F5F6F8]" : "bg-white"}`
            const getNonEmptyToOrFallback = (tierId: number, fallback: string) => {
              const raw = tierToValues[tierId]
              return raw != null && raw.trim() !== "" ? raw : fallback
            }
            // Check if value exists (even if empty) - allows user to clear the field
            const hasCustomTo = tierToValues[id] != null
            const currentToValue = hasCustomTo ? tierToValues[id] : toLabel
            const previousTierId = index > 0 ? tiers[index - 1] : null
            const previousToFallback = index * 1000
            const previousToRaw =
              previousTierId != null
                ? getNonEmptyToOrFallback(previousTierId, unitFormatter.format(previousToFallback))
                : "0"
            const previousToParsed = parseNumericValue(previousToRaw) ?? previousToFallback
            const fromValue = index === 0 ? 0 : previousToParsed + 1
            const fromLabel = unitFormatter.format(fromValue)
            const minToValue = index === 0 ? 0 : fromValue
            const currentUnitPrice = tierUnitPrices[id] ?? ""
            const currentFlatFee = tierFlatFees[id] ?? ""
            const canDelete = index > 0
            const flatFeePaddingClass = "pr-0"
            const isDimmed = dimInactiveTiers && activeTierId != null && id !== activeTierId
            // Detect if "to" value is invalid (less than minimum) — surfaced as
            // a tooltip on hover, not a disruptive background flash.
            const currentToParsed = parseNumericValue(currentToValue)
            const isToValueInvalid = !isLast && currentToParsed != null && currentToParsed < minToValue
            return (
              <div key={id} className={`group relative ${isDimmed ? "opacity-50" : ""}`}>
                <div className={`grid w-full grid-cols-4 items-center ${index < tiers.length - 1 ? "border-b border-[#EBEEF1]" : ""}`}>
                  <div>
                    <div className={fromClasses}>
                      <span className={textHighlightClass}>{fromLabel}</span>
                    </div>
                  </div>
                  <div className="border-l border-[#EBEEF1]">
                    {isLast ? (
                      <div className={toClasses}>
                        <span className={toHighlighted ? "rounded-[3px] bg-[#E0D9FB] px-0.5" : ""}>{toLabel}</span>
                      </div>
                    ) : (
                      <WarningTooltip message={isToValueInvalid ? `Value must be at least ${unitFormatter.format(minToValue)}` : null}>
                        <div className={`${tieredCellBaseClasses} bg-white`}>
                          {toHighlighted && currentToValue ? (
                            <span className="rounded-[3px] bg-[#E0D9FB] px-0.5">{currentToValue}</span>
                          ) : (
                            <TierToInput
                              value={currentToValue}
                              ariaLabel={t("To")}
                              className="w-full bg-transparent text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] outline-none"
                              formatNumericInput={formatNumericInput}
                              onCommit={(next) => onChangeTierTo(id, next)}
                            />
                          )}
                        </div>
                      </WarningTooltip>
                    )}
                  </div>
                  <div className="border-l border-[#EBEEF1]">
                    <div className={tieredMoneyCellClasses}>
                      {unitPriceHighlighted ? (
                        <span className="rounded-[3px] bg-[#E0D9FB] px-0.5">$ {currentUnitPrice || "0.00"}</span>
                      ) : (
                        <>
                          <span className="text-[#6C7688]">$</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="0.00"
                            aria-label={t("Unit price")}
                            className="min-w-0 flex-1 bg-transparent text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] placeholder:text-[#818DA0] outline-none"
                            value={currentUnitPrice}
                            onChange={(event) => {
                              const next = formatNumericInput(event.currentTarget.value, true)
                              onChangeTierUnitPrice(id, next)
                            }}
                          />
                        </>
                      )}
                    </div>
                  </div>
                  <div className="border-l border-[#EBEEF1]">
                    <div className={`${tieredMoneyCellClasses} ${flatFeePaddingClass}`}>
                      {flatFeeHighlighted ? (
                        <span className="rounded-[3px] bg-[#E0D9FB] px-0.5">$ {currentFlatFee || "0.00"}</span>
                      ) : (
                        <>
                          <span className="text-[#6C7688]">$</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="0.00"
                            aria-label={t("Flat fee")}
                            className="min-w-0 flex-1 bg-transparent text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] placeholder:text-[#818DA0] outline-none"
                            value={currentFlatFee}
                            onChange={(event) => {
                              const next = formatNumericInput(event.currentTarget.value, true)
                              onChangeTierFlatFee(id, next)
                            }}
                          />
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {canDelete && (
                  <button
                    type="button"
                    className="absolute left-full top-1/2 ml-[4px] flex h-[32px] w-[32px] -translate-y-1/2 items-center justify-center rounded-[6px] bg-transparent text-[#474E5A] opacity-0 transition-opacity duration-150 group-hover:opacity-100 hover:bg-[#F5F6F8]"
                    aria-label={t("Remove tier")}
                    onClick={() => onRemoveTier(id)}
                  >
                    <TrashIcon />
                  </button>
                )}
              </div>
            )
          })}
          <button
            type="button"
            className="flex h-[32px] w-full items-center gap-[8px] border-t border-[#EBEEF1] bg-white px-[12px] text-[12px] font-[500] leading-[16px] text-[#533AFD]"
            onClick={onAddTier}
          >
            <AddSmallIcon />
            {t("Add tier")}
          </button>
        </div>
      </div>

      {/* Include tax in price row */}
      <div className="flex items-center justify-between px-4 py-3 rounded-bl-[6px] rounded-br-[6px]">
        <span className="text-[12px] font-[400] leading-[16px] text-[#353A44]">{t("Taxes")}</span>
        <Selector
          ariaLabel={t("Tax behaviour")}
          size="sm"
          value={includeTax}
          onChange={setIncludeTax}
          options={includeTaxOptions}
          getDisplayValue={t}
          buttonClassName={`${rowSelectorButtonClasses} w-[160px] justify-between${
            assistantHighlightedKeys.includes("includeTax") ? " highlight-ring highlight-ring-fade" : ""
          }`}
        />
      </div>
    </div>
  )
}

