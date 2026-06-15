"use client"

import { PriceActionsPopover } from "@/components/PriceActionsPopover"
import type { PriceSummary } from "./priceFormTypes"
import { t } from "./priceFormUtils"

type CollapsedPriceRowProps = {
  price: PriceSummary
  onEdit: (id: number) => void
  onDelete: (id: number) => void
  chipTextClasses: string
}

export function CollapsedPriceRow({ price, onEdit, onDelete, chipTextClasses }: CollapsedPriceRowProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      className="flex w-full items-center justify-between rounded-[8px] border border-[#D8DEE4] bg-[#F8F9FA] px-4 py-3 text-left hover:bg-[#EBEEF1] group cursor-pointer"
      onClick={() => onEdit(price.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onEdit(price.id)
        }
      }}
    >
      <div
        className={`bg-[#EBEEF1] px-3 py-[6px] rounded-full text-[#353A44] flex items-center gap-1 ${chipTextClasses}`}
      >
        <span className="font-[600]">{price.label.split("|")[0]}</span>
        <span className="text-[#6C7688]">•</span>
        <span className="font-[500] text-[#596171]">
          {t("per")} {price.label.split("|")[1]}
        </span>
      </div>
      <PriceActionsPopover
        priceId={price.id}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  )
}
