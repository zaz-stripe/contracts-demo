'use client'

import { useEffect, useCallback, useRef, useState, createContext, useContext } from "react"
import type { ReactNode } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useShowFieldHelper } from "@/components/product-catalog/showFieldHelper"

// Field description types and context
type FieldDescriptionInfo = {
  id: string
  title: string
  description: string
}

type FieldDescriptionContextValue = {
  activeField: FieldDescriptionInfo | null
  setActiveField: (field: FieldDescriptionInfo | null) => void
}

const FieldDescriptionContext = createContext<FieldDescriptionContextValue | null>(null)

// Field descriptions for core concepts
const FIELD_DESCRIPTIONS: Record<string, FieldDescriptionInfo> = {
  // Core navigation items
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
  'map-tab': {
    id: 'map-tab',
    title: 'Object map',
    description: 'Visualize your pricing plan as an interactive graph.',
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
  'preview-panel': {
    id: 'preview-panel',
    title: 'Billing preview',
    description: 'See a live preview of what customers will pay.',
  },

  // Add buttons
  'add-rate': {
    id: 'add-rate',
    title: 'Add rate',
    description: 'Create a new rate to define pricing for a specific type of usage.',
  },
  'add-object': {
    id: 'add-object',
    title: 'Add object',
    description: 'Add a rate card, credit grant, or subscription fee to your pricing plan.',
  },
  'add-plan': {
    id: 'add-plan',
    title: 'Add plan',
    description: 'Create a new pricing plan to bundle rates, credits, and fees together.',
  },

  // Pricing Plan form fields
  'plan-name': {
    id: 'plan-name',
    title: 'Plan name',
    description: 'The display name shown to customers at checkout and on invoices.',
  },
  'plan-description': {
    id: 'plan-description',
    title: 'Plan description',
    description: 'An optional description to help identify the plan internally.',
  },
  'plan-image': {
    id: 'plan-image',
    title: 'Plan image',
    description: 'An image displayed alongside the plan in customer-facing interfaces.',
  },
  'plan-currency': {
    id: 'plan-currency',
    title: 'Currency',
    description: 'The default currency for all prices in this plan.',
  },
  'plan-lookup-key': {
    id: 'plan-lookup-key',
    title: 'Lookup key',
    description: 'Used for identifying this plan internally.',
  },
  'plan-taxes': {
    id: 'plan-taxes',
    title: 'Tax treatment',
    description: 'Whether prices include tax or if tax is calculated separately.',
  },

  // Rate Card form fields
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

  // Rate form fields
  'rate-name': {
    id: 'rate-name',
    title: 'Rate name',
    description: 'Display name is visible to customers at checkout, on the customer portal and on invoices.',
  },
  'rate-meter': {
    id: 'rate-meter',
    title: 'Meter',
    description: 'The meter that tracks usage for this rate.',
  },
  'rate-price-type': {
    id: 'rate-price-type',
    title: 'Price type',
    description: 'Fixed rate charges a flat amount per unit. Graduated applies different rates at each tier. Volume applies the tier rate to all units.',
  },
  'rate-sell-as': {
    id: 'rate-sell-as',
    title: 'Sell as',
    description: 'Individual units charge per single unit. Packages charge for groups of units.',
  },
  'rate-unit-price': {
    id: 'rate-unit-price',
    title: 'Price per unit',
    description: 'The amount charged for each unit of usage.',
  },
  'rate-unit-label': {
    id: 'rate-unit-label',
    title: 'Unit label',
    description: 'A label describing what\'s being measured, shown to customers on invoices.',
  },

  // Subscription Fee form fields
  'subscription-fee-name': {
    id: 'subscription-fee-name',
    title: 'Subscription fee name',
    description: 'Display name is visible to customers at checkout and on the customer portal.',
  },
  'subscription-fee-servicing-period': {
    id: 'subscription-fee-servicing-period',
    title: 'Servicing period',
    description: 'How often the subscription fee is billed. Monthly charges customers every month, yearly charges once per year.',
  },
  'subscription-fee-price-type': {
    id: 'subscription-fee-price-type',
    title: 'Price type',
    description: 'The pricing model for the subscription fee.',
  },
  'subscription-fee-sell-as': {
    id: 'subscription-fee-sell-as',
    title: 'Sell as',
    description: 'Whether to charge per individual unit or in packages.',
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

  // Meter form fields
  'meter-select': {
    id: 'meter-select',
    title: 'Meter selection',
    description: 'Select an existing meter or create a new one for this rate.',
  },
  'meter-name': {
    id: 'meter-name',
    title: 'Meter name',
    description: 'A human-readable name to identify this meter.',
  },
  'meter-event-name': {
    id: 'meter-event-name',
    title: 'Event name',
    description: 'The event type sent from your application that this meter counts.',
  },
  'meter-aggregation': {
    id: 'meter-aggregation',
    title: 'Aggregation method',
    description: 'How events are counted—sum values, count occurrences, or use the last value.',
  },
  'meter-time-window': {
    id: 'meter-time-window',
    title: 'Event time window',
    description: 'The time period over which events are aggregated.',
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
}

const COACHMARK_TO_FIELD_MAP: Record<string, string> = {
  'pricing-plan': 'pricing-plan',
  'rate-card': 'rate-card',
  'rate': 'rate',
  'meter': 'meter',
  'credit-grant': 'credit-grant',
  'subscription-fee': 'subscription-fee',
  'map-tab': 'map-tab',
  'preview-tab': 'preview-tab',
  'code-tab': 'code-tab',
  'preview-panel': 'preview-panel',
}

function InfoIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.5 1.5H3C2.17157 1.5 1.5 2.17157 1.5 3V8.5C1.5 9.32843 2.17157 10 3 10H8.5C9.32843 10 10 9.32843 10 8.5V3C10 2.17157 9.32843 1.5 8.5 1.5ZM3 0C1.34315 0 0 1.34315 0 3V8.5C0 10.1569 1.34315 11.5 3 11.5H8.5C10.1569 11.5 11.5 10.1569 11.5 8.5V3C11.5 1.34315 10.1569 0 8.5 0H3Z"
        fill="#9CA3AF"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.23182 6.24998C4.23182 5.86338 4.54522 5.54998 4.93182 5.54998H6.02273C6.40933 5.54998 6.72273 5.86338 6.72273 6.24998V8.24998C6.72273 8.63658 6.40933 8.94998 6.02273 8.94998C5.63613 8.94998 5.32273 8.63658 5.32273 8.24998V6.94998H4.93182C4.54522 6.94998 4.23182 6.63658 4.23182 6.24998Z"
        fill="#9CA3AF"
      />
      <path
        d="M4.74994 3.74999C4.74994 3.19858 5.19854 2.74999 5.74994 2.74999C6.30134 2.74999 6.74994 3.19858 6.74994 3.74999C6.74994 4.30139 6.30134 4.74999 5.74994 4.74999C5.19854 4.74999 4.74994 4.30139 4.74994 3.74999Z"
        fill="#9CA3AF"
      />
    </svg>
  )
}

function CloseIconSmall() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0.248959 0.248959C0.580905 -0.0829864 1.1191 -0.0829864 1.45104 0.248959L5 3.79792L8.54896 0.248959C8.88091 -0.0829864 9.4191 -0.0829864 9.75104 0.248959C10.083 0.580905 10.083 1.1191 9.75104 1.45104L6.20208 5L9.75104 8.54896C10.083 8.88091 10.083 9.4191 9.75104 9.75104C9.4191 10.083 8.88091 10.083 8.54896 9.75104L5 6.20208L1.45104 9.75104C1.1191 10.083 0.580905 10.083 0.248959 9.75104C-0.0829864 9.4191 -0.0829864 8.88091 0.248959 8.54896L3.79792 5L0.248959 1.45104C-0.0829864 1.1191 -0.0829864 0.580905 0.248959 0.248959Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function FieldDescriptionBar() {
  const context = useContext(FieldDescriptionContext)
  const { showFieldHelper, setShowFieldHelper } = useShowFieldHelper()
  const [activeField, setActiveField] = useState<FieldDescriptionInfo | null>(null)
  const lastHoveredElement = useRef<Element | null>(null)

  const handleMouseOver = useCallback((e: MouseEvent) => {
    const target = e.target as Element
    const fieldElement = target.closest('[data-field-description]')
    const coachmarkElement = target.closest('[data-coachmark]')
    const relevantElement = fieldElement || coachmarkElement

    if (relevantElement === lastHoveredElement.current) {
      return
    }

    lastHoveredElement.current = relevantElement

    if (fieldElement) {
      const fieldId = fieldElement.getAttribute('data-field-description')
      if (fieldId && FIELD_DESCRIPTIONS[fieldId]) {
        setActiveField(FIELD_DESCRIPTIONS[fieldId])
        return
      }
    }

    if (coachmarkElement) {
      const coachmarkValue = coachmarkElement.getAttribute('data-coachmark')
      if (coachmarkValue) {
        const fieldId = COACHMARK_TO_FIELD_MAP[coachmarkValue]
        if (fieldId && FIELD_DESCRIPTIONS[fieldId]) {
          setActiveField(FIELD_DESCRIPTIONS[fieldId])
          return
        }
      }
    }

    // Clear active field when not hovering over a recognized field/coachmark
    setActiveField(null)
  }, [])

  useEffect(() => {
    document.addEventListener('mouseover', handleMouseOver, true)
    return () => {
      document.removeEventListener('mouseover', handleMouseOver, true)
    }
  }, [handleMouseOver])

  const displayField = context?.activeField ?? activeField

  if (!showFieldHelper) {
    return null
  }

  return (
    <div
      data-coachmark="field-description-bar"
      className="flex h-[28px] shrink-0 items-center gap-2 border-b border-[#D8DEE4] bg-[#F5F6F8] pl-4"
      style={{
        fontFamily: '"SF Pro Text", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <InfoIcon />
      <div className="flex flex-1 items-center gap-2 overflow-hidden">
        {displayField ? (
          <>
            <span className="shrink-0 text-[11px] font-[600] text-[#353A44]">
              {displayField.title}
            </span>
            <span className="text-[11px] text-[#6C7688]">—</span>
            <span className="truncate text-[11px] text-[#6C7688]">
              {displayField.description}
            </span>
          </>
        ) : (
          <span className="text-[11px] text-[#9CA3AF]">
            Hover over a field for more information
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={() => setShowFieldHelper(false)}
        className="flex h-[28px] w-[28px] shrink-0 items-center justify-center text-[#6C7688] hover:bg-[#EBEEF1] transition-colors"
        aria-label="Dismiss field helper"
      >
        <CloseIconSmall />
      </button>
    </div>
  )
}

type ProductFormOverlayProps = {
  isOpen: boolean
  onClose: () => void
  header?: ReactNode
  /** Full-height sidebar rendered to the left of header + body */
  sidebar?: ReactNode
  children: ReactNode
  ariaLabel?: string
  /**
   * Optional absolute-positioned overlay rendered as a sibling above
   * header + sidebar + body. Used to host transient experiences (like the
   * inline Get Started wizard) that should occlude all chrome and translate
   * independently of the layout.
   */
  wizardOverlay?: ReactNode
}

export function ProductFormOverlay({
  isOpen,
  onClose,
  header,
  sidebar,
  children,
  ariaLabel = "Modal",
  wizardOverlay,
}: ProductFormOverlayProps) {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="modal"
          className="fixed inset-0 z-30 flex h-screen w-screen flex-row bg-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12, ease: "easeOut" }}
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel}
        >
          <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
            {header}
            <div className="flex flex-1 overflow-hidden">
              {sidebar}
              <div className="flex-1 min-w-0 overflow-hidden">{children}</div>
            </div>
            {wizardOverlay}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

