import type { PricingPlanRow } from '@/components/product-catalog/productCatalogPage.types'

export const PHOTON_PLAN_ID = -998

// Photon Health: $50/mo platform fee + $0.50 per order
// To swap this plan out, replace the data below.
// To remove it entirely, set SHOW_PHOTON_PLAN = false in ProductCatalogPage.tsx.
export const PHOTON_PRICING_PLAN: PricingPlanRow = {
  id: PHOTON_PLAN_ID,
  name: "Doximity Pricing Plan",
  description: "",
  billingPeriod: "Monthly",
  amount: "$50.00 + usage",
  currency: "USD",
  status: "draft",
  draft: {
    planName: "Doximity Pricing Plan",
    planDescription: "",
    planCurrency: "USD",
    planLookupKey: "",
    planTaxTreatment: "Included in prices",

    planRateCards: [
      { id: 1, name: "Per-Order Fee", rates: [{ id: 1, name: "Orders" }] },
    ],
    planRates: [],
    activePlanRateCardId: 1,
    planRateUsage: {},
    planRateUnitPrices: { 1: "0.50" },
    planRateTiers: {},
    planRateTierToValues: {},
    planRateTierUnitPrices: {},
    planRateTierFlatFees: {},
    planRateIncludeTax: {},
    planRateCurrencies: {},
    planRateActiveCurrencyId: {},
    planUsageScenarioRates: [1],

    planCreditGrants: [],
    planSubscriptionFees: [{ id: 1, name: "Platform Fee" }],
    planExpandedRateCards: {},

    showRateCardAdvanced: false,
    showRateAdvanced: false,
    showCreditAdvanced: false,
    showSubscriptionFeeAdvanced: false,

    rateCardLookupKeys: {},
    rateCardServicingPeriods: { 1: "Monthly" },
    rateCardMetadataRows: {},
    rateCardMetadataValues: {},

    rateMeters: { 1: "orders" },
    availablePlanMeterOptions: ["orders"],
    planRateMeterConfigs: {},

    ratePriceTypes: { 1: "Fixed rate" },
    rateSellAs: { 1: "Per unit" },
    rateUnitLabels: { 1: "order" },
    rateTaxCodes: {},
    rateItemLookupKeys: {},
    rateItemMetadataRows: {},
    rateItemMetadataValues: {},
    rateSettingsMetadataRows: {},
    rateSettingsMetadataValues: {},

    creditGrantAmounts: {},
    creditGrantPeriods: {},
    creditGrantApplications: {},
    creditGrantLookupKeys: {},

    subscriptionFeeAmounts: { 1: "50.00" },
    subscriptionFeePeriods: { 1: "Monthly" },
    subscriptionFeePriceTypes: { 1: "Flat" },
    subscriptionFeeSellAs: { 1: "Per subscription" },
    subscriptionFeeUnitLabels: {},
    subscriptionFeeTaxCodes: {},
    subscriptionFeeItemLookupKeys: {},
    subscriptionFeeFeeLookupKeys: {},
    subscriptionFeeItemMetadataRows: {},
    subscriptionFeeFeeMetadataRows: {},
    subscriptionFeeItemMetadataValues: {},
    subscriptionFeeFeeMetadataValues: {},
  },
}
