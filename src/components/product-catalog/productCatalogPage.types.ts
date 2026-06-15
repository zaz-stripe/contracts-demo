export type CatalogItemStatus = "draft" | "live"

export type ProductRow = {
  id: number
  name: string
  description?: string
  billingPeriod: string
  amount: string
  currency: string
  imageUrl: string | null
  status?: CatalogItemStatus
  draft?: {
    chargeFrequency: string
    pricingModel: string
    usageBasis: string
    meter: string
    billingPeriod: string
    includeTax: string
    tieredBy: string
    tiers: number[]
    tierToValues: Record<number, string>
    tierUnitPrices: Record<number, string>
    tierFlatFees: Record<number, string>
    productTaxCode: string
    statementDescriptor: string
    unitLabel: string
    metadataRows: number[]
    featureRows: number[]
    metadataValues?: Record<number, { key: string; value: string }>
    featureValues?: Record<number, string>
  }
}

export type SavedPriceConfig = {
  chargeFrequency: string
  pricingModel: string
  billingPeriod: string
  includeTax: string
  currencies: { id: number; code: string }[]
  currencyAmounts: Record<number, string>
  tiers: number[]
  tierToValues: Record<number, string>
  tierUnitPrices: Record<number, string>
  tierFlatFees: Record<number, string>
  usageBasis: string
  tieredBy: string
  meter: string
}

export type PriceSummary = {
  id: number
  label: string
  config: SavedPriceConfig
}

export type PlanRate = {
  id: number
  name: string
}

export type PlanRateCard = {
  id: number
  name: string
  rates: PlanRate[]
  priceGroupId?: number
  componentLink?: import("./componentTypes").ComponentLink
}

export type PlanPriceGroup = {
  id: number
  name: string
  serviceInterval: string
}

export type PlanNamedItem = {
  id: number
  name: string
  componentLink?: import("./componentTypes").ComponentLink
  linkedRateCardId?: number
}

export type PlanNode = {
  type: "plan" | "rateCard" | "rate" | "rateMeter" | "creditGrant" | "subscriptionFee" | "priceGroup"
  id?: number
  /** Plan ID this node belongs to (for cross-plan selection tracking) */
  planId?: number
}

export type PricingPlanDraft = {
  planName: string
  planDescription: string
  planCurrency: string
  planLookupKey: string
  planTaxTreatment: string

  planPriceGroups?: PlanPriceGroup[]
  planRateCards: PlanRateCard[]
  planRates: PlanRate[]
  activePlanRateCardId: number
  planRateUsage: Record<number, string>
  planRateUnitPrices: Record<number, string>
  planRateTiers: Record<number, number[]>
  planRateTierToValues: Record<number, Record<number, string>>
  planRateTierUnitPrices: Record<number, Record<number, string>>
  planRateTierFlatFees: Record<number, Record<number, string>>
  planRateIncludeTax: Record<number, string>
  planRateCurrencies: Record<number, { id: number; code: string }[]>
  planRateActiveCurrencyId: Record<number, number>
  planUsageScenarioRates: number[]

  planCreditGrants: PlanNamedItem[]
  planSubscriptionFees: PlanNamedItem[]
  planExpandedRateCards: Record<number, boolean>

  showRateCardAdvanced: boolean
  showRateAdvanced: boolean
  showCreditAdvanced: boolean
  showSubscriptionFeeAdvanced: boolean

  rateCardLookupKeys: Record<number, string>
  rateCardServicingPeriods: Record<number, string>
  rateCardMetadataRows: Record<number, number[]>
  rateCardMetadataValues: Record<number, Record<number, { key: string; value: string }>>

  rateMeters: Record<number, string>
  availablePlanMeterOptions: string[]
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

  ratePriceTypes: Record<number, string>
  rateSellAs: Record<number, string>
  rateUnitLabels: Record<number, string>
  rateTaxCodes: Record<number, string>
  rateItemLookupKeys: Record<number, string>
  rateItemMetadataRows: Record<number, number[]>
  rateItemMetadataValues: Record<number, Record<number, { key: string; value: string }>>
  rateSettingsMetadataRows: Record<number, number[]>
  rateSettingsMetadataValues: Record<number, Record<number, { key: string; value: string }>>

  creditGrantAmounts: Record<number, string>
  creditGrantPeriods: Record<number, string>
  creditGrantApplications: Record<number, string>
  creditGrantLookupKeys: Record<number, string>

  subscriptionFeeAmounts: Record<number, string>
  subscriptionFeePeriods: Record<number, string>
  subscriptionFeePriceTypes: Record<number, string>
  subscriptionFeeSellAs: Record<number, string>
  subscriptionFeeUnitLabels: Record<number, string>
  subscriptionFeeTaxCodes: Record<number, string>
  subscriptionFeeItemLookupKeys: Record<number, string>
  subscriptionFeeFeeLookupKeys: Record<number, string>
  subscriptionFeeItemMetadataRows: Record<number, number[]>
  subscriptionFeeFeeMetadataRows: Record<number, number[]>
  subscriptionFeeItemMetadataValues: Record<number, Record<number, { key: string; value: string }>>
  subscriptionFeeFeeMetadataValues: Record<number, Record<number, { key: string; value: string }>>
}

export type PlanVersion = {
  id: number
  name: string
  createdAt: number
  draft: PricingPlanDraft
}

export type PricingPlanRow = {
  id: number
  name: string
  description?: string
  billingPeriod: string
  amount: string
  currency: string
  status?: CatalogItemStatus
  draft?: PricingPlanDraft
  versions?: PlanVersion[]
  defaultVersionId?: number
}


