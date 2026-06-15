import type { PlanNamedItem, PlanNode, PlanRate, PlanRateCard } from "@/components/product-catalog/productCatalogPage.types"

export function getAllRates(planRateCards: PlanRateCard[], planRates: PlanRate[] = []): PlanRate[] {
  return [...planRateCards.flatMap(c => c.rates), ...planRates]
}

export function getActivePlanHeaderLabel(opts: {
  t: (key: string) => string
  activePlanNode: PlanNode
  planName: string
  planRateCards: PlanRateCard[]
  planRates?: PlanRate[]
  planCreditGrants: PlanNamedItem[]
  planSubscriptionFees: PlanNamedItem[]
  getPlanLabel: (name: string, fallback: string) => string
  getPlanRateCardLabel: (card: PlanRateCard | undefined) => string
  getPlanRateLabel: (rate: { id: number; name: string } | undefined) => string
  getPlanCreditGrantLabel: (grant: PlanNamedItem | undefined) => string
  getPlanSubscriptionFeeLabel: (fee: PlanNamedItem | undefined) => string
}) {
  const {
    t,
    activePlanNode,
    planName,
    planRateCards,
    planRates = [],
    planCreditGrants,
    planSubscriptionFees,
    getPlanLabel,
    getPlanRateCardLabel,
    getPlanRateLabel,
    getPlanCreditGrantLabel,
    getPlanSubscriptionFeeLabel,
  } = opts

  if (activePlanNode.type === "rateCard") {
    const card = planRateCards.find((item) => item.id === activePlanNode.id)
    return getPlanRateCardLabel(card)
  }
  if (activePlanNode.type === "rate") {
    const rate = getAllRates(planRateCards, planRates).find((item) => item.id === activePlanNode.id)
    return getPlanRateLabel(rate)
  }
  if (activePlanNode.type === "rateMeter") {
    return t("Meter")
  }
  if (activePlanNode.type === "creditGrant") {
    const grant = planCreditGrants.find((item) => item.id === activePlanNode.id)
    return getPlanCreditGrantLabel(grant)
  }
  if (activePlanNode.type === "subscriptionFee") {
    const fee = planSubscriptionFees.find((item) => item.id === activePlanNode.id)
    return getPlanSubscriptionFeeLabel(fee)
  }
  return getPlanLabel(planName, t("Untitled pricing plan"))
}

export function getActivePlanParentInfo(opts: {
  t: (key: string) => string
  activePlanNode: PlanNode
  planName: string
  planRateCards: PlanRateCard[]
  getPlanLabel: (name: string, fallback: string) => string
  getPlanRateCardLabel: (card: PlanRateCard | undefined) => string
  getPlanRateLabel: (rate: { id: number; name: string } | undefined) => string
}): { parentLabel: string; parentNode: PlanNode } | null {
  const { t, activePlanNode, planName, planRateCards, getPlanLabel, getPlanRateCardLabel, getPlanRateLabel } = opts
  const planLabel = getPlanLabel(planName, t("Untitled pricing plan"))

  if (activePlanNode.type === "rateCard" || activePlanNode.type === "creditGrant" || activePlanNode.type === "subscriptionFee") {
    return { parentLabel: planLabel, parentNode: { type: "plan" } }
  }
  if (activePlanNode.type === "rate") {
    const parentCard = planRateCards.find((card) => card.rates.some((r) => r.id === activePlanNode.id))
    if (parentCard) {
      return { parentLabel: getPlanRateCardLabel(parentCard), parentNode: { type: "rateCard", id: parentCard.id } }
    }
    return { parentLabel: planLabel, parentNode: { type: "plan" } }
  }
  if (activePlanNode.type === "rateMeter") {
    // Meter's parent is a rate — but we don't have the rate id on the meter node,
    // so fall back to plan level
    return { parentLabel: planLabel, parentNode: { type: "plan" } }
  }
  // Plan root has no parent
  return null
}

/** Returns the tree as a flat array of PlanNode in DFS order (plan → rate cards → rates → standalone rates → credit grants → sub fees). */
export function getFlattenedTreeNodes(opts: {
  planRateCards: PlanRateCard[]
  planRates?: PlanRate[]
  planCreditGrants: PlanNamedItem[]
  planSubscriptionFees: PlanNamedItem[]
}): PlanNode[] {
  const nodes: PlanNode[] = [{ type: "plan" }]
  for (const card of opts.planRateCards) {
    nodes.push({ type: "rateCard", id: card.id })
    for (const rate of card.rates) {
      nodes.push({ type: "rate", id: rate.id })
    }
  }
  for (const rate of (opts.planRates ?? [])) {
    nodes.push({ type: "rate", id: rate.id })
  }
  for (const grant of opts.planCreditGrants) {
    nodes.push({ type: "creditGrant", id: grant.id })
  }
  for (const fee of opts.planSubscriptionFees) {
    nodes.push({ type: "subscriptionFee", id: fee.id })
  }
  return nodes
}

export function getActivePlanDeleteLabel(t: (key: string) => string, activePlanNode: PlanNode) {
  if (activePlanNode.type === "rateCard") return t("Delete rate card")
  if (activePlanNode.type === "rate") return t("Delete rate")
  if (activePlanNode.type === "rateMeter") return t("Delete meter")
  if (activePlanNode.type === "creditGrant") return t("Delete credit grant")
  if (activePlanNode.type === "subscriptionFee") return t("Delete subscription fee")
  return t("Delete pricing plan")
}


