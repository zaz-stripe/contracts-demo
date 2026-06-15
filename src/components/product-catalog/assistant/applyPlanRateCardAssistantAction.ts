'use client'

import type { AssistantAction } from "@/components/ProductAssistantPanel"
import { getStringValue, resolveOption } from "@/components/product-catalog/assistant/assistantValueParsing"
import type { PlanRateCard } from "@/components/product-catalog/productCatalogPage.types"

export type ApplyPlanRateCardAssistantCtx = {
  // plan state (for behavior like auto-default plan name)
  planName: string

  // option arrays
  servicingPeriodOptions: string[]

  // draft accessors (applyAssistantActions keeps a separate draft ref)
  getDraftPlanRateCards: () => PlanRateCard[]
  updateDraftPlanRateCards: (updater: (prev: PlanRateCard[]) => PlanRateCard[]) => void

  // rate card resolution
  resolveRateCardId: (
    action: AssistantAction,
    createdRateCards: Map<string, number>,
    fallbackRateCardId: number | null
  ) => { id: number | null; error?: string }

  // metadata helpers
  getMetadataRows: (map: Record<number, number[]>, id: number) => number[]
  resolveRowId: (rows: number[], action: AssistantAction, label: string) => { id: number | null; error?: string }
  addMetadataRow: (
    setter: React.Dispatch<React.SetStateAction<Record<number, number[]>>>,
    id: number,
    valueSetter?: React.Dispatch<
      React.SetStateAction<Record<number, Record<number, { key: string; value: string }>>>
    >
  ) => void
  removeMetadataRow: (
    setter: React.Dispatch<React.SetStateAction<Record<number, number[]>>>,
    id: number,
    rowId: number,
    valueSetter?: React.Dispatch<
      React.SetStateAction<Record<number, Record<number, { key: string; value: string }>>>
    >
  ) => void
  updatePlanMetadataValue: (
    setter: React.Dispatch<
      React.SetStateAction<Record<number, Record<number, { key: string; value: string }>>>
    >,
    id: number,
    rowId: number,
    patch: Partial<{ key: string; value: string }>
  ) => void

  // setters / handlers
  setPlanName: (next: string) => void
  setPlanDescription: (next: string) => void
  setPlanCurrency: (next: string) => void
  setPlanLookupKey: (next: string) => void
  setPlanTaxTreatment: (next: string) => void

  updateRateCardName: (id: number, value: string) => void
  addPlanRateCardWithName: (name: string, id: number) => void
  setActivePlanRateCardId: (next: number) => void
  setPlanExpandedRateCards: React.Dispatch<React.SetStateAction<Record<number, boolean>>>
  setActivePlanNode: (node: { type: "rateCard"; id: number } | { type: "plan" } | { type: "rate"; id: number }) => void

  setRateCardLookupKeys: React.Dispatch<React.SetStateAction<Record<number, string>>>
  setRateCardServicingPeriods: React.Dispatch<React.SetStateAction<Record<number, string>>>
  rateCardMetadataRows: Record<number, number[]>
  setRateCardMetadataRows: React.Dispatch<React.SetStateAction<Record<number, number[]>>>
  setRateCardMetadataValues: React.Dispatch<
    React.SetStateAction<Record<number, Record<number, { key: string; value: string }>>>
  >
}

export type PlanRateCardDraftState = {
  createdRateCards: Map<string, number>
  getDefaultRateCardId: () => number
  setDefaultRateCardId: (next: number) => void
  allocateNextRateCardId: () => number
}

export function applyPlanRateCardAssistantAction(opts: {
  type: string
  action: AssistantAction
  ctx: ApplyPlanRateCardAssistantCtx
  draft: PlanRateCardDraftState
}): { handled: boolean; applied: number; error?: string } {
  const { type, action, ctx, draft } = opts

  switch (type) {
    case "set_plan_name": {
      const value = getStringValue(action.value)
      ctx.setPlanName(value)
      return { handled: true, applied: 1 }
    }
    case "set_plan_description": {
      const value = getStringValue(action.value)
      ctx.setPlanDescription(value)
      return { handled: true, applied: 1 }
    }
    case "set_plan_currency": {
      const value = getStringValue(action.value).toUpperCase()
      if (!value) return { handled: true, applied: 0, error: "Plan currency is missing." }
      ctx.setPlanCurrency(value)
      return { handled: true, applied: 1 }
    }
    case "set_plan_lookup_key": {
      const value = getStringValue(action.value)
      ctx.setPlanLookupKey(value)
      return { handled: true, applied: 1 }
    }
    case "set_plan_tax_treatment": {
      const value = getStringValue(action.value)
      if (!value) return { handled: true, applied: 0, error: "Plan tax treatment is missing." }
      ctx.setPlanTaxTreatment(value)
      return { handled: true, applied: 1 }
    }
    case "add_plan_rate_card": {
      const name = getStringValue(action.name)
      const emptyCard = ctx
        .getDraftPlanRateCards()
        .find((card) => card.name.trim() === "" && card.rates.every((rate) => rate.name.trim() === ""))

      if (emptyCard) {
        if (name) draft.createdRateCards.set(name.toLowerCase(), emptyCard.id)
        ctx.updateRateCardName(emptyCard.id, name)
        ctx.updateDraftPlanRateCards((prev) => prev.map((card) => (card.id === emptyCard.id ? { ...card, name } : card)))
        ctx.setActivePlanRateCardId(emptyCard.id)
        ctx.setPlanExpandedRateCards((cards) => ({ ...cards, [emptyCard.id]: true }))
        ctx.setActivePlanNode({ type: "rateCard", id: emptyCard.id })
        draft.setDefaultRateCardId(emptyCard.id)
        if (ctx.planName.trim() === "") {
          ctx.setPlanName("AI Model Pricing")
        }
        return { handled: true, applied: 1 }
      }

      const nextId = draft.allocateNextRateCardId()
      if (name) draft.createdRateCards.set(name.toLowerCase(), nextId)
      ctx.addPlanRateCardWithName(name, nextId)
      ctx.updateDraftPlanRateCards((prev) => [...prev, { id: nextId, name: name.trim(), rates: [] }])
      draft.setDefaultRateCardId(nextId)
      if (ctx.planName.trim() === "") {
        ctx.setPlanName("AI Model Pricing")
      }
      return { handled: true, applied: 1 }
    }
    case "rename_plan_rate_card": {
      // Accept both "name" and "value" parameters for flexibility
      const value = getStringValue(action.name) || getStringValue(action.value)
      const resolved = ctx.resolveRateCardId(action, draft.createdRateCards, draft.getDefaultRateCardId())
      if (resolved.id == null) {
        return { handled: true, applied: 0, error: resolved.error ?? "Could not find rate card to rename." }
      }
      ctx.updateRateCardName(resolved.id, value)
      ctx.updateDraftPlanRateCards((prev) => prev.map((card) => (card.id === resolved.id ? { ...card, name: value } : card)))
      return { handled: true, applied: 1 }
    }
    case "set_rate_card_lookup_key": {
      const value = getStringValue(action.value)
      const resolved = ctx.resolveRateCardId(action, draft.createdRateCards, draft.getDefaultRateCardId())
      if (resolved.id == null) {
        return {
          handled: true,
          applied: 0,
          error: resolved.error ?? "Could not find rate card to update lookup key.",
        }
      }
      ctx.setRateCardLookupKeys((prev) => ({ ...prev, [resolved.id!]: value }))
      return { handled: true, applied: 1 }
    }
    case "set_rate_card_servicing_period": {
      const value = getStringValue(action.value)
      const match = resolveOption(value, ctx.servicingPeriodOptions)
      if (!match) return { handled: true, applied: 0, error: `Servicing period "${value}" is not valid.` }
      const resolved = ctx.resolveRateCardId(action, draft.createdRateCards, draft.getDefaultRateCardId())
      if (resolved.id == null) {
        return {
          handled: true,
          applied: 0,
          error: resolved.error ?? "Could not find rate card to update servicing period.",
        }
      }
      ctx.setRateCardServicingPeriods((prev) => ({ ...prev, [resolved.id!]: match }))
      return { handled: true, applied: 1 }
    }
    case "add_rate_card_metadata_row": {
      const resolved = ctx.resolveRateCardId(action, draft.createdRateCards, draft.getDefaultRateCardId())
      if (resolved.id == null) {
        return { handled: true, applied: 0, error: resolved.error ?? "Could not find rate card to add metadata." }
      }
      ctx.addMetadataRow(ctx.setRateCardMetadataRows, resolved.id, ctx.setRateCardMetadataValues)
      return { handled: true, applied: 1 }
    }
    case "remove_rate_card_metadata_row": {
      const resolved = ctx.resolveRateCardId(action, draft.createdRateCards, draft.getDefaultRateCardId())
      if (resolved.id == null) {
        return {
          handled: true,
          applied: 0,
          error: resolved.error ?? "Could not find rate card metadata to remove.",
        }
      }
      const rows = ctx.getMetadataRows(ctx.rateCardMetadataRows, resolved.id)
      const rowResolved = ctx.resolveRowId(rows, action, "rate card metadata")
      if (rowResolved.id == null) {
        return { handled: true, applied: 0, error: rowResolved.error ?? "Could not find rate card metadata row." }
      }
      ctx.removeMetadataRow(ctx.setRateCardMetadataRows, resolved.id, rowResolved.id, ctx.setRateCardMetadataValues)
      return { handled: true, applied: 1 }
    }
    case "set_rate_card_metadata_key": {
      const value = getStringValue(action.value)
      const resolved = ctx.resolveRateCardId(action, draft.createdRateCards, draft.getDefaultRateCardId())
      if (resolved.id == null) {
        return {
          handled: true,
          applied: 0,
          error: resolved.error ?? "Could not find rate card metadata to update.",
        }
      }
      const rows = ctx.getMetadataRows(ctx.rateCardMetadataRows, resolved.id)
      const rowResolved = ctx.resolveRowId(rows, action, "rate card metadata")
      if (rowResolved.id == null) {
        return { handled: true, applied: 0, error: rowResolved.error ?? "Could not find rate card metadata row." }
      }
      ctx.updatePlanMetadataValue(ctx.setRateCardMetadataValues, resolved.id, rowResolved.id, { key: value })
      return { handled: true, applied: 1 }
    }
    case "set_rate_card_metadata_value": {
      const value = getStringValue(action.value)
      const resolved = ctx.resolveRateCardId(action, draft.createdRateCards, draft.getDefaultRateCardId())
      if (resolved.id == null) {
        return {
          handled: true,
          applied: 0,
          error: resolved.error ?? "Could not find rate card metadata to update.",
        }
      }
      const rows = ctx.getMetadataRows(ctx.rateCardMetadataRows, resolved.id)
      const rowResolved = ctx.resolveRowId(rows, action, "rate card metadata")
      if (rowResolved.id == null) {
        return { handled: true, applied: 0, error: rowResolved.error ?? "Could not find rate card metadata row." }
      }
      ctx.updatePlanMetadataValue(ctx.setRateCardMetadataValues, resolved.id, rowResolved.id, { value })
      return { handled: true, applied: 1 }
    }
    default: {
      return { handled: false, applied: 0 }
    }
  }
}


