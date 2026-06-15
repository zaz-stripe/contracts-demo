"use client"

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import type { FocusEvent, KeyboardEvent } from "react"
import { createPortal } from "react-dom"
import { Selector } from "@/components/Selector"
import { useComboboxStyle, type ComboboxStyle } from "@/components/product-catalog/comboboxStyle"

type ComboboxInputProps = {
  highlightKey: string
  isHighlighted: (key: string) => boolean
  textFieldInputClasses: string
  value: string
  onChange: (value: string) => void
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void
  onFocus?: (e: FocusEvent<HTMLInputElement>) => void
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void
  placeholder?: string
  className?: string
  autoFocus?: boolean
  allSuggestions: string[]
  suggestions: string[]
  /** Called when the selector variant wants to show/hide a label action (e.g. "Select existing" link). */
  onLabelActionChange?: (action: React.ReactNode) => void
}

function HighlightedReadOnly({ value, placeholder, className }: { value: string; placeholder?: string; className?: string }) {
  return (
    <div className={`flex h-[30px] w-full items-center overflow-hidden rounded-[6px] border border-[#D8DEE4] border-l-[3px] border-l-[#533AFD] bg-white px-[12px] text-[12px] font-[500] text-[#353A44] ${className ?? ""}`}>
      <span className="truncate rounded-[3px] bg-[#E0D9FB] px-0.5">{value || placeholder}</span>
    </div>
  )
}

function SmallListIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M2 3.5H10M2 6H10M2 8.5H10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

// ─── Selector Variant ───────────────────────────────────────────────────────
// Follows the Meter pattern with different "back to select" affordances.

type BackMode = "link" | "btn" | "clear" | "segmented"

function SelectorVariant({
  highlightKey,
  isHighlighted,
  textFieldInputClasses,
  value,
  onChange,
  onKeyDown,
  onFocus,
  onBlur,
  placeholder,
  className,
  autoFocus,
  allSuggestions,
  suggestions,
  onLabelActionChange,
  backMode,
  defaultCreate = false,
}: ComboboxInputProps & { backMode: BackMode; defaultCreate?: boolean }) {
  const [mode, setMode] = useState<"select" | "create">(
    defaultCreate ? "create" : (value.trim() && !allSuggestions.includes(value) ? "create" : "select")
  )
  const [autoOpenSelector, setAutoOpenSelector] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  // Track if user has typed in create mode (for "clear" back mode)
  const hasTypedInCreateRef = useRef(false)

  useEffect(() => {
    if (autoFocus && mode === "create" && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [autoFocus, mode])

  // "clear" back mode: when input is emptied AFTER typing, switch back to select
  useEffect(() => {
    if (backMode === "clear" && mode === "create" && value === "" && hasTypedInCreateRef.current) {
      hasTypedInCreateRef.current = false
      setMode("select")
    }
  }, [backMode, mode, value])

  const goBackToSelect = () => {
    hasTypedInCreateRef.current = false
    setAutoOpenSelector(true)
    setMode("select")
    onChange("")
  }

  // Notify parent of label action based on mode
  useEffect(() => {
    if (!onLabelActionChange) return
    if (mode === "create" && (backMode === "link" || backMode === "clear" || defaultCreate) && suggestions.length > 0) {
      onLabelActionChange(
        <button
          type="button"
          className="text-[12px] font-[400] leading-[16px] text-[#533AFD] hover:text-[#3D1FDB]"
          onClick={goBackToSelect}
        >
          {defaultCreate ? "Use existing" : "Select existing"}
        </button>
      )
    } else {
      onLabelActionChange(null)
    }
    return () => onLabelActionChange(null)
  }, [mode, backMode, suggestions.length])

  if (isHighlighted(highlightKey)) {
    return <HighlightedReadOnly value={value} placeholder={placeholder} className={className} />
  }

  const handleCreateChange = (newValue: string) => {
    if (newValue.length > 0) hasTypedInCreateRef.current = true
    onChange(newValue)
  }

  // ── Create mode ──
  if (mode === "create") {
    const segmentedHeader = backMode === "segmented" ? (
      <div className="mb-[6px] flex rounded-[6px] bg-[#EBEEF1] p-[3px]">
        <button type="button" onClick={goBackToSelect} className="flex-1 rounded-[4px] px-[8px] py-[3px] text-[11px] font-[500] text-[#596171] hover:bg-[#D4DEE9]">
          Select existing
        </button>
        <button type="button" className="flex-1 rounded-[4px] bg-white px-[8px] py-[3px] text-[11px] font-[500] text-[#353A44] shadow-sm">
          Create new
        </button>
      </div>
    ) : null

    const inputField = backMode === "btn" ? (
      <div className="relative">
        <input
          ref={inputRef}
          className={`${textFieldInputClasses} pr-[32px] ${className ?? ""}`}
          value={value}
          onChange={(e) => handleCreateChange(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          autoFocus={autoFocus}
        />
        <button
          type="button"
          className="absolute right-[1px] top-[1px] flex h-[28px] w-[28px] items-center justify-center rounded-r-[5px] text-[#6C7688] hover:bg-[#F5F6F8] hover:text-[#353A44] transition-colors"
          onClick={goBackToSelect}
          title="Select existing"
        >
          <SmallListIcon />
        </button>
      </div>
    ) : (
      <input
        ref={inputRef}
        className={`${textFieldInputClasses} ${className ?? ""}`}
        value={value}
        onChange={(e) => handleCreateChange(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        autoFocus={autoFocus}
      />
    )

    return (
      <>
        {segmentedHeader}
        {inputField}
      </>
    )
  }

  // ── Select mode ──
  const segmentedHeader = backMode === "segmented" ? (
    <div className="mb-[6px] flex rounded-[6px] bg-[#EBEEF1] p-[3px]">
      <button type="button" className="flex-1 rounded-[4px] bg-white px-[8px] py-[3px] text-[11px] font-[500] text-[#353A44] shadow-sm">
        Select existing
      </button>
      <button type="button" onClick={() => { setMode("create"); onChange(""); requestAnimationFrame(() => inputRef.current?.focus()) }} className="flex-1 rounded-[4px] px-[8px] py-[3px] text-[11px] font-[500] text-[#596171] hover:bg-[#D4DEE9]">
        Create new
      </button>
    </div>
  ) : null

  return (
    <>
      {segmentedHeader}
      <Selector
        ariaLabel="Product"
        size="sm"
        value={value}
        onChange={(next) => { onChange(next); setAutoOpenSelector(false) }}
        options={suggestions}
        placeholder={placeholder ?? "Select or add new"}
        footerLabel="+ Add new"
        autoOpen={autoOpenSelector}
        onOpenChange={(open) => { if (!open) setAutoOpenSelector(false) }}
        onFooterClick={() => {
          hasTypedInCreateRef.current = false
          setAutoOpenSelector(false)
          setMode("create")
          onChange("")
          requestAnimationFrame(() => inputRef.current?.focus())
        }}
        fullWidth
        buttonClassName={`h-[30px] justify-between px-[12px] py-[6px] text-[12px] font-[500] leading-[16px] ${
          !value.trim() ? "text-[#6C7688]" : "text-[#353A44]"
        } ${className ?? ""}`}
      />
    </>
  )
}

// ─── Combobox Variant ───────────────────────────────────────────────────────
// Dropdown only on typing (not on focus). Shows "Using existing item" hint.

function ComboboxVariant({
  highlightKey,
  isHighlighted,
  textFieldInputClasses,
  value,
  onChange,
  onKeyDown,
  onFocus,
  onBlur,
  placeholder,
  className,
  autoFocus,
  allSuggestions,
  suggestions,
}: ComboboxInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [inputRect, setInputRect] = useState<DOMRect | null>(null)
  const isSelectingRef = useRef(false)
  const [selectedFromExisting, setSelectedFromExisting] = useState(false)

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [autoFocus])

  const filtered = useMemo(() => {
    if (!value.trim()) return suggestions
    const lower = value.toLowerCase()
    return suggestions.filter((s) => s.toLowerCase().includes(lower))
  }, [suggestions, value])

  const showCreateRow = value.trim() !== "" && !allSuggestions.includes(value)
  const totalItems = (showCreateRow ? 1 : 0) + filtered.length
  const hasDropdownContent = totalItems > 0

  useLayoutEffect(() => {
    if (isOpen && inputRef.current) {
      setInputRect(inputRef.current.getBoundingClientRect())
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (!inputRef.current?.contains(target) && !dropdownRef.current?.contains(target)) setIsOpen(false)
    }
    const handleEscape = (e: globalThis.KeyboardEvent) => { if (e.key === "Escape") setIsOpen(false) }
    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("keydown", handleEscape)
    return () => { document.removeEventListener("mousedown", handlePointerDown); document.removeEventListener("keydown", handleEscape) }
  }, [isOpen])

  useEffect(() => { setHighlightedIndex(showCreateRow ? 0 : -1) }, [filtered.length, showCreateRow])

  const confirmCreate = () => { setSelectedFromExisting(false); setIsOpen(false); setHighlightedIndex(-1) }
  const selectSuggestion = (val: string) => {
    onChange(val); setSelectedFromExisting(true); setIsOpen(false); setHighlightedIndex(-1)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (isOpen && hasDropdownContent) {
      if (e.key === "ArrowDown") { e.preventDefault(); setHighlightedIndex((p) => (p < totalItems - 1 ? p + 1 : 0)); return }
      if (e.key === "ArrowUp") { e.preventDefault(); setHighlightedIndex((p) => (p > 0 ? p - 1 : totalItems - 1)); return }
      if (e.key === "Enter" && highlightedIndex >= 0) {
        e.preventDefault(); e.stopPropagation()
        if (showCreateRow && highlightedIndex === 0) confirmCreate()
        else { const idx = showCreateRow ? highlightedIndex - 1 : highlightedIndex; if (idx >= 0 && idx < filtered.length) selectSuggestion(filtered[idx]) }
        return
      }
      if (e.key === "Escape") { e.preventDefault(); setIsOpen(false); return }
    }
    onKeyDown?.(e)
  }

  const handleFocus = (e: FocusEvent<HTMLInputElement>) => { onFocus?.(e) }
  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    if (isSelectingRef.current) { isSelectingRef.current = false; return }
    setIsOpen(false); onBlur?.(e)
  }
  const handleInputChange = (newValue: string) => {
    onChange(newValue); setSelectedFromExisting(false)
    // Only open dropdown when there's actual text typed
    if (newValue.trim() && suggestions.length > 0) setIsOpen(true)
    else setIsOpen(false)
  }

  if (isHighlighted(highlightKey)) {
    return <HighlightedReadOnly value={value} placeholder={placeholder} className={className} />
  }

  const createRowIndex = 0
  const dropdown = isOpen && hasDropdownContent && inputRect
    ? createPortal(
        <div ref={dropdownRef} className="fixed z-[999] flex max-h-[240px] flex-col overflow-hidden rounded-[6px] border border-[#D8DEE4] bg-white shadow-[0_12px_32px_rgba(28,32,40,0.12)]"
          style={{ width: inputRect.width, left: inputRect.left, top: inputRect.bottom + 4 }}>
          <div className="flex flex-col overflow-y-auto p-[6px]">
            {showCreateRow && (
              <button type="button"
                className={`flex w-full min-h-[31px] items-center gap-[6px] rounded-[6px] px-[12px] py-[8px] text-left text-[12px] font-[500] leading-[15px] text-[#353A44] ${highlightedIndex === createRowIndex ? "bg-[#F5F6F8]" : "hover:bg-[#F5F6F8]"}`}
                onMouseDown={(e) => { e.preventDefault(); isSelectingRef.current = true }} onClick={confirmCreate}>
                <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8" fill="none" className="shrink-0">
                  <path d="M4.75 0.75C4.75 0.335786 4.41421 0 4 0C3.58579 0 3.25 0.335786 3.25 0.75V3.25H0.75C0.335786 3.25 0 3.58579 0 4C0 4.41421 0.335786 4.75 0.75 4.75H3.25V7.25C3.25 7.66421 3.58579 8 4 8C4.41421 8 4.75 7.66421 4.75 7.25V4.75H7.25C7.66421 4.75 8 4.41421 8 4C8 3.58579 7.66421 3.25 7.25 3.25H4.75V0.75Z" fill="#3C4F69" />
                </svg>
                <span>{value}</span>
              </button>
            )}
            {filtered.map((item, index) => {
              const itemIndex = showCreateRow ? index + 1 : index
              return (
                <button key={item} type="button"
                  className={`flex w-full min-h-[31px] items-center rounded-[6px] px-[12px] py-[8px] text-left text-[12px] font-[500] leading-[15px] whitespace-nowrap text-[#353A44] ${itemIndex === highlightedIndex ? "bg-[#F5F6F8]" : "hover:bg-[#F5F6F8]"}`}
                  onMouseDown={(e) => { e.preventDefault(); isSelectingRef.current = true }} onClick={() => selectSuggestion(item)}>
                  {item}
                </button>
              )
            })}
          </div>
        </div>,
        document.body
      )
    : null

  return (
    <>
      <input ref={inputRef} className={`${textFieldInputClasses} ${className ?? ""}`} value={value}
        onChange={(e) => handleInputChange(e.target.value)} onKeyDown={handleInputKeyDown}
        onFocus={handleFocus} onBlur={handleBlur} placeholder={placeholder} autoFocus={autoFocus} />
      {selectedFromExisting && value.trim() && (
        <span className="mt-[2px] text-[10px] font-[500] text-[#6C7688]">Using existing item</span>
      )}
      {dropdown}
    </>
  )
}

// ─── Main export ────────────────────────────────────────────────────────────

const BACK_MODE_MAP: Partial<Record<ComboboxStyle, BackMode>> = {
  "sel-link": "link",
  "sel-btn": "btn",
  "sel-clear": "clear",
  "sel-segmented": "segmented",
  "create-first": "link",
}

export function ComboboxInput(props: ComboboxInputProps) {
  const { comboboxStyle } = useComboboxStyle()
  if (comboboxStyle === "create-first") return <SelectorVariant {...props} backMode="link" defaultCreate />
  const backMode = BACK_MODE_MAP[comboboxStyle]
  if (backMode) return <SelectorVariant {...props} backMode={backMode} />
  return <ComboboxVariant {...props} />
}
