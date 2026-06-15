export interface PlanTemplate {
  id: string
  name: string
  description: string
  defaultMonthlyPrice: number
  lines: { description: string; unitPrice: string; qty: number; serviceInterval: string; totalServicePeriods: number; amount: string }[]
}

export const planCatalog: PlanTemplate[] = [
  {
    id: "free",
    name: "Free plan",
    description: "Get started with core features at no cost.",
    defaultMonthlyPrice: 0,
    lines: [
      { description: "Free plan — per seat", unitPrice: "$0.00", qty: 1, serviceInterval: "Monthly", totalServicePeriods: 12, amount: "$0.00" },
    ],
  },
  {
    id: "startup",
    name: "Startup plan",
    description: "Run in production with room to grow and scale usage.",
    defaultMonthlyPrice: 50,
    lines: [
      { description: "Startup plan — per seat", unitPrice: "$50.00", qty: 1, serviceInterval: "Monthly", totalServicePeriods: 12, amount: "$600.00" },
    ],
  },
  {
    id: "business",
    name: "Business plan",
    description: "Advanced controls and priority support for growing teams.",
    defaultMonthlyPrice: 150,
    lines: [
      { description: "Business plan — per seat", unitPrice: "$150.00", qty: 1, serviceInterval: "Monthly", totalServicePeriods: 12, amount: "$1,800.00" },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise plan",
    description: "Custom SLAs, dedicated support, and volume pricing.",
    defaultMonthlyPrice: 500,
    lines: [
      { description: "Enterprise plan — per seat", unitPrice: "$500.00", qty: 1, serviceInterval: "Monthly", totalServicePeriods: 12, amount: "$6,000.00" },
    ],
  },
  {
    id: "support-basic",
    name: "Basic Support",
    description: "Email support with 48-hour response time.",
    defaultMonthlyPrice: 99,
    lines: [
      { description: "Basic Support — flat rate", unitPrice: "$99.00", qty: 1, serviceInterval: "Monthly", totalServicePeriods: 12, amount: "$1,188.00" },
    ],
  },
  {
    id: "support-premium",
    name: "Premium Support",
    description: "24/7 priority support with a dedicated account manager.",
    defaultMonthlyPrice: 499,
    lines: [
      { description: "Premium Support — flat rate", unitPrice: "$499.00", qty: 1, serviceInterval: "Monthly", totalServicePeriods: 12, amount: "$5,988.00" },
    ],
  },
  {
    id: "storage-addon",
    name: "Storage Add-on",
    description: "Additional 100 GB cloud storage.",
    defaultMonthlyPrice: 25,
    lines: [
      { description: "Storage Add-on (100 GB) — flat rate", unitPrice: "$25.00", qty: 1, serviceInterval: "Monthly", totalServicePeriods: 12, amount: "$300.00" },
    ],
  },
  {
    id: "analytics",
    name: "Analytics Dashboard",
    description: "Advanced usage analytics and reporting.",
    defaultMonthlyPrice: 149,
    lines: [
      { description: "Analytics Dashboard — flat rate", unitPrice: "$149.00", qty: 1, serviceInterval: "Monthly", totalServicePeriods: 12, amount: "$1,788.00" },
    ],
  },
  {
    id: "enterprise-seats",
    name: "Enterprise Seats",
    description: "Per-seat enterprise licensing with volume pricing.",
    defaultMonthlyPrice: 200,
    lines: [
      { description: "Enterprise Seats — per seat", unitPrice: "$200.00", qty: 1, serviceInterval: "Monthly", totalServicePeriods: 12, amount: "$2,400.00" },
    ],
  },
  {
    id: "edge-storage",
    name: "Edge Storage Units",
    description: "Distributed edge storage billed per unit.",
    defaultMonthlyPrice: 150,
    lines: [
      { description: "Edge Storage Units — per unit", unitPrice: "$150.00", qty: 1, serviceInterval: "Monthly", totalServicePeriods: 12, amount: "$1,800.00" },
    ],
  },
]
