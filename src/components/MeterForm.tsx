'use client'

import type { KeyboardEvent } from "react"
import { Selector } from "@/components/Selector"
import { FormRow } from "@/components/FormRow"

const inputClasses =
  "h-[32px] w-full rounded-[6px] border border-[#D8DEE4] bg-white p-[8px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] placeholder:text-[#6C7688] outline-none hover:border-[#B6C0CD] focus:border-[#A0D0F7] focus:shadow-[0_0_0_1.5px_#A0D0F7] transition-all"

const disabledInputClasses =
  "h-[32px] w-full rounded-[6px] border border-[#E3E8EE] bg-[#F5F6F8] p-[8px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#7D8BA4] placeholder:text-[#7D8BA4] outline-none cursor-default"

const selectorButtonClass = "h-[32px] w-full px-[12px] py-[8px] text-[12px] leading-[16px] tracking-[-0.024px]"
const disabledSelectorButtonClass = "h-[32px] w-full px-[12px] py-[8px] text-[12px] leading-[16px] tracking-[-0.024px] bg-[#F5F6F8] text-[#7D8BA4] border-[#E3E8EE] pointer-events-none"

type MeterFormProps = {
  meterName: string
  setMeterName: (next: string) => void
  meterEventName: string
  setMeterEventName: (next: string) => void
  aggregationMethod: string
  setAggregationMethod: (next: string) => void
  aggregationMethodOptions: string[]
  eventTimeWindow: string
  setEventTimeWindow: (next: string) => void
  eventTimeWindowOptions: string[]
  showCountingOptions: boolean
  setShowCountingOptions: (next: boolean) => void
  valueKeyOverride: string
  setValueKeyOverride: (next: string) => void
  showUnlink?: boolean
  onUnlink: () => void
  showSave?: boolean
  onSave: () => void
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void
  /** When true, all fields except name are read-only/disabled */
  disabled?: boolean
}

export function MeterForm({
  meterName,
  setMeterName,
  meterEventName,
  setMeterEventName,
  aggregationMethod,
  setAggregationMethod,
  aggregationMethodOptions,
  eventTimeWindow,
  setEventTimeWindow,
  eventTimeWindowOptions,
  showCountingOptions,
  setShowCountingOptions,
  valueKeyOverride,
  setValueKeyOverride,
  showUnlink = true,
  showSave = true,
  onUnlink,
  onSave,
  onKeyDown,
  disabled = false,
}: MeterFormProps) {
  const t = (key: string) => key

  return (
    <div className="w-full">
      <div className="flex flex-col gap-[16px] bg-white">
        <FormRow label={t("Name")} fieldDescriptionId="meter-name">
          <div data-field-description="meter-name">
            <input
              className={inputClasses}
              value={meterName}
              onChange={(e) => setMeterName(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={t("e.g. API Requests")}
              aria-label={t("Meter name")}
            />
          </div>
        </FormRow>

        <FormRow label={t("Event name")} fieldDescriptionId="meter-event-name">
          <div data-field-description="meter-event-name">
            <input
              className={disabled ? disabledInputClasses : inputClasses}
              value={meterEventName}
              onChange={disabled ? undefined : (e) => setMeterEventName(e.target.value)}
              onKeyDown={disabled ? undefined : onKeyDown}
              placeholder={t("e.g. api_requests")}
              aria-label={t("Event name")}
              readOnly={disabled}
            />
          </div>
        </FormRow>

        <FormRow label={t("Aggregation method")} fieldDescriptionId="meter-aggregation">
          <div data-field-description="meter-aggregation">
            <Selector
              ariaLabel={t("Aggregation method")}
              options={aggregationMethodOptions}
              value={aggregationMethod}
              onChange={setAggregationMethod}
              size="sm"
              fullWidth
              buttonClassName={disabled ? disabledSelectorButtonClass : selectorButtonClass}
            />
          </div>
        </FormRow>

        <FormRow label={t("Event period")} fieldDescriptionId="meter-time-window">
          <div data-field-description="meter-time-window">
            <Selector
              ariaLabel={t("Event period")}
              options={eventTimeWindowOptions}
              value={eventTimeWindow}
              onChange={setEventTimeWindow}
              size="sm"
              fullWidth
              buttonClassName={disabled ? disabledSelectorButtonClass : selectorButtonClass}
            />
          </div>
        </FormRow>

        <FormRow
          label={t("Counting options")}
          fieldDescriptionId="meter-counting-options"
          rightWidthPx={null}
        >
          <div data-field-description="meter-counting-options">
            <label className={`inline-flex items-center gap-2 ${disabled ? "pointer-events-none" : "cursor-pointer"}`}>
              <input
                type="checkbox"
                className="h-[14px] w-[14px]"
                checked={showCountingOptions}
                onChange={disabled ? undefined : (e) => setShowCountingOptions(e.target.checked)}
                aria-label={t("Enable counting options")}
                readOnly={disabled}
              />
              <span className={`text-[12px] font-[600] leading-[16px] tracking-[-0.024px] ${disabled ? "text-[#7D8BA4]" : "text-[#596171]"}`}>
                {t("Enable")}
              </span>
            </label>
          </div>
        </FormRow>

        {showCountingOptions && (
          <FormRow label={t("Value key override")} fieldDescriptionId="meter-value-key">
            <div data-field-description="meter-value-key">
              <input
                className={disabled ? disabledInputClasses : inputClasses}
                value={valueKeyOverride}
                onChange={disabled ? undefined : (e) => setValueKeyOverride(e.target.value)}
                onKeyDown={disabled ? undefined : onKeyDown}
                placeholder={t("e.g. tokens")}
                aria-label={t("Value key override")}
                readOnly={disabled}
              />
            </div>
          </FormRow>
        )}

        {showUnlink && (
          <FormRow label={t("Unlink")} rightWidthPx={null}>
            <button
              type="button"
              className="text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#533AFD] hover:underline"
              onClick={onUnlink}
            >
              {t("Unlink meter")}
            </button>
          </FormRow>
        )}
      </div>

      {showSave && (
        <div className="mt-4 flex items-center justify-between border-t border-[#EBEEF1] px-4 pt-4">
          <button
            type="button"
            className="inline-flex h-[28px] items-center justify-center rounded-[6px] border border-[#D8DEE4] bg-white px-[8px] text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#353A44] shadow-[0_1px_1px_rgba(33,37,44,0.16)] hover:bg-[#F5F6F8] transition-colors"
            onClick={onSave}
          >
            {t("Save meter")}
          </button>
        </div>
      )}
    </div>
  )
}


