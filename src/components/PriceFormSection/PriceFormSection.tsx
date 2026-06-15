"use client"

import { motion } from "framer-motion"
import { Selector } from "@/components/Selector"
import { FormRow } from "@/components/FormRow"
import type { PriceFormSectionProps } from "./priceFormTypes"
import {
  rowSelectorButtonClasses,
  priceNameInputClasses,
  assistantHighlightClass,
  chargeFrequencyOptions,
  recurringPricingOptions,
  oneOffPricingOptions,
  billingPeriodOptions,
  tieredByOptions,
  usageBasisOptions,
} from "./priceFormConstants"
import { t } from "./priceFormUtils"
import { CollapsedPriceRow } from "./CollapsedPriceRow"
import { InternalReferenceSection } from "./InternalReferenceSection"
import { PricingSection } from "./PricingSection"

export function PriceFormSection({
  collapsedPrices,
  onEditCollapsedPrice,
  onDeleteCollapsedPrice,
  showCollapsedPriceList = true,
  editingCollapsedPriceId = null,
  showTopBar = true,
  typography = "default",
  priceName,
  setPriceName,
  priceNamePlaceholder,
  chargeFrequency,
  setChargeFrequency,
  pricingModel,
  onPricingModelChange,
  billingPeriod,
  setBillingPeriod,
  includeTax,
  setIncludeTax,
  usageBasis,
  onUsageBasisChange,
  tieredBy,
  setTieredBy,
  meter,
  onMeterChange,
  onOpenMeterBuilder,
  meterOptions,
  tiers,
  onAddTier,
  onRemoveTier,
  tierToValues,
  onChangeTierTo,
  tierUnitPrices,
  onChangeTierUnitPrice,
  tierFlatFees,
  onChangeTierFlatFee,
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
  showInternalReference,
  setShowInternalReference,
  internalReferenceDisclosure = "collapsible",
  priceDescription,
  setPriceDescription,
  lookupKey,
  setLookupKey,
  showPriceForm,
  shouldAnimatePriceForm,
  onAnimationComplete,
  priceFormInstance,
  highlightedId,
  assistantHighlightedKeys = [],
  newFieldEffect,
  isDrawerSurface,
  onAddPrice,
}: PriceFormSectionProps) {
  const isLarge = typography === "large"
  const sectionTitleClasses = isLarge
    ? "text-[16px] font-semibold tracking-[-0.31px]"
    : "font-['SF_Pro_Text:Medium',sans-serif] text-[14px] leading-[16px] tracking-[-0.028px] text-[#353A44]"
  const chipTextClasses = isLarge ? "text-[14px]" : "text-[13px]"

  const pricingOptions = chargeFrequency === "Recurring" ? recurringPricingOptions : oneOffPricingOptions
  const isUsageBased = pricingModel === "Usage-based"
  const isTieredLayout =
    pricingModel === "Tiered pricing" || (pricingModel === "Usage-based" && usageBasis === "Tier")
  const isPackageLayout =
    pricingModel === "Package pricing" || (pricingModel === "Usage-based" && usageBasis === "Package")
  const isSingleCurrency = pricingCurrencies.length === 1

  const shouldRenderInlinePriceForm =
    showPriceForm && editingCollapsedPriceId != null && collapsedPrices.some((p) => p.id === editingCollapsedPriceId)

  const totalPriceCount = collapsedPrices.length + (showPriceForm && !shouldRenderInlinePriceForm ? 1 : 0)
  const priceCountLabel = totalPriceCount === 1 ? `1 ${t("price")}` : `${totalPriceCount} ${t("prices")}`

  const showPriceNameRow = typeof priceName === "string" && typeof setPriceName === "function"

  const priceForm = (
    <motion.div
      key={priceFormInstance}
      initial={shouldAnimatePriceForm ? { opacity: 0, y: -6, scale: 0.99 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      onAnimationComplete={onAnimationComplete}
      className="bg-white"
    >
      <div className="flex flex-col gap-[16px] bg-white py-4">
        {showPriceNameRow && (
          <FormRow label={t("Name")}>
            <input
              type="text"
              placeholder={priceNamePlaceholder ?? t("Price name")}
              className={`${priceNameInputClasses} ${
                assistantHighlightedKeys.includes("priceName") ? assistantHighlightClass : ""
              }`}
              aria-label={t("Price name")}
              value={priceName}
              onChange={(e) => setPriceName?.(e.target.value)}
            />
          </FormRow>
        )}

        <FormRow label={t("Charge frequency")}>
          <Selector
            ariaLabel={t("Charge frequency")}
            size="sm"
            value={chargeFrequency}
            onChange={setChargeFrequency}
            options={chargeFrequencyOptions}
            getDisplayValue={t}
            buttonClassName={`${rowSelectorButtonClasses}${
              assistantHighlightedKeys.includes("chargeFrequency") ? ` ${assistantHighlightClass}` : ""
            }`}
          />
        </FormRow>

        <FormRow
          label={t("Pricing model")}
          helperText={t("How prices scale with quantity or usage.")}
          rightWidthPx={null}
          layout="inline"
        >
          <Selector
            ariaLabel={t("Pricing model")}
            size="sm"
            value={pricingModel}
            onChange={onPricingModelChange}
            options={pricingOptions}
            getDisplayValue={t}
            buttonClassName={`${rowSelectorButtonClasses}${
              assistantHighlightedKeys.includes("pricingModel") ? ` ${assistantHighlightClass}` : ""
            }`}
          />
        </FormRow>

        {/* Tiered + usage-based options live on a dedicated row UNDER pricing model */}
        {pricingModel === "Tiered pricing" && (
          <div className="flex w-full items-center justify-end gap-2 px-4">
            <span className="shrink-0 text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#596171]">
              {t("by")}
            </span>
            <Selector
              ariaLabel={t("Tiered by")}
              size="sm"
              value={tieredBy}
              onChange={setTieredBy}
              options={tieredByOptions}
              getDisplayValue={t}
              buttonClassName={`${rowSelectorButtonClasses}${
                assistantHighlightedKeys.includes("tieredBy") ? ` ${assistantHighlightClass}` : ""
              }`}
            />
          </div>
        )}

        {pricingModel === "Usage-based" && (
          <div className="flex w-full flex-wrap items-center justify-end gap-2 px-4">
            <span className="shrink-0 text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#596171]">
              {t("per")}
            </span>
            <Selector
              ariaLabel={t("Per unit")}
              size="sm"
              value={usageBasis}
              onChange={onUsageBasisChange}
              options={usageBasisOptions}
              getDisplayValue={t}
              buttonClassName={`${rowSelectorButtonClasses}${
                assistantHighlightedKeys.includes("usageBasis") ? ` ${assistantHighlightClass}` : ""
              }`}
            />
            {usageBasis === "Tier" && (
              <>
                <span className="shrink-0 text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#596171]">
                  {t("by")}
                </span>
                <Selector
                  ariaLabel={t("Tiered by")}
                  size="sm"
                  value={tieredBy}
                  onChange={setTieredBy}
                  options={tieredByOptions}
                  getDisplayValue={t}
                  buttonClassName={`${rowSelectorButtonClasses}${
                    assistantHighlightedKeys.includes("tieredBy") ? ` ${assistantHighlightClass}` : ""
                  }`}
                />
              </>
            )}
          </div>
        )}

        {chargeFrequency !== "One-off" && (
          <FormRow label={t("Billing period")}>
            <Selector
              ariaLabel={t("Billing period")}
              size="sm"
              value={billingPeriod}
              onChange={setBillingPeriod}
              options={billingPeriodOptions}
              getDisplayValue={t}
              constrainToViewportRight={isDrawerSurface}
              buttonClassName={`${rowSelectorButtonClasses}${
                assistantHighlightedKeys.includes("billingPeriod") ? ` ${assistantHighlightClass}` : ""
              }`}
            />
          </FormRow>
        )}

        {isUsageBased && (
          <FormRow label={t("Meter")}>
            <Selector
              ariaLabel={t("Meter")}
              size="sm"
              value={meter || t("Choose a meter")}
              onChange={onMeterChange}
              options={meterOptions}
              getDisplayValue={t}
              buttonClassName={`${rowSelectorButtonClasses} ${meter ? "" : "text-[#818DA0]"}${
                assistantHighlightedKeys.includes("meter") ? ` ${assistantHighlightClass}` : ""
              }`}
              footerLabel={t("Add meter")}
              onFooterClick={onOpenMeterBuilder}
              constrainToViewportRight={isDrawerSurface}
            />
          </FormRow>
        )}
      </div>

      <div className="bg-white">
        <PricingSection
          isTieredLayout={isTieredLayout}
          isPackageLayout={isPackageLayout}
          isSingleCurrency={isSingleCurrency}
          tiers={tiers}
          tieredBy={tieredBy}
          tierToValues={tierToValues}
          onChangeTierTo={onChangeTierTo}
          tierUnitPrices={tierUnitPrices}
          onChangeTierUnitPrice={onChangeTierUnitPrice}
          tierFlatFees={tierFlatFees}
          onChangeTierFlatFee={onChangeTierFlatFee}
          onAddTier={onAddTier}
          onRemoveTier={onRemoveTier}
          includeTax={includeTax}
          setIncludeTax={setIncludeTax}
          pricingCurrencies={pricingCurrencies}
          activeCurrencyId={activeCurrencyId}
          setActiveCurrencyId={setActiveCurrencyId}
          currencyAmounts={currencyAmounts}
          setCurrencyAmounts={setCurrencyAmounts}
          currencyOptions={currencyOptions}
          currencyDisplayNames={currencyDisplayNames}
          onAddCurrency={onAddCurrency}
          onDeleteCurrency={onDeleteCurrency}
          onCurrencyChange={onCurrencyChange}
          highlightedId={highlightedId}
          assistantHighlightedKeys={assistantHighlightedKeys}
          newFieldEffect={newFieldEffect}
          isDrawerSurface={isDrawerSurface}
        />
      </div>

      <InternalReferenceSection
        showInternalReference={showInternalReference}
        setShowInternalReference={setShowInternalReference}
        internalReferenceDisclosure={internalReferenceDisclosure}
        priceDescription={priceDescription}
        setPriceDescription={setPriceDescription}
        lookupKey={lookupKey}
        setLookupKey={setLookupKey}
      />
    </motion.div>
  )

  return (
    <section className="space-y-3">
      {showTopBar && (
        <div className="flex items-center justify-between">
          <span className={sectionTitleClasses}>{priceCountLabel}</span>
          <button
            type="button"
            className="rounded-[6px] bg-[#353A44] px-3 py-2 text-[13px] font-medium leading-[15px] text-white hover:bg-[#1F2432] transition-colors"
            onClick={onAddPrice}
          >
            {t("Add price")}
          </button>
        </div>
      )}

      {showCollapsedPriceList && (collapsedPrices.length > 0 || shouldRenderInlinePriceForm) && (
        <div className="space-y-2">
          {collapsedPrices.map((price) => {
            if (shouldRenderInlinePriceForm && price.id === editingCollapsedPriceId) {
              return (
                <div key={price.id}>
                  {priceForm}
                </div>
              )
            }

            return (
              <CollapsedPriceRow
                key={price.id}
                price={price}
                onEdit={onEditCollapsedPrice}
                onDelete={onDeleteCollapsedPrice}
                chipTextClasses={chipTextClasses}
              />
            )
          })}
        </div>
      )}

      {showPriceForm && !shouldRenderInlinePriceForm && priceForm}
    </section>
  )
}
