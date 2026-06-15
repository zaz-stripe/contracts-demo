"use client"

import { FormRow } from "@/components/FormRow"
import { Selector } from "@/components/Selector"
import type { PlanFormContext } from "./planFormTypes"

const serviceIntervalOptions = ["Monthly", "Yearly", "Custom"]

type PriceGroupFormProps = {
  ctx: PlanFormContext
  priceGroupId: number
  priceGroupName: string
  priceGroupServiceInterval: string
  onChangeName: (value: string) => void
  onChangeServiceInterval: (value: string) => void
}

export function PriceGroupForm({ ctx, priceGroupId, priceGroupName, priceGroupServiceInterval, onChangeName, onChangeServiceInterval }: PriceGroupFormProps) {
  const { t, textFieldInputClasses } = ctx

  return (
    <div className="flex flex-col gap-[12px] min-w-0">
      <FormRow label={t("Display name")} fieldDescriptionId="pricegroup-name">
        <div data-field-description="pricegroup-name" className="w-full">
          <input
            className={textFieldInputClasses}
            placeholder={t("e.g. Enterprise Bundle")}
            value={priceGroupName}
            onChange={(e) => onChangeName(e.target.value)}
          />
        </div>
      </FormRow>
      <FormRow label={t("Service interval")} fieldDescriptionId="pricegroup-service-interval">
        <div data-field-description="pricegroup-service-interval" className="w-full">
          <Selector
            ariaLabel={t("Service interval")}
            size="sm"
            value={priceGroupServiceInterval}
            onChange={onChangeServiceInterval}
            options={serviceIntervalOptions}
            getDisplayValue={t}
            fullWidth
            buttonClassName="h-[32px] w-full justify-between rounded-[6px] border border-[#D8DEE4] px-[8px] text-[12px] font-[500] text-[#353A44]"
          />
        </div>
      </FormRow>
    </div>
  )
}
