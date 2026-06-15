'use client'

import { useEffect, useRef, useState } from "react"
import { FormRow } from "@/components/FormRow"
import { textFieldInputClasses } from "@/components/product-catalog/productCatalogPage.constants"
import { CatalogObjectGlyph } from "@/components/product-catalog/iconography"
import { CUSTOMERS } from "@/lib/customers"

type CatalogSearchItem = {
  id: number
  name: string
  kind: "product" | "price-group" | "plan"
  priceName?: string
}

type SubscriptionGetStartedProps = {
  onSubmit: (data: { customer: string; duration: string; products: string[] }) => void
  catalogItems?: CatalogSearchItem[]
  catalogProducts?: { id: number; name: string }[]
}

function glyphForKind(kind: "product" | "price-group" | "plan"): "subscriptionFee" | "rateCard" | "plan" {
  if (kind === "price-group") return "rateCard"
  if (kind === "plan") return "plan"
  return "subscriptionFee"
}

function kindLabel(kind: "product" | "price-group" | "plan"): string {
  if (kind === "price-group") return "Price group"
  if (kind === "plan") return "Plan"
  return "Product"
}

export function SubscriptionGetStarted({ onSubmit, catalogItems, catalogProducts }: SubscriptionGetStartedProps) {
  const allItems: CatalogSearchItem[] = catalogItems && catalogItems.length > 0
    ? catalogItems
    : (catalogProducts ?? []).map((p) => ({ id: p.id, name: p.name, kind: "product" as const }))

  const customerNames = CUSTOMERS.map((c) => c.name)
  const [customer, setCustomer] = useState("")
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [itemInput, setItemInput] = useState("")
  const [isItemInputFocused, setIsItemInputFocused] = useState(false)
  const [selectedTagIndex, setSelectedTagIndex] = useState<number | null>(null)
  const itemInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const t = (key: string) => key
  const canSubmit = customer !== ""

  const today = new Date().toISOString().split("T")[0]

  const matchingItems = allItems.filter(
    (item) => !selectedItems.includes(item.name) && item.name.toLowerCase().includes(itemInput.trim().toLowerCase())
  )
  const showDropdown = isItemInputFocused && matchingItems.length > 0

  const addItem = (name: string) => {
    if (!selectedItems.includes(name)) {
      setSelectedItems((prev) => [...prev, name])
    }
    setItemInput("")
    setSelectedTagIndex(null)
  }

  const removeItem = (index: number) => {
    setSelectedItems((prev) => prev.filter((_, i) => i !== index))
    setSelectedTagIndex(null)
  }

  const handleItemKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && matchingItems.length > 0) {
      e.preventDefault()
      addItem(matchingItems[0].name)
    } else if (e.key === "Backspace" && itemInput === "" && selectedItems.length > 0) {
      if (selectedTagIndex != null) {
        removeItem(selectedTagIndex)
      } else {
        setSelectedTagIndex(selectedItems.length - 1)
      }
    } else if (selectedTagIndex != null) {
      setSelectedTagIndex(null)
    }
  }

  useEffect(() => {
    if (!showDropdown) return
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsItemInputFocused(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [showDropdown])

  const handleSubmit = () => {
    if (!canSubmit) return
    onSubmit({ customer, duration: "Monthly", products: selectedItems })
  }

  return (
    <div className="flex flex-col pt-[16px]">
      {/* Header — matches PlanGetStarted exactly */}
      <div className="flex flex-col gap-[2px] px-4 pb-[12px]">
        <p className="text-[14px] font-[500] leading-[20px] tracking-[-0.15px] text-[#1A2C44]">
          {t("Get started")}
        </p>
        <p className="text-[12px] font-[400] leading-[16px] text-[#50617A]">
          {t("Create a new subscription")}
        </p>
      </div>

      {/* Inline form — same structure as InlineWizardForm */}
      <div className="flex flex-col gap-[12px] min-w-0">
        <FormRow label={t("Customer")}>
          <select
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            className={textFieldInputClasses}
          >
            <option value="">{t("Select a customer...")}</option>
            {customerNames.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </FormRow>

        <FormRow label={t("Duration")}>
          <div className="flex items-center gap-[8px]">
            <input
              type="date"
              className={textFieldInputClasses}
              defaultValue={today}
            />
            <span className="text-[12px] font-[400] text-[#6C7688] shrink-0">to</span>
            <input
              type="text"
              className={textFieldInputClasses}
              defaultValue="Forever"
              readOnly
            />
          </div>
        </FormRow>

        <FormRow label={t("Items")}>
          <div className="relative" ref={dropdownRef}>
            <div
              className={`flex h-[30px] w-full items-center rounded-[6px] border bg-white px-3 transition-all cursor-text ${
                isItemInputFocused
                  ? "border-[#A0D0F7] shadow-[0_0_0_1.5px_#A0D0F7]"
                  : "border-[#D8DEE4] hover:border-[#B6C0CD]"
              }`}
              onClick={() => itemInputRef.current?.focus()}
            >
              <input
                ref={itemInputRef}
                type="text"
                className="w-full bg-transparent text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] placeholder:text-[#6C7688] outline-none"
                placeholder={t("Search products, price groups, plans...")}
                value={itemInput}
                onChange={(e) => setItemInput(e.target.value)}
                onKeyDown={handleItemKeyDown}
                onFocus={() => setIsItemInputFocused(true)}
                onBlur={() => { setIsItemInputFocused(false); setSelectedTagIndex(null) }}
              />
            </div>

            {showDropdown && (
              <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 rounded-[8px] border border-[#D4DEE9] bg-white shadow-[0px_5px_15px_0px_rgba(0,0,0,0.12)] overflow-hidden max-h-[200px] overflow-y-auto">
                {matchingItems.map((item) => (
                  <button
                    key={`${item.kind}-${item.id}`}
                    type="button"
                    className="flex w-full items-center justify-between px-[12px] py-[6px] text-left hover:bg-[#F4F7FA] transition-colors"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      addItem(item.name)
                    }}
                  >
                    <div className="flex items-center gap-[6px] min-w-0">
                      <CatalogObjectGlyph kind={glyphForKind(item.kind)} />
                      <span className="text-[12px] font-[500] leading-[16px] text-[#1A2C44] truncate">{item.name}</span>
                    </div>
                    <span className="shrink-0 ml-[8px] text-[11px] font-[400] leading-[16px] text-[#667691]">
                      {item.priceName || kindLabel(item.kind)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <p className="mt-[4px] text-[11px] font-[400] leading-[14px] text-[#6C7688]">
            {t("Search and select items to add")}
          </p>

          {selectedItems.length > 0 && (
            <div className="mt-[8px] flex flex-wrap items-start gap-[8px]">
              {selectedItems.map((tag, i) => (
                <span
                  key={i}
                  className={`inline-flex items-center gap-[4px] rounded-[4px] border px-[6px] py-[2px] text-[12px] font-[400] leading-[16px] transition-colors ${
                    selectedTagIndex === i
                      ? "border-[#B6C0CD] bg-[#E5ECF3] text-[#3C4F69]"
                      : "border-[#D4DEE9] bg-[#F4F7FA] text-[#50617A]"
                  }`}
                >
                  {tag}
                  <button
                    type="button"
                    className="flex items-center justify-center rounded-[2px] text-[#3C4F69] hover:bg-[#E5ECF3] transition-colors"
                    onClick={(e) => { e.stopPropagation(); removeItem(i) }}
                    aria-label={`Remove ${tag}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 10 10" fill="none">
                      <path fillRule="evenodd" clipRule="evenodd" d="M0.248959 0.248959C0.580905 -0.0829864 1.1191 -0.0829864 1.45104 0.248959L5 3.79792L8.54896 0.248959C8.88091 -0.0829864 9.4191 -0.0829864 9.75104 0.248959C10.083 0.580905 10.083 1.1191 9.75104 1.45104L6.20208 5L9.75104 8.54896C10.083 8.88091 10.083 9.4191 9.75104 9.75104C9.4191 10.083 8.88091 10.083 8.54896 9.75104L5 6.20208L1.45104 9.75104C1.1191 10.083 0.580905 10.083 0.248959 9.75104C-0.0829864 9.4191 -0.0829864 8.88091 0.248959 8.54896L3.79792 5L0.248959 1.45104C-0.0829864 1.1191 -0.0829864 0.580905 0.248959 0.248959Z" fill="currentColor"/>
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}
        </FormRow>

        {/* Submit — matches PlanGetStarted inline submit exactly */}
        <div className="px-4">
          <button
            type="button"
            className={`flex h-[34px] w-full items-center justify-center rounded-[6px] border text-[12px] font-[600] leading-[16px] tracking-[-0.024px] transition-colors ${
              canSubmit
                ? "border-[#533AFD] bg-[#533AFD] text-white hover:bg-[#4730E0]"
                : "border-[#A99CFE] bg-[#A99CFE] text-white cursor-not-allowed"
            }`}
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {t("Get started")}
          </button>
        </div>
      </div>
    </div>
  )
}
