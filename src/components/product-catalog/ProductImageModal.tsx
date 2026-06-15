'use client'

import { AnimatePresence, motion } from "framer-motion"

import { CloseIcon } from "@/components/ProductCatalogIcons"

type ProductImageModalProps = {
  imageUrl: string | null
  isOpen: boolean
  t: (key: string) => string
  onClose: () => void
}

export function ProductImageModal({ imageUrl, isOpen, t, onClose }: ProductImageModalProps) {
  if (!imageUrl) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="image-modal"
          className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(9,12,20,0.65)] px-4 py-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12, ease: "easeOut" }}
        >
          <motion.div
            className="relative max-h-[80vh] max-w-[80vw] rounded-[12px] bg-white p-4 shadow-[0_25px_80px_rgba(15,23,42,0.35)]"
            role="dialog"
            aria-modal="true"
            aria-label={t("Product image preview")}
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.985, y: 4 }}
            transition={{ type: "spring", stiffness: 340, damping: 30, mass: 0.7 }}
          >
            <button
              type="button"
              className="absolute right-3 top-3 flex items-center justify-center rounded-[6px] p-2 text-[#474E5A] hover:bg-[#F5F6F8] transition-colors"
              aria-label={t("Close image preview")}
              onClick={onClose}
            >
              <CloseIcon />
            </button>
            <img src={imageUrl} alt={t("Product")} className="max-h-[70vh] max-w-[70vw] rounded-[8px] object-contain" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}


