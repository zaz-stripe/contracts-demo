'use client'

import type { RefObject } from "react"

import { AiSparkleIcon, TrashIcon } from "@/components/ProductCatalogIcons"

type ObjectActionsMenuProps = {
  isOpen: boolean
  menuRef: RefObject<HTMLDivElement | null>
  t: (key: string) => string
  activeObjectForm: "product" | "price" | "meter"
  activePriceId: number | null
  includeObjectActions: boolean
  onClose: () => void
  onDeleteProduct: () => void
  onUnlinkMeter: () => void
  onDeletePrice: (priceId: number) => void
  onOpenAssistant?: () => void
}

export function ObjectActionsMenu({
  isOpen,
  menuRef,
  t,
  activeObjectForm,
  activePriceId,
  includeObjectActions,
  onClose,
  onDeleteProduct,
  onUnlinkMeter,
  onDeletePrice,
  onOpenAssistant,
}: ObjectActionsMenuProps) {
  if (!isOpen) return null

  const widthClass = includeObjectActions ? "w-[220px]" : "w-max"

  return (
    <div
      ref={menuRef}
      className={`absolute right-4 top-[38px] z-50 ${widthClass} overflow-hidden rounded-[6px] border border-[#D8DEE4] bg-white shadow-[0_12px_32px_rgba(28,32,40,0.12)]`}
      role="menu"
      aria-label={t("Object actions")}
    >
      {onOpenAssistant ? (
        <button
          type="button"
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] font-[600] text-[#353A44] hover:bg-[#F5F6F8] transition-colors whitespace-nowrap"
          role="menuitem"
          onClick={() => {
            onClose()
            onOpenAssistant()
          }}
        >
          <AiSparkleIcon className="h-[14px] w-[14px] text-[#474E5A]" />
          {t("Ask for changes")}
        </button>
      ) : null}
      {includeObjectActions ? (
        activeObjectForm === "product" ? (
        <button
          type="button"
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] font-[600] text-[#353A44] hover:bg-[#F5F6F8] transition-colors whitespace-nowrap"
          role="menuitem"
          onClick={() => {
            onClose()
            onDeleteProduct()
          }}
        >
          <TrashIcon />
          {t("Delete product")}
        </button>
      ) : activeObjectForm === "meter" ? (
        <button
          type="button"
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] font-[600] text-[#353A44] hover:bg-[#F5F6F8] transition-colors whitespace-nowrap"
          role="menuitem"
          onClick={() => {
            onClose()
            onUnlinkMeter()
          }}
        >
          {t("Unlink meter")}
        </button>
      ) : (
        <button
          type="button"
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] font-[600] text-[#353A44] hover:bg-[#F5F6F8] transition-colors whitespace-nowrap"
          role="menuitem"
          onClick={() => {
            if (activePriceId == null) return
            onClose()
            onDeletePrice(activePriceId)
          }}
        >
          <TrashIcon />
          {t("Delete price")}
        </button>
      )
      ) : null}
    </div>
  )
}


