/**
 * Formatting and parsing utility functions for ProductCatalogPage
 */

/**
 * Format an integer string with commas (e.g., "1000000" -> "1,000,000")
 * Avoids Number() to prevent precision issues for very large usage values.
 */
export function formatIntegerWithCommas(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, "")
  if (!digits) return "0"
  const reversed = digits.split("").reverse()
  const out: string[] = []
  for (let i = 0; i < reversed.length; i += 1) {
    if (i !== 0 && i % 3 === 0) out.push(",")
    out.push(reversed[i]!)
  }
  return out.reverse().join("")
}

/**
 * Parse a string value to a number, stripping non-numeric characters
 */
export function parseNumberValue(value: string): number {
  const cleaned = value.replace(/[^0-9.]/g, "")
  if (!cleaned) return 0
  return Number(cleaned)
}

/**
 * Format a number as currency
 */
export function formatCurrencyValue(
  value: number,
  currency: string,
  minimumFractionDigits = 2
): string {
  if (!Number.isFinite(value)) return `$0.00`
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits,
    maximumFractionDigits: Math.max(minimumFractionDigits, 4),
  }).format(value)
}

/**
 * Get a label for a plan field, with fallback
 */
export function getPlanLabel(value: string, fallback: string): string {
  return value.trim() ? value : fallback
}

/**
 * Get the billing label for a given period
 */
export function getBillingLabelForPeriod(period: string): string {
  const billingFrequencyMap: Record<string, string> = {
    Daily: "day",
    Weekly: "week",
    Monthly: "month",
    Yearly: "year",
    "Every 3 months": "3 months",
    "Every 6 months": "6 months",
  }
  return billingFrequencyMap[period] ?? period.toLowerCase()
}

/**
 * Get location label from currency code
 */
export function getLocationLabel(code: string): string {
  const map: Record<string, string> = {
    USD: "USA",
    EUR: "Europe",
    GBP: "United Kingdom",
    CAD: "Canada",
    AUD: "Australia",
    JPY: "Japan",
  }
  return map[code] ?? code
}

/**
 * State options by location for preview
 */
export const stateOptionsByLocation: Record<string, string[]> = {
  USA: ["Alaska", "California", "New York"],
  Europe: ["Ireland", "Germany", "France"],
  "United Kingdom": ["England", "Scotland", "Wales"],
  Canada: ["Ontario", "British Columbia", "Quebec"],
  Australia: ["New South Wales", "Victoria", "Queensland"],
  Japan: ["Tokyo", "Osaka", "Hokkaido"],
}

/**
 * Create a number formatter instance
 */
export function createNumberFormatter(): Intl.NumberFormat {
  return new Intl.NumberFormat("en-US")
}

/**
 * Create currency display names instance
 */
export function createCurrencyDisplayNames(): Intl.DisplayNames | null {
  try {
    return new Intl.DisplayNames(["en"], { type: "currency" })
  } catch {
    return null
  }
}

/**
 * Get all supported currency options
 */
export function getCurrencyOptions(): string[] {
  const intlWithSupportedValues = Intl as typeof Intl & {
    supportedValuesOf?: (input: string) => string[]
  }
  if (typeof intlWithSupportedValues.supportedValuesOf === "function") {
    return [...intlWithSupportedValues.supportedValuesOf("currency")].sort()
  }
  return ["USD", "EUR", "GBP", "JPY"].sort()
}
