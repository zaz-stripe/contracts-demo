"use client"

import { useEffect, useState } from "react"
import { FormRow } from "@/components/FormRow"
import { Selector } from "@/components/Selector"
import { MeterForm } from "@/components/MeterForm"
import type { PlanFormContext } from "./planFormTypes"
import { createEnterToCloseHandler } from "./planFormUtils"
import { usePlanFormClose } from "./PlanFormCloseContext"

type RateMeterFormProps = {
  ctx: PlanFormContext
}

export function RateMeterForm({ ctx }: RateMeterFormProps) {
  const {
    t,
    activePlanNode,
    activePlanRateCard,
    aggregationMethodOptions,
    eventTimeWindowOptions,
    meterOptions,
    planRateMeterConfigs,
    setPlanRateMeterConfigs,
    setRateMeters,
    setAvailableMeterOptions,
    updateAvailableMeterName,
    rateMeters,
  } = ctx

  const closeForm = usePlanFormClose()
  const handleEnterToClose = createEnterToCloseHandler(closeForm)

  const rateId = activePlanNode.id ?? activePlanRateCard?.rates[0]?.id ?? 0
  const currentMeterName = (rateMeters[rateId] ?? "").trim()
  const config = planRateMeterConfigs[rateId]

  // Track whether we're creating a new meter (only true after user clicks "Add new")
  const [isCreatingNew, setIsCreatingNew] = useState(false)

  // Initialize config for an already-selected meter (e.g. loaded from a draft)
  useEffect(() => {
    if (!isCreatingNew && currentMeterName && !config) {
      setPlanRateMeterConfigs((prev) => ({
        ...prev,
        [rateId]: {
          name: currentMeterName,
          eventName: "",
          aggregationMethod: aggregationMethodOptions[0],
          eventTimeWindow: eventTimeWindowOptions[0],
          showCountingOptions: false,
          valueKeyOverride: "",
        },
      }))
    }
  }, [currentMeterName, config, isCreatingNew, rateId, aggregationMethodOptions, eventTimeWindowOptions, setPlanRateMeterConfigs])

  // Initialize config when switching to create mode (using useEffect to avoid setState during render)
  useEffect(() => {
    if (isCreatingNew && !config) {
      setPlanRateMeterConfigs((prev) => ({
        ...prev,
        [rateId]: {
          name: "",
          eventName: "",
          aggregationMethod: aggregationMethodOptions[0],
          eventTimeWindow: eventTimeWindowOptions[0],
          showCountingOptions: false,
          valueKeyOverride: "",
        },
      }))
    }
  }, [isCreatingNew, config, rateId, aggregationMethodOptions, eventTimeWindowOptions, setPlanRateMeterConfigs])

  // Handle selecting an existing meter from dropdown
  const handleMeterSelection = (value: string) => {
    setIsCreatingNew(false)
    setRateMeters((prev) => ({ ...prev, [rateId]: value }))
    // Initialize config for the selected meter (shown disabled in the form)
    setPlanRateMeterConfigs((prev) => ({
      ...prev,
      [rateId]: {
        name: value,
        eventName: "",
        aggregationMethod: aggregationMethodOptions[0],
        eventTimeWindow: eventTimeWindowOptions[0],
        showCountingOptions: false,
        valueKeyOverride: "",
      },
    }))
  }

  // Handle clicking "Add new" footer button
  const handleAddNew = () => {
    setIsCreatingNew(true)
    setRateMeters((prev) => ({ ...prev, [rateId]: "" }))
    // Clear config so useEffect re-initializes a fresh blank config
    setPlanRateMeterConfigs((prev) => {
      const { [rateId]: _, ...rest } = prev
      return rest
    })
  }

  // Determine dropdown display value
  const getDropdownValue = () => {
    if (isCreatingNew) {
      // When creating new, show the typed name or "Add new"
      return config?.name?.trim() || t("Add new")
    }
    return currentMeterName
  }

  // Determine if dropdown should show placeholder style
  const isPlaceholderStyle = !currentMeterName && !isCreatingNew

  return (
    <div className="flex flex-col gap-[12px] min-w-0">
      {/* Meter selection dropdown with FormRow label */}
      <FormRow label={t("Meter")} fieldDescriptionId="meter-select">
        <div data-field-description="meter-select">
          <Selector
            ariaLabel={t("Meter")}
            size="sm"
            value={isCreatingNew ? "__creating__" : currentMeterName}
            onChange={handleMeterSelection}
            options={meterOptions}
            getDisplayValue={(value) => {
              if (value === "__creating__") {
                return config?.name?.trim() || t("Add new")
              }
              return value
            }}
            placeholder={t("Select meter")}
            buttonClassName={`h-[30px] justify-between border border-[#D8DEE4] px-[12px] py-[6px] text-[12px] font-[500] leading-[16px] ${
              isPlaceholderStyle ? "text-[#6C7688]" : "text-[#353A44]"
            }`}
            footerLabel={t("Add new")}
            onFooterClick={handleAddNew}
            fullWidth
          />
        </div>
      </FormRow>

      {/* Show meter form when a meter is selected or being created */}
      {config && (
        <MeterForm
          disabled={!isCreatingNew}
          meterName={config.name}
          setMeterName={(next) => {
            const prevName = config.name
            setPlanRateMeterConfigs((prev) => ({
              ...prev,
              [rateId]: { ...prev[rateId]!, name: next },
            }))
            setRateMeters((prev) => ({ ...prev, [rateId]: next }))
            setAvailableMeterOptions((prev) => updateAvailableMeterName(prev, prevName, next))
          }}
          meterEventName={config.eventName}
          setMeterEventName={(next) =>
            setPlanRateMeterConfigs((prev) => ({
              ...prev,
              [rateId]: { ...prev[rateId]!, eventName: next },
            }))
          }
          aggregationMethod={config.aggregationMethod}
          setAggregationMethod={(next) =>
            setPlanRateMeterConfigs((prev) => ({
              ...prev,
              [rateId]: { ...prev[rateId]!, aggregationMethod: next },
            }))
          }
          aggregationMethodOptions={aggregationMethodOptions}
          eventTimeWindow={config.eventTimeWindow}
          setEventTimeWindow={(next) =>
            setPlanRateMeterConfigs((prev) => ({
              ...prev,
              [rateId]: { ...prev[rateId]!, eventTimeWindow: next },
            }))
          }
          eventTimeWindowOptions={eventTimeWindowOptions}
          showCountingOptions={config.showCountingOptions}
          setShowCountingOptions={(next) =>
            setPlanRateMeterConfigs((prev) => ({
              ...prev,
              [rateId]: { ...prev[rateId]!, showCountingOptions: next },
            }))
          }
          valueKeyOverride={config.valueKeyOverride}
          setValueKeyOverride={(next) =>
            setPlanRateMeterConfigs((prev) => ({
              ...prev,
              [rateId]: { ...prev[rateId]!, valueKeyOverride: next },
            }))
          }
          showUnlink={false}
          showSave={false}
          onUnlink={() => undefined}
          onSave={() => undefined}
          onKeyDown={handleEnterToClose}
        />
      )}
    </div>
  )
}
