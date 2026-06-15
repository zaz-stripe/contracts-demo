'use client'

import { useState } from "react"
import { FormRow } from "@/components/FormRow"
import { SegmentedControl } from "@/components/SegmentedControl"
import { Selector } from "@/components/Selector"
import { textFieldInputClasses, servicingPeriodOptions, planPriceTypeOptions, subscriptionFeeSellAsOptions, creditApplicationOptions, defaultMeterOptions } from "@/components/product-catalog/productCatalogPage.constants"

const t = (key: string) => key

function InputWithPrefix({ prefix, placeholder, value, onChange }: { prefix: string; placeholder: string; value?: string; onChange?: (v: string) => void }) {
  return (
    <div className="flex h-[30px] w-full items-center gap-[8px] rounded-[6px] border border-[#D8DEE4] bg-white px-[12px] text-[12px] font-[500] text-[#353A44] hover:border-[#B6C0CD] focus-within:shadow-[0_0_0_1.5px_#A0D0F7] focus-within:border-[#A0D0F7] transition-all">
      <span className="text-[#6C7688]">{prefix}</span>
      <input
        className="w-full bg-transparent outline-none placeholder:text-[#6C7688]"
        placeholder={placeholder}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value.replace(/[^0-9.]/g, ""))}
        inputMode="decimal"
      />
    </div>
  )
}

function AdvancedToggle({ expanded, onToggle }: { expanded: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-expanded={expanded}
      className="mx-4 flex cursor-pointer items-center justify-between rounded-[8px] px-4 py-[8px] transition-colors duration-150 hover:bg-[#F5F6F8]"
      onClick={onToggle}
    >
      <span className="text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#1A2C44]">
        {t("Advanced settings")}
      </span>
      <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className={`transition-transform ${expanded ? "rotate-180" : ""}`}>
        <path d="M1 1L5 5L9 1" stroke="#6C7688" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  )
}

// ── Product Form ────────────────────────────────────────────────────

type ProductPriceFormProps = {
  name?: string
  description?: string
  productType?: string
  meter?: string
  amount?: string
  onChange?: (field: string, value: string) => void
}

const productTypeOptions = ["Flat rate", "Usage-based", "Composite"]

export function ProductPriceForm({ name, description, productType, meter, onChange }: ProductPriceFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  return (
    <div className="flex flex-col gap-[12px] min-w-0">
      <FormRow label={t("Product name")}>
        <input type="text" value={name ?? ""} onChange={(e) => onChange?.("name", e.target.value)} className={textFieldInputClasses} placeholder={t("e.g. Platform Fee, Base Subscription")} />
      </FormRow>
      <FormRow label={t("Description")}>
        <input type="text" value={description ?? ""} onChange={(e) => onChange?.("description", e.target.value)} className={textFieldInputClasses} placeholder={t("Optional description")} />
      </FormRow>
      <FormRow label={t("Type")}>
        <SegmentedControl
          value={productType || productTypeOptions[0]}
          onChange={(v) => onChange?.("productType", v)}
          options={productTypeOptions}
          getDisplayValue={t}
        />
      </FormRow>
      <FormRow label={t("Meter")}>
        <Selector
          ariaLabel={t("Meter")}
          size="sm"
          value={meter || defaultMeterOptions[0]}
          onChange={(v) => onChange?.("meter", v)}
          options={defaultMeterOptions}
          getDisplayValue={t}
          buttonClassName="h-[30px] justify-between px-[12px] py-[6px] text-[12px] font-[500] leading-[16px] text-[#353A44]"
          fullWidth
        />
      </FormRow>
      <AdvancedToggle expanded={showAdvanced} onToggle={() => setShowAdvanced(!showAdvanced)} />
      {showAdvanced && (
        <div className="flex flex-col gap-[12px]">
          <FormRow label={t("Product tax code")}>
            <input type="text" className={textFieldInputClasses} placeholder={t("e.g. txcd_10000000")} />
          </FormRow>
          <FormRow label={t("Statement descriptor")}>
            <input type="text" className={textFieldInputClasses} placeholder={t("e.g. ACME PLATFORM")} />
          </FormRow>
        </div>
      )}
    </div>
  )
}

// ── Price Form ──────────────────────────────────────────────────────

type PriceEditFormProps = {
  amount?: string
  cadence?: string
  priceType?: string
  sellAs?: string
  unitLabel?: string
  onChange?: (field: string, value: string) => void
}

export function PriceEditForm({ amount, cadence, priceType, sellAs, unitLabel, onChange }: PriceEditFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const isUsage = !amount || amount === ""

  return (
    <div className="flex flex-col gap-[12px] min-w-0">
      <FormRow label={t("Price type")} fieldDescriptionId="subscription-fee-price-type">
        <div className="w-full">
          <SegmentedControl
            value={priceType || (isUsage ? "Volume" : planPriceTypeOptions[0])}
            onChange={(v) => onChange?.("priceType", v)}
            options={planPriceTypeOptions}
            getDisplayValue={t}
          />
        </div>
      </FormRow>
      <FormRow label={t("Sell as")} fieldDescriptionId="subscription-fee-sell-as">
        <div className="w-full">
          <SegmentedControl
            value={sellAs || subscriptionFeeSellAsOptions[0]}
            onChange={(v) => onChange?.("sellAs", v)}
            options={subscriptionFeeSellAsOptions}
            getDisplayValue={t}
          />
        </div>
      </FormRow>
      <FormRow label={t("Price per unit")} fieldDescriptionId="subscription-fee-unit-price">
        <InputWithPrefix prefix="$" placeholder="0.00" value={amount} onChange={(v) => onChange?.("amount", v)} />
      </FormRow>
      <FormRow label={t("Unit label")}>
        <input type="text" value={unitLabel ?? ""} onChange={(e) => onChange?.("unitLabel", e.target.value)} className={textFieldInputClasses} placeholder={t("e.g. seat, license, unit")} />
      </FormRow>
      <AdvancedToggle expanded={showAdvanced} onToggle={() => setShowAdvanced(!showAdvanced)} />
      {showAdvanced && (
        <div className="flex flex-col gap-[12px]">
          <FormRow label={t("Lookup key")}>
            <input type="text" className={textFieldInputClasses} placeholder={t("e.g. price_basic_monthly")} />
          </FormRow>
          <FormRow label={t("Tax behavior")}>
            <Selector
              ariaLabel={t("Tax behavior")}
              size="sm"
              value="Unspecified"
              onChange={() => {}}
              options={["Unspecified", "Inclusive", "Exclusive"]}
              getDisplayValue={t}
              buttonClassName="h-[30px] justify-between px-[12px] py-[6px] text-[12px] font-[500] leading-[16px] text-[#353A44]"
              fullWidth
            />
          </FormRow>
        </div>
      )}
    </div>
  )
}

// ── Price Group Form ────────────────────────────────────────────────

type PriceGroupEditFormProps = {
  name?: string
  serviceInterval?: string
  onChange?: (field: string, value: string) => void
}

export function PriceGroupEditForm({ name, serviceInterval, onChange }: PriceGroupEditFormProps) {
  return (
    <div className="flex flex-col gap-[12px] min-w-0">
      <FormRow label={t("Display name")} fieldDescriptionId="ratecard-name">
        <input type="text" value={name ?? ""} onChange={(e) => onChange?.("name", e.target.value)} className={textFieldInputClasses} placeholder={t("e.g. Usage, API Rates")} />
      </FormRow>
      <FormRow label={t("Service interval")} fieldDescriptionId="ratecard-servicing-period">
        <div className="w-full">
          <SegmentedControl
            value={serviceInterval || servicingPeriodOptions[0]}
            onChange={(v) => onChange?.("serviceInterval", v)}
            options={servicingPeriodOptions}
            getDisplayValue={t}
          />
        </div>
      </FormRow>
    </div>
  )
}

// ── Plan Form ───────────────────────────────────────────────────────

type PlanEditFormProps = {
  name?: string
  currency?: string
  description?: string
  onChange?: (field: string, value: string) => void
}

export function PlanEditForm({ name, currency, description, onChange }: PlanEditFormProps) {
  return (
    <div className="flex flex-col gap-[12px] min-w-0">
      <FormRow label={t("Plan name")} fieldDescriptionId="plan-name">
        <input type="text" value={name ?? ""} onChange={(e) => onChange?.("name", e.target.value)} className={textFieldInputClasses} placeholder={t("e.g. Starter, Pro")} />
      </FormRow>
      <FormRow label={t("Currency")} fieldDescriptionId="plan-currency">
        <Selector
          ariaLabel={t("Currency")}
          size="sm"
          value={currency || "USD"}
          onChange={(v) => onChange?.("currency", v)}
          options={["USD", "EUR", "GBP", "JPY", "CAD", "AUD"]}
          getDisplayValue={t}
          buttonClassName="h-[30px] justify-between px-[12px] py-[6px] text-[12px] font-[500] leading-[16px] text-[#353A44]"
          fullWidth
        />
      </FormRow>
      <FormRow label={t("Description")} fieldDescriptionId="plan-description">
        <input type="text" value={description ?? ""} onChange={(e) => onChange?.("description", e.target.value)} className={textFieldInputClasses} placeholder={t("Optional description")} />
      </FormRow>
    </div>
  )
}

// ── Credit Grant Form ───────────────────────────────────────────────

type CreditGrantEditFormProps = {
  name?: string
  period?: string
  amount?: string
  onChange?: (field: string, value: string) => void
}

export function CreditGrantEditForm({ name, period, amount, onChange }: CreditGrantEditFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  return (
    <div className="flex flex-col gap-[12px] min-w-0">
      <FormRow label={t("Display name")}>
        <input type="text" value={name ?? ""} onChange={(e) => onChange?.("name", e.target.value)} className={textFieldInputClasses} placeholder={t("e.g. Monthly Credit, Free Tier Allowance")} />
      </FormRow>
      <FormRow label={t("Service interval")}>
        <div className="w-full">
          <SegmentedControl
            value={period || servicingPeriodOptions[0]}
            onChange={(v) => onChange?.("period", v)}
            options={servicingPeriodOptions}
            getDisplayValue={t}
          />
        </div>
      </FormRow>
      <FormRow label={t("Credit amount")}>
        <InputWithPrefix prefix="$" placeholder="0.00" value={amount} onChange={(v) => onChange?.("amount", v)} />
      </FormRow>
      <FormRow label={t("Product")}>
        <Selector
          ariaLabel={t("Product")}
          size="sm"
          value=""
          onChange={() => {}}
          options={["", "All products"]}
          getDisplayValue={(v) => v || t("None")}
          buttonClassName="h-[30px] justify-between px-[12px] py-[6px] text-[12px] font-[500] leading-[16px] text-[#353A44]"
          fullWidth
        />
      </FormRow>
      <FormRow label={t("Meter applicability")}>
        <Selector
          ariaLabel={t("Meter applicability")}
          size="sm"
          value={creditApplicationOptions[0]}
          onChange={() => {}}
          options={creditApplicationOptions}
          getDisplayValue={t}
          buttonClassName="h-[30px] justify-between px-[12px] py-[6px] text-[12px] font-[500] leading-[16px] text-[#353A44]"
          fullWidth
        />
      </FormRow>
      <AdvancedToggle expanded={showAdvanced} onToggle={() => setShowAdvanced(!showAdvanced)} />
      {showAdvanced && (
        <div className="flex flex-col gap-[12px]">
          <FormRow label={t("Lookup key")}>
            <input type="text" className={textFieldInputClasses} placeholder={t("e.g. credit_monthly")} />
          </FormRow>
        </div>
      )}
    </div>
  )
}
