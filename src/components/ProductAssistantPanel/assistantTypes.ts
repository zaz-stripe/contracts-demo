/**
 * Type definitions for the Product Assistant Panel
 */

export type AssistantAction = {
  type: string
  value?: string | number | boolean
  [key: string]: unknown
}

export type AssistantApplyResult = {
  applied: number
  errors: string[]
}

export type AssistantPreviewResult = AssistantApplyResult & {
  undo: () => void
}

export type AssistantContext = {
  mode: "product" | "plan"
  focus?: {
    /**
     * The object the user is currently looking at (and expects ambiguous requests to apply to).
     * Examples: { kind: "rate", id: 12, label: "Claude 3.5 Sonnet" }
     */
    kind: string
    id?: number
    label: string
  }
  product?: {
    name: string
    description: string
    taxCode: string
    imageUrl: string | null
    statementDescriptor: string
    unitLabel: string
    activeForm: string
  }
  productMetadata?: {
    rows: number[]
    values: Record<number, { key: string; value: string }>
  }
  productFeatures?: {
    rows: number[]
    values: Record<number, string>
  }
  priceDraft?: {
    chargeFrequency: string
    pricingModel: string
    billingPeriod: string
    includeTax: string
    usageBasis: string
    tieredBy: string
    meter: string
    currencies: { id: number; code: string }[]
    currencyAmounts: Record<number, string>
  }
  tierDraft?: {
    tiers: number[]
    tierToValues: Record<number, string>
    tierUnitPrices: Record<number, string>
    tierFlatFees: Record<number, string>
  }
  prices?: { id: number; label: string }[]
  activeTreePriceId?: number | null
  meterBuilder?: {
    name: string
    eventName: string
    aggregationMethod: string
    eventTimeWindow: string
    showCountingOptions: boolean
    valueKeyOverride: string
  }
  preview?: {
    mode: string
    unitQuantity: string
    location: string
    state: string
  }
  plan?: {
    name: string
    description: string
    currency: string
    lookupKey: string
    taxTreatment: string
  }
  rateCards?: {
    id: number
    name: string
    rates: { id: number; name: string }[]
  }[]
  rateCardLookupKeys?: Record<number, string>
  rateCardServicingPeriods?: Record<number, string>
  rateCardMetadataRows?: Record<number, number[]>
  rateCardMetadataValues?: Record<number, Record<number, { key: string; value: string }>>
  creditGrants?: { id: number; name: string }[]
  subscriptionFees?: { id: number; name: string }[]
  expandedRateCards?: Record<number, boolean>
  activePlanNode?: { type: string; id?: number }
  activePlanRateCardId?: number
  planUsageScenarioRates?: number[]
  planRateUsage?: Record<number, string>
  planRatePricing?: {
    tiers: Record<number, number[]>
    tierToValues: Record<number, Record<number, string>>
    tierUnitPrices: Record<number, Record<number, string>>
    tierFlatFees: Record<number, Record<number, string>>
    includeTax: Record<number, string>
    currencies: Record<number, { id: number; code: string }[]>
    activeCurrencyId: Record<number, number>
  }
  planRateUnitPrices?: Record<number, string>
  meterOptions?: string[]
  rateMeters?: Record<number, string>
  ratePriceTypes?: Record<number, string>
  rateSellAs?: Record<number, string>
  rateUnitLabels?: Record<number, string>
  rateTaxCodes?: Record<number, string>
  rateItemLookupKeys?: Record<number, string>
  rateItemMetadataRows?: Record<number, number[]>
  rateItemMetadataValues?: Record<number, Record<number, { key: string; value: string }>>
  rateSettingsMetadataRows?: Record<number, number[]>
  rateSettingsMetadataValues?: Record<number, Record<number, { key: string; value: string }>>
  creditGrantAmounts?: Record<number, string>
  creditGrantPeriods?: Record<number, string>
  creditGrantApplications?: Record<number, string>
  creditGrantLookupKeys?: Record<number, string>
  subscriptionFeeAmounts?: Record<number, string>
  subscriptionFeePeriods?: Record<number, string>
  subscriptionFeePriceTypes?: Record<number, string>
  subscriptionFeeSellAs?: Record<number, string>
  subscriptionFeeUnitLabels?: Record<number, string>
  subscriptionFeeTaxCodes?: Record<number, string>
  subscriptionFeeItemLookupKeys?: Record<number, string>
  subscriptionFeeFeeLookupKeys?: Record<number, string>
  subscriptionFeeItemMetadataRows?: Record<number, number[]>
  subscriptionFeeItemMetadataValues?: Record<number, Record<number, { key: string; value: string }>>
  subscriptionFeeFeeMetadataRows?: Record<number, number[]>
  subscriptionFeeFeeMetadataValues?: Record<number, Record<number, { key: string; value: string }>>
  [key: string]: unknown
}

export type AssistantReferenceKind =
  | "plan"
  | "rateCard"
  | "rate"
  | "rateMeter"
  | "creditGrant"
  | "subscriptionFee"
  | "product"
  | "price"
  | "meter"
  | "meteredItem"
  | "accountName"
  | "accountAddress"
  | "accountWebsite"
  | "accountDescription"

export type AssistantReference = {
  kind: AssistantReferenceKind
  label: string
  id?: number
  content?: string // For account fields, stores the actual value
}

export type MentionableObject = {
  kind: AssistantReferenceKind
  label: string
  id?: number
  category: "existing" | "addable" | "account"
  content?: string // For account fields
}

export type ChatMessage = {
  id: number
  role: "user" | "assistant"
  content: string
  actions?: AssistantAction[]
  actionsApplied?: boolean
  suggestions?: string[]
  revertUndo?: () => void
  reverted?: boolean
}

export type ProductAssistantPanelProps = {
  onClose: () => void
  context?: AssistantContext
  onApplyActions?: (actions: AssistantAction[]) => AssistantApplyResult
  onPreviewActions?: (actions: AssistantAction[]) => AssistantPreviewResult
  onConfirmPreview?: () => void
  initialUserMessage?: string | null
  onConsumeInitialUserMessage?: () => void
  draftReference?: AssistantReference | null
  onConsumeDraftReference?: () => void
  applyDelayMs?: number
  onBeginApply?: (actions: AssistantAction[]) => void
  onEndApply?: () => void
}
