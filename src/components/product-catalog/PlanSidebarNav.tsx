'use client'

import type { Dispatch, ReactNode, RefObject, SetStateAction } from "react"
import { useDeferredValue, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"

import {
  AddSmallIcon,
  ChevronDownTiny,
  SearchIcon,
} from "@/components/ProductCatalogIcons"
import { CatalogObjectGlyph } from "@/components/product-catalog/iconography"
import { useShowAddPlan } from "@/components/product-catalog/showAddPlan"
import { useSidebarDarkMode } from "@/components/product-catalog/sidebarDarkMode"

type PlanRate = { id: number; name: string }
type PlanRateCard = { id: number; name: string; rates: PlanRate[]; priceGroupId?: number }
type PlanNamedItem = { id: number; name: string; linkedRateCardId?: number }

type PlanNode = {
  type: "plan" | "rateCard" | "rate" | "rateMeter" | "creditGrant" | "subscriptionFee" | "priceGroup"
  id?: number
  planId?: number
}

type ContextMenuInfo = {
  position: { top: number; left: number }
  nodeType: PlanNode["type"]
  nodeId?: number
  label: string
}

/** Draft data for a pricing plan */
type PlanDraft = {
  planRateCards?: PlanRateCard[]
  planRates?: PlanRate[]
  planCreditGrants?: PlanNamedItem[]
  planSubscriptionFees?: PlanNamedItem[]
  rateMeters?: Record<number, string>
}

/** Summary info for plans shown in sidebar */
type PlanSummary = { id: number; name: string; draft?: PlanDraft }

type PlanSidebarNavProps = {
  t: (key: string) => string
  isPlanAssistantApplying: boolean
  assistantHighlightedKeys?: string[]
  assistantHighlightClass?: string
  /** When false, suppress selection styling (no row appears selected). */
  isFormOpen?: boolean

  activePlanNode: PlanNode
  setActivePlanNode: Dispatch<SetStateAction<PlanNode>>
  /** All currently selected nodes (for multi-select) */
  selectedPlanNodes?: PlanNode[]
  /** Handle node selection with shift-click support */
  handleNodeSelect?: (node: PlanNode, shiftKey: boolean) => void

  planName: string
  getPlanLabel: (value: string, fallback: string) => string
  getPlanRateCardLabel: (card?: PlanRateCard | null) => string
  getPlanRateLabel: (rate?: PlanRate | null) => string
  getPlanCreditGrantLabel: (grant?: PlanNamedItem | null) => string
  getPlanSubscriptionFeeLabel: (fee?: PlanNamedItem | null) => string

  planPriceGroups?: { id: number; name: string; serviceInterval: string }[]
  onMoveProductToPriceGroup?: (productId: number, priceGroupId: number) => void
  planRateCards: PlanRateCard[]
  planRates?: PlanRate[]
  rateCardServicingPeriods?: Record<number, string>
  rateMeters: Record<number, string>
  planExpandedRateCards: Record<number, boolean>
  setPlanExpandedRateCards: Dispatch<SetStateAction<Record<number, boolean>>>
  setActivePlanRateCardId: Dispatch<SetStateAction<number>>
  onAddPlanRate: (rateCardId: number) => void
  onAddStandaloneRate?: () => void
  onMoveRateToPriceGroup?: (rateId: number, rateCardId: number) => void

  planCreditGrants: PlanNamedItem[]
  planSubscriptionFees: PlanNamedItem[]

  addPlanObjectButtonRef: RefObject<HTMLButtonElement | null>
  onToggleAddPlanObject: (anchorEl?: HTMLElement) => void

  /** Called when user clicks "Add plan" button */
  onAddPlan?: () => void

  /** Show a tip banner at the top of the sidebar */
  showSidebarTip?: boolean
  /** Dismiss the tip banner */
  onDismissSidebarTip?: () => void

  /** Called when user right-clicks on a sidebar item to show context menu */
  onContextMenu?: (info: ContextMenuInfo) => void

  /** Node IDs with validation errors — used to show red text on sidebar items */
  validationErrorNodeIds?: { type: string; id?: number }[]

  /** ID of the currently editing plan (for showing which tree is active) */
  editingPlanId?: number | null
  /** All plans in the catalog (for showing multiple plan trees) */
  allPlans?: PlanSummary[]
  /** Called when user clicks another plan to switch to editing it */
  onSwitchToPlan?: (planId: number) => void
}

function IconSlot({ children }: { children: ReactNode }) {
  // Don't constrain width: some glyphs (e.g. "RC") are intentionally wider.
  return <span className="flex h-[14px] min-w-[14px] shrink-0 items-center justify-center">{children}</span>
}

function PricingPlanNavIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="11.112"
      height="11.509"
      viewBox="0 0 12 12"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M9.86599 8.26403C10.1577 8.10138 10.623 8.10649 10.9051 8.27477C11.1871 8.44313 11.1799 8.71149 10.8885 8.87438L6.63748 11.2474C6.00951 11.5979 5.01096 11.5953 4.38845 11.2416L0.219507 8.87145C-0.0696369 8.70715 -0.0736995 8.43884 0.210718 8.27184C0.495324 8.10504 0.960577 8.10284 1.24978 8.26696L5.42068 10.6371C5.47475 10.6676 5.5615 10.6683 5.61599 10.6381L9.86599 8.26403Z"
        fill="currentColor"
      />
      <path
        d="M9.86599 5.55212C10.1577 5.38945 10.623 5.39455 10.9051 5.56286C11.1871 5.73123 11.1799 5.99958 10.8885 6.16247L6.63748 8.53552C6.00951 8.88598 5.01095 8.88339 4.38845 8.52966L0.219507 6.15954C-0.0696369 5.99523 -0.0736995 5.72692 0.210718 5.55993C0.495331 5.39311 0.96057 5.3909 1.24978 5.55505L5.42068 7.92517C5.47475 7.95564 5.56151 7.95639 5.61599 7.92614L9.86599 5.55212Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.37576 0.271845C5.0042 -0.0906524 6.02165 -0.0905775 6.65017 0.271845L10.4138 2.4447C11.0419 2.80755 11.042 3.39533 10.4138 3.75817L6.65017 5.93102C6.02172 6.29325 5.00413 6.29332 4.37576 5.93102L0.612085 3.75817C-0.0160347 3.39533 -0.0159895 2.80755 0.612085 2.4447L4.37576 0.271845ZM5.61208 0.871454C5.55751 0.840175 5.46841 0.840175 5.41384 0.871454L1.65017 3.04431C1.59651 3.07579 1.59633 3.12714 1.65017 3.15856L5.41384 5.33142C5.46835 5.36263 5.55752 5.36258 5.61208 5.33142L9.37576 3.15856C9.42985 3.12711 9.42968 3.07582 9.37576 3.04431L5.61208 0.871454Z"
        fill="currentColor"
      />
    </svg>
  )
}

function DragHandleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="6" height="10" viewBox="0 0 6 10" fill="currentColor" className="shrink-0">
      <circle cx="1" cy="1" r="1" /><circle cx="5" cy="1" r="1" />
      <circle cx="1" cy="5" r="1" /><circle cx="5" cy="5" r="1" />
      <circle cx="1" cy="9" r="1" /><circle cx="5" cy="9" r="1" />
    </svg>
  )
}

function AddIconSlot({ children, isDark }: { children: ReactNode; isDark?: boolean }) {
  // Colored plus icon without circle background
  return (
    <span className={`flex size-[14px] shrink-0 items-center justify-center ${isDark ? "text-[#E3E8EF]" : "text-[#353A44]"}`}>
      {children}
    </span>
  )
}

/** Icon slot for inline "Add rate" / "Add item" rows — uses brand purple. */
function InlineAddIconSlot({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-[14px] min-w-[14px] shrink-0 items-center justify-center text-[#533AFD]">
      {children}
    </span>
  )
}

function renderHighlightedText(text: string, needle: string) {
  const trimmedNeedle = needle.trim()
  if (!trimmedNeedle) return text

  const lowerText = text.toLowerCase()
  const lowerNeedle = trimmedNeedle.toLowerCase()
  if (!lowerText.includes(lowerNeedle)) return text

  const parts: ReactNode[] = []
  let idx = 0
  while (idx < text.length) {
    const next = lowerText.indexOf(lowerNeedle, idx)
    if (next === -1) {
      parts.push(text.slice(idx))
      break
    }

    if (next > idx) parts.push(text.slice(idx, next))
    parts.push(
      <span key={`${next}-${lowerNeedle}`} className="rounded-[3px] bg-[#E2FBFE] px-0.5">
        {text.slice(next, next + trimmedNeedle.length)}
      </span>,
    )
    idx = next + trimmedNeedle.length
  }

  return <>{parts}</>
}

export function PlanSidebarNav({
  t,
  isPlanAssistantApplying,
  assistantHighlightedKeys = [],
  isFormOpen = true,
  activePlanNode,
  setActivePlanNode,
  selectedPlanNodes,
  handleNodeSelect,
  planName,
  getPlanLabel,
  getPlanRateCardLabel,
  getPlanRateLabel,
  getPlanCreditGrantLabel,
  getPlanSubscriptionFeeLabel,
  planPriceGroups = [],
  onMoveProductToPriceGroup,
  planRateCards,
  planRates = [],
  rateCardServicingPeriods = {},
  rateMeters,
  planExpandedRateCards,
  setPlanExpandedRateCards,
  setActivePlanRateCardId,
  onAddPlanRate,
  onAddStandaloneRate,
  onMoveRateToPriceGroup,
  planCreditGrants,
  planSubscriptionFees,
  addPlanObjectButtonRef,
  onToggleAddPlanObject,
  onAddPlan,
  showSidebarTip,
  onDismissSidebarTip,
  onContextMenu,
  validationErrorNodeIds,
  editingPlanId,
  allPlans,
  onSwitchToPlan,
}: PlanSidebarNavProps) {
  const { showAddPlan } = useShowAddPlan()
  const { sidebarDarkMode: isDark } = useSidebarDarkMode()
  const [navFilter, setNavFilter] = useState("")
  const deferredNavFilter = useDeferredValue(navFilter)
  const [expandedRates, setExpandedRates] = useState<Record<number, boolean>>({})
  const [expandedOtherPlanRateCards, setExpandedOtherPlanRateCards] = useState<Record<string, boolean>>({})
  const [dragOverRateCardId, setDragOverRateCardId] = useState<number | null>(null)
  const [dragOverPriceGroupId, setDragOverPriceGroupId] = useState<number | null>(null)
  const [expandedPriceGroups, setExpandedPriceGroups] = useState<Record<number, boolean>>({})
  const [draggingRateId, setDraggingRateId] = useState<number | null>(null)
  const selectionEnabled = true

  // Helper to check if a node has validation errors
  const hasValidationError = (type: string, id?: number) => {
    if (!validationErrorNodeIds || validationErrorNodeIds.length === 0) return false
    return validationErrorNodeIds.some((n) => n.type === type && n.id === id)
  }

  // Helper to check if a node is selected (supports multi-select)
  // Treats undefined id/planId as "matches any" so the initial { type: "plan" } state highlights correctly.
  const isNodeSelected = (node: PlanNode) => {
    if (selectedPlanNodes) {
      return selectedPlanNodes.some(n =>
        n.type === node.type &&
        (n.id === undefined || node.id === undefined || n.id === node.id) &&
        (n.planId === undefined || node.planId === undefined || n.planId === node.planId)
      )
    }
    // Fallback to single selection
    return activePlanNode.type === node.type &&
           (activePlanNode.id === undefined || node.id === undefined || activePlanNode.id === node.id) &&
           (activePlanNode.planId === undefined || node.planId === undefined || activePlanNode.planId === node.planId)
  }

  // Helper to handle node click with multi-select support (shift, cmd, ctrl)
  const onNodeClick = (node: PlanNode, e: React.MouseEvent) => {
    if (handleNodeSelect) {
      const isMultiSelect = e.shiftKey || e.metaKey || e.ctrlKey
      handleNodeSelect(node, isMultiSelect)
    } else {
      setActivePlanNode(node)
    }
  }

  // Check if an item has AI changes based on highlighted keys
  const hasChanges = (prefix: string) => assistantHighlightedKeys.some((key) => key.startsWith(prefix))
  const planHasChanges = hasChanges("plan.")
  const rateCardHasChanges = (id: number) => hasChanges(`rateCard.${id}.`) || hasChanges("rateCard.")
  const rateHasChanges = (id: number) => hasChanges("rate.") || hasChanges(`rate.tier.${id}`)
  const creditGrantHasChanges = (id: number) => hasChanges(`creditGrant.${id}.`) || hasChanges("creditGrant.")
  const subscriptionFeeHasChanges = (id: number) => hasChanges(`subscriptionFee.${id}.`) || hasChanges("subscriptionFee.")

  const {
    planMatches,
    filteredRateCards,
    filteredStandaloneRates,
    filteredCreditGrants,
    filteredSubscriptionFees,
    hasAnyResults,
    isFiltering,
  } = useMemo(() => {
    const needle = deferredNavFilter.trim().toLowerCase()
    const isFiltering = needle.length > 0

    const matches = (value: string) => value.trim().toLowerCase().includes(needle)

    const planLabel = getPlanLabel(planName, t("Pricing plan"))
    const planMatches = isFiltering ? matches(planLabel) : false

    const filteredRateCards = planRateCards
      .map((card) => {
        const cardLabel = getPlanRateCardLabel(card)
        const cardMatches = isFiltering ? matches(cardLabel) : false

        const rates =
          !isFiltering || planMatches || cardMatches
            ? card.rates
            : card.rates.filter((rate) => {
                const rateLabel = getPlanRateLabel(rate)
                const meterLabel = (rateMeters?.[rate.id] ?? "").trim()
                return matches(rateLabel) || (meterLabel !== "" && matches(meterLabel))
              })

        const hasMatchingDescendant = isFiltering ? rates.length > 0 : true
        const visible = !isFiltering || planMatches || cardMatches || hasMatchingDescendant

        return {
          card,
          visible,
          cardMatches,
          rates,
        }
      })
      .filter((x) => x.visible)

    const filteredStandaloneRates =
      !isFiltering || planMatches
        ? planRates
        : planRates.filter((rate) => {
            const rateLabel = getPlanRateLabel(rate)
            const meterLabel = (rateMeters?.[rate.id] ?? "").trim()
            return matches(rateLabel) || (meterLabel !== "" && matches(meterLabel))
          })

    const filteredCreditGrants =
      !isFiltering || planMatches
        ? planCreditGrants
        : planCreditGrants.filter((grant) => matches(getPlanCreditGrantLabel(grant)))

    const filteredSubscriptionFees =
      !isFiltering || planMatches
        ? planSubscriptionFees
        : planSubscriptionFees.filter((fee) => matches(getPlanSubscriptionFeeLabel(fee)))

    const hasAnyResults =
      !isFiltering ||
      planMatches ||
      filteredRateCards.length > 0 ||
      filteredStandaloneRates.length > 0 ||
      filteredCreditGrants.length > 0 ||
      filteredSubscriptionFees.length > 0

    return {
      planMatches,
      filteredRateCards,
      filteredStandaloneRates,
      filteredCreditGrants,
      filteredSubscriptionFees,
      hasAnyResults,
      isFiltering,
    }
  }, [
    deferredNavFilter,
    planName,
    planRateCards,
    planRates,
    planCreditGrants,
    planSubscriptionFees,
    rateMeters,
    getPlanLabel,
    getPlanRateCardLabel,
    getPlanRateLabel,
    getPlanCreditGrantLabel,
    getPlanSubscriptionFeeLabel,
    t,
  ])

  // Dark mode color palette
  const textPrimary = isDark ? "text-[#E3E8EF]" : "text-[#1A2C44]"
  const textSecondary = isDark ? "text-[#8B95A5]" : "text-[#6C7688]"
  const textBold = isDark ? "text-[#F0F2F5]" : "text-[#353A44]"
  const textError = isDark ? "text-[#F46B7D]" : "text-[#DF1B41]"
  const hoverBg = isDark ? "hover:bg-[#21252C]" : "hover:bg-[#F4F7FA]"
  const activeBg = isDark ? "bg-[#21252C]" : "bg-[#F7F5FD]"

  const rowBase =
    `flex w-full items-center gap-[8px] rounded-[6px] px-[8px] py-[4px] text-left text-[12px] font-[400] leading-[16px] ${textPrimary}`

  // Plan row uses bold weight
  const planRowBase =
    `flex w-full items-center gap-[8px] rounded-[6px] pl-[12px] pr-[8px] py-[4px] text-left text-[12px] font-[500] leading-[16px] tracking-[-0.024px] ${textPrimary}`

  const childRowIndent = "pl-[15px]"
  const grandchildRowIndent = "pl-[37px]"
  const greatGrandchildRowIndent = "pl-[78px]"

  const addRowBase =
    // Note: inside flex-col containers, items default to `stretch` (making buttons full width).
    // `self-start` ensures these "add" links hug content as in Figma.
    `inline-flex self-start items-center gap-[6px] rounded-[6px] px-[8px] py-[2px] text-left text-[12px] font-[600] leading-[20px] tracking-[-0.15px] ${textBold} ${isDark ? "hover:bg-[#21252C]" : "hover:bg-[#F5F6F8]"}`

  // Inline "Add rate" / "Add item" rows live within the tree at the same indent
  // as their siblings. They borrow the row layout so the + icon lines up with
  // the glyphs in adjacent rows; the empty 12px placeholder stands in for the
  // chevron column that other rows reveal on hover.
  const inlineAddRowBase =
    `flex w-full items-center gap-[8px] rounded-[6px] px-[8px] py-[4px] text-left text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#533AFD] ${isDark ? "hover:bg-[#21252C]" : "hover:bg-[#F5F6F8]"}`

  // Easy toggle: counts are helpful, but hidden for now per design feedback.
  const SHOW_RATE_COUNTS = false

  return (
    <aside data-coachmark="sidebar" className={`group/nav relative z-10 flex h-full w-full flex-col backdrop-blur-[6px] pt-[12px] sm:w-[280px] sm:min-w-[280px] sm:max-w-[280px] sm:shrink-0 sm:border-r ${isDark ? "bg-[#14171D]/[0.97] border-[#1B1E25]" : "bg-white/[0.97] border-[#EBEEF1]"}`}>
      <div className="flex min-h-0 flex-1 flex-col gap-[2px]">
        <div className={`px-[8px] pb-[4px] ${isDark ? "bg-[#14171D]" : ""}`}>
          <div className="relative flex items-center">
            <SearchIcon className={`pointer-events-none absolute left-[12px] ${textSecondary}`} />
            <input
              value={navFilter}
              onChange={(e) => setNavFilter(e.target.value)}
              placeholder={t("Filter...")}
              aria-label={t("Filter sidebar items")}
              className={`w-full rounded-[6px] border pl-[30px] pr-[12px] py-[8px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] focus:outline-none focus:shadow-[0_0_0_1.5px_#A0D0F7] focus:border-[#A0D0F7] transition-all ${isDark ? "border-[#21252C] bg-[#1B1E25] text-[#E3E8EF] placeholder:text-[#6B7280]" : "border-[#D8DEE4] bg-white text-[#353A44] placeholder:text-[#6C7688]"}`}
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-[8px]">
          {isPlanAssistantApplying ? (
            <div
              className="animate-pulse space-y-3 px-[8px]"
              role="status"
              aria-busy="true"
              aria-label={t("Applying changes")}
            >
              <div className={`h-[18px] w-[180px] rounded-[6px] ${isDark ? "bg-[#1B1E25]" : "bg-[#EBEEF1]"}`} />
              <div className="space-y-[2px]">
                <div className={`h-[24px] w-full rounded-[6px] ${isDark ? "bg-[#1B1E25]" : "bg-[#EBEEF1]"}`} />
                <div className={`h-[24px] w-[92%] rounded-[6px] ${isDark ? "bg-[#1B1E25]" : "bg-[#EBEEF1]"}`} />
                <div className={`h-[24px] w-[86%] rounded-[6px] ${isDark ? "bg-[#1B1E25]" : "bg-[#EBEEF1]"}`} />
                <div className={`h-[24px] w-[90%] rounded-[6px] ${isDark ? "bg-[#1B1E25]" : "bg-[#EBEEF1]"}`} />
                <div className={`h-[24px] w-[84%] rounded-[6px] ${isDark ? "bg-[#1B1E25]" : "bg-[#EBEEF1]"}`} />
                <div className={`h-[24px] w-[78%] rounded-[6px] ${isDark ? "bg-[#1B1E25]" : "bg-[#EBEEF1]"}`} />
              </div>
              <div className={`h-[18px] w-[120px] rounded-[6px] ${isDark ? "bg-[#1B1E25]" : "bg-[#EBEEF1]"}`} />
            </div>
          ) : (
            <div className="flex flex-col gap-[2px]">
              {!hasAnyResults ? (
                <div className={`rounded-[6px] border px-[8px] py-[8px] text-[12px] font-[500] ${isDark ? "border-[#1B1E25] text-[#6B7280]" : "border-[#EBEEF1] text-[#6C7688]"}`}>
                  {t("No results")}
                </div>
              ) : null}

              {/* All plans - rendered in stable order */}
              {allPlans && allPlans.length > 0 ? (
                // Multiple plans mode - render all plans from allPlans array in stable order
                allPlans.map((plan, planIndex) => {
                  // When editingPlanId is null (initial load), treat the first plan as current
                  const isCurrentPlan = editingPlanId != null ? plan.id === editingPlanId : planIndex === 0

                  // For the current plan, use live props. For other plans, use draft data.
                  const currentPlanRateCards = isCurrentPlan ? filteredRateCards : (plan.draft?.planRateCards ?? []).map(card => ({ card, cardMatches: false, rates: card.rates }))
                  const currentStandaloneRates = isCurrentPlan ? filteredStandaloneRates : (plan.draft?.planRates ?? [])
                  const currentCreditGrants = isCurrentPlan ? filteredCreditGrants : (plan.draft?.planCreditGrants ?? [])
                  const currentSubscriptionFees = isCurrentPlan ? filteredSubscriptionFees : (plan.draft?.planSubscriptionFees ?? [])
                  const currentPlanName = isCurrentPlan ? planName : plan.name
                  const currentRateMeters = isCurrentPlan ? rateMeters : (plan.draft?.rateMeters ?? {})

                  return (
                    <div key={plan.id} className="flex flex-col gap-[2px]">
                      {/* Plan header row */}
                      <div
                        className={`${planRowBase} justify-between ${
                          isCurrentPlan && selectionEnabled && isNodeSelected({ type: "plan", id: plan.id, planId: plan.id })
                            ? activeBg
                            : hoverBg
                        }`}
                        data-coachmark={isCurrentPlan ? "pricing-plan" : undefined}
                      >
                        <button
                          type="button"
                          className="flex min-w-0 flex-1 items-center justify-start gap-[8px] text-left"
                          onClick={(e) => {
                            const isMultiSelect = e.shiftKey || e.metaKey || e.ctrlKey
                            if (isCurrentPlan || isMultiSelect) {
                              onNodeClick({ type: "plan", id: plan.id, planId: plan.id }, e)
                            } else {
                              onSwitchToPlan?.(plan.id)
                            }
                          }}
                          onContextMenu={(e) => {
                            if (isCurrentPlan) {
                              e.preventDefault()
                              onContextMenu?.({
                                position: { top: e.clientY, left: e.clientX },
                                nodeType: "plan",
                                label: getPlanLabel(currentPlanName, t("Pricing plan")),
                              })
                            }
                          }}
                        >
                          <IconSlot>
                            <PricingPlanNavIcon className="text-[#3C4F69]" />
                          </IconSlot>
                          <span className={`min-w-0 flex-1 truncate ${isCurrentPlan && hasValidationError("plan", undefined) ? textError : currentPlanName ? "" : textSecondary}`}>
                            {(() => {
                              const label = getPlanLabel(currentPlanName, t("Pricing plan"))
                              return isFiltering && isCurrentPlan && planMatches ? renderHighlightedText(label, deferredNavFilter) : label
                            })()}
                          </span>
                        </button>

                      </div>

                      {/* Plan children */}
                      <>
                        {/* Price groups */}
                        {isCurrentPlan && planPriceGroups.length > 0 && (
                          <div className="flex flex-col gap-[2px]">
                            {planPriceGroups.map((pg) => {
                              const isPgActive = selectionEnabled && isNodeSelected({ type: "priceGroup", id: pg.id, planId: plan.id })
                              const isPgExpanded = expandedPriceGroups[pg.id] ?? true
                              const groupedProducts = planRateCards.filter((c) => c.priceGroupId === pg.id)
                              return (
                                <div key={`pg-${pg.id}`} className="flex flex-col gap-[2px]">
                                  <button
                                    type="button"
                                    className={`${rowBase} ${childRowIndent} justify-between ${
                                      dragOverPriceGroupId === pg.id ? "ring-2 ring-[#533AFD] ring-inset" : ""
                                    } ${isPgActive ? activeBg : hoverBg}`}
                                    onClick={(e) => onNodeClick({ type: "priceGroup", id: pg.id, planId: plan.id }, e)}
                                    onDragOver={(e) => {
                                      if (e.dataTransfer.types.includes("application/x-product-id")) {
                                        e.preventDefault()
                                        e.dataTransfer.dropEffect = "move"
                                        setDragOverPriceGroupId(pg.id)
                                      }
                                    }}
                                    onDragLeave={() => {
                                      if (dragOverPriceGroupId === pg.id) setDragOverPriceGroupId(null)
                                    }}
                                    onDrop={(e) => {
                                      setDragOverPriceGroupId(null)
                                      const productIdStr = e.dataTransfer.getData("application/x-product-id")
                                      if (!productIdStr) return
                                      e.preventDefault()
                                      const cardId = parseInt(productIdStr, 10)
                                      if (Number.isFinite(cardId)) {
                                        onMoveProductToPriceGroup?.(cardId, pg.id)
                                      }
                                    }}
                                  >
                                    <div className="flex min-w-0 flex-1 items-center gap-[8px]">
                                      <span
                                        role="button"
                                        tabIndex={-1}
                                        className={`flex shrink-0 items-center p-[2px] ${isDark ? "text-[#6B7280]" : "text-[#3C4F69]"} opacity-0 group-hover/nav:opacity-100 transition-opacity`}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setExpandedPriceGroups((prev) => ({ ...prev, [pg.id]: !isPgExpanded }))
                                        }}
                                      >
                                        <ChevronDownTiny className={`transition-transform ${isPgExpanded ? "" : "-rotate-90"}`} />
                                      </span>
                                      <IconSlot>
                                        <CatalogObjectGlyph kind="rateCard" />
                                      </IconSlot>
                                      <span className={`min-w-0 flex-1 truncate ${pg.name ? "" : textSecondary}`}>
                                        {pg.name || "Price group"}
                                      </span>
                                    </div>
                                  </button>
                                  {isPgExpanded && groupedProducts.length > 0 && (
                                    <div className="flex flex-col gap-[2px]">
                                      {groupedProducts.map((card) => {
                                        const isCardActive = selectionEnabled && isNodeSelected({ type: "rateCard", id: card.id, planId: plan.id })
                                        const cardExpanded = planExpandedRateCards?.[card.id] ?? true
                                        return (
                                          <div key={card.id} className="flex flex-col gap-[2px]">
                                            <button
                                              type="button"
                                              className={`${rowBase} ${grandchildRowIndent} ${isCardActive ? activeBg : hoverBg}`}
                                              onClick={(e) => onNodeClick({ type: "rateCard", id: card.id, planId: plan.id }, e)}
                                            >
                                              <span className="w-[12px] shrink-0" />
                                              <IconSlot>
                                                <CatalogObjectGlyph kind={rateCardServicingPeriods[card.id] === "Flat" ? "subscriptionFee" : "product"} />
                                              </IconSlot>
                                              <span className={`min-w-0 flex-1 truncate ${card.name ? "" : textSecondary}`}>
                                                {getPlanRateCardLabel(card)}
                                              </span>
                                            </button>
                                            {cardExpanded && card.rates.map((rate) => (
                                              <button
                                                key={rate.id}
                                                type="button"
                                                className={`${rowBase} pl-[52px] ${selectionEnabled && isNodeSelected({ type: "rate", id: rate.id, planId: plan.id }) ? activeBg : hoverBg}`}
                                                onClick={(e) => onNodeClick({ type: "rate", id: rate.id, planId: plan.id }, e)}
                                              >
                                                <span className="w-[12px] shrink-0" />
                                                <IconSlot>
                                                  <CatalogObjectGlyph kind="price" />
                                                </IconSlot>
                                                <span className={`min-w-0 flex-1 truncate ${getPlanRateLabel(rate) === "Price" ? textSecondary : ""}`}>
                                                  {getPlanRateLabel(rate)}
                                                </span>
                                              </button>
                                            ))}
                                          </div>
                                        )
                                      })}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {/* Rate cards (ungrouped products) */}
                        <div className="flex flex-col gap-[2px]">
                          {currentPlanRateCards.filter(({ card }) => card.priceGroupId == null).map(({ card, cardMatches, rates }) => {
                            const cardKey = isCurrentPlan ? card.id : `${plan.id}-${card.id}`
                            const isActive = isCurrentPlan && selectionEnabled && isNodeSelected({ type: "rateCard", id: card.id, planId: plan.id })
                            const isExpanded = isCurrentPlan
                              ? (isFiltering ? true : (planExpandedRateCards?.[card.id] ?? false))
                              : (expandedOtherPlanRateCards[`${plan.id}-${card.id}`] ?? false)
                            const hasChildren = true
                            const showAllRates = !isFiltering || planMatches || cardMatches

                            return (
                              <div key={cardKey} className="flex flex-col gap-[2px]">
                                  <div
                                    draggable={isCurrentPlan && !!onMoveProductToPriceGroup && planPriceGroups.length > 0}
                                    onDragStart={isCurrentPlan && onMoveProductToPriceGroup && planPriceGroups.length > 0 ? (e) => {
                                      e.dataTransfer.setData("application/x-product-id", String(card.id))
                                      e.dataTransfer.effectAllowed = "move"
                                    } : undefined}
                                    className={`group/row ${rowBase} ${childRowIndent} justify-between ${
                                      isActive ? activeBg : hoverBg
                                    }`}
                                    data-coachmark={isCurrentPlan ? "rate-card" : undefined}
                                  >
                                    <button
                                      type="button"
                                      className="flex min-w-0 flex-1 items-center justify-start gap-[8px] text-left"
                                      onClick={(e) => {
                                        const isMultiSelect = e.shiftKey || e.metaKey || e.ctrlKey
                                        if (isCurrentPlan || isMultiSelect) {
                                          setActivePlanRateCardId(card.id)
                                          if (isCurrentPlan) {
                                            setPlanExpandedRateCards((prev) => ({ ...(prev ?? {}), [card.id]: true }))
                                          }
                                          onNodeClick({ type: "rateCard", id: card.id, planId: plan.id }, e)
                                        } else {
                                          onSwitchToPlan?.(plan.id)
                                        }
                                      }}
                                      onContextMenu={(e) => {
                                        if (isCurrentPlan) {
                                          e.preventDefault()
                                          onContextMenu?.({
                                            position: { top: e.clientY, left: e.clientX },
                                            nodeType: "rateCard",
                                            nodeId: card.id,
                                            label: getPlanRateCardLabel(card),
                                          })
                                        }
                                      }}
                                    >
                                      {hasChildren ? (
                                        <span
                                          role="button"
                                          tabIndex={-1}
                                          className={`flex shrink-0 items-center p-[2px] ${isDark ? "text-[#6B7280]" : "text-[#3C4F69]"} opacity-0 group-hover/nav:opacity-100 transition-opacity`}
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            if (isCurrentPlan) {
                                              setPlanExpandedRateCards((prev) => ({ ...(prev ?? {}), [card.id]: !isExpanded }))
                                            } else {
                                              setExpandedOtherPlanRateCards((prev) => ({ ...prev, [`${plan.id}-${card.id}`]: !isExpanded }))
                                            }
                                          }}
                                        >
                                          <ChevronDownTiny className={`transition-transform ${isExpanded ? "" : "-rotate-90"}`} />
                                        </span>
                                      ) : (
                                        <span className="w-[12px]" />
                                      )}
                                      <IconSlot>
                                        <CatalogObjectGlyph kind={rateCardServicingPeriods[card.id] === "Flat" ? "subscriptionFee" : "product"} highlighted={isCurrentPlan && rateCardHasChanges(card.id)} error={isCurrentPlan && hasValidationError("rateCard", card.id)} />
                                      </IconSlot>
                                      <span className={`min-w-0 flex-1 truncate ${isCurrentPlan && hasValidationError("rateCard", card.id) ? textError : card.name ? "" : textSecondary}`}>
                                        {(() => {
                                          const label = getPlanRateCardLabel(card)
                                          return isFiltering && isCurrentPlan && cardMatches ? renderHighlightedText(label, deferredNavFilter) : label
                                        })()}
                                      </span>
                                    </button>

                                    {SHOW_RATE_COUNTS && isCurrentPlan
                                      ? (() => {
                                          const count = showAllRates ? card.rates.length : rates.length
                                          return count > 0 ? (
                                            <span className={`flex h-[20px] shrink-0 items-center rounded-[5px] px-[6px] text-[11px] leading-[16px] ${isDark ? "bg-[#1B1E25] text-[#8B95A5]" : "bg-[#EBEEF1] text-[#596171]"}`}>
                                              {count}
                                            </span>
                                          ) : null
                                        })()
                                      : null}
                                    {isCurrentPlan && onMoveProductToPriceGroup && planPriceGroups.length > 0 && (
                                      <span className={`flex shrink-0 items-center cursor-grab ${isDark ? "text-[#6B7280]" : "text-[#B6C0CD]"} opacity-0 group-hover/row:opacity-100 transition-opacity`}>
                                        <DragHandleIcon />
                                      </span>
                                    )}
                                  </div>

                                <AnimatePresence>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                    className="flex flex-col gap-[2px] overflow-hidden"
                                  >
                                    {(showAllRates ? card.rates : rates).map((rate) => {
                                      const isRateActive = isCurrentPlan && selectionEnabled && isNodeSelected({ type: "rate", id: rate.id, planId: plan.id })
                                      const meterLabel = (currentRateMeters?.[rate.id] ?? "").trim()
                                      const isMeterActive = isCurrentPlan && selectionEnabled && isNodeSelected({ type: "rateMeter", id: rate.id, planId: plan.id })
                                      const showMeter = isCurrentPlan
                                      const isRateExpanded = isCurrentPlan
                                        ? (isFiltering ? true : (expandedRates[rate.id] ?? false))
                                        : false

                                      return (
                                        <div key={rate.id} className="flex flex-col gap-[2px]">
                                            <div
                                              className={`${rowBase} ${grandchildRowIndent} ${
                                                isRateActive
                                                  ? activeBg
                                                  : hoverBg
                                              }`}
                                              data-coachmark={isCurrentPlan ? "rate" : undefined}
                                            >
                                              <button
                                                type="button"
                                                className="flex min-w-0 flex-1 items-center justify-start gap-[8px] text-left"
                                                onClick={(e) => {
                                                  const isMultiSelect = e.shiftKey || e.metaKey || e.ctrlKey
                                                  if (isCurrentPlan || isMultiSelect) {
                                                    setActivePlanRateCardId(card.id)
                                                    setExpandedRates((prev) => ({ ...prev, [rate.id]: true }))
                                                    onNodeClick({ type: "rate", id: rate.id, planId: plan.id }, e)
                                                  } else {
                                                    onSwitchToPlan?.(plan.id)
                                                  }
                                                }}
                                                onContextMenu={(e) => {
                                                  if (isCurrentPlan) {
                                                    e.preventDefault()
                                                    onContextMenu?.({
                                                      position: { top: e.clientY, left: e.clientX },
                                                      nodeType: "rate",
                                                      nodeId: rate.id,
                                                      label: getPlanRateLabel(rate),
                                                    })
                                                  }
                                                }}
                                              >
                                                <span className="w-[12px]" />
                                                <IconSlot>
                                                  <CatalogObjectGlyph kind="price" highlighted={isCurrentPlan && rateHasChanges(rate.id)} error={isCurrentPlan && hasValidationError("rate", rate.id)} />
                                                </IconSlot>
                                                <span className={`min-w-0 flex-1 truncate ${isCurrentPlan && hasValidationError("rate", rate.id) ? textError : getPlanRateLabel(rate) === "Price" ? textSecondary : ""}`}>
                                                  {(() => {
                                                    const label = getPlanRateLabel(rate)
                                                    return isFiltering && isCurrentPlan &&
                                                      label.trim().toLowerCase().includes(deferredNavFilter.trim().toLowerCase())
                                                      ? renderHighlightedText(label, deferredNavFilter)
                                                      : label
                                                  })()}
                                                </span>
                                              </button>
                                            </div>
                                        </div>
                                      )
                                    })}


                                  </motion.div>
                                )}
                                </AnimatePresence>
                              </div>
                            )
                          })}
                        </div>

                        {/* Standalone rates (not in any rate card) */}
                        {currentStandaloneRates.length > 0 && (
                          <div className="flex flex-col gap-[2px]">
                            {currentStandaloneRates.map((rate) => {
                              const isRateActive = isCurrentPlan && selectionEnabled && isNodeSelected({ type: "rate", id: rate.id, planId: plan.id })
                              const meterLabel = (currentRateMeters?.[rate.id] ?? "").trim()
                              const isMeterActive = isCurrentPlan && selectionEnabled && isNodeSelected({ type: "rateMeter", id: rate.id, planId: plan.id })
                              const isRateExpanded = isCurrentPlan ? (isFiltering ? true : (expandedRates[rate.id] ?? false)) : false

                              const isDragging = isCurrentPlan && draggingRateId === rate.id

                              return (
                                <div key={rate.id} className="flex flex-col gap-[2px]">
                                  <div
                                    draggable={false}
                                    className={`${rowBase} ${childRowIndent} justify-between ${
                                      isRateActive ? activeBg : hoverBg
                                    } ${isDragging ? "opacity-40" : ""}`}
                                    data-coachmark={isCurrentPlan ? "rate" : undefined}
                                  >
                                    <button
                                      type="button"
                                      className="flex min-w-0 flex-1 items-center justify-start gap-[8px] text-left"
                                      onClick={(e) => {
                                        if (isCurrentPlan) {
                                          setExpandedRates((prev) => ({ ...prev, [rate.id]: true }))
                                          onNodeClick({ type: "rate", id: rate.id, planId: plan.id }, e)
                                        } else {
                                          onSwitchToPlan?.(plan.id)
                                        }
                                      }}
                                      onContextMenu={(e) => {
                                        if (isCurrentPlan) {
                                          e.preventDefault()
                                          onContextMenu?.({
                                            position: { top: e.clientY, left: e.clientX },
                                            nodeType: "rate",
                                            nodeId: rate.id,
                                            label: getPlanRateLabel(rate),
                                          })
                                        }
                                      }}
                                    >
                                      {isCurrentPlan ? (
                                        <span
                                          role="button"
                                          tabIndex={-1}
                                          className={`flex shrink-0 items-center p-[2px] ${isDark ? "text-[#6B7280]" : "text-[#3C4F69]"} opacity-0 group-hover/nav:opacity-100 transition-opacity`}
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setExpandedRates((prev) => ({ ...prev, [rate.id]: !isRateExpanded }))
                                          }}
                                        >
                                          <ChevronDownTiny className={`transition-transform ${isRateExpanded ? "" : "-rotate-90"}`} />
                                        </span>
                                      ) : (
                                        <span className="w-[12px]" />
                                      )}
                                      <IconSlot>
                                        <CatalogObjectGlyph kind="price" highlighted={isCurrentPlan && rateHasChanges(rate.id)} error={isCurrentPlan && hasValidationError("rate", rate.id)} />
                                      </IconSlot>
                                      <span className={`min-w-0 flex-1 truncate ${isCurrentPlan && hasValidationError("rate", rate.id) ? textError : getPlanRateLabel(rate) === "Price" ? textSecondary : ""}`}>
                                        {(() => {
                                          const label = getPlanRateLabel(rate)
                                          return isFiltering && isCurrentPlan && label.trim().toLowerCase().includes(deferredNavFilter.trim().toLowerCase())
                                            ? renderHighlightedText(label, deferredNavFilter)
                                            : label
                                        })()}
                                      </span>
                                    </button>
                                  </div>

                                </div>
                              )
                            })}
                          </div>
                        )}

                        {/* Credit grants */}
                        {currentCreditGrants.length > 0 && (
                          <div className="flex flex-col gap-[2px]">
                            {currentCreditGrants.map((grant) => (
                              <button
                                key={grant.id}
                                type="button"
                                className={`${rowBase} ${childRowIndent} ${
                                  isCurrentPlan && selectionEnabled && isNodeSelected({ type: "creditGrant", id: grant.id, planId: plan.id })
                                    ? activeBg
                                    : hoverBg
                                }`}
                                data-coachmark={isCurrentPlan ? "credit-grant" : undefined}
                                onClick={(e) => {
                                  const isMultiSelect = e.shiftKey || e.metaKey || e.ctrlKey
                                  if (isCurrentPlan || isMultiSelect) {
                                    onNodeClick({ type: "creditGrant", id: grant.id, planId: plan.id }, e)
                                  } else {
                                    onSwitchToPlan?.(plan.id)
                                  }
                                }}
                              >
                                <span className="w-[12px] shrink-0" />
                                <IconSlot>
                                  <CatalogObjectGlyph kind="creditGrant" highlighted={isCurrentPlan && creditGrantHasChanges(grant.id)} error={isCurrentPlan && hasValidationError("creditGrant", grant.id)} />
                                </IconSlot>
                                <span className={`min-w-0 flex-1 truncate ${isCurrentPlan && hasValidationError("creditGrant", grant.id) ? textError : grant.name ? "" : textSecondary}`}>
                                  {(() => {
                                    const label = getPlanCreditGrantLabel(grant)
                                    return isFiltering && isCurrentPlan ? renderHighlightedText(label, deferredNavFilter) : label
                                  })()}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Subscription fees */}
                        <div className="flex flex-col gap-[2px]">

                          {currentSubscriptionFees.map((fee) => (
                            <button
                              key={fee.id}
                              type="button"
                              className={`${rowBase} ${childRowIndent} ${
                                isCurrentPlan && selectionEnabled && isNodeSelected({ type: "subscriptionFee", id: fee.id, planId: plan.id })
                                  ? activeBg
                                  : hoverBg
                              }`}
                              data-coachmark={isCurrentPlan ? "subscription-fee" : undefined}
                              onClick={(e) => {
                                const isMultiSelect = e.shiftKey || e.metaKey || e.ctrlKey
                                if (isCurrentPlan || isMultiSelect) {
                                  onNodeClick({ type: "subscriptionFee", id: fee.id, planId: plan.id }, e)
                                } else {
                                  onSwitchToPlan?.(plan.id)
                                }
                              }}
                              onContextMenu={(e) => {
                                if (isCurrentPlan) {
                                  e.preventDefault()
                                  onContextMenu?.({
                                    position: { top: e.clientY, left: e.clientX },
                                    nodeType: "subscriptionFee",
                                    nodeId: fee.id,
                                    label: getPlanSubscriptionFeeLabel(fee),
                                  })
                                }
                              }}
                            >
                              <span className="w-[12px] shrink-0" />
                              <IconSlot>
                                <CatalogObjectGlyph kind="subscriptionFee" highlighted={isCurrentPlan && subscriptionFeeHasChanges(fee.id)} error={isCurrentPlan && hasValidationError("subscriptionFee", fee.id)} />
                              </IconSlot>
                              <span className={`min-w-0 flex-1 truncate ${isCurrentPlan && hasValidationError("subscriptionFee", fee.id) ? textError : fee.name ? "" : textSecondary}`}>
                                {(() => {
                                  const label = getPlanSubscriptionFeeLabel(fee)
                                  return isFiltering && isCurrentPlan ? renderHighlightedText(label, deferredNavFilter) : label
                                })()}
                              </span>
                            </button>
                          ))}

                        </div>

                        {isCurrentPlan && !isFiltering && (
                          <button
                            type="button"
                            data-onboarding="plus-button"
                            className={`${inlineAddRowBase} ${childRowIndent}`}
                            aria-label={t("Add")}
                            onClick={(e) => {
                              onToggleAddPlanObject(e.currentTarget)
                            }}
                          >
                            <span className="w-[12px] shrink-0" />
                            <InlineAddIconSlot>
                              <AddSmallIcon />
                            </InlineAddIconSlot>
                            <span>{t("Add")}</span>
                          </button>
                        )}

                      </>
                    </div>
                  )
                })
              ) : (
                // Single plan mode (fallback) - original behavior for when allPlans is not provided
                <>
                  {/* Pricing plan */}
                  <div
                    className={`${planRowBase} justify-between ${
                      selectionEnabled && isNodeSelected({ type: "plan" })
                        ? activeBg
                        : hoverBg
                    }`}
                    data-coachmark="pricing-plan"
                  >
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-center justify-start gap-[8px] text-left"
                      onClick={(e) => onNodeClick({ type: "plan" }, e)}
                      onContextMenu={(e) => {
                        e.preventDefault()
                        onContextMenu?.({
                          position: { top: e.clientY, left: e.clientX },
                          nodeType: "plan",
                          label: getPlanLabel(planName, t("Pricing plan")),
                        })
                      }}
                    >
                      <IconSlot>
                        <PricingPlanNavIcon className="text-[#3C4F69]" />
                      </IconSlot>
                      <span className={`min-w-0 flex-1 truncate ${hasValidationError("plan", undefined) ? textError : planName ? "" : textSecondary}`}>
                        {(() => {
                          const label = getPlanLabel(planName, t("Pricing plan"))
                          return isFiltering && planMatches ? renderHighlightedText(label, deferredNavFilter) : label
                        })()}
                      </span>
                    </button>

                  </div>

                  {/* Plan children */}
                  <>
                      {/* Rate cards */}
                      <div className="flex flex-col gap-[2px]">
                        {filteredRateCards.map(({ card, cardMatches, rates }) => {
                          const isActive = selectionEnabled && isNodeSelected({ type: "rateCard", id: card.id })
                          const isExpanded = isFiltering ? true : (planExpandedRateCards?.[card.id] ?? false)
                          const hasChildren = true
                          const showAllRates = !isFiltering || planMatches || cardMatches

                          return (
                            <div key={card.id} className="flex flex-col gap-[2px]">
                                <div
                                  onDragOver={(e) => {
                                    if (draggingRateId == null) return
                                    e.preventDefault()
                                    e.dataTransfer.dropEffect = "move"
                                    setDragOverRateCardId(card.id)
                                  }}
                                  onDragLeave={() => { if (dragOverRateCardId === card.id) setDragOverRateCardId(null) }}
                                  onDrop={(e) => {
                                    e.preventDefault()
                                    setDragOverRateCardId(null)
                                    const rateId = parseInt(e.dataTransfer.getData("text/plain"), 10)
                                    if (Number.isFinite(rateId)) onMoveRateToPriceGroup?.(rateId, card.id)
                                  }}
                                  className={`group/row ${rowBase} ${childRowIndent} justify-between ${
                                    dragOverRateCardId === card.id ? "ring-2 ring-[#533AFD] ring-inset" : ""
                                  } ${
                                    isActive ? activeBg : hoverBg
                                  }`}
                                  data-coachmark="rate-card"
                                >
                                  <button
                                    type="button"
                                    className="flex min-w-0 flex-1 items-center justify-start gap-[8px] text-left"
                                    onClick={(e) => {
                                      setActivePlanRateCardId(card.id)
                                      setPlanExpandedRateCards((prev) => ({ ...(prev ?? {}), [card.id]: true }))
                                      onNodeClick({ type: "rateCard", id: card.id }, e)
                                    }}
                                    onContextMenu={(e) => {
                                      e.preventDefault()
                                      onContextMenu?.({
                                        position: { top: e.clientY, left: e.clientX },
                                        nodeType: "rateCard",
                                        nodeId: card.id,
                                        label: getPlanRateCardLabel(card),
                                      })
                                    }}
                                  >
                                    {hasChildren ? (
                                      <span
                                        role="button"
                                        tabIndex={-1}
                                        className={`flex shrink-0 items-center p-[2px] ${isDark ? "text-[#6B7280]" : "text-[#3C4F69]"} opacity-0 group-hover/nav:opacity-100 transition-opacity`}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setPlanExpandedRateCards((prev) => ({ ...(prev ?? {}), [card.id]: !isExpanded }))
                                        }}
                                      >
                                        <ChevronDownTiny className={`transition-transform ${isExpanded ? "" : "-rotate-90"}`} />
                                      </span>
                                    ) : (
                                      <span className="w-[12px]" />
                                    )}
                                    <IconSlot>
                                      <CatalogObjectGlyph kind={rateCardServicingPeriods[card.id] === "Flat" ? "subscriptionFee" : "product"} highlighted={rateCardHasChanges(card.id)} error={hasValidationError("rateCard", card.id)} />
                                    </IconSlot>
                                    <span className={`min-w-0 flex-1 truncate ${hasValidationError("rateCard", card.id) ? textError : card.name ? "" : textSecondary}`}>
                                      {(() => {
                                        const label = getPlanRateCardLabel(card)
                                        return isFiltering && cardMatches ? renderHighlightedText(label, deferredNavFilter) : label
                                      })()}
                                    </span>
                                  </button>

                                  {SHOW_RATE_COUNTS
                                    ? (() => {
                                        const count = showAllRates ? card.rates.length : rates.length
                                        return count > 0 ? (
                                          <span className={`flex h-[20px] shrink-0 items-center rounded-[5px] px-[6px] text-[11px] leading-[16px] ${isDark ? "bg-[#1B1E25] text-[#8B95A5]" : "bg-[#EBEEF1] text-[#596171]"}`}>
                                            {count}
                                          </span>
                                        ) : null
                                      })()
                                    : null}
                                </div>

                              {isExpanded && (
                                <div className="flex flex-col gap-[2px]">
                                  {(showAllRates ? card.rates : rates).map((rate) => {
                                    const isRateActive =
                                      selectionEnabled && isNodeSelected({ type: "rate", id: rate.id })
                                    const meterLabel = (rateMeters?.[rate.id] ?? "").trim()
                                    const isMeterActive =
                                      selectionEnabled && isNodeSelected({ type: "rateMeter", id: rate.id })
                                    const showMeter = true
                                    const isRateExpanded = isFiltering ? true : (expandedRates[rate.id] ?? false)

                                    return (
                                      <div key={rate.id} className="flex flex-col gap-[2px]">
                                          <div
                                            className={`group/row ${rowBase} ${grandchildRowIndent} ${
                                              isRateActive
                                                ? activeBg
                                                : hoverBg
                                            }`}
                                            data-coachmark="rate"
                                          >
                                            <button
                                              type="button"
                                              className="flex min-w-0 flex-1 items-center justify-start gap-[8px] text-left"
                                              onClick={(e) => {
                                                setActivePlanRateCardId(card.id)
                                                setExpandedRates((prev) => ({ ...prev, [rate.id]: true }))
                                                onNodeClick({ type: "rate", id: rate.id }, e)
                                              }}
                                              onContextMenu={(e) => {
                                                e.preventDefault()
                                                onContextMenu?.({
                                                  position: { top: e.clientY, left: e.clientX },
                                                  nodeType: "rate",
                                                  nodeId: rate.id,
                                                  label: getPlanRateLabel(rate),
                                                })
                                              }}
                                            >
                                              {showMeter ? (
                                                <span
                                                  role="button"
                                                  tabIndex={-1}
                                                  className={`flex shrink-0 items-center p-[2px] ${isDark ? "text-[#6B7280]" : "text-[#3C4F69]"} opacity-0 group-hover/nav:opacity-100 transition-opacity`}
                                                  onClick={(e) => {
                                                    e.stopPropagation()
                                                    setExpandedRates((prev) => ({ ...prev, [rate.id]: !isRateExpanded }))
                                                  }}
                                                >
                                                  <ChevronDownTiny className={`transition-transform ${isRateExpanded ? "" : "-rotate-90"}`} />
                                                </span>
                                              ) : (
                                                <span className="w-[12px]" />
                                              )}
                                              <IconSlot>
                                                <CatalogObjectGlyph kind="price" highlighted={rateHasChanges(rate.id)} error={hasValidationError("rate", rate.id)} />
                                              </IconSlot>
                                              <span className={`min-w-0 flex-1 truncate ${hasValidationError("rate", rate.id) ? textError : getPlanRateLabel(rate) === "Price" ? textSecondary : ""}`}>
                                                {(() => {
                                                  const label = getPlanRateLabel(rate)
                                                  return isFiltering &&
                                                    label.trim().toLowerCase().includes(deferredNavFilter.trim().toLowerCase())
                                                    ? renderHighlightedText(label, deferredNavFilter)
                                                    : label
                                                })()}
                                              </span>
                                            </button>
                                          </div>
                                      </div>
                                    )
                                  })}

                                  {/* Linked credit grants (for flat products) */}
                                  {planCreditGrants
                                    .filter((g) => g.linkedRateCardId === card.id)
                                    .map((grant) => {
                                      const isCreditActive = selectionEnabled && isNodeSelected({ type: "creditGrant", id: grant.id })
                                      return (
                                        <div key={`linked-cg-${grant.id}`} className="relative flex flex-col gap-[2px]">
                                          <div className="absolute left-[48px] top-0 bottom-[50%] w-0 border-l border-dashed border-[#D8DEE4]" />
                                          <button
                                            type="button"
                                            className={`${rowBase} ${grandchildRowIndent} ${isCreditActive ? activeBg : hoverBg}`}
                                            data-coachmark="credit-grant"
                                            onClick={(e) => onNodeClick({ type: "creditGrant", id: grant.id }, e)}
                                          >
                                            <span className="w-[12px]" />
                                            <IconSlot>
                                              <CatalogObjectGlyph kind="creditGrant" highlighted={creditGrantHasChanges(grant.id)} error={hasValidationError("creditGrant", grant.id)} />
                                            </IconSlot>
                                            <span className={`min-w-0 flex-1 truncate ${hasValidationError("creditGrant", grant.id) ? textError : grant.name ? "" : textSecondary}`}>
                                              {getPlanCreditGrantLabel(grant)}
                                            </span>
                                          </button>
                                        </div>
                                      )
                                    })}

                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>

                      {/* Standalone rates (not in any rate card) */}
                      {filteredStandaloneRates.length > 0 && (
                        <div className="flex flex-col gap-[2px]">
                          {filteredStandaloneRates.map((rate) => {
                            const isRateActive = selectionEnabled && isNodeSelected({ type: "rate", id: rate.id })
                            const meterLabel = (rateMeters?.[rate.id] ?? "").trim()
                            const isMeterActive = selectionEnabled && isNodeSelected({ type: "rateMeter", id: rate.id })
                            const isRateExpanded = isFiltering ? true : (expandedRates[rate.id] ?? false)
                            const isDragging = draggingRateId === rate.id

                            return (
                              <div key={rate.id} className="flex flex-col gap-[2px]">
                                <div
                                  draggable={false}
                                  onDragEnd={() => setDraggingRateId(null)}
                                  className={`group/row ${rowBase} ${childRowIndent} justify-between ${
                                    isRateActive ? activeBg : hoverBg
                                  } ${isDragging ? "opacity-40" : ""}`}
                                  data-coachmark="rate"
                                >
                                  <button
                                    type="button"
                                    className="flex min-w-0 flex-1 items-center justify-start gap-[8px] text-left"
                                    onClick={(e) => {
                                      setExpandedRates((prev) => ({ ...prev, [rate.id]: true }))
                                      onNodeClick({ type: "rate", id: rate.id }, e)
                                    }}
                                    onContextMenu={(e) => {
                                      e.preventDefault()
                                      onContextMenu?.({
                                        position: { top: e.clientY, left: e.clientX },
                                        nodeType: "rate",
                                        nodeId: rate.id,
                                        label: getPlanRateLabel(rate),
                                      })
                                    }}
                                  >
                                    <span
                                      role="button"
                                      tabIndex={-1}
                                      className={`flex shrink-0 items-center p-[2px] ${isDark ? "text-[#6B7280]" : "text-[#3C4F69]"} opacity-0 group-hover/nav:opacity-100 transition-opacity`}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setExpandedRates((prev) => ({ ...prev, [rate.id]: !isRateExpanded }))
                                      }}
                                    >
                                      <ChevronDownTiny className={`transition-transform ${isRateExpanded ? "" : "-rotate-90"}`} />
                                    </span>
                                    <IconSlot>
                                      <CatalogObjectGlyph kind="price" highlighted={rateHasChanges(rate.id)} error={hasValidationError("rate", rate.id)} />
                                    </IconSlot>
                                    <span className={`min-w-0 flex-1 truncate ${hasValidationError("rate", rate.id) ? textError : getPlanRateLabel(rate) === "Price" ? textSecondary : ""}`}>
                                      {(() => {
                                        const label = getPlanRateLabel(rate)
                                        return isFiltering && label.trim().toLowerCase().includes(deferredNavFilter.trim().toLowerCase())
                                          ? renderHighlightedText(label, deferredNavFilter)
                                          : label
                                      })()}
                                    </span>
                                  </button>
                                </div>

                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Credit grants + subscription fees (only show unlinked ones here) */}
                      <div className="flex flex-col gap-[2px]">
                        {filteredCreditGrants.filter((g) => !g.linkedRateCardId).map((grant) => (
                          <button
                            key={grant.id}
                            type="button"
                            className={`${rowBase} ${childRowIndent} ${
                              selectionEnabled && isNodeSelected({ type: "creditGrant", id: grant.id })
                                ? activeBg
                                : hoverBg
                            }`}
                            data-coachmark="credit-grant"
                            onClick={(e) => onNodeClick({ type: "creditGrant", id: grant.id }, e)}
                            onContextMenu={(e) => {
                              e.preventDefault()
                              onContextMenu?.({
                                position: { top: e.clientY, left: e.clientX },
                                nodeType: "creditGrant",
                                nodeId: grant.id,
                                label: getPlanCreditGrantLabel(grant),
                              })
                            }}
                          >
                            <span className="w-[12px] shrink-0" />
                            <IconSlot>
                              <CatalogObjectGlyph kind="creditGrant" highlighted={creditGrantHasChanges(grant.id)} error={hasValidationError("creditGrant", grant.id)} />
                            </IconSlot>
                            <span className={`min-w-0 flex-1 truncate ${hasValidationError("creditGrant", grant.id) ? textError : grant.name ? "" : textSecondary}`}>
                              {(() => {
                                const label = getPlanCreditGrantLabel(grant)
                                return isFiltering ? renderHighlightedText(label, deferredNavFilter) : label
                              })()}
                            </span>
                          </button>
                        ))}

                        {filteredSubscriptionFees.map((fee) => (
                          <button
                            key={fee.id}
                            type="button"
                            className={`${rowBase} ${childRowIndent} ${
                              selectionEnabled && isNodeSelected({ type: "subscriptionFee", id: fee.id })
                                ? activeBg
                                : hoverBg
                            }`}
                            data-coachmark="subscription-fee"
                            onClick={(e) => onNodeClick({ type: "subscriptionFee", id: fee.id }, e)}
                            onContextMenu={(e) => {
                              e.preventDefault()
                              onContextMenu?.({
                                position: { top: e.clientY, left: e.clientX },
                                nodeType: "subscriptionFee",
                                nodeId: fee.id,
                                label: getPlanSubscriptionFeeLabel(fee),
                              })
                            }}
                          >
                            <span className="w-[12px] shrink-0" />
                            <IconSlot>
                              <CatalogObjectGlyph kind="subscriptionFee" highlighted={subscriptionFeeHasChanges(fee.id)} error={hasValidationError("subscriptionFee", fee.id)} />
                            </IconSlot>
                            <span className={`min-w-0 flex-1 truncate ${hasValidationError("subscriptionFee", fee.id) ? textError : fee.name ? "" : textSecondary}`}>
                              {(() => {
                                const label = getPlanSubscriptionFeeLabel(fee)
                                return isFiltering ? renderHighlightedText(label, deferredNavFilter) : label
                              })()}
                            </span>
                          </button>
                        ))}

                      </div>

                      {!isFiltering && (
                        <button
                          type="button"
                          data-onboarding="plus-button"
                          className={`${inlineAddRowBase} ${childRowIndent}`}
                          aria-label={t("Add")}
                          onClick={(e) => {
                            onToggleAddPlanObject(e.currentTarget)
                          }}
                        >
                          <span className="w-[12px] shrink-0" />
                          <InlineAddIconSlot>
                            <AddSmallIcon />
                          </InlineAddIconSlot>
                          <span>{t("Add")}</span>
                        </button>
                      )}

                    </>
                </>
              )}

              {/* Add plan button - at bottom of sidebar (controlled by options toggle) */}
              {onAddPlan && !isFiltering && showAddPlan && (
                <button
                  type="button"
                  className={addRowBase}
                  onClick={onAddPlan}
                  data-field-description="add-plan"
                >
                  <AddIconSlot isDark={isDark}>
                    <AddSmallIcon />
                  </AddIconSlot>
                  {t("Add plan")}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

