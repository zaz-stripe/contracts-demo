'use client'

import type { RefObject } from "react"

type ProductCatalogHeaderRowProps = {
  t: (key: string) => string
  addProductButtonRef: RefObject<HTMLButtonElement | null>
  onAddPricingPlan: () => void
}

export function ProductCatalogHeaderRow({
  t,
  addProductButtonRef,
  onAddPricingPlan,
}: ProductCatalogHeaderRowProps) {
  return (
    <div className="flex items-center justify-between">
      <p
        className="text-[28px] font-bold tracking-[-0.56px] text-[#0D111A]"
        style={{
          fontFamily: '"SF Pro Text", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        {t("Usage based billing")}
      </p>
      <button
        ref={addProductButtonRef}
        type="button"
        className="rounded-[6px] bg-[#675DFF] px-3 py-2 text-[13px] font-[500] text-white shadow-[0_1px_1px_rgba(47,14,99,0.32)] hover:bg-[#5B52F0] transition-colors"
        aria-label={t("Add pricing plan")}
        onClick={onAddPricingPlan}
      >
        {t("Add pricing plan")}
      </button>
    </div>
  )
}


