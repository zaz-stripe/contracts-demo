"use client"

import { FormRow } from "@/components/FormRow"
import { Selector } from "@/components/Selector"
import { TieredPricingEditor } from "@/components/TieredPricingEditor"
import { CurrencyFlag } from "@/components/CurrencyFlag"
import {
  moneyInputClasses,
  rowSelectorButtonClasses,
  packageQuantityInputClasses,
  packageUnitsInputClasses,
  assistantHighlightClass,
  includeTaxOptions,
} from "./priceFormConstants"
import { t } from "./priceFormUtils"

type PricingSectionProps = {
  // Pricing layout
  isTieredLayout: boolean
  isPackageLayout: boolean
  isSingleCurrency: boolean

  // Tier props
  tiers: number[]
  tieredBy: string
  tierToValues: Record<number, string>
  onChangeTierTo: (id: number, value: string) => void
  tierUnitPrices: Record<number, string>
  onChangeTierUnitPrice: (id: number, value: string) => void
  tierFlatFees: Record<number, string>
  onChangeTierFlatFee: (id: number, value: string) => void
  onAddTier: () => void
  onRemoveTier: (id: number) => void

  // Tax
  includeTax: string
  setIncludeTax: (value: string) => void

  // Currencies
  pricingCurrencies: { id: number; code: string }[]
  activeCurrencyId: number
  setActiveCurrencyId: (id: number) => void
  currencyAmounts: Record<number, string>
  setCurrencyAmounts: (amounts: Record<number, string>) => void
  currencyOptions: string[]
  currencyDisplayNames: Intl.DisplayNames | null
  onAddCurrency: (code?: string) => void
  onDeleteCurrency: (id: number) => void
  onCurrencyChange: (id: number, code: string) => void

  // UI state
  highlightedId: string | null
  assistantHighlightedKeys: string[]
  newFieldEffect: "highlight" | "blur"
  isDrawerSurface: boolean
}

export function PricingSection({
  isTieredLayout,
  isPackageLayout,
  isSingleCurrency,
  tiers,
  tieredBy,
  tierToValues,
  onChangeTierTo,
  tierUnitPrices,
  onChangeTierUnitPrice,
  tierFlatFees,
  onChangeTierFlatFee,
  onAddTier,
  onRemoveTier,
  includeTax,
  setIncludeTax,
  pricingCurrencies,
  activeCurrencyId,
  setActiveCurrencyId,
  currencyAmounts,
  setCurrencyAmounts,
  currencyOptions,
  currencyDisplayNames,
  onAddCurrency,
  onDeleteCurrency,
  onCurrencyChange,
  highlightedId,
  assistantHighlightedKeys,
  newFieldEffect,
  isDrawerSurface,
}: PricingSectionProps) {
  if (isTieredLayout) {
    return (
      <TieredPricingEditor
        tiers={tiers}
        tieredBy={tieredBy}
        includeTax={includeTax}
        setIncludeTax={setIncludeTax}
        tierToValues={tierToValues}
        onChangeTierTo={onChangeTierTo}
        tierUnitPrices={tierUnitPrices}
        onChangeTierUnitPrice={onChangeTierUnitPrice}
        tierFlatFees={tierFlatFees}
        onChangeTierFlatFee={onChangeTierFlatFee}
        pricingCurrencies={pricingCurrencies}
        activeCurrencyId={activeCurrencyId}
        setActiveCurrencyId={setActiveCurrencyId}
        currencyDisplayNames={currencyDisplayNames}
        currencyOptions={currencyOptions}
        onAddCurrency={(code) => onAddCurrency(code)}
        onAddTier={onAddTier}
        onRemoveTier={onRemoveTier}
        onDeleteCurrency={onDeleteCurrency}
        highlightedId={highlightedId}
        assistantHighlightedKeys={assistantHighlightedKeys}
        newFieldEffect={newFieldEffect}
      />
    )
  }

  return (
    <div
      className={`bg-white ${
        highlightedId === "pricing"
          ? newFieldEffect === "blur"
            ? "highlight-blur highlight-blur-fade m-[2px] rounded-[6px]"
            : "highlight-ring highlight-ring-fade m-[2px] rounded-[6px]"
          : ""
      }`}
    >
      {isSingleCurrency && !isPackageLayout ? (
        <SingleCurrencyPricing
          pricingCurrencies={pricingCurrencies}
          currencyAmounts={currencyAmounts}
          setCurrencyAmounts={setCurrencyAmounts}
          currencyOptions={currencyOptions}
          currencyDisplayNames={currencyDisplayNames}
          onCurrencyChange={onCurrencyChange}
          includeTax={includeTax}
          setIncludeTax={setIncludeTax}
          assistantHighlightedKeys={assistantHighlightedKeys}
          isDrawerSurface={isDrawerSurface}
        />
      ) : (
        <MultiCurrencyPricing
          pricingCurrencies={pricingCurrencies}
          currencyAmounts={currencyAmounts}
          setCurrencyAmounts={setCurrencyAmounts}
          currencyOptions={currencyOptions}
          currencyDisplayNames={currencyDisplayNames}
          onCurrencyChange={onCurrencyChange}
          includeTax={includeTax}
          setIncludeTax={setIncludeTax}
          assistantHighlightedKeys={assistantHighlightedKeys}
          newFieldEffect={newFieldEffect}
          isDrawerSurface={isDrawerSurface}
          isPackageLayout={isPackageLayout}
        />
      )}
    </div>
  )
}

// Single currency flat pricing
type SingleCurrencyPricingProps = {
  pricingCurrencies: { id: number; code: string }[]
  currencyAmounts: Record<number, string>
  setCurrencyAmounts: (amounts: Record<number, string>) => void
  currencyOptions: string[]
  currencyDisplayNames: Intl.DisplayNames | null
  onCurrencyChange: (id: number, code: string) => void
  includeTax: string
  setIncludeTax: (value: string) => void
  assistantHighlightedKeys: string[]
  isDrawerSurface: boolean
}

function SingleCurrencyPricing({
  pricingCurrencies,
  currencyAmounts,
  setCurrencyAmounts,
  currencyOptions,
  currencyDisplayNames,
  onCurrencyChange,
  includeTax,
  setIncludeTax,
  assistantHighlightedKeys,
  isDrawerSurface,
}: SingleCurrencyPricingProps) {
  return (
    <div className="flex flex-col gap-[16px]">
      <FormRow label={t("Include taxes")}>
        <Selector
          ariaLabel={t("Include taxes")}
          size="sm"
          value={includeTax}
          onChange={setIncludeTax}
          options={includeTaxOptions}
          getDisplayValue={t}
          buttonClassName={`${rowSelectorButtonClasses}${
            assistantHighlightedKeys.includes("includeTax") ? ` ${assistantHighlightClass}` : ""
          }`}
        />
      </FormRow>

      <FormRow label={t("Price")} rightWidthPx={160}>
        <div className="flex w-[160px] items-stretch">
          <div className="flex h-[32px] min-w-0 flex-1 items-center gap-[6px] rounded-bl-[6px] rounded-tl-[6px] border border-[#D8DEE4] bg-white px-[8px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44]">
            <span className="text-[#6C7688]">$</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              aria-label={t("Amount")}
              className="min-w-0 flex-1 bg-transparent text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] placeholder:text-[#818DA0] outline-none"
              value={currencyAmounts[pricingCurrencies[0]!.id] ?? ""}
              onChange={(event) => {
                const next = event.target.value
                setCurrencyAmounts({ ...currencyAmounts, [pricingCurrencies[0]!.id]: next })
              }}
            />
          </div>
          <Selector
            ariaLabel={t("Select currency")}
            size="sm"
            value={pricingCurrencies[0]!.code}
            onChange={(code) => onCurrencyChange(pricingCurrencies[0]!.id, code)}
            options={currencyOptions}
            searchable
            searchPlaceholder={t("Search currencies")}
            placeholder={t("Select currency")}
            triggerIcon={<CurrencyFlag currency={pricingCurrencies[0]!.code} />}
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
            buttonClassName={`${rowSelectorButtonClasses} w-[82px] rounded-l-none border-l-0`}
            constrainToViewportRight={isDrawerSurface}
          />
        </div>
      </FormRow>
    </div>
  )
}

// Multi currency / package pricing
type MultiCurrencyPricingProps = {
  pricingCurrencies: { id: number; code: string }[]
  currencyAmounts: Record<number, string>
  setCurrencyAmounts: (amounts: Record<number, string>) => void
  currencyOptions: string[]
  currencyDisplayNames: Intl.DisplayNames | null
  onCurrencyChange: (id: number, code: string) => void
  includeTax: string
  setIncludeTax: (value: string) => void
  assistantHighlightedKeys: string[]
  newFieldEffect: "highlight" | "blur"
  isDrawerSurface: boolean
  isPackageLayout: boolean
}

function MultiCurrencyPricing({
  pricingCurrencies,
  currencyAmounts,
  setCurrencyAmounts,
  currencyOptions,
  currencyDisplayNames,
  onCurrencyChange,
  includeTax,
  setIncludeTax,
  assistantHighlightedKeys,
  newFieldEffect,
  isDrawerSurface,
  isPackageLayout,
}: MultiCurrencyPricingProps) {
  return (
    <>
      {pricingCurrencies.map((currency) => {
        const otherSelectedCodes = pricingCurrencies
          .filter((c) => c.id !== currency.id && c.code)
          .map((c) => c.code)
        const needsSelection = !currency.code
        const currencyCodeKey = (currency.code || "").trim().toUpperCase()
        const highlightCurrency = currencyCodeKey
          ? assistantHighlightedKeys.includes(`pricing.currency.${currencyCodeKey}`)
          : false
        const highlightAmount = currencyCodeKey
          ? assistantHighlightedKeys.includes(`pricing.amount.${currencyCodeKey}`)
          : false

        return (
          <div
            key={currency.id}
            className={isPackageLayout ? "flex flex-col gap-3 px-4 py-4" : "flex items-center justify-between gap-3 px-4 py-4"}
          >
            {/* Package: Row 1 = currency + price */}
            {isPackageLayout ? (
              <div className="flex w-full items-center justify-end gap-2">
                <div className={`${moneyInputClasses}${highlightAmount ? ` ${assistantHighlightClass}` : ""} shrink-0`}>
                  <span>$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    aria-label={t("Amount")}
                    className="w-[96px] bg-transparent text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] placeholder:text-[#818DA0] outline-none"
                    value={currencyAmounts[currency.id] ?? ""}
                    onChange={(event) => {
                      const next = event.target.value
                      setCurrencyAmounts({ ...currencyAmounts, [currency.id]: next })
                    }}
                  />
                </div>
                <Selector
                  ariaLabel={t("Select currency")}
                  size="sm"
                  value={currency.code}
                  onChange={(code) => onCurrencyChange(currency.id, code)}
                  options={currencyOptions}
                  searchable
                  searchPlaceholder={t("Search currencies")}
                  placeholder={t("Select currency")}
                  triggerIcon={currency.code ? <CurrencyFlag currency={currency.code} /> : undefined}
                  disabledOptions={otherSelectedCodes}
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
                  buttonClassName={`${rowSelectorButtonClasses}${needsSelection && newFieldEffect === "highlight" ? " border-[#533AFD]" : ""}${needsSelection && newFieldEffect === "blur" ? " blur-[2px]" : ""}${
                    highlightCurrency ? ` ${assistantHighlightClass}` : ""
                  } w-[96px] justify-between`}
                  constrainToViewportRight={isDrawerSurface}
                />
              </div>
            ) : (
              <>
                <div className="shrink-0">
                  <Selector
                    ariaLabel={t("Select currency")}
                    size="sm"
                    value={currency.code}
                    onChange={(code) => onCurrencyChange(currency.id, code)}
                    options={currencyOptions}
                    searchable
                    searchPlaceholder={t("Search currencies")}
                    placeholder={t("Select currency")}
                    triggerIcon={currency.code ? <CurrencyFlag currency={currency.code} /> : undefined}
                    disabledOptions={otherSelectedCodes}
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
                    buttonClassName={`${rowSelectorButtonClasses}${needsSelection && newFieldEffect === "highlight" ? " border-[#533AFD]" : ""}${needsSelection && newFieldEffect === "blur" ? " blur-[2px]" : ""}${
                      highlightCurrency ? ` ${assistantHighlightClass}` : ""
                    } w-[84px] justify-between`}
                    constrainToViewportRight={isDrawerSurface}
                  />
                </div>

                <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <div className={`${moneyInputClasses}${highlightAmount ? ` ${assistantHighlightClass}` : ""} shrink-0`}>
                      <span>$</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0.00"
                        aria-label={t("Amount")}
                        className="w-[96px] bg-transparent text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] placeholder:text-[#818DA0] outline-none"
                        value={currencyAmounts[currency.id] ?? ""}
                        onChange={(event) => {
                          const next = event.target.value
                          setCurrencyAmounts({ ...currencyAmounts, [currency.id]: next })
                        }}
                      />
                    </div>
                    <Selector
                      ariaLabel={t("Tax behaviour")}
                      size="sm"
                      value={includeTax}
                      onChange={setIncludeTax}
                      options={includeTaxOptions}
                      getDisplayValue={t}
                      buttonClassName={`${rowSelectorButtonClasses} shrink-0 w-[140px] justify-between${
                        assistantHighlightedKeys.includes("includeTax") ? ` ${assistantHighlightClass}` : ""
                      }`}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Package: Row 2 = taxes + per units */}
            {isPackageLayout && (
              <div className="flex items-center justify-end gap-2">
                <Selector
                  ariaLabel={t("Tax behaviour")}
                  size="sm"
                  value={includeTax}
                  onChange={setIncludeTax}
                  options={includeTaxOptions}
                  getDisplayValue={t}
                  buttonClassName={`${rowSelectorButtonClasses} shrink-0 w-[140px] justify-between${
                    assistantHighlightedKeys.includes("includeTax") ? ` ${assistantHighlightClass}` : ""
                  }`}
                />
                <span className="shrink-0 text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#818DA0]">
                  {t("per")}
                </span>
                <div className="flex shrink-0">
                  <div className={packageQuantityInputClasses}>
                    <span>10</span>
                  </div>
                  <div className={packageUnitsInputClasses}>
                    <span className="truncate">{t("units")}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}
