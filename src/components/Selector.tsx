'use client'

import type { ReactNode } from "react"
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

type SelectorProps = {
  ariaLabel: string
  options: string[]
  value: string
  onChange: (next: string) => void
  /**
   * Controls the trigger + option typography sizing.
   * - sm: compact (existing default)
   * - md: 14px in trigger and dropdown options
   */
  size?: "sm" | "md"
  buttonClassName?: string
  searchable?: boolean
  /**
   * Placeholder text for the search input when searchable is true.
   */
  searchPlaceholder?: string
  renderOption?: (option: string) => ReactNode
  getSearchKey?: (option: string) => string
  /**
   * Transform the value for display in trigger button and dropdown options
   * (when renderOption is not provided). Useful for i18n translations.
   */
  getDisplayValue?: (value: string) => string
  footerLabel?: string
  onFooterClick?: () => void
  /**
   * When true, horizontally clamps the dropdown so it never overflows
   * the right edge of the viewport. This is primarily used for the
   * drawer surface where the currency selector sits near the edge of
   * the screen.
   */
  constrainToViewportRight?: boolean
  /**
   * Options that should be disabled (shown but not selectable)
   */
  disabledOptions?: string[]
  /**
   * Placeholder text shown in trigger when value is empty
   */
  placeholder?: string
  /**
   * When true, opens the dropdown immediately on mount
   */
  autoOpen?: boolean
  /**
   * Ref to imperatively control the selector (e.g. open it)
   */
  selectorRef?: React.RefObject<{ open: () => void } | null>
  /**
   * When true, hides the chevron icon in the trigger button
   */
  hideChevron?: boolean
  /**
   * Controls when the chevron icon is visible.
   * - always: default behavior
   * - hover: only show chevron when trigger is hovered/focused/open
   * - never: never show chevron (equivalent to hideChevron)
   */
  chevronVisibility?: "always" | "hover" | "never"
  /**
   * Custom icon to show before the label in the trigger button
   */
  triggerIcon?: React.ReactNode
  /**
   * Horizontal offset adjustment for dropdown positioning (default: 0)
   */
  dropdownLeftOffset?: number
  /**
   * Horizontal alignment behavior for the dropdown. When set to "right",
   * the dropdown aligns its right edge with the trigger (so wider menus
   * expand left instead of right).
   */
  dropdownAlign?: "left" | "right"
  /**
   * When true, positions dropdown simply below trigger (left-aligned)
   * instead of aligning selected option with trigger
   */
  simpleDropdownPosition?: boolean
  /**
   * Optional extra classes for each dropdown option row. Useful for
   * local tweaks (e.g. smaller text) without changing global sizing.
   */
  dropdownOptionClassName?: string
  /**
   * When true, removes the vertical gap between option rows in the dropdown.
   * Useful for compact popovers where the selected option should align tightly
   * with the trigger.
   */
  compactDropdownOptions?: boolean
  /**
   * Callback when the dropdown opens or closes
   */
  onOpenChange?: (open: boolean) => void
  /**
   * When true, renders the trigger as icon-only (no label, no chevron).
   * Useful for compact "dot rail" UIs.
   */
  collapsed?: boolean
  /**
   * When true, the trigger wrapper stretches to full available width.
   * Defaults to inline sizing.
   */
  fullWidth?: boolean
  /**
   * When true, the trigger label uses an ellipsis when it overflows.
   * When false, the label is simply clipped (no "…").
   */
  truncateLabel?: boolean
  /**
   * When true, wraps the displayed value text in a highlight background.
   * Used for AI-generated content highlighting.
   */
  highlightValue?: boolean
  /**
   * Custom renderer for the trigger button value. When provided, replaces
   * the default text rendering in the trigger.
   */
  renderTriggerValue?: (value: string) => ReactNode
  /**
   * When true, hides the checkmark icon next to the selected option
   * in the dropdown.
   */
  hideSelectedIndicator?: boolean
  /**
   * Custom class name applied to the selected option row in the dropdown,
   * replacing the default selected background.
   */
  selectedOptionClassName?: string
  /**
   * When true, the dropdown uses the trigger width as a minimum rather than
   * a fixed width, allowing it to expand to fit longer content.
   */
  dropdownAutoWidth?: boolean
  /**
   * Additional class names applied to the dropdown popover container.
   */
  dropdownClassName?: string
}

type SelectorSize = NonNullable<SelectorProps["size"]>

const triggerBaseClasses =
  "group flex min-w-0 items-center gap-[6px] overflow-hidden rounded-[6px] border border-[#D8DEE4] bg-white px-3 text-left font-medium text-[#353A44] whitespace-nowrap hover:border-[#B6C0CD] focus-visible:border-[#B6C0CD] transition-colors"

const triggerSizeClasses: Record<SelectorSize, string> = {
  sm: "h-[30px] text-[12px] leading-[16px]",
  md: "py-[8px] text-[14px] leading-[16px]",
}

const optionSizeClasses: Record<SelectorSize, string> = {
  // Keep "sm" consistent with trigger typography (12px) for a tighter, uniform UI.
  sm: "min-h-[31px] text-[12px] leading-[15px]",
  md: "min-h-[34px] text-[14px] leading-[16px]",
}

const searchInputSizeClasses: Record<SelectorSize, string> = {
  sm: "text-[12px]",
  md: "text-[14px] leading-[16px]",
}

const footerSizeClasses: Record<SelectorSize, string> = {
  sm: "text-[12px]",
  md: "text-[14px] leading-[16px]",
}

const POPOVER_PADDING_PX = 6
// Global fine-tuning nudge for dropdown placement (design polish).
// Positive X moves right; negative Y moves up.
const POPOVER_NUDGE_X_PX = 1.5
const POPOVER_NUDGE_Y_PX = -0.5
const DEFAULT_TRIGGER_HEIGHT_PX: Record<SelectorSize, number> = { sm: 30, md: 34 }

export function Selector({
  ariaLabel,
  options,
  value,
  onChange,
  size = "sm",
  buttonClassName,
  searchable,
  searchPlaceholder,
  renderOption,
  getSearchKey,
  getDisplayValue,
  footerLabel,
  onFooterClick,
  constrainToViewportRight,
  disabledOptions,
  placeholder,
  autoOpen,
  selectorRef,
  hideChevron,
  chevronVisibility = "always",
  triggerIcon,
  dropdownLeftOffset = 0,
  dropdownAlign = "left",
  simpleDropdownPosition = false,
  dropdownOptionClassName,
  compactDropdownOptions = false,
  onOpenChange,
  collapsed = false,
  fullWidth = false,
  truncateLabel = true,
  highlightValue = false,
  renderTriggerValue,
  hideSelectedIndicator = false,
  selectedOptionClassName,
  dropdownAutoWidth = false,
  dropdownClassName,
}: SelectorProps) {
  const t = (key: string) => key
  const safeOptions = options ?? []
  const [open, setOpenInternal] = useState(autoOpen ?? false)
  // Only visually collapse (icon-only) when we actually have an icon to show.
  const shouldCollapseVisual = collapsed && Boolean(triggerIcon)
  
  // Wrapper to call onOpenChange when open state changes
  const setOpen = (newOpen: boolean) => {
    setOpenInternal(newOpen)
    onOpenChange?.(newOpen)
  }
  const [searchQuery, setSearchQuery] = useState("")

  // Expose imperative methods via ref
  useEffect(() => {
    if (selectorRef) {
      (selectorRef as React.MutableRefObject<{ open: () => void } | null>).current = {
        open: () => setOpen(true),
      }
    }
  }, [selectorRef])
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchHeaderRef = useRef<HTMLDivElement>(null)
  const optionsListRef = useRef<HTMLDivElement>(null)
  const optionRefs = useRef(new Map<string, HTMLButtonElement>())
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null)
  const [horizontalShift, setHorizontalShift] = useState<number>(0)
  const [verticalShift, setVerticalShift] = useState<number>(0)
  const [translateY, setTranslateY] = useState<number>(0)
  const [scrollPaddingPx, setScrollPaddingPx] = useState<number>(0)
  const listboxId = useId()

  const filteredOptions = useMemo(() => {
    if (!searchQuery) return safeOptions
    return safeOptions.filter((option) => {
      const key = getSearchKey ? getSearchKey(option) : option
      return key.toLowerCase().includes(searchQuery.toLowerCase())
    })
  }, [safeOptions, searchQuery, getSearchKey])

  useLayoutEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setTriggerRect(rect)
    }
  }, [open])

  const hasFooter = Boolean(footerLabel && onFooterClick)
  // Always position dropdown below the trigger (never overlay-align the selected option)
  const alignSelectedToTrigger = false

  useLayoutEffect(() => {
    if (!open) {
      setSearchQuery("")
      if (scrollPaddingPx !== 0) setScrollPaddingPx(0)
      if (verticalShift !== 0) setVerticalShift(0)
      if (translateY !== 0) setTranslateY(0)
      return
    }

    if (searchable && searchInputRef.current) {
      searchInputRef.current.focus()
      // Fallback: some browsers need a tick for the portal to mount
      const input = searchInputRef.current
      requestAnimationFrame(() => {
        if (document.activeElement !== input) input.focus()
      })
    }
  }, [open, searchable, scrollPaddingPx, verticalShift, translateY])

  useLayoutEffect(() => {
    if (!open) return
    if (alignSelectedToTrigger) return
    if (!optionsListRef.current) return

    const selectedElement = optionRefs.current.get(value)
    if (!selectedElement) return

    const listEl = optionsListRef.current

    // Only add scroll padding when the list actually overflows — otherwise it
    // creates visible empty space at the top/bottom of short dropdowns.
    if (listEl.scrollHeight <= listEl.clientHeight + 1) {
      if (scrollPaddingPx !== 0) setScrollPaddingPx(0)
      return
    }

    const optionHeight = selectedElement.getBoundingClientRect().height || 0
    const visibleHeight = listEl.clientHeight || 0
    if (optionHeight <= 0 || visibleHeight <= 0) return

    // Add extra scroll padding so the first/last option can still be centered.
    const desiredPadding = Math.max((visibleHeight - optionHeight) / 2, 0)
    if (Math.abs(desiredPadding - scrollPaddingPx) > 0.5) {
      setScrollPaddingPx(desiredPadding)
    }
  }, [open, value, scrollPaddingPx, alignSelectedToTrigger])

  useLayoutEffect(() => {
    if (!open) return
    if (alignSelectedToTrigger) return
    if (!optionsListRef.current) return

    const selectedElement = optionRefs.current.get(value)
    if (!selectedElement) return

    const listEl = optionsListRef.current
    const optionHeight = selectedElement.getBoundingClientRect().height
    const optionCenter = selectedElement.offsetTop + optionHeight / 2
    const visibleHeight = listEl.clientHeight
    const desiredScrollTop = optionCenter - visibleHeight / 2
    const maxScroll = Math.max(listEl.scrollHeight - visibleHeight, 0)
    const clampedScroll = Math.max(Math.min(desiredScrollTop, maxScroll), 0)
    listEl.scrollTop = clampedScroll
  }, [open, value, scrollPaddingPx, filteredOptions.length, alignSelectedToTrigger])

  useLayoutEffect(() => {
    if (!open) return
    if (!alignSelectedToTrigger) return

    const selectedElement = optionRefs.current.get(value)
    if (!selectedElement || !listRef.current) {
      if (translateY !== 0) setTranslateY(0)
      return
    }

    const triggerHeight = triggerRect?.height ?? DEFAULT_TRIGGER_HEIGHT_PX[size]
    const listRect = listRef.current.getBoundingClientRect()
    const selectedRect = selectedElement.getBoundingClientRect()

    // Compute where the selected option center currently sits inside the popover (accounts for scroll + padding + headers).
    const selectedCenterInPopover = selectedRect.top - listRect.top + selectedRect.height / 2
    const desiredCenterInPopover = triggerHeight / 2
    const baseTranslate = desiredCenterInPopover - selectedCenterInPopover

    // Clamp the translated popover to remain on-screen. We do this here (instead of a separate effect)
    // to avoid "tug-of-war" between alignment and clamping.
    if (typeof window === "undefined") {
      if (Math.abs(baseTranslate - translateY) > 0.5) setTranslateY(baseTranslate)
      return
    }

    const viewportHeight = window.innerHeight
    const margin = 8
    // listRect includes the *current* transform; remove it to estimate the untransformed top.
    const untransformedTop = listRect.top - translateY
    const candidateTop = untransformedTop + baseTranslate
    const candidateBottom = candidateTop + listRect.height

    const topOverflow = margin - candidateTop
    const bottomOverflow = candidateBottom - (viewportHeight - margin)
    const clampAdjust = topOverflow > 0 ? topOverflow : bottomOverflow > 0 ? -bottomOverflow : 0

    const nextTranslate = baseTranslate + clampAdjust
    if (Math.abs(nextTranslate - translateY) > 0.5) setTranslateY(nextTranslate)
  }, [open, value, triggerRect, size, alignSelectedToTrigger, translateY])

  useLayoutEffect(() => {
    const shouldAdjust = Boolean(open && triggerRect && (constrainToViewportRight || dropdownAlign === "right"))
    if (!shouldAdjust || typeof window === "undefined") {
      // Reset any previous horizontal adjustment when the popover closes
      // or when we are not constraining/alignment-shifting.
      if (horizontalShift !== 0) setHorizontalShift(0)
      return
    }

    if (!listRef.current || !triggerRect) return

    const viewportWidth = window.innerWidth
    const margin = 8
    const rect = listRef.current.getBoundingClientRect()

    const baseLeft =
      (triggerRect.left ?? 0) +
      (simpleDropdownPosition ? 0 : searchable ? -8.5 : -7.5) +
      dropdownLeftOffset +
      POPOVER_NUDGE_X_PX

    // When right-aligned, shift by the delta between trigger width and dropdown width
    // so the dropdown's right edge hugs the trigger (wider menus expand left).
    const alignmentShift = dropdownAlign === "right" ? (triggerRect.width ?? 0) - rect.width : 0
    const desiredLeftUnclamped = baseLeft + alignmentShift

    // Clamp horizontally so the dropdown never falls off-screen.
    const minLeft = margin
    const maxLeft = viewportWidth - margin - rect.width
    const desiredLeft = Math.min(Math.max(desiredLeftUnclamped, minLeft), maxLeft)

    const nextShift = desiredLeft - baseLeft
    if (Math.abs(nextShift - horizontalShift) > 0.5) setHorizontalShift(nextShift)
  }, [
    open,
    triggerRect,
    constrainToViewportRight,
    searchable,
    footerLabel,
    onFooterClick,
    simpleDropdownPosition,
    dropdownLeftOffset,
    dropdownAlign,
  ])

  useLayoutEffect(() => {
    if (!open || typeof window === "undefined") return
    if (alignSelectedToTrigger) return
    if (!listRef.current || !triggerRect) return

    const viewportHeight = window.innerHeight
    const margin = 8
    const rect = listRef.current.getBoundingClientRect()

    const baseTop = (triggerRect.bottom ?? 0) + 4 + POPOVER_NUDGE_Y_PX
    const minTop = margin
    const maxTop = viewportHeight - margin - rect.height
    const desiredTop = Math.min(Math.max(baseTop, minTop), Math.max(maxTop, minTop))

    const nextShift = desiredTop - baseTop
    if (Math.abs(nextShift - verticalShift) > 0.5) setVerticalShift(nextShift)
  }, [open, triggerRect, searchable, footerLabel, onFooterClick, verticalShift, alignSelectedToTrigger])

  // NOTE: aligned-mode clamping is handled inside the alignment effect above
  // to avoid fighting over translateY.

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (!triggerRef.current?.contains(target) && !listRef.current?.contains(target)) {
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

  const optionGapClass = compactDropdownOptions ? "" : "gap-[6px]"

  const popover =
    open && triggerRect
      ? (
          <div
            ref={listRef}
            id={listboxId}
            role="listbox"
            aria-label={ariaLabel}
            className={cn(
              "fixed z-[999] inline-flex max-h-80 flex-col overflow-hidden rounded-[6px] border border-[#D8DEE4] bg-white shadow-[0_12px_32px_rgba(28,32,40,0.12)]",
              searchable || hasFooter ? "p-0" : `${optionGapClass} p-[6px] overflow-y-auto`,
              dropdownClassName
            )}
            style={{
              ...(dropdownAutoWidth ? { minWidth: triggerRect.width } : { width: triggerRect.width }),
              left:
                (triggerRect.left ?? 0) +
                dropdownLeftOffset +
                POPOVER_NUDGE_X_PX +
                (constrainToViewportRight || dropdownAlign === "right" ? horizontalShift : 0),
              top: (triggerRect.bottom ?? 0) + 8 + POPOVER_NUDGE_Y_PX + verticalShift,
              transform: alignSelectedToTrigger ? `translate(0, ${translateY}px)` : undefined,
            }}
          >
            {searchable && (
              <div ref={searchHeaderRef} className="border-b border-[#EBEEF1] px-3 py-[7px]">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={searchPlaceholder ?? t("Search")}
                  autoComplete="off"
                  className={cn(
                    "w-full bg-transparent font-[500] text-[#353A44] placeholder:text-[#818DA0] outline-none",
                    searchInputSizeClasses[size]
                  )}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
            <div
              ref={optionsListRef}
              className={cn(
                searchable || hasFooter
                  ? `flex max-h-[280px] flex-col ${optionGapClass} overflow-y-auto px-[6px] pt-[6px]`
                  : "contents"
              )}
              style={{
                paddingTop: searchable || hasFooter ? POPOVER_PADDING_PX + (searchQuery ? 0 : scrollPaddingPx) : undefined,
                paddingBottom: searchable || hasFooter ? (hasFooter ? 0 : POPOVER_PADDING_PX) + (searchQuery ? 0 : scrollPaddingPx) : undefined,
              }}
            >
              {filteredOptions.map((option) => {
                const isSelected = option === value
                const isDisabled = disabledOptions?.includes(option) ?? false
                return (
                  <button
                    key={option}
                    ref={(node) => {
                      if (node) {
                        optionRefs.current.set(option, node)
                      } else {
                        optionRefs.current.delete(option)
                      }
                    }}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={isDisabled}
                    disabled={isDisabled}
                    className={cn(
                      "flex w-full items-center rounded-[6px] px-[12px] py-[8px] text-left font-[500] whitespace-nowrap overflow-hidden text-ellipsis",
                      optionSizeClasses[size],
                      isDisabled ? "text-[#AEB9C7] cursor-not-allowed" : "text-[#353A44] hover:bg-[#F5F6F8]",
                      isSelected && (selectedOptionClassName ?? "bg-[#F5F6F8]"),
                      dropdownOptionClassName
                    )}
                    onClick={() => {
                      if (!isDisabled) {
                        onChange(option)
                        setOpen(false)
                      }
                    }}
                  >
                    {renderOption ? <>{renderOption(option)}</> : <span className="flex-1">{getDisplayValue ? getDisplayValue(option) : option}</span>}
                    {isSelected && !hideSelectedIndicator && (
                      <span className="ml-6">
                        <SelectedIndicatorIcon />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            {hasFooter && onFooterClick && (
              <button
                type="button"
                className="w-full border-t border-[#EBEEF1] text-left"
                onClick={(e) => {
                  e.stopPropagation()
                  onFooterClick()
                  setOpen(false)
                }}
              >
                <div className={cn("px-5 py-[8px] font-[500] text-[#533AFD]", footerSizeClasses[size])}>
                  {footerLabel}
                </div>
              </button>
            )}
          </div>
        )
      : null

  return (
    <div className={cn(fullWidth ? "relative flex w-full" : "relative inline-flex")}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        className={cn(triggerBaseClasses, triggerSizeClasses[size], fullWidth && "w-full", highlightValue && "!border-l-[3px] !border-l-[#533AFD]", buttonClassName)}
        onClick={() => setOpen(!open)}
      >
        {triggerIcon}
        {shouldCollapseVisual ? (
          <span className="sr-only">
            {value ? (getDisplayValue ? getDisplayValue(value) : value) : placeholder}
          </span>
        ) : (
          <span
            className={cn(
              "whitespace-nowrap transition-opacity duration-150",
              !value && placeholder && "text-[#818DA0]",
              fullWidth && "min-w-0 flex-1 overflow-hidden",
              fullWidth && truncateLabel && "text-ellipsis"
            )}
          >
            {value ? (
              renderTriggerValue ? (
                renderTriggerValue(value)
              ) : highlightValue ? (
                <span className="rounded-[3px] bg-[#E0D9FB] px-0.5">{getDisplayValue ? getDisplayValue(value) : value}</span>
              ) : (
                getDisplayValue ? getDisplayValue(value) : value
              )
            ) : placeholder}
          </span>
        )}
        {!hideChevron && chevronVisibility !== "never" && !shouldCollapseVisual && (
          <span
            className={cn(
              "shrink-0 transition-opacity duration-150",
              chevronVisibility === "hover" &&
                "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100",
              // Ensure chevron stays visible while the menu is open.
              chevronVisibility === "hover" && open && "opacity-100"
            )}
          >
            <SmallChevronIcon />
          </span>
        )}
      </button>
      {open && typeof document !== "undefined" && popover ? createPortal(popover, document.body) : null}
    </div>
  )
}

function SmallChevronIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="8" height="5" fill="none" viewBox="0 0 8 5">
      <path
        fill="#6C7688"
        fillRule="evenodd"
        d="M.231.209c-.299.286-.309.76-.022 1.06l2.875 3C3.224 4.417 3.42 4.5 3.625 4.5c.204.001.4-.082.541-.23l2.875-2.995c.287-.299.277-.773-.022-1.06-.299-.287-.774-.277-1.06.022L3.625 2.667 1.29.231C1.005-.068.53-.078.231.21Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function SelectedIndicatorIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="8" height="7" viewBox="0 0 8 7" fill="none">
      <path
        fill="#474E5A"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.73576.178561c.3156.268264.354.741585.08572 1.057189l-4.25 5c-.1441.16952-.35602.26632-.57849.26423-.22248-.00209-.43255-.10284-.57344-.27504l-2.25-2.75c-.262301-.32058-.215049-.7931.105534-1.05539.320584-.2623.793095-.21505 1.055395.10554L3.01101 4.57905 6.67857.264279c.26826-.315606.74158-.353983 1.05719-.085718Z"
      />
    </svg>
  )
}


