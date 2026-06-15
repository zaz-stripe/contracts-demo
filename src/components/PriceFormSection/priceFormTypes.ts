export type BillingShortcutId = "description" | "lookup-key"

export type PriceSummary = {
  id: number
  label: string
}

export type PriceFormSectionProps = {
  // Collapsed prices
  collapsedPrices: PriceSummary[]
  onEditCollapsedPrice: (id: number) => void
  onDeleteCollapsedPrice: (id: number) => void
  /**
   * When false, hides the collapsed price list and its actions. Useful when the price tree
   * is rendered elsewhere (e.g. the left nav).
   */
  showCollapsedPriceList?: boolean
  /**
   * When set, the expanded editor renders inline in place of the matching collapsed price row.
   * When null/undefined, the editor renders as the draft/new price form below the collapsed list.
   */
  editingCollapsedPriceId?: number | null
  showTopBar?: boolean
  typography?: "default" | "large"
  priceName?: string
  setPriceName?: (value: string) => void
  priceNamePlaceholder?: string

  // Form state
  chargeFrequency: string
  setChargeFrequency: (value: string) => void
  pricingModel: string
  onPricingModelChange: (value: string) => void
  billingPeriod: string
  setBillingPeriod: (value: string) => void
  includeTax: string
  setIncludeTax: (value: string) => void
  usageBasis: string
  onUsageBasisChange: (value: string) => void
  tieredBy: string
  setTieredBy: (value: string) => void
  meter: string
  onMeterChange: (value: string) => void
  onOpenMeterBuilder: () => void
  meterOptions: string[]

  // Tiers
  tiers: number[]
  onAddTier: () => void
  onRemoveTier: (id: number) => void
  tierToValues: Record<number, string>
  onChangeTierTo: (id: number, value: string) => void
  tierUnitPrices: Record<number, string>
  onChangeTierUnitPrice: (id: number, value: string) => void
  tierFlatFees: Record<number, string>
  onChangeTierFlatFee: (id: number, value: string) => void

  // Currencies
  pricingCurrencies: { id: number; code: string }[]
  activeCurrencyId: number
  setActiveCurrencyId: (id: number) => void
  currencyAmounts: Record<number, string>
  setCurrencyAmounts: (amounts: Record<number, string>) => void
  currencyOptions: string[]
  currencyDisplayNames: Intl.DisplayNames | null
  onAddCurrency: (code?: string) => void
  onDeleteCurrency: (id: number) => void
  onCurrencyChange: (id: number, code: string) => void

  // Internal reference
  showInternalReference: boolean
  setShowInternalReference: (show: boolean) => void
  /**
   * Controls whether "Additional details" is progressively disclosed (default)
   * or always visible (used by simplified modal).
   */
  internalReferenceDisclosure?: "collapsible" | "always"
  priceDescription: string
  setPriceDescription: (value: string) => void
  lookupKey: string
  setLookupKey: (value: string) => void

  // UI state
  showPriceForm: boolean
  shouldAnimatePriceForm: boolean
  onAnimationComplete: () => void
  priceFormInstance: number
  highlightedId: string | null
  assistantHighlightedKeys?: string[]
  newFieldEffect: "highlight" | "blur"
  isDrawerSurface: boolean

  // Actions
  onAddPrice: () => void
}
