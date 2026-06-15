'use client'

import type { RefObject } from "react"

import { ChevronLeftIcon, EllipsesIcon } from "@/components/ProductCatalogIcons"
import { ObjectActionsMenu } from "@/components/product-catalog/ObjectActionsMenu"

type ProductFormPanelHeaderProps = {
  title: string
  t: (key: string) => string
  onBack?: () => void
  hasObjectActions: boolean
  isObjectActionsOpen: boolean
  objectActionsButtonRef: RefObject<HTMLButtonElement | null>
  objectActionsMenuRef: RefObject<HTMLDivElement | null>
  onToggleObjectActions: () => void
  activeObjectForm: "product" | "price" | "meter"
  activePriceId: number | null
  onCloseObjectActions: () => void
  onDeleteProduct: () => void
  onUnlinkMeter: () => void
  onDeletePrice: (priceId: number) => void
  onOpenAssistant?: () => void
}

export function ProductFormPanelHeader({
  title,
  t,
  onBack,
  hasObjectActions,
  isObjectActionsOpen,
  objectActionsButtonRef,
  objectActionsMenuRef,
  onToggleObjectActions,
  activeObjectForm,
  activePriceId,
  onCloseObjectActions,
  onDeleteProduct,
  onUnlinkMeter,
  onDeletePrice,
  onOpenAssistant,
}: ProductFormPanelHeaderProps) {
  const showActionsButton = hasObjectActions || Boolean(onOpenAssistant)

  return (
    <div className="relative flex items-center justify-between border-b border-[#EBEEF1] px-4 py-3">
      <div className="flex min-w-0 items-center gap-[8px]">
        {onBack ? (
          <button
            type="button"
            className="2xl:hidden flex h-[28px] w-[28px] items-center justify-center rounded-[6px] bg-[#EBEEF1] text-[#474E5A] transition-colors sm:bg-transparent sm:hover:bg-[#EBEEF1]"
            aria-label={t("Back")}
            onClick={onBack}
          >
            <ChevronLeftIcon />
          </button>
        ) : null}
        <p className="truncate text-[14px] font-[500] text-[#353A44] tracking-[-0.028px]">{title}</p>
      </div>
      {showActionsButton && (
        <>
          <button
            type="button"
            className="flex items-center justify-center rounded-[6px] p-[6px] text-[#474E5A] hover:bg-[#F5F6F8] transition-colors"
            aria-label={t("Object actions")}
            aria-expanded={isObjectActionsOpen}
            ref={objectActionsButtonRef}
            onClick={onToggleObjectActions}
          >
            <EllipsesIcon />
          </button>

          <ObjectActionsMenu
            isOpen={isObjectActionsOpen}
            menuRef={objectActionsMenuRef}
            t={t}
            activeObjectForm={activeObjectForm}
            activePriceId={activePriceId}
            includeObjectActions={hasObjectActions}
            onClose={onCloseObjectActions}
            onDeleteProduct={onDeleteProduct}
            onUnlinkMeter={onUnlinkMeter}
            onDeletePrice={onDeletePrice}
            onOpenAssistant={onOpenAssistant}
          />
        </>
      )}
    </div>
  )
}


