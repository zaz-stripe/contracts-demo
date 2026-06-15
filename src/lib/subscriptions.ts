import type { ProductNode, PriceGroupNode, PlanNode } from "@/components/product-catalog/CatalogTreeNav"

export type SubscriptionTreeData = {
  products?: ProductNode[]
  priceGroups?: PriceGroupNode[]
  plans?: PlanNode[]
}

export type SubscriptionRecord = {
  id: string
  customer: string
  email?: string
  status: "active" | "trialing" | "past_due" | "canceled" | "incomplete"
  items: string
  createdAt: string
  treeData?: SubscriptionTreeData
  paymentBrand?: "visa" | "mastercard" | "link"
  paymentLast4?: string
  paymentInitial?: string
}

const STORAGE_KEY = "product-catalog-subscriptions"

const PRO_SEAT: ProductNode = {
  id: "pro-seat",
  name: "Pro Seat",
  isUsageBased: false,
  prices: [{ id: "pro-seat-price", name: "Monthly · $20.00", amount: "20.00", cadence: "Monthly" }],
}

const ENTERPRISE_SEAT: ProductNode = {
  id: "enterprise-seat",
  name: "Enterprise Seat",
  isUsageBased: false,
  prices: [{ id: "enterprise-seat-price", name: "Monthly · $99.00", amount: "99.00", cadence: "Monthly" }],
}

const DEFAULT_SUBSCRIPTIONS: SubscriptionRecord[] = [
  { id: "84729103-ACME", customer: "Acme Corp", email: "billing@example.com", status: "active", items: "Pro Seat", createdAt: "2026-05-28", treeData: { products: [PRO_SEAT] }, paymentBrand: "visa", paymentLast4: "4242", paymentInitial: "A" },
  { id: "39201847-GLBX", customer: "Globex Inc", email: "finance@example.com", status: "active", items: "Enterprise Seat", createdAt: "2026-05-15", treeData: { products: [ENTERPRISE_SEAT] }, paymentBrand: "mastercard", paymentLast4: "8910", paymentInitial: "G" },
  { id: "57283910-INTC", customer: "Initech LLC", email: "ap@example.com", status: "trialing", items: "Pro Seat", createdAt: "2026-06-01", treeData: { products: [PRO_SEAT] }, paymentBrand: "visa", paymentLast4: "1234", paymentInitial: "I" },
  { id: "19384756-UMBR", customer: "Umbrella Co", email: "payments@example.com", status: "past_due", items: "Pro Seat", createdAt: "2026-04-10", treeData: { products: [PRO_SEAT] }, paymentBrand: "mastercard", paymentLast4: "5678", paymentInitial: "U" },
  { id: "62849301-STRK", customer: "Stark Industries", email: "tony@example.com", status: "active", items: "Enterprise Seat", createdAt: "2026-03-22", treeData: { products: [ENTERPRISE_SEAT] }, paymentBrand: "visa", paymentLast4: "3141", paymentInitial: "S" },
  { id: "48172039-WAYN", customer: "Wayne Enterprises", email: "bruce@example.com", status: "canceled", items: "Enterprise Seat", createdAt: "2026-01-08", treeData: { products: [ENTERPRISE_SEAT] }, paymentBrand: "link", paymentLast4: "9265", paymentInitial: "W" },
  { id: "73920184-WNKA", customer: "Wonka Industries", email: "willy@example.com", status: "active", items: "Pro Seat", createdAt: "2026-06-05", treeData: { products: [PRO_SEAT] }, paymentBrand: "visa", paymentLast4: "7890", paymentInitial: "W" },
  { id: "28471093-PPPR", customer: "Pied Piper", email: "richard@example.com", status: "incomplete", items: "Pro Seat", createdAt: "2026-06-07", treeData: { products: [PRO_SEAT] }, paymentBrand: "mastercard", paymentLast4: "2468", paymentInitial: "P" },
]

export function loadSubscriptions(): SubscriptionRecord[] {
  if (typeof window === "undefined") return DEFAULT_SUBSCRIPTIONS
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SUBSCRIPTIONS))
      return DEFAULT_SUBSCRIPTIONS
    }
    return JSON.parse(raw)
  } catch {
    return DEFAULT_SUBSCRIPTIONS
  }
}

export function saveSubscriptions(subs: SubscriptionRecord[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(subs))
}
