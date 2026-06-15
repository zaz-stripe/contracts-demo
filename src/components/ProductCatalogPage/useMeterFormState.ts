"use client"

import { useState } from "react"
import {
  aggregationMethodOptions,
  eventTimeWindowOptions,
} from "@/components/product-catalog/productCatalogPage.constants"

/**
 * Hook for managing meter form state
 */
export function useMeterFormState() {
  const [meterName, setMeterName] = useState("")
  const [meterEventName, setMeterEventName] = useState("")
  const [aggregationMethod, setAggregationMethod] = useState(aggregationMethodOptions[0])
  const [eventTimeWindow, setEventTimeWindow] = useState(eventTimeWindowOptions[0])
  const [valueKeyOverride, setValueKeyOverride] = useState("")
  const [showCountingOptions, setShowCountingOptions] = useState(false)

  const resetMeterFormToDefaults = () => {
    setMeterName("")
    setMeterEventName("")
    setAggregationMethod(aggregationMethodOptions[0])
    setEventTimeWindow(eventTimeWindowOptions[0])
    setValueKeyOverride("")
    setShowCountingOptions(false)
  }

  return {
    meterName,
    setMeterName,
    meterEventName,
    setMeterEventName,
    aggregationMethod,
    setAggregationMethod,
    eventTimeWindow,
    setEventTimeWindow,
    valueKeyOverride,
    setValueKeyOverride,
    showCountingOptions,
    setShowCountingOptions,
    resetMeterFormToDefaults,
  }
}

export type MeterFormState = ReturnType<typeof useMeterFormState>
