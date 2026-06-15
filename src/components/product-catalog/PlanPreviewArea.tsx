'use client'

import { useCallback, useLayoutEffect, useMemo, useRef, type Dispatch, type SetStateAction } from "react"

import { PlanObjectMapView } from "@/components/product-catalog/ObjectMapView"
import { PlanCodeView } from "@/components/product-catalog/PlanCodeView"
import { PricingPlanStructurePreview } from "@/components/product-catalog/PricingPlanStructurePreview"
import { useShowAdditionalNodes } from "@/components/product-catalog/showAdditionalNodes"
import { useLayoutMode } from "@/components/product-catalog/layoutMode"
import { MapTreeIcon, PreviewEyeIcon } from "@/components/ProductCatalogIcons"
import { ControlTooltip } from "@/components/product-catalog/ControlTooltip"
import { cn } from "@/lib/utils"
import type { PricingPlanDraft, PricingPlanRow } from "./productCatalogPage.types"

type PlanRate = { id: number; name: string }
type PlanRateCard = { id: number; name: string; rates: PlanRate[] }

type PlanNode = {
  type: "plan" | "rateCard" | "rate" | "rateMeter" | "creditGrant" | "subscriptionFee" | "priceGroup"
  id?: number
}

type PlanUsageEntry = { id: number; name: string; total: number; quantity?: number; unitPrice?: number }

type PlanPreviewAreaProps = {
  t: (key: string) => string
  isPlanAssistantApplying: boolean
  isInlineGetStartedActive?: boolean
  /** True while the inline wizard's simulated 2s load is running. */
  isWizardLoading?: boolean

  customerPreviewMode: string
  setCustomerPreviewMode: (next: string) => void
  customerPreviewOptions: string[]

  planRateCards: PlanRateCard[]
  planRates?: PlanRate[]
  planUsageScenarioRates: number[]
  setPlanUsageScenarioRates: Dispatch<SetStateAction<number[]>>
  handleAddPlanUsageScenarioRate: (rateCardId: number) => void

  planRateUsage: Record<number, string>
  setPlanRateUsage: Dispatch<SetStateAction<Record<number, string>>>
  planRateTiers: Record<number, number[]>
  planRateTierToValues: Record<number, Record<number, string>>
  planRateTierUnitPrices: Record<number, Record<number, string>>
  planRateUnitPrices: Record<number, string>
  ratePriceTypes: Record<number, string>
  numberFormatter: Intl.NumberFormat
  parseNumberValue: (value: string) => number
  formatIntegerWithCommas: (raw: string) => string
  setActivePlanRateCardId: Dispatch<SetStateAction<number>>
  setPlanExpandedRateCards: Dispatch<SetStateAction<Record<number, boolean>>>
  setActivePlanNode: Dispatch<SetStateAction<PlanNode>>
  /** Handle node selection with shift-click support */
  handleNodeSelect?: (node: PlanNode, shiftKey: boolean) => void
  getPlanRateCardLabel: (card?: PlanRateCard | null) => string
  getPlanRateLabel: (rate?: PlanRate | null) => string

  // Object map
  rateMeters: Record<number, string>
  planCreditGrants: { id: number; name: string }[]
  planSubscriptionFees: { id: number; name: string }[]
  getPlanCreditGrantLabel: (grant?: { id: number; name: string } | null) => string
  getPlanSubscriptionFeeLabel: (fee?: { id: number; name: string } | null) => string
  selectedNodeKey?: string | null
  activeNodeKey?: string | null
  /** Array of selected node keys (for multi-select support) */
  selectedNodeKeys?: string[]
  onOpenAssistant?: (ref: import("@/components/ProductAssistantPanel").AssistantReference) => void
  onAddPlanObject?: (position: { top: number; left: number; above?: boolean }) => void
  onAddRate?: (rateCardId: number) => void
  onNodeContextMenu?: (info: import("@/components/product-catalog/ObjectMapView/NodeCard").NodeContextMenuInfo) => void

  // Multi-plan preview
  pricingPlans: PricingPlanRow[]
  editingPlanId: number | null
  currentPlanDraft: PricingPlanDraft
  allPlans?: { id: number; name: string; draft?: PricingPlanDraft }[]
  onSwitchToPlan?: (planId: number) => void

  // Estimated bill
  getPlanLabel: (value: string, fallback: string) => string
  planName: string
  planCurrency: string
  formatCurrencyValue: (value: number, currency: string, minimumFractionDigits?: number) => string

  // Code view props
  planDescription: string
  planLookupKey: string
  rateMetersByRate: Record<number, string>
  rateUnitLabels: Record<number, string>
  rateSellAs: Record<number, string>
  planRateTierFlatFees: Record<number, Record<number, string>>
  creditGrantAmounts: Record<number, string>
  creditGrantPeriods: Record<number, string>
  subscriptionFeeAmounts: Record<number, string>
  subscriptionFeePeriods: Record<number, string>

  // Coachmark support
  isExamplePlan?: boolean
  /** If true, removes the border radius from the preview container (for Layout B side panel) */
  noBorderRadius?: boolean
  /** Called when user clicks the empty canvas background (not a node). */
  onBackgroundClick?: () => void
  /** When set, renders a ghost placeholder of this item type in the structure preview */
  ghostItemKind?: "rate" | "subscription-fee" | "credit-grant" | "rate-card" | null
  /** Multiple ghost items for quick-start hover preview */
  quickStartGhostKinds?: ("subscription-fee" | "rate" | "credit-grant")[] | null

  // Action buttons (moved from top-level header)
  onDiscard?: () => void
  onCreate?: () => void
  createLabel?: string
  // Bulk edit (for preview header)
  isBulkEditMode?: boolean
  bulkEditTitle?: string
  onBulkEditBack?: () => void
}

export function PlanPreviewArea(props: PlanPreviewAreaProps) {
  const {
    t,
    isPlanAssistantApplying,
    isInlineGetStartedActive,
    isWizardLoading,
    customerPreviewMode,
    setCustomerPreviewMode,
    planRateCards,
    planRates,
    planUsageScenarioRates,
    setPlanUsageScenarioRates,
    planRateUsage,
    setPlanRateUsage,
    planRateTiers,
    planRateTierToValues,
    planRateTierUnitPrices,
    planRateUnitPrices,
    ratePriceTypes,
    numberFormatter,
    parseNumberValue,
    formatIntegerWithCommas,
    setActivePlanRateCardId,
    setActivePlanNode,
    handleNodeSelect,
    getPlanRateCardLabel,
    getPlanRateLabel,
    rateMeters,
    planCreditGrants,
    planSubscriptionFees,
    getPlanCreditGrantLabel,
    getPlanSubscriptionFeeLabel,
    selectedNodeKey,
    activeNodeKey,
    selectedNodeKeys,
    onOpenAssistant,
    onAddPlanObject,
    onAddRate,
    onNodeContextMenu,
    pricingPlans,
    editingPlanId,
    currentPlanDraft,
    allPlans,
    onSwitchToPlan,
    getPlanLabel,
    planName,
    planCurrency,
    formatCurrencyValue,
    planDescription,
    planLookupKey,
    rateMetersByRate,
    rateUnitLabels,
    rateSellAs,
    planRateTierFlatFees,
    creditGrantAmounts,
    creditGrantPeriods,
    subscriptionFeeAmounts,
    subscriptionFeePeriods,
    isExamplePlan,
    noBorderRadius,
    onBackgroundClick,
    ghostItemKind,
    quickStartGhostKinds,
    onDiscard,
    onCreate,
    createLabel,
    isBulkEditMode,
    bulkEditTitle,
    onBulkEditBack,
  } = props

  // Get showAdditionalNodes from context
  const { showAdditionalNodes } = useShowAdditionalNodes()

  // Build pricing tiers for object map rate cards
  const getRatePricingTiers = useCallback((rateId: number) => {
    const priceType = ratePriceTypes[rateId] ?? ""
    const isTiered = priceType === "Graduated" || priceType === "Volume"

    // Format number as shorthand (e.g. 1000 → "1k", 10000 → "10k", 100000 → "100k")
    const fmt = (v: string) => {
      // Strip commas in case value is pre-formatted
      const cleaned = v.replace(/,/g, "")
      const n = Number(cleaned)
      if (!Number.isFinite(n) || n === 0) return v
      if (n >= 1_000_000 && n % 1_000_000 === 0) return `${n / 1_000_000}m`
      if (n >= 1000 && n % 1000 === 0) return `${n / 1000}k`
      if (n >= 100) return `${n}`
      return v
    }

    if (!isTiered) {
      const unitPrice = planRateUnitPrices[rateId]
      if (unitPrice && unitPrice.trim() && unitPrice.trim() !== "null") {
        return [{ label: "Unit", price: `$${unitPrice}` }]
      }
      return undefined
    }

    const tierIds = planRateTiers[rateId] ?? [0, 1]

    const tierToValues = planRateTierToValues[rateId] ?? {}
    const tierUnitPrices = planRateTierUnitPrices[rateId] ?? {}
    const tierFlatFees = planRateTierFlatFees[rateId] ?? {}

    return tierIds.map((tierId, index) => {
      const isFirst = index === 0
      const isLast = index === tierIds.length - 1
      const toValue = tierToValues[tierId] ?? ""
      const unitPrice = tierUnitPrices[tierId] ?? ""
      const flatFee = tierFlatFees[tierId] ?? ""

      let label: string
      if (isFirst) {
        label = toValue ? `Up to ${fmt(toValue)}` : "First tier"
      } else if (isLast) {
        const prevTo = tierToValues[tierIds[index - 1] ?? 0] ?? ""
        label = prevTo ? `Over ${fmt(prevTo)}` : "Over limit"
      } else {
        const prevTo = tierToValues[tierIds[index - 1] ?? 0] ?? ""
        label = prevTo && toValue ? `${fmt(prevTo)} - ${fmt(toValue)}` : `Tier ${index + 1}`
      }

      const safeUnit = unitPrice && unitPrice.trim() !== "null" ? unitPrice : ""
      const safeFlatFee = flatFee && flatFee.trim() !== "null" ? flatFee : ""
      let price: string
      const unitPart = safeUnit ? `$${safeUnit}` : "$0.00"
      if (safeFlatFee && safeFlatFee.trim() && safeFlatFee !== "0") {
        price = `$${safeFlatFee} flat fee + ${unitPart}`
      } else {
        price = unitPart
      }

      return { label, price }
    })
  }, [ratePriceTypes, planRateUnitPrices, planRateTiers, planRateTierToValues, planRateTierUnitPrices, planRateTierFlatFees])

  // Build all plans data for object map in stable order
  const allPlansForMap = useMemo(() => {
    if (!allPlans || allPlans.length <= 1) return undefined
    return allPlans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      rateCards: plan.draft?.planRateCards ?? [],
      creditGrants: plan.draft?.planCreditGrants ?? [],
      subscriptionFees: plan.draft?.planSubscriptionFees ?? [],
      rateMeters: plan.draft?.rateMeters,
    }))
  }, [allPlans])

  // Build code generator input
  const codeGeneratorInput = useMemo(() => ({
    planName,
    planDescription,
    planCurrency,
    planLookupKey,
    planRateCards,
    planRates,
    rateMeters: rateMetersByRate,
    ratePriceTypes,
    planRateUnitPrices,
    planRateTiers,
    planRateTierToValues,
    planRateTierUnitPrices,
    planRateTierFlatFees,
    rateUnitLabels,
    rateSellAs,
    planCreditGrants,
    creditGrantAmounts,
    creditGrantPeriods,
    planSubscriptionFees: planSubscriptionFees,
    subscriptionFeeAmounts,
    subscriptionFeePeriods,
  }), [
    planName,
    planDescription,
    planCurrency,
    planLookupKey,
    planRateCards,
    planRates,
    rateMetersByRate,
    ratePriceTypes,
    planRateUnitPrices,
    planRateTiers,
    planRateTierToValues,
    planRateTierUnitPrices,
    planRateTierFlatFees,
    rateUnitLabels,
    rateSellAs,
    planCreditGrants,
    creditGrantAmounts,
    creditGrantPeriods,
    planSubscriptionFees,
    subscriptionFeeAmounts,
    subscriptionFeePeriods,
  ])

  const normalizedPreviewMode =
    customerPreviewMode === "Customer preview"
      ? "Preview"
      : customerPreviewMode === "Customer preview code"
        ? "Code"
        : customerPreviewMode === "Object map"
          ? "Map"
          : customerPreviewMode
  const previewMode = (["Preview", "Map", "Code"] as const).includes(normalizedPreviewMode as any)
    ? (normalizedPreviewMode as "Preview" | "Map" | "Code")
    : "Preview"
  const isObjectMap = previewMode === "Map"
  const isCode = previewMode === "Code"
  const { layoutMode } = useLayoutMode()
  const isLayoutB = layoutMode === "B"

  // Freeze the top spacer height when a ghost item is showing so the card
  // extends downward instead of shifting upward to re-centre.
  // We use useLayoutEffect + direct DOM mutation so the freeze happens
  // before the browser paints (no visible jump).
  const topSpacerRef = useRef<HTMLDivElement>(null)
  const lastNaturalHeight = useRef<number>(0)
  const wasFrozen = useRef(false)
  const unfreezeTimer = useRef<ReturnType<typeof setTimeout>>(null)

  useLayoutEffect(() => {
    const el = topSpacerRef.current
    if (!el) return

    if (!ghostItemKind) {
      if (wasFrozen.current) {
        // Ghost just disappeared — smoothly animate back to centred.
        wasFrozen.current = false
        if (unfreezeTimer.current) clearTimeout(unfreezeTimer.current)
        // Tiny delay so the exit frame paints first
        unfreezeTimer.current = setTimeout(() => {
          el.style.transition = "flex-grow 0.4s cubic-bezier(0.4,0,0.2,1), flex-basis 0.4s cubic-bezier(0.4,0,0.2,1)"
          el.style.flexGrow = "1"
          el.style.flexShrink = ""
          el.style.flexBasis = "0px"
          const onEnd = () => {
            el.style.transition = ""
            el.style.flexBasis = ""
            el.removeEventListener("transitionend", onEnd)
          }
          el.addEventListener("transitionend", onEnd)
        }, 50)
      } else {
        // Normal render, no ghost — record natural height synchronously.
        el.style.flexGrow = "1"
        el.style.flexShrink = ""
        el.style.flexBasis = ""
        const h = el.offsetHeight
        if (h > 0) lastNaturalHeight.current = h
      }
    } else {
      // Ghost showing — freeze spacer at last known height before paint.
      // flexShrink must also be 0 so the flex algorithm doesn't shrink the
      // spacer when the ghost causes content to overflow the container.
      if (unfreezeTimer.current) clearTimeout(unfreezeTimer.current)
      el.style.transition = ""
      // If we don't have a recorded height yet, grab it now before freezing.
      if (lastNaturalHeight.current <= 0) {
        const h = el.offsetHeight
        if (h > 0) lastNaturalHeight.current = h
      }
      if (lastNaturalHeight.current > 0) {
        el.style.flexGrow = "0"
        el.style.flexShrink = "0"
        el.style.flexBasis = `${lastNaturalHeight.current}px`
        wasFrozen.current = true
      }
    }
  })

  return (
    <div
      className="flex min-w-0 flex-1 flex-col transition-opacity duration-200 ease-out"
      style={{ opacity: isWizardLoading ? 0.55 : 1 }}
      aria-busy={isWizardLoading || undefined}
    >
      <div
        className="relative flex-1 group overflow-hidden bg-[#F5F6F8]"
      >
        {/* Preview/Map segmented control — floating top-right */}
        {!isCode && (
          <div className="absolute right-[8px] top-[8px] z-10 flex h-[28px] items-center overflow-visible rounded-[6px] bg-[#ECF1F6]">
            <ControlTooltip label="Preview">
              <button
                type="button"
                onClick={() => setCustomerPreviewMode("Preview")}
                className={cn(
                  "flex h-full items-center justify-center px-[8px] py-[6px] rounded-[6px] shrink-0 transition-colors",
                  previewMode === "Preview"
                    ? "bg-white border border-[#D4DEE9]"
                    : "border border-transparent hover:bg-[#D4DEE9]"
                )}
                aria-label="Preview"
                aria-pressed={previewMode === "Preview"}
              >
                <PreviewEyeIcon
                  className="h-[12px] w-[12px] shrink-0"
                  style={{ color: previewMode === "Preview" ? "#474E5A" : "#667691" }}
                />
              </button>
            </ControlTooltip>
            <ControlTooltip label="Object map">
              <button
                type="button"
                onClick={() => setCustomerPreviewMode("Map")}
                className={cn(
                  "flex h-full items-center justify-center px-[8px] py-[6px] rounded-[4px] shrink-0 transition-colors",
                  previewMode === "Map"
                    ? "bg-white border border-[#D4DEE9] rounded-[6px]"
                    : "border border-transparent hover:bg-[#D4DEE9]"
                )}
                aria-label="Map"
                aria-pressed={previewMode === "Map"}
              >
                <MapTreeIcon
                  className="h-[12px] w-[12px] shrink-0"
                  style={{ color: previewMode === "Map" ? "#474E5A" : "#667691" }}
                />
              </button>
            </ControlTooltip>
          </div>
        )}

        {isObjectMap ? (
          <div
            data-coachmark="object-map"
            className="min-h-[400px] lg:absolute lg:inset-0"
            style={{
              background: "var(--neutral-25, #F4F7FA)",
              boxShadow: "0 0 16px 0 rgba(0, 0, 0, 0.02) inset, 0 0 39px 0 rgba(0, 0, 0, 0.01) inset, 0 0 77px 0 rgba(0, 0, 0, 0.03) inset",
            }}
          >
            <PlanObjectMapView
              t={t}
              planName={planName}
              getPlanLabel={getPlanLabel}
              planRateCards={planRateCards}
              getPlanRateCardLabel={getPlanRateCardLabel}
              getPlanRateLabel={getPlanRateLabel}
              getRatePricingTiers={getRatePricingTiers}
              rateMeters={rateMeters}
              planCreditGrants={planCreditGrants}
              planSubscriptionFees={planSubscriptionFees}
              getPlanCreditGrantLabel={getPlanCreditGrantLabel}
              getPlanSubscriptionFeeLabel={getPlanSubscriptionFeeLabel}
              creditGrantAmounts={creditGrantAmounts}
              creditGrantPeriods={creditGrantPeriods}
              subscriptionFeeAmounts={subscriptionFeeAmounts}
              subscriptionFeePeriods={subscriptionFeePeriods}
              rateCardServicingPeriods={currentPlanDraft.rateCardServicingPeriods}
              setActivePlanRateCardId={setActivePlanRateCardId}
              setActivePlanNode={setActivePlanNode}
              handleNodeSelect={handleNodeSelect}
              selectedNodeKey={selectedNodeKey}
              selectedNodeKeys={selectedNodeKeys}
              onOpenAssistant={onOpenAssistant}
              showAdditionalNodes={showAdditionalNodes}
              onAddPlanObject={onAddPlanObject}
              onAddRate={onAddRate}
              onNodeContextMenu={onNodeContextMenu}
              allPlansInOrder={allPlansForMap}
              editingPlanId={editingPlanId}
              onSwitchToPlan={onSwitchToPlan}
              isExamplePlan={isExamplePlan}
              onBackgroundClick={onBackgroundClick}
            />
          </div>
        ) : isCode ? (
          <div className="min-h-[400px] lg:absolute lg:inset-0">
            <PlanCodeView t={t} input={codeGeneratorInput} />
          </div>
        ) : (
          <div
            className="absolute inset-0 overflow-y-auto"
            style={{
              background: "var(--neutral-25, #F4F7FA)",
              boxShadow: "0 0 16px 0 rgba(0, 0, 0, 0.02) inset, 0 0 39px 0 rgba(0, 0, 0, 0.01) inset, 0 0 77px 0 rgba(0, 0, 0, 0.03) inset",
            }}
          >
            <div className="flex min-h-full flex-col items-center">
              <div
                ref={topSpacerRef}
                className="min-h-[120px] flex-1"
              />
              <div className="w-full shrink-0 flex flex-col items-center">
                {isPlanAssistantApplying ? (
                  <div className="min-w-[432px] w-max max-w-full overflow-clip rounded-[8px] border border-[#D4DEE9] bg-white animate-pulse">
                    <div className="p-[24px]">
                      <div className="h-[32px] w-[180px] rounded-[6px] bg-[#ECF1F6]" />
                    </div>
                    <div className="border-t border-[#D4DEE9] px-[24px] py-[16px]">
                      <div className="h-[20px] w-[160px] rounded-[6px] bg-[#ECF1F6]" />
                      <div className="mt-3 h-[16px] w-[100px] rounded-[6px] bg-[#ECF1F6]" />
                      <div className="mt-4 h-[16px] w-[200px] rounded-[6px] bg-[#ECF1F6]" />
                      <div className="mt-3 h-[16px] w-[220px] rounded-[6px] bg-[#ECF1F6]" />
                    </div>
                  </div>
                ) : (
                  <PricingPlanStructurePreview
                    t={t}
                    draft={currentPlanDraft}
                    isInlineGetStartedActive={isInlineGetStartedActive}
                    getPlanLabel={getPlanLabel}
                    getPlanRateLabel={getPlanRateLabel}
                    getPlanSubscriptionFeeLabel={getPlanSubscriptionFeeLabel}
                    getPlanCreditGrantLabel={getPlanCreditGrantLabel}
                    formatCurrencyValue={formatCurrencyValue}
                    parseNumberValue={parseNumberValue}
                    selectedNodeKey={selectedNodeKey}
                    activeNodeKey={activeNodeKey}
                    ghostItemKind={ghostItemKind}
                    quickStartGhostKinds={quickStartGhostKinds}
                    onAddItem={onAddPlanObject ? (button: HTMLButtonElement) => {
                      const rect = button.getBoundingClientRect()
                      const popoverWidth = 264
                      onAddPlanObject({ top: rect.top, left: rect.left + rect.width / 2 - popoverWidth / 2, above: true })
                    } : undefined}
                  />
                )}
              </div>
              <div className="min-h-[40px] flex-1" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


