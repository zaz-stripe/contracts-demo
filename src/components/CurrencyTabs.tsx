'use client'

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { CurrencyFlag } from "@/components/CurrencyFlag"

type CurrencyTabsProps = {
  currencies: { id: number; code: string }[]
  activeCurrencyId: number
  onSelectCurrency: (id: number) => void
  onDeleteCurrency: (id: number) => void
  currencyDisplayNames: Intl.DisplayNames | null
  maxVisibleTabs: number
  highlightedCurrencies?: string[]
}

export function CurrencyTabs({
  currencies,
  activeCurrencyId,
  onSelectCurrency,
  onDeleteCurrency,
  currencyDisplayNames,
  maxVisibleTabs,
  highlightedCurrencies = [],
}: CurrencyTabsProps) {
  const [moreOpen, setMoreOpen] = useState(false)
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null)
  const moreButtonRef = useRef<HTMLButtonElement | null>(null)
  const moreMenuRef = useRef<HTMLDivElement | null>(null)

  // Keep original order - split into visible and overflow
  const visibleCurrencies = currencies.slice(0, maxVisibleTabs)
  const overflowCurrencies = currencies.slice(maxVisibleTabs)
  
  // Check if active currency is in the overflow
  const activeInOverflow = overflowCurrencies.find((c) => c.id === activeCurrencyId)

  useEffect(() => {
    if (!moreOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (!moreButtonRef.current?.contains(target) && !moreMenuRef.current?.contains(target)) {
        setMoreOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMoreOpen(false)
      }
    }

    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [moreOpen])

  const handleMoreClick = () => {
    if (moreButtonRef.current) {
      setTriggerRect(moreButtonRef.current.getBoundingClientRect())
    }
    setMoreOpen((prev) => !prev)
  }

  const moreDropdown = moreOpen && triggerRect ? (
    <div
      ref={moreMenuRef}
      className="fixed z-[999] w-[220px] rounded-[6px] border border-[#D8DEE4] bg-white shadow-[0_12px_32px_rgba(28,32,40,0.12)] overflow-hidden"
      style={{
        top: triggerRect.bottom + 4,
        left: triggerRect.left,
      }}
    >
      <div className="max-h-[240px] overflow-y-auto p-[6px]">
        {overflowCurrencies.map((currency) => {
          const name = currencyDisplayNames?.of(currency.code)
          const isActive = currency.id === activeCurrencyId
          return (
            <button
              key={currency.id}
              type="button"
              className={`flex w-full items-center gap-2 rounded-[6px] px-3 py-2 text-left text-[13px] font-[500] ${
                isActive ? "bg-[#F5F6F8] text-[#353A44]" : "text-[#353A44] hover:bg-[#F5F6F8]"
              }`}
              onClick={() => {
                onSelectCurrency(currency.id)
                setMoreOpen(false)
              }}
            >
              <CurrencyFlag currency={currency.code} className="shrink-0" />
              <span className="font-[600]">{currency.code}</span>
              <span className="truncate text-[#818DA0]">{name}</span>
            </button>
          )
        })}
      </div>
    </div>
  ) : null

  return (
    <div className="flex items-center gap-3">
      {/* Visible currency tabs in original order */}
      {visibleCurrencies.map((currency) => {
        const isActive = currency.id === activeCurrencyId
        const isHighlighted = highlightedCurrencies.includes(currency.code)
        return (
          <div
            key={currency.id}
            className={`relative flex items-center gap-[6px] rounded-[6px] border px-[8px] py-[6px] text-[12px] font-[500] cursor-pointer ${
              isActive
                ? "border-[#353A44] bg-[#353A44] text-white"
                : "border-[#D8DEE4] text-[#353A44] hover:border-[#B6C0CD]"
            }`}
            onClick={() => onSelectCurrency(currency.id)}
          >
            <CurrencyFlag currency={currency.code} className="shrink-0" />
            <span className={isHighlighted ? (isActive ? "bg-[#44139F] px-1 rounded-[2px]" : "bg-[#E0D9FB] px-1 rounded-[2px]") : ""}>{currency.code}</span>
            {isActive && currencies.length > 1 && (
              <CurrencyTabPopover onDelete={() => onDeleteCurrency(currency.id)} />
            )}
          </div>
        )
      })}

      {/* "X more" or selected currency name button for overflow */}
      {overflowCurrencies.length > 0 && (
        <div className="relative flex items-center gap-2">
          <button
            ref={moreButtonRef}
            type="button"
            className={`flex items-center gap-[6px] rounded-[6px] border px-[8px] py-[6px] text-[12px] font-[500] cursor-pointer ${
              activeInOverflow
                ? "border-[#353A44] bg-[#353A44] text-white"
                : "border-[#D8DEE4] text-[#353A44] hover:border-[#B6C0CD]"
            }`}
            onClick={handleMoreClick}
          >
            {activeInOverflow ? (
              <>
                <CurrencyFlag currency={activeInOverflow.code} className="shrink-0" />
                <span>{activeInOverflow.code}</span>
              </>
            ) : (
              <span>{overflowCurrencies.length} more</span>
            )}
            <svg xmlns="http://www.w3.org/2000/svg" width="8" height="5" fill="none" viewBox="0 0 8 5">
              <path
                fill={activeInOverflow ? "#ffffff" : "#6C7688"}
                fillRule="evenodd"
                d="M.231.209c-.299.286-.309.76-.022 1.06l2.875 3C3.224 4.417 3.42 4.5 3.625 4.5c.204.001.4-.082.541-.23l2.875-2.995c.287-.299.277-.773-.022-1.06-.299-.287-.774-.277-1.06.022L3.625 2.667 1.29.231C1.005-.068.53-.078.231.21Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          {activeInOverflow && currencies.length > 1 && (
            <div className="flex items-center justify-center rounded-[6px] bg-[#353A44] px-1 py-[6px]">
              <CurrencyTabPopover onDelete={() => onDeleteCurrency(activeInOverflow.id)} />
            </div>
          )}
          {moreDropdown && typeof document !== "undefined" && createPortal(moreDropdown, document.body)}
        </div>
      )}
    </div>
  )
}

type CurrencyTabPopoverProps = {
  onDelete: () => void
}

function CurrencyTabPopover({ onDelete }: CurrencyTabPopoverProps) {
  const t = (key: string) => key
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

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

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="flex items-center justify-center"
        aria-label={t("Currency options")}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((prev) => !prev)
        }}
      >
        <MoreIcon />
      </button>
      {open && (
        <div
          ref={menuRef}
          className="absolute left-0 top-[calc(100%+4px)] z-20 w-max rounded-[6px] border border-[#D8DEE4] bg-white shadow-[0_12px_32px_rgba(28,32,40,0.12)]"
        >
          <button
            type="button"
            className="flex w-full items-center whitespace-nowrap px-3 py-2 text-left text-[13px] font-[500] text-[#353A44] hover:bg-[#F5F6F8]"
            onClick={() => {
              onDelete()
              setOpen(false)
            }}
          >
            {t("Delete currency")}
          </button>
        </div>
      )}
    </>
  )
}

function MoreIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path
        fill="currentColor"
        d="M2.25 7.125a1.125 1.125 0 1 0 0-2.25 1.125 1.125 0 0 0 0 2.25ZM6 7.125a1.125 1.125 0 1 0 0-2.25 1.125 1.125 0 0 0 0 2.25ZM9.75 7.125a1.125 1.125 0 1 0 0-2.25 1.125 1.125 0 0 0 0 2.25Z"
      />
    </svg>
  )
}

