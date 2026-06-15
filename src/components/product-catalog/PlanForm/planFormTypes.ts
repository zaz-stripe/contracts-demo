import type { Dispatch, SetStateAction } from "react"

export type PlanRate = { id: number; name: string }
export type PlanRateCard = { id: number; name: string; rates: PlanRate[] }
export type PlanNamedItem = { id: number; name: string; linkedRateCardId?: number }

export type PlanNode = {
  type: "plan" | "rateCard" | "rate" | "rateMeter" | "creditGrant" | "subscriptionFee" | "priceGroup"
  id?: number
}

export type MetadataMap = Record<number, number[]>
export type MetadataValueMap = Record<number, Record<number, { key: string; value: string }>>

export type PlanFormContext = {
  t: (key: string) => string
  textFieldInputClasses: string
  // Highlight support for scoped AI previews (used by Object map "Ask for changes").
  assistantHighlightedKeys?: string[]
  assistantHighlightClass?: string
  // Loading keys for showing skeleton placeholders during AI generation.
  assistantLoadingKeys?: string[]
  // Validation error keys for highlighting incomplete fields after submit attempt.
  validationErrorKeys?: string[]
  // Validation error messages keyed by field key (for inline error display).
  validationErrorMessages?: Record<string, string>

  currencyOptions: string[]
  currencyDisplayNames: Intl.DisplayNames | null
  includeTaxOptions: string[]
  servicingPeriodOptions: string[]
  planPriceTypeOptions: string[]
  sellAsOptions: string[]
  creditApplicationOptions: string[]
  aggregationMethodOptions: string[]
  eventTimeWindowOptions: string[]
  numberFormatter: Intl.NumberFormat
  parseNumberValue: (value: string) => number

  activePlanNode: PlanNode
  setActivePlanNode: Dispatch<SetStateAction<PlanNode>>
  activePlanRateCardId: number
  activePlanRateCard: PlanRateCard | null
  planRateCards: PlanRateCard[]
  planRates?: PlanRate[]
  planCurrency: string

  getMetadataRows: (map: MetadataMap, id: number) => number[]
  addMetadataRow: (
    setter: Dispatch<SetStateAction<MetadataMap>>,
    id: number,
    valueSetter?: Dispatch<SetStateAction<MetadataValueMap>>
  ) => void
  removeMetadataRow: (
    setter: Dispatch<SetStateAction<MetadataMap>>,
    id: number,
    rowId: number,
    valueSetter?: Dispatch<SetStateAction<MetadataValueMap>>
  ) => void

  // Rate card
  rateCardServicingPeriods: Record<number, string>
  setRateCardServicingPeriods: Dispatch<SetStateAction<Record<number, string>>>
  rateCardLookupKeys: Record<number, string>
  setRateCardLookupKeys: Dispatch<SetStateAction<Record<number, string>>>
  showRateCardAdvanced: boolean
  setShowRateCardAdvanced: Dispatch<SetStateAction<boolean>>
  updateRateCardName: (id: number, value: string) => void
  rateCardMetadataRows: MetadataMap
  setRateCardMetadataRows: Dispatch<SetStateAction<MetadataMap>>
  rateCardMetadataValues: MetadataValueMap
  setRateCardMetadataValues: Dispatch<SetStateAction<MetadataValueMap>>

  // Rate
  updateRateName: (rateId: number, value: string) => void
  existingRateNames: string[]
  existingFeeNames: string[]
  meterOptions: string[]
  onOpenMeterBuilderForRate: (rateId: number) => void
  planRateMeterConfigs: Record<
    number,
    {
      name: string
      eventName: string
      aggregationMethod: string
      eventTimeWindow: string
      showCountingOptions: boolean
      valueKeyOverride: string
    }
  >
  setPlanRateMeterConfigs: Dispatch<
    SetStateAction<
      Record<
        number,
        {
          name: string
          eventName: string
          aggregationMethod: string
          eventTimeWindow: string
          showCountingOptions: boolean
          valueKeyOverride: string
        }
      >
    >
  >
  setAvailableMeterOptions: Dispatch<SetStateAction<string[]>>
  updateAvailableMeterName: (prevList: string[], previous: string, next: string) => string[]
  rateMeters: Record<number, string>
  setRateMeters: Dispatch<SetStateAction<Record<number, string>>>
  ratePriceTypes: Record<number, string>
  setRatePriceTypes: Dispatch<SetStateAction<Record<number, string>>>
  rateSellAs: Record<number, string>
  setRateSellAs: Dispatch<SetStateAction<Record<number, string>>>
  planRateUnitPrices: Record<number, string>
  setPlanRateUnitPrices: Dispatch<SetStateAction<Record<number, string>>>
  planRateTiers: Record<number, number[]>
  setPlanRateTiers: Dispatch<SetStateAction<Record<number, number[]>>>
  planRateTierToValues: Record<number, Record<number, string>>
  setPlanRateTierToValues: Dispatch<SetStateAction<Record<number, Record<number, string>>>>
  planRateTierUnitPrices: Record<number, Record<number, string>>
  setPlanRateTierUnitPrices: Dispatch<SetStateAction<Record<number, Record<number, string>>>>
  planRateTierFlatFees: Record<number, Record<number, string>>
  setPlanRateTierFlatFees: Dispatch<SetStateAction<Record<number, Record<number, string>>>>
  planRateIncludeTax: Record<number, string>
  setPlanRateIncludeTax: Dispatch<SetStateAction<Record<number, string>>>
  planRateCurrencies: Record<number, { id: number; code: string }[]>
  setPlanRateCurrencies: Dispatch<SetStateAction<Record<number, { id: number; code: string }[]>>>
  planRateActiveCurrencyId: Record<number, number>
  setPlanRateActiveCurrencyId: Dispatch<SetStateAction<Record<number, number>>>
  usageScenarioDraggingRateId: number | null
  planRateUsage: Record<number, string>
  rateUnitLabels: Record<number, string>
  setRateUnitLabels: Dispatch<SetStateAction<Record<number, string>>>
  showRateAdvanced: boolean
  setShowRateAdvanced: Dispatch<SetStateAction<boolean>>
  rateTaxCodes: Record<number, string>
  setRateTaxCodes: Dispatch<SetStateAction<Record<number, string>>>
  rateItemLookupKeys: Record<number, string>
  setRateItemLookupKeys: Dispatch<SetStateAction<Record<number, string>>>
  rateItemMetadataRows: MetadataMap
  setRateItemMetadataRows: Dispatch<SetStateAction<MetadataMap>>
  rateItemMetadataValues: MetadataValueMap
  setRateItemMetadataValues: Dispatch<SetStateAction<MetadataValueMap>>
  rateSettingsMetadataRows: MetadataMap
  setRateSettingsMetadataRows: Dispatch<SetStateAction<MetadataMap>>
  rateSettingsMetadataValues: MetadataValueMap
  setRateSettingsMetadataValues: Dispatch<SetStateAction<MetadataValueMap>>

  // Rate price variants (from multi-price products)
  ratePriceVariants: Record<number, { label: string; price: string; cadence: string; meter: string; priceType: string; sellAs: string; unitLabel: string }[]>
  onSelectRatePriceVariant: (rateId: number, variantIndex: number) => void

  // Credit grants
  planCreditGrants: PlanNamedItem[]
  setPlanCreditGrants: Dispatch<SetStateAction<PlanNamedItem[]>>
  updateCreditGrantName: (id: number, value: string) => void
  creditGrantPeriods: Record<number, string>
  setCreditGrantPeriods: Dispatch<SetStateAction<Record<number, string>>>
  creditGrantAmounts: Record<number, string>
  setCreditGrantAmounts: Dispatch<SetStateAction<Record<number, string>>>
  creditGrantApplications: Record<number, string>
  setCreditGrantApplications: Dispatch<SetStateAction<Record<number, string>>>
  showCreditAdvanced: boolean
  setShowCreditAdvanced: Dispatch<SetStateAction<boolean>>
  creditGrantLookupKeys: Record<number, string>
  setCreditGrantLookupKeys: Dispatch<SetStateAction<Record<number, string>>>

  // Subscription fees
  planSubscriptionFees: PlanNamedItem[]
  updateSubscriptionFeeName: (id: number, value: string) => void
  subscriptionFeeItemMetadataRows: MetadataMap
  setSubscriptionFeeItemMetadataRows: Dispatch<SetStateAction<MetadataMap>>
  subscriptionFeeItemMetadataValues: MetadataValueMap
  setSubscriptionFeeItemMetadataValues: Dispatch<SetStateAction<MetadataValueMap>>
  subscriptionFeeFeeMetadataRows: MetadataMap
  setSubscriptionFeeFeeMetadataRows: Dispatch<SetStateAction<MetadataMap>>
  subscriptionFeeFeeMetadataValues: MetadataValueMap
  setSubscriptionFeeFeeMetadataValues: Dispatch<SetStateAction<MetadataValueMap>>
  subscriptionFeePeriods: Record<number, string>
  setSubscriptionFeePeriods: Dispatch<SetStateAction<Record<number, string>>>
  subscriptionFeePriceTypes: Record<number, string>
  setSubscriptionFeePriceTypes: Dispatch<SetStateAction<Record<number, string>>>
  subscriptionFeeSellAs: Record<number, string>
  setSubscriptionFeeSellAs: Dispatch<SetStateAction<Record<number, string>>>
  subscriptionFeeAmounts: Record<number, string>
  setSubscriptionFeeAmounts: Dispatch<SetStateAction<Record<number, string>>>
  subscriptionFeeUnitLabels: Record<number, string>
  setSubscriptionFeeUnitLabels: Dispatch<SetStateAction<Record<number, string>>>
  showSubscriptionFeeAdvanced: boolean
  setShowSubscriptionFeeAdvanced: Dispatch<SetStateAction<boolean>>
  subscriptionFeeTaxCodes: Record<number, string>
  setSubscriptionFeeTaxCodes: Dispatch<SetStateAction<Record<number, string>>>
  subscriptionFeeItemLookupKeys: Record<number, string>
  setSubscriptionFeeItemLookupKeys: Dispatch<SetStateAction<Record<number, string>>>
  subscriptionFeeFeeLookupKeys: Record<number, string>
  setSubscriptionFeeFeeLookupKeys: Dispatch<SetStateAction<Record<number, string>>>

  // Credit grant metadata
  creditGrantItemMetadataRows: MetadataMap
  setCreditGrantItemMetadataRows: Dispatch<SetStateAction<MetadataMap>>
  creditGrantItemMetadataValues: MetadataValueMap
  setCreditGrantItemMetadataValues: Dispatch<SetStateAction<MetadataValueMap>>
  creditGrantInstanceMetadataRows: MetadataMap
  setCreditGrantInstanceMetadataRows: Dispatch<SetStateAction<MetadataMap>>
  creditGrantInstanceMetadataValues: MetadataValueMap
  setCreditGrantInstanceMetadataValues: Dispatch<SetStateAction<MetadataValueMap>>

  // Price groups
  planPriceGroups: { id: number; name: string; serviceInterval: string }[]
  setPlanPriceGroups: Dispatch<SetStateAction<{ id: number; name: string; serviceInterval: string }[]>>

  // Plan
  planName: string
  setPlanName: Dispatch<SetStateAction<string>>
  planDescription: string
  setPlanDescription: Dispatch<SetStateAction<string>>
  setPlanCurrency: Dispatch<SetStateAction<string>>
  planLookupKey: string
  setPlanLookupKey: Dispatch<SetStateAction<string>>
  planTaxTreatment: string
  setPlanTaxTreatment: Dispatch<SetStateAction<string>>
  planMetadataRows: MetadataMap
  setPlanMetadataRows: Dispatch<SetStateAction<MetadataMap>>
  planMetadataValues: MetadataValueMap
  setPlanMetadataValues: Dispatch<SetStateAction<MetadataValueMap>>
  showPlanAdvanced: boolean
  setShowPlanAdvanced: Dispatch<SetStateAction<boolean>>

  // Bulk edit
  onEditAllRates?: (rateCardId: number) => void

  // Focus management
  pendingFocusRateId?: number | null
  clearPendingFocusRateId?: () => void

  // Quick-start: add multiple items at once for common pricing patterns
  onQuickStart?: (kind: "subscription" | "usage" | "subscription-usage" | "credits-usage") => void
  onHoverQuickStart?: (kind: "subscription" | "usage" | "subscription-usage" | "credits-usage" | null) => void
  /** Called when user clicks "Start from scratch" — opens sidebar and shows plan form */
  onSkipGetStarted?: () => void
  /** Called when user submits the inline wizard form in the "Form" tab of Get Started */
  onWizardSubmit?: (data: {
    planName: string
    costPerMonth: string
    costPeriod: string
    costCustomCount: string
    costCustomUnit: string
    features: string[]
    freeCreditsAmount: string
    freeCreditsPeriod: string
    freeCreditsCustomCount: string
    freeCreditsCustomUnit: string
    importedFromPlanName?: string
    importedFromPlanId?: number
  }) => void
  /** Called on every change in the inline wizard form for live preview updates */
  onWizardFormChange?: (data: {
    planName: string
    costPerMonth: string
    costPeriod: string
    costCustomCount: string
    costCustomUnit: string
    features: string[]
    freeCreditsAmount: string
    freeCreditsPeriod: string
    freeCreditsCustomCount: string
    freeCreditsCustomUnit: string
    importedFromPlanName?: string
  }) => void
  /**
   * Ref into which the inline wizard registers its current `submit` function and
   * whether it `canSubmit`. Lets the host (ProductCatalogPage) put the Get
   * started action in the modal header while the wizard is active.
   */
  wizardSubmitRef?: import("react").MutableRefObject<
    { submit: () => void; canSubmit: boolean } | null
  >
  /** Called whenever `canSubmit` changes inside the inline wizard. */
  onWizardCanSubmitChange?: (canSubmit: boolean) => void
  /**
   * Called when the inline wizard's simulated load state toggles. Lets the
   * host dim adjacent UI (preview, top chrome) while the progress bar runs.
   */
  onWizardLoadingChange?: (isLoading: boolean) => void

  // Show inline field hints on first-time add (from quick-start or plus button)
  showFieldHints?: boolean

  // Existing plans for rate import in Get Started wizard
  existingPlans?: { id: number; name: string; rateNames: string[] }[]

  // When set, shows a setup tooltip on the rate card form explaining the price group was imported
  importedPriceGroupSourcePlan?: string
  onDismissImportedPriceGroupTip?: () => void
}
