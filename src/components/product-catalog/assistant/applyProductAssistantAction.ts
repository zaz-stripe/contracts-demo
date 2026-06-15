'use client'

import type { AssistantAction } from "@/components/ProductAssistantPanel"
import { getStringValue, resolveOption } from "@/components/product-catalog/assistant/assistantValueParsing"
import type { SavedPriceConfig } from "@/components/product-catalog/productCatalogPage.types"

export type ApplyProductAssistantCtx = {
  // product/meta state
  meter: string
  metadataRows: number[]
  featureRows: number[]
  tiers: number[]
  pricingCurrencies: { id: number; code: string }[]
  activeCurrencyId: number | null
  locationOptions: string[]
  stateOptions: string[]

  // option arrays
  aggregationMethodOptions: string[]
  eventTimeWindowOptions: string[]
  chargeFrequencyOptions: string[]
  recurringPricingOptions: string[]
  oneOffPricingOptions: string[]
  priceBillingPeriodOptions: string[]
  includeTaxOptions: string[]
  usageBasisOptions: string[]
  tieredByOptions: string[]
  customerPreviewOptions: string[]

  // setters/handlers
  setActiveObjectForm: (next: "product" | "price" | "meter") => void
  setMeterName: React.Dispatch<React.SetStateAction<string>>
  setProductName: (next: string) => void
  setProductDescription: (next: string) => void
  setProductTaxCode: (next: string) => void
  setStatementDescriptor: (next: string) => void
  setUnitLabel: (next: string) => void
  setProductImageUrl: (next: string | null) => void
  setShowAdditionalOptions: (next: boolean) => void
  addProductMetadataRow: () => void
  setMetadataRows: React.Dispatch<React.SetStateAction<number[]>>
  setMetadataValues: React.Dispatch<React.SetStateAction<Record<number, { key: string; value: string }>>>
  updateProductMetadataValue: (rowId: number, patch: Partial<{ key: string; value: string }>) => void
  addProductFeatureRow: () => void
  setFeatureRows: React.Dispatch<React.SetStateAction<number[]>>
  setFeatureValues: React.Dispatch<React.SetStateAction<Record<number, string>>>

  resolveRowId: (rows: number[], action: AssistantAction, label: string) => { id: number | null; error?: string }

  resolvePriceId: (action: AssistantAction) => { id: number | null; error?: string }
  setPriceNamesById: React.Dispatch<React.SetStateAction<Record<number, string>>>
  handleSelectPriceFromTree: (priceId: number) => void
  setPriceDescription: (next: string) => void
  setLookupKey: (next: string) => void

  setChargeFrequency: (next: string) => void
  handlePricingModelChange: (next: string) => void
  setBillingPeriod: (next: string) => void
  setIncludeTax: (next: string) => void
  handleUsageBasisChange: (next: string) => void
  setTieredBy: (next: string) => void
  setMeter: (next: string) => void
  handleOpenMeterBuilder: (mode: "create" | "edit") => void
  handleAddCurrency: (code?: string) => void
  resolveCurrencyId: (action: AssistantAction) => { id: number | null; error?: string }
  handleDeleteCurrency: (id: number) => void
  setActiveCurrencyId: (next: number) => void
  handleCurrencyChange: (id: number, code: string) => void
  setCurrencyAmounts: React.Dispatch<React.SetStateAction<Record<number, string>>>

  handleAddTier: () => void
  resolveTierId: (action: AssistantAction) => { id: number | null; error?: string }
  handleRemoveTier: (id: number) => void
  setTierToValues: React.Dispatch<React.SetStateAction<Record<number, string>>>
  setTierUnitPrices: React.Dispatch<React.SetStateAction<Record<number, string>>>
  setTierFlatFees: React.Dispatch<React.SetStateAction<Record<number, string>>>

  setMeterEventName: (next: string) => void
  setAggregationMethod: (next: string) => void
  setEventTimeWindow: (next: string) => void
  setShowCountingOptions: (next: boolean) => void
  setValueKeyOverride: (next: string) => void
  handleSaveMeter: () => void

  createDraftPrice: (config: SavedPriceConfig, name?: string) => number
  setShowInternalReference: (next: boolean) => void

  setCustomerPreviewMode: (next: string) => void
  formatPreviewQuantity: (value: unknown) => string
  setPreviewUnitQuantity: (next: string) => void
  setPreviewLocation: (next: string) => void
  setPreviewState: (next: string) => void
}

export function applyProductAssistantAction(opts: {
  type: string
  action: AssistantAction
  ctx: ApplyProductAssistantCtx
}): { handled: boolean; applied: number; error?: string } {
  const { type, action, ctx } = opts

  switch (type) {
    case "set_active_form": {
      const value = getStringValue(action.value)
      if (value === "product" || value === "price" || value === "meter") {
        ctx.setActiveObjectForm(value)
        if (value === "meter") {
          ctx.setMeterName((prev) => (prev.trim() !== "" ? prev : ctx.meter))
        }
        return { handled: true, applied: 1 }
      }
      return { handled: true, applied: 0, error: "Active form must be product, price, or meter." }
    }
    case "set_product_name": {
      const value = getStringValue(action.value)
      ctx.setProductName(value)
      ctx.setActiveObjectForm("product")
      return { handled: true, applied: 1 }
    }
    case "set_product_description": {
      const value = getStringValue(action.value)
      ctx.setProductDescription(value)
      ctx.setActiveObjectForm("product")
      return { handled: true, applied: 1 }
    }
    case "set_product_tax_code": {
      const value = getStringValue(action.value)
      ctx.setProductTaxCode(value)
      ctx.setActiveObjectForm("product")
      return { handled: true, applied: 1 }
    }
    case "set_statement_descriptor": {
      const value = getStringValue(action.value)
      ctx.setStatementDescriptor(value)
      ctx.setActiveObjectForm("product")
      return { handled: true, applied: 1 }
    }
    case "set_unit_label": {
      const value = getStringValue(action.value)
      ctx.setUnitLabel(value)
      ctx.setActiveObjectForm("product")
      return { handled: true, applied: 1 }
    }
    case "set_product_image_url": {
      const value = getStringValue(action.value)
      ctx.setProductImageUrl(value ? value : null)
      ctx.setActiveObjectForm("product")
      return { handled: true, applied: 1 }
    }
    case "toggle_additional_options": {
      ctx.setShowAdditionalOptions(Boolean(action.open))
      ctx.setActiveObjectForm("product")
      return { handled: true, applied: 1 }
    }
    case "add_product_metadata_row": {
      ctx.addProductMetadataRow()
      ctx.setActiveObjectForm("product")
      return { handled: true, applied: 1 }
    }
    case "remove_product_metadata_row": {
      const resolved = ctx.resolveRowId(ctx.metadataRows, action, "metadata")
      if (resolved.id == null) return { handled: true, applied: 0, error: resolved.error ?? "Could not find metadata row to remove." }
      const rowId = resolved.id
      ctx.setMetadataRows((prev) => prev.filter((id) => id !== rowId))
      ctx.setMetadataValues((prev) => {
        if (!(rowId in prev)) return prev
        const next = { ...prev }
        delete next[rowId]
        return next
      })
      ctx.setActiveObjectForm("product")
      return { handled: true, applied: 1 }
    }
    case "set_product_metadata_key": {
      const value = getStringValue(action.value)
      const resolved = ctx.resolveRowId(ctx.metadataRows, action, "metadata")
      if (resolved.id == null) return { handled: true, applied: 0, error: resolved.error ?? "Could not find metadata row to update." }
      ctx.updateProductMetadataValue(resolved.id, { key: value })
      ctx.setActiveObjectForm("product")
      return { handled: true, applied: 1 }
    }
    case "set_product_metadata_value": {
      const value = getStringValue(action.value)
      const resolved = ctx.resolveRowId(ctx.metadataRows, action, "metadata")
      if (resolved.id == null) return { handled: true, applied: 0, error: resolved.error ?? "Could not find metadata row to update." }
      ctx.updateProductMetadataValue(resolved.id, { value })
      ctx.setActiveObjectForm("product")
      return { handled: true, applied: 1 }
    }
    case "add_product_feature_row": {
      ctx.addProductFeatureRow()
      ctx.setActiveObjectForm("product")
      return { handled: true, applied: 1 }
    }
    case "remove_product_feature_row": {
      const resolved = ctx.resolveRowId(ctx.featureRows, action, "feature")
      if (resolved.id == null) return { handled: true, applied: 0, error: resolved.error ?? "Could not find feature row to remove." }
      const rowId = resolved.id
      ctx.setFeatureRows((prev) => prev.filter((id) => id !== rowId))
      ctx.setFeatureValues((prev) => {
        if (!(rowId in prev)) return prev
        const next = { ...prev }
        delete next[rowId]
        return next
      })
      ctx.setActiveObjectForm("product")
      return { handled: true, applied: 1 }
    }
    case "set_product_feature_value": {
      const value = getStringValue(action.value)
      const resolved = ctx.resolveRowId(ctx.featureRows, action, "feature")
      if (resolved.id == null) return { handled: true, applied: 0, error: resolved.error ?? "Could not find feature row to update." }
      const rowId = resolved.id
      ctx.setFeatureValues((prev) => ({ ...prev, [rowId]: value }))
      ctx.setActiveObjectForm("product")
      return { handled: true, applied: 1 }
    }
    case "set_price_name": {
      const value = getStringValue(action.value)
      const resolved = ctx.resolvePriceId(action)
      if (resolved.id == null) return { handled: true, applied: 0, error: resolved.error ?? "Could not find price to rename." }
      ctx.setPriceNamesById((prev) => ({ ...prev, [resolved.id!]: value }))
      ctx.setActiveObjectForm("price")
      return { handled: true, applied: 1 }
    }
    case "select_price": {
      const resolved = ctx.resolvePriceId(action)
      if (resolved.id == null) return { handled: true, applied: 0, error: resolved.error ?? "Could not find price to select." }
      ctx.handleSelectPriceFromTree(resolved.id)
      return { handled: true, applied: 1 }
    }
    case "set_price_description": {
      const value = getStringValue(action.value)
      ctx.setPriceDescription(value)
      ctx.setActiveObjectForm("price")
      return { handled: true, applied: 1 }
    }
    case "set_price_lookup_key": {
      const value = getStringValue(action.value)
      ctx.setLookupKey(value)
      ctx.setActiveObjectForm("price")
      return { handled: true, applied: 1 }
    }
    case "set_charge_frequency": {
      const value = getStringValue(action.value)
      const match = resolveOption(value, ctx.chargeFrequencyOptions)
      if (!match) return { handled: true, applied: 0, error: `Charge frequency "${value}" is not valid.` }
      ctx.setChargeFrequency(match)
      ctx.setActiveObjectForm("price")
      return { handled: true, applied: 1 }
    }
    case "set_pricing_model": {
      const value = getStringValue(action.value)
      const match = resolveOption(value, [...ctx.recurringPricingOptions, ...ctx.oneOffPricingOptions])
      if (!match) return { handled: true, applied: 0, error: `Pricing model "${value}" is not valid.` }
      ctx.handlePricingModelChange(match)
      ctx.setActiveObjectForm("price")
      return { handled: true, applied: 1 }
    }
    case "set_billing_period": {
      const value = getStringValue(action.value)
      const match = resolveOption(value, ctx.priceBillingPeriodOptions)
      if (!match) return { handled: true, applied: 0, error: `Billing period "${value}" is not valid.` }
      ctx.setBillingPeriod(match)
      ctx.setActiveObjectForm("price")
      return { handled: true, applied: 1 }
    }
    case "set_include_tax": {
      const value = getStringValue(action.value)
      const match = resolveOption(value, ctx.includeTaxOptions)
      if (!match) return { handled: true, applied: 0, error: `Tax setting "${value}" is not valid.` }
      ctx.setIncludeTax(match)
      ctx.setActiveObjectForm("price")
      return { handled: true, applied: 1 }
    }
    case "set_usage_basis": {
      const value = getStringValue(action.value)
      const match = resolveOption(value, ctx.usageBasisOptions)
      if (!match) return { handled: true, applied: 0, error: `Usage basis "${value}" is not valid.` }
      ctx.handleUsageBasisChange(match)
      ctx.setActiveObjectForm("price")
      return { handled: true, applied: 1 }
    }
    case "set_tiered_by": {
      const value = getStringValue(action.value)
      const match = resolveOption(value, ctx.tieredByOptions)
      if (!match) return { handled: true, applied: 0, error: `Tiering mode "${value}" is not valid.` }
      ctx.setTieredBy(match)
      ctx.setActiveObjectForm("price")
      return { handled: true, applied: 1 }
    }
    case "set_meter": {
      const value = getStringValue(action.value)
      ctx.setMeter(value)
      ctx.setActiveObjectForm("price")
      return { handled: true, applied: 1 }
    }
    case "open_meter_builder": {
      const mode = getStringValue(action.mode ?? action.value)
      ctx.handleOpenMeterBuilder(mode === "edit" ? "edit" : "create")
      return { handled: true, applied: 1 }
    }
    case "add_currency": {
      const code = getStringValue(action.code ?? action.value ?? action.currencyCode)
      ctx.handleAddCurrency(code || undefined)
      ctx.setActiveObjectForm("price")
      return { handled: true, applied: 1 }
    }
    case "remove_currency": {
      const resolved = ctx.resolveCurrencyId(action)
      if (resolved.id == null) return { handled: true, applied: 0, error: resolved.error ?? "Could not find currency to remove." }
      ctx.handleDeleteCurrency(resolved.id)
      ctx.setActiveObjectForm("price")
      return { handled: true, applied: 1 }
    }
    case "set_active_currency": {
      const resolved = ctx.resolveCurrencyId(action)
      if (resolved.id == null) return { handled: true, applied: 0, error: resolved.error ?? "Could not find currency to activate." }
      ctx.setActiveCurrencyId(resolved.id)
      ctx.setActiveObjectForm("price")
      return { handled: true, applied: 1 }
    }
    case "set_currency_code": {
      const value = getStringValue(action.value ?? action.code)
      if (!value) return { handled: true, applied: 0, error: "Currency code is missing." }
      const resolved = ctx.resolveCurrencyId(action)
      if (resolved.id == null) return { handled: true, applied: 0, error: resolved.error ?? "Could not find currency to update." }
      ctx.handleCurrencyChange(resolved.id, value.toUpperCase())
      ctx.setActiveObjectForm("price")
      return { handled: true, applied: 1 }
    }
    case "set_currency_amount": {
      const amount = getStringValue(action.amount ?? action.value)
      const resolved = ctx.resolveCurrencyId(action)
      if (resolved.id == null) return { handled: true, applied: 0, error: resolved.error ?? "Could not find currency for amount." }
      ctx.setCurrencyAmounts((prev) => ({ ...prev, [resolved.id!]: amount }))
      ctx.setActiveObjectForm("price")
      return { handled: true, applied: 1 }
    }
    case "add_tier": {
      ctx.handleAddTier()
      ctx.setActiveObjectForm("price")
      return { handled: true, applied: 1 }
    }
    case "remove_tier": {
      const resolved = ctx.resolveTierId(action)
      if (resolved.id == null) return { handled: true, applied: 0, error: resolved.error ?? "Could not find tier to remove." }
      ctx.handleRemoveTier(resolved.id)
      ctx.setActiveObjectForm("price")
      return { handled: true, applied: 1 }
    }
    case "set_tier_to": {
      const value = getStringValue(action.value)
      const resolved = ctx.resolveTierId(action)
      if (resolved.id == null) return { handled: true, applied: 0, error: resolved.error ?? "Could not find tier to update." }
      ctx.setTierToValues((prev) => ({ ...prev, [resolved.id!]: value }))
      ctx.setActiveObjectForm("price")
      return { handled: true, applied: 1 }
    }
    case "set_tier_unit_price": {
      const value = getStringValue(action.value)
      const resolved = ctx.resolveTierId(action)
      if (resolved.id == null) return { handled: true, applied: 0, error: resolved.error ?? "Could not find tier to update." }
      ctx.setTierUnitPrices((prev) => ({ ...prev, [resolved.id!]: value }))
      ctx.setActiveObjectForm("price")
      return { handled: true, applied: 1 }
    }
    case "set_tier_flat_fee": {
      const value = getStringValue(action.value)
      const resolved = ctx.resolveTierId(action)
      if (resolved.id == null) return { handled: true, applied: 0, error: resolved.error ?? "Could not find tier to update." }
      ctx.setTierFlatFees((prev) => ({ ...prev, [resolved.id!]: value }))
      ctx.setActiveObjectForm("price")
      return { handled: true, applied: 1 }
    }
    case "set_meter_name": {
      const value = getStringValue(action.value)
      ctx.setMeterName(value)
      ctx.setActiveObjectForm("meter")
      return { handled: true, applied: 1 }
    }
    case "set_meter_event_name": {
      const value = getStringValue(action.value)
      ctx.setMeterEventName(value)
      ctx.setActiveObjectForm("meter")
      return { handled: true, applied: 1 }
    }
    case "set_meter_aggregation_method": {
      const value = getStringValue(action.value)
      const match = resolveOption(value, ctx.aggregationMethodOptions)
      if (!match) return { handled: true, applied: 0, error: `Aggregation method "${value}" is not valid.` }
      ctx.setAggregationMethod(match)
      ctx.setActiveObjectForm("meter")
      return { handled: true, applied: 1 }
    }
    case "set_meter_event_time_window": {
      const value = getStringValue(action.value)
      const match = resolveOption(value, ctx.eventTimeWindowOptions)
      if (!match) return { handled: true, applied: 0, error: `Event time window "${value}" is not valid.` }
      ctx.setEventTimeWindow(match)
      ctx.setActiveObjectForm("meter")
      return { handled: true, applied: 1 }
    }
    case "toggle_meter_counting_options": {
      ctx.setShowCountingOptions(Boolean(action.open))
      ctx.setActiveObjectForm("meter")
      return { handled: true, applied: 1 }
    }
    case "set_meter_value_key_override": {
      const value = getStringValue(action.value)
      ctx.setValueKeyOverride(value)
      ctx.setActiveObjectForm("meter")
      return { handled: true, applied: 1 }
    }
    case "save_meter": {
      ctx.handleSaveMeter()
      return { handled: true, applied: 1 }
    }
    case "unlink_meter": {
      ctx.setMeter("")
      ctx.setMeterName("")
      ctx.setActiveObjectForm("price")
      return { handled: true, applied: 1 }
    }
    case "add_price": {
      const name = getStringValue(action.name)
      const currency = getStringValue(action.currency).toUpperCase()
      const amount = getStringValue(action.amount)
      const billingPeriod = getStringValue(action.billingPeriod)
      const pricingModel = getStringValue(action.pricingModel)
      const usageBasis = getStringValue(action.usageBasis)
      const tieredBy = getStringValue(action.tieredBy)
      const meterValue = getStringValue(action.meter)
      const defaultConfig: SavedPriceConfig = {
        chargeFrequency: ctx.chargeFrequencyOptions[0],
        pricingModel: ctx.recurringPricingOptions[0],
        billingPeriod: "Monthly",
        includeTax: ctx.includeTaxOptions[0],
        currencies: [{ id: 0, code: "USD" }],
        currencyAmounts: {},
        tiers: [0, 1],
        tierToValues: {},
        tierUnitPrices: {},
        tierFlatFees: {},
        usageBasis: ctx.usageBasisOptions[0],
        tieredBy: ctx.tieredByOptions[0],
        meter: "",
      }
      const nextConfig = { ...defaultConfig }
      if (currency) nextConfig.currencies = [{ id: 0, code: currency }]
      if (amount) nextConfig.currencyAmounts = { 0: amount }
      if (billingPeriod) {
        const match = resolveOption(billingPeriod, ctx.priceBillingPeriodOptions)
        if (match) nextConfig.billingPeriod = match
      }
      if (pricingModel) {
        const match = resolveOption(pricingModel, [...ctx.recurringPricingOptions, ...ctx.oneOffPricingOptions])
        if (match) nextConfig.pricingModel = match
      }
      if (usageBasis) {
        const match = resolveOption(usageBasis, ctx.usageBasisOptions)
        if (match) nextConfig.usageBasis = match
      }
      if (tieredBy) {
        const match = resolveOption(tieredBy, ctx.tieredByOptions)
        if (match) nextConfig.tieredBy = match
      }
      if (meterValue) nextConfig.meter = meterValue
      ctx.createDraftPrice(nextConfig, name)
      return { handled: true, applied: 1 }
    }
    case "open_internal_reference": {
      ctx.setShowInternalReference(Boolean(action.open))
      ctx.setActiveObjectForm("price")
      return { handled: true, applied: 1 }
    }
    case "set_preview_mode": {
      const value = getStringValue(action.value)
      const normalized =
        value.toLowerCase() === "customer preview"
          ? "Preview"
          : value.toLowerCase() === "object map"
            ? "Map"
            : value.toLowerCase() === "customer preview code"
              ? "Code"
              : value
      const match = resolveOption(normalized, ctx.customerPreviewOptions)
      if (!match) return { handled: true, applied: 0, error: `Preview mode "${value}" is not valid.` }
      ctx.setCustomerPreviewMode(match)
      return { handled: true, applied: 1 }
    }
    case "set_preview_unit_quantity": {
      const formatted = ctx.formatPreviewQuantity(action.value)
      ctx.setPreviewUnitQuantity(formatted)
      return { handled: true, applied: 1 }
    }
    case "set_preview_location": {
      const value = getStringValue(action.value)
      if (!value) return { handled: true, applied: 0, error: "Preview location is missing." }
      if (!ctx.locationOptions.includes(value)) return { handled: true, applied: 0, error: `Preview location "${value}" is not available.` }
      ctx.setPreviewLocation(value)
      return { handled: true, applied: 1 }
    }
    case "set_preview_state": {
      const value = getStringValue(action.value)
      if (!value) return { handled: true, applied: 0, error: "Preview state is missing." }
      if (!ctx.stateOptions.includes(value)) return { handled: true, applied: 0, error: `Preview state "${value}" is not available.` }
      ctx.setPreviewState(value)
      return { handled: true, applied: 1 }
    }
    default: {
      return { handled: false, applied: 0 }
    }
  }
}


