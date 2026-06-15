import { useMemo } from "react"
import type { PlanRateCard, PricingPlanDraft } from "../productCatalogPage.types"

export type PlanUsageEntry = {
  id: number
  name: string
  total: number
  quantity: number
  unitPrice: number
}

type UseReceiptCalculationsProps = {
  draft: PricingPlanDraft
  rateUsage: Record<number, string>
  usageScenarioRates: number[]
  parseNumberValue: (value: string) => number
  getPlanRateLabel: (rate?: { id: number; name: string } | null) => string
}

type UseReceiptCalculationsResult = {
  planUsageEntries: PlanUsageEntry[]
  planUsageTotal: number
  planSubscriptionFeeAmount: number
  planSubtotal: number
  planSalesTax: number
  planTotal: number
}

export function useReceiptCalculations({
  draft,
  rateUsage,
  usageScenarioRates,
  parseNumberValue,
  getPlanRateLabel,
}: UseReceiptCalculationsProps): UseReceiptCalculationsResult {
  // Extract only the properties we need from draft to minimize re-calculations
  // when unrelated draft properties change
  const {
    planRateCards,
    planRateUnitPrices,
    planRateTiers,
    planRateTierToValues,
    planRateTierUnitPrices,
    planRateTierFlatFees,
    ratePriceTypes,
    subscriptionFeeAmounts,
  } = draft

  // Memoize tier calculations separately - these are expensive and only depend on tier data
  const tierRangesByRate = useMemo(() => {
    const result: Record<number, { id: number; from: number; to: number; unitPrice: number; flatFee: number }[]> = {}

    for (const rateId of usageScenarioRates) {
      const tierIds = planRateTiers[rateId] ?? [0, 1]
      const tierToValues = planRateTierToValues[rateId] ?? {}
      const tierUnitPrices = planRateTierUnitPrices[rateId] ?? {}
      const tierFlatFees = planRateTierFlatFees[rateId] ?? {}

      result[rateId] = tierIds.reduce<{ id: number; from: number; to: number; unitPrice: number; flatFee: number }[]>(
        (acc, id, index) => {
          const isLast = index === tierIds.length - 1
          const defaultTo = (index + 1) * 1000
          const toRaw = tierToValues[id] || String(defaultTo)
          const parsedTo = isLast ? Infinity : parseNumberValue(toRaw || `${defaultTo}`)
          const previousTo = acc[index - 1]?.to ?? 0
          acc.push({
            id,
            from: index === 0 ? 0 : previousTo + 1,
            to: isLast ? Infinity : parsedTo,
            unitPrice: parseNumberValue(tierUnitPrices[id] || "0"),
            flatFee: parseNumberValue(tierFlatFees[id] || "0"),
          })
          return acc
        },
        []
      )
    }

    return result
  }, [usageScenarioRates, planRateTiers, planRateTierToValues, planRateTierUnitPrices, planRateTierFlatFees, parseNumberValue])

  // Main calculation memo - now depends on pre-computed tier ranges
  return useMemo(() => {
    const planUsageEntries = usageScenarioRates
      .map((rateId) => {
        const rateCardForRate = planRateCards.find((card) =>
          card.rates.some((rate) => rate.id === rateId)
        )
        const rate = rateCardForRate?.rates.find((item) => item.id === rateId)
        if (!rate) return null

        const quantity = parseNumberValue(rateUsage[rate.id] ?? "0") ?? 0
        const priceType = (ratePriceTypes[rate.id] ?? "Unit").trim()
        const fixedUnitPrice = parseNumberValue(planRateUnitPrices[rate.id] ?? "0") ?? 0

        // Use pre-computed tier ranges
        const tierRanges = tierRangesByRate[rateId] ?? []

        const isTiered = priceType === "Graduated" || priceType === "Volume"
        const activeTier = isTiered
          ? tierRanges.find((tier) => quantity <= tier.to) ?? tierRanges[tierRanges.length - 1] ?? null
          : null
        const unitPrice = isTiered ? activeTier?.unitPrice ?? 0 : fixedUnitPrice

        // Calculate total based on pricing type
        let total: number
        if (isTiered && priceType === "Graduated") {
          // Graduated pricing: sum costs across all applicable tiers
          total = tierRanges.reduce((sum, tier) => {
            const upper = tier.to === Infinity ? quantity : Math.min(quantity, tier.to)
            const units = Math.max(0, upper - tier.from + (tier.from === 0 ? 0 : 1))
            if (!units) return sum
            return sum + units * tier.unitPrice + tier.flatFee
          }, 0)
        } else if (isTiered) {
          // Volume pricing: single tier applies to all units
          total = quantity * unitPrice + (activeTier?.flatFee ?? 0)
        } else {
          // Unit pricing: simple multiplication
          total = quantity * unitPrice
        }

        return {
          id: rate.id,
          name: getPlanRateLabel(rate),
          quantity,
          unitPrice,
          total,
        }
      })
      .filter((entry): entry is PlanUsageEntry => entry !== null)

    const planUsageTotal = planUsageEntries.reduce((sum, entry) => sum + entry.total, 0)
    const planSubscriptionFeeAmount = Object.values(subscriptionFeeAmounts).reduce((sum, value) => {
      return sum + (parseNumberValue(value ?? "0") ?? 0)
    }, 0)
    const planSubtotal = planUsageTotal + planSubscriptionFeeAmount
    const planSalesTax = planSubtotal * 0.05
    const planTotal = planSubtotal + planSalesTax

    return {
      planUsageEntries,
      planUsageTotal,
      planSubscriptionFeeAmount,
      planSubtotal,
      planSalesTax,
      planTotal,
    }
  }, [
    usageScenarioRates,
    planRateCards,
    rateUsage,
    ratePriceTypes,
    planRateUnitPrices,
    tierRangesByRate,
    subscriptionFeeAmounts,
    parseNumberValue,
    getPlanRateLabel,
  ])
}

