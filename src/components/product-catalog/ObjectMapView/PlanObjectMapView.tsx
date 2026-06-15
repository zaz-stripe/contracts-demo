"use client"

import { useMemo } from "react"
import type { AssistantReference } from "@/components/ProductAssistantPanel"
import type { TreeNode, PricingTier, StateSetter } from "./objectMapTypes"
import { ObjectMapBase } from "./ObjectMapBase"
import type { NodeContextMenuInfo } from "./NodeCard"

type PlanData = {
  id: number
  name: string
  rateCards: { id: number; name: string; rates: { id: number; name: string }[] }[]
  creditGrants: { id: number; name: string }[]
  subscriptionFees: { id: number; name: string }[]
  rateMeters?: Record<number, string>
}

export function PlanObjectMapView(args: {
  t: (key: string) => string
  planName: string
  getPlanLabel: (value: string, fallback: string) => string
  planRateCards: { id: number; name: string; rates: { id: number; name: string }[] }[]
  getPlanRateCardLabel: (card?: { id: number; name: string; rates: { id: number; name: string }[] } | null) => string
  getPlanRateLabel: (rate?: { id: number; name: string } | null) => string
  getRatePricingTiers?: (rateId: number) => PricingTier[] | undefined
  rateMeters: Record<number, string>
  planCreditGrants: { id: number; name: string }[]
  planSubscriptionFees: { id: number; name: string }[]
  getPlanCreditGrantLabel: (grant?: { id: number; name: string } | null) => string
  getPlanSubscriptionFeeLabel: (fee?: { id: number; name: string } | null) => string
  /** Actual amounts/periods for display on map cards */
  creditGrantAmounts?: Record<number, string>
  creditGrantPeriods?: Record<number, string>
  subscriptionFeeAmounts?: Record<number, string>
  subscriptionFeePeriods?: Record<number, string>
  rateCardServicingPeriods?: Record<number, string>
  setActivePlanRateCardId: StateSetter<number>
  setActivePlanNode: StateSetter<{
    type: "plan" | "rateCard" | "rate" | "rateMeter" | "creditGrant" | "subscriptionFee" | "priceGroup"
    id?: number
  }>
  /** Handle node selection with shift-click support */
  handleNodeSelect?: (node: { type: "plan" | "rateCard" | "rate" | "rateMeter" | "creditGrant" | "subscriptionFee" | "priceGroup"; id?: number }, shiftKey: boolean) => void
  selectedNodeKey?: string | null
  /** Array of selected node keys (for multi-select support) */
  selectedNodeKeys?: string[]
  onOpenAssistant?: (ref: AssistantReference) => void
  /** When false (default), hides non-essential nodes like Checkout, Customer, Subscription, etc. */
  showAdditionalNodes?: boolean
  /** Callback when clicking plus button after plan node - shows dropdown at position */
  onAddPlanObject?: (position: { top: number; left: number }) => void
  /** Callback when clicking plus button after rate card - adds a rate */
  onAddRate?: (rateCardId: number) => void
  /** Callback when right-clicking on a map node */
  onNodeContextMenu?: (info: NodeContextMenuInfo) => void
  /** All plans in stable order for multi-plan view */
  allPlansInOrder?: PlanData[]
  /** Currently editing plan ID */
  editingPlanId?: number | null
  /** Callback when clicking on another plan (to switch) */
  onSwitchToPlan?: (planId: number) => void
  /** When true, adds coachmarkIds to first instances of nodes for the coachmark tour */
  isExamplePlan?: boolean
  /** Called when user clicks the empty canvas background (not a node). */
  onBackgroundClick?: () => void
}) {
  const {
    t,
    planName,
    getPlanLabel,
    planRateCards,
    getPlanRateCardLabel,
    getPlanRateLabel,
    getRatePricingTiers,
    rateMeters,
    planCreditGrants,
    planSubscriptionFees,
    getPlanCreditGrantLabel,
    getPlanSubscriptionFeeLabel,
    creditGrantAmounts: creditGrantAmountsMap,
    creditGrantPeriods: creditGrantPeriodsMap,
    subscriptionFeeAmounts: subscriptionFeeAmountsMap,
    subscriptionFeePeriods: subscriptionFeePeriodsMap,
    rateCardServicingPeriods: rateCardServicingPeriodsMap,
    setActivePlanRateCardId,
    setActivePlanNode,
    handleNodeSelect,
    selectedNodeKey,
    selectedNodeKeys,
    onOpenAssistant,
    showAdditionalNodes = false,
    onAddPlanObject,
    onAddRate,
    onNodeContextMenu,
    allPlansInOrder,
    editingPlanId,
    onSwitchToPlan,
    isExamplePlan,
    onBackgroundClick,
  } = args

  // Helper to handle node click with shift-key support
  const onNodeClick = (node: { type: "plan" | "rateCard" | "rate" | "rateMeter" | "creditGrant" | "subscriptionFee" | "priceGroup"; id?: number; planId?: number }, shiftKey?: boolean) => {
    if (handleNodeSelect && shiftKey !== undefined) {
      handleNodeSelect(node, shiftKey)
    } else {
      setActivePlanNode(node)
    }
  }

  // Measure text width using a canvas context for accurate sizing.
  // Cached — the canvas is created once and reused.
  const measureText = useMemo(() => {
    if (typeof document === "undefined") {
      return (text: string, _font: string) => text.length * 6 // SSR fallback
    }
    let ctx: CanvasRenderingContext2D | null = null
    return (text: string, font: string) => {
      if (!ctx) {
        const canvas = document.createElement("canvas")
        ctx = canvas.getContext("2d")
      }
      if (!ctx) return text.length * 6 // fallback
      ctx.font = font
      return ctx.measureText(text).width
    }
  }, [])

  // Card title font matches NodeCard: 12px / 400 / -0.15px letter-spacing
  const titleFont = "400 12px system-ui, sans-serif"
  const TITLE_TRACKING = -0.15 // tracking-[-0.15px] – canvas measureText ignores letter-spacing

  // Card width: 8px padding each side + 14px icon + 6px gap + measured text
  const CARD_CHROME = 8 + 14 + 6 + 8 // 36px
  const BORDERED_EXTRA = 2 // metered-item nodes have 1px dashed border each side (border-box)
  const titleTextW = (text: string) =>
    measureText(text, titleFont) + Math.max(0, text.length - 1) * TITLE_TRACKING
  const cardW = (text: string, border = 0) =>
    Math.max(60, Math.ceil(titleTextW(text) + CARD_CHROME + border))

  // Detail section font: 10px / 400 / +0.1px letter-spacing
  const detailFont = "400 10px system-ui, sans-serif"
  const DETAIL_TRACKING = 0.1
  const DETAIL_PAD = 16 // px-[8px] × 2
  const DETAIL_GAP = 14 // gap-[14px] between label and value spans
  const detailTextW = (text: string) =>
    text ? measureText(text, detailFont) + Math.max(0, text.length - 1) * DETAIL_TRACKING : 0
  const detailRowMinW = (label: string, value: string) =>
    DETAIL_PAD + detailTextW(label) + DETAIL_GAP + detailTextW(value)
  const tierRowMinW = (price: string) =>
    DETAIL_PAD + 51 + DETAIL_GAP + detailTextW(price) // tier label is fixed w-[51px]

  // Detailed card width: max of title row width and widest detail/tier row
  const detailedCardW = (
    title: string,
    rows?: { label: string; value: string }[],
    tiers?: PricingTier[],
    border = 0,
  ) => {
    let w = cardW(title, border)
    if (rows) for (const r of rows) w = Math.max(w, Math.ceil(detailRowMinW(r.label, r.value) + border))
    if (tiers) for (const tier of tiers) w = Math.max(w, Math.ceil(tierRowMinW(tier.price) + border))
    return w
  }

  // Detailed mode height: 28px title + 1px border + 12px vertical padding (6px each) + rows * 18px (10px text + 8px gap)
  const detailedCardH = (detailRowCount: number) =>
    detailRowCount > 0 ? 28 + 1 + 12 + detailRowCount * 18 - 8 : 28

  // Helper to build a plan subtree from plan data
  const buildPlanSubtree = (
    planData: {
      id?: number
      name: string
      rateCards: { id: number; name: string; rates: { id: number; name: string }[] }[]
      creditGrants: { id: number; name: string }[]
      subscriptionFees: { id: number; name: string }[]
      rateMeters?: Record<number, string>
      rateCardServicingPeriods?: Record<number, string>
      creditGrantAmounts?: Record<number, string>
      creditGrantPeriods?: Record<number, string>
      subscriptionFeeAmounts?: Record<number, string>
      subscriptionFeePeriods?: Record<number, string>
    },
    options: {
      isCurrentPlan: boolean
      keyPrefix: string  // Required - all plans need unique prefixes
    }
  ): { node: TreeNode; sharedMeterEdges: { from: string; to: string }[] } => {
    const { id, name, rateCards, creditGrants, subscriptionFees, rateMeters: planRateMetersData } = planData
    const { isCurrentPlan, keyPrefix } = options
    // Use prefix for all keys to ensure uniqueness across plans
    const makeKey = (base: string) => keyPrefix ? `${keyPrefix}:${base}` : base

    const planTitle = getPlanLabel(name, t("Pricing plan"))
    const planTypeLabel = t("Pricing plan")
    const planNode: TreeNode = {
      key: makeKey("plan"),
      headerLabel: planTypeLabel,
      title: planTitle,
      titleIsPlaceholder: !name.trim(),
      emphasis: true,
      w: cardW(planTitle),
      h: 28,
      detailedW: detailedCardW(planTitle),
      detailedH: 28,
      // All plans are clickable - pass the plan ID for proper selection tracking
      onClick: (shiftKey) => onNodeClick({ type: "plan", id, planId: id }, shiftKey),
      // Coachmark anchor for dynamic (on-first-click) coachmarks; always on current plan's plan node
      coachmarkId: isCurrentPlan ? "pricing-plan" : undefined,
    }

    // Track additional edges for shared meters
    const sharedMeterEdges: { from: string; to: string }[] = []

    // Build rate card nodes
    const rateCardNodes: TreeNode[] = rateCards.map((card, cardIndex) => {
      // Don't create phantom rates - match sidebar behavior where rate cards can have no rates
      const rates = card.rates ?? []
      const meterData = isCurrentPlan ? rateMeters : (planRateMetersData ?? {})
      const isFirstRateCard = cardIndex === 0

      // Group rates by meter name to identify shared meters
      const meterNameToRateIds: Record<string, number[]> = {}
      for (const rate of rates) {
        const meterName = (meterData[rate.id] ?? "").trim()
        if (meterName) {
          if (!meterNameToRateIds[meterName]) {
            meterNameToRateIds[meterName] = []
          }
          meterNameToRateIds[meterName].push(rate.id)
        }
      }

      // Track which rate owns each shared meter (first rate with that meter name)
      const sharedMeterOwner: Record<string, number> = {}
      for (const [meterName, rateIds] of Object.entries(meterNameToRateIds)) {
        if (rateIds.length > 1) {
          sharedMeterOwner[meterName] = rateIds[0]
        }
      }

      const rateChildren: TreeNode[] = rates.map((rate, rateIndex) => {
        const pricingTiers = isCurrentPlan ? getRatePricingTiers?.(rate.id) : undefined
        const tierCount = pricingTiers?.length ?? 0

        const rateMeterName = (meterData[rate.id] ?? "").trim()
        const hasMeter = !!rateMeterName
        const isFirstRate = isFirstRateCard && rateIndex === 0

        // Check if this rate uses a shared meter
        const isSharedMeter = rateMeterName && meterNameToRateIds[rateMeterName]?.length > 1
        const ownsSharedMeter = isSharedMeter && sharedMeterOwner[rateMeterName] === rate.id

        const rateTitle = getPlanRateLabel(rate)
        const rateTypeLabel = t("Rate")
        const rateDetailRows = tierCount === 0 ? [{ label: "", value: t("No pricing set") }] : undefined
        const rateDetailedW = detailedCardW(rateTitle, rateDetailRows, pricingTiers)
        // Detailed height: if tiers exist use them, otherwise show 1 empty-state row
        const rateDetailedH = tierCount > 0 ? detailedCardH(tierCount) : detailedCardH(1)
        const rateNode: TreeNode = {
          key: makeKey(`rate:${rate.id}`),
          headerLabel: rateTypeLabel,
          title: rateTitle,
          titleIsPlaceholder: !rate.name.trim(),
          pricingTiers,
          w: cardW(rateTitle),
          h: 28,
          detailedW: rateDetailedW,
          detailedH: rateDetailedH,
          // Empty state for rates without pricing tiers
          detailRows: tierCount === 0 ? [{ label: "", value: t("No pricing set"), isPlaceholder: true }] : undefined,
          onClick: (shiftKey) => onNodeClick({ type: "rate", id: rate.id, planId: id }, shiftKey),
          coachmarkId: isCurrentPlan && isFirstRate ? "rate" : undefined,
        }

        // For shared meters, only the "owner" rate gets the meter as a child
        // Other rates will connect via additional edges
        if (isSharedMeter && !ownsSharedMeter) {
          // This rate doesn't own the shared meter - add an edge from meteredItem to the shared meter
          const ownerRateId = sharedMeterOwner[rateMeterName]
          const miTypeLabel = t("Metered item")
          const meteredItemNode: TreeNode = {
            key: makeKey(`meteredItem:${rate.id}`),
            headerLabel: miTypeLabel,
            title: rateTitle,
            titleIsPlaceholder: !rate.name.trim(),
            w: cardW(rateTitle, BORDERED_EXTRA),
            h: 28,
            detailedW: detailedCardW(rateTitle, undefined, undefined, BORDERED_EXTRA),
            detailedH: 28,
          }
          rateNode.children = [meteredItemNode]
          sharedMeterEdges.push({
            from: makeKey(`meteredItem:${rate.id}`),
            to: makeKey(`rateMeter:${ownerRateId}`),
          })
        } else {
          // Either not shared, or this rate owns the shared meter
          // Insert a metered item node between the rate and the meter
          const isFirstMeter = isFirstRateCard && rateIndex === 0
          const meterTitle = hasMeter ? rateMeterName : t("Meter")
          const meterTypeLabel = t("Meter")
          const meterNode: TreeNode = {
            key: makeKey(`rateMeter:${rate.id}`),
            headerLabel: meterTypeLabel,
            title: meterTitle,
            titleIsPlaceholder: !hasMeter,
            w: cardW(meterTitle),
            h: 28,
            detailedW: detailedCardW(meterTitle),
            detailedH: 28,
            onClick: (shiftKey) => onNodeClick({ type: "rateMeter", id: rate.id, planId: id }, shiftKey),
            coachmarkId: isCurrentPlan && isFirstMeter ? "meter" : undefined,
          }
          const miTypeLabel = t("Metered item")
          const meteredItemNode: TreeNode = {
            key: makeKey(`meteredItem:${rate.id}`),
            headerLabel: miTypeLabel,
            title: rateTitle,
            titleIsPlaceholder: !rate.name.trim(),
            w: cardW(rateTitle, BORDERED_EXTRA),
            h: 28,
            detailedW: detailedCardW(rateTitle, undefined, undefined, BORDERED_EXTRA),
            detailedH: 28,
            children: [meterNode],
          }
          rateNode.children = [meteredItemNode]
        }

        return rateNode
      })

      const rcLabel = getPlanRateCardLabel(card)
      const rcTypeLabel = t("Rate card")
      const rcServicingPeriod = planData.rateCardServicingPeriods?.[card.id] ?? ""
      const rcIntervalValue = rcServicingPeriod.trim() || t("Not set")
      const rcIntervalIsPlaceholder = !rcServicingPeriod.trim()
      return {
        key: makeKey(`rateCard:${card.id}`),
        headerLabel: rcTypeLabel,
        title: rcLabel,
        titleIsPlaceholder: !card.name.trim(),
        w: cardW(rcLabel),
        h: 28,
        detailedW: detailedCardW(rcLabel, [{ label: t("Service interval"), value: rcIntervalValue }]),
        detailedH: detailedCardH(1),
        detailRows: [{ label: t("Service interval"), value: rcIntervalValue, isPlaceholder: rcIntervalIsPlaceholder }],
        onClick: (shiftKey) => {
          setActivePlanRateCardId(card.id)
          onNodeClick({ type: "rateCard", id: card.id, planId: id }, shiftKey)
        },
        children: rateChildren.length > 0 ? rateChildren : undefined,
        coachmarkId: isCurrentPlan && isFirstRateCard ? "rate-card" : undefined,
      }
    })

    // Subscription fees
    const subscriptionFeeNodes: TreeNode[] = subscriptionFees.map((f, index) => {
      const label = getPlanSubscriptionFeeLabel(f)
      const lfAmount = planData.subscriptionFeeAmounts?.[f.id] ?? ""
      const lfPeriod = planData.subscriptionFeePeriods?.[f.id] ?? ""
      const lfHasPrice = lfAmount.trim() !== ""
      const lfDisplayValue = lfHasPrice
        ? `$${lfAmount}${lfPeriod ? `/${lfPeriod === "Yearly" || lfPeriod === "Annually" ? "yr" : "mo"}` : ""}`
        : t("No price set")
      return {
        key: makeKey(`subscriptionFee:${f.id}`),
        headerLabel: t("Subscription fee"),
        title: label,
        titleIsPlaceholder: !f.name.trim(),
        w: cardW(label),
        h: 28,
        detailedW: detailedCardW(label, [{ label: "", value: lfDisplayValue }]),
        detailedH: detailedCardH(1),
        detailRows: [{ label: "", value: lfDisplayValue, isPlaceholder: !lfHasPrice }],
        onClick: (shiftKey) => onNodeClick({ type: "subscriptionFee", id: f.id, planId: id }, shiftKey),
        coachmarkId: isCurrentPlan && index === 0 ? "subscription-fee" : undefined,
      }
    })

    // Credit grants
    const creditGrantNodes: TreeNode[] = creditGrants.map((g, index) => {
      const label = getPlanCreditGrantLabel(g)
      const typeLabel = t("Credit grant")
      const cgAmount = planData.creditGrantAmounts?.[g.id] ?? ""
      const cgPeriod = planData.creditGrantPeriods?.[g.id] ?? ""
      const cgHasAmount = cgAmount.trim() !== ""
      const cgDisplayValue = cgHasAmount
        ? `$${cgAmount}${cgPeriod ? `/${cgPeriod === "Yearly" || cgPeriod === "Annually" ? "yr" : "mo"}` : ""}`
        : t("No amount set")
      return {
        key: makeKey(`creditGrant:${g.id}`),
        headerLabel: typeLabel,
        title: label,
        titleIsPlaceholder: !g.name.trim(),
        w: cardW(label),
        h: 28,
        detailedW: detailedCardW(label, [{ label: "", value: cgDisplayValue }]),
        detailedH: detailedCardH(1),
        detailRows: [{ label: "", value: cgDisplayValue, isPlaceholder: !cgHasAmount }],
        onClick: (shiftKey) => onNodeClick({ type: "creditGrant", id: g.id, planId: id }, shiftKey),
        coachmarkId: isExamplePlan && isCurrentPlan && index === 0 ? "credit-grant" : undefined,
      }
    })

    planNode.children = rateCardNodes
    // Subscription fees and credit grants are "attached" to the plan node — positioned
    // directly below it rather than stacked after the rate card subtrees.
    planNode.attachedNodes = [...subscriptionFeeNodes, ...creditGrantNodes]
    return { node: planNode, sharedMeterEdges }
  }

  const { root, additionalEdges } = useMemo<{ root: TreeNode; additionalEdges: { from: string; to: string }[] }>(() => {
    // If we have multiple plans, build all in stable order
    if (allPlansInOrder && allPlansInOrder.length > 1) {
      const allEdges: { from: string; to: string }[] = []
      const planNodes: TreeNode[] = allPlansInOrder.map((plan) => {
        const isCurrentPlan = plan.id === editingPlanId
        // For current plan, use live props; for others, use stored draft data
        const planData = isCurrentPlan
          ? {
              id: editingPlanId ?? undefined,
              name: planName,
              rateCards: planRateCards,
              creditGrants: planCreditGrants,
              subscriptionFees: planSubscriptionFees,
              rateMeters,
              rateCardServicingPeriods: rateCardServicingPeriodsMap,
              creditGrantAmounts: creditGrantAmountsMap,
              creditGrantPeriods: creditGrantPeriodsMap,
              subscriptionFeeAmounts: subscriptionFeeAmountsMap,
              subscriptionFeePeriods: subscriptionFeePeriodsMap,
            }
          : {
              id: plan.id,
              name: plan.name,
              rateCards: plan.rateCards,
              creditGrants: plan.creditGrants,
              subscriptionFees: plan.subscriptionFees,
              rateMeters: plan.rateMeters,
            }
        // Use plan ID-based key prefix for all plans to ensure unique keys
        const keyPrefix = `plan${plan.id}`
        const result = buildPlanSubtree(planData, { isCurrentPlan, keyPrefix })
        allEdges.push(...result.sharedMeterEdges)
        return result.node
      })

      // Synthetic "catalog" root that holds all plan trees as siblings
      const catalogRoot: TreeNode = {
        key: "catalog",
        headerLabel: "",
        title: "",
        hidden: true, // This root shouldn't be displayed
        w: 0,
        h: 0,
        children: planNodes,
      }
      return { root: catalogRoot, additionalEdges: allEdges }
    }

    // Single plan case - build just the current plan
    const currentPlanData = {
      id: editingPlanId ?? undefined,
      name: planName,
      rateCards: planRateCards,
      creditGrants: planCreditGrants,
      subscriptionFees: planSubscriptionFees,
      rateMeters,
      rateCardServicingPeriods: rateCardServicingPeriodsMap,
      creditGrantAmounts: creditGrantAmountsMap,
      creditGrantPeriods: creditGrantPeriodsMap,
      subscriptionFeeAmounts: subscriptionFeeAmountsMap,
      subscriptionFeePeriods: subscriptionFeePeriodsMap,
    }
    // Use plan ID-based prefix for single plan mode too (for consistency)
    const singlePlanPrefix = editingPlanId ? `plan${editingPlanId}` : ""
    const { node: currentPlanNode, sharedMeterEdges } = buildPlanSubtree(currentPlanData, { isCurrentPlan: true, keyPrefix: singlePlanPrefix })

    // When showAdditionalNodes is true, include the full chain:
    // Checkout -> Customer -> Pricing plan subscription -> Pricing plan
    if (showAdditionalNodes) {
      const checkout: TreeNode = {
        key: "plan:checkout",
        headerLabel: t("Checkout"),
        title: t("Checkout"),
        muted: true,
        w: cardW(t("Checkout")),
        h: 24,
      }
      const customer: TreeNode = {
        key: "plan:customer",
        headerLabel: t("Customer"),
        title: t("Customer"),
        muted: true,
        w: cardW(t("Customer")),
        h: 24,
      }
      const subscription: TreeNode = {
        key: "plan:subscription",
        headerLabel: t("Subscription"),
        title: t("Subscription"),
        muted: true,
        w: cardW(t("Subscription")),
        h: 24,
        children: [
          { key: "plan:automaticTax", headerLabel: t("Automatic tax"), title: t("Automatic tax"), muted: true, w: cardW(t("Automatic tax")), h: 24 },
          { key: "plan:invoice", headerLabel: t("Invoice"), title: t("Invoice"), muted: true, w: cardW(t("Invoice")), h: 24 },
        ],
      }

      checkout.children = [customer]
      customer.children = [subscription]
      subscription.children = [...(subscription.children ?? []), currentPlanNode]
      return { root: checkout, additionalEdges: sharedMeterEdges }
    }

    // Simplified view: just the plan node
    return { root: currentPlanNode, additionalEdges: sharedMeterEdges }
  }, [
    t,
    getPlanLabel,
    planName,
    planRateCards,
    planCreditGrants,
    planSubscriptionFees,
    rateMeters,
    getPlanRateCardLabel,
    getPlanRateLabel,
    getRatePricingTiers,
    getPlanCreditGrantLabel,
    getPlanSubscriptionFeeLabel,
    creditGrantAmountsMap,
    creditGrantPeriodsMap,
    subscriptionFeeAmountsMap,
    subscriptionFeePeriodsMap,
    rateCardServicingPeriodsMap,
    setActivePlanNode,
    setActivePlanRateCardId,
    showAdditionalNodes,
    onNodeClick,
    allPlansInOrder,
    editingPlanId,
    onSwitchToPlan,
    buildPlanSubtree,
  ])

  // Compute the correct plan key for centering (must match the key used in buildPlanSubtree)
  const centerPlanKey = editingPlanId ? `plan${editingPlanId}:plan` : "plan"

  return (
    <ObjectMapBase
      root={root}
      stickyAnchorKey={centerPlanKey}
      selectedNodeKey={selectedNodeKey}
      selectedNodeKeys={selectedNodeKeys}
      topInsetPx={44}
      onOpenAssistant={onOpenAssistant}
      onAddPlanObject={onAddPlanObject}
      onAddRate={onAddRate}
      onNodeContextMenu={onNodeContextMenu}
      additionalEdges={additionalEdges}
      onBackgroundClick={onBackgroundClick}
    />
  )
}
