'use client'

import { AnimatePresence, motion } from "framer-motion"
import { useEffect } from "react"
import { PriceFormSection } from "@/components/PriceFormSection/PriceFormSection"
import type { PriceFormSectionProps } from "@/components/PriceFormSection/priceFormTypes"

type AddPriceModalProps = {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  priceFormProps: Omit<PriceFormSectionProps, 'collapsedPrices' | 'onEditCollapsedPrice' | 'onDeleteCollapsedPrice' | 'showTopBar' | 'onAddPrice'>
}

export function AddPriceModal({ isOpen, onClose, onSave, priceFormProps }: AddPriceModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation()
        onClose()
      }
    }
    document.addEventListener("keydown", handleKeyDown, true)
    return () => document.removeEventListener("keydown", handleKeyDown, true)
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="add-price-modal"
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        >
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <motion.div
            className="relative z-10 flex max-h-[85vh] w-full max-w-[480px] flex-col overflow-hidden rounded-[12px] bg-white shadow-[0_24px_48px_rgba(0,0,0,0.16),0_8px_16px_rgba(0,0,0,0.08)]"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <div className="flex items-center justify-between border-b border-[#EBEEF1] px-5 py-4">
              <h2 className="text-[15px] font-[600] text-[#353A44]">Add another price</h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-[28px] w-[28px] items-center justify-center rounded-[6px] text-[#6C7688] hover:bg-[#F5F6F8] transition-colors"
                aria-label="Close"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-1">
              <PriceFormSection
                {...priceFormProps}
                collapsedPrices={[]}
                onEditCollapsedPrice={() => {}}
                onDeleteCollapsedPrice={() => {}}
                showTopBar={false}
                onAddPrice={() => {}}
              />
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[#EBEEF1] px-5 py-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-[6px] border border-[#D8DEE4] bg-white px-3 py-2 text-[13px] font-medium leading-[15px] text-[#353A44] hover:bg-[#F5F6F8] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onSave}
                className="rounded-[6px] bg-[#675DFF] px-3 py-2 text-[13px] font-medium leading-[15px] text-white hover:bg-[#5A51E0] transition-colors"
              >
                Save price
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
