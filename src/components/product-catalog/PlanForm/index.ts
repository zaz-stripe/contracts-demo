/**
 * PlanForm - Modular form components for pricing plan management
 *
 * This module provides form components for managing different plan node types:
 *
 * - PlanForm: Main form component that switches between form sections
 * - RateCardForm: Form for rate card configuration
 * - RateForm: Form for rate/metered item configuration
 * - RateMeterForm: Form for meter configuration within a rate
 * - CreditGrantForm: Form for credit grant configuration
 * - SubscriptionFeeForm: Form for subscription fee configuration
 * - PlanDetailsForm: Form for plan-level settings (name, currency, etc.)
 *
 * Shared components:
 * - HighlightedInput: Input with AI highlight support
 * - InputSkeleton: Loading placeholder for inputs
 *
 * Utilities are in planFormUtils.ts
 */

// Main form component
export { PlanForm } from "./PlanForm"

// Form section components
export { RateCardForm } from "./RateCardForm"
export { RateForm } from "./RateForm"
export { RateMeterForm } from "./RateMeterForm"
export { CreditGrantForm } from "./CreditGrantForm"
export { SubscriptionFeeForm } from "./SubscriptionFeeForm"
export { PlanDetailsForm } from "./PlanDetailsForm"

// Shared components
export { HighlightedInput, InputSkeleton } from "./HighlightedInput"
export type { HighlightedInputProps } from "./HighlightedInput"

// Types
export type {
  PlanFormContext,
  PlanRate,
  PlanRateCard,
  PlanNamedItem,
  PlanNode,
  MetadataMap,
  MetadataValueMap,
} from "./planFormTypes"

// Utilities
export {
  detailChipClasses,
  inlineAddButtonClasses,
  countFilledMetadataEntries,
  focusElement,
  createHighlightChecker,
  createHighlightClassGetter,
  createLoadingChecker,
  chipWithValue,
  createEnterToCloseHandler,
} from "./planFormUtils"

// Form close context (for closing form panel on Enter)
export { PlanFormCloseProvider, usePlanFormClose } from "./PlanFormCloseContext"
