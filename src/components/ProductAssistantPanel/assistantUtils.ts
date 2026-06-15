/**
 * Utility functions for the Product Assistant Panel
 */

import type { AssistantAction, AssistantContext, MentionableObject } from "./assistantTypes"

// Counter for unique message IDs (prevents React key collisions when messages are created rapidly)
let messageIdCounter = 0

export function nextMessageId(): number {
  return Date.now() * 1000 + (messageIdCounter++ % 1000)
}

/**
 * Select the model for the request.
 * Using gpt-4o for speed - gpt-5-mini was accurate but slow.
 */
export function selectModel(): string {
  console.log(`[Model] Using gpt-4o`)
  return "gpt-4o"
}

/**
 * Extract mentionable objects from context for @ mention dropdown
 */
export function getMentionableObjects(context: AssistantContext | undefined): MentionableObject[] {
  if (!context) return []
  const objects: MentionableObject[] = []

  if (context.mode === "plan") {
    // Plan itself - always show even if unnamed
    objects.push({ kind: "plan", label: context.plan?.name || "Pricing plan", category: "existing" })

    // Rate cards and rates
    if (context.rateCards) {
      for (const card of context.rateCards) {
        objects.push({ kind: "rateCard", label: card.name || "Price group", id: card.id, category: "existing" })
        for (const rate of card.rates) {
          objects.push({ kind: "rate", label: rate.name || "Price", id: rate.id, category: "existing" })
        }
      }
    }

    // Credit grants
    if (context.creditGrants) {
      for (const cg of context.creditGrants) {
        objects.push({ kind: "creditGrant", label: cg.name || "Credit grant", id: cg.id, category: "existing" })
      }
    }

    // Subscription fees
    if (context.subscriptionFees) {
      for (const lf of context.subscriptionFees) {
        objects.push({ kind: "subscriptionFee", label: lf.name || "Subscription fee", id: lf.id, category: "existing" })
      }
    }
  } else {
    // Product mode
    if (context.product) {
      objects.push({ kind: "product", label: context.product.name || "Product", category: "existing" })
    }

    // Prices
    if (context.prices) {
      for (const price of context.prices) {
        objects.push({ kind: "price", label: price.label || "Price", id: price.id, category: "existing" })
      }
    }

    // Meter
    if (context.meterBuilder?.name) {
      objects.push({ kind: "meter", label: context.meterBuilder.name || "Meter", category: "existing" })
    }
  }

  return objects
}

// Map action types to user-friendly names
const actionFriendlyNames: Record<string, string> = {
  // Plan-level actions
  set_plan_name: "set plan name",
  set_plan_description: "set description",
  set_plan_currency: "set currency",
  set_plan_lookup_key: "set lookup key",
  set_plan_tax_treatment: "set tax treatment",
  // Rate card actions
  add_plan_rate_card: "add rate card",
  rename_plan_rate_card: "rename rate card",
  remove_empty_rate_cards: "remove empty cards",
  // Rate actions
  add_plan_rate: "add rate",
  add_plan_rates: "add rates",
  rename_plan_rate: "rename rate",
  set_plan_rate_meter: "set meter",
  set_plan_rate_price_type: "set price type",
  set_plan_rate_sell_as: "set sell as",
  set_plan_rate_unit_price: "set unit price",
  set_plan_rate_unit_label: "set unit label",
  set_plan_rate_tax_code: "set tax code",
  set_plan_rate_include_tax: "set tax behavior",
  // Tier actions
  add_plan_rate_tier: "add tier",
  remove_plan_rate_tier: "remove tier",
  set_plan_rate_tier_to: "set tier range",
  set_plan_rate_tier_unit_price: "set tier price",
  set_plan_rate_tier_flat_fee: "set tier flat fee",
  setup_graduated_tiers: "set up graduated tiers",
  setup_graduated_tiers_for_all_rates: "set up graduated tiers for all rates",
  // Currency actions
  add_plan_rate_currency: "add currency",
  remove_plan_rate_currency: "remove currency",
  set_plan_rate_currency_code: "set currency",
  set_plan_rate_active_currency: "select currency",
  // Credit grant actions
  add_plan_credit_grant: "add credit grant",
  rename_plan_credit_grant: "rename credit grant",
  set_plan_credit_grant_amount: "set credit amount",
  set_plan_credit_grant_period: "set credit period",
  // Subscription fee actions
  add_plan_subscription_fee: "add subscription fee",
  rename_plan_subscription_fee: "rename subscription fee",
  set_plan_subscription_fee_amount: "set fee amount",
  // Product actions
  set_product_name: "set product name",
  set_product_description: "set description",
  set_lookup_key: "set lookup key",
  set_charge_frequency: "set charge frequency",
  set_pricing_model: "set pricing model",
  set_billing_period: "set billing period",
  add_currency: "add currency",
  set_currency_amount: "set amount",
  add_tier: "add tier",
  set_tier_to: "set tier range",
  set_tier_unit_price: "set tier price",
  set_tier_flat_fee: "set tier flat fee",
}

export function getFriendlyActionName(type: string): string {
  return actionFriendlyNames[type] ?? type.replace(/_/g, " ").replace(/^(set|add|remove) plan (rate )?/, "")
}

/** Count total number of actual changes (e.g., rates in add_plan_rates) */
export function countTotalChanges(actions: AssistantAction[]): number {
  let total = 0
  for (const a of actions) {
    if (a.type === "add_plan_rates" && Array.isArray(a.names)) {
      total += (a.names as string[]).length
    } else {
      total += 1
    }
  }
  return total
}

export function summarizeActions(actions: AssistantAction[]): string | null {
  if (!actions.length) return null
  const counts = new Map<string, number>()
  for (const a of actions) {
    const t = typeof a.type === "string" ? a.type : ""
    if (!t) continue
    counts.set(t, (counts.get(t) ?? 0) + 1)
  }
  const has = (type: string) => (counts.get(type) ?? 0) > 0
  const count = (type: string) => counts.get(type) ?? 0
  const parts: string[] = []

  // Group related actions into summaries
  if (has("rename_plan_rate_card")) parts.push("rename rate card")
  if (has("rename_plan_rate")) parts.push("rename rate")
  if (has("set_plan_name")) parts.push("rename plan")
  if (has("add_plan_rate_currency") || has("set_plan_rate_currency_code") || has("set_plan_rate_active_currency")) parts.push("update currency")
  if (has("set_plan_rate_tier_unit_price") || has("set_plan_rate_tier_flat_fee") || has("set_plan_rate_unit_price")) parts.push("update pricing")
  // Count rates being added
  const rateAddCount = count("add_plan_rate") + actions
    .filter(a => a.type === "add_plan_rates" && Array.isArray(a.names))
    .reduce((sum, a) => sum + (a.names as string[]).length, 0)
  if (rateAddCount > 0) {
    parts.push(rateAddCount === 1 ? "add rate" : `add ${rateAddCount} rates`)
  }
  // Count rate cards being added
  const rateCardAddCount = count("add_plan_rate_card")
  if (rateCardAddCount > 0) {
    parts.push(rateCardAddCount === 1 ? "add rate card" : `add ${rateCardAddCount} rate cards`)
  }

  // Add tier-related summaries
  const tierAddCount = count("add_plan_rate_tier") + count("add_tier")
  if (tierAddCount > 0) parts.push(tierAddCount === 1 ? "add tier" : `add ${tierAddCount} tiers`)

  const tierRangeCount = count("set_plan_rate_tier_to") + count("set_tier_to")
  if (tierRangeCount > 0 && !parts.some(p => p.includes("pricing"))) parts.push("set tier ranges")

  if (has("set_plan_rate_price_type") || has("set_pricing_model")) parts.push("set price type")

  // If we didn't recognize anything, fall back to showing top action types with friendly names.
  if (parts.length === 0) {
    const top = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([t, n]) => {
        const friendly = getFriendlyActionName(t)
        return n === 1 ? friendly : `${friendly} x${n}`
      })
    return top.length ? top.join(", ") : null
  }

  return parts.slice(0, 3).join(", ")
}

/**
 * Prune context to only include relevant data based on focus
 * This dramatically reduces token count for focused operations
 */
export function pruneContext(context: AssistantContext | undefined): Record<string, unknown> {
  if (!context) return {}

  const focus = context.focus
  const mode = context.mode

  // Always include basic info
  const pruned: Record<string, unknown> = { mode }

  if (mode === "product") {
    // Product mode: include product, price, and meter state
    if (context.product) pruned.product = context.product
    if (context.productMetadata?.rows?.length) pruned.productMetadata = context.productMetadata
    if (context.productFeatures?.rows?.length) pruned.productFeatures = context.productFeatures
    if (context.priceDraft) pruned.priceDraft = context.priceDraft
    if (context.tierDraft?.tiers?.length) pruned.tierDraft = context.tierDraft
    if (context.meterBuilder) pruned.meterBuilder = context.meterBuilder
    if (context.prices?.length) pruned.prices = context.prices
    return pruned
  }

  // Plan mode: prune based on focus
  pruned.focus = focus
  if (context.plan) pruned.plan = context.plan

  if (!focus) {
    // No focus - include rate card structure overview only
    if (context.rateCards) {
      pruned.rateCards = context.rateCards.map(rc => ({
        id: rc.id,
        name: rc.name,
        rateCount: rc.rates.length,
        rates: rc.rates.slice(0, 5).map(r => ({ id: r.id, name: r.name }))
      }))
    }
    return pruned
  }

  // Focused on a specific object - include only relevant data
  const focusKind = focus.kind
  const focusId = focus.id

  if (focusKind === "rate" && typeof focusId === "number") {
    // Find the rate card containing this rate
    const rateCard = context.rateCards?.find(rc => rc.rates.some(r => r.id === focusId))
    if (rateCard) {
      pruned.rateCard = { id: rateCard.id, name: rateCard.name }
      pruned.rate = rateCard.rates.find(r => r.id === focusId)
    }
    // Include pricing data for this rate
    if (context.planRatePricing?.tiers?.[focusId]) {
      pruned.ratePricing = {
        tiers: context.planRatePricing.tiers[focusId],
        tierToValues: context.planRatePricing.tierToValues?.[focusId],
        tierUnitPrices: context.planRatePricing.tierUnitPrices?.[focusId],
        tierFlatFees: context.planRatePricing.tierFlatFees?.[focusId],
        currencies: context.planRatePricing.currencies?.[focusId],
        activeCurrencyId: context.planRatePricing.activeCurrencyId?.[focusId],
      }
    }
    if (context.planRateUnitPrices?.[focusId]) pruned.unitPrice = context.planRateUnitPrices[focusId]
    if (context.ratePriceTypes?.[focusId]) pruned.priceType = context.ratePriceTypes[focusId]
    if (context.rateSellAs?.[focusId]) pruned.sellAs = context.rateSellAs[focusId]
    if (context.rateMeters?.[focusId]) pruned.meter = context.rateMeters[focusId]
  } else if (focusKind === "rateCard" && typeof focusId === "number") {
    const rateCard = context.rateCards?.find(rc => rc.id === focusId)
    if (rateCard) {
      pruned.rateCard = rateCard
      pruned.lookupKey = context.rateCardLookupKeys?.[focusId]
      pruned.servicingPeriod = context.rateCardServicingPeriods?.[focusId]
    }
  } else if (focusKind === "creditGrant" && typeof focusId === "number") {
    pruned.creditGrant = context.creditGrants?.find(cg => cg.id === focusId)
    pruned.amount = context.creditGrantAmounts?.[focusId]
    pruned.period = context.creditGrantPeriods?.[focusId]
    pruned.application = context.creditGrantApplications?.[focusId]
  } else if (focusKind === "subscriptionFee" && typeof focusId === "number") {
    pruned.subscriptionFee = context.subscriptionFees?.find(lf => lf.id === focusId)
    pruned.amount = context.subscriptionFeeAmounts?.[focusId]
    pruned.period = context.subscriptionFeePeriods?.[focusId]
  } else {
    // Plan-level focus or unknown - include overview
    if (context.rateCards) {
      pruned.rateCards = context.rateCards.map(rc => ({
        id: rc.id,
        name: rc.name,
        rates: rc.rates.map(r => ({ id: r.id, name: r.name }))
      }))
    }
    if (context.creditGrants?.length) pruned.creditGrants = context.creditGrants
    if (context.subscriptionFees?.length) pruned.subscriptionFees = context.subscriptionFees
  }

  return pruned
}

// Fix common action type typos/truncations from the LLM
export function fixActionTypeTypos(type: string): string {
  const typoMap: Record<string, string> = {
    // Common truncations/typos for tier-related actions
    "set_plan_raterice": "set_plan_rate_tier_unit_price",
    "set_plan_rate_tier_price": "set_plan_rate_tier_unit_price",
    "set_plan_rate_price": "set_plan_rate_tier_unit_price",
    "set_tier_unit_price": "set_plan_rate_tier_unit_price",
    "set_tier_flat_fee": "set_plan_rate_tier_flat_fee",
    "set_tier_to": "set_plan_rate_tier_to",
    // Severely truncated versions (AI sometimes drops middle of action type)
    "set_pr_to": "set_plan_rate_tier_to",
    "set_pr_unit_price": "set_plan_rate_tier_unit_price",
    "set_pr_flat_fee": "set_plan_rate_tier_flat_fee",
    "set_rate_to": "set_plan_rate_tier_to",
    "set_rate_unit_price": "set_plan_rate_tier_unit_price",
    "set_rate_flat_fee": "set_plan_rate_tier_flat_fee",
    "add_tier": "add_plan_rate_tier",
    "add_rate_tier": "add_plan_rate_tier",
    "add_pr_tier": "add_plan_rate_tier",
  }
  return typoMap[type] ?? type
}

// Parse actions from various formats the LLM might return
export function normalizeActions(rawActions: unknown): AssistantAction[] {
  if (!rawActions) return []
  if (!Array.isArray(rawActions)) return []

  return rawActions
    .map((item): AssistantAction | null => {
      if (!item || typeof item !== "object") return null

      // Standard format: { type: "action_type", ... }
      if (typeof (item as Record<string, unknown>).type === "string") {
        const action = item as AssistantAction
        return { ...action, type: fixActionTypeTypos(action.type) }
      }

      // Single-key format: { "action_type": { ...params } }
      const keys = Object.keys(item)
      if (keys.length === 1) {
        const actionType = fixActionTypeTypos(keys[0]!)
        const params = (item as Record<string, unknown>)[keys[0]!]
        if (params && typeof params === "object") {
          return { type: actionType, ...(params as Record<string, unknown>) }
        }
        const primitiveValue =
          typeof params === "string" || typeof params === "number" || typeof params === "boolean" ? params : undefined
        return primitiveValue === undefined ? ({ type: actionType } as AssistantAction) : ({ type: actionType, value: primitiveValue } as AssistantAction)
      }

      return null
    })
    .filter((action): action is AssistantAction => action !== null)
}

/**
 * Order actions so dependencies are satisfied:
 * 1. Plan-level actions (set_plan_name, etc.)
 * 2. Rate card creation (add_plan_rate_card, rename_plan_rate_card)
 * 3. Rate creation (add_plan_rate, add_plan_rates)
 * 4. Tier/currency creation (add_plan_rate_tier, add_plan_rate_currency) - must run before setting values
 * 5. Rate modifications (set_plan_rate_*, set_plan_rate_tier_*)
 * 6. Cleanup actions (remove_empty_rate_cards)
 *
 * Also auto-appends cleanup action when creating rate cards (to remove orphans)
 */
export function orderActions(actions: AssistantAction[]): AssistantAction[] {
  const getPriority = (action: AssistantAction): number => {
    const type = action.type
    // Plan-level actions first
    if (type === "set_plan_name" || type === "set_plan_description") return 0
    // Rate card creation/rename
    if (type === "add_plan_rate_card" || type === "rename_plan_rate_card") return 1
    // Rate creation
    if (type === "add_plan_rate" || type === "add_plan_rates") return 2
    // Tier and currency creation - must run before setting tier/currency values
    if (type === "add_plan_rate_tier" || type === "add_plan_rate_currency") return 3
    // Rate modifications (including tier value changes)
    if (type.startsWith("set_plan_rate_")) return 4
    // Cleanup last
    if (type === "remove_empty_rate_cards") return 9
    // Everything else in the middle
    return 5
  }

  return [...actions].sort((a, b) => getPriority(a) - getPriority(b))
}

/**
 * Compress conversation history to keep context manageable.
 * Keeps the last N messages as-is and summarizes older ones.
 */
export function compressConversationHistory(
  messages: { role: "user" | "assistant"; content: string }[],
  maxRecentMessages = 6
): { role: "user" | "assistant" | "system"; content: string }[] {
  if (messages.length <= maxRecentMessages) {
    return messages
  }

  // Split into old and recent
  const recentMessages = messages.slice(-maxRecentMessages)
  const oldMessages = messages.slice(0, -maxRecentMessages)

  // Summarize old messages
  const summary = oldMessages.map(m => {
    const prefix = m.role === "user" ? "User:" : "Assistant:"
    // Truncate long messages
    const content = m.content.length > 100 ? m.content.slice(0, 100) + "..." : m.content
    return `${prefix} ${content}`
  }).join("\n")

  const summaryMessage = {
    role: "system" as const,
    content: `[Earlier conversation summary]\n${summary}\n[End summary]`
  }

  return [summaryMessage, ...recentMessages]
}

/**
 * Helper to parse JSON content from AI response
 */
export function parseJsonContent(rawContent: string): { message?: string; actions?: unknown[]; suggestions?: string[] } | null {
  try {
    let jsonStr = rawContent.trim()
    if (jsonStr.startsWith("```json")) jsonStr = jsonStr.slice(7)
    else if (jsonStr.startsWith("```")) jsonStr = jsonStr.slice(3)
    if (jsonStr.endsWith("```")) jsonStr = jsonStr.slice(0, -3)
    return JSON.parse(jsonStr.trim())
  } catch {
    return null
  }
}
