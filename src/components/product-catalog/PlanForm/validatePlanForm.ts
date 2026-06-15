import type { PlanNode, PlanRateCard, PlanNamedItem } from "./planFormTypes"

export type IncompleteField = {
  key: string
  label: string
  /** Inline error message to show below the field */
  message: string
  nodeType: PlanNode["type"]
  nodeId?: number
}

/** An object (form) that has at least one validation error */
export type ValidationErrorObject = {
  nodeType: PlanNode["type"]
  nodeId?: number
  label: string
}

type ValidateArgs = {
  t: (key: string) => string
  planName: string
  planDescription: string
  planLookupKey: string
  planRateCards: PlanRateCard[]
  rateMeters: Record<number, string>
  ratePriceTypes: Record<number, string>
  planRateUnitPrices: Record<number, string>
  rateUnitLabels: Record<number, string>
  planCreditGrants: PlanNamedItem[]
  creditGrantAmounts: Record<number, string>
  planSubscriptionFees: PlanNamedItem[]
  subscriptionFeeAmounts: Record<number, string>
  subscriptionFeeUnitLabels: Record<number, string>
  planPriceTypeOptions: string[]
  getPlanRateLabel: (rate?: { id: number; name: string } | null) => string
  getPlanCreditGrantLabel: (grant?: PlanNamedItem | null) => string
  getPlanSubscriptionFeeLabel: (fee?: PlanNamedItem | null) => string
}

export function validatePlanForm(args: ValidateArgs): IncompleteField[] {
  const {
    t,
    planName,
    planDescription,
    planLookupKey,
    planRateCards,
    rateMeters,
    ratePriceTypes,
    planRateUnitPrices,
    rateUnitLabels,
    planCreditGrants,
    creditGrantAmounts,
    planSubscriptionFees,
    subscriptionFeeAmounts,
    subscriptionFeeUnitLabels,
    planPriceTypeOptions,
  } = args

  const fields: IncompleteField[] = []

  // Plan details
  if (!planName.trim()) {
    fields.push({ key: "plan.name", label: t("Plan name"), message: t("Enter a plan name"), nodeType: "plan" })
  }

  // Rate cards and their rates
  for (const card of planRateCards) {
    if (!card.name.trim()) {
      fields.push({
        key: `rateCard.${card.id}.name`,
        label: t("Rate card name"),
        message: t("Enter a display name"),
        nodeType: "rateCard",
        nodeId: card.id,
      })
    }

    for (const rate of card.rates) {
      if (!rate.name.trim()) {
        fields.push({
          key: `rate.${rate.id}.name`,
          label: t("Rate name"),
          message: t("Enter a display name"),
          nodeType: "rate",
          nodeId: rate.id,
        })
      }
      if (!(rateMeters[rate.id] ?? "").trim()) {
        fields.push({
          key: `rate.${rate.id}.meter`,
          label: t("Rate meter"),
          message: t("Select a meter"),
          nodeType: "rate",
          nodeId: rate.id,
        })
      }
      // Price per unit only for non-tiered rates
      const priceType = ratePriceTypes[rate.id] ?? planPriceTypeOptions[0]
      const isTiered = priceType === "Graduated" || priceType === "Volume"
      if (!isTiered && !(planRateUnitPrices[rate.id] ?? "").trim()) {
        fields.push({
          key: `rate.${rate.id}.unitPrice`,
          label: t("Rate price per unit"),
          message: t("Enter a valid price even if its $0.00"),
          nodeType: "rate",
          nodeId: rate.id,
        })
      }
    }
  }

  // Credit grants
  for (const grant of planCreditGrants) {
    if (!grant.name.trim()) {
      fields.push({
        key: `creditGrant.${grant.id}.name`,
        label: t("Credit grant name"),
        message: t("Enter a display name"),
        nodeType: "creditGrant",
        nodeId: grant.id,
      })
    }
    if (!(creditGrantAmounts[grant.id] ?? "").trim()) {
      fields.push({
        key: `creditGrant.${grant.id}.amount`,
        label: t("Credit amount"),
        message: t("Enter a valid amount even if its $0.00"),
        nodeType: "creditGrant",
        nodeId: grant.id,
      })
    }
  }

  // Subscription fees
  for (const fee of planSubscriptionFees) {
    if (!fee.name.trim()) {
      fields.push({
        key: `subscriptionFee.${fee.id}.name`,
        label: t("Subscription fee name"),
        message: t("Enter a display name"),
        nodeType: "subscriptionFee",
        nodeId: fee.id,
      })
    }
    if (!(subscriptionFeeAmounts[fee.id] ?? "").trim()) {
      fields.push({
        key: `subscriptionFee.${fee.id}.amount`,
        label: t("Price per unit"),
        message: t("Enter a valid price even if its $0.00"),
        nodeType: "subscriptionFee",
        nodeId: fee.id,
      })
    }
  }

  return fields
}

/** Derive unique objects that have at least one validation error */
export function getValidationErrorObjects(
  fields: IncompleteField[],
  helpers: {
    getPlanLabel: (name: string, fallback: string) => string
    getPlanRateLabel: (rate?: { id: number; name: string } | null) => string
    getPlanCreditGrantLabel: (grant?: PlanNamedItem | null) => string
    getPlanSubscriptionFeeLabel: (fee?: PlanNamedItem | null) => string
    planName: string
    planRateCards: PlanRateCard[]
    planCreditGrants: PlanNamedItem[]
    planSubscriptionFees: PlanNamedItem[]
    t: (key: string) => string
  }
): ValidationErrorObject[] {
  const seen = new Set<string>()
  const objects: ValidationErrorObject[] = []

  for (const field of fields) {
    const key = field.nodeId != null ? `${field.nodeType}:${field.nodeId}` : field.nodeType
    if (seen.has(key)) continue
    seen.add(key)

    let label = ""
    if (field.nodeType === "plan") {
      label = helpers.getPlanLabel(helpers.planName, helpers.t("Pricing plan"))
    } else if (field.nodeType === "rateCard") {
      const card = helpers.planRateCards.find((c) => c.id === field.nodeId)
      label = card?.name.trim() || helpers.t("Rate card")
    } else if (field.nodeType === "rate") {
      let rate: { id: number; name: string } | null = null
      for (const card of helpers.planRateCards) {
        rate = card.rates.find((r) => r.id === field.nodeId) ?? null
        if (rate) break
      }
      label = helpers.getPlanRateLabel(rate)
    } else if (field.nodeType === "creditGrant") {
      const grant = helpers.planCreditGrants.find((g) => g.id === field.nodeId)
      label = helpers.getPlanCreditGrantLabel(grant)
    } else if (field.nodeType === "subscriptionFee") {
      const fee = helpers.planSubscriptionFees.find((f) => f.id === field.nodeId)
      label = helpers.getPlanSubscriptionFeeLabel(fee)
    }

    objects.push({ nodeType: field.nodeType, nodeId: field.nodeId, label })
  }

  return objects
}
