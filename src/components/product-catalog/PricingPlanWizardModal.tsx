'use client'

import type { MouseEvent as ReactMouseEvent } from "react"
import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Selector } from "@/components/Selector"
import { useMerchantComponents } from "@/components/product-catalog/merchantComponents"
import { SIMULATED_RATE_CARDS } from "@/lib/simulated-merchant-components"

export type WizardData =
  | {
      mode: "new"
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
  | {
      mode: "existing"
      planName: string
      startEmpty?: boolean
      pickedSubscriptionFeeIds: string[]
      newSubscriptionFees: { name: string; amount: string; period: string; customCount?: string; customUnit?: string }[]
      pickedRateCardIds: string[]
      newRateCards: { name: string; rates: string[] }[]
      pickedCreditGrantIds: string[]
      newCreditGrants: { name: string; amount: string; period: string; customCount?: string; customUnit?: string }[]
    }

type PricingPlanWizardModalProps = {
  t: (key: string) => string
  onConfirm: (data: WizardData) => void
  onCancel: () => void
  /** Skip the wizard and open a blank plan editor. */
  onSkip?: () => void
  /** When true, play exit animation (card out first, then backdrop). */
  isExiting?: boolean
  /** Fires when the card exit animation completes. */
  onCardExited?: () => void
  /** Fires when the backdrop fade completes (safe to unmount). */
  onBackdropExited?: () => void
}

const periodOptions = ["Monthly", "Yearly", "Custom"]
const customUnitOptions = ["days", "weeks", "months", "years"]

// Typography tokens
const fieldLabel = "text-[16px] font-[600] leading-[24px] tracking-[-0.31px] text-[#1A2C44]"
const fieldHint = "mt-[2px] text-[12px] font-[400] text-[#6C7688]"

// Input styling (40px height)
const inputBase =
  "h-[40px] w-full rounded-[8px] border border-[#D8DEE4] bg-white px-[12px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] placeholder:text-[#667691] hover:border-[#B6C0CD] focus:border-[#A0D0F7] focus:shadow-[0_0_0_1.5px_#A0D0F7] focus:outline-none transition-all"
const inputWithPrefix =
  "flex h-[40px] w-full items-center gap-[8px] rounded-[8px] border border-[#D8DEE4] bg-white px-[12px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] hover:border-[#B6C0CD] focus-within:border-[#A0D0F7] focus-within:shadow-[0_0_0_1.5px_#A0D0F7] transition-all"

// Custom interval row (shown when Custom period selected)
function CustomIntervalRow({
  t,
  count,
  unit,
  onCountChange,
  onUnitChange,
}: {
  t: (key: string) => string
  count: string
  unit: string
  onCountChange: (v: string) => void
  onUnitChange: (v: string) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
    >
      <div className="mt-[8px] flex flex-col gap-[6px]">
        <label className="text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#667691]">{t("Every")}</label>
        <div className="flex items-center">
          <input
            type="text"
            inputMode="numeric"
            className="relative h-[40px] w-[72px] shrink-0 rounded-l-[8px] rounded-r-none border border-[#D8DEE4] bg-white px-[12px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] placeholder:text-[#667691] hover:border-[#B6C0CD] focus:border-[#A0D0F7] focus:shadow-[0_0_0_1.5px_#A0D0F7] focus:z-10 focus:outline-none transition-all"
            placeholder="2"
            value={count}
            onChange={(e) => onCountChange(e.target.value.replace(/[^0-9]/g, ""))}
          />
          <div className="shrink-0 -ml-px">
            <Selector
              ariaLabel={t("Unit")}
              size="sm"
              value={unit}
              onChange={onUnitChange}
              options={customUnitOptions}
              getDisplayValue={t}
              buttonClassName="h-[40px] px-[12px] py-[8px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] rounded-r-[8px] rounded-l-none"
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Selectable chip for rate cards
function SelectableChip({
  label,
  detail,
  selected,
  onClick,
}: {
  label: string
  detail?: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-[6px] rounded-[8px] border px-[12px] py-[8px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] transition-all ${
        selected
          ? "border-[#675DFF] bg-[#F5F4FF] text-[#533AFD]"
          : "border-[#D8DEE4] bg-white text-[#353A44] hover:border-[#B6C0CD] hover:bg-[#FAFBFC]"
      }`}
    >
      {selected && (
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 6L5 9L10 3" stroke="#675DFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
      <span>{label}</span>
      {detail && <span className="text-[#667691] font-[500]">{detail}</span>}
    </button>
  )
}

export function PricingPlanWizardModal({ t, onConfirm, onCancel, onSkip, isExiting, onCardExited, onBackdropExited }: PricingPlanWizardModalProps) {
  const { hasComponents } = useMerchantComponents()

  // Shared state
  const [planName, setPlanName] = useState("")
  const nameInputRef = useRef<HTMLInputElement>(null)

  // Subscription fee (shared across modes)
  const [costPerMonth, setCostPerMonth] = useState("")
  const [costPeriod, setCostPeriod] = useState("Monthly")
  const [costCustomCount, setCostCustomCount] = useState("")
  const [costCustomUnit, setCostCustomUnit] = useState("months")

  // Credit grant (shared across modes)
  const [freeCreditsAmount, setFreeCreditsAmount] = useState("")
  const [freeCreditsPeriod, setFreeCreditsPeriod] = useState("Monthly")
  const [freeCreditsCustomCount, setFreeCreditsCustomCount] = useState("")
  const [freeCreditsCustomUnit, setFreeCreditsCustomUnit] = useState("months")

  // === "new" mode state ===
  const [features, setFeatures] = useState<string[]>([])
  const [featureInput, setFeatureInput] = useState("")
  const [isFeatureInputFocused, setIsFeatureInputFocused] = useState(false)
  const [selectedTagIndex, setSelectedTagIndex] = useState<number | null>(null)
  const featureInputRef = useRef<HTMLInputElement>(null)

  // === "existing" mode state (rate cards only) ===
  const [selectedRateCardIds, setSelectedRateCardIds] = useState<Set<string>>(new Set())

  // Inline new rate card form
  const [showNewRateCard, setShowNewRateCard] = useState(false)
  const [newRateCardName, setNewRateCardName] = useState("")
  const [newRateCardRates, setNewRateCardRates] = useState<string[]>([])
  const [newRateCardRateInput, setNewRateCardRateInput] = useState("")
  const [isRateInputFocused, setIsRateInputFocused] = useState(false)
  const [selectedRateTagIndex, setSelectedRateTagIndex] = useState<number | null>(null)
  const rateInputRef = useRef<HTMLInputElement>(null)

  // Focus name input on mount
  useEffect(() => {
    requestAnimationFrame(() => {
      nameInputRef.current?.focus()
      nameInputRef.current?.select()
    })
  }, [])

  // Lock body scroll while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [])

  // Close on Escape (only when not exiting)
  useEffect(() => {
    if (isExiting) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel()
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [onCancel, isExiting])

  // Track exit phases: card exits first, then backdrop
  const [cardExited, setCardExited] = useState(false)
  useEffect(() => {
    if (!isExiting) { setCardExited(false); return }
  }, [isExiting])

  const canConfirm = planName.trim().length > 0

  // === Confirm handler ===
  const handleConfirm = () => {
    if (!canConfirm) return

    if (hasComponents) {
      // Collect inline new rate card from open form
      const newRateCards: { name: string; rates: string[] }[] = []
      if (showNewRateCard && newRateCardName.trim()) {
        const finalRates = [...newRateCardRates]
        const pendingRate = newRateCardRateInput.trim()
        if (pendingRate && !finalRates.some((r) => r.toLowerCase() === pendingRate.toLowerCase())) {
          finalRates.push(pendingRate)
        }
        newRateCards.push({ name: newRateCardName.trim(), rates: finalRates })
      }

      // Build subscription fee from form
      const newSubscriptionFees: { name: string; amount: string; period: string; customCount?: string; customUnit?: string }[] = []
      if (parseFloat(costPerMonth) > 0) {
        newSubscriptionFees.push({
          name: `${planName.trim()} \u2014 Subscription Fee`,
          amount: costPerMonth.trim(),
          period: costPeriod,
          ...(costPeriod === "Custom" ? { customCount: costCustomCount, customUnit: costCustomUnit } : {}),
        })
      }

      // Build credit grant from form
      const newCreditGrants: { name: string; amount: string; period: string; customCount?: string; customUnit?: string }[] = []
      if (parseFloat(freeCreditsAmount) > 0) {
        newCreditGrants.push({
          name: `${planName.trim()} \u2014 Credits`,
          amount: freeCreditsAmount.trim(),
          period: freeCreditsPeriod,
          ...(freeCreditsPeriod === "Custom" ? { customCount: freeCreditsCustomCount, customUnit: freeCreditsCustomUnit } : {}),
        })
      }

      onConfirm({
        mode: "existing",
        planName: planName.trim(),
        pickedRateCardIds: Array.from(selectedRateCardIds),
        newRateCards,
        pickedSubscriptionFeeIds: [],
        newSubscriptionFees,
        pickedCreditGrantIds: [],
        newCreditGrants,
      })
    } else {
      const finalFeatures = [...features]
      const pending = featureInput.trim()
      if (pending && !finalFeatures.some((f) => f.toLowerCase() === pending.toLowerCase())) {
        finalFeatures.push(pending)
      }
      onConfirm({
        mode: "new",
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
      })
    }
  }

  // === Tag input helpers (new mode) ===
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
      for (const part of parts.slice(0, -1)) {
        addFeatureTag(part)
      }
      setFeatureInput(parts[parts.length - 1])
    } else {
      setFeatureInput(val)
    }
  }

  // === Rate card select (existing mode — single selection) ===
  const selectRateCard = (id: string) => {
    setSelectedRateCardIds((prev) => {
      if (prev.has(id)) return new Set()
      return new Set([id])
    })
  }

  // === Rate card rate tag helpers ===
  const addRateTag = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    if (newRateCardRates.some((r) => r.toLowerCase() === trimmed.toLowerCase())) return
    setNewRateCardRates((prev) => [...prev, trimmed])
    setNewRateCardRateInput("")
    setSelectedRateTagIndex(null)
  }

  const removeRateTag = (index: number) => {
    setNewRateCardRates((prev) => prev.filter((_, i) => i !== index))
    setSelectedRateTagIndex(null)
  }

  const handleRateKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addRateTag(newRateCardRateInput)
    } else if (e.key === "Backspace" && newRateCardRateInput === "" && newRateCardRates.length > 0) {
      if (selectedRateTagIndex != null) {
        setNewRateCardRates((prev) => prev.filter((_, i) => i !== selectedRateTagIndex))
        setSelectedRateTagIndex(null)
      } else {
        setSelectedRateTagIndex(newRateCardRates.length - 1)
      }
    } else if (selectedRateTagIndex != null) {
      setSelectedRateTagIndex(null)
    }
  }

  const handleRateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (val.includes(",")) {
      const parts = val.split(",")
      for (const part of parts.slice(0, -1)) addRateTag(part)
      setNewRateCardRateInput(parts[parts.length - 1])
    } else {
      setNewRateCardRateInput(val)
    }
  }

  // === Shared field: Subscription fee (amount + period + custom) ===
  const subscriptionFeeField = (
    <div>
      <label className={fieldLabel}>{t("What's the subscription fee?")}</label>
      <div className="mt-[8px] flex items-center">
        <div className={`relative flex-1 ${inputWithPrefix} rounded-r-none focus-within:z-10`}>
          <span className="text-[#667691]">$</span>
          <input
            className="w-full bg-transparent outline-none placeholder:text-[#667691]"
            placeholder={t("0")}
            inputMode="decimal"
            value={costPerMonth}
            onChange={(e) => setCostPerMonth(e.target.value.replace(/[^0-9.]/g, ""))}
            onKeyDown={(e) => { if (e.key === "Enter") handleConfirm() }}
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
            buttonClassName="h-[40px] px-[12px] py-[8px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] rounded-r-[8px] rounded-l-none"
          />
        </div>
      </div>
      <AnimatePresence>
        {costPeriod === "Custom" && (
          <CustomIntervalRow
            t={t}
            count={costCustomCount}
            unit={costCustomUnit}
            onCountChange={setCostCustomCount}
            onUnitChange={setCostCustomUnit}
          />
        )}
      </AnimatePresence>
    </div>
  )

  // === Shared field: Credit grant (amount + period + custom) ===
  const creditGrantField = (
    <div>
      <label className={fieldLabel}>{t("What's the credit grant amount?")}</label>
      <div className="mt-[8px] flex items-center">
        <div className={`relative flex-1 ${inputWithPrefix} rounded-r-none focus-within:z-10`}>
          <span className="text-[#667691]">$</span>
          <input
            className="w-full bg-transparent outline-none placeholder:text-[#667691]"
            placeholder={t("0")}
            inputMode="decimal"
            value={freeCreditsAmount}
            onChange={(e) => setFreeCreditsAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            onKeyDown={(e) => { if (e.key === "Enter") handleConfirm() }}
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
            buttonClassName="h-[40px] px-[12px] py-[8px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] rounded-r-[8px] rounded-l-none"
          />
        </div>
      </div>
      <AnimatePresence>
        {freeCreditsPeriod === "Custom" && (
          <CustomIntervalRow
            t={t}
            count={freeCreditsCustomCount}
            unit={freeCreditsCustomUnit}
            onCountChange={setFreeCreditsCustomCount}
            onUnitChange={setFreeCreditsCustomUnit}
          />
        )}
      </AnimatePresence>
    </div>
  )

  // === Render: Conversational name field ===
  const nameField = (
    <div>
      <label className={fieldLabel}>{t("What's the name of this plan?")}</label>
      <input
        ref={nameInputRef}
        type="text"
        className={`mt-[8px] ${inputBase}`}
        placeholder={t("e.g. Starter")}
        value={planName}
        onChange={(e) => setPlanName(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") handleConfirm() }}
      />
    </div>
  )

  // === Render: "new" mode — usage tracking tag input ===
  const usageTrackingField = (
    <div>
      <label className={fieldLabel}>{t("What usage will customers be billed for?")}</label>
      <div
        className={`mt-[8px] flex min-h-[40px] w-full flex-wrap items-center gap-[4px] rounded-[8px] border bg-white px-[12px] py-[6px] transition-all cursor-text ${
          isFeatureInputFocused
            ? "border-[#A0D0F7] shadow-[0_0_0_1.5px_#A0D0F7]"
            : "border-[#D8DEE4] hover:border-[#B6C0CD]"
        }`}
        onClick={() => featureInputRef.current?.focus()}
      >
        {features.map((tag, i) => (
          <span
            key={i}
            className={`inline-flex items-center gap-[4px] rounded-[6px] px-[8px] py-[3px] text-[12px] font-[500] transition-colors ${
              selectedTagIndex === i
                ? "bg-[#675DFF] text-white"
                : "bg-[#F0EEFF] text-[#533AFD]"
            }`}
          >
            {tag}
            <button
              type="button"
              className="flex items-center justify-center rounded-[2px] hover:bg-[#DDD9FF] transition-colors"
              onClick={(e) => { e.stopPropagation(); removeFeatureTag(i) }}
              aria-label={`${t("Remove")} ${tag}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 10 10" fill="none">
                <path fillRule="evenodd" clipRule="evenodd" d="M0.248959 0.248959C0.580905 -0.0829864 1.1191 -0.0829864 1.45104 0.248959L5 3.79792L8.54896 0.248959C8.88091 -0.0829864 9.4191 -0.0829864 9.75104 0.248959C10.083 0.580905 10.083 1.1191 9.75104 1.45104L6.20208 5L9.75104 8.54896C10.083 8.88091 10.083 9.4191 9.75104 9.75104C9.4191 10.083 8.88091 10.083 8.54896 9.75104L5 6.20208L1.45104 9.75104C1.1191 10.083 0.580905 10.083 0.248959 9.75104C-0.0829864 9.4191 -0.0829864 8.88091 0.248959 8.54896L3.79792 5L0.248959 1.45104C-0.0829864 1.1191 -0.0829864 0.580905 0.248959 0.248959Z" fill="currentColor"/>
              </svg>
            </button>
          </span>
        ))}
        <input
          ref={featureInputRef}
          type="text"
          className="min-w-[120px] flex-1 bg-transparent text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] placeholder:text-[#667691] outline-none"
          placeholder={features.length === 0 ? t("API calls, Storage, Bandwidth") : ""}
          value={featureInput}
          onChange={handleFeatureInputChange}
          onKeyDown={handleFeatureKeyDown}
          onFocus={() => setIsFeatureInputFocused(true)}
          onBlur={() => { setIsFeatureInputFocused(false); setSelectedTagIndex(null) }}
        />
      </div>
      <p className={`mt-[4px] ${fieldHint}`}>{t("Comma or Enter to add")}</p>
    </div>
  )

  // === Render: "existing" mode — rate card chips ===
  const rateCardChipsField = (
    <div>
      <label className={fieldLabel}>{t("What usage will customers be billed for?")}</label>
      <p className="mt-[2px] text-[14px] font-[400] leading-[20px] tracking-[-0.15px] text-[#7D8BA4]">{t("Select a rate card.")}</p>
      <div className="mt-[10px] flex flex-wrap gap-[8px]">
        {SIMULATED_RATE_CARDS.map((rc) => (
          <SelectableChip
            key={rc.id}
            label={rc.name}
            detail={`${rc.rates.length} ${rc.rates.length === 1 ? t("rate") : t("rates")}`}
            selected={selectedRateCardIds.has(rc.id)}
            onClick={() => selectRateCard(rc.id)}
          />
        ))}
        {!showNewRateCard && (
          <button
            type="button"
            onClick={() => setShowNewRateCard(true)}
            className="inline-flex items-center gap-[6px] rounded-full border border-[#D8DEE4] bg-white px-[14px] py-[8px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#353A44] hover:border-[#B6C0CD] hover:bg-[#F5F6F8] transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 2V10M2 6H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {t("Create new")}
          </button>
        )}
      </div>
      <AnimatePresence>
        {showNewRateCard && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <div className="mt-[10px] flex flex-col gap-[8px]">
              <input
                type="text"
                className={inputBase}
                placeholder={t("Rate card name")}
                value={newRateCardName}
                onChange={(e) => setNewRateCardName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Escape") { setShowNewRateCard(false); setNewRateCardName(""); setNewRateCardRates([]); setNewRateCardRateInput("") } }}
                autoFocus
              />
              <div
                className={`flex min-h-[40px] w-full flex-wrap items-center gap-[4px] rounded-[8px] border bg-white px-[12px] py-[6px] transition-all cursor-text ${
                  isRateInputFocused
                    ? "border-[#A0D0F7] shadow-[0_0_0_1.5px_#A0D0F7]"
                    : "border-[#D8DEE4] hover:border-[#B6C0CD]"
                }`}
                onClick={() => rateInputRef.current?.focus()}
              >
                {newRateCardRates.map((tag, i) => (
                  <span
                    key={i}
                    className={`inline-flex items-center gap-[4px] rounded-[6px] px-[8px] py-[3px] text-[12px] font-[500] transition-colors ${
                      selectedRateTagIndex === i
                        ? "bg-[#675DFF] text-white"
                        : "bg-[#F0EEFF] text-[#533AFD]"
                    }`}
                  >
                    {tag}
                    <button
                      type="button"
                      className="flex items-center justify-center rounded-[2px] hover:bg-[#DDD9FF] transition-colors"
                      onClick={(e) => { e.stopPropagation(); removeRateTag(i) }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 10 10" fill="none">
                        <path fillRule="evenodd" clipRule="evenodd" d="M0.248959 0.248959C0.580905 -0.0829864 1.1191 -0.0829864 1.45104 0.248959L5 3.79792L8.54896 0.248959C8.88091 -0.0829864 9.4191 -0.0829864 9.75104 0.248959C10.083 0.580905 10.083 1.1191 9.75104 1.45104L6.20208 5L9.75104 8.54896C10.083 8.88091 10.083 9.4191 9.75104 9.75104C9.4191 10.083 8.88091 10.083 8.54896 9.75104L5 6.20208L1.45104 9.75104C1.1191 10.083 0.580905 10.083 0.248959 9.75104C-0.0829864 9.4191 -0.0829864 8.88091 0.248959 8.54896L3.79792 5L0.248959 1.45104C-0.0829864 1.1191 -0.0829864 0.580905 0.248959 0.248959Z" fill="currentColor"/>
                      </svg>
                    </button>
                  </span>
                ))}
                <input
                  ref={rateInputRef}
                  type="text"
                  className="min-w-[80px] flex-1 bg-transparent text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] placeholder:text-[#667691] outline-none"
                  placeholder={newRateCardRates.length === 0 ? t("API requests, Storage") : ""}
                  value={newRateCardRateInput}
                  onChange={handleRateInputChange}
                  onKeyDown={handleRateKeyDown}
                  onFocus={() => setIsRateInputFocused(true)}
                  onBlur={() => { setIsRateInputFocused(false); setSelectedRateTagIndex(null) }}
                />
              </div>
              <p className={fieldHint}>{t("Comma or Enter to add")}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )

  // Backdrop: visible initially, fades out in phase 2 (after card exits)
  const backdropFadingOut = isExiting && cardExited

  return (
    <motion.div
      key="wizard-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(192,200,210,0.7)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: backdropFadingOut ? 0 : 1 }}
      transition={{ duration: backdropFadingOut ? 0.12 : 0.12, ease: "easeOut" }}
      onAnimationComplete={() => {
        if (backdropFadingOut) onBackdropExited?.()
      }}
      onClick={isExiting ? undefined : onCancel}
    >
      <motion.div
        className="relative w-[480px] max-h-[90vh] rounded-[16px] bg-white shadow-[0_25px_80px_rgba(15,23,42,0.35)] overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label={t("Tell us a few small details")}
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={
          isExiting
            ? { opacity: 0, scale: 0.97, y: 8 }
            : { opacity: 1, scale: 1, y: 0 }
        }
        transition={
          isExiting
            ? { duration: 0.15, ease: "easeIn" }
            : { type: "spring", stiffness: 340, damping: 30, mass: 0.7 }
        }
        onAnimationComplete={() => {
          if (isExiting && !cardExited) {
            setCardExited(true)
            onCardExited?.()
          }
        }}
        onClick={(e: ReactMouseEvent) => e.stopPropagation()}
      >
          {/* Close button */}
          <button
            type="button"
            className="absolute top-[16px] right-[16px] z-10 flex h-[28px] w-[28px] items-center justify-center rounded-[8px] text-[#6C7688] transition-colors hover:bg-[#F5F6F8] hover:text-[#353A44]"
            onClick={onCancel}
            aria-label={t("Close")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path fillRule="evenodd" clipRule="evenodd" d="M0.248959 0.248959C0.580905 -0.0829864 1.1191 -0.0829864 1.45104 0.248959L5 3.79792L8.54896 0.248959C8.88091 -0.0829864 9.4191 -0.0829864 9.75104 0.248959C10.083 0.580905 10.083 1.1191 9.75104 1.45104L6.20208 5L9.75104 8.54896C10.083 8.88091 10.083 9.4191 9.75104 9.75104C9.4191 10.083 8.88091 10.083 8.54896 9.75104L5 6.20208L1.45104 9.75104C1.1191 10.083 0.580905 10.083 0.248959 9.75104C-0.0829864 9.4191 -0.0829864 8.88091 0.248959 8.54896L3.79792 5L0.248959 1.45104C-0.0829864 1.1191 -0.0829864 0.580905 0.248959 0.248959Z" fill="#474E5A"/>
            </svg>
          </button>

          {/* Header — pinned */}
          <div className="shrink-0 px-[40px] pt-[36px]">
            <h2 className="text-[20px] font-[400] leading-[28px] tracking-[-0.5px] text-black">
              {t("Tell us a few small details")}
            </h2>
            <p className="mt-[4px] text-[16px] font-[400] leading-[24px] tracking-[-0.31px] text-[#7D8BA4]">
              {t("You can add and edit more in the next step.")}
            </p>
          </div>

          {/* Scrollable fields */}
          <div className="min-h-0 flex-1 overflow-y-auto px-[40px] py-[24px] flex flex-col gap-[24px]">
            {nameField}
            {subscriptionFeeField}
            {creditGrantField}
            {hasComponents ? rateCardChipsField : usageTrackingField}
          </div>

          {/* Footer — pinned */}
          <div className="shrink-0 px-[40px] pb-[40px] flex flex-col items-center gap-[12px]">
            <button
              type="button"
              className={`flex h-[44px] w-full items-center justify-center gap-[8px] rounded-[10px] text-[16px] font-[600] leading-[24px] tracking-[-0.31px] text-white transition-all ${
                canConfirm
                  ? "bg-[#675DFF] hover:bg-[#5B52F0] active:scale-[0.99]"
                  : "bg-[#B0ADF0] cursor-not-allowed"
              }`}
              onClick={handleConfirm}
              disabled={!canConfirm}
            >
              {t("Get started")}
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
                <path d="M9.61872 1.38128C9.27701 1.03957 8.72299 1.03957 8.38128 1.38128C8.03957 1.72299 8.03957 2.27701 8.38128 2.61872L12.8876 7.125H1C0.516751 7.125 0.125 7.51675 0.125 8C0.125 8.48325 0.516751 8.875 1 8.875H12.8876L8.38128 13.3813C8.03957 13.723 8.03957 14.277 8.38128 14.6187C8.72299 14.9604 9.27701 14.9604 9.61872 14.6187L15.6187 8.61872C15.7896 8.44786 15.875 8.22393 15.875 8C15.875 7.77607 15.7896 7.55214 15.6187 7.38128L9.61872 1.38128Z" fill="currentColor"/>
              </svg>
            </button>
            {onSkip && (
              <button
                type="button"
                className="text-[14px] font-[500] leading-[20px] tracking-[-0.15px] text-[#7D8BA4] hover:text-[#353A44] transition-colors"
                onClick={onSkip}
              >
                {t("Skip")}
              </button>
            )}
          </div>
        </motion.div>
    </motion.div>
  )
}
