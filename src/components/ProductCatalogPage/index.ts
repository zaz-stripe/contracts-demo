/**
 * ProductCatalogPage - Modular state management and utilities
 *
 * This module provides hooks for managing the complex state of the product catalog page.
 * The state has been split into focused hooks:
 *
 * - useProductFormState: Product form fields (name, description, tax code, etc.)
 * - usePriceFormState: Pricing configuration (currencies, tiers, billing period)
 * - useMeterFormState: Meter configuration (aggregation, time window)
 * - usePricingPlanState: Pricing plan fields (rate cards, credit grants, subscription fees)
 * - useUIState: UI state (modals, popovers, navigation)
 *
 * Utility functions are in formatters.ts
 */

// State hooks
export { useProductFormState, type ProductFormState } from "./useProductFormState"
export { usePriceFormState, type PriceFormState } from "./usePriceFormState"
export { useMeterFormState, type MeterFormState } from "./useMeterFormState"
export { usePricingPlanState, type PricingPlanState } from "./usePricingPlanState"
export { useUIState, type UIState } from "./useUIState"

// Utilities
export {
  formatIntegerWithCommas,
  parseNumberValue,
  formatCurrencyValue,
  getPlanLabel,
  getBillingLabelForPeriod,
  getLocationLabel,
  stateOptionsByLocation,
  createNumberFormatter,
  createCurrencyDisplayNames,
  getCurrencyOptions,
} from "./formatters"
