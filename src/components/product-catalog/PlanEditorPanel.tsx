'use client'

import { useEffect, useLayoutEffect, useDeferredValue, useMemo, useRef, useState, type RefObject } from "react"
import { createPortal } from "react-dom"
import { motion } from "framer-motion"

import {
  AiSparkleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseTinyIcon,
  DuplicateIcon,
  EllipsesIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
} from "@/components/ProductCatalogIcons"
import { CatalogObjectGlyph } from "@/components/product-catalog/iconography"
import { ControlTooltip } from "@/components/product-catalog/ControlTooltip"
import type { ComponentRecord, ComponentVersion } from "@/components/product-catalog/componentTypes"

type NodeType = "plan" | "rateCard" | "rate" | "rateMeter" | "creditGrant" | "subscriptionFee" | "priceGroup"

type PlanEditorPanelProps = {
  t: (key: string) => string
  headerLabel: string
  /** Parent label shown in header when sidebar is closed (e.g., "Rate card" when editing a Rate) */
  parentLabel?: string
  /** Navigate to the parent node */
  onNavigateToParent?: () => void
  /** Navigate to the plan root */
  onNavigateToPlan?: () => void
  /** Navigate to previous item in flattened tree order */
  onNavigatePrev?: () => void
  /** Navigate to next item in flattened tree order */
  onNavigateNext?: () => void
  /** True when items were added while the sidebar was closed */
  hasTreeChanges?: boolean
  deleteLabel: string
  /** The type of node being edited, used to display the correct icon */
  nodeType?: NodeType
  onBack?: () => void
  /** When true, show the back button on desktop breakpoints too. */
  showBackButtonOnDesktop?: boolean
  onClose?: () => void
  isActionsOpen: boolean
  onToggleActions: () => void
  onCloseActions: () => void
  actionsButtonRef: RefObject<HTMLButtonElement | null>
  actionsMenuRef: RefObject<HTMLDivElement | null>
  onDelete: () => void
  isLoading: boolean
  onOpenAssistant?: () => void
  isFixed?: boolean
  children: React.ReactNode
  // Component system props
  hasComponents?: boolean
  existingComponents?: ComponentRecord[]
  onUseExistingComponent?: (componentId: string) => void
  componentVersions?: ComponentVersion[]
  activeComponentVersionId?: string
  onChangeComponentVersion?: (versionId: string) => void
  isDraftComponent?: boolean
  /** When true, the form body is read-only (non-latest version selected) */
  isComponentReadOnly?: boolean
  // Tree nav + add button (new header layout)
  isTreeNavOpen?: boolean
  onToggleTreeNav?: () => void
  hamburgerButtonRef?: RefObject<HTMLButtonElement | null>
  formAddButtonRef?: RefObject<HTMLButtonElement | null>
  onToggleAddPlanObject?: (anchorEl?: HTMLElement) => void
  /** Directly add a rate to the current rate card (bypasses the popover when no components exist) */
  onDirectAddRate?: () => void
  /** Whether there are existing rate components to choose from */
  hasRateComponents?: boolean
  onDismissNavHint?: () => void
  onDismissGetStarted?: () => void
  /** Ghost preview callback for hovering the bottom add button */
  onHoverGhostKind?: (kind: "rate" | "subscription-fee" | "credit-grant" | "rate-card" | null) => void
  // Next-step prompt state
  /** Number of rates in the currently selected rate card */
  currentRateCount?: number
  /** Whether the currently selected rate has a meter assigned */
  currentRateHasMeter?: boolean
  /** Whether the plan has any rate cards */
  planHasRateCards?: boolean
  /** Directly add a rate (creates rate card if needed) — used by "What's next" prompt */
  onAddFirstRate?: () => void
  /** Duplicate the current node */
  onDuplicate?: () => void
  /** Hide the header area (used when Get Started UI replaces the form) */
  hideHeader?: boolean
  /**
   * Animate the header collapsed (height: 0) instead of unmounting it.
   * When toggled false, the header smoothly pushes down into view in sync
   * with the chrome push animation.
   */
  collapseHeader?: boolean
}

// Map node type to glyph kind
function nodeTypeToGlyphKind(nodeType: NodeType): "plan" | "rateCard" | "rate" | "meter" | "creditGrant" | "subscriptionFee" {
  if (nodeType === "rateMeter") return "meter"
  if (nodeType === "priceGroup") return "rateCard"
  return nodeType as "plan" | "rateCard" | "rate" | "creditGrant" | "subscriptionFee"
}

// ── "Use Existing" fly-out sub-menu ──────────────────────────────────
function UseExistingFlyout({
  t,
  components,
  onSelect,
}: {
  t: (key: string) => string
  components: ComponentRecord[]
  onSelect: (componentId: string) => void
}) {
  const [search, setSearch] = useState("")
  const deferredSearch = useDeferredValue(search)
  const lower = deferredSearch.toLowerCase()

  const filtered = useMemo(
    () => (lower ? components.filter((c) => c.name.toLowerCase().includes(lower)) : components),
    [components, lower],
  )

  return (
    <div className="absolute left-full top-0 z-50 ml-[2px] w-[220px] overflow-hidden rounded-[6px] border border-[#D8DEE4] bg-white shadow-[0_12px_32px_rgba(28,32,40,0.12)]">
      <div className="p-[8px]">
        <div className="flex items-center gap-[4px] rounded-[6px] border border-[#ECF1F6] bg-white px-[8px] py-[6px]">
          <SearchIcon className="h-[12px] w-[12px] shrink-0 text-[#667691]" />
          <input
            type="text"
            className="w-full bg-transparent text-[12px] font-[400] leading-[16px] text-[#1A2C44] placeholder:text-[#667691] outline-none"
            placeholder={t("Search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>
      </div>
      <div className="max-h-[200px] overflow-y-auto px-[4px] pb-[4px]">
        {filtered.map((comp) => (
          <button
            key={comp.componentId}
            type="button"
            className="flex w-full items-center justify-between rounded-[6px] px-[8px] py-[6px] text-left text-[12px] hover:bg-[#F5F6F8] transition-colors"
            onClick={() => onSelect(comp.componentId)}
          >
            <div className="flex min-w-0 items-center gap-[6px]">
              <CatalogObjectGlyph kind={comp.kind} />
              <span className="truncate font-[400] text-[#1A2C44]">{comp.name}</span>
            </div>
            <span className="ml-[8px] shrink-0 text-[#667691]">{comp.summary}</span>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="px-[8px] py-[6px] text-[12px] text-[#667691]">{t("No results")}</p>
        )}
      </div>
    </div>
  )
}

// ── Version icon button (database icon) + flyout ─────────────────────
function VersionIconButton({
  t,
  existingComponents,
  onReplaceWith,
  onRemove,
}: {
  t: (key: string) => string
  existingComponents?: ComponentRecord[]
  onReplaceWith?: (componentId: string) => void
  onRemove?: () => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isReplaceOpen, setIsReplaceOpen] = useState(false)
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null)
  const [replacePos, setReplacePos] = useState<{ top: number; left: number } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const replaceRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const replaceRowRef = useRef<HTMLButtonElement>(null)

  const hasReplacements = existingComponents && existingComponents.length > 0 && onReplaceWith

  // Position the main menu below the icon button
  useLayoutEffect(() => {
    if (!isOpen || !buttonRef.current) return
    const r = buttonRef.current.getBoundingClientRect()
    setMenuPos({ top: r.bottom + 4, left: r.left })
  }, [isOpen])

  // Position the replace flyout to the right of its row
  useLayoutEffect(() => {
    if (!isReplaceOpen || !replaceRowRef.current) return
    const r = replaceRowRef.current.getBoundingClientRect()
    setReplacePos({ top: r.top, left: r.right + 2 })
  }, [isReplaceOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node
      const inMenu = menuRef.current?.contains(target)
      const inReplace = replaceRef.current?.contains(target)
      const inButton = buttonRef.current?.contains(target)
      if (!inMenu && !inReplace && !inButton) {
        setIsOpen(false)
        setIsReplaceOpen(false)
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setIsOpen(false); setIsReplaceOpen(false) }
    }
    document.addEventListener("mousedown", handleClick)
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("mousedown", handleClick)
      document.removeEventListener("keydown", handleKey)
    }
  }, [isOpen])

  const databaseIcon = (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <path fillRule="evenodd" clipRule="evenodd" d="M1 2.75C1 1.23122 3.23858 0 6 0C8.76142 0 11 1.23122 11 2.75C11 2.83427 10.9931 2.91766 10.9796 3H11V9.5C11 10.8807 8.7614 12 6 12C3.2386 12 1.00004 10.8807 1 9.5V3H1.02038C1.00689 2.91766 1 2.83427 1 2.75ZM2.4 2.75C2.4 2.73712 2.4275 2.42356 3.13915 2.03216C3.80039 1.66848 4.80919 1.4 6 1.4C7.19081 1.4 8.19961 1.66848 8.86085 2.03216C9.5725 2.42357 9.6 2.73712 9.6 2.75C9.6 2.76288 9.5725 3.07644 8.86085 3.46784C8.19961 3.83152 7.19081 4.1 6 4.1C4.80919 4.1 3.80039 3.83152 3.13915 3.46784C2.4275 3.07643 2.4 2.76288 2.4 2.75ZM2.4 4.65843V6.29363C2.52893 6.41588 2.72415 6.55597 3.00112 6.69445C3.7066 7.04719 4.76519 7.3 6 7.3C7.23481 7.3 8.2934 7.04719 8.99888 6.69445C9.27585 6.55597 9.47107 6.41588 9.6 6.29363V4.65843C8.69056 5.17726 7.41381 5.5 6 5.5C4.58619 5.5 3.30944 5.17726 2.4 4.65843ZM2.4 9.5V7.73494C3.30944 8.2066 4.58619 8.5 6 8.5C7.41381 8.5 8.69056 8.2066 9.6 7.73494V9.5H9.58558C9.54415 9.57405 9.39909 9.77071 8.90944 10.0155C8.23718 10.3517 7.2105 10.6 6 10.6C4.7895 10.6 3.76282 10.3517 3.09057 10.0155C2.60091 9.77071 2.45585 9.57405 2.41442 9.5H2.4Z" fill="#474E5A"/>
    </svg>
  )

  return (
    <div className="relative flex-shrink-0">
      <button
        ref={buttonRef}
        type="button"
        className={`flex h-[24px] w-[24px] items-center justify-center rounded-[4px] transition-colors ${
          isOpen ? "bg-[#EBEEF1]" : "hover:bg-[#EBEEF1]"
        }`}
        aria-label={t("Component options")}
        onClick={() => { setIsOpen((v) => !v); setIsReplaceOpen(false) }}
      >
        {databaseIcon}
      </button>

      {/* Main flyout — portalled to escape overflow:hidden containers */}
      {isOpen && menuPos && createPortal(
        <div
          ref={menuRef}
          className="fixed z-[9999] w-max overflow-visible rounded-[6px] border border-[#D8DEE4] bg-white shadow-[0_12px_32px_rgba(28,32,40,0.12)]"
          style={{ top: menuPos.top, left: menuPos.left }}
          role="menu"
        >
          {hasReplacements && (
            <button
              ref={replaceRowRef}
              type="button"
              className="flex w-full items-center justify-between gap-[8px] px-[12px] py-[8px] text-left text-[12px] font-[600] text-[#353A44] hover:bg-[#F5F6F8] transition-colors whitespace-nowrap"
              role="menuitem"
              onMouseEnter={() => setIsReplaceOpen(true)}
              onMouseLeave={() => setIsReplaceOpen(false)}
              onClick={() => setIsReplaceOpen((v) => !v)}
            >
              <div className="flex items-center gap-[8px]">
                {databaseIcon}
                {t("Replace with")}
              </div>
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                <path fillRule="evenodd" clipRule="evenodd" d="M2.33351 0.606072C2.62011 0.307015 3.09487 0.296913 3.39393 0.58351L6.39393 3.45851C6.54146 3.59989 6.62492 3.79535 6.625 3.99969C6.62509 4.20403 6.54179 4.39955 6.39438 4.54106L3.39938 7.41606C3.10056 7.70291 2.62579 7.6932 2.33894 7.39438C2.0521 7.09556 2.0618 6.62079 2.36062 6.33394L4.79151 4.00045L2.35607 1.66649C2.05701 1.3799 2.04691 0.905129 2.33351 0.606072Z" fill="#474E5A"/>
              </svg>
            </button>
          )}

          {onRemove && (
            <button
              type="button"
              className="flex w-full items-center gap-[8px] px-[12px] py-[8px] text-left text-[12px] font-[600] text-[#C0123C] hover:bg-[#F5F6F8] transition-colors whitespace-nowrap"
              role="menuitem"
              onClick={() => {
                setIsOpen(false)
                onRemove()
              }}
            >
              <TrashIcon className="text-[#C0123C]" />
              {t("Remove from plan")}
            </button>
          )}
        </div>,
        document.body
      )}

      {/* Replace-with sub-flyout — also portalled */}
      {isReplaceOpen && replacePos && createPortal(
        <div
          ref={replaceRef}
          className="fixed z-[9999]"
          style={{ top: replacePos.top, left: replacePos.left }}
          onMouseEnter={() => setIsReplaceOpen(true)}
          onMouseLeave={() => setIsReplaceOpen(false)}
        >
          <UseExistingFlyout
            t={t}
            components={existingComponents!}
            onSelect={(componentId) => {
              setIsOpen(false)
              setIsReplaceOpen(false)
              onReplaceWith!(componentId)
            }}
          />
        </div>,
        document.body
      )}
    </div>
  )
}

// ── Component version dropdown (compact, in header area) ─────────────
function ComponentVersionDropdown({
  t,
  versions,
  activeVersionId,
  onChangeVersion,
}: {
  t: (key: string) => string
  versions: ComponentVersion[]
  activeVersionId: string
  onChangeVersion: (versionId: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const activeVersion = versions.find((v) => v.id === activeVersionId)

  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("mousedown", handleClick)
      document.removeEventListener("keydown", handleKey)
    }
  }, [isOpen])

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        className="flex h-[24px] items-center gap-[6px] rounded-[6px] border border-[#D4DEE9] bg-white px-[6px] text-[11px] font-[500] text-[#353A44] transition-colors hover:bg-[#F5F6F8]"
        onClick={() => setIsOpen((v) => !v)}
      >
        <span className="truncate max-w-[120px]">{activeVersion?.label ?? "—"}</span>
        <svg width="8" height="10" viewBox="0 0 8 10" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
          <path d="M4 0.5L7 3.5H1L4 0.5Z" fill="#474E5A" />
          <path d="M4 9.5L1 6.5H7L4 9.5Z" fill="#474E5A" />
        </svg>
      </button>
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute left-0 top-[28px] z-50 w-[200px] overflow-hidden rounded-[6px] border border-[#D8DEE4] bg-white shadow-[0_12px_32px_rgba(28,32,40,0.12)]"
        >
          {versions.map((v) => (
            <button
              key={v.id}
              type="button"
              className={`flex w-full items-center justify-between px-[10px] py-[6px] text-left text-[12px] transition-colors hover:bg-[#F5F6F8] ${
                v.id === activeVersionId ? "bg-[#F5F6F8] font-[500]" : "font-[400]"
              }`}
              onClick={() => {
                onChangeVersion(v.id)
                setIsOpen(false)
              }}
            >
              <span className="text-[#1A2C44]">{v.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Full-width version field for form body ───────────────────────────
function ComponentVersionField({
  t,
  versions,
  activeVersionId,
  onChangeVersion,
  isDraft,
}: {
  t: (key: string) => string
  versions: ComponentVersion[]
  activeVersionId: string
  onChangeVersion: (versionId: string) => void
  isDraft?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const activeVersion = versions.find((v) => v.id === activeVersionId)

  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("mousedown", handleClick)
      document.removeEventListener("keydown", handleKey)
    }
  }, [isOpen])

  return (
    <div className="flex flex-col gap-[3px]">
      <p className="text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#1A2C44]">
        {t("Version")}
      </p>
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          className="flex h-[28px] w-full items-center justify-between rounded-[6px] border border-[#D4DEE9] bg-white px-[8px] text-[12px] font-[500] text-[#1A2C44] transition-colors hover:bg-[#F5F6F8]"
          onClick={() => setIsOpen((v) => !v)}
        >
          <div className="flex min-w-0 flex-1 items-center gap-[8px]">
            <span className="truncate">{activeVersion?.label ?? "—"}</span>
            {isDraft && (
              <span className="shrink-0 rounded-[4px] bg-[#EBEEF1] px-[4px] py-[1px] text-[10px] font-[600] leading-[14px] text-[#474E5A]">
                {t("Draft")}
              </span>
            )}
          </div>
          <svg width="8" height="10" viewBox="0 0 8 10" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 ml-[6px]">
            <path d="M4 0.5L7 3.5H1L4 0.5Z" fill="#474E5A" />
            <path d="M4 9.5L1 6.5H7L4 9.5Z" fill="#474E5A" />
          </svg>
        </button>
        {isOpen && (
          <div
            ref={dropdownRef}
            className="absolute left-0 top-[32px] z-50 w-full overflow-hidden rounded-[6px] border border-[#D8DEE4] bg-white shadow-[0_12px_32px_rgba(28,32,40,0.12)]"
          >
            {versions.map((v) => (
              <button
                key={v.id}
                type="button"
                className={`flex w-full items-center justify-between px-[10px] py-[6px] text-left text-[12px] transition-colors hover:bg-[#F5F6F8] ${
                  v.id === activeVersionId ? "bg-[#F5F6F8] font-[500]" : "font-[400]"
                }`}
                onClick={() => {
                  onChangeVersion(v.id)
                  setIsOpen(false)
                }}
              >
                <span className="text-[#1A2C44]">{v.label}</span>
                {v.id === activeVersionId && isDraft && (
                  <span className="ml-[8px] shrink-0 rounded-[4px] bg-[#EBEEF1] px-[4px] py-[1px] text-[10px] font-[600] leading-[14px] text-[#474E5A]">
                    {t("Draft")}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main PlanEditorPanel ─────────────────────────────────────────────
export function PlanEditorPanel({
  t,
  headerLabel,
  parentLabel,
  onNavigateToParent,
  onNavigatePrev,
  onNavigateNext,
  hasTreeChanges,
  deleteLabel,
  nodeType,
  onBack,
  showBackButtonOnDesktop = false,
  onClose,
  isActionsOpen,
  onToggleActions,
  onCloseActions,
  actionsButtonRef,
  actionsMenuRef,
  onDelete,
  isLoading,
  onOpenAssistant,
  isFixed,
  children,
  hasComponents,
  existingComponents,
  onUseExistingComponent,
  componentVersions,
  activeComponentVersionId,
  onChangeComponentVersion,
  isDraftComponent,
  isComponentReadOnly,
  isTreeNavOpen,
  onToggleTreeNav,
  hamburgerButtonRef,
  formAddButtonRef,
  onToggleAddPlanObject,
  onDirectAddRate,
  hasRateComponents,
  onDismissNavHint,
  onDismissGetStarted,
  onHoverGhostKind,
  currentRateCount,
  currentRateHasMeter,
  planHasRateCards,
  onDuplicate,
  hideHeader,
  collapseHeader,
  onAddFirstRate,
}: PlanEditorPanelProps) {
  const formContentRef = useRef<HTMLDivElement>(null)
  const [isUseExistingOpen, setIsUseExistingOpen] = useState(false)

  useEffect(() => {
    if (isLoading) return
    const container = formContentRef.current
    if (container) container.scrollTop = 0
    const timer = setTimeout(() => {
      const c = formContentRef.current
      if (!c) return
      const firstInput = c.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
        'input:not([type="hidden"]):not([type="range"]), textarea, select'
      )
      if (firstInput && !firstInput.closest('[aria-hidden="true"]')) {
        firstInput.focus({ preventScroll: true })
      }
    }, 50)
    return () => clearTimeout(timer)
  }, [headerLabel, nodeType, isLoading])

  // Whenever the panel header toggles, reset the scroll position so the form
  // never appears clipped at the top after a layout shift (e.g. wizard submit
  // turns hideHeader on/off and the content area resizes underneath the
  // existing scroll offset).
  useEffect(() => {
    const container = formContentRef.current
    if (container) container.scrollTop = 0
  }, [hideHeader])

  // Close sub-menu when main menu closes
  useEffect(() => {
    if (!isActionsOpen) setIsUseExistingOpen(false)
  }, [isActionsOpen])

  const showUseExisting = hasComponents && existingComponents && existingComponents.length > 0 && onUseExistingComponent
  const showVersionDropdown = componentVersions && componentVersions.length > 0 && activeComponentVersionId && onChangeComponentVersion
  const showDeleteAction = nodeType !== "plan"

  // Portal position for the "Replace with" sub-flyout inside the ellipsis menu
  const replaceWithRowRef = useRef<HTMLButtonElement>(null)
  const [replaceWithPos, setReplaceWithPos] = useState<{ top: number; left: number } | null>(null)
  useLayoutEffect(() => {
    if (!isUseExistingOpen || !replaceWithRowRef.current) return
    const r = replaceWithRowRef.current.getBoundingClientRect()
    setReplaceWithPos({ top: r.top, left: r.right + 2 })
  }, [isUseExistingOpen])

  return (
    <div data-form-panel data-onboarding="form-panel" className={
      isFixed
        ? "relative z-10 flex h-full w-full flex-col bg-white/[0.94] backdrop-blur-[6px] sm:w-[320px] sm:overflow-hidden sm:border-r sm:border-[#EBEEF1]"
        : "relative z-10 flex h-full w-full flex-col bg-white/[0.94] backdrop-blur-[6px] sm:h-fit sm:max-h-[calc(100vh-120px)] sm:w-[320px] sm:overflow-hidden sm:rounded-[12px] sm:border sm:border-[#EBEEF1] shadow-[0_2px_5px_rgba(48,49,61,0.08),0_1px_1px_rgba(0,0,0,0.12)]"
    }>
      {!hideHeader && <motion.div
        className="overflow-hidden"
        initial={collapseHeader ? { height: 0 } : false}
        animate={{ height: collapseHeader ? 0 : "auto" }}
        transition={{ duration: 0 }}
        style={{ pointerEvents: collapseHeader ? "none" : undefined }}
      ><motion.div
        initial={collapseHeader ? { opacity: 0 } : false}
        animate={{ opacity: collapseHeader ? 0 : 1 }}
        transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
      ><div className="px-[16px] pt-[12px]">
        {/* Header block: title + actions + optional tip */}
        <div className="flex flex-col gap-[8px]">
          {/* Title row */}
          <div className="relative flex min-w-0 items-center justify-between">
            <p className="truncate text-[14px] font-[500] leading-[20px] tracking-[-0.15px] text-[#1A2C44]">{headerLabel}</p>
            <div className="flex items-center gap-[8px] shrink-0">
              {showVersionDropdown && (
                <VersionIconButton
                  t={t}
                  existingComponents={existingComponents}
                  onReplaceWith={onUseExistingComponent}
                  onRemove={onDelete}
                />
              )}
              {onDuplicate && nodeType && nodeType !== "rateCard" && nodeType !== "plan" && (
                <ControlTooltip label={t("Duplicate")} className="inline-flex">
                  <button
                    type="button"
                    className="flex h-[24px] w-[24px] items-center justify-center rounded-[6px] border border-[#D4DEE9] bg-white hover:bg-[#F5F6F8]"
                    aria-label={t("Duplicate")}
                    onClick={onDuplicate}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
                      <path d="M9.75 0C10.8546 0 11.75 0.895431 11.75 2V7.5C11.75 8.60457 10.8546 9.5 9.75 9.5H8.75V10C8.75 11.1046 7.85457 12 6.75 12H2.25C1.14543 12 0.25 11.1046 0.25 10V4C0.25 3.30964 0.809644 2.75 1.5 2.75C1.91421 2.75 2.25 3.08579 2.25 3.5C2.25 3.82617 2.04077 4.10086 1.75 4.2041V10C1.75 10.2761 1.97386 10.5 2.25 10.5H6.75C7.02614 10.5 7.25 10.2761 7.25 10V9.5H5.25C4.14543 9.5 3.25 8.60457 3.25 7.5V2C3.25 0.895431 4.14543 0 5.25 0H9.75ZM5.25 1.5C4.97386 1.5 4.75 1.72386 4.75 2V7.5C4.75 7.77614 4.97386 8 5.25 8H9.75C10.0261 8 10.25 7.77614 10.25 7.5V2C10.25 1.72386 10.0261 1.5 9.75 1.5H5.25Z" fill="#3C4F69"/>
                    </svg>
                  </button>
                </ControlTooltip>
              )}
              {showDeleteAction && (
                <ControlTooltip label={deleteLabel} className="inline-flex">
                  <button
                    type="button"
                    className="group flex h-[24px] w-[24px] items-center justify-center rounded-[6px] border border-[#D4DEE9] bg-white hover:bg-[#FEF4F6] hover:border-[#FAA9B8]"
                    aria-label={deleteLabel}
                    onClick={onDelete}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
                      <path fillRule="evenodd" clipRule="evenodd" d="M8.99998 3V1.5C8.99998 0.671573 8.3284 0 7.49998 0H4.49998C3.67155 0 2.99998 0.671573 2.99998 1.5V3H0.75C0.335786 3 0 3.33579 0 3.75C0 4.16421 0.335786 4.5 0.75 4.5H1.49998V10C1.49998 11.1046 2.39541 12 3.49998 12H8.49998C9.60454 12 10.5 11.1046 10.5 10V4.5H11.25C11.6642 4.5 12 4.16421 12 3.75C12 3.33579 11.6642 3 11.25 3H8.99998ZM7.49998 1.4H4.49998C4.44475 1.4 4.39998 1.44477 4.39998 1.5V3H7.59998V1.5C7.59998 1.44477 7.5552 1.4 7.49998 1.4ZM9.09998 4.5V10C9.09998 10.3314 8.83135 10.6 8.49998 10.6H3.49998C3.1686 10.6 2.89998 10.3314 2.89998 10V4.5H9.09998Z" fill="#3C4F69" className="group-hover:fill-[#E61947]"/>
                      <path fillRule="evenodd" clipRule="evenodd" d="M4.62498 5.5C4.97015 5.5 5.24998 5.77982 5.24998 6.125V8.875C5.24998 9.22018 4.97015 9.5 4.62498 9.5C4.2798 9.5 3.99998 9.22018 3.99998 8.875V6.125C3.99998 5.77982 4.2798 5.5 4.62498 5.5Z" fill="#3C4F69" className="group-hover:fill-[#E61947]"/>
                      <path fillRule="evenodd" clipRule="evenodd" d="M7.37498 5.5C7.72015 5.5 7.99998 5.77982 7.99998 6.125V8.875C7.99998 9.22018 7.72015 9.5 7.37498 9.5C7.0298 9.5 6.74998 9.22018 6.74998 8.875V6.125C6.74998 5.77982 7.0298 5.5 7.37498 5.5Z" fill="#3C4F69" className="group-hover:fill-[#E61947]"/>
                    </svg>
                  </button>
                </ControlTooltip>
              )}
            </div>
          </div>
        </div>
      </div></motion.div></motion.div>}

      {/* Portalled "Replace with" sub-flyout from ellipsis menu */}
      {isUseExistingOpen && replaceWithPos && createPortal(
        <div
          className="fixed z-[9999]"
          style={{ top: replaceWithPos.top, left: replaceWithPos.left }}
          onMouseEnter={() => setIsUseExistingOpen(true)}
          onMouseLeave={() => setIsUseExistingOpen(false)}
        >
          <UseExistingFlyout
            t={t}
            components={existingComponents!}
            onSelect={(componentId) => {
              onCloseActions()
              setIsUseExistingOpen(false)
              onUseExistingComponent!(componentId)
            }}
          />
        </div>,
        document.body
      )}
      <div ref={formContentRef} className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pb-4 pt-[8px]">
        {isLoading ? (
          <div
            className="space-y-4 px-4 animate-pulse"
            role="status"
            aria-busy="true"
            aria-label={t("Loading form")}
          >
            <div className="h-[14px] w-[140px] rounded-[6px] bg-[#EBEEF1]" />
            <div className="h-[32px] w-full rounded-[8px] bg-[#EBEEF1]" />
            <div className="h-[14px] w-[180px] rounded-[6px] bg-[#EBEEF1]" />
            <div className="h-[32px] w-full rounded-[8px] bg-[#EBEEF1]" />
            <div className="h-[14px] w-[160px] rounded-[6px] bg-[#EBEEF1]" />
            <div className="h-[32px] w-full rounded-[8px] bg-[#EBEEF1]" />
            <div className="mt-6 h-[14px] w-[120px] rounded-[6px] bg-[#EBEEF1]" />
            <div className="h-[32px] w-full rounded-[8px] bg-[#EBEEF1]" />
            <div className="h-[32px] w-[92%] rounded-[8px] bg-[#EBEEF1]" />
            <div className="h-[32px] w-[86%] rounded-[8px] bg-[#EBEEF1]" />
          </div>
        ) : (
          <>
            {/* Version field — shown for component-linked objects */}
            {showVersionDropdown && (
              <div className="mb-[16px] px-4">
                <ComponentVersionField
                  t={t}
                  versions={componentVersions}
                  activeVersionId={activeComponentVersionId}
                  onChangeVersion={onChangeComponentVersion}
                  isDraft={isDraftComponent}
                />
              </div>
            )}
            {isComponentReadOnly ? (
              <div className="pointer-events-none [&_input]:bg-[#F6F8FA] [&_input]:text-[#8C95A6] [&_input]:border-[#EBEEF1] [&_select]:bg-[#F6F8FA] [&_select]:text-[#8C95A6] [&_select]:border-[#EBEEF1] [&_textarea]:bg-[#F6F8FA] [&_textarea]:text-[#8C95A6] [&_textarea]:border-[#EBEEF1] [&_button]:opacity-50">{children}</div>
            ) : (
              children
            )}
            {/* Add item button removed — now in header and empty state */}

            {/* "What's next?" — shown at the bottom of rate card form when it has no rates */}
            {nodeType === "rateCard" && currentRateCount === 0 && onDirectAddRate && (
              <div className="mt-[16px] px-[16px] pb-[8px]">
                <div className="flex flex-col gap-[4px] rounded-[6px] bg-[#F4F7FA] px-[12px] py-[8px]">
                  <div className="flex items-center gap-[8px]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0" style={{ width: 11.5, height: 11.5 }}>
                      <path fillRule="evenodd" clipRule="evenodd" d="M8.5 1.5H3C2.17157 1.5 1.5 2.17157 1.5 3V8.5C1.5 9.32843 2.17157 10 3 10H8.5C9.32843 10 10 9.32843 10 8.5V3C10 2.17157 9.32843 1.5 8.5 1.5ZM3 0C1.34315 0 0 1.34315 0 3V8.5C0 10.1569 1.34315 11.5 3 11.5H8.5C10.1569 11.5 11.5 10.1569 11.5 8.5V3C11.5 1.34315 10.1569 0 8.5 0H3Z" fill="#3C4F69"/>
                      <path fillRule="evenodd" clipRule="evenodd" d="M4.23182 6.24998C4.23182 5.86338 4.54522 5.54998 4.93182 5.54998H6.02273C6.40933 5.54998 6.72273 5.86338 6.72273 6.24998V8.24998C6.72273 8.63658 6.40933 8.94998 6.02273 8.94998C5.63613 8.94998 5.32273 8.63658 5.32273 8.24998V6.94998H4.93182C4.54522 6.94998 4.23182 6.63658 4.23182 6.24998Z" fill="#3C4F69"/>
                      <path d="M4.74994 3.74999C4.74994 3.19858 5.19854 2.74999 5.74994 2.74999C6.30134 2.74999 6.74994 3.19858 6.74994 3.74999C6.74994 4.30139 6.30134 4.74999 5.74994 4.74999C5.19854 4.74999 4.74994 4.30139 4.74994 3.74999Z" fill="#3C4F69"/>
                    </svg>
                    <p className="text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#1A2C44]">{t("What's next?")}</p>
                  </div>
                  <p className="text-[12px] font-[400] leading-[16px] text-[#1A2C44]">
                    <button type="button" className="font-[400] text-[#533AFD] hover:underline" onClick={onDirectAddRate}>{t("Add a rate")}</button>
                    {" "}{t("to this card to start charging customers based on their usage.")}
                  </p>
                </div>
              </div>
            )}

            {/* "What's next?" — shown at the bottom for sub fees / credit grants when no rate cards exist */}
            {(nodeType === "subscriptionFee" || nodeType === "creditGrant") && !planHasRateCards && onAddFirstRate && (
              <div className="mt-[16px] px-[16px] pb-[8px]">
                <div className="flex flex-col gap-[4px] rounded-[6px] bg-[#F4F7FA] px-[12px] py-[8px]">
                  <div className="flex items-center gap-[8px]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0" style={{ width: 11.5, height: 11.5 }}>
                      <path fillRule="evenodd" clipRule="evenodd" d="M8.5 1.5H3C2.17157 1.5 1.5 2.17157 1.5 3V8.5C1.5 9.32843 2.17157 10 3 10H8.5C9.32843 10 10 9.32843 10 8.5V3C10 2.17157 9.32843 1.5 8.5 1.5ZM3 0C1.34315 0 0 1.34315 0 3V8.5C0 10.1569 1.34315 11.5 3 11.5H8.5C10.1569 11.5 11.5 10.1569 11.5 8.5V3C11.5 1.34315 10.1569 0 8.5 0H3Z" fill="#3C4F69"/>
                      <path fillRule="evenodd" clipRule="evenodd" d="M4.23182 6.24998C4.23182 5.86338 4.54522 5.54998 4.93182 5.54998H6.02273C6.40933 5.54998 6.72273 5.86338 6.72273 6.24998V8.24998C6.72273 8.63658 6.40933 8.94998 6.02273 8.94998C5.63613 8.94998 5.32273 8.63658 5.32273 8.24998V6.94998H4.93182C4.54522 6.94998 4.23182 6.63658 4.23182 6.24998Z" fill="#3C4F69"/>
                      <path d="M4.74994 3.74999C4.74994 3.19858 5.19854 2.74999 5.74994 2.74999C6.30134 2.74999 6.74994 3.19858 6.74994 3.74999C6.74994 4.30139 6.30134 4.74999 5.74994 4.74999C5.19854 4.74999 4.74994 4.30139 4.74994 3.74999Z" fill="#3C4F69"/>
                    </svg>
                    <p className="text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#1A2C44]">{t("What's next?")}</p>
                  </div>
                  <p className="text-[12px] font-[400] leading-[16px] text-[#1A2C44]">
                    <button type="button" className="font-[400] text-[#533AFD] hover:underline" onClick={onAddFirstRate}>{t("Add your first rate")}</button>
                    {" "}{t("to start charging customers based on their usage.")}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
