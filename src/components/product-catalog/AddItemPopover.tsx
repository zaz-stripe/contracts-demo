'use client'

import { useDeferredValue, useMemo, useState } from "react"
import { SearchIcon } from "@/components/ProductCatalogIcons"
import { CatalogObjectGlyph } from "@/components/product-catalog/iconography"

export type AddItemPrice = {
  id: number
  name: string
  amount: string
  cadence?: string
}

export type AddItemCatalogEntry = {
  id: number
  name: string
  kind: "product" | "price-group" | "plan"
  prices?: AddItemPrice[]
  amount?: string
  isUsageBased?: boolean
}

export type AddItemOption = {
  label: string
  subtitle: string
  kind: string
}

type AddItemPopoverProps = {
  isOpen: boolean
  position: { top: number; left: number }
  onClose: () => void
  options: AddItemOption[]
  catalogItems: AddItemCatalogEntry[]
  onAddNew: (kind: string) => void
  onSelectCatalogItem: (item: AddItemCatalogEntry, price?: AddItemPrice) => void
}

function glyphForItem(item: AddItemCatalogEntry): "subscriptionFee" | "rateCard" | "plan" | "product" {
  if (item.kind === "price-group") return "rateCard"
  if (item.kind === "plan") return "plan"
  if (item.isUsageBased) return "product"
  return "subscriptionFee"
}

export function AddItemPopover({ isOpen, position, onClose, options, catalogItems, onAddNew, onSelectCatalogItem }: AddItemPopoverProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const deferredQuery = useDeferredValue(searchQuery)
  const lowerQuery = deferredQuery.toLowerCase()

  const filteredOptions = useMemo(
    () => lowerQuery
      ? options.filter((opt) => opt.label.toLowerCase().includes(lowerQuery) || opt.subtitle.toLowerCase().includes(lowerQuery))
      : options,
    [options, lowerQuery],
  )

  const filteredCatalog = useMemo(
    () => lowerQuery
      ? catalogItems.filter((item) => item.name.toLowerCase().includes(lowerQuery))
      : catalogItems,
    [catalogItems, lowerQuery],
  )

  if (!isOpen) {
    if (searchQuery) setSearchQuery("")
    return null
  }

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 w-[264px] rounded-[8px] border border-[#D4DEE9] bg-white shadow-[0px_15px_35px_0px_rgba(48,49,61,0.08),0px_5px_15px_0px_rgba(0,0,0,0.12)]"
        style={{ top: position.top, left: position.left }}
      >
        <div className="flex flex-col pt-[4px]">
          {/* Search input */}
          <div className="px-[12px] pt-[4px] pb-[4px]">
            <div className="flex items-center gap-[4px] rounded-[6px] border border-[#ECF1F6] bg-white px-[16px] py-[8px]">
              <SearchIcon className="h-[12px] w-[12px] shrink-0 text-[#667691]" />
              <input
                type="text"
                className="w-full bg-transparent text-[12px] font-[500] leading-[16px] text-[#1A2C44] placeholder:text-[#667691] outline-none"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          {/* Scrollable options */}
          <div className="max-h-[300px] overflow-y-auto">
            {/* Create new options */}
            {filteredOptions.length > 0 && (
              <div className="flex flex-col gap-[2px] px-[12px] py-[6px]">
                {filteredOptions.map((opt) => (
                  <button
                    key={opt.kind}
                    type="button"
                    className="flex w-full cursor-pointer items-center justify-between rounded-[6px] px-[16px] py-[4px] transition-colors hover:bg-[#F5F6F8]"
                    onClick={() => { onAddNew(opt.kind); onClose() }}
                  >
                    <div className="flex items-center gap-[6px]">
                      <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8" fill="none" className="shrink-0">
                        <path d="M4.75 0.75C4.75 0.335786 4.41421 0 4 0C3.58579 0 3.25 0.335786 3.25 0.75V3.25H0.75C0.335786 3.25 0 3.58579 0 4C0 4.41421 0.335786 4.75 0.75 4.75H3.25V7.25C3.25 7.66421 3.58579 8 4 8C4.41421 8 4.75 7.66421 4.75 7.25V4.75H7.25C7.66421 4.75 8 4.41421 8 4C8 3.58579 7.66421 3.25 7.25 3.25H4.75V0.75Z" fill="#675DFF" />
                      </svg>
                      <span className="text-[12px] font-[500] leading-[16px] text-[#533AFD]">{opt.label}</span>
                    </div>
                    <span className="text-[12px] font-[400] leading-[16px] text-[#50617A]">{opt.subtitle}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Existing catalog items */}
            {filteredCatalog.length > 0 && (
              <div className="flex flex-col gap-[2px] border-t border-[#ECF1F6] px-[12px] py-[6px]">
                {filteredCatalog.map((item) => {
                  const prices = item.prices ?? []
                  const hasPrices = prices.length > 0

                  return (
                    <div key={`${item.kind}-${item.id}`} className="flex flex-col">
                      {/* Item header — clickable for price groups and plans without prices */}
                      <button
                        type="button"
                        className="flex w-full cursor-pointer items-center justify-between rounded-[6px] px-[16px] py-[4px] hover:bg-[#F5F6F8] transition-colors"
                        onClick={!hasPrices ? () => { onSelectCatalogItem(item); onClose() } : undefined}
                        style={hasPrices ? { cursor: "default" } : undefined}
                      >
                        <div className="flex items-center gap-[6px] min-w-0">
                          <CatalogObjectGlyph kind={glyphForItem(item)} />
                          <span className="text-[12px] font-[500] leading-[16px] text-[#1A2C44] truncate">{item.name}</span>
                        </div>
                        {!hasPrices && (
                          <span className="shrink-0 ml-[8px] text-[11px] font-[400] leading-[16px] text-[#667691]">
                            {item.kind === "price-group" ? "Price group" : item.kind === "plan" ? "Plan" : ""}
                          </span>
                        )}
                      </button>
                      {/* Nested prices — always shown when available */}
                      {hasPrices && prices.map((price) => (
                        <button
                          key={price.id}
                          type="button"
                          className="flex w-full items-center rounded-[6px] pl-[36px] pr-[16px] py-[4px] text-left hover:bg-[#F5F6F8] transition-colors"
                          onClick={() => { onSelectCatalogItem(item, price); onClose() }}
                        >
                          <div className="flex items-center gap-[6px] min-w-0">
                            <CatalogObjectGlyph kind="price" />
                            <span className="text-[12px] font-[400] leading-[16px] text-[#1A2C44] truncate">
                              {price.name || [price.cadence, price.amount ? `$${price.amount}` : ""].filter(Boolean).join(", ") || "Price"}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )
                })}
              </div>
            )}

            <div className="h-[4px]" />
          </div>
        </div>
      </div>
    </>
  )
}
