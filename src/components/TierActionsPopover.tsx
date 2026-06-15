'use client'

import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { PlusIcon } from "@/components/ProductCatalogIcons"
import { CurrencyFlag } from "@/components/CurrencyFlag"

type TierActionsPopoverProps = {
  onAddTier: () => void
  currencyOptions: string[]
  disabledCurrencies: string[]
  currencyDisplayNames: Intl.DisplayNames | null
  onAddCurrency: (code: string) => void
  triggerClassName?: string
  ariaLabel?: string
  mode?: "all" | "currencyOnly"
}

export function TierActionsPopover({
  onAddTier,
  currencyOptions,
  disabledCurrencies,
  currencyDisplayNames,
  onAddCurrency,
  triggerClassName,
  ariaLabel,
  mode = "all",
}: TierActionsPopoverProps) {
  const t = (key: string) => key
  const [open, setOpen] = useState(false)
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null)

  const filteredOptions = useMemo(() => {
    const available = currencyOptions.filter((code) => !disabledCurrencies.includes(code))
    if (!searchQuery) return available
    return available.filter((code) => {
      const name = currencyDisplayNames?.of(code) ?? ""
      return `${code} ${name}`.toLowerCase().includes(searchQuery.toLowerCase())
    })
  }, [currencyOptions, disabledCurrencies, searchQuery, currencyDisplayNames])

  useEffect(() => {
    if (showCurrencyPicker) {
      setTimeout(() => searchInputRef.current?.focus(), 0)
    } else {
      setSearchQuery("")
    }
  }, [showCurrencyPicker])

  useEffect(() => {
    if (!open && !showCurrencyPicker) return

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (!triggerRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setOpen(false)
        setShowCurrencyPicker(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
        setShowCurrencyPicker(false)
      }
    }

    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open, showCurrencyPicker])

  const handleOpenMenu = () => {
    if (triggerRef.current) {
      setTriggerRect(triggerRef.current.getBoundingClientRect())
    }
    if (mode === "currencyOnly") {
      setOpen(false)
      setShowCurrencyPicker((prev) => !prev)
      return
    }
    setOpen((prev) => !prev)
    setShowCurrencyPicker(false)
  }

  const dropdown = (open || showCurrencyPicker) && triggerRect ? (
    <div
      ref={menuRef}
      className={`fixed z-[999] rounded-[6px] border border-[#D8DEE4] bg-white shadow-[0_12px_32px_rgba(28,32,40,0.12)] overflow-hidden ${showCurrencyPicker ? "w-[200px]" : ""}`}
      style={{
        top: triggerRect.bottom + 8,
        right: window.innerWidth - triggerRect.right,
      }}
    >
      {showCurrencyPicker ? (
        <>
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
                    onAddCurrency(code)
                    setShowCurrencyPicker(false)
                    setOpen(false)
                  }}
                >
                  <CurrencyFlag currency={code} className="shrink-0" />
                  <span className="w-[29px] flex-none">{code}</span>
                  <span className="truncate text-[#818DA0]">{name}</span>
                </button>
              )
            })}
            {filteredOptions.length === 0 && (
              <div className="px-3 py-2 text-[13px] text-[#818DA0]">{t("No currencies available")}</div>
            )}
          </div>
        </>
      ) : (
        <>
          <button
            type="button"
            className="flex w-full items-center px-3 py-2 text-left text-[13px] font-[500] text-[#353A44] hover:bg-[#F5F6F8]"
            onClick={() => {
              onAddTier()
              setOpen(false)
            }}
          >
            {t("Add tier")}
          </button>
          <button
            type="button"
            className="flex w-full items-center border-t border-[#EBEEF1] px-3 py-2 text-left text-[13px] font-[500] text-[#353A44] hover:bg-[#F5F6F8]"
            onClick={() => {
              setShowCurrencyPicker(true)
              setOpen(false)
            }}
          >
            {t("Add currency")}
          </button>
        </>
      )}
    </div>
  ) : null

  return (
    <div className="relative inline-flex">
      <button
        ref={triggerRef}
        type="button"
        className={`flex items-center justify-center rounded-[6px] p-2 text-[#474E5A] hover:bg-[#F5F6F8] transition-colors ${triggerClassName ?? ""}`}
        aria-label={ariaLabel ?? t("Add tier or currency")}
        onClick={handleOpenMenu}
      >
        <PlusIcon />
      </button>
      {dropdown && typeof document !== "undefined" && createPortal(dropdown, document.body)}
    </div>
  )
}

