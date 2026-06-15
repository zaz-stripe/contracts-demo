/**
 * PriceFormSection - Modular price form components
 *
 * This module provides components for managing product pricing:
 *
 * - PriceFormSection: Main form component with collapsed prices list
 * - PricingSection: Tiered and flat pricing editor
 * - InternalReferenceSection: Description and lookup key fields
 * - CollapsedPriceRow: Individual collapsed price row
 *
 * Constants and utilities are in priceFormConstants.ts and priceFormUtils.ts
 */

// Main component
export { PriceFormSection } from "./PriceFormSection"

// Sub-components
export { PricingSection } from "./PricingSection"
export { InternalReferenceSection } from "./InternalReferenceSection"
export { CollapsedPriceRow } from "./CollapsedPriceRow"

// Types
export type { PriceFormSectionProps, PriceSummary, BillingShortcutId } from "./priceFormTypes"

// Constants
export {
  moneyInputClasses,
  rowSelectorButtonClasses,
  packageQuantityInputClasses,
  packageUnitsInputClasses,
  detailTileClasses,
  textFieldInputClasses,
  priceNameInputClasses,
  assistantHighlightClass,
  chargeFrequencyOptions,
  recurringPricingOptions,
  oneOffPricingOptions,
  billingPeriodOptions,
  includeTaxOptions,
  tieredByOptions,
  usageBasisOptions,
} from "./priceFormConstants"

// Utilities
export { focusElement, t } from "./priceFormUtils"
