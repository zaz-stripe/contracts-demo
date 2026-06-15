'use client'

import type { AssistantAction } from "@/components/ProductAssistantPanel"
import type { PlanRateCard, PriceSummary } from "@/components/product-catalog/productCatalogPage.types"
import { getNumberValue, getStringValue } from "@/components/product-catalog/assistant/assistantValueParsing"

export function resolvePriceId(opts: {
  action: AssistantAction
  collapsedPrices: PriceSummary[]
  priceNamesById: Record<number, string>
  getPriceLabel: (price: PriceSummary | null) => string
  activeTreePriceId: number | null
}) {
  const { action, collapsedPrices, priceNamesById, getPriceLabel, activeTreePriceId } = opts

  const id = getNumberValue(action.priceId)
  if (id != null && collapsedPrices.some((price) => price.id === id)) return { id }

  const name = getStringValue(action.priceName ?? action.priceLabel ?? action.name)
  if (name) {
    const needle = name.toLowerCase()
    const matches = collapsedPrices.filter((price) => {
      const customName = (priceNamesById[price.id] ?? "").trim().toLowerCase()
      const label = getPriceLabel(price).trim().toLowerCase()
      return customName === needle || label === needle
    })
    if (matches.length === 1) return { id: matches[0]!.id }
    if (matches.length > 1) return { id: null, error: `Multiple prices match "${name}".` as const }
  }

  if (activeTreePriceId != null) return { id: activeTreePriceId }
  if (collapsedPrices.length) return { id: collapsedPrices[collapsedPrices.length - 1]!.id }
  return { id: null, error: "No price available to edit." as const }
}

export function resolveRateCardId(opts: {
  action: AssistantAction
  getRateCards: () => PlanRateCard[]
  createdRateCards?: Map<string, number>
  fallbackRateCardId?: number | null
  activePlanRateCardId: number | null
}) {
  const { action, getRateCards, createdRateCards, fallbackRateCardId, activePlanRateCardId } = opts

  const rateCards = getRateCards()
  const id = getNumberValue(action.rateCardId)
  if (id != null && rateCards.some((card) => card.id === id)) return { id }

  const name = getStringValue(action.rateCardName ?? action.rateCardLabel ?? action.name)
  if (name) {
    const needle = name.toLowerCase()
    const cached = createdRateCards?.get(needle)
    if (cached != null) return { id: cached }

    const matches = rateCards.filter((card) => card.name.trim().toLowerCase() === needle)
    if (matches.length === 1) return { id: matches[0]!.id }
    if (matches.length > 1) return { id: null, error: `Multiple rate cards match "${name}".` as const }
    return { id: null, error: `No rate card found named "${name}".` as const }
  }

  if (fallbackRateCardId != null) return { id: fallbackRateCardId }
  if (rateCards.length) return { id: activePlanRateCardId ?? rateCards[0]!.id }
  return { id: null, error: "No rate card available." as const }
}

export function resolveRateId(opts: {
  action: AssistantAction
  getRateCards: () => PlanRateCard[]
  fallbackRateId?: number | null
}) {
  const { action, getRateCards, fallbackRateId } = opts
  const rateCards = getRateCards()

  const id = getNumberValue(action.rateId)
  if (id != null) {
    const exists = rateCards.some((card) => card.rates.some((rate) => rate.id === id))
    if (exists) return { id }
    // ID was provided but not found - return error (don't fall through to name check)
    return { id: null, error: `Rate with ID ${id} not found.` as const }
  }

  const name = getStringValue(action.rateName ?? action.rateLabel ?? action.name)
  // If a rate is currently focused, allow actions to omit rateName/rateId.
  if (!name) {
    if (fallbackRateId != null) return { id: fallbackRateId }
    return { id: null, error: "Rate ID or name is required." as const }
  }
  const needle = name.toLowerCase()
  const isPlaceholderLabel = needle.startsWith("untitled")

  const matches: { id: number; cardId: number }[] = []
  rateCards.forEach((card) => {
    card.rates.forEach((rate) => {
      if (rate.name.trim().toLowerCase() === needle) {
        matches.push({ id: rate.id, cardId: card.id })
      }
    })
  })

  if (matches.length === 1) return { id: matches[0]!.id, cardId: matches[0]!.cardId }
  if (matches.length > 1) return { id: null, error: `Multiple rates match "${name}".` as const }
  // If the model tried to target a placeholder label like "Rate", prefer the focused rate id.
  if (fallbackRateId != null && isPlaceholderLabel) return { id: fallbackRateId }
  return { id: null, error: `No rate found named "${name}".` as const }
}

export function resolveCurrencyId(opts: {
  action: AssistantAction
  pricingCurrencies: { id: number; code: string }[]
  activeCurrencyId: number | null
}) {
  const { action, pricingCurrencies, activeCurrencyId } = opts
  const id = getNumberValue(action.currencyId)
  if (id != null && pricingCurrencies.some((currency) => currency.id === id)) return { id }
  const code = getStringValue(action.currencyCode ?? action.currency ?? action.code ?? action.value)
  if (code) {
    const match = pricingCurrencies.find((currency) => currency.code.trim().toLowerCase() === code.toLowerCase())
    if (match) return { id: match.id }
    return { id: null, error: `No currency found for "${code}".` as const }
  }
  const index = getNumberValue(action.index)
  if (index != null && pricingCurrencies[index]) return { id: pricingCurrencies[index]!.id }
  if (activeCurrencyId != null) return { id: activeCurrencyId }
  if (pricingCurrencies.length) return { id: pricingCurrencies[0]!.id }
  return { id: null, error: "No currency available." as const }
}

export function resolveTierId(opts: {
  action: AssistantAction
  tiers: number[]
}) {
  const { action, tiers } = opts
  const id = getNumberValue(action.tierId)
  if (id != null && tiers.includes(id)) return { id }
  const index = getNumberValue(action.tierIndex)
  if (index != null) {
    const tierId = tiers[index]
    if (tierId != null) return { id: tierId }
    return { id: null, error: `No tier found at index ${index}.` as const }
  }
  return { id: null, error: "Tier id or index is missing." as const }
}

export function resolvePlanRateTierId(opts: {
  rateId: number
  action: AssistantAction
  planRateTiers: Record<number, number[]>
}) {
  const { rateId, action, planRateTiers } = opts
  const tierIds = planRateTiers[rateId] ?? [0, 1]
  const id = getNumberValue(action.tierId)
  // First try tierId as an actual tier ID
  if (id != null && tierIds.includes(id)) return { id }
  // Then check for explicit tierIndex
  const index = getNumberValue(action.tierIndex)
  if (index != null) {
    const tierId = tierIds[index]
    if (tierId != null) return { id: tierId }
    return { id: null, error: `No tier found at index ${index}.` as const }
  }
  // Fallback: try tierId as an index (AI often sends tier index as tierId)
  if (id != null && id >= 0 && id < tierIds.length) {
    return { id: tierIds[id]! }
  }
  return { id: null, error: "Tier id or index is missing." as const }
}

export function resolvePlanRateCurrencyId(opts: {
  rateId: number
  action: AssistantAction
  planRateCurrencies: Record<number, { id: number; code: string }[]>
  planCurrency: string
  planRateActiveCurrencyId: Record<number, number>
}) {
  const { rateId, action, planRateCurrencies, planCurrency, planRateActiveCurrencyId } = opts
  const currencies = planRateCurrencies[rateId] ?? [{ id: 0, code: planCurrency }]
  const id = getNumberValue(action.currencyId)
  if (id != null && currencies.some((currency) => currency.id === id)) return { id }
  const code = getStringValue(action.currencyCode ?? action.currency ?? action.code ?? action.value)
  if (code) {
    const match = currencies.find((currency) => currency.code.trim().toLowerCase() === code.toLowerCase())
    if (match) return { id: match.id }
    return { id: null, error: `No currency found for "${code}".` as const }
  }
  const index = getNumberValue(action.index)
  if (index != null && currencies[index]) return { id: currencies[index]!.id }
  const activeId = planRateActiveCurrencyId[rateId]
  if (activeId != null) return { id: activeId }
  if (currencies.length) return { id: currencies[0]!.id }
  return { id: null, error: "No currency available." as const }
}

export function resolveRowId(opts: {
  rows: number[]
  action: AssistantAction
  label: string
}) {
  const { rows, action, label } = opts
  const id = getNumberValue(action.rowId)
  if (id != null && rows.includes(id)) return { id }
  const index = getNumberValue(action.rowIndex)
  if (index != null) {
    const rowId = rows[index]
    if (rowId != null) return { id: rowId }
    return { id: null, error: `No ${label} row at index ${index}.` as const }
  }
  if (rows.length) return { id: rows[rows.length - 1]! }
  return { id: null, error: `No ${label} rows available.` as const }
}


