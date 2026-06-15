'use client'

import { createContext, type Dispatch, type SetStateAction, useCallback, useContext, useLayoutEffect, useRef, useState } from "react"
import { Selector } from "@/components/Selector"
import type { PlanRateCard } from "@/components/product-catalog/PlanForm/planFormTypes"

function BackArrowIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="11" viewBox="0 0 12 11" fill="none">
      <path d="M4.71967 0.21967C5.01256 -0.0732233 5.48744 -0.0732233 5.78033 0.21967C6.07322 0.512563 6.07322 0.987437 5.78033 1.28033L2.56066 4.5H11.25C11.6642 4.5 12 4.83579 12 5.25C12 5.66421 11.6642 6 11.25 6H2.56066L5.78033 9.21967C6.07322 9.51256 6.07322 9.98744 5.78033 10.2803C5.48744 10.5732 5.01256 10.5732 4.71967 10.2803L0.219669 5.78033C0.0732232 5.63388 6.06356e-08 5.44194 0 5.25C-6.06357e-08 5.05806 0.0732231 4.86612 0.219669 4.71967L4.71967 0.21967Z" fill="#474E5A"/>
    </svg>
  )
}

/**
 * Context provided by PricingPlanModalOverlay controlling which header rows
 * BulkRateEditor renders:
 *   "all"      – title row + subtitle row (expand mode after entry transition)
 *   "subtitle" – subtitle row only (expand mode during transition, or inline mode)
 *   "none"     – no header rows (header mode – the modal header handles everything)
 */
export type BulkEditHeaderMode = "all" | "subtitle" | "none"
export const BulkEditHeaderVisibleContext = createContext<BulkEditHeaderMode>("subtitle")

type BulkRateEditorProps = {
  t: (key: string) => string
  planRateCards: PlanRateCard[]
  rateCardId: number
  rateMeters: Record<number, string>
  setRateMeters: Dispatch<SetStateAction<Record<number, string>>>
  ratePriceTypes: Record<number, string>
  setRatePriceTypes: Dispatch<SetStateAction<Record<number, string>>>
  rateSellAs: Record<number, string>
  setRateSellAs: Dispatch<SetStateAction<Record<number, string>>>
  planRateUnitPrices: Record<number, string>
  setPlanRateUnitPrices: Dispatch<SetStateAction<Record<number, string>>>
  rateUnitLabels: Record<number, string>
  setRateUnitLabels: Dispatch<SetStateAction<Record<number, string>>>
  updateRateName: (rateId: number, value: string) => void
  meterOptions: string[]
  planPriceTypeOptions: string[]
  sellAsOptions: string[]
  onBack: () => void
  /** Header title (plan name) — rendered inside the scroll container once the entry transition completes */
  headerTitle: string
  onDiscard: () => void
  onCreate: () => void
  createLabel: string
  createDisabled?: boolean
}

type CellId = `${number}:${string}`

const thClasses =
  "bg-white text-left text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#474E5A] shadow-[inset_0_-1px_0_0_#EBEEF1]"

/** Spreadsheet-style cell: shows plain text, becomes an input on click. */
function EditableCell({
  value,
  onChange,
  placeholder,
  cellId,
  activeCell,
  setActiveCell,
  prefix,
  inputMode,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  cellId: CellId
  activeCell: CellId | null
  setActiveCell: (id: CellId | null) => void
  prefix?: string
  inputMode?: "text" | "decimal"
}) {
  const isEditing = activeCell === cellId

  if (isEditing) {
    return (
      <td
        className="border-b border-r border-[#EBEEF1] last:border-r-0"
      >
        <div className="flex h-full w-full items-center shadow-[inset_0_0_0_1.5px_#A0D0F7]">
          {prefix && <span className="pl-[10px] text-[12px] text-[#6C7688]">{prefix}</span>}
          <input
            autoFocus
            className="h-full w-full bg-transparent px-[10px] py-[8px] text-[12px] font-[500] leading-[16px] text-[#353A44] placeholder:text-[#6C7688] outline-none"
            style={prefix ? { paddingLeft: 4 } : undefined}
            value={value}
            onChange={(e) => onChange(inputMode === "decimal" ? e.target.value.replace(/[^0-9.]/g, "") : e.target.value)}
            onBlur={() => setActiveCell(null)}
            onKeyDown={(e) => {
              if (e.key === "Escape" || e.key === "Enter") {
                setActiveCell(null)
              }
            }}
            placeholder={placeholder}
            inputMode={inputMode}
          />
        </div>
      </td>
    )
  }

  const display = value || placeholder
  const isEmpty = !value

  return (
    <td
      className="border-b border-r border-[#EBEEF1] last:border-r-0 cursor-text"
      onClick={() => setActiveCell(cellId)}
    >
      <div className="flex items-center px-[10px] py-[8px]">
        {prefix && !isEmpty && <span className="text-[12px] text-[#6C7688]">{prefix}</span>}
        <span className={`truncate text-[12px] font-[500] leading-[16px] ${isEmpty ? "text-[#6C7688]" : "text-[#353A44]"}`}>
          {display}
        </span>
      </div>
    </td>
  )
}

/** Spreadsheet-style cell with a Selector dropdown. */
function SelectorCell({
  value,
  onChange,
  options,
  placeholder,
  getDisplayValue,
  ariaLabel,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
  placeholder?: string
  getDisplayValue?: (v: string) => string
  ariaLabel: string
}) {
  const display = getDisplayValue ? getDisplayValue(value) : value
  const isEmpty = !value

  return (
    <td className="border-b border-r border-[#EBEEF1] last:border-r-0 p-0">
      <Selector
        ariaLabel={ariaLabel}
        size="sm"
        value={value}
        onChange={onChange}
        options={options}
        getDisplayValue={getDisplayValue}
        placeholder={placeholder}
        buttonClassName={`h-full w-full rounded-none border-0 px-[10px] py-[8px] text-[12px] font-[500] ${
          isEmpty ? "text-[#6C7688]" : "text-[#353A44]"
        } hover:bg-[#F5F6F8] focus:shadow-[inset_0_0_0_1.5px_#A0D0F7]`}
        fullWidth
      />
    </td>
  )
}

/** Set sticky top and optional transition on all <th> children of a row. */
function applyThStyles(thRow: HTMLTableRowElement, top: number, animate?: boolean) {
  for (let i = 0; i < thRow.children.length; i++) {
    const th = thRow.children[i] as HTMLElement
    th.style.top = `${top}px`
    if (animate !== undefined) {
      th.style.transition = animate ? 'top 200ms cubic-bezier(0.4,0,0.2,1)' : 'none'
    }
  }
}

export function BulkRateEditor({
  t,
  planRateCards,
  rateCardId,
  rateMeters,
  setRateMeters,
  ratePriceTypes,
  setRatePriceTypes,
  rateSellAs,
  setRateSellAs,
  planRateUnitPrices,
  setPlanRateUnitPrices,
  rateUnitLabels,
  setRateUnitLabels,
  updateRateName,
  meterOptions,
  planPriceTypeOptions,
  sellAsOptions,
  onBack,
  headerTitle,
  onDiscard,
  onCreate,
  createLabel,
  createDisabled,
}: BulkRateEditorProps) {
  const headerMode = useContext(BulkEditHeaderVisibleContext)
  const showTitleRow = headerMode === "all"
  const showSubtitleRow = headerMode !== "none"
  const rateCard = planRateCards.find((c) => c.id === rateCardId)
  const rates = rateCard?.rates ?? []
  const rateCardName = rateCard?.name?.trim() || t("price group")
  const [activeCell, setActiveCell] = useState<CellId | null>(null)

  // Scroll-driven header animation — refs for 60fps direct DOM manipulation.
  // The overlay lives OUTSIDE the scroll container (absolutely positioned),
  // which eliminates merge-zone glitches and content jumps entirely.
  const lastScrollTop = useRef(0)
  const quickReturnActive = useRef(false)
  const headersRef = useRef<HTMLDivElement>(null)
  const overlayInnerRef = useRef<HTMLDivElement>(null)
  const thRowRef = useRef<HTMLTableRowElement>(null)
  const thDelayTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [headersHeight, setHeadersHeight] = useState(0)

  // Measure header height on mount and whenever the title row appears/disappears.
  // Also reset overlay + scroll state so the quick-return starts fresh.
  useLayoutEffect(() => {
    if (headersRef.current) {
      const h = headersRef.current.offsetHeight
      setHeadersHeight(h)
      if (overlayInnerRef.current) {
        overlayInnerRef.current.style.transform = `translateY(${-h}px)`
        overlayInnerRef.current.style.visibility = 'hidden'
        overlayInnerRef.current.style.pointerEvents = 'none'
      }
      quickReturnActive.current = false
      if (thDelayTimer.current) { clearTimeout(thDelayTimer.current); thDelayTimer.current = null }
      if (thRowRef.current) applyThStyles(thRowRef.current, 0, false)
    }
    return () => {
      if (thDelayTimer.current) clearTimeout(thDelayTimer.current)
    }
  }, [headerMode])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop
    const isUp = scrollTop < lastScrollTop.current
    const pastHeaders = scrollTop >= headersHeight
    lastScrollTop.current = scrollTop

    const overlay = overlayInnerRef.current
    const thRow = thRowRef.current
    if (!overlay || !thRow || !headersHeight) return

    if (isUp && pastHeaders) {
      // Scrolling up past header zone → slide overlay in from above
      if (!quickReturnActive.current) {
        overlay.style.visibility = 'visible'
        overlay.style.transition = 'transform 200ms cubic-bezier(0.4,0,0.2,1)'
        overlay.style.transform = 'translateY(0)'
        overlay.style.pointerEvents = 'auto'
        // Column headers stay at top:0 during slide-in (behind overlay at z:25).
        // Move them below the overlay only after the animation completes so
        // there is no visible jump.
        if (thDelayTimer.current) clearTimeout(thDelayTimer.current)
        thDelayTimer.current = setTimeout(() => {
          if (quickReturnActive.current) applyThStyles(thRow, headersHeight, false)
        }, 210)
      }
      quickReturnActive.current = true
    } else if (isUp && !pastHeaders && quickReturnActive.current) {
      // Approaching the top — overlay stays visible, naturally covers natural headers
      if (scrollTop <= 0) {
        // At the very top — seamless handoff to natural headers
        quickReturnActive.current = false
        if (thDelayTimer.current) { clearTimeout(thDelayTimer.current); thDelayTimer.current = null }
        overlay.style.transition = 'none'
        overlay.style.transform = `translateY(${-headersHeight}px)`
        overlay.style.visibility = 'hidden'
        overlay.style.pointerEvents = 'none'
        applyThStyles(thRow, 0, false)
      }
    } else if (!isUp && quickReturnActive.current) {
      // Scrolling down — hide overlay
      quickReturnActive.current = false
      if (thDelayTimer.current) { clearTimeout(thDelayTimer.current); thDelayTimer.current = null }
      // Move column headers back to top:0 (behind overlay, change is invisible)
      applyThStyles(thRow, 0, false)
      if (pastHeaders) {
        // Deep in list: animate overlay out (clipped by overflow-hidden parent)
        overlay.style.transition = 'transform 200ms cubic-bezier(0.4,0,0.2,1)'
        overlay.style.transform = `translateY(${-headersHeight}px)`
        overlay.style.pointerEvents = 'none'
      } else {
        // Near top: instant hide
        overlay.style.transition = 'none'
        overlay.style.transform = `translateY(${-headersHeight}px)`
        overlay.style.visibility = 'hidden'
        overlay.style.pointerEvents = 'none'
      }
    }
  }, [headersHeight])

  // Shared header JSX (used by natural headers and quick-return overlay).
  // The title row only appears after the entry transition completes (headerVisible=true)
  // so there's no layout jump when entering bulk edit mode.
  const headerRows = (
    <>
      {showTitleRow && (
        <div className="flex items-center justify-between border-b border-[#ECF1F6] px-[16px] py-[12px]">
          <p className="min-w-0 truncate text-[14px] font-[500] leading-[20px] tracking-[-0.15px] text-[#1A2C44]">
            {headerTitle}
          </p>
          <div className="flex shrink-0 items-center gap-[8px]">
            <button
              type="button"
              className="flex h-[28px] items-center rounded-[6px] border border-[#D4DEE9] bg-white px-[10px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#273951] transition-colors hover:bg-[#F5F6F8]"
              onClick={onDiscard}
            >
              {t("Discard")}
            </button>
            <button
              type="button"
              className={`flex h-[28px] items-center whitespace-nowrap rounded-[6px] px-[10px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-white transition-colors ${
                createDisabled
                  ? "border border-[#A99CFE] bg-[#A99CFE] cursor-not-allowed"
                  : "border border-[#533AFD] bg-[#675DFF] hover:bg-[#5B52F0]"
              }`}
              onClick={onCreate}
              disabled={createDisabled}
              aria-disabled={createDisabled}
            >
              {createLabel}
            </button>
          </div>
        </div>
      )}
      {showSubtitleRow && (
        <div className="flex items-center gap-[8px] border-b border-[#EBEEF1] px-[16px] py-[12px]">
          <button
            type="button"
            className="flex items-center justify-center rounded-[6px] p-[4px] transition-colors hover:bg-[#F5F6F8]"
            onClick={onBack}
            aria-label={t("Back")}
          >
            <BackArrowIcon />
          </button>
          <p className="text-[14px] font-[500] leading-[20px] tracking-[-0.15px] text-[#1A2C44]">
            {t("Editing")} {rates.length} {rates.length === 1 ? t("rate") : t("rates")} {t("in")} {rateCardName}
          </p>
        </div>
      )}
    </>
  )

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Quick-return overlay — absolutely positioned outside scroll container.
          Clipped by overflow-hidden when translated off-screen. */}
      <div
        ref={overlayInnerRef}
        className="absolute inset-x-0 top-0 z-[25] bg-white"
      >
        {headerRows}
      </div>

      {/* Scroll container */}
      <div
        className="relative z-0 h-full w-full overflow-auto"
        onScroll={handleScroll}
      >
        {/* Natural headers — scroll with content */}
        <div ref={headersRef} className="shrink-0 bg-white">
          {headerRows}
        </div>

        {/* Table */}
        <table className="w-full border-collapse">
        <thead>
          <tr ref={thRowRef}>
            <th className={`${thClasses} min-w-[180px] px-[10px] py-[8px]`} style={{ position: "sticky", top: 0, zIndex: 20 }}>{t("Name")}</th>
            <th className={`${thClasses} min-w-[160px] px-[10px] py-[8px]`} style={{ position: "sticky", top: 0, zIndex: 20 }}>{t("Meter")}</th>
            <th className={`${thClasses} min-w-[140px] px-[10px] py-[8px]`} style={{ position: "sticky", top: 0, zIndex: 20 }}>{t("Price type")}</th>
            <th className={`${thClasses} min-w-[120px] px-[10px] py-[8px]`} style={{ position: "sticky", top: 0, zIndex: 20 }}>{t("Unit price")}</th>
            <th className={`${thClasses} min-w-[120px] px-[10px] py-[8px]`} style={{ position: "sticky", top: 0, zIndex: 20 }}>{t("Sell as")}</th>
            <th className={`${thClasses} min-w-[120px] px-[10px] py-[8px]`} style={{ position: "sticky", top: 0, zIndex: 20 }}>{t("Unit label")}</th>
          </tr>
        </thead>
        <tbody>
          {rates.map((rate) => {
            const priceType = ratePriceTypes[rate.id] ?? planPriceTypeOptions[0]
            const isTiered = priceType === "Graduated" || priceType === "Volume"

            return (
              <tr key={rate.id}>
                {/* Name */}
                <EditableCell
                  value={rate.name}
                  onChange={(v) => updateRateName(rate.id, v)}
                  placeholder={t("e.g. API Calls")}
                  cellId={`${rate.id}:name`}
                  activeCell={activeCell}
                  setActiveCell={setActiveCell}
                />
                {/* Meter */}
                <SelectorCell
                  value={rateMeters[rate.id] ?? ""}
                  onChange={(next) => setRateMeters((prev) => ({ ...prev, [rate.id]: next }))}
                  options={meterOptions}
                  placeholder={t("Select meter")}
                  ariaLabel={t("Meter")}
                />
                {/* Price type */}
                <SelectorCell
                  value={priceType}
                  onChange={(next) => setRatePriceTypes((prev) => ({ ...prev, [rate.id]: next }))}
                  options={planPriceTypeOptions}
                  getDisplayValue={t}
                  ariaLabel={t("Price type")}
                />
                {/* Unit price */}
                {isTiered ? (
                  <td className="border-b border-r border-[#EBEEF1] last:border-r-0">
                    <span className="block px-[10px] py-[8px] text-[12px] text-[#6C7688]">{t("Tiered")}</span>
                  </td>
                ) : (
                  <EditableCell
                    value={planRateUnitPrices[rate.id] ?? ""}
                    onChange={(v) => setPlanRateUnitPrices((prev) => ({ ...prev, [rate.id]: v }))}
                    placeholder="0.00"
                    cellId={`${rate.id}:unitPrice`}
                    activeCell={activeCell}
                    setActiveCell={setActiveCell}
                    prefix="$"
                    inputMode="decimal"
                  />
                )}
                {/* Sell as */}
                <SelectorCell
                  value={rateSellAs[rate.id] ?? sellAsOptions[0]}
                  onChange={(next) => setRateSellAs((prev) => ({ ...prev, [rate.id]: next }))}
                  options={sellAsOptions}
                  getDisplayValue={t}
                  ariaLabel={t("Sell as")}
                />
                {/* Unit label */}
                <EditableCell
                  value={rateUnitLabels[rate.id] ?? ""}
                  onChange={(v) => setRateUnitLabels((prev) => ({ ...prev, [rate.id]: v }))}
                  placeholder={t("e.g. request")}
                  cellId={`${rate.id}:unitLabel`}
                  activeCell={activeCell}
                  setActiveCell={setActiveCell}
                />
              </tr>
            )
          })}
        </tbody>
        </table>
      </div>
    </div>
  )
}
