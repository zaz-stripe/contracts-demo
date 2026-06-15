'use client'

import type { AssistantAction } from "@/components/ProductAssistantPanel"
import { getStringValue } from "@/components/product-catalog/assistant/assistantValueParsing"

export type PlanRateAddDraftState = {
  createdRateCards: Map<string, number>
  getDefaultRateCardId: () => number
  setDefaultRateCardId: (next: number) => void
  allocateNextRateCardId: () => number
}

export type ApplyPlanRateAddAssistantCtx = {
  planName: string
  setPlanName: (next: string) => void

  inferRateCardNameFromRate: (rateName: string) => string | null

  resolveRateCardId: (
    action: AssistantAction,
    createdRateCards: Map<string, number>,
    fallbackRateCardId: number
  ) => { id: number | null; error?: string }

  getDraftPlanRateCards: () => { id: number; name: string; rates: { id: number; name: string }[] }[]
  addPlanRateCardWithName: (name: string, id: number) => void
  updateRateCardName: (id: number, name: string) => void
  updateDraftPlanRateCards: (updater: (prev: { id: number; name: string; rates: { id: number; name: string }[] }[]) => any) => void

  addPlanRatesToCard: (rateCardId: number, names: string[], allowReuseEmptyRate?: boolean) => void
  applyPlanRateNamesToDraft: (
    prev: { id: number; name: string; rates: { id: number; name: string }[] }[],
    rateCardId: number,
    names: string[],
    allowReuseEmptyRate?: boolean
  ) => any
}

export function applyPlanRateAddAssistantAction(opts: {
  type: string
  action: AssistantAction
  ctx: ApplyPlanRateAddAssistantCtx
  draft: PlanRateAddDraftState
}): { handled: boolean; applied: number; error?: string } {
  const { type, action, ctx, draft } = opts

  if (type !== "add_plan_rate" && type !== "add_plan_rates") return { handled: false, applied: 0 }

  if (type === "add_plan_rate") {
    const name = getStringValue(action.name)
    const inferredRateCardName = getStringValue(action.rateCardName) || ctx.inferRateCardNameFromRate(name) || ""
    const resolved = ctx.resolveRateCardId(
      { ...action, rateCardName: inferredRateCardName || undefined },
      draft.createdRateCards,
      draft.getDefaultRateCardId()
    )
    let rateCardId = resolved.id
    if (rateCardId == null) {
      const fallbackName = inferredRateCardName || getStringValue(action.rateCardName ?? action.rateCardLabel)
      if (fallbackName) {
        rateCardId = draft.allocateNextRateCardId()
        draft.createdRateCards.set(fallbackName.toLowerCase(), rateCardId)
        ctx.addPlanRateCardWithName(fallbackName, rateCardId)
        ctx.updateDraftPlanRateCards((prev) => [...prev, { id: rateCardId!, name: fallbackName.trim(), rates: [] }])
        draft.setDefaultRateCardId(rateCardId)
      }
    }
    if (rateCardId == null) {
      return { handled: true, applied: 0, error: resolved.error ?? "Could not find rate card to add a rate." }
    }
    if (ctx.planName.trim() === "") {
      ctx.setPlanName("AI Model Pricing")
    }
    ctx.addPlanRatesToCard(rateCardId, [name || ""], true)
    ctx.updateDraftPlanRateCards((prev) => ctx.applyPlanRateNamesToDraft(prev, rateCardId!, [name || ""], true))
    return { handled: true, applied: 1 }
  }

  // add_plan_rates
  const names = Array.isArray(action.names) ? action.names.map((entry) => String(entry)) : []
  const explicitRateCardName = getStringValue(action.rateCardName)

  // Group rates by their inferred rate card name (or explicit name if provided)
  const ratesByCard = new Map<string, string[]>()
  for (const name of names) {
    const cardName = explicitRateCardName || ctx.inferRateCardNameFromRate(name) || ""
    const existing = ratesByCard.get(cardName) ?? []
    existing.push(name)
    ratesByCard.set(cardName, existing)
  }

  if (ctx.planName.trim() === "") {
    ctx.setPlanName("AI Model Pricing")
  }

  let totalApplied = 0
  let usedEmptyCard = false

  // Process each group of rates
  for (const [groupCardName, groupNames] of Array.from(ratesByCard.entries())) {
    const resolved = ctx.resolveRateCardId(
      { ...action, rateCardName: groupCardName || undefined },
      draft.createdRateCards,
      draft.getDefaultRateCardId()
    )
    let rateCardId = resolved.id

    // If we couldn't find the rate card by name, try to reuse an empty card or create new
    if (rateCardId == null) {
      const fallbackName = groupCardName || getStringValue(action.rateCardLabel)
      if (fallbackName) {
        // Try to reuse an empty rate card (only once)
        if (!usedEmptyCard) {
          const emptyCard = ctx.getDraftPlanRateCards().find(
            (card) => card.name.trim() === "" && card.rates.every((rate) => rate.name.trim() === "")
          )
          if (emptyCard) {
            rateCardId = emptyCard.id
            usedEmptyCard = true
            draft.createdRateCards.set(fallbackName.toLowerCase(), emptyCard.id)
            ctx.updateRateCardName(emptyCard.id, fallbackName)
            ctx.updateDraftPlanRateCards((prev) =>
              prev.map((card) => (card.id === emptyCard.id ? { ...card, name: fallbackName.trim() } : card))
            )
            draft.setDefaultRateCardId(emptyCard.id)
          }
        }
        // If no empty card or already used, create a new one
        if (rateCardId == null) {
          rateCardId = draft.allocateNextRateCardId()
          draft.createdRateCards.set(fallbackName.toLowerCase(), rateCardId)
          ctx.addPlanRateCardWithName(fallbackName, rateCardId)
          ctx.updateDraftPlanRateCards((prev) => [...prev, { id: rateCardId!, name: fallbackName.trim(), rates: [] }])
          draft.setDefaultRateCardId(rateCardId)
        }
      }
    }
    if (rateCardId == null) {
      continue // Skip this group if we can't find/create a rate card
    }
    ctx.addPlanRatesToCard(rateCardId, groupNames, !usedEmptyCard || totalApplied > 0)
    ctx.updateDraftPlanRateCards((prev) => ctx.applyPlanRateNamesToDraft(prev, rateCardId!, groupNames, !usedEmptyCard || totalApplied > 0))
    totalApplied++
  }

  if (totalApplied === 0) {
    return { handled: true, applied: 0, error: "Could not find rate card to add rates." }
  }
  return { handled: true, applied: totalApplied }
}


