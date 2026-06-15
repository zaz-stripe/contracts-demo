import type { ComponentVersion } from "@/components/product-catalog/componentTypes"

function nowLabel(): string {
  return new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })
}

export type SimulatedRateCard = {
  id: string
  name: string
  rates: { id: number; name: string }[]
  versions: ComponentVersion[]
}

export type SimulatedSubscriptionFee = {
  id: string
  name: string
  amount: string
  period: string
  versions: ComponentVersion[]
}

export type SimulatedCreditGrant = {
  id: string
  name: string
  amount: string
  period: string
  versions: ComponentVersion[]
}

export const SIMULATED_RATE_CARDS: SimulatedRateCard[] = [
  {
    id: "rc-1",
    name: "API Usage",
    rates: [
      { id: 100, name: "API Requests" },
      { id: 101, name: "Webhooks" },
      { id: 102, name: "GraphQL Queries" },
    ],
    versions: [
      { id: "rc-1-v3", label: nowLabel(), createdAt: Date.now(), isLatest: true },
      { id: "rc-1-v2", label: "Jan 15, 2024, 10:00 AM", createdAt: 1705312800000, isLatest: false },
      { id: "rc-1-v1", label: "Nov 1, 2023, 9:00 AM", createdAt: 1698829200000, isLatest: false },
    ],
  },
  {
    id: "rc-2",
    name: "Storage",
    rates: [
      { id: 200, name: "Object Storage" },
      { id: 201, name: "Block Storage" },
    ],
    versions: [
      { id: "rc-2-v2", label: nowLabel(), createdAt: Date.now(), isLatest: true },
      { id: "rc-2-v1", label: "Oct 10, 2023, 11:00 AM", createdAt: 1696935600000, isLatest: false },
    ],
  },
  {
    id: "rc-3",
    name: "Compute Hours",
    rates: [
      { id: 300, name: "Standard Compute" },
      { id: 301, name: "GPU Compute" },
      { id: 302, name: "Edge Compute" },
      { id: 303, name: "Batch Processing" },
    ],
    versions: [
      { id: "rc-3-v1", label: nowLabel(), createdAt: Date.now(), isLatest: true },
    ],
  },
  {
    id: "rc-4",
    name: "Data Transfer",
    rates: [
      { id: 400, name: "Egress" },
      { id: 401, name: "Ingress" },
    ],
    versions: [
      { id: "rc-4-v2", label: nowLabel(), createdAt: Date.now(), isLatest: true },
      { id: "rc-4-v1", label: "Sep 15, 2023, 3:00 PM", createdAt: 1694786400000, isLatest: false },
    ],
  },
]

export const SIMULATED_SUBSCRIPTION_FEES: SimulatedSubscriptionFee[] = [
  { id: "sf-1", name: "Starter License", amount: "29.00", period: "Monthly", versions: [
    { id: "sf-1-v2", label: nowLabel(), createdAt: Date.now(), isLatest: true },
    { id: "sf-1-v1", label: "Aug 15, 2023, 2:00 PM", createdAt: 1692104400000, isLatest: false },
  ] },
  { id: "sf-2", name: "Pro License", amount: "99.00", period: "Monthly", versions: [
    { id: "sf-2-v1", label: nowLabel(), createdAt: Date.now(), isLatest: true },
  ] },
  { id: "sf-3", name: "AI Model Base Fee", amount: "80.00", period: "Monthly", versions: [
    { id: "sf-3-v3", label: nowLabel(), createdAt: Date.now(), isLatest: true },
    { id: "sf-3-v2", label: "Dec 20, 2023, 9:00 AM", createdAt: 1703062800000, isLatest: false },
    { id: "sf-3-v1", label: "Sep 1, 2023, 10:00 AM", createdAt: 1693562400000, isLatest: false },
  ] },
  { id: "sf-4", name: "Premium membership", amount: "10.00", period: "Monthly", versions: [
    { id: "sf-4-v1", label: nowLabel(), createdAt: Date.now(), isLatest: true },
  ] },
  { id: "sf-5", name: "SAAS Fee", amount: "3,200.00", period: "Annually", versions: [
    { id: "sf-5-v2", label: nowLabel(), createdAt: Date.now(), isLatest: true },
    { id: "sf-5-v1", label: "Jul 1, 2023, 9:00 AM", createdAt: 1688202000000, isLatest: false },
  ] },
]

export const SIMULATED_CREDIT_GRANTS: SimulatedCreditGrant[] = [
  { id: "cg-1", name: "Monthly API Credits", amount: "50.00", period: "Monthly", versions: [
    { id: "cg-1-v2", label: nowLabel(), createdAt: Date.now(), isLatest: true },
    { id: "cg-1-v1", label: "Oct 15, 2023, 2:00 PM", createdAt: 1697378400000, isLatest: false },
  ] },
  { id: "cg-2", name: "Annual Storage Credits", amount: "200.00", period: "Annually", versions: [
    { id: "cg-2-v1", label: nowLabel(), createdAt: Date.now(), isLatest: true },
  ] },
]
