'use client'

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

import { ExitIcon } from "@/components/ProductCatalogIcons"

type AddOption = { kind: string; label: string; description?: string }

type SimpleCreationHeaderProps = {
  title: string
  submitLabel: string
  discardLabel?: string
  onClose: () => void
  onSubmit: () => void
  addOptions?: AddOption[]
  onAddObject?: (kind: string) => void
}

function AddObjectPopover({
  options,
  onSelect,
  onClose,
}: {
  options: AddOption[]
  onSelect: (kind: string) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [onClose])

  return (
    <motion.div
      ref={ref}
      className="absolute left-0 top-full z-50 mt-[4px] min-w-[180px] rounded-[8px] border border-[#E3E8EF] bg-white py-[4px] shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
    >
      {options.map((opt) => (
        <button
          key={opt.kind}
          type="button"
          className="flex w-full flex-col items-start gap-[2px] px-[12px] py-[8px] text-left transition-colors hover:bg-[#F5F6F8]"
          onClick={() => {
            onSelect(opt.kind)
            onClose()
          }}
        >
          <span className="text-[12px] font-[500] text-[#353A44]">{opt.label}</span>
          {opt.description ? (
            <span className="text-[11px] leading-[14px] text-[#6C7688]">{opt.description}</span>
          ) : null}
        </button>
      ))}
    </motion.div>
  )
}

export function SimpleCreationHeader({
  title,
  submitLabel,
  discardLabel = "Discard",
  onClose,
  onSubmit,
  addOptions,
  onAddObject,
}: SimpleCreationHeaderProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)

  const secondaryButtonClass =
    "flex h-[26px] items-center rounded-[6px] border border-[#D4DEE9] bg-white px-[8px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#273951] transition-colors hover:bg-[#F5F6F8]"
  const primaryButtonClass =
    "flex h-[26px] items-center whitespace-nowrap rounded-[6px] border border-[#533AFD] bg-[#533AFD] px-[8px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-white transition-colors hover:bg-[#4730E0]"

  return (
    <div className="relative z-10 flex items-center justify-between border-b border-[#EBEEF1] bg-white px-[16px] py-[10px]">
      <div className="flex min-w-0 items-center gap-[16px]">
        <button
          type="button"
          className="flex h-[28px] w-[28px] items-center justify-center rounded-[6px] text-[#474E5A] transition-colors hover:bg-[#F5F6F8]"
          aria-label="Exit"
          onClick={onClose}
        >
          <ExitIcon className="h-[14px] w-[15px] shrink-0" />
        </button>

        <div className="flex min-w-0 items-center gap-[8px]">
          <p className="min-w-0 truncate pt-[1px] text-[12px] font-[500] leading-[20px] tracking-[-0.15px] text-[#353A44]">
            {title}
          </p>
          <div className="flex h-[20px] items-center overflow-hidden rounded-[6px] bg-[#E2FBFE] px-[6px] text-[12px] font-[500] leading-[20px] tracking-[-0.15px] text-[#353A44]">
            Draft
          </div>

          {addOptions && addOptions.length > 0 && onAddObject && (
            <div className="relative">
              <button
                type="button"
                className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-[5px] border border-dashed border-[#C6CDD8] text-[#6C7688] transition-colors hover:border-[#533AFD] hover:text-[#533AFD]"
                onClick={() => setIsPopoverOpen(!isPopoverOpen)}
              >
                <svg width="9" height="9" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 1V9M1 5H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
              <AnimatePresence>
                {isPopoverOpen && (
                  <AddObjectPopover
                    options={addOptions}
                    onSelect={onAddObject}
                    onClose={() => setIsPopoverOpen(false)}
                  />
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-[8px]">
        <button type="button" className={secondaryButtonClass} onClick={onClose}>
          {discardLabel}
        </button>
        <button type="button" className={primaryButtonClass} onClick={onSubmit}>
          {submitLabel}
        </button>
      </div>
    </div>
  )
}
