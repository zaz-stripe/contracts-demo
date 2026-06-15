'use client'

import type { ComponentProps, ReactNode } from "react"
import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"

import { ProductFormOverlay } from "@/components/ProductFormOverlay"
import { PlanFormSkeleton, PlanFormSkeletonHeader } from "@/components/product-catalog/PlanFormSkeleton"
import { PricingPlanModalBody } from "@/components/product-catalog/PricingPlanModalBody"
import { PricingPlanModalHeader } from "@/components/product-catalog/PricingPlanModalHeader"
import { PlanCodeView } from "@/components/product-catalog/PlanCodeView"
import { CoachmarkOverlay, CoachmarkPulse, type CoachmarkStep } from "@/components/product-catalog/Coachmark"
import { ValidationAttentionPanel } from "@/components/product-catalog/IncompleteFieldsModal"
import { BulkEditHeaderVisibleContext } from "@/components/product-catalog/BulkRateEditor"
import { SaveVersionModal } from "@/components/product-catalog/SaveVersionModal"
import { useLayoutMode } from "@/components/product-catalog/layoutMode"
import { useOnboardingMode } from "@/components/product-catalog/onboardingMode"
import { useBulkEditTransition } from "@/components/product-catalog/bulkEditTransition"
import { COACHMARK_STEPS_LAYOUT_A, COACHMARK_STEPS_LAYOUT_B, DYNAMIC_COACHMARK_MAP, INTRO_COACHMARK_STEPS } from "@/lib/example-pricing-plan"
import { PlanSidebarNav } from "@/components/product-catalog/PlanSidebarNav"
import { cn } from "@/lib/utils"
import type { ValidationErrorObject } from "@/components/product-catalog/PlanForm/validatePlanForm"

const INTRO_COACHMARK_STORAGE_KEY = "pricing-plan-intro-coachmark-seen"

type PricingPlanModalOverlayProps = {
  overlayProps: Omit<ComponentProps<typeof ProductFormOverlay>, "header" | "children">
  headerProps: ComponentProps<typeof PricingPlanModalHeader>
  bodyProps: ComponentProps<typeof PricingPlanModalBody>
  coachmarkProps?: {
    isActive: boolean
    currentStep: number
    steps: CoachmarkStep[]
    onNext: () => void
    onPrev: () => void
    onClose: () => void
    onNavigateToStep: (stepId: string) => void
  }
  /** Single dynamic coachmark (on-first-click) – no tour UI, just close. */
  activeCoachmark?: string | null
  onDismissCoachmark?: () => void
  /** Validation error objects for the attention panel */
  validationErrorObjects?: ValidationErrorObject[]
  /** Callback when user clicks an error object to navigate to its form */
  onNavigateToValidationError?: (obj: ValidationErrorObject) => void
  /** Callback to dismiss the validation attention panel */
  onDismissValidationPanel?: () => void
  /** Props for the save version modal (when defined, the modal is rendered) */
  saveVersionModalProps?: ComponentProps<typeof SaveVersionModal>
  /** Inline wizard form rendered inside the overlay (form onboarding mode). */
  inlineWizardForm?: ReactNode
  /** When true, show skeleton instead of real content (wizard transition). */
  showSkeleton?: boolean
  /** Called when skeleton should be dismissed (after delay). */
  onSkeletonDone?: () => void
}

export function PricingPlanModalOverlay({ overlayProps, headerProps, bodyProps, coachmarkProps, activeCoachmark, onDismissCoachmark, validationErrorObjects, onNavigateToValidationError, onDismissValidationPanel, saveVersionModalProps, inlineWizardForm, showSkeleton, onSkeletonDone }: PricingPlanModalOverlayProps) {
  const { layoutMode } = useLayoutMode()
  // Read onboarding mode from the provider that actually wraps this overlay.
  // The same hook called from ProductCatalogPage is above the provider and
  // returns the fallback "tips" value; reading it here gives the real value.
  const { onboardingMode } = useOnboardingMode()
  // The inline get-started wizard form runs in `form` mode on an empty plan
  // root. While it's showing, hide the entire top header (plan name, +,
  // Discard, Get started). Compute synchronously here so the header never
  // flashes between modal-open and when the parent's state catches up.
  const inlineGetStartedActive = (() => {
    if (onboardingMode !== "form") return false
    if (bodyProps.editorProps?.nodeType !== "plan") return false
    if (bodyProps.showGetStarted !== true) return false
    if (bodyProps.previewProps?.isInlineGetStartedActive === true) return true
    const preview = bodyProps.previewProps
    if (!preview) return false
    const empty =
      (preview.planRateCards?.length ?? 0) === 0 &&
      (preview.planSubscriptionFees?.length ?? 0) === 0 &&
      (preview.planCreditGrants?.length ?? 0) === 0
    return empty
  })()
  const { bulkEditTransition } = useBulkEditTransition()
  const keepHeaderVisible = bulkEditTransition === "inline" || bulkEditTransition === "header"
  const collapseSidebarForBulkEdit = bodyProps.isBulkEditMode && bulkEditTransition !== "inline"

  // Code popover state for Layout B
  const [isCodePopoverOpen, setIsCodePopoverOpen] = useState(false)

  // Delayed header swap for bulk edit: keep the outer header visible during the
  // 300ms entry transition, then swap it for BulkRateEditor's internal title row.
  // In inline/header modes the original header stays and the BulkRateEditor's own
  // title row stays hidden (controlled by BulkEditHeaderVisibleContext = false).
  const [bulkEditReady, setBulkEditReady] = useState(false)
  useEffect(() => {
    if (keepHeaderVisible) {
      setBulkEditReady(false)
      return
    }
    if (bodyProps.isBulkEditMode) {
      const timer = setTimeout(() => setBulkEditReady(true), 310)
      return () => clearTimeout(timer)
    } else {
      setBulkEditReady(false)
    }
  }, [bodyProps.isBulkEditMode, keepHeaderVisible])

  // Compute bulk edit title for "header" transition mode
  const t = headerProps.t
  const bulkEditTitle = useMemo(() => {
    if (bulkEditTransition !== "header" || bodyProps.bulkEditRateCardId == null) return undefined
    const rateCard = bodyProps.sidebarProps.planRateCards.find(
      (c) => c.id === bodyProps.bulkEditRateCardId
    )
    const rates = rateCard?.rates ?? []
    const rateCardName = rateCard?.name?.trim() || t("price group")
    const count = rates.length
    return `${t("Editing")} ${count} ${count === 1 ? t("price") : t("prices")} ${t("in")} ${rateCardName}`
  }, [bulkEditTransition, bodyProps.bulkEditRateCardId, bodyProps.sidebarProps.planRateCards, t])

  // Intro coachmark state (shown on first launch)
  const [isIntroCoachmarkActive, setIsIntroCoachmarkActive] = useState(false)
  const [introCoachmarkStep, setIntroCoachmarkStep] = useState(0)

  // Intro coachmarks disabled for now
  // useEffect(() => {
  //   if (!overlayProps.isOpen) return
  //   const timer = setTimeout(() => {
  //     try {
  //       const seen = localStorage.getItem(INTRO_COACHMARK_STORAGE_KEY)
  //       if (!seen) {
  //         setIsIntroCoachmarkActive(true)
  //         setIntroCoachmarkStep(0)
  //       }
  //     } catch {}
  //   }, 500)
  //   return () => clearTimeout(timer)
  // }, [overlayProps.isOpen])

  const handleIntroNext = () => {
    if (introCoachmarkStep < INTRO_COACHMARK_STEPS.length - 1) {
      setIntroCoachmarkStep(prev => prev + 1)
    } else {
      handleIntroClose()
    }
  }

  const handleIntroPrev = () => {
    if (introCoachmarkStep > 0) {
      setIntroCoachmarkStep(prev => prev - 1)
    }
  }

  const handleIntroClose = () => {
    setIsIntroCoachmarkActive(false)
    try {
      localStorage.setItem(INTRO_COACHMARK_STORAGE_KEY, "true")
    } catch {
      // localStorage not available
    }
  }
  
  // Use the appropriate coachmark steps based on the current layout mode
  const effectiveSteps = useMemo(() => {
    return layoutMode === "B" ? COACHMARK_STEPS_LAYOUT_B : COACHMARK_STEPS_LAYOUT_A
  }, [layoutMode])
  
  // Clamp the current step index to valid range for the effective steps
  const effectiveCurrentStep = coachmarkProps 
    ? Math.min(coachmarkProps.currentStep, effectiveSteps.length - 1)
    : 0
  
  // Wrap onNext to handle tour completion based on effective steps
  const handleNext = () => {
    if (!coachmarkProps) return
    if (effectiveCurrentStep >= effectiveSteps.length - 1) {
      // We're at the last step, close the tour
      coachmarkProps.onClose()
    } else {
      coachmarkProps.onNext()
    }
  }
  
  // Code view content for the popover (match Layout A's code tab)
  const codeViewContent = useMemo(() => {
    if (layoutMode !== "B") return null
    const p = bodyProps.previewProps
    return (
      <PlanCodeView
        t={p.t}
        input={{
          planName: p.planName,
          planDescription: p.planDescription,
          planCurrency: p.planCurrency,
          planLookupKey: p.planLookupKey,
          planRateCards: p.planRateCards,
          rateMeters: p.rateMetersByRate,
          ratePriceTypes: p.ratePriceTypes,
          planRateUnitPrices: p.planRateUnitPrices,
          planRateTiers: p.planRateTiers,
          planRateTierToValues: p.planRateTierToValues,
          planRateTierUnitPrices: p.planRateTierUnitPrices,
          planRateTierFlatFees: p.planRateTierFlatFees,
          rateUnitLabels: p.rateUnitLabels,
          rateSellAs: p.rateSellAs,
          planCreditGrants: p.planCreditGrants,
          creditGrantAmounts: p.creditGrantAmounts,
          creditGrantPeriods: p.creditGrantPeriods,
          planSubscriptionFees: p.planSubscriptionFees,
          subscriptionFeeAmounts: p.subscriptionFeeAmounts,
          subscriptionFeePeriods: p.subscriptionFeePeriods,
        }}
      />
    )
  }, [layoutMode, bodyProps.previewProps])
  
  const isLayoutB = layoutMode === "B"

  // Skeleton → content crossfade: auto-dismiss after 800ms
  useEffect(() => {
    if (!showSkeleton || !overlayProps.isOpen) return
    const timer = setTimeout(() => onSkeletonDone?.(), 2000)
    return () => clearTimeout(timer)
  }, [showSkeleton, overlayProps.isOpen, onSkeletonDone])

  return (
    <ProductFormOverlay
      {...overlayProps}
      sidebar={isLayoutB ? (
        <div
          className="hidden shrink-0 overflow-hidden transition-[width] duration-[320ms] ease-[cubic-bezier(0.16,1,0.3,1)] sm:flex sm:justify-end"
          style={{ width: collapseSidebarForBulkEdit ? 0 : bodyProps.isTreeNavOpen ? 280 : 0 }}
        >
          <div style={{ width: 280 }} className={cn("h-full flex flex-col bg-white shrink-0", "[&>aside]:sm:!w-full [&>aside]:sm:!min-w-0 [&>aside]:sm:!max-w-none")}>
            <div className="min-h-0 flex-1">
              <PlanSidebarNav {...bodyProps.sidebarProps} />
            </div>
          </div>
        </div>
      ) : undefined}
      header={
        showSkeleton ? (
          // Skip the skeleton header entirely when we're heading into the
          // inline Get started wizard — the wizard runs with the top header
          // collapsed, so showing a skeleton header would create a visible
          // chrome flash before it collapses.
          inlineGetStartedActive ? null : <PlanFormSkeletonHeader />
        ) : !bulkEditReady ? (
            <motion.div
              key="real-header"
              className="overflow-hidden flex flex-col justify-end"
              initial={inlineGetStartedActive ? { height: 0 } : false}
              animate={{
                height: inlineGetStartedActive ? 0 : "auto",
              }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              style={{ pointerEvents: inlineGetStartedActive ? "none" : undefined }}
            >
              <PricingPlanModalHeader
                {...headerProps}
                layoutMode={layoutMode}
                isCodePopoverOpen={isCodePopoverOpen}
                onToggleCodePopover={() => setIsCodePopoverOpen(prev => !prev)}
                codeViewContent={codeViewContent}
                isBulkEditMode={bulkEditTransition === "header" && bodyProps.isBulkEditMode}
                bulkEditTitle={bulkEditTitle}
                onBulkEditBack={bodyProps.onExitBulkEdit}
                nodeLabel={bodyProps.editorProps.headerLabel}
                parentLabel={bodyProps.editorProps.parentLabel}
                onNavigateToParent={bodyProps.editorProps.onNavigateToParent}
                nodeType={bodyProps.editorProps.nodeType}
                onNavigateToPlan={bodyProps.editorProps.onNavigateToPlan}
                isTreeNavOpen={bodyProps.editorProps.isTreeNavOpen}
                onToggleTreeNav={bodyProps.editorProps.onToggleTreeNav}
                hamburgerButtonRef={bodyProps.editorProps.hamburgerButtonRef}
                hasTreeChanges={bodyProps.editorProps.hasTreeChanges}
                onDismissNavHint={bodyProps.editorProps.onDismissNavHint}
                formAddButtonRef={bodyProps.editorProps.formAddButtonRef}
                onToggleAddPlanObject={bodyProps.editorProps.onToggleAddPlanObject}
                onDismissGetStarted={bodyProps.editorProps.onDismissGetStarted}
              />
            </motion.div>
        ) : null
      }
    >
      <AnimatePresence mode="wait">
        {showSkeleton ? (
          <motion.div
            key="skeleton"
            className="h-full w-full"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <PlanFormSkeleton />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            className="h-full w-full flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <BulkEditHeaderVisibleContext.Provider value={bulkEditReady ? "all" : (bulkEditTransition === "header" && bodyProps.isBulkEditMode ? "none" : "subtitle")}>
              <div className="relative h-full w-full">
                <PricingPlanModalBody
                  {...bodyProps}
                  editorProps={{
                    ...bodyProps.editorProps,
                    // While the inline wizard is active, force the panel
                    // header to stay MOUNTED (override the upstream
                    // `hideHeader=true`) so `collapseHeader` can animate it
                    // smoothly from height 0 → auto in sync with the chrome
                    // push. Without this, the header unmounts during the
                    // wizard and pops in on remount.
                    hideHeader:
                      bodyProps.editorProps.nodeType === "plan" && inlineGetStartedActive
                        ? false
                        : bodyProps.editorProps.hideHeader,
                    collapseHeader:
                      bodyProps.editorProps.nodeType === "plan" &&
                      inlineGetStartedActive,
                  }}
                  // Layout B: left panel always visible; no right/bottom panels
                  isLeftPanelVisible={isLayoutB ? true : undefined}
                  isRightPanelVisible={isLayoutB ? false : undefined}
                  isBottomPanelVisible={isLayoutB ? false : undefined}
                  onOpenLeftPanel={undefined}
                  // Layout B: sidebar rendered at overlay level for full-height
                  hideSidebar={isLayoutB}
                />
              {/* Validation attention popover — positioned in the preview area */}
              {validationErrorObjects && validationErrorObjects.length > 0 && onNavigateToValidationError && (
                <div className="pointer-events-none absolute inset-0 z-40 hidden sm:flex items-start">
                  {/* Spacer for sidebar + editor width */}
                  <div className="shrink-0 h-0" style={{ width: 280 + 320 }} />
                  <div className="pointer-events-auto min-w-0 flex-1 flex justify-end pl-[16px] pr-[80px] pt-[8px]">
                    <ValidationAttentionPanel
                      t={headerProps.t}
                      objects={validationErrorObjects}
                      onNavigateToObject={onNavigateToValidationError}
                      onDismiss={onDismissValidationPanel}
                    />
                  </div>
                </div>
              )}
            </div>
            </BulkEditHeaderVisibleContext.Provider>
            {/* Intro coachmarks (shown on first launch) */}
            {isIntroCoachmarkActive && INTRO_COACHMARK_STEPS[introCoachmarkStep] && (
              <>
                <CoachmarkPulse
                  key={INTRO_COACHMARK_STEPS[introCoachmarkStep].id}
                  targetSelector={INTRO_COACHMARK_STEPS[introCoachmarkStep].targetSelector}
                  onClick={() => {}}
                  isSelected
                />
                <CoachmarkOverlay
                  step={INTRO_COACHMARK_STEPS[introCoachmarkStep]}
                  stepIndex={introCoachmarkStep}
                  totalSteps={INTRO_COACHMARK_STEPS.length}
                  onClose={handleIntroClose}
                  onNext={handleIntroNext}
                  onPrev={handleIntroPrev}
                />
              </>
            )}
            {saveVersionModalProps && <SaveVersionModal {...saveVersionModalProps} />}
          </motion.div>
        )}
      </AnimatePresence>
    </ProductFormOverlay>
  )
}
