'use client'

import { useState } from "react"
import { Selector } from "@/components/Selector"
import { CurrencyFlag } from "@/components/CurrencyFlag"
import { SegmentedControl } from "@/components/SegmentedControl"
import { defaultMeterOptions } from "@/components/product-catalog/productCatalogPage.constants"

const productTaxCodes = ["Account default", "Digital", "Physical", "Service"]
const taxBehaviorOptions = ["Unspecified", "Inclusive", "Exclusive"]
const billingPeriodOptions = ["Monthly", "Yearly", "Weekly", "Daily"]
const chargeFrequencyOptions = ["Recurring", "One-off"] as const

const labelClasses = "text-[13px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44]"
const inputClasses =
  "h-[36px] w-full rounded-[6px] border border-[#D8DEE4] bg-white px-[12px] text-[13px] font-[400] leading-[16px] text-[#353A44] placeholder:text-[#9CA3AF] hover:border-[#B6C0CD] focus:border-[#675DFF] focus:shadow-[0_0_0_1.5px_rgba(103,93,255,0.2)] focus:outline-none transition-all"

const productTypeOptions = ["Flat", "Usage-based", "Composite"]

type SimplifiedCreateProductFormProps = {
  t: (key: string) => string

  productName: string
  setProductName: (next: string) => void

  productDescription: string
  setProductDescription: (next: string) => void

  productImageUrl: string | null
  setProductImageUrl: (next: string | null) => void

  productType: "Flat" | "Usage-based" | "Composite"
  setProductType: (next: "Flat" | "Usage-based" | "Composite") => void

  productTaxCode: string
  setProductTaxCode: (next: string) => void

  chargeFrequency: string
  setChargeFrequency: (next: string) => void

  billingPeriod: string
  setBillingPeriod: (next: string) => void

  includeTax: string
  setIncludeTax: (next: string) => void

  pricingCurrencyCode: string
  currencyOptions: string[]
  currencyDisplayNames: Intl.DisplayNames | null
  onChangeCurrency: (code: string) => void

  amount: string
  setAmount: (next: string) => void

  onOpenFullSettings?: () => void
}

export function SimplifiedCreateProductForm({
  t,
  productName,
  setProductName,
  productDescription,
  setProductDescription,
  productType,
  setProductType,
  productTaxCode,
  setProductTaxCode,
  chargeFrequency,
  setChargeFrequency,
  billingPeriod,
  setBillingPeriod,
  includeTax,
  setIncludeTax,
  pricingCurrencyCode,
  currencyOptions,
  currencyDisplayNames,
  onChangeCurrency,
  amount,
  setAmount,
  onOpenFullSettings,
}: SimplifiedCreateProductFormProps) {
  const [meter, setMeter] = useState("")
  return (
    <div className="flex flex-col gap-[20px] px-[24px] py-[20px]">
      {/* Product name */}
      <div className="flex flex-col gap-[6px]">
        <label className={labelClasses}>{t("Product name")}</label>
        <input
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          placeholder="API access"
          aria-label={t("Product name")}
          className={inputClasses}
        />
      </div>

      {/* Description */}
      <div className="flex flex-col gap-[6px]">
        <label className={labelClasses}>{t("Description")}</label>
        <textarea
          value={productDescription}
          onChange={(e) => setProductDescription(e.target.value)}
          placeholder={t("Describe the product or service")}
          aria-label={t("Description")}
          className="min-h-[80px] w-full resize-none rounded-[6px] border border-[#D8DEE4] bg-white px-[12px] py-[10px] text-[13px] font-[400] leading-[18px] text-[#353A44] placeholder:text-[#9CA3AF] hover:border-[#B6C0CD] focus:border-[#675DFF] focus:shadow-[0_0_0_1.5px_rgba(103,93,255,0.2)] focus:outline-none transition-all"
        />
      </div>

      {/* Product type */}
      <div className="flex flex-col gap-[6px]">
        <label className={labelClasses}>{t("Type")}</label>
        <SegmentedControl
          value={productType as typeof productTypeOptions[number]}
          onChange={(v) => setProductType(v as "Flat" | "Usage-based" | "Composite")}
          options={productTypeOptions as unknown as readonly string[]}
          getDisplayValue={t}
          className="h-[36px]"
        />
      </div>

      {/* Meter (Usage-based only) */}
      {productType === "Usage-based" && (
        <div className="flex flex-col gap-[6px]">
          <label className={labelClasses}>{t("Meter")}</label>
          <Selector
            ariaLabel={t("Meter")}
            size="sm"
            value={meter}
            onChange={setMeter}
            options={defaultMeterOptions}
            placeholder={t("Select a meter")}
            searchable
            searchPlaceholder={t("Search meters")}
            fullWidth
            footerLabel={t("Create new meter")}
            onFooterClick={() => {
              const name = prompt("Meter name:")
              if (name?.trim()) setMeter(name.trim())
            }}
            buttonClassName="h-[36px] w-full justify-between rounded-[6px] border border-[#D8DEE4] px-[12px] text-[13px] font-[400] text-[#353A44]"
          />
        </div>
      )}

      {/* Pricing header */}
      <div className="flex flex-col gap-[2px] pt-[8px]">
        <span className="text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#353A44]">{t("Pricing")}</span>
        <p className="text-[12px] font-[400] leading-[16px] text-[#6C7688]">{t("Optionally add pricing")}</p>
      </div>

      {/* Pricing toggle */}
      <div className="flex flex-col gap-[6px]">
        <label className={labelClasses}>{t("Charge type")}</label>
        <SegmentedControl
          value={chargeFrequency as typeof chargeFrequencyOptions[number]}
          onChange={setChargeFrequency}
          options={chargeFrequencyOptions}
          getDisplayValue={t}
          className="h-[36px]"
        />
      </div>

      {/* Amount + Currency */}
      <div className="flex flex-col gap-[6px]">
        <label className={labelClasses}>{t("Amount")}</label>
        <div className="flex items-stretch">
          <div className="flex min-w-0 flex-1 items-center gap-[4px] rounded-l-[6px] border border-[#D8DEE4] bg-white px-[12px] text-[13px] font-[400] text-[#6C7688] hover:border-[#B6C0CD] focus-within:border-[#675DFF] focus-within:shadow-[0_0_0_1.5px_rgba(103,93,255,0.2)] transition-all">
            <span className="text-[#6C7688]">$</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              aria-label={t("Amount")}
              className="min-w-0 flex-1 bg-transparent text-[13px] font-[400] text-[#353A44] placeholder:text-[#9CA3AF] outline-none"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <Selector
            ariaLabel={t("Select currency")}
            options={currencyOptions}
            value={pricingCurrencyCode}
            onChange={onChangeCurrency}
            size="sm"
            searchable
            searchPlaceholder={t("Search currencies")}
            placeholder={t("Select currency")}
            triggerIcon={<CurrencyFlag currency={pricingCurrencyCode} />}
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
            buttonClassName="h-[36px] w-[90px] rounded-l-none border-l-0 px-[12px] text-[13px] font-[500] text-[#353A44]"
          />
        </div>
      </div>

      {/* Billing period (only for Recurring) */}
      {chargeFrequency !== "One-off" && (
        <div className="flex flex-col gap-[6px]">
          <label className={labelClasses}>{t("Billing period")}</label>
          <Selector
            ariaLabel={t("Billing period")}
            options={billingPeriodOptions}
            value={billingPeriod}
            onChange={setBillingPeriod}
            size="sm"
            getDisplayValue={t}
            buttonClassName="h-[36px] w-full justify-between rounded-[6px] border border-[#D8DEE4] px-[12px] text-[13px] font-[400] text-[#353A44]"
          />
        </div>
      )}

      {/* More pricing options link */}
      {onOpenFullSettings && (
        <button
          type="button"
          className="flex items-center gap-[4px] text-[13px] font-[500] text-[#675DFF] hover:text-[#5B52F0] transition-colors"
          onClick={onOpenFullSettings}
        >
          {t("More pricing options")}
          <span aria-hidden="true">&rarr;</span>
        </button>
      )}

      {/* Tax code */}
      <div className="flex flex-col gap-[6px]">
        <label className={labelClasses}>{t("Tax code")}</label>
        <Selector
          ariaLabel={t("Tax code")}
          options={productTaxCodes}
          value={productTaxCode}
          onChange={setProductTaxCode}
          size="sm"
          getDisplayValue={t}
          buttonClassName="h-[36px] w-full justify-between rounded-[6px] border border-[#D8DEE4] px-[12px] text-[13px] font-[400] text-[#353A44]"
        />
      </div>

      {/* Tax behavior */}
      <div className="flex flex-col gap-[6px]">
        <label className={labelClasses}>{t("Tax behavior")}</label>
        <Selector
          ariaLabel={t("Tax behavior")}
          options={taxBehaviorOptions}
          value={includeTax}
          onChange={setIncludeTax}
          size="sm"
          getDisplayValue={t}
          buttonClassName="h-[36px] w-full justify-between rounded-[6px] border border-[#D8DEE4] px-[12px] text-[13px] font-[400] text-[#353A44]"
        />
      </div>
    </div>
  )
}
