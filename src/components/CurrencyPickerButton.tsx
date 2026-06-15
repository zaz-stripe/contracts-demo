'use client'

import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { PlusIcon } from "@/components/ProductCatalogIcons"

type CurrencyPickerButtonProps = {
  currencyOptions: string[]
  disabledOptions: string[]
  currencyDisplayNames: Intl.DisplayNames | null
  onSelect: (code: string) => void
}

export function CurrencyPickerButton({
  currencyOptions,
  disabledOptions,
  currencyDisplayNames,
  onSelect,
}: CurrencyPickerButtonProps) {
  const t = (key: string) => key
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  const filteredOptions = useMemo(() => {
    const available = currencyOptions.filter((code) => !disabledOptions.includes(code))
    if (!searchQuery) return available
    return available.filter((code) => {
      const name = currencyDisplayNames?.of(code) ?? ""
      return `${code} ${name}`.toLowerCase().includes(searchQuery.toLowerCase())
    })
  }, [currencyOptions, disabledOptions, searchQuery, currencyDisplayNames])

  useEffect(() => {
    if (!open) {
      setSearchQuery("")
      return
    }
    if (triggerRef.current) {
      setTriggerRect(triggerRef.current.getBoundingClientRect())
    }
    setTimeout(() => searchInputRef.current?.focus(), 0)
  }, [open])

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (!triggerRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open])

  const dropdown = open && triggerRect ? (
    <div
      ref={menuRef}
      className="fixed z-[999] w-[240px] rounded-[6px] border border-[#D8DEE4] bg-white shadow-[0_12px_32px_rgba(28,32,40,0.12)] overflow-hidden"
      style={{
        top: triggerRect.bottom + 8,
        right: window.innerWidth - triggerRect.right,
      }}
    >
      <div className="border-b border-[#EBEEF1] px-3 py-[7px]">
        <input
          ref={searchInputRef}
          type="text"
          placeholder={t("Search currencies")}
          autoComplete="off"
          className="w-full bg-transparent text-[13px] font-[500] text-[#353A44] placeholder:text-[#818DA0] outline-none"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <div className="max-h-[240px] overflow-y-auto p-[6px]">
        {filteredOptions.map((code) => {
          const name = currencyDisplayNames?.of(code)
          return (
            <button
              key={code}
              type="button"
              className="flex w-full items-center gap-2 rounded-[6px] px-3 py-2 text-left text-[13px] font-[500] text-[#353A44] hover:bg-[#F5F6F8]"
              onClick={() => {
                onSelect(code)
                setOpen(false)
              }}
            >
              <span className="w-[29px] flex-none">{code}</span>
              <span className="truncate text-[#818DA0]">{name}</span>
            </button>
          )
        })}
        {filteredOptions.length === 0 && (
          <div className="px-3 py-2 text-[13px] text-[#818DA0]">{t("No currencies available")}</div>
        )}
      </div>
    </div>
  ) : null

  return (
    <div className="relative inline-flex">
      <button
        ref={triggerRef}
        type="button"
        className="flex items-center justify-center rounded-[6px] p-2 text-[#474E5A] hover:bg-[#F5F6F8] transition-colors"
        aria-label={t("Add currency")}
        onClick={() => setOpen((prev) => !prev)}
      >
        <PlusIcon />
      </button>
      {dropdown && typeof document !== "undefined" && createPortal(dropdown, document.body)}
    </div>
  )
}

