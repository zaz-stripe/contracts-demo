'use client'

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

type AddOption = { kind: string; label: string }

type ObjectTab = {
  id: string
  kind: string
  label: string
}

type SimpleCreationHeaderProps = {
  title: string
  onDiscard: () => void
  onSubmit: () => void
  submitLabel: string
  discardLabel?: string
  addOptions?: AddOption[]
  onAddObject?: (kind: string) => void
  /** Object tabs to render in the header */
  tabs?: ObjectTab[]
  activeTabId?: string | null
  onSelectTab?: (id: string) => void
  /** Object IDs that have validation errors */
  errorTabIds?: Set<string>
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
          className="flex w-full items-center gap-[8px] px-[12px] py-[6px] text-left text-[12px] font-[500] text-[#353A44] transition-colors hover:bg-[#F5F6F8]"
          onClick={() => {
            onSelect(opt.kind)
            onClose()
          }}
        >
          <span>{opt.label}</span>
        </button>
      ))}
    </motion.div>
  )
}

export function SimpleCreationHeader({
  title,
  onDiscard,
  onSubmit,
  submitLabel,
  discardLabel = "Discard",
  addOptions,
  onAddObject,
  tabs,
  activeTabId,
  onSelectTab,
  errorTabIds,
}: SimpleCreationHeaderProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)

  const secondaryButtonClass =
    "flex h-[26px] items-center rounded-[6px] border border-[#D4DEE9] bg-white px-[8px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#273951] transition-colors hover:bg-[#F5F6F8]"
  const primaryButtonClass =
    "flex h-[26px] items-center whitespace-nowrap rounded-[6px] border border-[#533AFD] bg-[#533AFD] px-[8px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-white transition-colors hover:bg-[#4730E0]"

  const hasTabs = tabs && tabs.length > 1
  const showAddButton = addOptions && addOptions.length > 0 && onAddObject

  return (
    <div className="relative z-10 flex items-center justify-between border-b border-[#ECF1F6] bg-white px-[16px] py-[12px]">
      <div className="flex min-w-0 items-center gap-[8px]">
        {hasTabs ? (
          <>
            {tabs.map((tab) => {
              const isActive = tab.id === activeTabId
              const hasError = errorTabIds?.has(tab.id)
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`flex items-center overflow-hidden rounded-[6px] px-[8px] py-[2px] text-[14px] font-[500] leading-[20px] tracking-[-0.15px] transition-colors ${
                    hasError
                      ? isActive
                        ? "border border-[#E53E3E] bg-[#1A2C44] text-white"
                        : "border border-[#E53E3E]/40 text-[#E53E3E]"
                      : isActive
                        ? "bg-[#1A2C44] text-[#F4F7FA]"
                        : "border border-[#D4DEE9] text-[#1A2C44] hover:bg-[#F5F6F8]"
                  }`}
                  onClick={() => onSelectTab?.(tab.id)}
                >
                  {tab.label}
                </button>
              )
            })}
          </>
        ) : (
          <p className="truncate text-[14px] font-[500] leading-[20px] tracking-[-0.15px] text-[#1A2C44]">
            {title}
          </p>
        )}

        {showAddButton && (
          <div className="relative">
            <button
              type="button"
              className="flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-[6px] border border-[#D4DEE9] bg-white transition-colors hover:bg-[#F5F6F8]"
              onClick={() => setIsPopoverOpen(!isPopoverOpen)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6.7 0.85C6.7 0.380558 6.31944 0 5.85 0C5.38056 0 5 0.380558 5 0.85V5H0.85C0.380558 5 0 5.38056 0 5.85C0 6.31944 0.380558 6.7 0.85 6.7H5V10.85C5 11.3194 5.38056 11.7 5.85 11.7C6.31944 11.7 6.7 11.3194 6.7 10.85V6.7H10.85C11.3194 6.7 11.7 6.31944 11.7 5.85C11.7 5.38056 11.3194 5 10.85 5H6.7V0.85Z" fill="#3C4F69"/>
              </svg>
            </button>
            <AnimatePresence>
              {isPopoverOpen && (
                <AddObjectPopover
                  options={addOptions!}
                  onSelect={onAddObject!}
                  onClose={() => setIsPopoverOpen(false)}
                />
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="flex items-center gap-[8px]">
        <button type="button" className={secondaryButtonClass} onClick={onDiscard}>
          {discardLabel}
        </button>
        <button type="button" className={primaryButtonClass} onClick={onSubmit}>
          {submitLabel}
        </button>
      </div>
    </div>
  )
}
