'use client'

import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react"
import { Selector } from "@/components/Selector"
import { TrashIcon } from "@/components/ProductCatalogIcons"
import { CatalogObjectGlyph } from "@/components/product-catalog/iconography"
import { cn } from "@/lib/utils"
import type { PricingPlanDraft } from "./productCatalogPage.types"
import { useReceiptCalculations, type PlanUsageEntry } from "./hooks/useReceiptCalculations"
import { useReceiptState } from "./hooks/useReceiptState"


type ReceiptCardProps = {
  t: (key: string) => string
  draft: PricingPlanDraft
  planId: number
  isCurrentPlan: boolean
  /** Whether to show the header. When false, the dark section gets rounded top corners. */
  showHeader?: boolean

  // Shared utilities
  numberFormatter: Intl.NumberFormat
  parseNumberValue: (value: string) => number
  formatCurrencyValue: (value: number, currency: string, minimumFractionDigits?: number) => string
  formatIntegerWithCommas: (raw: string) => string
  getPlanLabel: (value: string, fallback: string) => string
  getPlanRateLabel: (rate?: { id: number; name: string } | null) => string

  // External state (only used for current plan being edited)
  externalUsageState?: {
    planRateUsage: Record<number, string>
    setPlanRateUsage: Dispatch<SetStateAction<Record<number, string>>>
    planUsageScenarioRates: number[]
    setPlanUsageScenarioRates: Dispatch<SetStateAction<number[]>>
  }
}

export function ReceiptCard({
  t,
  draft,
  planId,
  isCurrentPlan,
  showHeader = true,
  numberFormatter,
  parseNumberValue,
  formatCurrencyValue,
  formatIntegerWithCommas,
  getPlanLabel,
  getPlanRateLabel,
  externalUsageState,
}: ReceiptCardProps) {
  // Consolidated state management - handles both local and external state
  const {
    rateUsage,
    setRateUsage,
    usageScenarioRates,
    setUsageScenarioRates,
  } = useReceiptState({ draft, isCurrentPlan, externalUsageState })

  // Track which rate is being dragged (for visual feedback)
  const [draggingRateId, setDraggingRateId] = useState<number | null>(null)
  // Track which rate row is being hovered (for trash icon visibility)
  const [hoveredRateId, setHoveredRateId] = useState<number | null>(null)
  // Usage modelling popover state
  const [usagePopoverOpen, setUsagePopoverOpen] = useState(false)
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null)
  const usagePopoverTriggerRef = useRef<HTMLButtonElement | null>(null)
  const usagePopoverRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handlePointerUp = () => setDraggingRateId(null)
    window.addEventListener("pointerup", handlePointerUp)
    window.addEventListener("pointercancel", handlePointerUp)
    return () => {
      window.removeEventListener("pointerup", handlePointerUp)
      window.removeEventListener("pointercancel", handlePointerUp)
    }
  }, [])

  // Close usage popover on outside click or Escape
  // Ignore clicks on dropdown portals / overlays that are rendered outside the popover DOM
  useEffect(() => {
    if (!usagePopoverOpen) return
    const onDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (
        !usagePopoverRef.current?.contains(target) &&
        !usagePopoverTriggerRef.current?.contains(target) &&
        // Don't close when interacting with dropdown portals (Selector overlays)
        !target.closest("[data-radix-popper-content-wrapper]") &&
        !target.closest("[role='listbox']") &&
        !target.closest("[role='option']") &&
        !target.closest("[data-selector-dropdown]")
      ) {
        setUsagePopoverOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setUsagePopoverOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [usagePopoverOpen])

  // Calculate receipt values
  const {
    planUsageEntries,
    planUsageTotal,
    planSubscriptionFeeAmount,
    planSubtotal,
    planSalesTax,
    planTotal,
  } = useReceiptCalculations({
    draft,
    rateUsage,
    usageScenarioRates,
    parseNumberValue,
    getPlanRateLabel,
  })

  const {
    planName,
    planDescription,
    planCurrency,
    planRateCards,
    planRateTiers,
    planRateTierToValues,
    planSubscriptionFees,
    planCreditGrants,
    subscriptionFeeAmounts,
    subscriptionFeePeriods,
    creditGrantAmounts,
    creditGrantPeriods,
  } = draft

  // Get all rates for dropdown
  const allRates = [...planRateCards.flatMap((card) => card.rates), ...(draft.planRates ?? [])]
  const canAddMoreRates = allRates.length > usageScenarioRates.length

  const handleAddRate = useCallback(() => {
    const existingIds = new Set(usageScenarioRates)
    const availableRate = allRates.find((r) => !existingIds.has(r.id))
    if (availableRate) {
      setUsageScenarioRates((prev) => [...prev, availableRate.id])
    }
  }, [usageScenarioRates, allRates, setUsageScenarioRates])

  // Compute credit grant total
  const creditGrantTotal = Object.values(creditGrantAmounts).reduce(
    (sum, value) => sum + (parseNumberValue(value ?? "0") ?? 0),
    0
  )

  // Get the most common period for subscription fees and credit grants (for display)
  const getSubscriptionFeePeriodLabel = () => {
    const periods = Object.values(subscriptionFeePeriods).filter(Boolean)
    if (periods.length === 0) return t("monthly")
    return (periods[0] ?? "Monthly").toLowerCase()
  }
  const getCreditGrantPeriodLabel = () => {
    const periods = Object.values(creditGrantPeriods).filter(Boolean)
    if (periods.length === 0) return t("yearly")
    return (periods[0] ?? "Yearly").toLowerCase()
  }

  return (
    <div className="overflow-visible rounded-[12px] bg-white">
      {/* Plan name and description */}
      <div className="flex flex-col">
        <div className="flex flex-col justify-end px-[16px] pb-[16px] pt-[80px]">
          <p className="text-[14px] font-[500] leading-[16px] tracking-[-0.028px] text-[#353A44]">
            {getPlanLabel(planName, t("Untitled pricing plan"))}
          </p>
          {planDescription ? (
            <p className="mt-[4px] text-[12px] font-[400] leading-[16px] text-[#596171]">
              {planDescription}
            </p>
          ) : null}
        </div>

        {/* Component line items */}
        <div className="flex flex-col gap-[8px] px-[16px] pb-[16px]">
          {/* Subscription fee */}
          {planSubscriptionFees.length > 0 ? (
            <div className="flex items-center justify-between rounded-[8px] bg-[#F5F6F8] px-[12px] py-[10px]">
              <div className="flex items-center gap-[8px]">
                <span className="flex size-[16px] shrink-0 items-center justify-center">
                  <CatalogObjectGlyph kind="subscriptionFee" />
                </span>
                <span className="text-[12px] font-[400] leading-[20px] tracking-[-0.15px] text-[#353A44]">
                  {t("Subscription fee")}
                </span>
              </div>
              <span className="text-[12px] font-[500] leading-[20px] tracking-[-0.15px] text-[#353A44]">
                {formatCurrencyValue(planSubscriptionFeeAmount, planCurrency, 2)} {getSubscriptionFeePeriodLabel()}
              </span>
            </div>
          ) : (
            <p className="text-[12px] font-[400] leading-[20px] tracking-[-0.15px] text-[#9AA5B4]">
              {t("No subscription fee")}
            </p>
          )}

          {/* Credit grant */}
          {planCreditGrants.length > 0 && (
            <div className="flex items-center justify-between rounded-[8px] bg-[#F5F6F8] px-[12px] py-[10px]">
              <div className="flex items-center gap-[8px]">
                <span className="flex size-[16px] shrink-0 items-center justify-center">
                  <CatalogObjectGlyph kind="creditGrant" />
                </span>
                <span className="text-[12px] font-[400] leading-[20px] tracking-[-0.15px] text-[#353A44]">
                  {t("Credit grant")}
                </span>
              </div>
              <span className="text-[12px] font-[500] leading-[20px] tracking-[-0.15px] text-[#353A44]">
                {formatCurrencyValue(creditGrantTotal, planCurrency, 2)} {getCreditGrantPeriodLabel()}
              </span>
            </div>
          )}

          {/* Usage line items – one per modelled rate */}
          {planUsageEntries.length > 0 ? (
            planUsageEntries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between rounded-[8px] bg-[#F5F6F8] px-[12px] py-[10px]">
                <div className="flex items-center gap-[8px]">
                  <span className="flex size-[16px] shrink-0 items-center justify-center">
                    <CatalogObjectGlyph kind="rate" />
                  </span>
                  <span className="text-[12px] font-[400] leading-[20px] tracking-[-0.15px] text-[#353A44]">
                    {entry.name}
                  </span>
                </div>
                <span className="text-[12px] font-[500] leading-[20px] tracking-[-0.15px] text-[#353A44]">
                  {formatCurrencyValue(entry.total, planCurrency, 2)}
                </span>
              </div>
            ))
          ) : (
            <p className="text-[12px] font-[400] leading-[20px] tracking-[-0.15px] text-[#9AA5B4]">
              {t("No rates")}
            </p>
          )}
        </div>
      </div>

      {/* Totals section */}
      <div className="flex flex-col gap-[10px] px-[16px] pt-[4px] pb-[16px]">
        <div className="flex flex-col gap-[6px]">
          <div className="flex items-baseline justify-between text-nowrap text-[#353A44]">
            <span className="text-[12px] font-[400] leading-[20px] tracking-[-0.15px]">{t("Subtotal")}</span>
            <span className="text-[12px] font-[500] leading-[20px] tracking-[-0.15px]">
              {formatCurrencyValue(planSubtotal, planCurrency, 2)}
            </span>
          </div>
          <div className="flex items-baseline justify-between text-nowrap">
            <div className="flex items-baseline gap-[2px] text-[12px] font-[400] leading-[20px] tracking-[-0.15px]">
              <span className="text-[#353A44]">{t("Sales tax")}</span>
              <span className="text-[#6C7688]">{" \u2219 "}</span>
              <span className="text-[#353A44]">5%</span>
            </div>
            <span className="text-[12px] font-[500] leading-[20px] tracking-[-0.15px] text-[#353A44]">
              {formatCurrencyValue(planSalesTax, planCurrency, 2)}
            </span>
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-[14px] font-[500] leading-[16px] tracking-[-0.028px] text-[#353A44]">
            {t("Total")}
          </span>
          <div className="flex items-baseline gap-[4px] text-nowrap font-[500]">
            <span className="text-[12px] leading-[16px] tracking-[-0.15px] text-[#596171]">
              {planCurrency}
            </span>
            <span className="text-[14px] leading-[16px] tracking-[-0.028px] text-[#353A44]">
              {formatCurrencyValue(planTotal, planCurrency, 2)}
            </span>
          </div>
        </div>
      </div>

      {/* Model usage button at the bottom */}
      <div className="relative px-[16px] pb-[16px]">
        <button
          ref={usagePopoverTriggerRef}
          type="button"
          className={cn(
            "inline-flex h-[32px] items-center gap-[6px] rounded-[6px] border px-[12px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] transition-colors",
            usagePopoverOpen
              ? "border-[#353A44] bg-[#353A44] text-white"
              : "border-[#D8DEE4] bg-white text-[#353A44] hover:bg-[#EBEEF1]"
          )}
          onClick={() => {
            if (!usagePopoverOpen && usagePopoverTriggerRef.current) {
              const rect = usagePopoverTriggerRef.current.getBoundingClientRect()
              setPopoverPos({
                top: rect.top, // bottom of popover aligns with top of button
                left: rect.left - 8, // right edge of popover sits 8px left of button
              })
            }
            setUsagePopoverOpen((v) => !v)
          }}
          aria-expanded={usagePopoverOpen}
        >
          {t("Model usage")}
        </button>

        {/* Usage modelling popover – fixed, anchored so bottom-right meets left edge of button */}
        {usagePopoverOpen && popoverPos && (
          <div
            ref={usagePopoverRef}
            className="fixed z-[200] w-[320px] rounded-[12px] border border-[#EBEEF1] bg-white p-[16px] shadow-[0_12px_32px_rgba(28,32,40,0.12)]"
            style={{
              top: popoverPos.top,
              left: popoverPos.left,
              transform: "translate(-100%, -100%)",
            }}
          >
            {/* Location / State controls */}
            <div className="flex flex-wrap items-center gap-[12px]">
              <Selector
                ariaLabel={t("Location")}
                size="sm"
                value="USA"
                onChange={() => undefined}
                options={["USA"]}
                getDisplayValue={t}
                buttonClassName="h-[32px] gap-[6px] justify-between border border-[#D8DEE4] bg-white px-[12px] py-[8px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44]"
                simpleDropdownPosition
              />
              <Selector
                ariaLabel={t("State")}
                size="sm"
                value="Alaska"
                onChange={() => undefined}
                options={["Alaska"]}
                getDisplayValue={t}
                buttonClassName="h-[32px] justify-between border border-[#D8DEE4] bg-white px-[12px] py-[8px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44]"
                simpleDropdownPosition
              />
            </div>

            {/* Usage entries with sliders */}
            {planUsageEntries.length > 0 ? (
              <div className="mt-[12px]">
                <div className="flex flex-col gap-[12px]">
                  {planUsageEntries.map((entry) => {
                    const rateId = entry.id
                    const quantity = entry.quantity ?? 0
                    const unitPrice = entry.unitPrice ?? null
                    const unitPriceLabel =
                      unitPrice == null
                        ? null
                        : formatCurrencyValue(unitPrice, planCurrency, unitPrice < 1 ? 4 : 2)

                    const isEntryDragging = draggingRateId === rateId

                    // Slider calculations
                    const tierIds = planRateTiers[rateId] ?? [0, 1]
                    const tierToValues = planRateTierToValues[rateId] ?? {}
                    const tierRanges = tierIds.reduce<{ from: number; to: number }[]>((acc, id, index) => {
                      const isLast = index === tierIds.length - 1
                      const defaultTo = (index + 1) * 1000
                      const toRaw = tierToValues[id] || numberFormatter.format(defaultTo)
                      const parsedTo = isLast ? Infinity : parseNumberValue(toRaw || `${defaultTo}`)
                      const previousTo = acc[index - 1]?.to ?? 0
                      acc.push({
                        from: index === 0 ? 0 : previousTo + 1,
                        to: isLast ? Infinity : parsedTo,
                      })
                      return acc
                    }, [])
                    const lastFrom = tierRanges.length ? tierRanges[tierRanges.length - 1]!.from : 0
                    const sliderBase = lastFrom > 0 ? lastFrom : 5000
                    const sliderMax = Math.max(100, Math.ceil(sliderBase * 1.2))
                    const sliderPercent = sliderMax ? (Math.min(quantity, sliderMax) / sliderMax) * 100 : 0

                    const isHovered = hoveredRateId === rateId
                    const showTrash = planUsageEntries.length > 1 && isHovered

                    return (
                      <div
                        key={rateId}
                        className="flex flex-col gap-[6px]"
                        onMouseEnter={() => setHoveredRateId(rateId)}
                        onMouseLeave={() => setHoveredRateId(null)}
                      >
                        <div className="flex items-start justify-between gap-[12px]">
                          <div className="flex min-w-0 flex-col gap-[2px]">
                            <div className="flex items-center gap-[4px]">
                              <Selector
                                ariaLabel={t("Rate")}
                                size="sm"
                                value={String(rateId)}
                                onChange={(next) => {
                                  const nextId = Number(next)
                                  if (!Number.isFinite(nextId)) return
                                  setUsageScenarioRates((prev) => {
                                    const targetIndex = prev.findIndex((id) => id === rateId)
                                    if (targetIndex < 0) return prev
                                    const otherIndex = prev.findIndex((id, idx) => id === nextId && idx !== targetIndex)
                                    const nextList = [...prev]
                                    if (otherIndex >= 0) {
                                      const temp = nextList[targetIndex]
                                      nextList[targetIndex] = nextId
                                      nextList[otherIndex] = temp as number
                                      return nextList
                                    }
                                    nextList[targetIndex] = nextId
                                    return nextList
                                  })
                                }}
                                options={allRates.map((r) => String(r.id))}
                                getDisplayValue={(value) => {
                                  const r = allRates.find((item) => String(item.id) === value) ?? null
                                  return getPlanRateLabel(r)
                                }}
                                chevronVisibility="hover"
                                buttonClassName={cn(
                                  "!h-auto !min-h-0 !-ml-[4px] !px-[4px] !py-[1px] !text-[12px] !font-[500] !leading-[15px] !shadow-none",
                                  "!border !border-transparent !bg-transparent !text-[#353A44]",
                                  isHovered && "!border-[#D8DEE4] !bg-white",
                                  "hover:!border-[#D8DEE4] hover:!bg-white"
                                )}
                              />
                              {showTrash ? (
                                <button
                                  type="button"
                                  className="flex-shrink-0 rounded-[4px] p-[2px] text-[#6C7688] hover:bg-[#EBEEF1] hover:text-[#353A44] transition-colors"
                                  aria-label={t("Remove rate")}
                                  onClick={() => {
                                    setUsageScenarioRates((prev) => prev.filter((id) => id !== rateId))
                                  }}
                                >
                                  <TrashIcon />
                                </button>
                              ) : null}
                            </div>
                            {unitPriceLabel != null ? (
                              <span className="flex items-center gap-0 text-[11px] font-[500] leading-[14px] text-[#6C7688]">
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={formatIntegerWithCommas(String(quantity))}
                                  onChange={(event) => {
                                    const digits = event.target.value.replace(/[^0-9]/g, "")
                                    setRateUsage((prev) => ({ ...prev, [rateId]: digits === "" ? "0" : digits }))
                                  }}
                                  className={cn(
                                    "min-w-[20px] w-auto -ml-[3px] rounded-[3px] border border-transparent bg-transparent px-[3px] py-[1px] text-[11px] font-[500] leading-[14px] text-[#6C7688] outline-none text-left",
                                    "hover:border-[#D8DEE4] hover:bg-white focus:border-[#A0D0F7] focus:bg-white focus:shadow-[0_0_0_1.5px_#A0D0F7]",
                                    isEntryDragging && "bg-[#E0D9FB] border-[#E0D9FB]"
                                  )}
                                  style={{ width: `${Math.max(20, formatIntegerWithCommas(String(quantity)).length * 7 + 12)}px` }}
                                />
                                <span>{" \u00d7 "}</span>
                                <span className={cn(isEntryDragging && "rounded-[3px] bg-[#E0D9FB] px-[2px] -mx-[2px] transition-colors")}>
                                  {unitPriceLabel}
                                </span>
                              </span>
                            ) : null}
                          </div>
                          <span className="text-nowrap text-[12px] font-[500] leading-[15px] text-[#353A44]">
                            {formatCurrencyValue(entry.total, planCurrency, 2)}
                          </span>
                        </div>
                        {/* Inline slider */}
                        <div
                          className={cn(
                            "relative h-[12px] w-full",
                            isEntryDragging ? "cursor-grabbing" : "cursor-grab"
                          )}
                        >
                          {/* Track */}
                          <div className="pointer-events-none absolute inset-x-0 top-1/2 h-[4px] -translate-y-1/2 rounded-full bg-[#EBEEF1]" />
                          {/* Filled track */}
                          <div
                            className="pointer-events-none absolute left-0 top-1/2 h-[4px] -translate-y-1/2 rounded-full bg-[#D8DEE4]"
                            style={{ width: `${sliderPercent}%` }}
                          />
                          {/* Thumb */}
                          <div
                            className={cn(
                              "pointer-events-none absolute top-1/2 h-[12px] w-[12px] -translate-y-1/2 -translate-x-1/2 rounded-full bg-white border border-[#EBEEF1] shadow-[0_0.5px_1.5px_rgba(0,0,0,0.25)]",
                              isEntryDragging && "scale-[1.15] shadow-[0_1px_2.5px_rgba(0,0,0,0.30)]",
                              "transition-[transform,box-shadow] duration-100"
                            )}
                            style={{ left: `${sliderPercent}%` }}
                          />
                          <input
                            type="range"
                            min={0}
                            max={sliderMax}
                            step={1}
                            value={Math.min(quantity, sliderMax)}
                            aria-label={t("Usage")}
                            className={cn(
                              "absolute inset-0 z-10 h-full w-full opacity-0 touch-none",
                              isEntryDragging ? "cursor-grabbing" : "cursor-grab"
                            )}
                            onPointerDown={() => {
                              setDraggingRateId(rateId)
                            }}
                            onInput={(event) => {
                              const nextRaw = Number(event.currentTarget.value)
                              const next = Number.isFinite(nextRaw) ? Math.max(0, Math.round(nextRaw)) : 0
                              setRateUsage((prev) => ({ ...prev, [rateId]: String(next) }))
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : null}

            {canAddMoreRates && (
              <button
                type="button"
                className="mt-[12px] inline-flex h-[32px] items-center justify-center whitespace-nowrap rounded-[6px] border border-[#D8DEE4] bg-white px-[12px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] shadow-[0_1px_1px_rgba(33,37,44,0.08)] hover:bg-[#F5F6F8] transition-colors"
                onClick={handleAddRate}
              >
                {t("Add rate to model")}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
