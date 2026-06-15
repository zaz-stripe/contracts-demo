'use client'

import type { AssistantAction } from "@/components/ProductAssistantPanel"
import { getStringValue } from "@/components/product-catalog/assistant/assistantValueParsing"
import type { PlanRateCard } from "@/components/product-catalog/productCatalogPage.types"

export type ApplyPlanRateMetadataAssistantCtx = {
  resolveRateId: (action: AssistantAction) => { id: number | null; cardId?: number | null; error?: string }

  updateRateName: (rateId: number, value: string) => void
  updateDraftPlanRateCards: (updater: (prev: PlanRateCard[]) => PlanRateCard[]) => void

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
  getMetadataRows: (map: Record<number, number[]>, id: number) => number[]
  resolveRowId: (rows: number[], action: AssistantAction, label: string) => { id: number | null; error?: string }
  updatePlanMetadataValue: (
    setter: React.Dispatch<
      React.SetStateAction<Record<number, Record<number, { key: string; value: string }>>>
    >,
    id: number,
    rowId: number,
    patch: Partial<{ key: string; value: string }>
  ) => void

  rateItemMetadataRows: Record<number, number[]>
  setRateItemMetadataRows: React.Dispatch<React.SetStateAction<Record<number, number[]>>>
  setRateItemMetadataValues: React.Dispatch<
    React.SetStateAction<Record<number, Record<number, { key: string; value: string }>>>
  >

  rateSettingsMetadataRows: Record<number, number[]>
  setRateSettingsMetadataRows: React.Dispatch<React.SetStateAction<Record<number, number[]>>>
  setRateSettingsMetadataValues: React.Dispatch<
    React.SetStateAction<Record<number, Record<number, { key: string; value: string }>>>
  >
}

export function applyPlanRateMetadataAssistantAction(opts: {
  type: string
  action: AssistantAction
  ctx: ApplyPlanRateMetadataAssistantCtx
}): { handled: boolean; applied: number; error?: string } {
  const { type, action, ctx } = opts

  switch (type) {
    case "rename_plan_rate": {
      // Accept both "name" and "value" parameters for flexibility
      const value = getStringValue(action.name) || getStringValue(action.value)
      const resolved = ctx.resolveRateId(action)
      if (resolved.id == null) {
        return { handled: true, applied: 0, error: resolved.error ?? "Could not find rate to rename." }
      }
      ctx.updateRateName(resolved.id, value)
      ctx.updateDraftPlanRateCards((prev) =>
        prev.map((card) => ({
          ...card,
          rates: card.rates.map((rate) => (rate.id === resolved.id ? { ...rate, name: value } : rate)),
        }))
      )
      return { handled: true, applied: 1 }
    }
    case "add_rate_item_metadata_row": {
      const resolved = ctx.resolveRateId(action)
      if (resolved.id == null) {
        return { handled: true, applied: 0, error: resolved.error ?? "Could not find rate to add metadata." }
      }
      ctx.addMetadataRow(ctx.setRateItemMetadataRows, resolved.id, ctx.setRateItemMetadataValues)
      return { handled: true, applied: 1 }
    }
    case "remove_rate_item_metadata_row": {
      const resolved = ctx.resolveRateId(action)
      if (resolved.id == null) {
        return { handled: true, applied: 0, error: resolved.error ?? "Could not find rate metadata to remove." }
      }
      const rows = ctx.getMetadataRows(ctx.rateItemMetadataRows, resolved.id)
      const rowResolved = ctx.resolveRowId(rows, action, "rate item metadata")
      if (rowResolved.id == null) {
        return { handled: true, applied: 0, error: rowResolved.error ?? "Could not find rate item metadata row." }
      }
      ctx.removeMetadataRow(ctx.setRateItemMetadataRows, resolved.id, rowResolved.id, ctx.setRateItemMetadataValues)
      return { handled: true, applied: 1 }
    }
    case "set_rate_item_metadata_key": {
      const value = getStringValue(action.value)
      const resolved = ctx.resolveRateId(action)
      if (resolved.id == null) {
        return { handled: true, applied: 0, error: resolved.error ?? "Could not find rate metadata to update." }
      }
      const rows = ctx.getMetadataRows(ctx.rateItemMetadataRows, resolved.id)
      const rowResolved = ctx.resolveRowId(rows, action, "rate item metadata")
      if (rowResolved.id == null) {
        return { handled: true, applied: 0, error: rowResolved.error ?? "Could not find rate item metadata row." }
      }
      ctx.updatePlanMetadataValue(ctx.setRateItemMetadataValues, resolved.id, rowResolved.id, { key: value })
      return { handled: true, applied: 1 }
    }
    case "set_rate_item_metadata_value": {
      const value = getStringValue(action.value)
      const resolved = ctx.resolveRateId(action)
      if (resolved.id == null) {
        return { handled: true, applied: 0, error: resolved.error ?? "Could not find rate metadata to update." }
      }
      const rows = ctx.getMetadataRows(ctx.rateItemMetadataRows, resolved.id)
      const rowResolved = ctx.resolveRowId(rows, action, "rate item metadata")
      if (rowResolved.id == null) {
        return { handled: true, applied: 0, error: rowResolved.error ?? "Could not find rate item metadata row." }
      }
      ctx.updatePlanMetadataValue(ctx.setRateItemMetadataValues, resolved.id, rowResolved.id, { value })
      return { handled: true, applied: 1 }
    }
    case "add_rate_settings_metadata_row": {
      const resolved = ctx.resolveRateId(action)
      if (resolved.id == null) {
        return {
          handled: true,
          applied: 0,
          error: resolved.error ?? "Could not find rate to add settings metadata.",
        }
      }
      ctx.addMetadataRow(ctx.setRateSettingsMetadataRows, resolved.id, ctx.setRateSettingsMetadataValues)
      return { handled: true, applied: 1 }
    }
    case "remove_rate_settings_metadata_row": {
      const resolved = ctx.resolveRateId(action)
      if (resolved.id == null) {
        return {
          handled: true,
          applied: 0,
          error: resolved.error ?? "Could not find rate settings metadata to remove.",
        }
      }
      const rows = ctx.getMetadataRows(ctx.rateSettingsMetadataRows, resolved.id)
      const rowResolved = ctx.resolveRowId(rows, action, "rate settings metadata")
      if (rowResolved.id == null) {
        return { handled: true, applied: 0, error: rowResolved.error ?? "Could not find rate settings metadata row." }
      }
      ctx.removeMetadataRow(ctx.setRateSettingsMetadataRows, resolved.id, rowResolved.id, ctx.setRateSettingsMetadataValues)
      return { handled: true, applied: 1 }
    }
    case "set_rate_settings_metadata_key": {
      const value = getStringValue(action.value)
      const resolved = ctx.resolveRateId(action)
      if (resolved.id == null) {
        return {
          handled: true,
          applied: 0,
          error: resolved.error ?? "Could not find rate settings metadata to update.",
        }
      }
      const rows = ctx.getMetadataRows(ctx.rateSettingsMetadataRows, resolved.id)
      const rowResolved = ctx.resolveRowId(rows, action, "rate settings metadata")
      if (rowResolved.id == null) {
        return { handled: true, applied: 0, error: rowResolved.error ?? "Could not find rate settings metadata row." }
      }
      ctx.updatePlanMetadataValue(ctx.setRateSettingsMetadataValues, resolved.id, rowResolved.id, { key: value })
      return { handled: true, applied: 1 }
    }
    case "set_rate_settings_metadata_value": {
      const value = getStringValue(action.value)
      const resolved = ctx.resolveRateId(action)
      if (resolved.id == null) {
        return {
          handled: true,
          applied: 0,
          error: resolved.error ?? "Could not find rate settings metadata to update.",
        }
      }
      const rows = ctx.getMetadataRows(ctx.rateSettingsMetadataRows, resolved.id)
      const rowResolved = ctx.resolveRowId(rows, action, "rate settings metadata")
      if (rowResolved.id == null) {
        return { handled: true, applied: 0, error: rowResolved.error ?? "Could not find rate settings metadata row." }
      }
      ctx.updatePlanMetadataValue(ctx.setRateSettingsMetadataValues, resolved.id, rowResolved.id, { value })
      return { handled: true, applied: 1 }
    }
    default: {
      return { handled: false, applied: 0 }
    }
  }
}



