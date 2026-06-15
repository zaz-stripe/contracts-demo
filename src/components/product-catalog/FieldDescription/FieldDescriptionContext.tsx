'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

export type FieldDescriptionInfo = {
  id: string
  title: string
  description: string
}

type FieldDescriptionContextValue = {
  activeField: FieldDescriptionInfo | null
  setActiveField: (field: FieldDescriptionInfo | null) => void
}

const FieldDescriptionContext = createContext<FieldDescriptionContextValue | null>(null)

export function FieldDescriptionProvider({ children }: { children: ReactNode }) {
  const [activeField, setActiveField] = useState<FieldDescriptionInfo | null>(null)

  return (
    <FieldDescriptionContext.Provider value={{ activeField, setActiveField }}>
      {children}
    </FieldDescriptionContext.Provider>
  )
}

export function useFieldDescription() {
  const context = useContext(FieldDescriptionContext)
  if (!context) {
    throw new Error('useFieldDescription must be used within FieldDescriptionProvider')
  }
  return context
}

// Field descriptions map - these are the core fields from coachmarks plus additional field-specific descriptions
export const FIELD_DESCRIPTIONS: Record<string, FieldDescriptionInfo> = {
  // Core pricing plan concepts (from coachmarks)
  'pricing-plan': {
    id: 'pricing-plan',
    title: 'Pricing plan',
    description: 'A subscription package that bundles rates, credits, and fees together for billing.',
  },
  'rate-card': {
    id: 'rate-card',
    title: 'Rate card',
    description: 'Groups related rates that share the same billing period and currency.',
  },
  'rate': {
    id: 'rate',
    title: 'Rate',
    description: 'Sets the price for usage, with optional tiers for volume discounts.',
  },
  'meter': {
    id: 'meter',
    title: 'Meter',
    description: 'Tracks usage events from your application. Each rate connects to a meter that counts what customers consume.',
  },
  'credit-grant': {
    id: 'credit-grant',
    title: 'Credit grant',
    description: 'Free credits applied to reduce what customers pay.',
  },
  'subscription-fee': {
    id: 'subscription-fee',
    title: 'Subscription fee',
    description: 'A fixed recurring charge, separate from usage.',
  },

  // Plan details fields
  'plan-name': {
    id: 'plan-name',
    title: 'Plan name',
    description: 'The display name for this pricing plan shown to customers.',
  },
  'plan-description': {
    id: 'plan-description',
    title: 'Plan description',
    description: 'A brief description of what this plan includes and who it\'s for.',
  },
  'plan-image': {
    id: 'plan-image',
    title: 'Plan image',
    description: 'An image displayed alongside the plan in customer-facing interfaces.',
  },
  'plan-currency': {
    id: 'plan-currency',
    title: 'Currency',
    description: 'The currency used for all prices in this plan. All rates inherit this currency by default.',
  },
  'plan-lookup-key': {
    id: 'plan-lookup-key',
    title: 'Lookup key',
    description: 'A unique identifier used to reference this plan in your code. Use lowercase with underscores.',
  },
  'plan-taxes': {
    id: 'plan-taxes',
    title: 'Tax treatment',
    description: 'Whether taxes are included in prices or calculated separately at checkout.',
  },

  // Rate card fields
  'rate-card-name': {
    id: 'rate-card-name',
    title: 'Rate card name',
    description: 'A descriptive name for this group of rates, like "API Usage" or "Storage".',
  },
  'rate-card-period': {
    id: 'rate-card-period',
    title: 'Billing period',
    description: 'How often customers are billed for usage in this rate card (monthly, yearly, etc.).',
  },
  'rate-card-lookup-key': {
    id: 'rate-card-lookup-key',
    title: 'Rate card lookup key',
    description: 'A unique identifier to reference this rate card in your code.',
  },
  // Aliases matching data-field-description attributes in forms
  'ratecard-name': {
    id: 'ratecard-name',
    title: 'Rate card name',
    description: 'Display name is visible to customers at checkout and on the customer portal.',
  },
  'ratecard-servicing-period': {
    id: 'ratecard-servicing-period',
    title: 'Servicing period',
    description: 'How often usage is aggregated and billed. Monthly charges customers every month, yearly charges once per year.',
  },
  'ratecard-lookup-key': {
    id: 'ratecard-lookup-key',
    title: 'Rate card lookup key',
    description: 'A unique identifier used to reference this rate card via the API.',
  },
  'ratecard-metadata': {
    id: 'ratecard-metadata',
    title: 'Rate card metadata',
    description: 'Custom key-value pairs for storing additional information.',
  },

  // Rate fields
  'rate-name': {
    id: 'rate-name',
    title: 'Rate name',
    description: 'The name displayed to customers for this billable item.',
  },
  'rate-meter': {
    id: 'rate-meter',
    title: 'Meter',
    description: 'The meter that tracks usage for this rate. Select an existing meter or create a new one.',
  },
  'rate-price-type': {
    id: 'rate-price-type',
    title: 'Price type',
    description: 'How pricing scales: Usage (flat per-unit), Graduated (different prices per tier), or Volume (single price based on total).',
  },
  'rate-unit-price': {
    id: 'rate-unit-price',
    title: 'Unit price',
    description: 'The price per unit of usage. For tiered pricing, this is the base tier price.',
  },
  'rate-sell-as': {
    id: 'rate-sell-as',
    title: 'Sell as',
    description: 'How to charge: per unit (each item separately) or per package (bundles of units).',
  },
  'rate-unit-label': {
    id: 'rate-unit-label',
    title: 'Unit label',
    description: 'The singular name for one unit of this rate, like "call", "GB", or "seat".',
  },
  'rate-tiers': {
    id: 'rate-tiers',
    title: 'Pricing tiers',
    description: 'Volume-based pricing tiers. Add tiers to offer discounts as usage increases.',
  },
  'rate-tax-code': {
    id: 'rate-tax-code',
    title: 'Tax code',
    description: 'The tax category for this rate. Used to calculate the correct tax rate.',
  },
  'rate-lookup-key': {
    id: 'rate-lookup-key',
    title: 'Rate lookup key',
    description: 'A unique identifier to reference this rate in your code.',
  },

  // Meter fields
  'meter-name': {
    id: 'meter-name',
    title: 'Meter name',
    description: 'Internal name for this meter. Used in code and API calls.',
  },
  'meter-event-name': {
    id: 'meter-event-name',
    title: 'Event name',
    description: 'The event type this meter listens for. Must match events sent from your application.',
  },
  'meter-aggregation': {
    id: 'meter-aggregation',
    title: 'Aggregation method',
    description: 'How to combine events: Sum (total all values), Count (number of events), or Max (highest value).',
  },
  'meter-time-window': {
    id: 'meter-time-window',
    title: 'Time window',
    description: 'The period over which usage is accumulated before billing.',
  },
  'meter-select': {
    id: 'meter-select',
    title: 'Meter selection',
    description: 'Select an existing meter or create a new one for this rate.',
  },
  'meter-counting-options': {
    id: 'meter-counting-options',
    title: 'Counting options',
    description: 'Enable advanced counting configuration.',
  },
  'meter-value-key': {
    id: 'meter-value-key',
    title: 'Value key override',
    description: 'Custom key to extract the numeric value from event payloads.',
  },

  // Credit grant fields
  'credit-name': {
    id: 'credit-name',
    title: 'Credit grant name',
    description: 'A name for this credit grant, like "Welcome Credits" or "Monthly Bonus".',
  },
  'credit-amount': {
    id: 'credit-amount',
    title: 'Credit amount',
    description: 'The monetary value of credits given to customers.',
  },
  'credit-period': {
    id: 'credit-period',
    title: 'Credit period',
    description: 'How often credits are granted (one-time, monthly, yearly).',
  },
  'credit-application': {
    id: 'credit-application',
    title: 'Apply to',
    description: 'Which rates these credits can be used against. "All rates" or specific rate cards.',
  },
  'credit-lookup-key': {
    id: 'credit-lookup-key',
    title: 'Credit lookup key',
    description: 'A unique identifier to reference this credit grant in your code.',
  },

  // Subscription fee fields
  'subscription-fee-name': {
    id: 'subscription-fee-name',
    title: 'Subscription fee name',
    description: 'A name for this recurring fee, like "Platform Fee" or "Base Subscription".',
  },
  'subscription-fee-amount': {
    id: 'subscription-fee-amount',
    title: 'Fee amount',
    description: 'The fixed amount charged for this subscription fee.',
  },
  'subscription-fee-period': {
    id: 'subscription-fee-period',
    title: 'Billing period',
    description: 'How often this fee is charged (monthly, yearly, etc.).',
  },
  'subscription-fee-price-type': {
    id: 'subscription-fee-price-type',
    title: 'Price type',
    description: 'How the fee is calculated: Flat (fixed amount) or Per-seat (multiplied by quantity).',
  },
  'subscription-fee-sell-as': {
    id: 'subscription-fee-sell-as',
    title: 'Sell as',
    description: 'How to bill: per subscription (one fee) or per seat (fee times seat count).',
  },
  'subscription-fee-lookup-key': {
    id: 'subscription-fee-lookup-key',
    title: 'Fee lookup key',
    description: 'A unique identifier to reference this fee in your code.',
  },
  'subscription-fee-servicing-period': {
    id: 'subscription-fee-servicing-period',
    title: 'Servicing period',
    description: 'How often the subscription fee is billed. Monthly charges customers every month, yearly charges once per year.',
  },
  'subscription-fee-unit-price': {
    id: 'subscription-fee-unit-price',
    title: 'Price per unit',
    description: 'The fixed amount charged per subscription unit.',
  },
  'subscription-fee-unit-label': {
    id: 'subscription-fee-unit-label',
    title: 'Unit label',
    description: 'A label describing the subscription unit, e.g., "seat" or "user".',
  },

  // Preview and navigation
  'preview-panel': {
    id: 'preview-panel',
    title: 'Billing preview',
    description: 'See a live preview of what customers will pay. Adjust sliders to model different usage scenarios.',
  },
  'sidebar-menu': {
    id: 'sidebar-menu',
    title: 'Navigation menu',
    description: 'Browse and select different parts of your pricing plan.',
  },
  'map-tab': {
    id: 'map-tab',
    title: 'Object map',
    description: 'Visualize your pricing plan as an interactive graph. Create and edit components directly.',
  },
  'preview-tab': {
    id: 'preview-tab',
    title: 'Preview',
    description: 'Model how much customers will pay based on their usage.',
  },
  'code-tab': {
    id: 'code-tab',
    title: 'Code view',
    description: 'A live, auto-updating view of the Stripe API objects being created.',
  },
}

// Helper hook to create field hover/focus handlers
export function useFieldDescriptionHandlers(fieldId: string) {
  const { setActiveField } = useFieldDescription()
  const field = FIELD_DESCRIPTIONS[fieldId]

  const onMouseEnter = useCallback(() => {
    if (field) {
      setActiveField(field)
    }
  }, [field, setActiveField])

  const onMouseLeave = useCallback(() => {
    setActiveField(null)
  }, [setActiveField])

  const onFocus = useCallback(() => {
    if (field) {
      setActiveField(field)
    }
  }, [field, setActiveField])

  const onBlur = useCallback(() => {
    setActiveField(null)
  }, [setActiveField])

  return { onMouseEnter, onMouseLeave, onFocus, onBlur }
}
