import { useState, type Dispatch, type SetStateAction } from "react"
import type { PricingPlanDraft } from "../productCatalogPage.types"

type ExternalUsageState = {
  planRateUsage: Record<number, string>
  setPlanRateUsage: Dispatch<SetStateAction<Record<number, string>>>
  planUsageScenarioRates: number[]
  setPlanUsageScenarioRates: Dispatch<SetStateAction<number[]>>
}

type UseReceiptStateProps = {
  draft: PricingPlanDraft
  isCurrentPlan: boolean
  externalUsageState?: ExternalUsageState
}

type UseReceiptStateResult = {
  rateUsage: Record<number, string>
  setRateUsage: Dispatch<SetStateAction<Record<number, string>>>
  usageScenarioRates: number[]
  setUsageScenarioRates: Dispatch<SetStateAction<number[]>>
}

/**
 * Hook to manage receipt state with support for both local and external state management.
 *
 * For the current plan being edited, uses external state from the parent component
 * to keep the receipt preview in sync with the editor.
 *
 * For other plans (in multi-plan view), uses local state so each receipt
 * operates independently.
 */
export function useReceiptState({
  draft,
  isCurrentPlan,
  externalUsageState,
}: UseReceiptStateProps): UseReceiptStateResult {
  // Initialize local state from draft values
  const [localRateUsage, setLocalRateUsage] = useState<Record<number, string>>(
    () => draft.planRateUsage
  )

  const [localUsageScenarioRates, setLocalUsageScenarioRates] = useState<number[]>(() => {
    // If draft has usage scenario rates, use them
    if (draft.planUsageScenarioRates && draft.planUsageScenarioRates.length > 0) {
      return draft.planUsageScenarioRates
    }
    // Otherwise, default to all rates from all rate cards + standalone rates
    return [
      ...draft.planRateCards.flatMap(card => card.rates.map(rate => rate.id)),
      ...(draft.planRates ?? []).map(rate => rate.id),
    ]
  })

  // Return external state for current plan, local state for others
  if (isCurrentPlan && externalUsageState) {
    return {
      rateUsage: externalUsageState.planRateUsage,
      setRateUsage: externalUsageState.setPlanRateUsage,
      usageScenarioRates: externalUsageState.planUsageScenarioRates,
      setUsageScenarioRates: externalUsageState.setPlanUsageScenarioRates,
    }
  }

  return {
    rateUsage: localRateUsage,
    setRateUsage: setLocalRateUsage,
    usageScenarioRates: localUsageScenarioRates,
    setUsageScenarioRates: setLocalUsageScenarioRates,
  }
}
