'use client'

import { AiSparkleIcon, ExitIcon } from "@/components/ProductCatalogIcons"
import { cn } from "@/lib/utils"

type ProductModalHeaderProps = {
  title: string
  t: (key: string) => string
  status: "draft" | "live"

  customerPreviewMode: string
  setCustomerPreviewMode: (next: string) => void

  isAssistantOpen: boolean
  onToggleAssistant: () => void
  onDiscard: () => void
  onSaveDraft: () => void
  onSubmit: () => void
  submitLabel: string
  /** When true, show a simplified header (title + discard/submit only) */
  simplified?: boolean
}

export function ProductModalHeader({
  title,
  t,
  status,
  customerPreviewMode,
  setCustomerPreviewMode,
  isAssistantOpen,
  onToggleAssistant,
  onDiscard,
  onSaveDraft,
  onSubmit,
  submitLabel,
  simplified,
}: ProductModalHeaderProps) {
  if (simplified) {
    return (
      <div className="relative z-10 flex items-center justify-between border-b border-[#EBEEF1] bg-white px-[16px] py-[10px]">
        <p className="text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#1A1A1A]">
          {title}
        </p>
        <div className="flex items-center gap-[10px]">
          <button
            type="button"
            className="h-[28px] rounded-[6px] border border-[#D8DEE4] bg-white px-[10px] py-[6px] text-[12px] font-[600] leading-[14px] tracking-[-0.024px] text-[#353A44] shadow-[0_1px_1px_rgba(33,37,44,0.16)] transition-colors hover:bg-[#F5F6F8]"
            onClick={onDiscard}
          >
            {t("Discard")}
          </button>
          <button
            type="button"
            className="h-[28px] whitespace-nowrap rounded-[6px] bg-[#675DFF] px-[10px] py-[6px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-white shadow-[0_1px_1px_rgba(47,14,99,0.32)] transition-colors hover:bg-[#5B52F0]"
            onClick={onSubmit}
          >
            {submitLabel}
          </button>
        </div>
      </div>
    )
  }

  const segmentedOptions = ["Map", "Preview", "Code"] as const
  const previewMode = segmentedOptions.includes(customerPreviewMode as any)
    ? (customerPreviewMode as (typeof segmentedOptions)[number])
    : "Preview"

  const statusLabel = status === "live" ? t("Live") : t("Draft")
  const statusClassName = status === "live" ? "bg-[#E4FAE7]" : "bg-[#E2FBFE]"

  return (
    <div className="relative z-10 flex items-center justify-between border-b border-[#EBEEF1] bg-white px-[16px] py-[10px]">
      <div className="flex min-w-0 items-center gap-[16px]">
        <button
          type="button"
          className="flex h-[28px] w-[28px] items-center justify-center rounded-[6px] text-[#474E5A] transition-colors hover:bg-[#F5F6F8]"
          aria-label={t("Exit")}
          onClick={onDiscard}
        >
          <ExitIcon className="h-[14px] w-[15px] shrink-0" />
        </button>

        <div className="flex min-w-0 items-center gap-[8px]">
          <p className="min-w-0 truncate text-[12px] font-[500] leading-[20px] tracking-[-0.15px] text-[#353A44] pt-[1px]">
            {title}
          </p>
          <div
            className={cn(
              "flex h-[20px] items-center overflow-hidden rounded-[6px] px-[6px] text-[12px] font-[500] leading-[20px] tracking-[-0.15px] text-[#353A44]",
              statusClassName
            )}
          >
            {statusLabel}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center overflow-hidden rounded-[6px] bg-[#EBEEF1]">
        {segmentedOptions.map((option) => {
          const isSelected = option === previewMode
          return (
            <button
              key={option}
              type="button"
              onClick={() => setCustomerPreviewMode(option)}
              className={cn(
                "rounded-[4px] border border-transparent px-[8px] py-[6px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] transition-colors",
                isSelected
                  ? "rounded-[6px] border-[#D8DEE4] bg-white text-[#353A44]"
                  : "text-[#596171] hover:bg-[#D8DEE4]"
              )}
              aria-pressed={isSelected}
            >
              {t(option)}
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-[10px]">
        <button
          type="button"
          className={cn(
            "flex h-[28px] w-[28px] items-center justify-center rounded-[6px] text-[#474E5A] transition-colors",
            isAssistantOpen ? "bg-[#F5F6F8]" : "bg-transparent hover:bg-[#F5F6F8]"
          )}
          aria-label={isAssistantOpen ? t("Close assistant") : t("Open assistant")}
          aria-pressed={isAssistantOpen}
          onClick={onToggleAssistant}
        >
          <AiSparkleIcon className="h-[16px] w-[16px] shrink-0" />
        </button>
        <button
          type="button"
          className="h-[28px] rounded-[6px] border border-[#D8DEE4] bg-white px-[10px] py-[6px] text-[12px] font-[600] leading-[14px] tracking-[-0.024px] text-[#353A44] shadow-[0_1px_1px_rgba(33,37,44,0.16)] transition-colors hover:bg-[#F5F6F8]"
          onClick={onSaveDraft}
        >
          {t("Save draft")}
        </button>
        <button
          type="button"
          className="h-[28px] whitespace-nowrap rounded-[6px] bg-[#675DFF] px-[10px] py-[6px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-white shadow-[0_1px_1px_rgba(47,14,99,0.32)] transition-colors hover:bg-[#5B52F0]"
          onClick={onSubmit}
        >
          {submitLabel}
        </button>
      </div>
    </div>
  )
}
