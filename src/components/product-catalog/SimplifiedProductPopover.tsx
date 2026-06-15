'use client'

import { useEffect, type MouseEvent, type ReactNode, type RefObject } from "react"
import { AnimatePresence, motion } from "framer-motion"

type SimplifiedProductPopoverProps = {
  isOpen: boolean
  onClose: () => void
  t: (key: string) => string
  onDiscard: () => void
  onSubmit: () => void
  onOpenFullSettings: () => void
  submitLabel: string
  title?: string
  formContent: ReactNode
  containerRef?: RefObject<HTMLDivElement | null>
}

export function SimplifiedProductPopover({
  isOpen,
  onClose,
  t,
  onDiscard,
  onSubmit,
  onOpenFullSettings,
  submitLabel,
  title,
  formContent,
  containerRef,
}: SimplifiedProductPopoverProps) {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="simplified-modal"
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/20 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12, ease: "easeOut" }}
          role="dialog"
          aria-modal="true"
          aria-label={t("Create product")}
          onClick={(e: MouseEvent<HTMLDivElement>) => {
            if (e.target === e.currentTarget) onClose()
          }}
        >
          <motion.div
            ref={containerRef}
            className="flex w-[480px] max-h-[85vh] flex-col overflow-hidden rounded-[12px] border border-[#EBEEF1] bg-white shadow-[0px_50px_100px_0px_rgba(48,49,61,0.08),0px_15px_35px_0px_rgba(48,49,61,0.08),0px_5px_15px_0px_rgba(0,0,0,0.12)]"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-[24px] pt-[24px]">
              <p className="text-[16px] font-[600] leading-[24px] text-[#1A1A1A]">
                {title ?? t("New product")}
              </p>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">{formContent}</div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-[12px] border-t border-[#EBEEF1] px-[24px] py-[16px]">
              <button
                type="button"
                className="h-[36px] rounded-[6px] border border-[#D8DEE4] bg-white px-[16px] text-[13px] font-[600] text-[#353A44] shadow-[0px_1px_1px_rgba(33,37,44,0.08)] hover:bg-[#F5F6F8] transition-colors"
                onClick={onDiscard}
              >
                {t("Discard")}
              </button>
              <button
                type="button"
                className="h-[36px] rounded-[6px] bg-[#675DFF] px-[16px] text-[13px] font-[600] text-white shadow-[0px_1px_1px_rgba(47,14,99,0.32)] hover:bg-[#5B52F0] transition-colors"
                onClick={onSubmit}
              >
                {submitLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
