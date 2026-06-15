'use client'

export function getStringValue(value: unknown) {
  if (typeof value === "string") return value.trim()
  if (typeof value === "number" && Number.isFinite(value)) return String(value)
  return ""
}

export function getNumberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

// Common aliases that AI might use for option values
const optionAliases: Record<string, string> = {
  // Price type aliases
  "flat": "fixed rate",
  "flat rate": "fixed rate",
  "fixed": "fixed rate",
  "tiered": "graduated",
  "per-unit": "fixed rate",
  "per unit": "fixed rate",
  // Servicing period aliases
  "annual": "annually",
  "yearly": "annually",
  "month": "monthly",
  // Sell as aliases
  "individual": "individual units",
  "group": "group of units",
  "bundle": "group of units",
  "package": "group of units",
}

export function resolveOption(value: string, options: string[]) {
  const normalized = value.trim().toLowerCase()
  if (!normalized) return null
  // Direct match
  const directMatch = options.find((option) => option.toLowerCase() === normalized)
  if (directMatch) return directMatch
  // Try alias
  const aliasTarget = optionAliases[normalized]
  if (aliasTarget) {
    return options.find((option) => option.toLowerCase() === aliasTarget) ?? null
  }
  return null
}


