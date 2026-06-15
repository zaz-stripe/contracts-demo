import type { ComponentType } from "react"
import type { WorkflowObject } from "./useWorkflowState"

// ── Types ────────────────────────────────────────────────────────────

export type PreviewProps = {
  /** Data from the currently active object */
  data: Record<string, any>
  /** All objects in the workflow (for cross-object previews like invoice totals) */
  allObjects: WorkflowObject[]
  /** The workflow config */
  config: WorkflowConfig
}

export type ObjectKindConfig = {
  label: string
  /** Icon key matching CatalogObjectGlyph kinds or custom identifiers */
  icon: string
  /** The form component rendered when this object is active */
  formComponent: ComponentType<{ data: Record<string, any>; onChange: (data: Record<string, any>) => void; errorFields?: Set<string>; onAddObject?: (kind: string) => void }>
  /** Optional preview component rendered in the right panel when this kind is active */
  previewComponent?: ComponentType<PreviewProps>
  /** Suggested next objects that can be created from this one */
  suggestedNext?: {
    kind: string
    /** Short action label, e.g. "Add a customer" */
    actionLabel: string
    /** Explanation of why, e.g. "to receive this invoice" */
    reason: string
  }[]
  /** Can multiple instances of this kind exist? Default: false */
  allowMultiple?: boolean
  /** Kind that must exist in the workflow before this one can be added */
  dependsOn?: string
  /** Fields that must be non-empty for "complete" status */
  requiredFields?: string[]
}

export type ReviewProps = {
  objects: WorkflowObject[]
  config: WorkflowConfig
  onConfirm: () => void
  onBack: () => void
}

export type LifecycleConfig = {
  strategy: "batch" | "sequential" | "review-then-submit"
  submitLabel: string
  reviewLabel?: string
  confirmLabel?: string
  reviewComponent?: ComponentType<ReviewProps>
}

export type WorkflowConfig = {
  objectKinds: Record<string, ObjectKindConfig>
  initialObjectKind: string
  lifecycle: LifecycleConfig
  discardLabel?: string
  /**
   * Tier 2: kinds shown in the global "+" add menu. Defaults to all keys in `objectKinds`.
   * Tier 1 contextual suggestions come from each kind's `suggestedNext`.
   */
  addMenuKinds?: string[]
}

/** All billing object forms — used for merged entry-point workflows and general "+" menu. */
export type FullBillingForms = {
  invoice: ComponentType<any>
  customer: ComponentType<any>
  product: ComponentType<any>
  coupon: ComponentType<any>
  meter: ComponentType<any>
  subscription: ComponentType<any>
  pricingPlan: ComponentType<any>
  invoicePreview: ComponentType<any>
  subscriptionPreview: ComponentType<any>
}

function mergedBillingObjectKinds(forms: FullBillingForms): Record<string, ObjectKindConfig> {
  return {
    invoice: {
      label: "Invoice",
      icon: "invoice",
      formComponent: forms.invoice,
      previewComponent: forms.invoicePreview,
      requiredFields: ["name", "amount", "customerId", "productId"],
      suggestedNext: [
        { kind: "customer", actionLabel: "Add a customer", reason: "to receive this invoice." },
        { kind: "coupon", actionLabel: "Add a coupon", reason: "to discount this invoice." },
      ],
    },
    subscription: {
      label: "Agreement",
      icon: "subscription",
      formComponent: forms.subscription,
      previewComponent: forms.subscriptionPreview,
      requiredFields: ["customerId", "productId"],
      suggestedNext: [
        { kind: "customer", actionLabel: "Add a customer", reason: "to subscribe to this plan." },
        { kind: "coupon", actionLabel: "Add a coupon", reason: "to discount this subscription." },
        { kind: "invoice", actionLabel: "Create an invoice", reason: "to send a one-time charge alongside it." },
      ],
    },
    customer: {
      label: "Customer",
      icon: "customer",
      formComponent: forms.customer,
      requiredFields: ["name", "email"],
      suggestedNext: [
        { kind: "invoice", actionLabel: "Create an invoice", reason: "to bill this customer." },
        { kind: "subscription", actionLabel: "Create a subscription", reason: "for recurring billing." },
        { kind: "coupon", actionLabel: "Add a coupon", reason: "to discount an invoice or subscription." },
      ],
    },
    pricingPlan: {
      label: "Pricing plan",
      icon: "pricingPlan",
      formComponent: forms.pricingPlan,
      suggestedNext: [
        { kind: "meter", actionLabel: "Add a meter", reason: "to track usage for a rate card on this plan." },
      ],
    },
    product: {
      label: "Product",
      icon: "product",
      formComponent: forms.product,
      allowMultiple: true,
      requiredFields: ["name", "unitPrice"],
      suggestedNext: [
        { kind: "meter", actionLabel: "Add a meter", reason: "to track usage on this product for usage-based billing." },
        { kind: "subscription", actionLabel: "Create a subscription", reason: "to sell this product on a recurring basis." },
        { kind: "invoice", actionLabel: "Create an invoice", reason: "to bill for this product as a one-time charge." },
      ],
    },
    meter: {
      label: "Meter",
      icon: "meter",
      formComponent: forms.meter,
      dependsOn: "product",
      requiredFields: ["name"],
      suggestedNext: [
        { kind: "pricingPlan", actionLabel: "Define pricing", reason: "to attach a rate that uses this meter." },
      ],
    },
    coupon: {
      label: "Coupon",
      icon: "coupon",
      formComponent: forms.coupon,
      requiredFields: ["name", "amount"],
      suggestedNext: [
        { kind: "subscription", actionLabel: "Create a subscription", reason: "to apply this discount on a recurring basis." },
        { kind: "invoice", actionLabel: "Create an invoice", reason: "to discount a one-time payment." },
      ],
    },
  }
}

/** Customer-first: modal until invoice or subscription is added (preview). */
export function createCustomerEntryWorkflowConfig(forms: FullBillingForms): WorkflowConfig {
  const objectKinds = mergedBillingObjectKinds(forms)
  return {
    initialObjectKind: "customer",
    discardLabel: "Discard",
    addMenuKinds: ["invoice", "subscription"],
    lifecycle: {
      strategy: "batch",
      submitLabel: "Create customer",
    },
    objectKinds,
  }
}

/** Product-first: modal until subscription or invoice adds a preview. */
export function createProductEntryWorkflowConfig(forms: FullBillingForms): WorkflowConfig {
  const objectKinds = mergedBillingObjectKinds(forms)
  return {
    initialObjectKind: "product",
    discardLabel: "Discard",
    addMenuKinds: ["product", "meter", "coupon", "subscription", "invoice", "pricingPlan"],
    lifecycle: {
      strategy: "batch",
      submitLabel: "Create product",
    },
    objectKinds,
  }
}

/** Coupon-first: stays modal unless user adds invoice/subscription (general menu). */
export function createCouponEntryWorkflowConfig(forms: FullBillingForms): WorkflowConfig {
  const objectKinds = mergedBillingObjectKinds(forms)
  return {
    initialObjectKind: "coupon",
    discardLabel: "Discard",
    addMenuKinds: ["coupon", "subscription", "invoice", "product"],
    lifecycle: {
      strategy: "batch",
      submitLabel: "Create coupon",
    },
    objectKinds,
  }
}

// ── Helpers ──────────────────────────────────────────────────────────

export type FlowEdge = { fromLabel: string; toLabel: string; reason: string }

export type OmissionReason = "backwards" | "skips-step" | "unrelated" | "uncommon"
export type FlowOmission = { fromLabel: string; notSuggested: string; reason: OmissionReason; rationale: string }

/** Exhaustive omissions — every object pair not in suggested, with rationale.
 *  "uncommon" = orange tier (possible but not typical).
 *  "backwards" / "skips-step" / "unrelated" = red tier (not suggested). */
export function getFlowOmissions(): FlowOmission[] {
  return [
    // Invoice → green: Customer, Coupon
    { fromLabel: "Invoice", notSuggested: "Product", reason: "uncommon", rationale: "Merchants usually have products already; some create per-invoice." },
    { fromLabel: "Invoice", notSuggested: "Pricing plan", reason: "uncommon", rationale: "Coupled with product — merchants usually set these up separately." },
    { fromLabel: "Invoice", notSuggested: "Agreement", reason: "backwards", rationale: "Subscriptions generate invoices, not the reverse." },
    { fromLabel: "Invoice", notSuggested: "Meter", reason: "skips-step", rationale: "Through metered prices (v1) or plan rate cards (v2)." },

    // Subscription → green: Customer, Coupon, Invoice
    { fromLabel: "Agreement", notSuggested: "Product", reason: "uncommon", rationale: "Products are usually set up already, but possible in some flows." },
    { fromLabel: "Agreement", notSuggested: "Pricing plan", reason: "backwards", rationale: "Pricing plans are complex structures — set them up before creating subscriptions." },
    { fromLabel: "Agreement", notSuggested: "Meter", reason: "skips-step", rationale: "Through metered prices (v1) or plan rate cards (v2)." },

    // Customer → green: Invoice, Subscription, Coupon
    { fromLabel: "Customer", notSuggested: "Product", reason: "uncommon", rationale: "Catalog items are usually created separately, but possible." },
    { fromLabel: "Customer", notSuggested: "Pricing plan", reason: "backwards", rationale: "Billing structures are typically set up before adding customers." },
    { fromLabel: "Customer", notSuggested: "Meter", reason: "skips-step", rationale: "Connected through subscriptions and prices/plans." },

    // Pricing plan → green: Meter
    { fromLabel: "Pricing plan", notSuggested: "Coupon", reason: "uncommon", rationale: "Possible for plan-wide discounts." },
    { fromLabel: "Pricing plan", notSuggested: "Product", reason: "unrelated", rationale: "Products are a v1 concept; pricing plans are v2." },
    { fromLabel: "Pricing plan", notSuggested: "Invoice", reason: "skips-step", rationale: "Invoices are generated by subscriptions to this plan." },
    { fromLabel: "Pricing plan", notSuggested: "Agreement", reason: "backwards", rationale: "You reach the plan from the subscription." },
    { fromLabel: "Pricing plan", notSuggested: "Customer", reason: "skips-step", rationale: "Customers are set on the subscription, not the plan." },

    // Product → green: Meter, Subscription, Invoice
    { fromLabel: "Product", notSuggested: "Pricing plan", reason: "unrelated", rationale: "Pricing plans are a v2 concept; products are v1." },
    { fromLabel: "Product", notSuggested: "Customer", reason: "skips-step", rationale: "Customers connect through invoices or subscriptions." },
    { fromLabel: "Product", notSuggested: "Coupon", reason: "backwards", rationale: "Coupon references the product (applies_to), not the reverse." },

    // Meter → green: Pricing plan
    { fromLabel: "Meter", notSuggested: "Invoice", reason: "skips-step", rationale: "Through metered prices (v1) or plan rate cards (v2)." },
    { fromLabel: "Meter", notSuggested: "Agreement", reason: "skips-step", rationale: "Through prices (v1) or plan rate cards (v2)." },
    { fromLabel: "Meter", notSuggested: "Customer", reason: "skips-step", rationale: "Connected through subscriptions and prices/plans." },
    { fromLabel: "Meter", notSuggested: "Product", reason: "backwards", rationale: "Meters are standalone; product is upstream in the catalog." },
    { fromLabel: "Meter", notSuggested: "Coupon", reason: "unrelated", rationale: "Measurement vs. discounting." },

    // Coupon → green: Subscription, Invoice
    { fromLabel: "Coupon", notSuggested: "Customer", reason: "uncommon", rationale: "Discounts typically reach customers through invoices or subscriptions, but possible." },
    { fromLabel: "Coupon", notSuggested: "Product", reason: "backwards", rationale: "Product should exist first; coupon's applies_to references it." },
    { fromLabel: "Coupon", notSuggested: "Pricing plan", reason: "skips-step", rationale: "Discounts live on subscriptions or invoices, not on plans." },
    { fromLabel: "Coupon", notSuggested: "Meter", reason: "unrelated", rationale: "Measurement vs. discounting." },
  ]
}

/** Derive Tier 1 suggestion edges from a config's objectKinds. */
export function deriveFlowEdges(config: WorkflowConfig): FlowEdge[] {
  const edges: FlowEdge[] = []
  for (const [, kindConfig] of Object.entries(config.objectKinds)) {
    for (const s of kindConfig.suggestedNext ?? []) {
      const target = config.objectKinds[s.kind]
      if (target) edges.push({ fromLabel: kindConfig.label, toLabel: target.label, reason: s.reason })
    }
  }
  return edges
}

/** Full merged billing Tier 1 graph (all object kinds, not scoped to an entry flow). */
export function getFullBillingFlowEdges(): FlowEdge[] {
  const stub = (() => () => null) as any
  const dummyForms: FullBillingForms = {
    invoice: stub, customer: stub, product: stub, coupon: stub,
    meter: stub, subscription: stub, pricingPlan: stub,
    invoicePreview: stub, subscriptionPreview: stub,
  }
  const kinds = mergedBillingObjectKinds(dummyForms)
  const fakeConfig: WorkflowConfig = {
    objectKinds: kinds,
    initialObjectKind: "invoice",
    lifecycle: { strategy: "batch", submitLabel: "" },
  }
  return deriveFlowEdges(fakeConfig)
}

export function getPrimaryLabel(config: WorkflowConfig, _phase?: "editing" | "reviewing"): string {
  return config.lifecycle.submitLabel
}

// ── Invoice flow config ──────────────────────────────────────────────

export function createInvoiceWorkflowConfig(forms: {
  invoice: ComponentType<any>
  customer: ComponentType<any>
  product: ComponentType<any>
  coupon: ComponentType<any>
  meter: ComponentType<any>
  review?: ComponentType<any>
  invoicePreview?: ComponentType<any>
}): WorkflowConfig {
  return {
    initialObjectKind: "invoice",
    discardLabel: "Discard",
    addMenuKinds: ["invoice", "customer", "coupon", "meter", "product"],
    lifecycle: {
      strategy: "batch",
      submitLabel: "Create invoice",
    },
    objectKinds: {
      invoice: {
        label: "Invoice",
        icon: "invoice",
        formComponent: forms.invoice,
        previewComponent: forms.invoicePreview,
        requiredFields: ["name", "amount", "customerId", "productId"],
        suggestedNext: [
          { kind: "customer", actionLabel: "Add a customer", reason: "to receive this invoice." },
          { kind: "coupon", actionLabel: "Add a coupon", reason: "to discount this invoice." },
        ],
      },
      customer: {
        label: "Customer",
        icon: "customer",
        formComponent: forms.customer,
        requiredFields: ["name", "email"],
        suggestedNext: [
          { kind: "product", actionLabel: "Add a product", reason: "to include on the invoice." },
        ],
      },
      product: {
        label: "Product",
        icon: "product",
        formComponent: forms.product,
        allowMultiple: true,
        requiredFields: ["name", "unitPrice"],
        suggestedNext: [
          { kind: "meter", actionLabel: "Add a meter", reason: "to track usage on this product for usage-based billing." },
        ],
      },
      meter: {
        label: "Meter",
        icon: "meter",
        formComponent: forms.meter,
        dependsOn: "product",
        requiredFields: ["name"],
        suggestedNext: [],
      },
      coupon: {
        label: "Coupon",
        icon: "coupon",
        formComponent: forms.coupon,
        // No previewComponent
        requiredFields: ["name", "amount"],
        suggestedNext: [{ kind: "product", actionLabel: "Add a product", reason: "to add as a line item on the invoice." }],
      },
    },
  }
}

// ── Subscription flow config ─────────────────────────────────────────

export function createSubscriptionWorkflowConfig(forms: {
  subscription: ComponentType<any>
  customer: ComponentType<any>
  pricingPlan: ComponentType<any>
  product: ComponentType<any>
  coupon: ComponentType<any>
  subscriptionPreview?: ComponentType<any>
}): WorkflowConfig {
  return {
    initialObjectKind: "subscription",
    discardLabel: "Discard",
    addMenuKinds: ["subscription", "customer", "pricingPlan", "product", "coupon", "invoice"],
    lifecycle: {
      strategy: "batch",
      submitLabel: "Create subscription",
    },
    objectKinds: {
      subscription: {
        label: "Agreement",
        icon: "subscription",
        formComponent: forms.subscription,
        previewComponent: forms.subscriptionPreview,
        requiredFields: ["customerId", "productId"],
        suggestedNext: [
          { kind: "customer", actionLabel: "Add a customer", reason: "to subscribe to this plan." },
          { kind: "pricingPlan", actionLabel: "Select a pricing plan", reason: "to define billing (v2)." },
          { kind: "product", actionLabel: "Add a product", reason: "to define what's being billed (v1)." },
          { kind: "coupon", actionLabel: "Add a coupon", reason: "to discount this subscription." },
          { kind: "invoice", actionLabel: "Create an invoice", reason: "to send a one-time charge alongside this subscription." },
        ],
      },
      customer: {
        label: "Customer",
        icon: "customer",
        formComponent: forms.customer,
        requiredFields: ["name", "email"],
        suggestedNext: [
          { kind: "pricingPlan", actionLabel: "Select a pricing plan", reason: "to define billing (v2)." },
          { kind: "product", actionLabel: "Add a product", reason: "to define what's being billed (v1)." },
        ],
      },
      pricingPlan: {
        label: "Pricing plan",
        icon: "pricingPlan",
        formComponent: forms.pricingPlan,
        suggestedNext: [
          { kind: "product", actionLabel: "Add a product", reason: "to include in this subscription." },
          { kind: "meter", actionLabel: "Add a meter", reason: "to track usage for a rate card on this plan." },
          { kind: "coupon", actionLabel: "Add a coupon", reason: "to discount this subscription." },
        ],
      },
      product: {
        label: "Product",
        icon: "product",
        formComponent: forms.product,
        allowMultiple: true,
        requiredFields: ["name", "unitPrice"],
        suggestedNext: [],
      },
      coupon: {
        label: "Coupon",
        icon: "coupon",
        formComponent: forms.coupon,
        requiredFields: ["name", "amount"],
        suggestedNext: [],
      },
    },
  }
}

// ── Usage-based billing flow config ─────────────────────────────────

export function createUsageBillingWorkflowConfig(forms: {
  meter: ComponentType<any>
  product: ComponentType<any>
  customer: ComponentType<any>
}): WorkflowConfig {
  return {
    initialObjectKind: "meter",
    discardLabel: "Discard",
    addMenuKinds: ["meter", "product", "customer"],
    lifecycle: {
      strategy: "batch",
      submitLabel: "Set up billing",
    },
    objectKinds: {
      meter: {
        label: "Meter",
        icon: "meter",
        formComponent: forms.meter,
        requiredFields: ["name"],
        suggestedNext: [
          { kind: "product", actionLabel: "Add a product", reason: "to bill usage against." },
        ],
      },
      product: {
        label: "Product",
        icon: "product",
        formComponent: forms.product,
        allowMultiple: true,
        requiredFields: ["name", "unitPrice"],
        suggestedNext: [
          { kind: "customer", actionLabel: "Add a customer", reason: "to bill for usage." },
        ],
      },
      customer: {
        label: "Customer",
        icon: "customer",
        formComponent: forms.customer,
        requiredFields: ["name", "email"],
        suggestedNext: [],
      },
    },
  }
}

// ── Simple customer config ───────────────────────────────────────────

export function createCustomerWorkflowConfig(forms: {
  customer: ComponentType<any>
  invoice?: ComponentType<any>
  subscription?: ComponentType<any>
  product?: ComponentType<any>
  coupon?: ComponentType<any>
  meter?: ComponentType<any>
  pricingPlan?: ComponentType<any>
  invoicePreview?: ComponentType<any>
  subscriptionPreview?: ComponentType<any>
}): WorkflowConfig {
  const full =
    forms.invoice &&
    forms.subscription &&
    forms.product &&
    forms.coupon &&
    forms.meter &&
    forms.pricingPlan &&
    forms.invoicePreview &&
    forms.subscriptionPreview

  if (full) {
    return createCustomerEntryWorkflowConfig({
      invoice: forms.invoice!,
      customer: forms.customer,
      product: forms.product!,
      coupon: forms.coupon!,
      meter: forms.meter!,
      subscription: forms.subscription!,
      pricingPlan: forms.pricingPlan!,
      invoicePreview: forms.invoicePreview!,
      subscriptionPreview: forms.subscriptionPreview!,
    })
  }

  return {
    initialObjectKind: "customer",
    discardLabel: "Discard",
    lifecycle: {
      strategy: "batch",
      submitLabel: "Create customer",
    },
    objectKinds: {
      customer: {
        label: "Customer",
        icon: "customer",
        formComponent: forms.customer,
        requiredFields: ["name"],
        // Tier 1: invoice. Product stays tier 2 (global "+") when invoice form is registered.
        suggestedNext: forms.invoice
          ? [{ kind: "invoice", actionLabel: "Create an invoice", reason: "for this customer." }]
          : [],
      },
      ...(forms.invoice
        ? {
            invoice: {
              label: "Invoice",
              icon: "invoice",
              formComponent: forms.invoice,
              suggestedNext: [],
            },
          }
        : {}),
    },
  }
}
