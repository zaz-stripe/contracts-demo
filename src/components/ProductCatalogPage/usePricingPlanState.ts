"use client"

import { useRef, useState } from "react"
import type {
  PlanNamedItem,
  PlanNode,
  PlanRate,
  PlanRateCard,
  PricingPlanDraft,
} from "@/components/product-catalog/productCatalogPage.types"
import { defaultMeterOptions } from "@/components/product-catalog/productCatalogPage.constants"

/**
 * Hook for managing pricing plan form state
 */
export function usePricingPlanState() {
  // Core plan fields
  const [planName, setPlanName] = useState("")
  const [planDescription, setPlanDescription] = useState("")
  const [planCurrency, setPlanCurrency] = useState("USD")
  const [planLookupKey, setPlanLookupKey] = useState("")
  const [planTaxTreatment, setPlanTaxTreatment] = useState("Yes")

  // Rate cards
  const [planRateCards, setPlanRateCards] = useState<PlanRateCard[]>([
    { id: 0, name: "", rates: [{ id: 0, name: "" }] },
  ])
  const assistantPlanRateCardsDraftRef = useRef<PlanRateCard[] | null>(null)
  const [planRates, setPlanRates] = useState<PlanRate[]>([])
  const [activePlanRateCardId, setActivePlanRateCardId] = useState<number>(0)

  // Rate pricing
  const [planRateUsage, setPlanRateUsage] = useState<Record<number, string>>({ 0: "0" })
  const [planRateUnitPrices, setPlanRateUnitPrices] = useState<Record<number, string>>({ 0: "" })
  const [planRateTiers, setPlanRateTiers] = useState<Record<number, number[]>>({ 0: [0, 1] })
  const [planRateTierToValues, setPlanRateTierToValues] = useState<Record<number, Record<number, string>>>({})
  const [planRateTierUnitPrices, setPlanRateTierUnitPrices] = useState<Record<number, Record<number, string>>>({})
  const [planRateTierFlatFees, setPlanRateTierFlatFees] = useState<Record<number, Record<number, string>>>({})
  const [planRateIncludeTax, setPlanRateIncludeTax] = useState<Record<number, string>>({})
  const [planRateCurrencies, setPlanRateCurrencies] = useState<Record<number, { id: number; code: string }[]>>({})
  const [planRateActiveCurrencyId, setPlanRateActiveCurrencyId] = useState<Record<number, number>>({})

  // Usage scenario
  const [planUsageScenarioRates, setPlanUsageScenarioRates] = useState<number[]>([])
  const hasUserEditedPlanUsageScenarioRef = useRef(false)
  const [usageScenarioDraggingRateId, setUsageScenarioDraggingRateId] = useState<number | null>(null)

  // Credit grants and subscription fees
  const [planCreditGrants, setPlanCreditGrants] = useState<PlanNamedItem[]>([])
  const [planSubscriptionFees, setPlanSubscriptionFees] = useState<PlanNamedItem[]>([])

  // Navigation and UI
  const [activePlanNode, setActivePlanNode] = useState<PlanNode>({ type: "plan" })
  const [pendingFocusRateId, setPendingFocusRateId] = useState<number | null>(null)
  const [planExpandedRateCards, setPlanExpandedRateCards] = useState<Record<number, boolean>>({ 0: true })

  // Advanced options visibility
  const [showRateCardAdvanced, setShowRateCardAdvanced] = useState(false)
  const [showRateAdvanced, setShowRateAdvanced] = useState(false)
  const [showCreditAdvanced, setShowCreditAdvanced] = useState(false)
  const [showSubscriptionFeeAdvanced, setShowSubscriptionFeeAdvanced] = useState(false)

  // Rate card metadata
  const [rateCardLookupKeys, setRateCardLookupKeys] = useState<Record<number, string>>({})
  const [rateCardServicingPeriods, setRateCardServicingPeriods] = useState<Record<number, string>>({})
  const [rateCardMetadataRows, setRateCardMetadataRows] = useState<Record<number, number[]>>({})
  const [rateCardMetadataValues, setRateCardMetadataValues] = useState<Record<number, Record<number, { key: string; value: string }>>>({})

  // Rate meters
  const [rateMeters, setRateMeters] = useState<Record<number, string>>({})
  const [availablePlanMeterOptions, setAvailablePlanMeterOptions] = useState<string[]>(defaultMeterOptions)
  const [planRateMeterConfigs, setPlanRateMeterConfigs] = useState<Record<number, {
    name: string
    eventName: string
    aggregationMethod: string
    eventTimeWindow: string
    showCountingOptions: boolean
    valueKeyOverride: string
  }>>({})

  // Rate settings
  const [ratePriceTypes, setRatePriceTypes] = useState<Record<number, string>>({})
  const [rateSellAs, setRateSellAs] = useState<Record<number, string>>({})
  const [rateUnitLabels, setRateUnitLabels] = useState<Record<number, string>>({})
  const [rateTaxCodes, setRateTaxCodes] = useState<Record<number, string>>({})
  const [rateItemLookupKeys, setRateItemLookupKeys] = useState<Record<number, string>>({})
  const [rateItemMetadataRows, setRateItemMetadataRows] = useState<Record<number, number[]>>({})
  const [rateItemMetadataValues, setRateItemMetadataValues] = useState<Record<number, Record<number, { key: string; value: string }>>>({})
  const [rateSettingsMetadataRows, setRateSettingsMetadataRows] = useState<Record<number, number[]>>({})
  const [rateSettingsMetadataValues, setRateSettingsMetadataValues] = useState<Record<number, Record<number, { key: string; value: string }>>>({})

  // Credit grant settings
  const [creditGrantAmounts, setCreditGrantAmounts] = useState<Record<number, string>>({})
  const [creditGrantPeriods, setCreditGrantPeriods] = useState<Record<number, string>>({})
  const [creditGrantApplications, setCreditGrantApplications] = useState<Record<number, string>>({})
  const [creditGrantLookupKeys, setCreditGrantLookupKeys] = useState<Record<number, string>>({})

  // Subscription fee settings
  const [subscriptionFeeAmounts, setSubscriptionFeeAmounts] = useState<Record<number, string>>({})
  const [subscriptionFeePeriods, setSubscriptionFeePeriods] = useState<Record<number, string>>({})
  const [subscriptionFeePriceTypes, setSubscriptionFeePriceTypes] = useState<Record<number, string>>({})
  const [subscriptionFeeSellAs, setSubscriptionFeeSellAs] = useState<Record<number, string>>({})
  const [subscriptionFeeUnitLabels, setSubscriptionFeeUnitLabels] = useState<Record<number, string>>({})
  const [subscriptionFeeTaxCodes, setSubscriptionFeeTaxCodes] = useState<Record<number, string>>({})
  const [subscriptionFeeItemLookupKeys, setSubscriptionFeeItemLookupKeys] = useState<Record<number, string>>({})
  const [subscriptionFeeFeeLookupKeys, setSubscriptionFeeFeeLookupKeys] = useState<Record<number, string>>({})
  const [subscriptionFeeItemMetadataRows, setSubscriptionFeeItemMetadataRows] = useState<Record<number, number[]>>({})
  const [subscriptionFeeFeeMetadataRows, setSubscriptionFeeFeeMetadataRows] = useState<Record<number, number[]>>({})
  const [subscriptionFeeItemMetadataValues, setSubscriptionFeeItemMetadataValues] = useState<Record<number, Record<number, { key: string; value: string }>>>({})
  const [subscriptionFeeFeeMetadataValues, setSubscriptionFeeFeeMetadataValues] = useState<Record<number, Record<number, { key: string; value: string }>>>({})

  // Editing state
  const [editingPricingPlanId, setEditingPricingPlanId] = useState<number | null>(null)

  const resetPricingPlanFormToDefaults = () => {
    setPlanName("")
    setPlanDescription("")
    setPlanCurrency("USD")
    setPlanLookupKey("")
    setPlanTaxTreatment("Included in prices")
    setPlanRateCards([])
    setPlanRates([])
    assistantPlanRateCardsDraftRef.current = null
    setActivePlanRateCardId(-1)
    setPlanRateUsage({})
    setPlanRateUnitPrices({})
    setPlanRateTiers({})
    setPlanRateTierToValues({})
    setPlanRateTierUnitPrices({})
    setPlanRateTierFlatFees({})
    setPlanRateIncludeTax({})
    setPlanRateCurrencies({})
    setPlanRateActiveCurrencyId({})
    setPlanUsageScenarioRates([])
    hasUserEditedPlanUsageScenarioRef.current = false
    setUsageScenarioDraggingRateId(null)
    setPlanCreditGrants([])
    setPlanSubscriptionFees([])
    setActivePlanNode({ type: "plan" })
    setPlanExpandedRateCards({})
    setShowRateCardAdvanced(false)
    setShowRateAdvanced(false)
    setShowCreditAdvanced(false)
    setShowSubscriptionFeeAdvanced(false)
    setRateCardLookupKeys({})
    setRateCardServicingPeriods({})
    setRateCardMetadataRows({})
    setRateCardMetadataValues({})
    setRateMeters({})
    setAvailablePlanMeterOptions(defaultMeterOptions)
    setPlanRateMeterConfigs({})
    setRatePriceTypes({})
    setRateSellAs({})
    setRateUnitLabels({})
    setRateTaxCodes({})
    setRateItemLookupKeys({})
    setRateItemMetadataRows({})
    setRateItemMetadataValues({})
    setRateSettingsMetadataRows({})
    setRateSettingsMetadataValues({})
    setCreditGrantAmounts({})
    setCreditGrantPeriods({})
    setCreditGrantApplications({})
    setCreditGrantLookupKeys({})
    setSubscriptionFeeAmounts({})
    setSubscriptionFeePeriods({})
    setSubscriptionFeePriceTypes({})
    setSubscriptionFeeSellAs({})
    setSubscriptionFeeUnitLabels({})
    setSubscriptionFeeTaxCodes({})
    setSubscriptionFeeItemLookupKeys({})
    setSubscriptionFeeFeeLookupKeys({})
    setSubscriptionFeeItemMetadataRows({})
    setSubscriptionFeeFeeMetadataRows({})
    setSubscriptionFeeItemMetadataValues({})
    setSubscriptionFeeFeeMetadataValues({})
  }

  const buildPricingPlanDraft = (): PricingPlanDraft => {
    return {
      planName,
      planDescription,
      planCurrency,
      planLookupKey,
      planTaxTreatment,
      planRateCards: JSON.parse(JSON.stringify(planRateCards)) as PlanRateCard[],
      planRates: JSON.parse(JSON.stringify(planRates)) as PlanRate[],
      activePlanRateCardId,
      planRateUsage: { ...planRateUsage },
      planRateUnitPrices: { ...planRateUnitPrices },
      planRateTiers: JSON.parse(JSON.stringify(planRateTiers)) as Record<number, number[]>,
      planRateTierToValues: JSON.parse(JSON.stringify(planRateTierToValues)) as Record<number, Record<number, string>>,
      planRateTierUnitPrices: JSON.parse(JSON.stringify(planRateTierUnitPrices)) as Record<number, Record<number, string>>,
      planRateTierFlatFees: JSON.parse(JSON.stringify(planRateTierFlatFees)) as Record<number, Record<number, string>>,
      planRateIncludeTax: { ...planRateIncludeTax },
      planRateCurrencies: JSON.parse(JSON.stringify(planRateCurrencies)) as Record<number, { id: number; code: string }[]>,
      planRateActiveCurrencyId: { ...planRateActiveCurrencyId },
      planUsageScenarioRates: [...planUsageScenarioRates],
      planCreditGrants: JSON.parse(JSON.stringify(planCreditGrants)) as PlanNamedItem[],
      planSubscriptionFees: JSON.parse(JSON.stringify(planSubscriptionFees)) as PlanNamedItem[],
      planExpandedRateCards: { ...planExpandedRateCards },
      showRateCardAdvanced,
      showRateAdvanced,
      showCreditAdvanced,
      showSubscriptionFeeAdvanced,
      rateCardLookupKeys: { ...rateCardLookupKeys },
      rateCardServicingPeriods: { ...rateCardServicingPeriods },
      rateCardMetadataRows: JSON.parse(JSON.stringify(rateCardMetadataRows)) as Record<number, number[]>,
      rateCardMetadataValues: JSON.parse(JSON.stringify(rateCardMetadataValues)) as Record<number, Record<number, { key: string; value: string }>>,
      rateMeters: { ...rateMeters },
      availablePlanMeterOptions: [...availablePlanMeterOptions],
      planRateMeterConfigs: JSON.parse(JSON.stringify(planRateMeterConfigs)) as PricingPlanDraft["planRateMeterConfigs"],
      ratePriceTypes: { ...ratePriceTypes },
      rateSellAs: { ...rateSellAs },
      rateUnitLabels: { ...rateUnitLabels },
      rateTaxCodes: { ...rateTaxCodes },
      rateItemLookupKeys: { ...rateItemLookupKeys },
      rateItemMetadataRows: JSON.parse(JSON.stringify(rateItemMetadataRows)) as Record<number, number[]>,
      rateItemMetadataValues: JSON.parse(JSON.stringify(rateItemMetadataValues)) as Record<number, Record<number, { key: string; value: string }>>,
      rateSettingsMetadataRows: JSON.parse(JSON.stringify(rateSettingsMetadataRows)) as Record<number, number[]>,
      rateSettingsMetadataValues: JSON.parse(JSON.stringify(rateSettingsMetadataValues)) as Record<number, Record<number, { key: string; value: string }>>,
      creditGrantAmounts: { ...creditGrantAmounts },
      creditGrantPeriods: { ...creditGrantPeriods },
      creditGrantApplications: { ...creditGrantApplications },
      creditGrantLookupKeys: { ...creditGrantLookupKeys },
      subscriptionFeeAmounts: { ...subscriptionFeeAmounts },
      subscriptionFeePeriods: { ...subscriptionFeePeriods },
      subscriptionFeePriceTypes: { ...subscriptionFeePriceTypes },
      subscriptionFeeSellAs: { ...subscriptionFeeSellAs },
      subscriptionFeeUnitLabels: { ...subscriptionFeeUnitLabels },
      subscriptionFeeTaxCodes: { ...subscriptionFeeTaxCodes },
      subscriptionFeeItemLookupKeys: { ...subscriptionFeeItemLookupKeys },
      subscriptionFeeFeeLookupKeys: { ...subscriptionFeeFeeLookupKeys },
      subscriptionFeeItemMetadataRows: JSON.parse(JSON.stringify(subscriptionFeeItemMetadataRows)) as Record<number, number[]>,
      subscriptionFeeFeeMetadataRows: JSON.parse(JSON.stringify(subscriptionFeeFeeMetadataRows)) as Record<number, number[]>,
      subscriptionFeeItemMetadataValues: JSON.parse(JSON.stringify(subscriptionFeeItemMetadataValues)) as Record<number, Record<number, { key: string; value: string }>>,
      subscriptionFeeFeeMetadataValues: JSON.parse(JSON.stringify(subscriptionFeeFeeMetadataValues)) as Record<number, Record<number, { key: string; value: string }>>,
    }
  }

  const loadPricingPlanDraft = (draft: PricingPlanDraft) => {
    setPlanName(draft.planName ?? "")
    setPlanDescription(draft.planDescription ?? "")
    setPlanCurrency(draft.planCurrency ?? "USD")
    setPlanLookupKey(draft.planLookupKey ?? "")
    setPlanTaxTreatment(draft.planTaxTreatment ?? "Included in prices")
    setPlanRateCards(JSON.parse(JSON.stringify(draft.planRateCards ?? [])) as PlanRateCard[])
    setPlanRates(JSON.parse(JSON.stringify(draft.planRates ?? [])) as PlanRate[])
    setActivePlanRateCardId(Number.isFinite(draft.activePlanRateCardId) ? draft.activePlanRateCardId : 0)
    setPlanRateUsage({ ...(draft.planRateUsage ?? {}) })
    setPlanRateUnitPrices({ ...(draft.planRateUnitPrices ?? {}) })
    setPlanRateTiers(JSON.parse(JSON.stringify(draft.planRateTiers ?? {})) as Record<number, number[]>)
    setPlanRateTierToValues(JSON.parse(JSON.stringify(draft.planRateTierToValues ?? {})) as Record<number, Record<number, string>>)
    setPlanRateTierUnitPrices(JSON.parse(JSON.stringify(draft.planRateTierUnitPrices ?? {})) as Record<number, Record<number, string>>)
    setPlanRateTierFlatFees(JSON.parse(JSON.stringify(draft.planRateTierFlatFees ?? {})) as Record<number, Record<number, string>>)
    setPlanRateIncludeTax({ ...(draft.planRateIncludeTax ?? {}) })
    setPlanRateCurrencies(JSON.parse(JSON.stringify(draft.planRateCurrencies ?? {})) as Record<number, { id: number; code: string }[]>)
    setPlanRateActiveCurrencyId({ ...(draft.planRateActiveCurrencyId ?? {}) })
    setPlanUsageScenarioRates([...(draft.planUsageScenarioRates ?? [])])
    hasUserEditedPlanUsageScenarioRef.current = false
    setUsageScenarioDraggingRateId(null)
    setPlanCreditGrants(JSON.parse(JSON.stringify(draft.planCreditGrants ?? [])) as PlanNamedItem[])
    setPlanSubscriptionFees(JSON.parse(JSON.stringify(draft.planSubscriptionFees ?? [])) as PlanNamedItem[])
    const loadedCards = draft.planRateCards ?? []
    const loadedExpanded = draft.planExpandedRateCards ?? {}
    const hasAnyExpanded = Object.values(loadedExpanded).some(Boolean)
    const expandedToLoad = (!hasAnyExpanded && loadedCards.length > 0)
      ? { [loadedCards[0].id]: true }
      : loadedExpanded
    setPlanExpandedRateCards({ ...expandedToLoad })
    setShowRateCardAdvanced(Boolean(draft.showRateCardAdvanced))
    setShowRateAdvanced(Boolean(draft.showRateAdvanced))
    setShowCreditAdvanced(Boolean(draft.showCreditAdvanced))
    setShowSubscriptionFeeAdvanced(Boolean(draft.showSubscriptionFeeAdvanced))
    setRateCardLookupKeys({ ...(draft.rateCardLookupKeys ?? {}) })
    setRateCardServicingPeriods({ ...(draft.rateCardServicingPeriods ?? {}) })
    setRateCardMetadataRows(JSON.parse(JSON.stringify(draft.rateCardMetadataRows ?? {})) as Record<number, number[]>)
    setRateCardMetadataValues(JSON.parse(JSON.stringify(draft.rateCardMetadataValues ?? {})) as Record<number, Record<number, { key: string; value: string }>>)
    setRateMeters({ ...(draft.rateMeters ?? {}) })
    setAvailablePlanMeterOptions([...(draft.availablePlanMeterOptions ?? defaultMeterOptions)])
    setPlanRateMeterConfigs(JSON.parse(JSON.stringify(draft.planRateMeterConfigs ?? {})) as PricingPlanDraft["planRateMeterConfigs"])
    setRatePriceTypes({ ...(draft.ratePriceTypes ?? {}) })
    setRateSellAs({ ...(draft.rateSellAs ?? {}) })
    setRateUnitLabels({ ...(draft.rateUnitLabels ?? {}) })
    setRateTaxCodes({ ...(draft.rateTaxCodes ?? {}) })
    setRateItemLookupKeys({ ...(draft.rateItemLookupKeys ?? {}) })
    setRateItemMetadataRows(JSON.parse(JSON.stringify(draft.rateItemMetadataRows ?? {})) as Record<number, number[]>)
    setRateItemMetadataValues(JSON.parse(JSON.stringify(draft.rateItemMetadataValues ?? {})) as Record<number, Record<number, { key: string; value: string }>>)
    setRateSettingsMetadataRows(JSON.parse(JSON.stringify(draft.rateSettingsMetadataRows ?? {})) as Record<number, number[]>)
    setRateSettingsMetadataValues(JSON.parse(JSON.stringify(draft.rateSettingsMetadataValues ?? {})) as Record<number, Record<number, { key: string; value: string }>>)
    setCreditGrantAmounts({ ...(draft.creditGrantAmounts ?? {}) })
    setCreditGrantPeriods({ ...(draft.creditGrantPeriods ?? {}) })
    setCreditGrantApplications({ ...(draft.creditGrantApplications ?? {}) })
    setCreditGrantLookupKeys({ ...(draft.creditGrantLookupKeys ?? {}) })
    setSubscriptionFeeAmounts({ ...(draft.subscriptionFeeAmounts ?? {}) })
    setSubscriptionFeePeriods({ ...(draft.subscriptionFeePeriods ?? {}) })
    setSubscriptionFeePriceTypes({ ...(draft.subscriptionFeePriceTypes ?? {}) })
    setSubscriptionFeeSellAs({ ...(draft.subscriptionFeeSellAs ?? {}) })
    setSubscriptionFeeUnitLabels({ ...(draft.subscriptionFeeUnitLabels ?? {}) })
    setSubscriptionFeeTaxCodes({ ...(draft.subscriptionFeeTaxCodes ?? {}) })
    setSubscriptionFeeItemLookupKeys({ ...(draft.subscriptionFeeItemLookupKeys ?? {}) })
    setSubscriptionFeeFeeLookupKeys({ ...(draft.subscriptionFeeFeeLookupKeys ?? {}) })
    setSubscriptionFeeItemMetadataRows(JSON.parse(JSON.stringify(draft.subscriptionFeeItemMetadataRows ?? {})) as Record<number, number[]>)
    setSubscriptionFeeFeeMetadataRows(JSON.parse(JSON.stringify(draft.subscriptionFeeFeeMetadataRows ?? {})) as Record<number, number[]>)
    setSubscriptionFeeItemMetadataValues(JSON.parse(JSON.stringify(draft.subscriptionFeeItemMetadataValues ?? {})) as Record<number, Record<number, { key: string; value: string }>>)
    setSubscriptionFeeFeeMetadataValues(JSON.parse(JSON.stringify(draft.subscriptionFeeFeeMetadataValues ?? {})) as Record<number, Record<number, { key: string; value: string }>>)
  }

  return {
    // Core plan fields
    planName, setPlanName,
    planDescription, setPlanDescription,
    planCurrency, setPlanCurrency,
    planLookupKey, setPlanLookupKey,
    planTaxTreatment, setPlanTaxTreatment,

    // Rate cards
    planRateCards, setPlanRateCards,
    planRates, setPlanRates,
    assistantPlanRateCardsDraftRef,
    activePlanRateCardId, setActivePlanRateCardId,

    // Rate pricing
    planRateUsage, setPlanRateUsage,
    planRateUnitPrices, setPlanRateUnitPrices,
    planRateTiers, setPlanRateTiers,
    planRateTierToValues, setPlanRateTierToValues,
    planRateTierUnitPrices, setPlanRateTierUnitPrices,
    planRateTierFlatFees, setPlanRateTierFlatFees,
    planRateIncludeTax, setPlanRateIncludeTax,
    planRateCurrencies, setPlanRateCurrencies,
    planRateActiveCurrencyId, setPlanRateActiveCurrencyId,

    // Usage scenario
    planUsageScenarioRates, setPlanUsageScenarioRates,
    hasUserEditedPlanUsageScenarioRef,
    usageScenarioDraggingRateId, setUsageScenarioDraggingRateId,

    // Credit grants and subscription fees
    planCreditGrants, setPlanCreditGrants,
    planSubscriptionFees, setPlanSubscriptionFees,

    // Navigation and UI
    activePlanNode, setActivePlanNode,
    pendingFocusRateId, setPendingFocusRateId,
    planExpandedRateCards, setPlanExpandedRateCards,

    // Advanced options visibility
    showRateCardAdvanced, setShowRateCardAdvanced,
    showRateAdvanced, setShowRateAdvanced,
    showCreditAdvanced, setShowCreditAdvanced,
    showSubscriptionFeeAdvanced, setShowSubscriptionFeeAdvanced,

    // Rate card metadata
    rateCardLookupKeys, setRateCardLookupKeys,
    rateCardServicingPeriods, setRateCardServicingPeriods,
    rateCardMetadataRows, setRateCardMetadataRows,
    rateCardMetadataValues, setRateCardMetadataValues,

    // Rate meters
    rateMeters, setRateMeters,
    availablePlanMeterOptions, setAvailablePlanMeterOptions,
    planRateMeterConfigs, setPlanRateMeterConfigs,

    // Rate settings
    ratePriceTypes, setRatePriceTypes,
    rateSellAs, setRateSellAs,
    rateUnitLabels, setRateUnitLabels,
    rateTaxCodes, setRateTaxCodes,
    rateItemLookupKeys, setRateItemLookupKeys,
    rateItemMetadataRows, setRateItemMetadataRows,
    rateItemMetadataValues, setRateItemMetadataValues,
    rateSettingsMetadataRows, setRateSettingsMetadataRows,
    rateSettingsMetadataValues, setRateSettingsMetadataValues,

    // Credit grant settings
    creditGrantAmounts, setCreditGrantAmounts,
    creditGrantPeriods, setCreditGrantPeriods,
    creditGrantApplications, setCreditGrantApplications,
    creditGrantLookupKeys, setCreditGrantLookupKeys,

    // Subscription fee settings
    subscriptionFeeAmounts, setSubscriptionFeeAmounts,
    subscriptionFeePeriods, setSubscriptionFeePeriods,
    subscriptionFeePriceTypes, setSubscriptionFeePriceTypes,
    subscriptionFeeSellAs, setSubscriptionFeeSellAs,
    subscriptionFeeUnitLabels, setSubscriptionFeeUnitLabels,
    subscriptionFeeTaxCodes, setSubscriptionFeeTaxCodes,
    subscriptionFeeItemLookupKeys, setSubscriptionFeeItemLookupKeys,
    subscriptionFeeFeeLookupKeys, setSubscriptionFeeFeeLookupKeys,
    subscriptionFeeItemMetadataRows, setSubscriptionFeeItemMetadataRows,
    subscriptionFeeFeeMetadataRows, setSubscriptionFeeFeeMetadataRows,
    subscriptionFeeItemMetadataValues, setSubscriptionFeeItemMetadataValues,
    subscriptionFeeFeeMetadataValues, setSubscriptionFeeFeeMetadataValues,

    // Editing state
    editingPricingPlanId, setEditingPricingPlanId,

    // Actions
    resetPricingPlanFormToDefaults,
    buildPricingPlanDraft,
    loadPricingPlanDraft,
  }
}

export type PricingPlanState = ReturnType<typeof usePricingPlanState>
