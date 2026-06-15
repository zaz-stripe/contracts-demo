'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useFocusedField } from "@/components/product-catalog/FocusedFieldContext"
import { BrandIcon, getBrandFromPlanName } from "@/components/ProductCatalogIcons"
import { cn } from "@/lib/utils"
import type { PricingPlanDraft } from "./productCatalogPage.types"


type PricingPlanStructurePreviewProps = {
  t: (key: string) => string
  draft: PricingPlanDraft
  isInlineGetStartedActive?: boolean
  getPlanLabel: (value: string, fallback: string) => string
  getPlanRateLabel: (rate?: { id: number; name: string } | null) => string
  getPlanSubscriptionFeeLabel: (fee?: { id: number; name: string } | null) => string
  getPlanCreditGrantLabel: (grant?: { id: number; name: string } | null) => string
  formatCurrencyValue: (value: number, currency: string, minimumFractionDigits?: number) => string
  parseNumberValue: (value: string) => number
  selectedNodeKey?: string | null
  /** Always-set key for the active node (not gated by user selection).
   *  Used together with focusedField to highlight the item being edited. */
  activeNodeKey?: string | null
  /** When set, renders a ghost placeholder of this item type at the end of the preview */
  ghostItemKind?: "rate" | "subscription-fee" | "credit-grant" | "rate-card" | null
  /** Multiple ghost items for quick-start hover (shows all simultaneously) */
  quickStartGhostKinds?: ("subscription-fee" | "rate" | "credit-grant")[] | null
  /** Called when the user clicks "Add item" in the empty state; receives the button element for positioning */
  onAddItem?: (button: HTMLButtonElement) => void
}

const itemEnter = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.25, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.15, ease: "easeIn" } },
}

function formatTierValue(v: string): string {
  const cleaned = v.replace(/,/g, "")
  const n = Number(cleaned)
  if (!Number.isFinite(n) || n === 0) return v
  return new Intl.NumberFormat().format(n)
}

export function PricingPlanStructurePreview({
  t,
  draft,
  isInlineGetStartedActive = false,
  getPlanLabel,
  getPlanRateLabel,
  getPlanSubscriptionFeeLabel,
  getPlanCreditGrantLabel,
  formatCurrencyValue,
  parseNumberValue,
  selectedNodeKey,
  activeNodeKey,
  ghostItemKind,
  quickStartGhostKinds,
  onAddItem,
}: PricingPlanStructurePreviewProps) {
  const {
    planName,
    planCurrency,
    planPriceGroups = [],
    planSubscriptionFees,
    planCreditGrants,
    planRateCards,
    subscriptionFeeAmounts,
    subscriptionFeePeriods,
    creditGrantAmounts,
    creditGrantPeriods,
    creditGrantApplications,
    rateCardServicingPeriods,
    rateMeters,
    ratePriceTypes,
    planRateUnitPrices,
    rateUnitLabels,
    rateSellAs,
    planRateTiers,
    planRateTierToValues,
    planRateTierUnitPrices,
    planRateTierFlatFees,
  } = draft

  const { focusedField } = useFocusedField()

  const isRateCardSelected = useCallback(
    (cardId: number) => {
      if (!selectedNodeKey) return false
      return selectedNodeKey.includes(`rateCard:${cardId}`)
    },
    [selectedNodeKey]
  )

  const isRateSelected = useCallback(
    (rateId: number) => {
      if (!selectedNodeKey) return false
      return selectedNodeKey.includes(`rate:${rateId}`)
    },
    [selectedNodeKey]
  )

  const isSubscriptionFeeSelected = useCallback(
    (feeId: number) => {
      if (!selectedNodeKey) return false
      return selectedNodeKey.includes(`subscriptionFee:${feeId}`)
    },
    [selectedNodeKey]
  )

  const isCreditGrantSelected = useCallback(
    (grantId: number) => {
      if (!selectedNodeKey) return false
      return selectedNodeKey.includes(`creditGrant:${grantId}`)
    },
    [selectedNodeKey]
  )

  // Focus-aware selection: when a form field is focused, use activeNodeKey
  // to determine which item to highlight (independent of explicit user selection).
  // In the Get Started wizard the active node stays on the plan root, which may
  // now be namespaced (e.g. "plan123:plan"), so treat any plan-root key as wizard mode.
  const isWizardMode = activeNodeKey === "plan" || activeNodeKey?.endsWith(":plan")
  const isFocusedRateCard = useCallback(
    (cardId: number) => {
      if (!focusedField || !activeNodeKey) return false
      return isWizardMode || activeNodeKey.includes(`rateCard:${cardId}`)
    },
    [focusedField, activeNodeKey, isWizardMode]
  )
  const isFocusedRate = useCallback(
    (rateId: number) => {
      if (!focusedField || !activeNodeKey) return false
      return isWizardMode || activeNodeKey.includes(`rate:${rateId}`)
    },
    [focusedField, activeNodeKey, isWizardMode]
  )
  const isFocusedSubscriptionFee = useCallback(
    (feeId: number) => {
      if (!focusedField || !activeNodeKey) return false
      return isWizardMode || activeNodeKey.includes(`subscriptionFee:${feeId}`)
    },
    [focusedField, activeNodeKey, isWizardMode]
  )
  const isFocusedCreditGrant = useCallback(
    (grantId: number) => {
      if (!focusedField || !activeNodeKey) return false
      return isWizardMode || activeNodeKey.includes(`creditGrant:${grantId}`)
    },
    [focusedField, activeNodeKey, isWizardMode]
  )

  const creditPeriodToLabel = useCallback((period: string) => {
    const p = (period || "Monthly").toLowerCase()
    if (p === "annually" || p === "yearly") return "Per year"
    if (p.startsWith("every ")) return `Per ${period.slice(6)}`
    if (p === "custom") return "Custom"
    return "Per month"
  }, [])

  const servicingPeriodToBillingText = useCallback(
    (period: string) => {
      const p = (period || "Monthly").toLowerCase()
      if (p === "monthly") return "Usage billed monthly"
      if (p === "annually" || p === "yearly") return "Usage billed annually"
      return "Usage billed custom"
    },
    []
  )

  const licensePeriodToLabel = useCallback((period: string) => {
    const p = (period || "Monthly").toLowerCase()
    if (p === "annually" || p === "yearly") return "Per year"
    if (p.startsWith("every ")) return `Per ${period.slice(6)}`
    if (p === "custom") return "Custom"
    return "Per month"
  }, [])

  const licensePeriodToBilledText = useCallback((period: string) => {
    const p = (period || "Monthly").toLowerCase()
    if (p === "annually" || p === "yearly") return "Billed annually"
    if (p.startsWith("every ")) return `Billed every ${period.slice(6)}`
    if (p === "custom") return "Custom billing"
    return "Billed monthly"
  }, [])

  const tierLabelsForRate = useMemo(() => {
    const result: Record<number, { label: string; price: string }[] | undefined> = {}
    for (const card of planRateCards) {
      for (const rate of card.rates) {
        const rateId = rate.id
        const priceType = ratePriceTypes[rateId] ?? ""
        const isTiered = priceType === "Graduated" || priceType === "Volume"
        if (!isTiered) continue

        const tierIds = planRateTiers[rateId] ?? [0, 1]

        const tierToValues = planRateTierToValues[rateId] ?? {}
        const tierUnitPrices = planRateTierUnitPrices[rateId] ?? {}
        const tierFlatFees = planRateTierFlatFees[rateId] ?? {}
        const unitLabel = (rateUnitLabels[rateId] ?? "").trim() || "unit"

        // Mirror the editor's placeholder fallback: when a tier's "to" value
        // hasn't been edited, the editor still displays a default of
        // (index + 1) * 1000 — use the same default in the preview so labels
        // stay in sync (e.g. "If total quantity is 1 - 1,000").
        const defaultToFor = (i: number) => String((i + 1) * 1000)
        const resolvedToFor = (i: number) => {
          const tid = tierIds[i] ?? 0
          const raw = (tierToValues[tid] ?? "").trim()
          return raw !== "" ? raw : defaultToFor(i)
        }

        const tiers = tierIds.map((tierId, index) => {
          const isFirst = index === 0
          const isLast = index === tierIds.length - 1
          const toValue = isLast ? "" : resolvedToFor(index)
          const unitPrice = tierUnitPrices[tierId] ?? ""
          const flatFee = tierFlatFees[tierId] ?? ""

          let label: string
          if (priceType === "Volume") {
            const fromVal =
              index === 0 ? "1" : String(parseNumberValue(resolvedToFor(index - 1)) + 1)
            const from = formatTierValue(fromVal)
            if (isLast) {
              label = `If total quantity is ${from} or more`
            } else {
              const to = formatTierValue(toValue)
              label = `If total quantity is ${from} - ${to}`
            }
          } else {
            if (isFirst) {
              const to = toValue ? formatTierValue(toValue) : ""
              label = to
                ? `For the first 0\u2013${to}`
                : "For the first tier"
            } else if (isLast) {
              const prevTo = resolvedToFor(index - 1)
              label = prevTo
                ? `For the next ${formatTierValue(prevTo)} or more`
                : "For the next tier"
            } else {
              const prevTo = resolvedToFor(index - 1)
              const to = toValue ? formatTierValue(toValue) : ""
              label =
                prevTo && to
                  ? `For the next ${formatTierValue(prevTo)}-${to}`
                  : `Tier ${index + 1}`
            }
          }

          let price: string
          const unitPart = unitPrice ? `$${unitPrice}` : "$0.00"
          if (flatFee && flatFee.trim() && flatFee !== "0" && flatFee !== "0.00") {
            price = `${unitPart} + $${flatFee} flat fee`
          } else {
            price = unitPart
          }
          return { label, price }
        })
        result[rateId] = tiers
      }
    }
    return result
  }, [
    planRateCards,
    ratePriceTypes,
    planRateTiers,
    planRateTierToValues,
    planRateTierUnitPrices,
    planRateTierFlatFees,
    rateUnitLabels,
    parseNumberValue,
  ])

  const hasSubscriptionFees = planSubscriptionFees.length > 0
  const hasCreditGrants = planCreditGrants.length > 0
  const hasRateCards = planRateCards.length > 0
  const showFeesInHeader = planSubscriptionFees.length <= 1
  const hasNonFlatRateCards = planRateCards.some((card) => (rateCardServicingPeriods[card.id] ?? "") !== "Flat")
  const hasBodyBelow = hasNonFlatRateCards || (!showFeesInHeader && planSubscriptionFees.length > 0) || !!ghostItemKind || !!quickStartGhostKinds
  const containerRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [isStuck, setIsStuck] = useState(false)

  // Quick-start ghosts: treat each kind as active when hovering a quick-start option
  const hasQsGhost = (kind: "subscription-fee" | "rate" | "credit-grant" | "rate-card") =>
    quickStartGhostKinds?.includes(kind as "subscription-fee" | "rate" | "credit-grant") ?? false

  const hl = "bg-[#EDE9FF] rounded-[4px] px-[4px] -mx-[4px] w-fit decoration-clone"

  useEffect(() => {
    const sentinel = sentinelRef.current
    const container = containerRef.current
    if (!sentinel || !container) return
    let scrollParent: HTMLElement | null = container.parentElement
    while (scrollParent) {
      const style = getComputedStyle(scrollParent)
      if (style.overflowY === "auto" || style.overflowY === "scroll") break
      scrollParent = scrollParent.parentElement
    }
    const observer = new IntersectionObserver(
      ([entry]) => setIsStuck(!entry!.isIntersecting),
      { root: scrollParent, threshold: 0 }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!selectedNodeKey || !containerRef.current) return
    const rateMatch = selectedNodeKey.match(/rate:(\d+)/)
    const rateCardMatch = selectedNodeKey.match(/rateCard:(\d+)/)
    const feeMatch = selectedNodeKey.match(/subscriptionFee:(\d+)/)
    const selector = rateMatch
      ? `[data-preview-rate="${rateMatch[1]}"]`
      : rateCardMatch
        ? `[data-preview-ratecard="${rateCardMatch[1]}"]`
        : feeMatch
          ? `[data-preview-fee="${feeMatch[1]}"]`
          : null
    if (!selector) return
    const el = containerRef.current.querySelector(selector) as HTMLElement | null
    if (el) {
      const headerHeight = headerRef.current?.offsetHeight ?? 0
      el.style.scrollMarginTop = `${headerHeight + 16}px`
      el.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [selectedNodeKey])

  return (
    <div ref={containerRef} className="min-w-[432px] w-max max-w-full">
      <div ref={sentinelRef} className="h-0" />
      {/* ── Top section: plan name + subscription fee ── */}
      <div
        ref={headerRef}
        className={cn(
          "sticky top-0 z-10 flex flex-col gap-[24px] overflow-clip bg-white p-[24px] border-[#D4DEE9]",
          isStuck
            ? "border-x border-b"
            : cn("border", hasBodyBelow ? "rounded-t-[12px] border-b-0" : "rounded-[12px]")
        )}
      >
        {/* Plan lockup: icon + name + description + optional add button */}
        <div className="flex items-start justify-between gap-[12px]">
          <div className="flex items-center gap-[12px] min-w-0">
            {(() => {
              const brand = getBrandFromPlanName(planName)
              return brand ? (
                <BrandIcon brand={brand} className="h-[32px] w-[32px] shrink-0" />
              ) : null
            })()}
            <div className="flex flex-col min-w-0">
              <p
                className={cn("text-[20px] font-[600] leading-[24px] tracking-[-0.3px] text-[#1A2C44]", focusedField === "plan.name" && hl)}
              >
                {getPlanLabel(planName, t("Untitled pricing plan"))}
              </p>
              {draft.planDescription ? (
                <p className={cn("text-[12px] font-[400] leading-[16px] tracking-[-0.1px] text-[#3C4F69] truncate", focusedField === "plan.description" && hl)}>
                  {draft.planDescription}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Subscription fee empty state — hidden when there's a flat product or existing subscription fee */}
        {showFeesInHeader && planSubscriptionFees.length === 0 && planRateCards.filter((c) => (rateCardServicingPeriods[c.id] ?? "") === "Flat").length === 0 && (() => {
          const showGhost = ghostItemKind === "subscription-fee" || hasQsGhost("subscription-fee")
          return showGhost ? (
            <div className="flex flex-col gap-[4px]">
              <div className="flex items-center justify-between">
                <p className="text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#667691]">{t("Subscription fee")}</p>
                <p className="text-[16px] font-[600] leading-[24px] tracking-[-0.31px] text-right text-[#667691]" style={{ fontFeatureSettings: "'lnum' 1, 'pnum' 1" }}>$0.00</p>
              </div>
              <div className="flex items-center justify-between text-[12px] font-[400] leading-[16px] text-[#667691]">
                <p>{t("Billed monthly")}</p>
                <p>{t("Per month")}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-[4px]">
              <div className="flex min-h-[24px] items-center justify-between">
                <p className="text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#667691]">{t("Subscription fee")}</p>
              </div>
              <div className="flex items-center justify-between text-[12px] font-[400] leading-[16px] text-[#667691]">
                <p>{t("Add a fixed recurring charge to this plan.")}</p>
              </div>
            </div>
          )
        })()}
        {showFeesInHeader && planSubscriptionFees.map((fee) => {
          const amount = parseNumberValue(subscriptionFeeAmounts[fee.id] ?? "0") ?? 0
          const period = subscriptionFeePeriods[fee.id] ?? "Monthly"
          const isSelected = isSubscriptionFeeSelected(fee.id)
          return (
            <div
              key={fee.id}
              data-preview-fee={fee.id}
              className="flex flex-col gap-[4px] rounded-[6px]"
            >
              <div className="flex items-center justify-between">
                <p className={cn("text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#1A2C44]", focusedField === "subscriptionFee.name" && (isSelected || isFocusedSubscriptionFee(fee.id)) && hl)}>
                  {getPlanSubscriptionFeeLabel(fee)}
                </p>
                <p
                  className={cn("text-[16px] font-[600] leading-[24px] tracking-[-0.31px] text-right text-[#1A2C44]", ((focusedField === "subscriptionFee.amount" && (isSelected || isFocusedSubscriptionFee(fee.id))) || focusedField === "plan.currency") && hl)}
                  style={{ fontFeatureSettings: "'lnum' 1, 'pnum' 1" }}
                >
                  {formatCurrencyValue(amount, planCurrency, 2)}
                </p>
              </div>
              <div className="flex items-center justify-between text-[12px] font-[400] leading-[16px] text-[#3C4F69]">
                <p>{licensePeriodToBilledText(period)}</p>
                <p>{licensePeriodToLabel(period)}</p>
              </div>
            </div>
          )
        })}
        {/* Flat products shown as subscription fees in header */}
        {planRateCards.filter((card) => (rateCardServicingPeriods[card.id] ?? "") === "Flat").map((card) => {
          const rate = card.rates[0]
          if (!rate) return null
          const amount = parseNumberValue(planRateUnitPrices[rate.id] ?? "0") ?? 0
          const period = rateMeters[rate.id] ?? "Monthly"
          const cardSelected = isRateCardSelected(card.id)
          return (
            <div
              key={card.id}
              data-preview-ratecard={card.id}
              className="flex flex-col gap-[4px] rounded-[6px]"
            >
              <div className="flex items-center justify-between">
                <p className={cn("text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#1A2C44]", focusedField === "rateCard.name" && cardSelected && hl)}>
                  {card.name || t("Product")}
                </p>
                <p
                  className="text-[16px] font-[600] leading-[24px] tracking-[-0.31px] text-right text-[#1A2C44]"
                  style={{ fontFeatureSettings: "'lnum' 1, 'pnum' 1" }}
                >
                  {formatCurrencyValue(amount, planCurrency, 2)}
                </p>
              </div>
              <div className="flex items-center justify-between text-[12px] font-[400] leading-[16px] text-[#3C4F69]">
                <p>{licensePeriodToBilledText(period)}</p>
                <p>{licensePeriodToLabel(period)}</p>
              </div>
            </div>
          )
        })}

        {/* Credit grants — grouped "Included" card */}
        {planCreditGrants.length > 0 && (
          <div className="flex flex-col gap-[8px] rounded-[6px] bg-[rgba(26,26,26,0.04)] p-[12px]">
            <div className="flex items-center gap-[4px]">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
                <rect x="1" y="4" width="10" height="7" rx="1.5" stroke="#3C4F69" strokeWidth="1.2" fill="none" />
                <path d="M6 4v7M1 7h10" stroke="#3C4F69" strokeWidth="1.2" fill="none" />
                <circle cx="4.5" cy="2.5" r="1.2" stroke="#3C4F69" strokeWidth="1" fill="none" />
                <circle cx="7.5" cy="2.5" r="1.2" stroke="#3C4F69" strokeWidth="1" fill="none" />
              </svg>
              <p className="text-[12px] font-[500] leading-[20px] tracking-[-0.15px] text-[#1A2C44]">{t("Included")}</p>
            </div>
            <div className="flex flex-col gap-[4px]">
              {planCreditGrants.map((grant) => {
                const amount = parseNumberValue(creditGrantAmounts[grant.id] ?? "0") ?? 0
                const period = (creditGrantPeriods[grant.id] ?? "Monthly").toLowerCase()
                const periodSuffix = period === "annually" || period === "yearly" ? "/yr" : period.startsWith("every ") ? `/${creditGrantPeriods[grant.id]?.slice(6) ?? "mo"}` : "/mo"
                const application = creditGrantApplications[grant.id] ?? "All metered items"
                const applicationLabel = application === "All metered items" ? "all usage" : application.toLowerCase()
                return (
                  <p
                    key={grant.id}
                    data-preview-credit={grant.id}
                    className="text-[12px] font-[400] leading-[20px] tracking-[-0.15px] text-[#1A2C44]"
                  >
                    <span className={cn(focusedField === "creditGrant.amount" && isFocusedCreditGrant(grant.id) && hl)}>
                      {formatCurrencyValue(amount, planCurrency, 0)}{periodSuffix}
                    </span>
                    {" "}{t("of")}{" "}
                    <span className={cn(focusedField === "creditGrant.name" && isFocusedCreditGrant(grant.id) && hl)}>
                      {getPlanCreditGrantLabel(grant)}
                    </span>
                    . ({t("applies to")} {applicationLabel})
                  </p>
                )
              })}
            </div>
          </div>
        )}

        {/* Ghost: credit grant in header (quick-start: instant, add-item: animated) */}
        {hasQsGhost("credit-grant") && planCreditGrants.length === 0 && (
          <div className="flex flex-col gap-[8px] rounded-[6px] bg-[rgba(26,26,26,0.04)] p-[12px]">
            <p className="text-[12px] font-[500] leading-[20px] tracking-[-0.15px] text-[#667691]">{t("Included")}</p>
            <p className="text-[12px] font-[400] leading-[20px] tracking-[-0.15px] text-[#667691]">
              {t("Prepaid allowance that offsets usage charges")}
            </p>
          </div>
        )}
        {ghostItemKind === "credit-grant" && !hasQsGhost("credit-grant") && planCreditGrants.length === 0 && (
          <div className="flex flex-col gap-[8px] rounded-[6px] bg-[rgba(26,26,26,0.04)] p-[12px]">
            <p className="text-[12px] font-[500] leading-[20px] tracking-[-0.15px] text-[#667691]">{t("Included")}</p>
            <p className="text-[12px] font-[400] leading-[20px] tracking-[-0.15px] text-[#667691]">
              {t("Prepaid allowance that offsets usage charges")}
            </p>
          </div>
        )}
      </div>

      {/* ── Body section: subscription fees (when 2+) + rates ── */}
      {hasBodyBelow && <div className="flex flex-col overflow-clip rounded-b-[12px] border border-[#D4DEE9] bg-white py-[8px]">
        {/* Subscription fees (when 2+ fees) */}
        {!showFeesInHeader && (
          <div className="flex flex-col px-[24px] pt-[8px] pb-[8px]">
            <div className="flex flex-col gap-[16px]">
              <AnimatePresence initial={false}>
              {planSubscriptionFees.map((fee) => {
                const amount = parseNumberValue(subscriptionFeeAmounts[fee.id] ?? "0") ?? 0
                const period = subscriptionFeePeriods[fee.id] ?? "Monthly"
                const isSelected = isSubscriptionFeeSelected(fee.id)
                return (
                  <motion.div key={fee.id} {...itemEnter} data-preview-fee={fee.id} className="flex gap-[12px] items-stretch rounded-[6px]">
                    <div className={cn("w-px shrink-0", isSelected ? "bg-[#7B61FF]" : "bg-[#C3B6FB]")} />
                    <div className="flex flex-1 flex-col gap-[4px] min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={cn("text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#1A2C44]", focusedField === "subscriptionFee.name" && (isSelected || isFocusedSubscriptionFee(fee.id)) && hl)}>
                          {getPlanSubscriptionFeeLabel(fee)}
                        </p>
                        <p
                          className={cn("text-[16px] font-[600] leading-[24px] tracking-[-0.31px] text-right text-[#1A2C44]", ((focusedField === "subscriptionFee.amount" && (isSelected || isFocusedSubscriptionFee(fee.id))) || focusedField === "plan.currency") && hl)}
                          style={{ fontFeatureSettings: "'lnum' 1, 'pnum' 1" }}
                        >
                          {formatCurrencyValue(amount, planCurrency, 2)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-[12px] font-[400] leading-[16px] text-[#3C4F69]">
                        <p>{licensePeriodToBilledText(period)}</p>
                        <p>{licensePeriodToLabel(period)}</p>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Ghost: subscription fee in body — only when fees already exist (adding makes 2+, moves to body) */}
        {ghostItemKind === "subscription-fee" && planSubscriptionFees.length > 0 && (
          <div className="flex flex-col px-[24px] py-[8px]">
            <div className="flex gap-[12px] items-stretch">
              <div className="w-px shrink-0 bg-[#C3B6FB]" />
              <div className="flex flex-1 flex-col gap-[4px] min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#667691]">{t("Subscription fee")}</p>
                  <p className="text-[16px] font-[600] leading-[24px] tracking-[-0.31px] text-right text-[#667691]" style={{ fontFeatureSettings: "'lnum' 1, 'pnum' 1" }}>$0.00</p>
                </div>
                <div className="flex items-center justify-between text-[12px] font-[400] leading-[16px] text-[#667691]">
                  <p>{t("Billed monthly")}</p>
                  <p>{t("Per month")}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
        {/* Price groups with their products */}
        {planPriceGroups.map((pg) => {
          const groupedCards = planRateCards.filter((c) => c.priceGroupId === pg.id).filter((card) => (rateCardServicingPeriods[card.id] ?? "") !== "Flat")
          if (groupedCards.length === 0) return null
          return (
            <motion.div key={`pg-${pg.id}`} {...itemEnter} className="flex flex-col overflow-clip rounded-[8px]">
              <div className="flex flex-col px-[24px] pb-[4px] pt-[16px]">
                <p className="text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#1A2C44]">
                  {pg.name || t("Price group")}
                </p>
              </div>
              {groupedCards.map((card) => {
                const servicingPeriod = rateCardServicingPeriods[card.id] ?? "Monthly"
                const billingText = servicingPeriodToBillingText(servicingPeriod)
                return (
                  <div key={card.id} data-preview-ratecard={card.id} className="flex flex-col">
                    {card.rates.map((rate) => {
                      const unitPrice = planRateUnitPrices[rate.id] ?? ""
                      const parsed = parseNumberValue(unitPrice)
                      const formatted = parsed > 0 ? formatCurrencyValue(parsed, planCurrency) : "$0.00"
                      return (
                        <div key={rate.id} className="flex items-center justify-between px-[24px] py-[8px]">
                          <p className="text-[13px] font-[500] leading-[18px] text-[#353A44] truncate">{card.name || t("Product")}</p>
                          <p className="text-[13px] font-[400] leading-[18px] text-[#596171] shrink-0">{formatted}/{rateUnitLabels[rate.id] || billingText.toLowerCase()}</p>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </motion.div>
          )
        })}
        {/* Ungrouped non-flat products */}
        {planRateCards.filter((card) => card.priceGroupId == null && (rateCardServicingPeriods[card.id] ?? "") !== "Flat").map((card, cardIndex, filteredCards) => {
          const rateCount = card.rates.length
          const servicingPeriod = rateCardServicingPeriods[card.id] ?? "Monthly"
          const billingText = servicingPeriodToBillingText(servicingPeriod)
          const cardSelected = isRateCardSelected(card.id)
          const isLastCard = cardIndex === filteredCards.length - 1

          return (
            <motion.div key={card.id} {...itemEnter} data-preview-ratecard={card.id} className="flex flex-col overflow-clip rounded-[8px]">
              {/* Product header — only show if there are multiple ungrouped products */}
              {filteredCards.length > 1 && (
                <div className="flex flex-col px-[24px] pb-[8px] pt-[16px]">
                  <div className="flex flex-col gap-[4px]">
                    <div className="flex items-start justify-between gap-[12px]">
                      <p className={cn("truncate text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#1A2C44]", focusedField === "rateCard.name" && (cardSelected || isFocusedRateCard(card.id)) && hl)}>
                        {card.name || t("Product")}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Rate card body */}
              <div className="flex flex-col px-[24px] pt-[16px] pb-[8px]">
                <div className="flex flex-col gap-[16px]">
                  <AnimatePresence initial={false}>
                  {card.rates.map((rate) => {
                    const rateId = rate.id
                    const priceType = ratePriceTypes[rateId] ?? ""
                    const isTiered = priceType === "Graduated" || priceType === "Volume"
                    const meterName = rateMeters[rateId] ?? ""
                    const unitLabel = (rateUnitLabels[rateId] ?? "").trim() || "unit"
                    const tiers = tierLabelsForRate[rateId]
                    const rateSelected = isRateSelected(rateId)

                    const isPackage = (rateSellAs[rateId] ?? "") === "Package"
                    const perLabel = isPackage ? "per package" : `per ${unitLabel}`

                    const priceLabel = (() => {
                      if (!isTiered) {
                        const up = planRateUnitPrices[rateId]
                        return up ? `$${up} ${perLabel}` : "$0.00"
                      }
                      return `Price ${perLabel}`
                    })()

                    return (
                      <motion.div key={rateId} {...itemEnter} data-preview-rate={rateId} className="flex gap-[12px] items-stretch rounded-[6px]">
                        {/* Purple left line — spans full height of rate including tiers */}
                        <div
                          className={cn(
                            "w-px shrink-0",
                            rateSelected ? "bg-[#7B61FF]" : "bg-[#C3B6FB]"
                          )}
                        />
                        {/* Rate content */}
                        <div className="flex flex-1 flex-col gap-[10px] min-w-0">
                          {/* Rate header */}
                          <div className={cn("flex items-start gap-[16px]", isInlineGetStartedActive ? "justify-start" : "justify-between")}>
                            <div className="flex flex-col gap-[4px] min-w-0">
                              <p className={cn("truncate text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#1A2C44]", focusedField === "rate.name" && (rateSelected || isFocusedRate(rateId)) && hl)}>
                                {rate.name || card.name || t("Product")}
                              </p>
                              {meterName ? (
                                <p className={cn("truncate text-[11px] font-[400] leading-[16px] text-[#3C4F69]", focusedField === "rate.meter" && (rateSelected || isFocusedRate(rateId)) && hl)}>
                                  {meterName.replace(/\s+/g, "_")}
                                </p>
                              ) : null}
                            </div>
                            {!isInlineGetStartedActive ? (
                              <div className="flex flex-col gap-[4px] items-end shrink-0 text-right text-[12px] font-[400] leading-[16px] text-[#1A2C44] whitespace-nowrap">
                                <p className={cn(focusedField === "rate.unitPrice" && (rateSelected || isFocusedRate(rateId)) && hl)}>{priceLabel}</p>
                              </div>
                            ) : null}
                          </div>

                          {/* Tier table (for graduated / volume) */}
                          {isTiered && tiers && tiers.length > 0 && (
                            <div className="flex flex-col rounded-[4px] pl-[8px]">
                              <div className="flex flex-col gap-[2px] px-[4px] pt-[4px]">
                                {tiers.map((tier, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-start justify-between pt-[4px]"
                                  >
                                    <p className="flex-1 min-w-0 text-[12px] font-[400] leading-[20px] tracking-[-0.15px] text-[#1A2C44] overflow-hidden text-ellipsis">
                                      {tier.label}
                                    </p>
                                    <p className="shrink-0 pl-[20px] text-[12px] font-[400] leading-[20px] tracking-[-0.15px] text-[#1A2C44] text-right whitespace-nowrap">
                                      {tier.price}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                  </AnimatePresence>

                  {/* Ghost: rate — inside the last rate card, after existing rates */}
                  {isLastCard && ghostItemKind === "rate" && (
                    <div className="flex gap-[12px] items-stretch">
                      <div className="w-px shrink-0 bg-[#C3B6FB]" />
                      <div className="flex flex-1 flex-col min-w-0">
                        <div className="flex items-start justify-between gap-[16px]">
                          <p className="text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#667691]">{t("Rate")}</p>
                          <p className="text-[12px] font-[400] leading-[16px] text-[#667691]">$0.00</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
        </AnimatePresence>

        {/* Ghost: rate card — after existing rate cards (or with rate inside when no cards exist) */}
        {ghostItemKind === "rate-card" && (
          <div className="flex flex-col px-[24px] pb-[8px] pt-[16px]">
            <div className="flex flex-col gap-[4px]">
              <div className="flex items-start justify-between gap-[12px]">
                <p className="text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#667691]">{t("Rate card")}</p>
                <span className="shrink-0 rounded-[10px] bg-[#ECF1F6] px-[6px] py-[2px] text-center text-[11px] font-[400] leading-[16px] text-[#667691]">0 {t("rates")}</span>
              </div>
              <p className="text-[12px] font-[400] leading-[16px] text-[#667691]">{t("Usage billed monthly")}</p>
            </div>
          </div>
        )}
        {/* Ghost: rate when no rate cards exist (add-item) */}
        {ghostItemKind === "rate" && !hasQsGhost("rate") && planRateCards.length === 0 && (
          <div className="flex flex-col">
            <div className="flex flex-col px-[24px] pb-[8px] pt-[16px]">
              <div className="flex flex-col gap-[4px]">
                <div className="flex items-start justify-between gap-[12px]">
                  <p className="text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#667691]">{t("Rate card")}</p>
                  <span className="shrink-0 rounded-[10px] bg-[#ECF1F6] px-[6px] py-[2px] text-center text-[11px] font-[400] leading-[16px] text-[#667691]">1 {t("rate")}</span>
                </div>
                <p className="text-[12px] font-[400] leading-[16px] text-[#667691]">{t("Usage billed monthly")}</p>
              </div>
            </div>
            <div className="flex flex-col px-[24px] pt-[16px] pb-[8px]">
              <div className="flex flex-col gap-[16px]">
                <div className="flex gap-[12px] items-stretch">
                  <div className="w-px shrink-0 bg-[#C3B6FB]" />
                  <div className="flex flex-1 flex-col min-w-0">
                    <div className="flex items-start justify-between gap-[16px]">
                      <p className="text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#667691]">{t("Rate")}</p>
                      <p className="text-[12px] font-[400] leading-[16px] text-[#667691]">$0.00</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Ghost: rate when no rate cards exist (instant, quick-start hover) */}
        {hasQsGhost("rate") && planRateCards.length === 0 && (
          <div className="flex flex-col">
            <div className="flex flex-col px-[24px] pb-[8px] pt-[16px]">
              <div className="flex flex-col gap-[4px]">
                <div className="flex items-start justify-between gap-[12px]">
                  <p className="text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#667691]">{t("Rate card")}</p>
                  <span className="shrink-0 rounded-[10px] bg-[#ECF1F6] px-[6px] py-[2px] text-center text-[11px] font-[400] leading-[16px] text-[#667691]">1 {t("rate")}</span>
                </div>
                <p className="text-[12px] font-[400] leading-[16px] text-[#667691]">{t("Usage billed monthly")}</p>
              </div>
            </div>
            <div className="flex flex-col px-[24px] pt-[16px] pb-[8px]">
              <div className="flex flex-col gap-[16px]">
                <div className="flex gap-[12px] items-stretch">
                  <div className="w-px shrink-0 bg-[#C3B6FB]" />
                  <div className="flex flex-1 flex-col min-w-0">
                    <div className="flex items-start justify-between gap-[16px]">
                      <p className="text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#667691]">{t("Rate")}</p>
                      <p className="text-[12px] font-[400] leading-[16px] text-[#667691]">$0.00</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ghost: credit grant in body — when adding to existing grants */}
        {ghostItemKind === "credit-grant" && planCreditGrants.length > 0 && (
          <div className="flex flex-col px-[24px] py-[8px]">
            <p className="text-[11px] font-[400] leading-[16px] text-[#667691]">{t("New credit grant will appear in the Included section above")}</p>
          </div>
        )}

        {planRateCards.length === 0 && ghostItemKind !== "rate" && ghostItemKind !== "rate-card" && !hasQsGhost("rate") && (
          <div className="flex flex-col px-[24px] pb-[8px] pt-[16px]">
            <div className="flex flex-col gap-[4px]">
              <div className="flex items-start justify-between gap-[12px]">
                <p className="text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#667691]">{t("Rates")}</p>
              </div>
              <p className="text-[12px] font-[400] leading-[16px] text-[#667691]">{t("Add usage-based rates.")}</p>
            </div>
          </div>
        )}
      </div>}
    </div>
  )
}
