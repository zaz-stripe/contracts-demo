"use client"

import { useState } from "react"
import { FormRow } from "@/components/FormRow"
import { SegmentedControl } from "@/components/SegmentedControl"
import { Selector } from "@/components/Selector"
import { LargeChevronIcon, TrashIcon } from "@/components/ProductCatalogIcons"
import type { PlanFormContext } from "./planFormTypes"
import { inlineAddButtonClasses, createEnterToCloseHandler, FieldError } from "./planFormUtils"
import { usePlanFormClose } from "./PlanFormCloseContext"
import { useFocusedField } from "@/components/product-catalog/FocusedFieldContext"
import { FieldHint } from "./QuickStartTip"

const PRODUCT_OPTIONS = [
  { value: "", label: "None", cost: "" },
  { value: "api-credits", label: "API Credits", cost: "0.01" },
  { value: "compute-units", label: "Compute Units", cost: "0.05" },
  { value: "storage-gb", label: "Storage (GB)", cost: "0.10" },
  { value: "bandwidth-gb", label: "Bandwidth (GB)", cost: "0.08" },
]

type CreditGrantFormProps = {
  ctx: PlanFormContext
  highlightInputClass: (key: string) => string
  isHighlighted: (key: string) => boolean
  validationErrorClass: (key: string) => string
  validationErrorMessage: (key: string) => string | undefined
}

export function CreditGrantForm({ ctx, highlightInputClass, isHighlighted, validationErrorClass, validationErrorMessage }: CreditGrantFormProps) {
  const {
    t,
    textFieldInputClasses,
    activePlanNode,
    servicingPeriodOptions,
    creditApplicationOptions,
    planCreditGrants,
    updateCreditGrantName,
    creditGrantPeriods,
    setCreditGrantPeriods,
    creditGrantAmounts,
    setCreditGrantAmounts,
    creditGrantApplications,
    setCreditGrantApplications,
    showCreditAdvanced,
    setShowCreditAdvanced,
    creditGrantLookupKeys,
    setCreditGrantLookupKeys,
    getMetadataRows,
    addMetadataRow,
    removeMetadataRow,
    creditGrantItemMetadataRows,
    setCreditGrantItemMetadataRows,
    creditGrantItemMetadataValues,
    setCreditGrantItemMetadataValues,
    creditGrantInstanceMetadataRows,
    setCreditGrantInstanceMetadataRows,
    creditGrantInstanceMetadataValues,
    setCreditGrantInstanceMetadataValues,
  } = ctx

  const [selectedProduct, setSelectedProduct] = useState("")
  const [productCost, setProductCost] = useState("")

  const closeForm = usePlanFormClose()
  const handleEnterToClose = createEnterToCloseHandler(closeForm)
  const { setFocusedField } = useFocusedField()

  const creditId = activePlanNode.id ?? planCreditGrants[0]?.id ?? 0
  const creditGrant = planCreditGrants.find((item) => item.id === creditId)
  const itemMetadataRows = getMetadataRows(creditGrantItemMetadataRows, creditId)
  const instanceMetadataRows = getMetadataRows(creditGrantInstanceMetadataRows, creditId)

  if (!creditGrant) return null

  return (
    <div className="flex flex-col gap-[12px] min-w-0">
      <FormRow label={t("Display name")}>
        <input
          className={`${textFieldInputClasses} ${highlightInputClass("creditGrant.name")} ${validationErrorClass(`creditGrant.${creditId}.name`)}`}
          value={creditGrant.name}
          onChange={(event) => updateCreditGrantName(creditId, event.target.value)}
          onKeyDown={handleEnterToClose}
          onFocus={() => setFocusedField("creditGrant.name")}
          onBlur={() => setFocusedField(null)}
          placeholder={t("e.g. Monthly Credit, Free Tier Allowance")}
        />
        <FieldError message={validationErrorMessage(`creditGrant.${creditId}.name`)} />
      </FormRow>
      <FormRow label={t("Service interval")}>
        <div className="w-full">
          <SegmentedControl
            value={creditGrantPeriods[creditId] ?? servicingPeriodOptions[0]}
            onChange={(next) => setCreditGrantPeriods((prev) => ({ ...prev, [creditId]: next }))}
            options={servicingPeriodOptions}
            getDisplayValue={t}
          />
        </div>
      </FormRow>
      <FormRow label={t("Credit amount")}>
        <div
          className={`flex h-[30px] w-full items-center gap-[8px] rounded-[6px] border border-[#D8DEE4] bg-white px-[12px] text-[12px] font-[500] text-[#353A44] ${highlightInputClass(
            "creditGrant.amount"
          )} ${validationErrorClass(`creditGrant.${creditId}.amount`)}`}
        >
          <span className="text-[#6C7688]">$</span>
          <input
            className="w-full bg-transparent outline-none"
            placeholder="0.00"
            value={creditGrantAmounts[creditId] ?? ""}
            onChange={(event) => setCreditGrantAmounts((prev) => ({ ...prev, [creditId]: event.target.value }))}
            onKeyDown={handleEnterToClose}
            onFocus={() => setFocusedField("creditGrant.amount")}
            onBlur={() => setFocusedField(null)}
          />
        </div>
        <FieldError message={validationErrorMessage(`creditGrant.${creditId}.amount`)} />
      </FormRow>
      <FormRow label={t("Product")}>
        <Selector
          ariaLabel={t("Product")}
          size="sm"
          value={selectedProduct}
          onChange={(next) => {
            setSelectedProduct(next)
            const match = PRODUCT_OPTIONS.find((p) => p.value === next)
            setProductCost(match?.cost ?? "")
          }}
          options={PRODUCT_OPTIONS.map((p) => p.value)}
          getDisplayValue={(val) => PRODUCT_OPTIONS.find((p) => p.value === val)?.label ?? t("None")}
          buttonClassName="h-[30px] justify-between px-[12px] py-[6px] text-[12px] font-[500] leading-[16px] text-[#353A44]"
          fullWidth
        />
      </FormRow>
      {selectedProduct && (
        <FormRow label={t("Unit cost")}>
          <div
            className={`flex h-[30px] w-full items-center gap-[8px] rounded-[6px] border border-[#D8DEE4] bg-white px-[12px] text-[12px] font-[500] text-[#353A44]`}
          >
            <span className="text-[#6C7688]">$</span>
            <input
              className="w-full bg-transparent outline-none"
              placeholder="0.00"
              value={productCost}
              onChange={(event) => setProductCost(event.target.value)}
              onKeyDown={handleEnterToClose}
              onFocus={() => setFocusedField("creditGrant.productCost")}
              onBlur={() => setFocusedField(null)}
            />
          </div>
        </FormRow>
      )}
      <FormRow label={t("Meter applicability")} hint={<FieldHint t={t} text="Choose which meters this credit grant applies to." visible />}>
        <Selector
          ariaLabel={t("Meter applicability")}
          size="sm"
          value={creditGrantApplications[creditId] ?? creditApplicationOptions[0]}
          onChange={(next) => setCreditGrantApplications((prev) => ({ ...prev, [creditId]: next }))}
          options={creditApplicationOptions}
          getDisplayValue={t}
          buttonClassName="h-[30px] justify-between px-[12px] py-[6px] text-[12px] font-[500] leading-[16px] text-[#353A44]"
          highlightValue={isHighlighted("creditGrant.application")}
          fullWidth
        />
      </FormRow>
      <button
        type="button"
        aria-expanded={showCreditAdvanced}
        aria-controls="credit-grant-advanced-settings"
        className="mx-4 flex cursor-pointer items-center justify-between rounded-[8px] px-4 py-[8px] transition-colors duration-150 hover:bg-[#F5F6F8]"
        onClick={() => setShowCreditAdvanced((prev) => !prev)}
      >
        <span className="text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#1A2C44]">
          {t("Advanced settings")}
        </span>
        <LargeChevronIcon rotated={showCreditAdvanced} />
      </button>
      <div
        id="credit-grant-advanced-settings"
        aria-hidden={!showCreditAdvanced}
        inert={!showCreditAdvanced}
        className={`grid min-w-0 transition-[grid-template-rows,opacity] duration-200 ease-out ${
          showCreditAdvanced ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="flex min-w-0 flex-col gap-[12px] pb-[8px]">
          <FormRow label={t("Item lookup key")}>
            <input
              className={`${textFieldInputClasses} ${highlightInputClass("creditGrant.lookupKey")}`}
              value={creditGrantLookupKeys[creditId] ?? ""}
              onChange={(event) => setCreditGrantLookupKeys((prev) => ({ ...prev, [creditId]: event.target.value }))}
              onKeyDown={handleEnterToClose}
              placeholder={t("e.g. monthly_credit_grant")}
            />
          </FormRow>
          <FormRow label={t("Item metadata")} layout="stacked" rightWidthPx={null}>
            <div className="flex w-full flex-col gap-[8px]">
              {itemMetadataRows.map((rowId) => (
                <div key={rowId} className="flex items-center gap-[8px]">
                  <input
                    className={`${textFieldInputClasses} ${highlightInputClass("creditGrant.itemMetadata")}`}
                    aria-label={t("Credit grant item metadata key")}
                    placeholder={t("Key")}
                    value={creditGrantItemMetadataValues[creditId]?.[rowId]?.key ?? ""}
                    onChange={(event) =>
                      setCreditGrantItemMetadataValues((prev) => ({
                        ...prev,
                        [creditId]: {
                          ...(prev[creditId] ?? {}),
                          [rowId]: {
                            key: event.target.value,
                            value: prev[creditId]?.[rowId]?.value ?? "",
                          },
                        },
                      }))
                    }
                    onKeyDown={handleEnterToClose}
                  />
                  <input
                    className={`${textFieldInputClasses} ${highlightInputClass("creditGrant.itemMetadata")}`}
                    aria-label={t("Credit grant item metadata value")}
                    placeholder={t("Value")}
                    value={creditGrantItemMetadataValues[creditId]?.[rowId]?.value ?? ""}
                    onChange={(event) =>
                      setCreditGrantItemMetadataValues((prev) => ({
                        ...prev,
                        [creditId]: {
                          ...(prev[creditId] ?? {}),
                          [rowId]: {
                            key: prev[creditId]?.[rowId]?.key ?? "",
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
                    onClick={() => removeMetadataRow(setCreditGrantItemMetadataRows, creditId, rowId, setCreditGrantItemMetadataValues)}
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className={inlineAddButtonClasses}
                onClick={() => addMetadataRow(setCreditGrantItemMetadataRows, creditId, setCreditGrantItemMetadataValues)}
              >
                {t("Add metadata")}
              </button>
            </div>
          </FormRow>
          <FormRow label={t("Instance metadata")} layout="stacked" rightWidthPx={null}>
            <div className="flex w-full flex-col gap-[8px]">
              {instanceMetadataRows.map((rowId) => (
                <div key={rowId} className="flex items-center gap-[8px]">
                  <input
                    className={`${textFieldInputClasses} ${highlightInputClass("creditGrant.instanceMetadata")}`}
                    aria-label={t("Credit grant instance metadata key")}
                    placeholder={t("Key")}
                    value={creditGrantInstanceMetadataValues[creditId]?.[rowId]?.key ?? ""}
                    onChange={(event) =>
                      setCreditGrantInstanceMetadataValues((prev) => ({
                        ...prev,
                        [creditId]: {
                          ...(prev[creditId] ?? {}),
                          [rowId]: {
                            key: event.target.value,
                            value: prev[creditId]?.[rowId]?.value ?? "",
                          },
                        },
                      }))
                    }
                    onKeyDown={handleEnterToClose}
                  />
                  <input
                    className={`${textFieldInputClasses} ${highlightInputClass("creditGrant.instanceMetadata")}`}
                    aria-label={t("Credit grant instance metadata value")}
                    placeholder={t("Value")}
                    value={creditGrantInstanceMetadataValues[creditId]?.[rowId]?.value ?? ""}
                    onChange={(event) =>
                      setCreditGrantInstanceMetadataValues((prev) => ({
                        ...prev,
                        [creditId]: {
                          ...(prev[creditId] ?? {}),
                          [rowId]: {
                            key: prev[creditId]?.[rowId]?.key ?? "",
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
                    onClick={() => removeMetadataRow(setCreditGrantInstanceMetadataRows, creditId, rowId, setCreditGrantInstanceMetadataValues)}
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className={inlineAddButtonClasses}
                onClick={() => addMetadataRow(setCreditGrantInstanceMetadataRows, creditId, setCreditGrantInstanceMetadataValues)}
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
