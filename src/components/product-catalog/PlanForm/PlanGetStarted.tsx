"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  SubscriptionFeeMiniIcon,
  RateMiniIcon,
  CreditGrantMiniIcon,
} from "@/components/ProductCatalogIcons"
import { Selector } from "@/components/Selector"
import { FormRow } from "@/components/FormRow"
import { FORM_LABEL_TEXT_CLASSES } from "@/components/formStyles"
import { textFieldInputClasses } from "@/components/product-catalog/productCatalogPage.constants"
import { useFocusedField } from "@/components/product-catalog/FocusedFieldContext"
import { useOnboardingMode } from "@/components/product-catalog/onboardingMode"

export type QuickStartKind = "subscription" | "usage" | "subscription-usage" | "credits-usage"

type Option = {
  kind: QuickStartKind
  title: string
  description: string
  icon: React.ReactNode
}

const OPTIONS: Option[] = [
  {
    kind: "usage",
    title: "Pay as you go",
    description: "Charge per unit of metered usage",
    icon: <RateMiniIcon />,
  },
  {
    kind: "subscription-usage",
    title: "Subscription + usage",
    description: "Base fee plus metered overage charges",
    icon: <SubscriptionFeeMiniIcon />,
  },
  {
    kind: "credits-usage",
    title: "Credits + usage",
    description: "Prepaid allowance with overage billing",
    icon: <CreditGrantMiniIcon />,
  },
]

/** Maps each quick-start kind to the ghost items it would create in the preview */
export const QUICK_START_GHOST_MAP: Record<QuickStartKind, ("subscription-fee" | "rate" | "credit-grant")[]> = {
  "subscription": ["subscription-fee"],
  "usage": ["rate"],
  "subscription-usage": ["subscription-fee", "rate"],
  "credits-usage": ["credit-grant", "rate"],
}

export type WizardFormData = {
  planName: string
  costPerMonth: string
  costPeriod: string
  costCustomCount: string
  costCustomUnit: string
  features: string[]
  freeCreditsAmount: string
  freeCreditsPeriod: string
  freeCreditsCustomCount: string
  freeCreditsCustomUnit: string
  importedFromPlanName?: string
  importedFromPlanId?: number
}

export type ExistingPlanSummary = {
  id: number
  name: string
  rateNames: string[]
}

type WizardFormSnapshot = {
  planName: string
  costPerMonth: string
  costPeriod: string
  costCustomCount: string
  costCustomUnit: string
  features: string[]
  freeCreditsAmount: string
  freeCreditsPeriod: string
  freeCreditsCustomCount: string
  freeCreditsCustomUnit: string
  importedFromPlanName?: string
}

type PlanGetStartedProps = {
  t: (key: string) => string
  onSelect: (kind: QuickStartKind) => void
  onSkip: () => void
  onHoverOption?: (kind: QuickStartKind | null) => void
  onFormSubmit?: (data: WizardFormData) => void
  onFormChange?: (data: WizardFormSnapshot) => void
  /** Optional ref to expose the wizard's submit action to a host (e.g. modal header). */
  submitRef?: React.MutableRefObject<{ submit: () => void; canSubmit: boolean } | null>
  /** Called whenever the wizard's `canSubmit` flag changes. */
  onCanSubmitChange?: (canSubmit: boolean) => void
  /** When true, hide the inline submit button at the bottom of the form. */
  hideInlineSubmit?: boolean
  /** Existing pricing plans the user can import rates from. */
  existingPlans?: ExistingPlanSummary[]
}

const periodOptions = ["Monthly", "Yearly", "Custom"]
const customUnitOptions = ["days", "weeks", "months", "years"]

// ── Inline wizard form (compact, fits 320px panel) ───────────────────
function InlineWizardForm({
  t,
  onSubmit,
  onFormChange,
  submitRef,
  onCanSubmitChange,
  hideInlineSubmit = false,
  existingPlans = [],
}: {
  t: (key: string) => string
  onSubmit: (data: WizardFormData) => void
  onFormChange?: (data: WizardFormSnapshot) => void
  submitRef?: React.MutableRefObject<{ submit: () => void; canSubmit: boolean } | null>
  onCanSubmitChange?: (canSubmit: boolean) => void
  hideInlineSubmit?: boolean
  existingPlans?: ExistingPlanSummary[]
}) {
  const [planName, setPlanName] = useState("")
  const [costPerMonth, setCostPerMonth] = useState("")
  const [costPeriod, setCostPeriod] = useState("Monthly")
  const [costCustomCount, setCostCustomCount] = useState("")
  const [costCustomUnit, setCostCustomUnit] = useState("months")
  const [freeCreditsAmount, setFreeCreditsAmount] = useState("")
  const [freeCreditsPeriod, setFreeCreditsPeriod] = useState("Monthly")
  const [freeCreditsCustomCount, setFreeCreditsCustomCount] = useState("")
  const [freeCreditsCustomUnit, setFreeCreditsCustomUnit] = useState("months")
  const [features, setFeatures] = useState<string[]>([])
  const [featureInput, setFeatureInput] = useState("")
  const [isFeatureInputFocused, setIsFeatureInputFocused] = useState(false)
  const [selectedTagIndex, setSelectedTagIndex] = useState<number | null>(null)
  const [importedFromPlan, setImportedFromPlan] = useState<string | null>(null)
  const importedFromPlanRef = useRef<string | null>(null)
  const [showPlanDropdown, setShowPlanDropdown] = useState(false)
  const featureInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { setFocusedField } = useFocusedField()

  // Stable ref for the callback to avoid re-trigger loops
  const onFormChangeRef = useRef(onFormChange)
  onFormChangeRef.current = onFormChange

  // Fire live preview on any field change
  // Read importedFromPlan via ref to avoid re-trigger loops — it only changes
  // when features change (via handleImportPlanRates), so the features dep
  // already captures that update.
  useEffect(() => {
    onFormChangeRef.current?.({ planName, costPerMonth, costPeriod, costCustomCount, costCustomUnit, features, freeCreditsAmount, freeCreditsPeriod, freeCreditsCustomCount, freeCreditsCustomUnit, importedFromPlanName: importedFromPlanRef.current ?? undefined })
  }, [planName, costPerMonth, costPeriod, costCustomCount, costCustomUnit, features, freeCreditsAmount, freeCreditsPeriod, freeCreditsCustomCount, freeCreditsCustomUnit])

  const canSubmit = planName.trim().length > 0

  const handleSubmit = () => {
    if (!canSubmit) return
    const finalFeatures = [...features]
    const pending = featureInput.trim()
    if (pending && !finalFeatures.some((f) => f.toLowerCase() === pending.toLowerCase())) {
      finalFeatures.push(pending)
    }
    onSubmit({
      planName: planName.trim(),
      costPerMonth,
      costPeriod,
      costCustomCount,
      costCustomUnit,
      features: finalFeatures,
      freeCreditsAmount,
      freeCreditsPeriod,
      freeCreditsCustomCount,
      freeCreditsCustomUnit,
      importedFromPlanName: importedFromPlan ?? undefined,
      importedFromPlanId: importedFromPlanIdRef.current ?? undefined,
    })
  }

  // Keep the latest submit handler / canSubmit reachable through the parent ref
  // so a host (e.g. the modal header) can drive the wizard's primary action.
  const handleSubmitRef = useRef(handleSubmit)
  handleSubmitRef.current = handleSubmit
  useEffect(() => {
    if (!submitRef) return
    submitRef.current = {
      submit: () => handleSubmitRef.current(),
      canSubmit,
    }
    return () => {
      if (submitRef.current?.submit === handleSubmitRef.current) {
        submitRef.current = null
      } else {
        submitRef.current = null
      }
    }
  }, [submitRef, canSubmit])

  // Notify host whenever submittability changes so it can toggle disabled state.
  useEffect(() => {
    onCanSubmitChange?.(canSubmit)
  }, [canSubmit, onCanSubmitChange])

  const addFeatureTag = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    if (features.some((f) => f.toLowerCase() === trimmed.toLowerCase())) return
    setFeatures((prev) => [...prev, trimmed])
    setFeatureInput("")
    setSelectedTagIndex(null)
  }

  const removeFeatureTag = (index: number) => {
    setFeatures((prev) => prev.filter((_, i) => i !== index))
    setSelectedTagIndex(null)
  }

  const handleFeatureKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addFeatureTag(featureInput)
    } else if (e.key === "Backspace" && featureInput === "" && features.length > 0) {
      if (selectedTagIndex != null) {
        setFeatures((prev) => prev.filter((_, i) => i !== selectedTagIndex))
        setSelectedTagIndex(null)
      } else {
        setSelectedTagIndex(features.length - 1)
      }
    } else if (selectedTagIndex != null) {
      setSelectedTagIndex(null)
    }
  }

  const handleFeatureInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (val.includes(",")) {
      const parts = val.split(",")
      for (const part of parts.slice(0, -1)) addFeatureTag(part)
      setFeatureInput(parts[parts.length - 1])
    } else {
      setFeatureInput(val)
    }
  }

  const matchingPlans = existingPlans.filter(
    (p) => p.rateNames.length > 0 && featureInput.trim().length > 0 && p.name.toLowerCase().includes(featureInput.trim().toLowerCase())
  )

  const importedFromPlanIdRef = useRef<number | null>(null)

  const handleImportPlanRates = (plan: ExistingPlanSummary) => {
    const existing = new Set(features.map((f) => f.toLowerCase()))
    const newRates = plan.rateNames.filter((name) => name.trim() && !existing.has(name.toLowerCase()))
    importedFromPlanRef.current = plan.name
    importedFromPlanIdRef.current = plan.id
    setImportedFromPlan(plan.name)
    setFeatures((prev) => [...prev, ...newRates])
    setFeatureInput("")
    setShowPlanDropdown(false)
    setSelectedTagIndex(null)
  }

  // Close dropdown on outside click
  useEffect(() => {
    if (!showPlanDropdown) return
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowPlanDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [showPlanDropdown])

  const inputWithPrefix =
    "flex h-[30px] w-full items-center gap-[8px] rounded-[6px] border border-[#D8DEE4] bg-white px-3 text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] hover:border-[#B6C0CD] focus-within:shadow-[0_0_0_1.5px_#A0D0F7] focus-within:border-[#A0D0F7] transition-all"

  return (
    <div className="flex flex-col gap-[12px] min-w-0">
      <FormRow label={t("Plan name")}>
        <input
          type="text"
          className={textFieldInputClasses}
          placeholder={t("e.g. Starter")}
          value={planName}
          onChange={(e) => setPlanName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSubmit() }}
          onFocus={() => setFocusedField("plan.name")}
          onBlur={() => setFocusedField(null)}
          autoFocus
        />
      </FormRow>

      <FormRow label={t("Subscription fee")}>
        <div className="flex items-center">
          <div className={`relative flex-1 ${inputWithPrefix} rounded-r-none focus-within:z-10`}>
            <span className="text-[#6C7688]">$</span>
            <input
              className="w-full bg-transparent outline-none placeholder:text-[#6C7688] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44]"
              placeholder={t("0")}
              inputMode="decimal"
              value={costPerMonth}
              onChange={(e) => setCostPerMonth(e.target.value.replace(/[^0-9.]/g, ""))}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmit() }}
              onFocus={() => setFocusedField("subscriptionFee.amount")}
              onBlur={() => setFocusedField(null)}
            />
          </div>
          <div className="shrink-0 -ml-px">
            <Selector
              ariaLabel={t("Period")}
              size="sm"
              value={costPeriod}
              onChange={setCostPeriod}
              options={periodOptions}
              getDisplayValue={t}
              buttonClassName="h-[30px] px-[12px] py-[6px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] rounded-r-[6px] rounded-l-none"
            />
          </div>
        </div>
        {costPeriod === "Custom" && (
          <div className="mt-[6px] flex flex-col gap-[6px]">
            <span className={FORM_LABEL_TEXT_CLASSES}>{t("Every")}</span>
            <div className="flex items-center">
              <input
                type="text"
                inputMode="numeric"
                className="h-[30px] w-[72px] shrink-0 rounded-l-[6px] rounded-r-none border border-[#D8DEE4] bg-white px-3 text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] placeholder:text-[#6C7688] hover:border-[#B6C0CD] focus:shadow-[0_0_0_1.5px_#A0D0F7] focus:border-[#A0D0F7] focus:z-10 focus:outline-none transition-all"
                placeholder="0"
                value={costCustomCount}
                onChange={(e) => setCostCustomCount(e.target.value.replace(/[^0-9]/g, ""))}
              />
              <div className="shrink-0 -ml-px">
                <Selector
                  ariaLabel={t("Unit")}
                  size="sm"
                  value={costCustomUnit}
                  onChange={setCostCustomUnit}
                  options={customUnitOptions}
                  getDisplayValue={t}
                  buttonClassName="h-[30px] px-[12px] py-[6px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] rounded-r-[6px] rounded-l-none"
                />
              </div>
            </div>
          </div>
        )}
      </FormRow>

      <FormRow label={t("Credit grant")}>
        <div className="flex items-center">
          <div className={`relative flex-1 ${inputWithPrefix} rounded-r-none focus-within:z-10`}>
            <span className="text-[#6C7688]">$</span>
            <input
              className="w-full bg-transparent outline-none placeholder:text-[#6C7688] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44]"
              placeholder={t("0")}
              inputMode="decimal"
              value={freeCreditsAmount}
              onChange={(e) => setFreeCreditsAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmit() }}
              onFocus={() => setFocusedField("creditGrant.amount")}
              onBlur={() => setFocusedField(null)}
            />
          </div>
          <div className="shrink-0 -ml-px">
            <Selector
              ariaLabel={t("Period")}
              size="sm"
              value={freeCreditsPeriod}
              onChange={setFreeCreditsPeriod}
              options={periodOptions}
              getDisplayValue={t}
              buttonClassName="h-[30px] px-[12px] py-[6px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] rounded-r-[6px] rounded-l-none"
            />
          </div>
        </div>
        {freeCreditsPeriod === "Custom" && (
          <div className="mt-[6px] flex flex-col gap-[6px]">
            <span className={FORM_LABEL_TEXT_CLASSES}>{t("Every")}</span>
            <div className="flex items-center">
              <input
                type="text"
                inputMode="numeric"
                className="h-[30px] w-[72px] shrink-0 rounded-l-[6px] rounded-r-none border border-[#D8DEE4] bg-white px-3 text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] placeholder:text-[#6C7688] hover:border-[#B6C0CD] focus:shadow-[0_0_0_1.5px_#A0D0F7] focus:border-[#A0D0F7] focus:z-10 focus:outline-none transition-all"
                placeholder="0"
                value={freeCreditsCustomCount}
                onChange={(e) => setFreeCreditsCustomCount(e.target.value.replace(/[^0-9]/g, ""))}
              />
              <div className="shrink-0 -ml-px">
                <Selector
                  ariaLabel={t("Unit")}
                  size="sm"
                  value={freeCreditsCustomUnit}
                  onChange={setFreeCreditsCustomUnit}
                  options={customUnitOptions}
                  getDisplayValue={t}
                  buttonClassName="h-[30px] px-[12px] py-[6px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] rounded-r-[6px] rounded-l-none"
                />
              </div>
            </div>
          </div>
        )}
      </FormRow>

      <FormRow label={t("Prices included in this plan")}>
        <div className="relative" ref={dropdownRef}>
          <div
            className={`flex h-[30px] w-full items-center rounded-[6px] border bg-white px-3 transition-all cursor-text ${
              isFeatureInputFocused
                ? "border-[#A0D0F7] shadow-[0_0_0_1.5px_#A0D0F7]"
                : "border-[#D8DEE4] hover:border-[#B6C0CD]"
            }`}
            onClick={() => featureInputRef.current?.focus()}
          >
            <input
              ref={featureInputRef}
              type="text"
              className="w-full bg-transparent text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] placeholder:text-[#6C7688] outline-none"
              placeholder={t("e.g Credits, API calls, Bandwidth")}
              value={featureInput}
              onChange={(e) => {
                handleFeatureInputChange(e)
                setShowPlanDropdown(true)
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && matchingPlans.length > 0 && showPlanDropdown) {
                  e.preventDefault()
                  handleImportPlanRates(matchingPlans[0])
                  return
                }
                handleFeatureKeyDown(e)
              }}
              onFocus={() => { setIsFeatureInputFocused(true); setShowPlanDropdown(true); setFocusedField("rateCard.name") }}
              onBlur={() => { setIsFeatureInputFocused(false); setSelectedTagIndex(null); setFocusedField(null) }}
            />
          </div>

          {showPlanDropdown && matchingPlans.length > 0 && (
            <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 rounded-[8px] border border-[#D4DEE9] bg-white shadow-[0px_5px_15px_0px_rgba(0,0,0,0.12)] overflow-hidden">
              {matchingPlans.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  className="flex w-full items-center justify-between px-[12px] py-[8px] text-left hover:bg-[#F4F7FA] transition-colors"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    handleImportPlanRates(plan)
                  }}
                >
                  <div className="flex items-center gap-[8px] min-w-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10" fill="none" className="shrink-0">
                      <path d="M5.75 0.75C5.75 0.335786 5.41421 0 5 0C4.58579 0 4.25 0.335786 4.25 0.75V4.25H0.75C0.335786 4.25 0 4.58579 0 5C0 5.41421 0.335786 5.75 0.75 5.75H4.25V9.25C4.25 9.66421 4.58579 10 5 10C5.41421 10 5.75 9.66421 5.75 9.25V5.75H9.25C9.66421 5.75 10 5.41421 10 5C10 4.58579 9.66421 4.25 9.25 4.25H5.75V0.75Z" fill="#675DFF"/>
                    </svg>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[12px] font-[500] leading-[16px] text-[#1A2C44] truncate">{plan.name}</span>
                      <span className="text-[11px] font-[400] leading-[14px] text-[#6C7688]">{t("Add all rates from")} {plan.name}</span>
                    </div>
                  </div>
                  <span className="shrink-0 text-[12px] font-[400] leading-[16px] text-[#6C7688]">{plan.rateNames.length} {t("rates")}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <p className="mt-[4px] text-[11px] font-[400] leading-[14px] text-[#6C7688]">
          {t("Press comma or Enter to add")}
        </p>
        {features.length > 0 && (
          <div className="mt-[8px] flex flex-wrap items-start gap-[8px]">
            {features.map((tag, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-[4px] rounded-[4px] border px-[6px] py-[2px] text-[12px] font-[400] leading-[16px] transition-colors ${
                  selectedTagIndex === i
                    ? "border-[#B6C0CD] bg-[#E5ECF3] text-[#3C4F69]"
                    : "border-[#D4DEE9] bg-[#F4F7FA] text-[#50617A]"
                }`}
              >
                {tag}
                <button
                  type="button"
                  className="flex items-center justify-center rounded-[2px] text-[#3C4F69] hover:bg-[#E5ECF3] transition-colors"
                  onClick={(e) => { e.stopPropagation(); removeFeatureTag(i) }}
                  aria-label={`${t("Remove")} ${tag}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 10 10" fill="none">
                    <path fillRule="evenodd" clipRule="evenodd" d="M0.248959 0.248959C0.580905 -0.0829864 1.1191 -0.0829864 1.45104 0.248959L5 3.79792L8.54896 0.248959C8.88091 -0.0829864 9.4191 -0.0829864 9.75104 0.248959C10.083 0.580905 10.083 1.1191 9.75104 1.45104L6.20208 5L9.75104 8.54896C10.083 8.88091 10.083 9.4191 9.75104 9.75104C9.4191 10.083 8.88091 10.083 8.54896 9.75104L5 6.20208L1.45104 9.75104C1.1191 10.083 0.580905 10.083 0.248959 9.75104C-0.0829864 9.4191 -0.0829864 8.88091 0.248959 8.54896L3.79792 5L0.248959 1.45104C-0.0829864 1.1191 -0.0829864 0.580905 0.248959 0.248959Z" fill="currentColor"/>
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}

        {importedFromPlan && features.length > 0 && (
          <div className="mt-[12px] rounded-[8px] bg-[#F4F7FA] p-[16px]">
            <p className="text-[12px] font-[400] leading-[16px] text-[#1A2C44]">
              {t("To reuse prices from")} {importedFromPlan}{t(", a price group will be created. A price group can be reused across plans.")}
            </p>
          </div>
        )}
      </FormRow>

      {/* Submit button — primary style; hidden when host (modal header) renders it instead */}
      {!hideInlineSubmit && (
        <div className="px-4">
          <button
            type="button"
            className={`flex h-[34px] w-full items-center justify-center rounded-[6px] border text-[12px] font-[600] leading-[16px] tracking-[-0.024px] transition-colors ${
              canSubmit
                ? "border-[#533AFD] bg-[#533AFD] text-white hover:bg-[#4730E0]"
                : "border-[#A99CFE] bg-[#A99CFE] text-white cursor-not-allowed"
            }`}
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {t("Get started")}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main PlanGetStarted ──────────────────────────────────────────────
export function PlanGetStarted({
  t,
  onSelect,
  onSkip,
  onHoverOption,
  onFormSubmit,
  onFormChange,
  submitRef,
  onCanSubmitChange,
  hideInlineSubmit,
  existingPlans,
}: PlanGetStartedProps) {
  const { onboardingMode } = useOnboardingMode()
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleEnter = useCallback(
    (kind: QuickStartKind) => {
      if (leaveTimer.current) {
        clearTimeout(leaveTimer.current)
        leaveTimer.current = null
      }
      onHoverOption?.(kind)
    },
    [onHoverOption]
  )

  const handleLeave = useCallback(() => {
    leaveTimer.current = setTimeout(() => {
      onHoverOption?.(null)
      leaveTimer.current = null
    }, 75)
  }, [onHoverOption])

  const showForm = onboardingMode === "form" && onFormSubmit

  return (
    <div className={`flex flex-col ${showForm ? "pt-[16px]" : "gap-[12px] px-[16px] pt-[16px]"}`}>
      {/* Header */}
      <div className={`flex flex-col gap-[2px] ${showForm ? "px-4 pb-[12px]" : ""}`}>
        <p className="text-[14px] font-[500] leading-[20px] tracking-[-0.15px] text-[#1A2C44]">
          {t("Get started")}
        </p>
        <p className="text-[12px] font-[400] leading-[16px] text-[#50617A]">
          {showForm ? t("Create a new pricing plan") : t("Choose a pricing structure for your plan")}
        </p>
      </div>

      {/* Content: form or plan type cards based on onboardingMode */}
      {showForm ? (
        <InlineWizardForm
          t={t}
          onSubmit={onFormSubmit}
          onFormChange={onFormChange}
          submitRef={submitRef}
          onCanSubmitChange={onCanSubmitChange}
          hideInlineSubmit={hideInlineSubmit}
          existingPlans={existingPlans}
        />
      ) : (
        <PlanTypeCards t={t} onSelect={onSelect} onSkip={onSkip} onEnter={handleEnter} onLeave={handleLeave} />
      )}
    </div>
  )
}

// ── Plan type cards (extracted from original) ────────────────────────
function PlanTypeCards({
  t,
  onSelect,
  onSkip,
  onEnter,
  onLeave,
}: {
  t: (key: string) => string
  onSelect: (kind: QuickStartKind) => void
  onSkip: () => void
  onEnter: (kind: QuickStartKind) => void
  onLeave: () => void
}) {
  return (
    <>
      {OPTIONS.map((opt) => (
        <button
          key={opt.kind}
          type="button"
          className="group flex flex-col gap-[12px] items-start rounded-[6px] border border-[#D4DEE9] bg-white px-[16px] py-[12px] text-left transition-all duration-150 hover:border-[#A0B0C4] hover:bg-[#FAFBFC]"
          onClick={() => onSelect(opt.kind)}
          onMouseEnter={() => onEnter(opt.kind)}
          onMouseLeave={onLeave}
        >
          <div className="flex items-center justify-center rounded-full bg-[#F4F7FA] p-[8px] transition-colors duration-150 group-hover:bg-[#D4DEE9]">
            {opt.icon}
          </div>
          <div className="flex flex-col gap-[4px]">
            <p className="text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#273951]">
              {t(opt.title)}
            </p>
            <p className="text-[12px] font-[400] leading-[16px] text-[#50617A]">
              {t(opt.description)}
            </p>
          </div>
        </button>
      ))}

    </>
  )
}
