'use client'

import { useState, useRef, useEffect } from "react"

const labelClass = "text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#3C4F69]"
const inputClass =
  "h-[32px] w-full rounded-[6px] border border-[#D4DEE9] bg-white px-[10px] text-[13px] font-[400] text-[#353A44] placeholder:text-[#9CA3B0] outline-none transition-colors focus:border-[#533AFD] focus:ring-1 focus:ring-[#533AFD]/20"
const errorInputClass =
  "h-[32px] w-full rounded-[6px] border border-[#DF1B41] bg-[#FFF5F5] px-[10px] text-[13px] font-[400] text-[#353A44] placeholder:text-[#9CA3B0] outline-none transition-colors focus:border-[#DF1B41] focus:ring-1 focus:ring-[#DF1B41]/20"

function ChevronDownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <path d="M3 4.5L6 7.5L9 4.5" stroke="#6C7688" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export type EntityItem = {
  id: string
  name: string
  detail?: string
}

type EntityDropdownProps = {
  label: string
  placeholder: string
  searchPlaceholder: string
  items: EntityItem[]
  selectedId: string
  /** Custom display label when selected item is not in items list (e.g. newly created) */
  selectedLabel?: string
  onSelect: (id: string) => void
  addNewLabel: string
  onAddNew: () => void
  hasError?: boolean
  errorMessage?: string
}

export function EntityDropdown({
  label,
  placeholder,
  searchPlaceholder,
  items,
  selectedId,
  selectedLabel,
  onSelect,
  addNewLabel,
  onAddNew,
  hasError,
  errorMessage,
}: EntityDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setSearch("")
      }
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [isOpen])

  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  )

  const selected = items.find((item) => item.id === selectedId)
  const displayText = selected ? selected.name : selectedLabel || ""
  const hasSelection = !!(selected || selectedLabel)
  const ic = hasError ? errorInputClass : inputClass

  return (
    <div className="flex flex-col gap-[4px]" ref={containerRef}>
      {label && <label className={labelClass}>{label}</label>}
      <div className="relative">
        {isOpen ? (
          <input
            ref={inputRef}
            className={ic}
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        ) : (
          <button
            type="button"
            className={`${ic} flex items-center justify-between text-left`}
            onClick={() => {
              setIsOpen(true)
              setTimeout(() => inputRef.current?.focus(), 0)
            }}
          >
            <span className={hasSelection ? "text-[#353A44]" : "text-[#9CA3B0]"}>
              {hasSelection ? displayText : placeholder}
            </span>
            <ChevronDownIcon />
          </button>
        )}

        {isOpen && (
          <div className="absolute left-0 right-0 top-[36px] z-50 rounded-[8px] border border-[#E3E8EF] bg-white py-[4px] shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
            {filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                className="flex w-full items-center justify-between px-[12px] py-[8px] text-left transition-colors hover:bg-[#F5F6F8]"
                onClick={() => {
                  onSelect(item.id)
                  setIsOpen(false)
                  setSearch("")
                }}
              >
                <span className="text-[13px] font-[500] text-[#353A44]">{item.name}</span>
                {item.detail && (
                  <span className="text-[12px] text-[#6C7688]">{item.detail}</span>
                )}
              </button>
            ))}

            {filtered.length === 0 && search && (
              <div className="px-[12px] py-[8px] text-[12px] text-[#9CA3B0]">
                No results matching &ldquo;{search}&rdquo;
              </div>
            )}

            <div className="mt-[4px] border-t border-[#F0F3F7] pt-[4px]">
              <button
                type="button"
                className="flex w-full items-center gap-[6px] px-[12px] py-[8px] text-left text-[13px] font-[500] text-[#533AFD] transition-colors hover:bg-[#F5F6F8]"
                onClick={() => {
                  onAddNew()
                  setIsOpen(false)
                  setSearch("")
                }}
              >
                {addNewLabel}
              </button>
            </div>
          </div>
        )}
      </div>
      {hasError && errorMessage && (
        <p className="text-[11px] text-[#DF1B41]">{errorMessage}</p>
      )}
    </div>
  )
}
