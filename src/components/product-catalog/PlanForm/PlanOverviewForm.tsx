"use client"

import { FormRow } from "@/components/FormRow"
import { Selector } from "@/components/Selector"
import { CurrencyFlag } from "@/components/CurrencyFlag"
import { LargeChevronIcon, ChevronRightIcon } from "@/components/ProductCatalogIcons"
import { CatalogObjectGlyph } from "@/components/product-catalog/iconography"
import { useFocusedField } from "@/components/product-catalog/FocusedFieldContext"
import type { PlanFormContext, PlanRateCard, PlanNamedItem } from "./planFormTypes"
import { HighlightedInput } from "./HighlightedInput"
import { createEnterToCloseHandler, FieldError } from "./planFormUtils"
import { usePlanFormClose } from "./PlanFormCloseContext"

type PlanOverviewFormProps = {
  ctx: PlanFormContext
  isHighlighted: (key: string) => boolean
  highlightInputClass: (key: string) => string
  validationErrorClass: (key: string) => string
  validationErrorMessage: (key: string) => string | undefined
  onAddObject?: (kind: "rate-card" | "subscription-fee" | "credit-grant") => void
}

function formatAmount(value: string | undefined, currency?: string): string {
  const n = parseFloat(value ?? "")
  if (!Number.isFinite(n) || n === 0) return ""
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$"
  return `${symbol}${n.toFixed(2)}`
}

function periodLabel(period: string | undefined): string {
  const p = (period ?? "Monthly").toLowerCase()
  if (p === "annually" || p === "yearly") return "/yr"
  return "/mo"
}

// ── Object card: clickable row for a subscription fee, rate card, or credit grant ──
function ObjectCard({
  title,
  subtitle,
  glyphKind,
  detail,
  onClick,
}: {
  title: string
  subtitle?: string
  glyphKind: "rateCard" | "subscriptionFee" | "creditGrant"
  detail?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-[10px] rounded-[8px] border border-[#EBEEF1] bg-white px-[12px] py-[10px] text-left transition-colors hover:border-[#B6C0CD] hover:bg-[#FAFBFC] group"
      onClick={onClick}
    >
      <CatalogObjectGlyph kind={glyphKind} size="sm" />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-[8px]">
          <p className="truncate text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#1A2C44]">
            {title}
          </p>
          {detail && (
            <span className="shrink-0 text-[12px] font-[500] leading-[16px] text-[#667691]">
              {detail}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="truncate text-[11px] font-[400] leading-[16px] text-[#667691]">
            {subtitle}
          </p>
        )}
      </div>
      <ChevronRightIcon className="h-[10px] w-[10px] shrink-0 text-[#B6C0CD] transition-colors group-hover:text-[#667691]" />
    </button>
  )
}

// ── Rate sub-item: shown inside a rate card object card ──
function RateItem({
  name,
  detail,
  onClick,
}: {
  name: string
  detail?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-[8px] rounded-[6px] px-[8px] py-[4px] text-left transition-colors hover:bg-[#F5F6F8]"
      onClick={onClick}
    >
      <div className="w-[2px] h-[14px] shrink-0 rounded-full bg-[#C3B6FB]" />
      <p className="truncate flex-1 text-[11px] font-[500] leading-[16px] text-[#3C4F69]">{name}</p>
      {detail && (
        <span className="shrink-0 text-[11px] font-[400] leading-[16px] text-[#667691]">{detail}</span>
      )}
    </button>
  )
}

// ── Section header + description for a category ──
function CategorySection({
  t,
  title,
  description,
  children,
  onAdd,
  addLabel,
  emptyHint,
  hasItems,
}: {
  t: (key: string) => string
  title: string
  description: string
  children?: React.ReactNode
  onAdd: () => void
  addLabel: string
  /** Hint shown as a guided placeholder card when the section is empty */
  emptyHint?: string
  /** Whether the section has any items (used to show/hide guided card) */
  hasItems?: boolean
}) {
  return (
    <div className="flex flex-col gap-[8px]">
      <div className="flex flex-col gap-[2px]">
        <p className="text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#1A2C44]">{t(title)}</p>
        <p className="text-[11px] font-[400] leading-[16px] text-[#667691]">{t(description)}</p>
      </div>
      {children}
      {!hasItems && emptyHint ? (
        <button
          type="button"
          className="flex w-full flex-col items-center gap-[4px] rounded-[8px] border border-dashed border-[#C3B6FB] bg-[#FAFAFE] px-[12px] py-[12px] text-center transition-colors hover:border-[#533AFD] hover:bg-[#F7F5FD]"
          onClick={onAdd}
        >
          <span className="text-[12px] font-[500] leading-[16px] text-[#533AFD]">{t(addLabel)}</span>
          <span className="text-[11px] font-[400] leading-[16px] text-[#667691]">{t(emptyHint)}</span>
        </button>
      ) : (
        <button
          type="button"
          className="flex items-center gap-[6px] rounded-[6px] px-[2px] py-[4px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#533AFD] transition-colors hover:text-[#4229E0]"
          onClick={onAdd}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 2V10M2 6H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {t(addLabel)}
        </button>
      )}
    </div>
  )
}

export function PlanOverviewForm({
  ctx,
  isHighlighted,
  highlightInputClass,
  validationErrorClass,
  validationErrorMessage,
  onAddObject,
}: PlanOverviewFormProps) {
  const {
    t,
    textFieldInputClasses,
    currencyOptions,
    currencyDisplayNames,
    planName,
    setPlanName,
    planCurrency,
    setPlanCurrency,
    planTaxTreatment,
    setPlanTaxTreatment,
    planDescription,
    setPlanDescription,
    planLookupKey,
    setPlanLookupKey,
    planMetadataRows,
    setPlanMetadataRows,
    planMetadataValues,
    setPlanMetadataValues,
    getMetadataRows,
    addMetadataRow,
    removeMetadataRow,
    showPlanAdvanced,
    setShowPlanAdvanced,
    // Objects in the plan
    planRateCards,
    planSubscriptionFees,
    planCreditGrants,
    // Amounts for summaries
    subscriptionFeeAmounts,
    subscriptionFeePeriods,
    creditGrantAmounts,
    creditGrantPeriods,
    planRateUnitPrices,
    ratePriceTypes,
    // Navigation
    setActivePlanNode,
    activePlanRateCardId,
  } = ctx

  const closeForm = usePlanFormClose()
  const handleEnterToClose = createEnterToCloseHandler(closeForm)
  const { setFocusedField } = useFocusedField()

  const planMetaId = 0
  const metadataRows = getMetadataRows(planMetadataRows, planMetaId)

  const navigateTo = (type: "rateCard" | "rate" | "creditGrant" | "subscriptionFee", id: number, parentRateCardId?: number) => {
    if (type === "rate" && parentRateCardId != null) {
      // Need to set the active rate card before navigating to a rate
      ctx.setActivePlanNode({ type: "rateCard", id: parentRateCardId })
      // Small delay to ensure rate card is set, then navigate to rate
      setTimeout(() => ctx.setActivePlanNode({ type: "rate", id }), 0)
      return
    }
    ctx.setActivePlanNode({ type, id })
  }

  const handleAddObject = (kind: "rate-card" | "subscription-fee" | "credit-grant") => {
    onAddObject?.(kind)
  }

  return (
    <div className="flex flex-col gap-[12px] min-w-0">
      {/* Plan name */}
      <FormRow label={t("Name")} fieldDescriptionId="plan-name">
        <div data-field-description="plan-name">
          <HighlightedInput
            highlightKey="plan.name"
            isHighlighted={isHighlighted}
            textFieldInputClasses={textFieldInputClasses}
            value={planName}
            onChange={(event) => setPlanName(event.target.value)}
            onKeyDown={handleEnterToClose}
            ariaLabel={t("Plan name")}
            placeholder={t("e.g. Pro plan")}
            onFocus={() => setFocusedField("plan.name")}
            onBlur={() => setFocusedField(null)}
            className={validationErrorClass("plan.name")}
            autoFocus
          />
          <FieldError message={validationErrorMessage("plan.name")} />
        </div>
      </FormRow>

      {/* Currency */}
      <FormRow label={t("Currency")} fieldDescriptionId="plan-currency">
        <div data-field-description="plan-currency">
          <Selector
            ariaLabel={t("Currency")}
            size="sm"
            value={planCurrency}
            onChange={setPlanCurrency}
            onOpenChange={(open) => setFocusedField(open ? "plan.currency" : null)}
            options={currencyOptions}
            getDisplayValue={(value) => value}
            buttonClassName="h-[30px] justify-between px-[12px] py-[6px] text-[12px] font-[500] leading-[16px] text-[#353A44] hover:border-[#B6C0CD]"
            highlightValue={isHighlighted("plan.currency")}
            searchable
            searchPlaceholder={t("Search currencies")}
            triggerIcon={<CurrencyFlag currency={planCurrency} size={14} />}
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
            fullWidth
          />
        </div>
      </FormRow>

      {/* ── In this plan ────────────────────────────────────── */}
      <div className="flex flex-col gap-[16px] px-4 pt-[8px]">
        <div className="flex items-center gap-[8px]">
          <div className="h-px flex-1 bg-[#EBEEF1]" />
          <p className="shrink-0 text-[11px] font-[600] leading-[16px] tracking-[0.5px] uppercase text-[#667691]">
            {t("In this plan")}
          </p>
          <div className="h-px flex-1 bg-[#EBEEF1]" />
        </div>

        {/* Fixed charges (subscription fees) */}
        <CategorySection
          t={t}
          title="Fixed charges"
          description="A recurring amount charged each billing period, regardless of usage"
          onAdd={() => handleAddObject("subscription-fee")}
          addLabel="Add fixed charge"
          emptyHint="Most plans start with a monthly or annual fee"
          hasItems={planSubscriptionFees.length > 0}
        >
          {planSubscriptionFees.map((fee) => (
            <ObjectCard
              key={fee.id}
              title={fee.name || t("Subscription fee")}
              subtitle={subscriptionFeePeriods[fee.id] ?? "Monthly"}
              glyphKind="subscriptionFee"
              detail={formatAmount(subscriptionFeeAmounts[fee.id], planCurrency) + (subscriptionFeeAmounts[fee.id] ? periodLabel(subscriptionFeePeriods[fee.id]) : "")}
              onClick={() => navigateTo("subscriptionFee", fee.id)}
            />
          ))}
        </CategorySection>

        {/* Usage-based charges (rate cards) */}
        <CategorySection
          t={t}
          title="Usage-based charges"
          description="Rates define per-unit pricing tracked by meters. Rate cards group related rates."
          onAdd={() => handleAddObject("rate-card")}
          addLabel="Add usage charges"
          emptyHint="Track and charge for what customers use"
          hasItems={planRateCards.length > 0}
        >
          {planRateCards.map((card) => (
            <div key={card.id} className="flex flex-col gap-[2px]">
              <ObjectCard
                title={card.name || t("Rate card")}
                subtitle={`${card.rates.length} ${card.rates.length === 1 ? t("rate") : t("rates")}`}
                glyphKind="rateCard"
                onClick={() => navigateTo("rateCard", card.id)}
              />
              {card.rates.length > 0 && (
                <div className="flex flex-col ml-[22px]">
                  {card.rates.map((rate) => {
                    const price = planRateUnitPrices[rate.id]
                    const priceType = ratePriceTypes[rate.id]
                    const detail = priceType === "Graduated" || priceType === "Volume"
                      ? t(priceType)
                      : formatAmount(price, planCurrency)
                    return (
                      <RateItem
                        key={rate.id}
                        name={rate.name || t("Rate")}
                        detail={detail || undefined}
                        onClick={() => navigateTo("rate", rate.id, card.id)}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </CategorySection>

        {/* Credits */}
        <CategorySection
          t={t}
          title="Credits"
          description="Prepaid allowances that offset usage-based charges before billing"
          onAdd={() => handleAddObject("credit-grant")}
          addLabel="Add credits"
          emptyHint="Optionally include prepaid usage allowances"
          hasItems={planCreditGrants.length > 0}
        >
          {planCreditGrants.map((grant) => (
            <ObjectCard
              key={grant.id}
              title={grant.name || t("Credit grant")}
              subtitle={creditGrantPeriods[grant.id] ?? "Monthly"}
              glyphKind="creditGrant"
              detail={formatAmount(creditGrantAmounts[grant.id], planCurrency) + (creditGrantAmounts[grant.id] ? periodLabel(creditGrantPeriods[grant.id]) : "")}
              onClick={() => navigateTo("creditGrant", grant.id)}
            />
          ))}
        </CategorySection>
      </div>

      {/* Advanced settings */}
      <button
        type="button"
        aria-expanded={showPlanAdvanced}
        aria-controls="plan-overview-advanced-settings"
        className="mx-4 flex cursor-pointer items-center justify-between rounded-[8px] px-4 py-[8px] transition-colors duration-150 hover:bg-[#F5F6F8]"
        onClick={() => setShowPlanAdvanced((prev) => !prev)}
      >
        <span className="text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#1A2C44]">
          {t("Advanced settings")}
        </span>
        <LargeChevronIcon rotated={showPlanAdvanced} />
      </button>
      <div
        id="plan-overview-advanced-settings"
        aria-hidden={!showPlanAdvanced}
        inert={!showPlanAdvanced}
        className={`grid min-w-0 transition-[grid-template-rows,opacity] duration-200 ease-out ${
          showPlanAdvanced ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="flex min-w-0 flex-col gap-[12px] pb-[8px]">
          <FormRow label={t("Include tax in prices")} fieldDescriptionId="plan-taxes">
            <div data-field-description="plan-taxes">
              <Selector
                ariaLabel={t("Taxes")}
                size="sm"
                value={planTaxTreatment}
                onChange={setPlanTaxTreatment}
                options={["Yes", "No"]}
                getDisplayValue={t}
                buttonClassName="h-[30px] justify-between px-[12px] py-[6px] text-[12px] font-[500] leading-[16px] text-[#353A44] hover:border-[#B6C0CD]"
                highlightValue={isHighlighted("plan.taxTreatment")}
                fullWidth
              />
            </div>
          </FormRow>
          <FormRow label={t("Description")} helperText={t("Shows on your Checkout and Invoice.")} rightWidthPx={null}>
            <div data-field-description="plan-description" className="w-full">
              <textarea
                className={`min-h-[120px] w-full rounded-[6px] border border-[#D8DEE4] bg-white p-[8px] text-[12px] font-[500] text-[#353A44] placeholder:text-[#6C7688] outline-none focus:shadow-[0_0_0_1.5px_#A0D0F7] focus:border-[#A0D0F7] transition-all ${highlightInputClass("plan.description")} ${validationErrorClass("plan.description")}`}
                value={planDescription}
                onChange={(event) => setPlanDescription(event.target.value)}
                aria-label={t("Description")}
                placeholder={t("Briefly describe what this plan includes")}
                onFocus={() => setFocusedField("plan.description")}
                onBlur={() => setFocusedField(null)}
              />
              <FieldError message={validationErrorMessage("plan.description")} />
            </div>
          </FormRow>
          <FormRow label={t("Lookup key")} helperText={t("Unique identifier in code.")} fieldDescriptionId="plan-lookup-key">
            <div data-field-description="plan-lookup-key">
              <input
                className={`${textFieldInputClasses} ${highlightInputClass("plan.lookupKey")} ${validationErrorClass("plan.lookupKey")}`}
                value={planLookupKey}
                onChange={(event) => setPlanLookupKey(event.target.value)}
                onKeyDown={handleEnterToClose}
                aria-label={t("Lookup key")}
                placeholder={t("e.g. pro_plan")}
              />
              <FieldError message={validationErrorMessage("plan.lookupKey")} />
            </div>
          </FormRow>
          <FormRow label={t("Metadata")} layout="stacked" rightWidthPx={null}>
            <div className="flex w-full flex-col gap-[8px]">
              {metadataRows.map((rowId) => (
                <div key={rowId} className="flex items-center gap-[8px]">
                  <input
                    className={`${textFieldInputClasses} ${highlightInputClass("plan.metadata")}`}
                    aria-label={t("Plan metadata key")}
                    placeholder={t("Key")}
                    value={planMetadataValues[planMetaId]?.[rowId]?.key ?? ""}
                    onChange={(event) =>
                      setPlanMetadataValues((prev) => ({
                        ...prev,
                        [planMetaId]: {
                          ...(prev[planMetaId] ?? {}),
                          [rowId]: {
                            key: event.target.value,
                            value: prev[planMetaId]?.[rowId]?.value ?? "",
                          },
                        },
                      }))
                    }
                    onKeyDown={handleEnterToClose}
                  />
                  <input
                    className={`${textFieldInputClasses} ${highlightInputClass("plan.metadata")}`}
                    aria-label={t("Plan metadata value")}
                    placeholder={t("Value")}
                    value={planMetadataValues[planMetaId]?.[rowId]?.value ?? ""}
                    onChange={(event) =>
                      setPlanMetadataValues((prev) => ({
                        ...prev,
                        [planMetaId]: {
                          ...(prev[planMetaId] ?? {}),
                          [rowId]: {
                            key: prev[planMetaId]?.[rowId]?.key ?? "",
                            value: event.target.value,
                          },
                        },
                      }))
                    }
                    onKeyDown={handleEnterToClose}
                  />
                  <button
                    type="button"
                    className="flex h-[32px] w-[32px] items-center justify-center rounded-[6px] text-[#474E5A] hover:bg-[#F5F6F8]"
                    onClick={() => removeMetadataRow(setPlanMetadataRows, planMetaId, rowId, setPlanMetadataValues)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="12" viewBox="0 0 10 12" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M3.72 0C3.32236 0 3 0.322355 3 0.72V1.2H0.6C0.268629 1.2 0 1.46863 0 1.8C0 2.13137 0.268629 2.4 0.6 2.4H9.4C9.73137 2.4 10 2.13137 10 1.8C10 1.46863 9.73137 1.2 9.4 1.2H7V0.72C7 0.322355 6.67764 0 6.28 0H3.72ZM1 3.6V10.2C1 11.1941 1.80589 12 2.8 12H7.2C8.19411 12 9 11.1941 9 10.2V3.6H1Z" fill="currentColor"/></svg>
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="flex items-center gap-[6px] rounded-[6px] px-[2px] py-[4px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#533AFD] transition-colors hover:text-[#4229E0]"
                onClick={() => addMetadataRow(setPlanMetadataRows, planMetaId, setPlanMetadataValues)}
              >
                {t("Add metadata")}
              </button>
            </div>
          </FormRow>
          </div>
        </div>
      </div>
    </div>
  )
}
