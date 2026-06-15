'use client'

import { useCallback, useMemo, useState } from "react"

export type RelatedObjectKind = "invoice" | "customer" | "product" | "coupon" | "meter"

export type InvoiceDraft = {
  invoiceNumber: string
  dueDate: string
  amount: string
  description: string
}

export type CustomerDraft = {
  name: string
  email: string
  country: string
  notes: string
}

export type MeterDraft = {
  eventName?: string
  aggregation?: string
}

export type ProductDraft = {
  name: string
  unitPrice: string
  billingModel: string
  description: string
}

export type CouponDraft = {
  name: string
  amount: string
  duration: string
}

export type RelatedFlowData = {
  invoice: InvoiceDraft
  customer: CustomerDraft
  product: ProductDraft
  coupon: CouponDraft
  meter: MeterDraft
}

export type Tier1Suggestion = {
  actionLabel: string
  reason: string
  onClick: () => void
}

export type RelatedObjectSummary = {
  id: RelatedObjectKind
  kind: RelatedObjectKind
  label: string
  isComplete: boolean
  hasData: boolean
}

export type AddMenuOption = {
  kind: RelatedObjectKind
  label: string
  description: string
}

const CORE_PEER_KINDS: RelatedObjectKind[] = ["invoice", "customer", "product", "coupon"]

const DEFAULT_DATA: RelatedFlowData = {
  invoice: {
    invoiceNumber: "INV-2026-001",
    dueDate: "",
    amount: "",
    description: "",
  },
  customer: {
    name: "",
    email: "",
    country: "United States",
    notes: "",
  },
  product: {
    name: "",
    unitPrice: "",
    billingModel: "Per unit",
    description: "",
  },
  coupon: {
    name: "",
    amount: "",
    duration: "Once",
  },
  meter: {
    eventName: "",
    aggregation: "sum",
  },
}

const LABEL_BY_KIND: Record<RelatedObjectKind, string> = {
  invoice: "Invoice",
  customer: "Customer",
  product: "Product",
  coupon: "Coupon",
  meter: "Meter",
}

const ADD_MENU_METADATA: Record<RelatedObjectKind, { label: string; description: string }> = {
  invoice: {
    label: "Add invoice",
    description: "Create a billable object that can reference the customer and product.",
  },
  customer: {
    label: "Add customer",
    description: "Capture who the invoice belongs to without changing the current form shape.",
  },
  product: {
    label: "Add product",
    description: "Attach something concrete to invoice for without nesting it under the customer.",
  },
  coupon: {
    label: "Add coupon",
    description: "Discount line items on this invoice.",
  },
  meter: {
    label: "Add meter",
    description: "Usage-based billing meter for your product (requires product in the flow).",
  },
}

type NavState = {
  objectOrder: RelatedObjectKind[]
  activeKind: RelatedObjectKind
}

function getObjectLabel(kind: RelatedObjectKind, data: RelatedFlowData): string {
  if (kind === "invoice") return data.invoice.invoiceNumber.trim() || "Untitled invoice"
  if (kind === "customer") return data.customer.name.trim() || "Untitled customer"
  if (kind === "product") return data.product.name.trim() || "Untitled product"
  if (kind === "coupon") return data.coupon.name.trim() || "Untitled coupon"
  return data.meter.eventName?.trim() || "Untitled meter"
}

function getObjectCompletion(kind: RelatedObjectKind, data: RelatedFlowData): boolean {
  if (kind === "invoice") return data.invoice.invoiceNumber.trim() !== "" && data.invoice.amount.trim() !== ""
  if (kind === "customer") return data.customer.name.trim() !== "" && data.customer.email.trim() !== ""
  if (kind === "product") return data.product.name.trim() !== "" && data.product.unitPrice.trim() !== ""
  if (kind === "coupon") return data.coupon.name.trim() !== "" && data.coupon.amount.trim() !== ""
  return Boolean(data.meter.eventName?.trim())
}

function getObjectHasData(kind: RelatedObjectKind, data: RelatedFlowData): boolean {
  if (kind === "meter") {
    return Boolean(data.meter.eventName?.trim())
  }
  const values = Object.values(data[kind])
  return values.some((v) => typeof v === "string" && v.trim().length > 0)
}

/** Peers in the add menu: core kinds not yet added, plus meter only after product exists. */
function getAddMenuKinds(objectOrder: RelatedObjectKind[]): RelatedObjectKind[] {
  const fromCore = CORE_PEER_KINDS.filter((k) => !objectOrder.includes(k))
  const meterOk = objectOrder.includes("product") && !objectOrder.includes("meter")
  return meterOk ? [...fromCore, "meter"] : fromCore
}

function buildTier1Suggestions(
  activeKind: RelatedObjectKind,
  objectOrder: RelatedObjectKind[],
  ensureObject: (kind: RelatedObjectKind) => void
): Tier1Suggestion[] {
  const has = (k: RelatedObjectKind) => objectOrder.includes(k)
  const out: Tier1Suggestion[] = []

  if (activeKind === "invoice") {
    if (!has("customer")) {
      out.push({
        actionLabel: "Add a customer",
        reason: "to receive this invoice.",
        onClick: () => ensureObject("customer"),
      })
    }
    if (!has("product")) {
      out.push({
        actionLabel: "Add a product",
        reason: "to bill for on this invoice.",
        onClick: () => ensureObject("product"),
      })
    }
    if (!has("coupon")) {
      out.push({
        actionLabel: "Add a coupon",
        reason: "optional discount on this invoice.",
        onClick: () => ensureObject("coupon"),
      })
    }
  }

  if (activeKind === "customer") {
    if (!has("invoice")) {
      out.push({
        actionLabel: "Add an invoice",
        reason: "to bill this customer.",
        onClick: () => ensureObject("invoice"),
      })
    }
  }

  if (activeKind === "product") {
    if (has("product") && !has("meter")) {
      out.push({
        actionLabel: "Add a meter",
        reason: "as its own object for usage-based billing.",
        onClick: () => ensureObject("meter"),
      })
    }
  }

  if (activeKind === "meter") {
    if (!has("invoice")) {
      out.push({
        actionLabel: "Add an invoice",
        reason: "to see a composed document preview.",
        onClick: () => ensureObject("invoice"),
      })
    }
  }

  return out
}

/** Checklist rows for the active object (stable-guidance / review modes). */
export function getCompletionChecklist(
  activeKind: RelatedObjectKind,
  data: RelatedFlowData
): { id: string; label: string; done: boolean }[] {
  if (activeKind === "invoice") {
    return [
      { id: "inv-no", label: "Invoice number", done: data.invoice.invoiceNumber.trim() !== "" },
      { id: "inv-amt", label: "Amount", done: data.invoice.amount.trim() !== "" },
      { id: "inv-due", label: "Due date", done: data.invoice.dueDate.trim() !== "" },
      { id: "inv-desc", label: "Description", done: data.invoice.description.trim() !== "" },
    ]
  }
  if (activeKind === "customer") {
    return [
      { id: "cu-name", label: "Customer name", done: data.customer.name.trim() !== "" },
      { id: "cu-email", label: "Email", done: data.customer.email.trim() !== "" },
      { id: "cu-country", label: "Country", done: data.customer.country.trim() !== "" },
    ]
  }
  if (activeKind === "product") {
    return [
      { id: "pr-name", label: "Product name", done: data.product.name.trim() !== "" },
      { id: "pr-price", label: "Unit price", done: data.product.unitPrice.trim() !== "" },
      { id: "pr-model", label: "Billing model", done: data.product.billingModel.trim() !== "" },
    ]
  }
  if (activeKind === "coupon") {
    return [
      { id: "cp-name", label: "Coupon name", done: data.coupon.name.trim() !== "" },
      { id: "cp-amt", label: "Amount off", done: data.coupon.amount.trim() !== "" },
      { id: "cp-dur", label: "Duration", done: data.coupon.duration.trim() !== "" },
    ]
  }
  return [
    { id: "m-ev", label: "Event name", done: Boolean(data.meter.eventName?.trim()) },
    { id: "m-ag", label: "Aggregation", done: Boolean(data.meter.aggregation?.trim()) },
  ]
}

export function useRelatedObjectFlow() {
  const [nav, setNav] = useState<NavState>({
    objectOrder: ["invoice"],
    activeKind: "invoice",
  })
  const [data, setData] = useState<RelatedFlowData>(DEFAULT_DATA)

  const { objectOrder, activeKind } = nav

  const ensureObject = useCallback((kind: RelatedObjectKind) => {
    setNav((n) => {
      if (kind === "meter" && !n.objectOrder.includes("product")) {
        return n
      }
      const order = n.objectOrder.includes(kind) ? n.objectOrder : [...n.objectOrder, kind]
      return { objectOrder: order, activeKind: kind }
    })
  }, [])

  const setActiveKind = useCallback((kind: RelatedObjectKind) => {
    setNav((n) => (n.objectOrder.includes(kind) ? { ...n, activeKind: kind } : n))
  }, [])

  const objects = useMemo<RelatedObjectSummary[]>(
    () =>
      objectOrder.map((kind) => ({
        id: kind,
        kind,
        label: getObjectLabel(kind, data),
        isComplete: getObjectCompletion(kind, data),
        hasData: getObjectHasData(kind, data),
      })),
    [data, objectOrder]
  )

  const addMenuOptions = useMemo<AddMenuOption[]>(
    () =>
      getAddMenuKinds(objectOrder).map((kind) => ({
        kind,
        label: ADD_MENU_METADATA[kind].label,
        description: ADD_MENU_METADATA[kind].description,
      })),
    [objectOrder]
  )

  const tier1Suggestions = useMemo<Tier1Suggestion[]>(
    () => buildTier1Suggestions(activeKind, objectOrder, ensureObject),
    [activeKind, ensureObject, objectOrder]
  )

  const updateInvoice = useCallback((patch: Partial<InvoiceDraft>) => {
    setData((prev) => ({ ...prev, invoice: { ...prev.invoice, ...patch } }))
  }, [])

  const updateCustomer = useCallback((patch: Partial<CustomerDraft>) => {
    setData((prev) => ({ ...prev, customer: { ...prev.customer, ...patch } }))
  }, [])

  const updateProduct = useCallback((patch: Partial<ProductDraft>) => {
    setData((prev) => ({ ...prev, product: { ...prev.product, ...patch } }))
  }, [])

  const updateCoupon = useCallback((patch: Partial<CouponDraft>) => {
    setData((prev) => ({ ...prev, coupon: { ...prev.coupon, ...patch } }))
  }, [])

  const updateMeter = useCallback((patch: Partial<MeterDraft>) => {
    setData((prev) => ({ ...prev, meter: { ...prev.meter, ...patch } }))
  }, [])

  const loadFromSimpleCustomer = useCallback((customer: Partial<CustomerDraft>) => {
    setNav({ objectOrder: ["customer"], activeKind: "customer" })
    setData({
      ...DEFAULT_DATA,
      customer: {
        ...DEFAULT_DATA.customer,
        ...customer,
      },
    })
  }, [])

  const reset = useCallback(() => {
    setNav({ objectOrder: ["invoice"], activeKind: "invoice" })
    setData(DEFAULT_DATA)
  }, [])

  return {
    objectOrder,
    activeKind,
    data,
    objects,
    addMenuOptions,
    tier1Suggestions,
    setActiveKind,
    ensureObject,
    updateInvoice,
    updateCustomer,
    updateProduct,
    updateCoupon,
    updateMeter,
    loadFromSimpleCustomer,
    reset,
    labelByKind: LABEL_BY_KIND,
  }
}
