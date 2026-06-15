'use client'

import type { ComponentProps, ReactNode, RefObject } from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { AddPlanObjectPopover } from "@/components/product-catalog/AddPlanObjectPopover"
import { OnboardingPopovers } from "@/components/product-catalog/OnboardingPopovers"
import { OnboardingTour } from "@/components/product-catalog/OnboardingTour"
import { MobilePreviewSheet } from "@/components/product-catalog/MobilePreviewSheet"
import { PlanAssistantPanelDock } from "@/components/product-catalog/PlanAssistantPanelDock"
import { PlanEditorPanel } from "@/components/product-catalog/PlanEditorPanel"
import { PlanFormCloseProvider } from "@/components/product-catalog/PlanForm/PlanFormCloseContext"
import { PlanPreviewArea } from "@/components/product-catalog/PlanPreviewArea"
import { PlanSidebarNav } from "@/components/product-catalog/PlanSidebarNav"
import { useFormPanelSide } from "@/components/product-catalog/formPanelSide"
import { useLayoutMode } from "@/components/product-catalog/layoutMode"
import { useBulkEditTransition } from "@/components/product-catalog/bulkEditTransition"
import { cn } from "@/lib/utils"

type PlanNode = {
  type: "plan" | "rateCard" | "rate" | "rateMeter" | "creditGrant" | "subscriptionFee" | "priceGroup"
  id?: number
  planId?: number
}

type PricingPlanModalBodyProps = {
  sidebarProps: ComponentProps<typeof PlanSidebarNav>
  editorProps: Omit<ComponentProps<typeof PlanEditorPanel>, "children">
  planForm: ReactNode
  /** Additional forms for multi-selected nodes (stacked vertically) */
  additionalPlanForms?: { node: PlanNode; form: ReactNode; editorProps: Omit<ComponentProps<typeof PlanEditorPanel>, "children"> }[]
  /** Callback to close a specific additional form (remove from multi-selection) */
  onCloseAdditionalForm?: (node: PlanNode) => void
  previewProps: ComponentProps<typeof PlanPreviewArea>
  assistantDockProps: ComponentProps<typeof PlanAssistantPanelDock>
  addObjectPopoverProps: ComponentProps<typeof AddPlanObjectPopover>
  /** Layout B panel visibility (controlled by header toggles via overlay) */
  isLeftPanelVisible?: boolean
  isRightPanelVisible?: boolean
  isBottomPanelVisible?: boolean
  /** Callback to open the left panel (for Layout B when clicking nodes in the map) */
  onOpenLeftPanel?: () => void
  /** Bulk edit mode */
  isBulkEditMode?: boolean
  bulkEditContent?: ReactNode
  bulkEditRateCardId?: number | null
  onExitBulkEdit?: () => void
  /** Tree nav slide-out */
  isTreeNavOpen?: boolean
  onToggleTreeNav?: () => void
  /** Onboarding popovers */
  showGetStarted?: boolean
  onDismissGetStarted?: () => void
  showNavHint?: boolean
  onDismissNavHint?: () => void
  /** Refs for popover anchoring */
  hamburgerButtonRef?: RefObject<HTMLButtonElement | null>
  formAddButtonRef?: RefObject<HTMLButtonElement | null>
  /** When true, sidebar is rendered at a higher level (overlay) — skip rendering here */
  hideSidebar?: boolean
  /** Action-driven onboarding tour step (null = inactive) */
  onboardingTourStep?: 1 | 2 | 3 | null
  onDismissOnboardingTour?: () => void
}


function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false
    return window.matchMedia(query).matches
  })
  useEffect(() => {
    const m = window.matchMedia(query)
    setMatches(m.matches)
    const listener = () => setMatches(m.matches)
    m.addEventListener("change", listener)
    return () => m.removeEventListener("change", listener)
  }, [query])
  return matches
}

export function PricingPlanModalBody({
  sidebarProps,
  editorProps,
  planForm,
  additionalPlanForms,
  onCloseAdditionalForm,
  previewProps,
  assistantDockProps,
  addObjectPopoverProps,
  isLeftPanelVisible,
  isRightPanelVisible,
  isBottomPanelVisible,
  onOpenLeftPanel,
  isBulkEditMode,
  bulkEditContent,
  isTreeNavOpen,
  onToggleTreeNav,
  showGetStarted,
  onDismissGetStarted,
  showNavHint,
  onDismissNavHint,
  hamburgerButtonRef,
  formAddButtonRef,
  hideSidebar,
  onboardingTourStep,
  onDismissOnboardingTour,
}: PricingPlanModalBodyProps) {
  const [mobilePane, setMobilePane] = useState<"nav" | "editor">("nav")
  const [isFormPanelOpen, setIsFormPanelOpen] = useState(true)
  const [ghostItemKind, setGhostItemKind] = useState<"rate" | "subscription-fee" | "credit-grant" | "rate-card" | null>(null)
  const ghostClearTimer = useRef<ReturnType<typeof setTimeout>>(null)
  const setGhostItemKindDebounced = useCallback((kind: "rate" | "subscription-fee" | "credit-grant" | "rate-card" | "product-with-price" | "price-group" | null) => {
    if (ghostClearTimer.current) clearTimeout(ghostClearTimer.current)
    const mapped = kind === "product-with-price" || kind === "price-group" ? "rate-card" : kind
    if (mapped != null) {
      setGhostItemKind(mapped)
    } else {
      ghostClearTimer.current = setTimeout(() => setGhostItemKind(null), 60)
    }
  }, [])
  const { side: formPanelSide, setSide: setFormPanelSide } = useFormPanelSide()
  const { layoutMode } = useLayoutMode()
  const { bulkEditTransition } = useBulkEditTransition()
  const isInlineBulkEdit = bulkEditTransition === "inline"
  const isLgUp = useMediaQuery("(min-width: 1024px)")
  const containerRef = useRef<HTMLDivElement>(null)
  const isBulkEditActive = Boolean(isBulkEditMode && bulkEditContent)
  const showDesktopBulkEdit = isBulkEditActive && isLgUp
  const collapseSidebarForBulkEdit = showDesktopBulkEdit && !isInlineBulkEdit

  // Determine if we're in map mode (map spans full width behind panels)
  const normalizedPreviewMode =
    previewProps.customerPreviewMode === "Customer preview"
      ? "Preview"
      : previewProps.customerPreviewMode === "Customer preview code"
        ? "Code"
        : previewProps.customerPreviewMode === "Object map"
          ? "Map"
          : previewProps.customerPreviewMode
  const isMapMode = normalizedPreviewMode === "Map"

  // Layout B: main area toggles between Map and Preview (no separate side panel)
  const isLayoutB = layoutMode === "B"

  const previewPropsWithEditorRouting = useMemo(() => {
    const isFormOpen = mobilePane === "editor" && isFormPanelOpen

    return {
      ...previewProps,
      ghostItemKind: ghostItemKind ?? (previewProps.quickStartGhostKinds?.[0] ?? null),
      quickStartGhostKinds: previewProps.quickStartGhostKinds,
      // When the form is closed, nothing should appear selected in the map.
      selectedNodeKey: isFormOpen ? previewProps.selectedNodeKey : null,
      setActivePlanNode: (updater: Parameters<typeof previewProps.setActivePlanNode>[0]) => {
        previewProps.setActivePlanNode(updater)
        // When selecting nodes from the object map, open the form panel.
        // Avoid opening from Preview-mode interactions (sliders, receipt modelling, etc).
        if (isMapMode) {
          setMobilePane("editor")
          setIsFormPanelOpen(true)
        }
      },
      // Also wrap handleNodeSelect to reopen the form panel
      handleNodeSelect: previewProps.handleNodeSelect
        ? (node: PlanNode, shiftKey: boolean) => {
            previewProps.handleNodeSelect?.(node, shiftKey)
            if (isMapMode) {
              setMobilePane("editor")
              setIsFormPanelOpen(true)
              setFormPanelSide("fixed-left")
              // Open the left panel in Layout B if it was closed
              onOpenLeftPanel?.()
            }
          }
        : undefined,
    }
  }, [mobilePane, isFormPanelOpen, previewProps, isMapMode, setFormPanelSide, onOpenLeftPanel, ghostItemKind])

  const sidebarPropsWithMobileRouting = useMemo(() => {
    // In Layout B fixed-left, sidebar and form are side by side — the form is always visible.
    const isFixedLeftSideBySide = isLayoutB && formPanelSide === "fixed-left"
    return {
      ...sidebarProps,
      isFormOpen: isFixedLeftSideBySide ? isFormPanelOpen : (mobilePane === "editor" && isFormPanelOpen),
      setActivePlanNode: (updater: Parameters<typeof sidebarProps.setActivePlanNode>[0]) => {
        sidebarProps.setActivePlanNode(updater)
        setMobilePane("editor")
        setIsFormPanelOpen(true)
      },
      // Also wrap handleNodeSelect to reopen the form panel
      handleNodeSelect: sidebarProps.handleNodeSelect
        ? (node: PlanNode, shiftKey: boolean) => {
            sidebarProps.handleNodeSelect?.(node, shiftKey)
            setMobilePane("editor")
            setIsFormPanelOpen(true)
          }
        : undefined,
      onAddPlanRate: (rateCardId: number) => {
        sidebarProps.onAddPlanRate(rateCardId)
        setMobilePane("editor")
        setIsFormPanelOpen(true)
      },
    }
  }, [mobilePane, isFormPanelOpen, sidebarProps, setFormPanelSide, isLayoutB, formPanelSide])

  const hasMultipleForms = additionalPlanForms && additionalPlanForms.length > 0
  const formCount = 1 + (additionalPlanForms?.length ?? 0)
  const isFloatingMode = formPanelSide === "float-left" || formPanelSide === "float-right"

  const formPanelInner = isBulkEditActive && !isLgUp ? (
    <div className="h-full w-full min-w-0">
      {bulkEditContent}
    </div>
  ) : (
    <>
      {/* Primary form panel */}
      <div className={cn(
        "h-full",
        hasMultipleForms && !isFloatingMode && "w-[320px] min-w-[320px] shrink-0",
        hasMultipleForms && isFloatingMode && "w-full"
      )}>
        <PlanEditorPanel
          {...editorProps}
          onBack={() => setMobilePane("nav")}
          // Layout B uses drill-in/drill-out at all sizes, so keep the back affordance on desktop
          // — except when fixed-left, where sidebar and form are side by side.
          showBackButtonOnDesktop={isLayoutB && formPanelSide !== "fixed-left"}
          // In Layout B, we want "back to nav" rather than "close panel".
          onClose={isLayoutB ? undefined : () => setIsFormPanelOpen(false)}
          isFixed={formPanelSide === "fixed-left" || formPanelSide === "fixed-right"}
          onDismissNavHint={onDismissNavHint}
          onDismissGetStarted={onDismissGetStarted}
          onHoverGhostKind={setGhostItemKindDebounced}
        >
          <PlanFormCloseProvider onCloseForm={() => setMobilePane("nav")}>
            {planForm}
          </PlanFormCloseProvider>
        </PlanEditorPanel>
      </div>

      {/* Additional form panels for multi-select */}
      {additionalPlanForms?.map(({ node, form, editorProps: additionalEditorProps }, index) => (
        <div
          key={`additional-${index}-${node.type}-${node.id ?? "root"}-${node.planId ?? "current"}`}
          className={cn(
            hasMultipleForms && !isFloatingMode && "w-[320px] min-w-[320px] shrink-0",
            hasMultipleForms && isFloatingMode && "w-full"
          )}
        >
          <PlanEditorPanel
            {...additionalEditorProps}
            onBack={() => setMobilePane("nav")}
            // Keep additional panels' back button responsive to avoid clutter on desktop.
            onClose={() => onCloseAdditionalForm?.(node)}
            isFixed={formPanelSide === "fixed-left" || formPanelSide === "fixed-right"}
          >
            <PlanFormCloseProvider onCloseForm={() => setMobilePane("nav")}>
              {form}
            </PlanFormCloseProvider>
          </PlanEditorPanel>
        </div>
      ))}
    </>
  )

  const formPanel = (
    <div
      className={cn(
        mobilePane === "editor" ? "flex" : "hidden",
        "min-w-0",
        // For multiple forms:
        // - In floating modes (left/right): stack vertically
        // - In fixed modes: lay out side by side
        hasMultipleForms && isFloatingMode && "flex-col gap-2 overflow-y-auto max-h-full w-full",
        hasMultipleForms && !isFloatingMode && "flex-row gap-2",
        !hasMultipleForms && "w-full",
        formPanelSide === "fixed-left"
          ? cn(
              "sm:relative sm:shrink-0 sm:z-30",
              // Width scales with number of forms in fixed mode
              hasMultipleForms ? `sm:w-[${320 * formCount}px]` : "sm:w-[320px] sm:min-w-[320px] sm:max-w-[320px]",
              // Only allow "close panel" behavior at lg+; below that we use drill-in/drill-out.
              isFormPanelOpen ? "lg:flex" : "lg:hidden"
            )
          : formPanelSide === "fixed-right"
            ? cn(
                isLayoutB
                  // In Layout B the center column is flex-col, so position absolutely on the right
                  ? "sm:absolute sm:top-0 sm:bottom-0 sm:right-0 sm:z-30"
                  // In Layout A the container is flex-row, so relative works normally
                  : "sm:relative sm:shrink-0 sm:z-30",
                hasMultipleForms ? `sm:w-[${320 * formCount}px]` : "sm:w-[320px] sm:min-w-[320px] sm:max-w-[320px]",
                // Only allow "close panel" behavior at lg+; below that we use drill-in/drill-out.
                isFormPanelOpen ? "lg:flex" : "lg:hidden"
              )
            : cn(
                "sm:absolute sm:top-[16px] sm:w-[320px] sm:z-30",
                // Only allow "close panel" behavior at lg+; below that we use drill-in/drill-out.
                isFormPanelOpen ? "lg:flex" : "lg:hidden"
              )
      )}
      style={{
        // Dynamic width for fixed modes with multiple forms
        ...(hasMultipleForms && (formPanelSide === "fixed-left" || formPanelSide === "fixed-right")
          ? { width: 320 * formCount }
          : {}),
        ...(formPanelSide === "float-left"
          ? {
              // In Layout B, the form is inside the center column (already past the sidebar),
              // so 16px from left edge. In Layout A, offset past the 240px nav.
              left: isLayoutB ? 16 : 280 + 16,
            }
          : formPanelSide === "float-right"
            ? {
                // In Layout B there's no right-side assistant dock (it's a bottom terminal),
                // so just 16px from the right edge of the center column.
                // In Layout A, account for the assistant dock width.
                right: isLayoutB ? 16 : (assistantDockProps.isOpen ? assistantDockProps.widthPx + 16 : 16),
              }
            : {}),
      }}
    >
      {formPanelInner}
    </div>
  )

  const formPanelAlwaysVisible = (
    <div
      className={cn(
        // Always visible (used for animated switching in Layout B fixed-left).
        // Must be h-full so it fills the absolute-inset-0 wrapper.
        "flex h-full",
        "min-w-0",
        // Strip inner editor panel border-r — the dock wrapper owns the border
        "[&>div>div]:!border-r-0",
        // For multiple forms:
        // - In floating modes (left/right): stack vertically
        // - In fixed modes: lay out side by side
        hasMultipleForms && isFloatingMode && "flex-col gap-2 overflow-y-auto max-h-full w-full",
        hasMultipleForms && !isFloatingMode && "flex-row gap-2",
        !hasMultipleForms && "w-full",
      )}
      style={{
        ...(hasMultipleForms ? { width: 320 * formCount } : {}),
      }}
    >
      {formPanelInner}
    </div>
  )

  // Layout B: single main area shows Map or Preview; left panel always visible
  const layoutBPreviewProps = useMemo(() => {
    return {
      ...previewPropsWithEditorRouting,
      onBackgroundClick: formPanelSide === "fixed-left" ? undefined : previewPropsWithEditorRouting.onBackgroundClick,
    }
  }, [previewPropsWithEditorRouting, formPanelSide])

  // Layout B: left panel always visible, main area toggles Map/Preview
  if (isLayoutB) {
    const isFixedLeft = formPanelSide === "fixed-left"
    const sidebarWidthPx = collapseSidebarForBulkEdit ? 0 : isTreeNavOpen ? 280 : 0

    return (
      <>
        <div ref={containerRef} className="relative flex h-full w-full min-w-0 bg-[#F5F6F8]">
          {/* Sidebar — mobile: full width drill-in/drill-out */}
          {!hideSidebar && (
            <div
              className={cn(
                "w-full sm:hidden",
                mobilePane === "nav" ? "flex" : "hidden"
              )}
            >
              <PlanSidebarNav {...sidebarPropsWithMobileRouting} />
            </div>
          )}
          {/* Desktop sidebar — animated width, pushes everything to the right */}
          {!hideSidebar && (
            <div
              className="hidden shrink-0 overflow-hidden transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] sm:block"
              style={{ width: sidebarWidthPx }}
            >
              <div style={{ width: 280 }} className={cn("h-full", "[&>aside]:sm:!w-full [&>aside]:sm:!min-w-0 [&>aside]:sm:!max-w-none")}>
                <PlanSidebarNav {...sidebarPropsWithMobileRouting} />
              </div>
            </div>
          )}

          {showDesktopBulkEdit ? (
            <div className="hidden min-w-0 flex-1 sm:flex">
              {bulkEditContent}
            </div>
          ) : (
            <>
              {/* Form panel — fixed-left: use always-visible variant (formPanel is hidden when mobilePane="nav") */}
              {isFixedLeft && (
                <div
                  className={cn(
                    "hidden sm:flex shrink-0 min-w-0",
                    hasMultipleForms ? `sm:w-[${320 * formCount}px]` : "sm:w-[320px] sm:min-w-[320px] sm:max-w-[320px]",
                  )}
                  style={hasMultipleForms ? { width: 320 * formCount } : undefined}
                >
                  {formPanelAlwaysVisible}
                </div>
              )}

              {/* Centre column: Map or Preview */}
              <div
                className="hidden sm:flex min-w-0 flex-1 flex-col relative"
              >
                <div className="min-h-0 flex-1 flex relative" data-coachmark="preview-panel">
                  <PlanPreviewArea {...layoutBPreviewProps} />
                </div>

                {formPanelSide === "fixed-right" && formPanel}
                {(formPanelSide === "float-left" || formPanelSide === "float-right") && formPanel}
              </div>
            </>
          )}
        </div>

        {/* Mobile preview: pull up / pull down sheet */}
        {!isBulkEditActive && (
          <MobilePreviewSheet topInsetPx={72}>
            <div className="h-full w-full">
              <PlanPreviewArea {...layoutBPreviewProps} />
            </div>
          </MobilePreviewSheet>
        )}

        <AddPlanObjectPopover
          {...addObjectPopoverProps}
          onHoverKind={setGhostItemKindDebounced}
          onAddObject={(kind, rateCardId) => {
            if (ghostClearTimer.current) clearTimeout(ghostClearTimer.current)
            setGhostItemKind(null)
            addObjectPopoverProps.onAddObject(kind, rateCardId)
          }}
        />

        <OnboardingPopovers
          t={editorProps.t}
          showGetStarted={showGetStarted ?? false}
          onDismissGetStarted={onDismissGetStarted ?? (() => {})}
          showNavHint={showNavHint ?? false}
          onDismissNavHint={onDismissNavHint ?? (() => {})}
          hamburgerButtonRef={hamburgerButtonRef}
          formAddButtonRef={formAddButtonRef}
        />

        <OnboardingTour
          step={onboardingTourStep ?? null}
          onDismiss={onDismissOnboardingTour ?? (() => {})}
        />
      </>
    )
  }

  // Layout A: Original layout
  return (
    <>
      <div className="relative flex h-full w-full min-w-0 bg-[#F5F6F8]">
        {/* Preview area - Map mode: positioned absolutely to fill entire container, behind panels
            Preview/Code mode: positioned in normal flow after sidebar and form panel */}
        {isMapMode ? (
          <div
            className={cn(
              "absolute inset-0 hidden sm:flex",
              // When the assistant dock is open below 2xl, it becomes a fixed overlay and doesn't take layout space.
              // Reserve space so the preview content centers within the visible area.
              assistantDockProps.isOpen && "pr-[var(--assistantDockWidth)] 2xl:pr-0"
            )}
            style={
              assistantDockProps.isOpen
                ? ({ "--assistantDockWidth": `${assistantDockProps.widthPx}px` } as React.CSSProperties)
                : undefined
            }
          >
            <PlanPreviewArea {...previewPropsWithEditorRouting} />
          </div>
        ) : null}

        {/* Sidebar - slide-out panel controlled by hamburger menu */}
        {/* Mobile: full-width nav pane (drill-in/drill-out with editor) */}
        <div
          className={cn(
            "w-full sm:hidden",
            mobilePane === "nav" ? "flex" : "hidden"
          )}
        >
          <PlanSidebarNav {...sidebarPropsWithMobileRouting} />
        </div>
        {/* Desktop: slide-out panel animated by isTreeNavOpen */}
        <div
          style={{ width: collapseSidebarForBulkEdit ? 0 : isTreeNavOpen ? 280 : 0 }}
          className={cn(
            "hidden shrink-0 overflow-hidden transition-[width] duration-300 sm:block",
            isMapMode && "z-10 relative"
          )}
        >
          <div style={{ width: 280 }} className="h-full">
            <PlanSidebarNav {...sidebarPropsWithMobileRouting} />
          </div>
        </div>

        {showDesktopBulkEdit ? (
          <div className="hidden min-w-0 flex-1 sm:flex">
            {bulkEditContent}
          </div>
        ) : (
          <>
            {/* Fixed form panel (left): appears right after sidebar */}
            {formPanelSide === "fixed-left" && formPanel}

            {/* In map mode: spacer to push content to the right edge.
                In non-map mode: preview area fills remaining space after sidebar and form panel */}
            {isMapMode ? (
              <div className="hidden sm:flex min-w-0 flex-1" />
            ) : (
              <div className="hidden sm:flex min-w-0 flex-1">
                <PlanPreviewArea {...previewPropsWithEditorRouting} />
              </div>
            )}

            {/* Fixed form panel (right): appears after spacer, before assistant */}
            {formPanelSide === "fixed-right" && formPanel}

            {/* Floating form panel: positioned absolutely for left/right modes */}
            {(formPanelSide === "float-left" || formPanelSide === "float-right") && formPanel}

            <div
              className={
                assistantDockProps.isOpen
                  ? "fixed inset-0 z-40 flex justify-end 2xl:static 2xl:inset-auto 2xl:z-auto"
                  : "hidden 2xl:flex"
              }
            >
              {/* When open below xl, the assistant should take precedence and remain visible. */}
              {assistantDockProps.isOpen ? <div className="absolute inset-0 bg-black/10 2xl:hidden" /> : null}
              <div className="relative">
                <PlanAssistantPanelDock {...assistantDockProps} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Mobile preview: pull up / pull down sheet */}
      {!isBulkEditActive && (
        <MobilePreviewSheet topInsetPx={72}>
          <div className="h-full w-full">
            <PlanPreviewArea {...previewPropsWithEditorRouting} />
          </div>
        </MobilePreviewSheet>
      )}

      <AddPlanObjectPopover
        {...addObjectPopoverProps}
        onAddObject={(kind, rateCardId) => {
          addObjectPopoverProps.onAddObject(kind, rateCardId)
        }}
      />

      <OnboardingPopovers
        t={editorProps.t}
        showGetStarted={showGetStarted ?? false}
        onDismissGetStarted={onDismissGetStarted ?? (() => {})}
        showNavHint={showNavHint ?? false}
        onDismissNavHint={onDismissNavHint ?? (() => {})}
        hamburgerButtonRef={hamburgerButtonRef}
        formAddButtonRef={formAddButtonRef}
      />

      <OnboardingTour
        step={onboardingTourStep ?? null}
        onDismiss={onDismissOnboardingTour ?? (() => {})}
      />
    </>
  )
}


