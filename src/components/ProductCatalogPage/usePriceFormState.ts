"use client"

import { useState } from "react"
import type { PriceSummary, SavedPriceConfig } from "@/components/product-catalog/productCatalogPage.types"
import {
  chargeFrequencyOptions,
  recurringPricingOptions,
  includeTaxOptions,
  tieredByOptions,
  usageBasisOptions,
} from "@/components/product-catalog/productCatalogPage.constants"

/**
 * Hook for managing price form state
 */
export function usePriceFormState() {
  // Core pricing fields
  const [chargeFrequency, setChargeFrequency] = useState(chargeFrequencyOptions[0])
  const [pricingModel, setPricingModel] = useState(recurringPricingOptions[0])
  const [billingPeriod, setBillingPeriod] = useState("Monthly")
  const [includeTax, setIncludeTax] = useState(includeTaxOptions[0])

  // Tiered pricing
  const [tieredBy, setTieredBy] = useState(tieredByOptions[0])
  const [tiers, setTiers] = useState<number[]>([0, 1])
  const [tierToValues, setTierToValues] = useState<Record<number, string>>({})
  const [tierUnitPrices, setTierUnitPrices] = useState<Record<number, string>>({})
  const [tierFlatFees, setTierFlatFees] = useState<Record<number, string>>({})

  // Usage-based pricing
  const [usageBasis, setUsageBasis] = useState(usageBasisOptions[0])
  const [meter, setMeter] = useState("")

  // Multi-currency support
  const [pricingCurrencies, setPricingCurrencies] = useState<{ id: number; code: string }[]>([
    { id: 0, code: "USD" },
  ])
  const [activeCurrencyId, setActiveCurrencyId] = useState<number>(0)
  const [currencyAmounts, setCurrencyAmounts] = useState<Record<number, string>>({})

  // Internal reference
  const [showInternalReference, setShowInternalReference] = useState(false)
  const [priceDescription, setPriceDescription] = useState("")
  const [lookupKey, setLookupKey] = useState("")

  // Collapsed prices list
  const [collapsedPrices, setCollapsedPrices] = useState<PriceSummary[]>([])
  const [editingPriceId, setEditingPriceId] = useState<number | null>(null)
  const [priceNamesById, setPriceNamesById] = useState<Record<number, string>>({})

  // Price form UI state
  const [priceFormInstance, setPriceFormInstance] = useState(0)
  const [showPriceForm, setShowPriceForm] = useState(true)
  const [shouldAnimatePriceForm, setShouldAnimatePriceForm] = useState(false)
  const [priceDraftName, setPriceDraftName] = useState("")

  const primaryCurrencyCode = pricingCurrencies[0]?.code ?? "USD"

  const resetPriceFormToDefaults = () => {
    setChargeFrequency(chargeFrequencyOptions[0])
    setPricingModel(recurringPricingOptions[0])
    setUsageBasis(usageBasisOptions[0])
    setTieredBy(tieredByOptions[0])
    setBillingPeriod("Monthly")
    setIncludeTax(includeTaxOptions[0])
    setPricingCurrencies([{ id: 0, code: "USD" }])
    setCurrencyAmounts({})
    setTiers([0, 1])
    setTierToValues({})
    setTierUnitPrices({})
    setTierFlatFees({})
    setMeter("")
  }

  const captureCurrentPriceConfig = (): SavedPriceConfig => {
    return {
      chargeFrequency,
      pricingModel,
      billingPeriod,
      includeTax,
      currencies: pricingCurrencies.map((currency) => ({ ...currency })),
      currencyAmounts: { ...currencyAmounts },
      tiers: [...tiers],
      tierToValues: { ...tierToValues },
      tierUnitPrices: { ...tierUnitPrices },
      tierFlatFees: { ...tierFlatFees },
      usageBasis,
      tieredBy,
      meter,
    }
  }

  const applyPriceConfig = (config: SavedPriceConfig) => {
    setChargeFrequency(config.chargeFrequency)
    setPricingModel(config.pricingModel)
    setBillingPeriod(config.billingPeriod)
    setIncludeTax(config.includeTax)
    setPricingCurrencies(config.currencies.map((currency) => ({ ...currency })))
    setCurrencyAmounts({ ...config.currencyAmounts })
    setTiers([...config.tiers])
    setTierToValues({ ...config.tierToValues })
    setTierUnitPrices({ ...config.tierUnitPrices })
    setTierFlatFees({ ...config.tierFlatFees })
    setUsageBasis(config.usageBasis)
    setTieredBy(config.tieredBy)
    setMeter(config.meter)
  }

  return {
    // Core pricing state
    chargeFrequency,
    setChargeFrequency,
    pricingModel,
    setPricingModel,
    billingPeriod,
    setBillingPeriod,
    includeTax,
    setIncludeTax,

    // Tiered pricing state
    tieredBy,
    setTieredBy,
    tiers,
    setTiers,
    tierToValues,
    setTierToValues,
    tierUnitPrices,
    setTierUnitPrices,
    tierFlatFees,
    setTierFlatFees,

    // Usage-based pricing state
    usageBasis,
    setUsageBasis,
    meter,
    setMeter,

    // Multi-currency state
    pricingCurrencies,
    setPricingCurrencies,
    activeCurrencyId,
    setActiveCurrencyId,
    currencyAmounts,
    setCurrencyAmounts,
    primaryCurrencyCode,

    // Internal reference state
    showInternalReference,
    setShowInternalReference,
    priceDescription,
    setPriceDescription,
    lookupKey,
    setLookupKey,

    // Collapsed prices state
    collapsedPrices,
    setCollapsedPrices,
    editingPriceId,
    setEditingPriceId,
    priceNamesById,
    setPriceNamesById,

    // Price form UI state
    priceFormInstance,
    setPriceFormInstance,
    showPriceForm,
    setShowPriceForm,
    shouldAnimatePriceForm,
    setShouldAnimatePriceForm,
    priceDraftName,
    setPriceDraftName,

    // Actions
    resetPriceFormToDefaults,
    captureCurrentPriceConfig,
    applyPriceConfig,
  }
}

export type PriceFormState = ReturnType<typeof usePriceFormState>
