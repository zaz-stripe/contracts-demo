export type Customer = {
  id: number
  name: string
  email: string
  country: string
  createdAt: string
  totalSpend: string
}

export const CUSTOMERS: Customer[] = [
  { id: 1, name: "Acme Corp", email: "billing@example.com", country: "United States", createdAt: "2026-01-15", totalSpend: "$12,400" },
  { id: 2, name: "Globex Inc", email: "finance@example.com", country: "United Kingdom", createdAt: "2026-02-03", totalSpend: "$8,750" },
  { id: 3, name: "Initech LLC", email: "accounts@example.com", country: "United States", createdAt: "2026-02-20", totalSpend: "$3,200" },
  { id: 4, name: "Umbrella Co", email: "billing@example.com", country: "Germany", createdAt: "2026-03-01", totalSpend: "$6,100" },
  { id: 5, name: "Stark Industries", email: "ap@example.com", country: "United States", createdAt: "2026-03-10", totalSpend: "$24,800" },
  { id: 6, name: "Wayne Enterprises", email: "finance@example.com", country: "United States", createdAt: "2026-01-08", totalSpend: "$18,300" },
  { id: 7, name: "Wonka Industries", email: "billing@example.com", country: "Switzerland", createdAt: "2026-04-15", totalSpend: "$4,600" },
  { id: 8, name: "Pied Piper", email: "team@example.com", country: "United States", createdAt: "2026-05-01", totalSpend: "$1,900" },
]
