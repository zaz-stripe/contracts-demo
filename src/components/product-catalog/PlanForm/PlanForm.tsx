"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import type { QuickStartKind } from "./PlanGetStarted"
import type { PlanFormContext } from "./planFormTypes"
import { PriceGroupForm } from "./PriceGroupForm"
import { RateCardForm } from "./RateCardForm"
import { RateForm } from "./RateForm"
import { RateMeterForm } from "./RateMeterForm"
import { CreditGrantForm } from "./CreditGrantForm"
import { SubscriptionFeeForm } from "./SubscriptionFeeForm"
import { PlanDetailsForm } from "./PlanDetailsForm"
import { PlanGetStarted } from "./PlanGetStarted"
import { useOnboardingMode } from "@/components/product-catalog/onboardingMode"

export function PlanForm({ ctx }: { ctx: PlanFormContext }) {
  const {
    assistantHighlightedKeys = [],
    assistantLoadingKeys = [],
    validationErrorKeys = [],
    validationErrorMessages = {},
    activePlanNode,
    pendingFocusRateId,
    clearPendingFocusRateId,
  } = ctx

  // All hooks MUST be before any early returns
  const [skippedGetStarted, setSkippedGetStarted] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const [isWizardFormActive, setIsWizardFormActive] = useState(false)
  const [isWizardLoading, setIsWizardLoading] = useState(false)
  const pendingAction = useRef<(() => void) | null>(null)
  const exitDurationRef = useRef(200)
  const wizardLoadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isSubmittingRef = useRef(false)
  const { onboardingMode } = useOnboardingMode()

  // Simulated load duration before the wizard hands off to the destination
  // form. Lets the progress bar have time to read as a "navigation" beat.
  const WIZARD_LOAD_MS = 2000

  const isPlanEmpty = ctx.planRateCards.length === 0
    && ctx.planSubscriptionFees.length === 0
    && ctx.planCreditGrants.length === 0

  // Activate wizard form mode when onboarding is "form" and plan starts empty;
  // deactivate when switching away from "form"
  useEffect(() => {
    if (onboardingMode === "form" && isPlanEmpty && !skippedGetStarted) {
      setIsWizardFormActive(true)
    } else if (onboardingMode !== "form") {
      setIsWizardFormActive(false)
    }
  }, [onboardingMode])

  // Clear pending focus after autoFocus has triggered
  useEffect(() => {
    if (pendingFocusRateId != null && clearPendingFocusRateId) {
      const timer = setTimeout(() => clearPendingFocusRateId(), 100)
      return () => clearTimeout(timer)
    }
  }, [pendingFocusRateId, clearPendingFocusRateId])

  // Reset skip when plan becomes non-empty (user picked an option)
  useEffect(() => {
    if (!isPlanEmpty) setSkippedGetStarted(false)
  }, [isPlanEmpty])

  // Fire the pending action after exit animation completes
  useEffect(() => {
    if (!isExiting) return
    const timer = setTimeout(() => {
      setIsExiting(false)
      pendingAction.current?.()
      pendingAction.current = null
    }, exitDurationRef.current)
    return () => clearTimeout(timer)
  }, [isExiting])

  // Cancel any pending load timer if PlanForm unmounts while loading
  useEffect(() => () => {
    if (wizardLoadTimerRef.current) clearTimeout(wizardLoadTimerRef.current)
  }, [])

  // Notify the host (ProductCatalogPage) when the simulated load toggles so
  // adjacent UI (preview, etc.) can dim along with the wizard form.
  useEffect(() => {
    ctx.onWizardLoadingChange?.(isWizardLoading)
  }, [isWizardLoading, ctx.onWizardLoadingChange])

  const handleSelect = useCallback((kind: QuickStartKind) => {
    exitDurationRef.current = 200
    setIsExiting(true)
    setIsWizardFormActive(false)
    pendingAction.current = () => ctx.onQuickStart?.(kind)
  }, [ctx])

  const handleSkip = useCallback(() => {
    exitDurationRef.current = 200
    setIsExiting(true)
    setIsWizardFormActive(false)
    pendingAction.current = () => { setSkippedGetStarted(true); ctx.onSkipGetStarted?.() }
  }, [ctx])

  const isHighlighted = (key: string) => assistantHighlightedKeys.includes(key)
  const highlightInputClass = (key: string) =>
    isHighlighted(key) ? "!border-l-[3px] !border-l-[#533AFD]" : ""
  const isLoading = (key: string) => assistantLoadingKeys.includes(key)
  const validationErrorClass = (key: string) =>
    validationErrorKeys.some((k) => k === key) ? "!border-[#DF1B41]" : ""
  const validationErrorMessage = (key: string): string | undefined => validationErrorMessages[key]

  const renderActiveForm = () => {
    if (activePlanNode.type === "priceGroup") {
      const pgId = activePlanNode.id ?? 0
      const pg = ctx.planPriceGroups.find((g) => g.id === pgId)
      return (
        <PriceGroupForm
          ctx={ctx}
          priceGroupId={pgId}
          priceGroupName={pg?.name ?? ""}
          priceGroupServiceInterval={pg?.serviceInterval ?? "Monthly"}
          onChangeName={(v) => ctx.setPlanPriceGroups((prev) => prev.map((g) => g.id === pgId ? { ...g, name: v } : g))}
          onChangeServiceInterval={(v) => ctx.setPlanPriceGroups((prev) => prev.map((g) => g.id === pgId ? { ...g, serviceInterval: v } : g))}
        />
      )
    }

    if (activePlanNode.type === "rateCard") {
      return (
        <RateCardForm
          ctx={ctx}
          isHighlighted={isHighlighted}
          highlightInputClass={highlightInputClass}
          isLoading={isLoading}
          validationErrorClass={validationErrorClass}
          validationErrorMessage={validationErrorMessage}
        />
      )
    }

    if (activePlanNode.type === "rate") {
      return (
        <RateForm
          ctx={ctx}
          isHighlighted={isHighlighted}
          highlightInputClass={highlightInputClass}
          isLoading={isLoading}
          validationErrorClass={validationErrorClass}
          validationErrorMessage={validationErrorMessage}
        />
      )
    }

    if (activePlanNode.type === "rateMeter") {
      return <RateMeterForm ctx={ctx} />
    }

    if (activePlanNode.type === "creditGrant") {
      return (
        <CreditGrantForm
          ctx={ctx}
          highlightInputClass={highlightInputClass}
          isHighlighted={isHighlighted}
          validationErrorClass={validationErrorClass}
          validationErrorMessage={validationErrorMessage}
        />
      )
    }

    if (activePlanNode.type === "subscriptionFee") {
      return (
        <SubscriptionFeeForm
          ctx={ctx}
          isHighlighted={isHighlighted}
          highlightInputClass={highlightInputClass}
          validationErrorClass={validationErrorClass}
          validationErrorMessage={validationErrorMessage}
        />
      )
    }

    return (
      <PlanDetailsForm
        ctx={ctx}
        isHighlighted={isHighlighted}
        highlightInputClass={highlightInputClass}
        validationErrorClass={validationErrorClass}
        validationErrorMessage={validationErrorMessage}
      />
    )
  }

  const getStartedForm = (
    <PlanGetStarted
      t={ctx.t}
      onSelect={handleSelect}
      onSkip={handleSkip}
      onHoverOption={ctx.onHoverQuickStart}
      onFormSubmit={ctx.onWizardSubmit ? (data) => {
        // Guard against double-submits while the progress bar is running.
        if (isSubmittingRef.current) return
        isSubmittingRef.current = true

        // Phase 1 (0–2000ms): show progress bar + dim form. Chrome stays in
        // wizard mode (sidebar hidden, top header hidden). No state change
        // is propagated upstream yet — onWizardSubmit is held until the
        // progress bar completes so the world stays still during loading.
        setIsWizardLoading(true)

        if (wizardLoadTimerRef.current) clearTimeout(wizardLoadTimerRef.current)
        wizardLoadTimerRef.current = setTimeout(() => {
          setIsWizardLoading(false)
          isSubmittingRef.current = false

          // Phase 2 (2000–2280ms): cross-fade + chrome push fire together
          // so the destination form, the sidebar, and the panel title all
          // arrive in sync. We render an overlay panel title (portalled
          // to [data-form-panel] top:0) that fades in from the very first
          // frame so the title is visible as part of the fade — instead
          // of waiting for the real header's height-clip reveal.
          exitDurationRef.current = 600
          setIsExiting(true)
          setIsWizardFormActive(false)
          pendingAction.current = () => setSkippedGetStarted(true)
          ctx.onWizardSubmit?.(data)
        }, WIZARD_LOAD_MS)
      } : undefined}
      onFormChange={ctx.onWizardFormChange}
      submitRef={ctx.wizardSubmitRef}
      onCanSubmitChange={ctx.onWizardCanSubmitChange}
      hideInlineSubmit={false}
      existingPlans={ctx.existingPlans}
    />
  )

  // Show "Get started" when on the plan root and:
  // - Plan has no items yet (plan-type mode), OR
  // - Wizard form is actively being filled (form mode — items exist from live preview), OR
  // - The wizard is playing its exit animation. Without this, submitting the
  //   inline form can make the wizard unmount immediately because live preview
  //   has already made the plan structurally non-empty.
  const showGetStarted = activePlanNode.type === "plan" && !skippedGetStarted && ctx.onQuickStart
    && (isPlanEmpty || isWizardFormActive || isExiting)
  if (showGetStarted) {
    // Submit-mode exit: wizard stays mounted (preserves its filled-in
    // state) and fades out in place; the destination form renders on top
    // as an absolute overlay and fades in. Both share the same duration
    // and easing so they cross-fade together.
    const isSubmitExit = isExiting && exitDurationRef.current === 600
    return (
      <>
        {/* Top-of-viewport progress bar — portalled to document.body so it
        spans the full screen width like a YouTube/Vercel page-load bar.
        Runs across the top for WIZARD_LOAD_MS and reads as a "navigation"
        beat. */}
        {typeof document !== "undefined" && createPortal(
          <AnimatePresence>
            {isWizardLoading && (
              <motion.div
                key="wizard-progress"
                className="pointer-events-none fixed inset-x-0 top-0 z-[10000] h-[2px] overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12, ease: "easeOut" }}
              >
                <motion.div
                  className="h-full bg-[#533AFD]"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: WIZARD_LOAD_MS / 1000, ease: [0.4, 0, 0.2, 1] }}
                />
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
        <div className="relative">
          {/* Wizard — always mounted in the same JSX position so its
          internal state (typed Plan name, etc.) is preserved during the
          cross-fade. The outer non-animated div applies an instant
          translateY(-32px) when the panel header snaps to its expanded
          height — without it, the wizard would visibly jump down 32px
          before fading out. -32px ≈ panel header height. */}
          <div
            style={{
              transform: isSubmitExit ? "translateY(-32px)" : undefined,
            }}
          >
            <motion.div
              initial={false}
              animate={{
                opacity: isSubmitExit ? 0 : isExiting ? 0 : isWizardLoading ? 0.55 : 1,
              }}
              transition={{
                duration: isSubmitExit ? 0.28 : 0.2,
                ease: [0.4, 0, 0.2, 1],
              }}
              style={{
                pointerEvents:
                  isExiting || isWizardLoading || isSubmitExit ? "none" : undefined,
              }}
              aria-busy={isWizardLoading || undefined}
            >
              {getStartedForm}
            </motion.div>
          </div>
          {/* Destination — overlays absolutely on top during cross-fade.
          Sits at its FINAL y (panel header expanded) from the very first
          frame because PlanEditorPanel snaps the header instantly. No
          downward drift — cross-fade happens in place. */}
          {isSubmitExit && (
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            >
              {renderActiveForm()}
            </motion.div>
          )}
        </div>
      </>
    )
  }

  return renderActiveForm()
}
