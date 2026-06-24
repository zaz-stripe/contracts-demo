export type PlanLine = {
  id: string
  product: string
  price: number
  qty: number
  startDate: string
  endDate: string
}

export type ContractState = {
  customer: { name: string; email: string }
  currency: string
  startDate: string
  endDate: string
  planLines: PlanLine[]
  discount: number
}

export type AIVariant =
  | "inline-ghosting"
  | "command-bar"
  | "side-panel-chat"
  | "guided-negotiation"
  | "console-panel"

export const VARIANTS: {
  id: AIVariant
  label: string
  description: string
  badge?: string
}[] = [
  {
    id: "inline-ghosting",
    label: "Inline ghosting",
    description: "Copilot-style ghost text as you type",
    badge: "V1",
  },
  {
    id: "command-bar",
    label: "Command bar",
    description: "⌘K natural language command palette",
    badge: "V2",
  },
  {
    id: "side-panel-chat",
    label: "Side panel chat",
    description: "Contract-aware assistant panel",
    badge: "V3",
  },
  {
    id: "guided-negotiation",
    label: "Guided negotiation",
    description: "Step-by-step AI deal reviewer",
    badge: "V4",
  },
  {
    id: "console-panel",
    label: "Console",
    description: "Live JSON state + prompt console",
    badge: "V5",
  },
]

export const DEFAULT_STATE: ContractState = {
  customer: { name: "", email: "" },
  currency: "USD",
  startDate: "2026-01-01",
  endDate: "2026-12-31",
  planLines: [
    {
      id: "line-1",
      product: "Enterprise Plan",
      price: 5000,
      qty: 1,
      startDate: "2026-01-01",
      endDate: "2026-12-31",
    },
  ],
  discount: 0,
}

export const PRODUCTS = [
  "Enterprise Plan",
  "Growth Plan",
  "Starter Plan",
  "API Add-on",
  "Support Package",
  "Professional Services",
]

export const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "AUD", "CAD"]

export function monthsBetween(start: string, end: string): number {
  const s = new Date(start)
  const e = new Date(end)
  return Math.max(1, (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()))
}

export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function contractTotal(state: ContractState): number {
  const gross = state.planLines.reduce((sum, l) => {
    return sum + l.price * l.qty * monthsBetween(l.startDate, l.endDate)
  }, 0)
  return gross * (1 - state.discount / 100)
}

export async function chatJSON<T>(
  systemPrompt: string,
  userMessage: string,
  fallback: T
): Promise<T> {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    })
    const data = await res.json()
    const content = data.content ?? ""
    return JSON.parse(content) as T
  } catch {
    return fallback
  }
}
