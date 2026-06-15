'use client'

import type { ReactNode, RefObject } from "react"
import type { LayoutMode } from "@/components/product-catalog/layoutMode"

type PricingPlanModalHeaderProps = {
  t: (key: string) => string
  title: string
  status: "draft" | "live"

  customerPreviewMode: string
  setCustomerPreviewMode: (next: string) => void

  layoutMode?: LayoutMode

  isPlanAssistantOpen: boolean
  onToggleAssistant: () => void

  isCodePopoverOpen?: boolean
  onToggleCodePopover?: () => void
  codeViewContent?: ReactNode

  onDiscard: () => void
  onSaveDraft: () => void
  onCreate: () => void
  createLabel: string
  /** When true, the primary create button is disabled. */
  createDisabled?: boolean

  /** When true, cross-fade the normal header content out and the bulk edit content in. */
  isBulkEditMode?: boolean
  /** Title shown during bulk edit (e.g. "Editing 57 rates in AI Model Usage") */
  bulkEditTitle?: string
  /** Back callback for bulk edit mode */
  onBulkEditBack?: () => void
  // Breadcrumb / navigation props (for the non-bulk-edit header bar)
  nodeLabel?: string
  parentLabel?: string
  onNavigateToParent?: () => void
  isTreeNavOpen?: boolean
  onToggleTreeNav?: () => void
  hamburgerButtonRef?: RefObject<HTMLButtonElement | null>
  hasTreeChanges?: boolean
  onDismissNavHint?: () => void
  // Breadcrumb hierarchy
  nodeType?: string
  onNavigateToPlan?: () => void
  // Add item button in breadcrumb area
  formAddButtonRef?: RefObject<HTMLButtonElement | null>
  onToggleAddPlanObject?: () => void
  onDismissGetStarted?: () => void
}

export function PricingPlanModalHeader({
  t,
  title,
  createLabel,
  createDisabled,
  onDiscard,
  onCreate,
  isBulkEditMode,
  bulkEditTitle,
  onBulkEditBack,
  nodeLabel,
  parentLabel,
  onNavigateToParent,
  isTreeNavOpen,
  onToggleTreeNav,
  hamburgerButtonRef,
  hasTreeChanges,
  onDismissNavHint,
  nodeType,
  onNavigateToPlan,
  formAddButtonRef,
  onToggleAddPlanObject,
  onDismissGetStarted,
}: PricingPlanModalHeaderProps) {
  const secondaryButtonClass = "flex h-[26px] items-center rounded-[6px] border border-[#D4DEE9] bg-white px-[8px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#273951] transition-colors hover:bg-[#F5F6F8]"
  const primaryButtonClass = "flex h-[26px] items-center whitespace-nowrap rounded-[6px] border border-[#533AFD] bg-[#533AFD] px-[8px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-white transition-colors hover:bg-[#4730E0]"
  const primaryButtonDisabledClass = "flex h-[26px] items-center whitespace-nowrap rounded-[6px] border border-[#A99CFE] bg-[#A99CFE] px-[8px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-white cursor-not-allowed"
  const transitionClass = "transition-all duration-200 ease-out"

  return (
    <div className="relative z-10 border-b border-[#ECF1F6] bg-white px-[16px] py-[12px]">
      <div className="relative flex items-center justify-between gap-[12px]">
        <div className="relative min-w-0 flex-1">
          <div
            className={`${transitionClass} flex min-w-0 items-center gap-[8px] ${
              isBulkEditMode ? "pointer-events-none translate-y-[2px] opacity-0 blur-[6px]" : "translate-y-0 opacity-100 blur-0"
            }`}
          >
            <p className="truncate text-[14px] font-[500] leading-[20px] tracking-[-0.15px] text-[#1A2C44]">{title}</p>
            <button
              ref={formAddButtonRef}
              type="button"
              data-onboarding="plus-button"
              className="flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-[6px] border border-[#D4DEE9] bg-white transition-colors hover:bg-[#F5F6F8]"
              aria-label={t("Add item")}
              onClick={() => { onToggleAddPlanObject?.(); onDismissGetStarted?.() }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6.7 0.85C6.7 0.380558 6.31944 0 5.85 0C5.38056 0 5 0.380558 5 0.85V5H0.85C0.380558 5 0 5.38056 0 5.85C0 6.31944 0.380558 6.7 0.85 6.7H5V10.85C5 11.3194 5.38056 11.7 5.85 11.7C6.31944 11.7 6.7 11.3194 6.7 10.85V6.7H10.85C11.3194 6.7 11.7 6.31944 11.7 5.85C11.7 5.38056 11.3194 5 10.85 5H6.7V0.85Z" fill="#3C4F69"/>
              </svg>
            </button>
          </div>
          <div
            className={`${transitionClass} pointer-events-none absolute inset-0 flex min-w-0 items-center ${
              isBulkEditMode ? "translate-y-0 opacity-100 blur-0" : "-translate-y-[2px] opacity-0 blur-[6px]"
            }`}
          >
            <p className="min-w-0 truncate text-[14px] font-[500] leading-[20px] tracking-[-0.15px] text-[#1A2C44]">
              {bulkEditTitle}
            </p>
          </div>
        </div>

        <div className="relative grid shrink-0 justify-items-end">
          <div
            className={`${transitionClass} col-start-1 row-start-1 flex items-center gap-[8px] ${
              isBulkEditMode ? "pointer-events-none translate-y-[2px] opacity-0 blur-[6px]" : "translate-y-0 opacity-100 blur-0"
            }`}
          >
            <button
              type="button"
              className={secondaryButtonClass}
              onClick={onDiscard}
            >
              {t("Discard")}
            </button>
            <button
              type="button"
              className={createDisabled ? primaryButtonDisabledClass : primaryButtonClass}
              onClick={onCreate}
              disabled={createDisabled}
              aria-disabled={createDisabled}
            >
              {createLabel}
            </button>
          </div>
          <div
            className={`${transitionClass} col-start-1 row-start-1 flex items-center gap-[8px] ${
              isBulkEditMode ? "opacity-100 blur-0" : "pointer-events-none opacity-0 blur-[6px]"
            }`}
          >
            <button
              type="button"
              className={secondaryButtonClass}
              onClick={onBulkEditBack}
            >
              {t("Cancel")}
            </button>
            <button
              type="button"
              className={primaryButtonClass}
              onClick={onBulkEditBack}
            >
              {t("Done")}
            </button>
          </div>
          <div className="invisible col-start-1 row-start-1 flex items-center gap-[8px] pointer-events-none">
            <span className={secondaryButtonClass}>{t("Cancel")}</span>
            <span className={primaryButtonClass}>{t("Done")}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
