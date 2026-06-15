'use client'

export function inferRateCardNameFromRate(rateName: string) {
  const normalized = rateName.trim().toLowerCase()
  if (!normalized) return null
  if (normalized.includes("gemini") || normalized.includes("google")) return "Google AI Models"
  if (normalized.startsWith("gpt") || normalized.includes("openai") || normalized.startsWith("o1")) {
    return "OpenAI Models"
  }
  if (normalized.includes("claude") || normalized.includes("anthropic")) return "Anthropic Models"
  return null
}

export function isAiModelRateName(value: string) {
  const normalized = value.trim().toLowerCase()
  if (!normalized) return false
  return (
    normalized.includes("gpt") ||
    normalized.startsWith("o1") ||
    normalized.startsWith("o3") ||
    normalized.includes("claude") ||
    normalized.includes("gemini") ||
    normalized.includes("palm") ||
    normalized.includes("openai") ||
    normalized.includes("anthropic") ||
    normalized.includes("google")
  )
}

export function getAiModelSeedPricing(value: string) {
  const normalized = value.trim().toLowerCase()
  const isPremium =
    normalized.includes("gpt-4") ||
    normalized.includes("gpt-4o") ||
    normalized.includes("gpt-4.1") ||
    normalized.startsWith("o1") ||
    normalized.startsWith("o3") ||
    normalized.includes("opus") ||
    normalized.includes("sonnet") ||
    normalized.includes("ultra") ||
    // Treat "pro" as premium unless it's explicitly a "mini"/"flash" variant
    (normalized.includes("pro") && !normalized.includes("mini") && !normalized.includes("flash"))
  const isMid = normalized.includes("mini") || normalized.includes("flash") || normalized.includes("haiku")
  if (isPremium) return { unitPrices: ["0.03", "0.02", "0.015", "0.012"], flatFeeTier0: "5.00" }
  if (isMid) return { unitPrices: ["0.01", "0.008", "0.006", "0.005"], flatFeeTier0: "2.00" }
  return { unitPrices: ["0.002", "0.001", "0.0008", "0.0005"], flatFeeTier0: "1.00" }
}


