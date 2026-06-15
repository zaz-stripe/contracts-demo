'use client'

import { useMemo, type Dispatch, type SetStateAction } from "react"
import { ReceiptCard } from "./ReceiptCard"
import type { PricingPlanDraft, PricingPlanRow } from "./productCatalogPage.types"

type MultiReceiptPreviewProps = {
  t: (key: string) => string
  pricingPlans: PricingPlanRow[]
  currentPlanDraft: PricingPlanDraft
  editingPlanId: number | null

  // Shared utilities
  numberFormatter: Intl.NumberFormat
  parseNumberValue: (value: string) => number
  formatCurrencyValue: (value: number, currency: string, minimumFractionDigits?: number) => string
  formatIntegerWithCommas: (raw: string) => string
  getPlanLabel: (value: string, fallback: string) => string
  getPlanRateLabel: (rate?: { id: number; name: string } | null) => string

  // External state for current plan
  planRateUsage: Record<number, string>
  setPlanRateUsage: Dispatch<SetStateAction<Record<number, string>>>
  planUsageScenarioRates: number[]
  setPlanUsageScenarioRates: Dispatch<SetStateAction<number[]>>
}

type PlanToRender = {
  id: number
  draft: PricingPlanDraft
  isCurrentPlan: boolean
}

export function MultiReceiptPreview({
  t,
  pricingPlans,
  currentPlanDraft,
  editingPlanId,
  numberFormatter,
  parseNumberValue,
  formatCurrencyValue,
  formatIntegerWithCommas,
  getPlanLabel,
  getPlanRateLabel,
  planRateUsage,
  setPlanRateUsage,
  planUsageScenarioRates,
  setPlanUsageScenarioRates,
}: MultiReceiptPreviewProps) {
  // Build list of plans to render - maintain stable order based on pricingPlans array
  const plansToRender = useMemo<PlanToRender[]>(() => {
    const result: PlanToRender[] = []
    let foundCurrentPlan = false

    // Process all plans in their natural order from pricingPlans
    pricingPlans.forEach((plan) => {
      const isEditing = plan.id === editingPlanId

      // Include plan if it has a saved draft OR if it's the plan being edited
      if (plan.draft || isEditing) {
        if (isEditing) {
          foundCurrentPlan = true
        }
        result.push({
          id: plan.id,
          // Use current draft for the plan being edited, saved draft for others
          draft: isEditing ? currentPlanDraft : plan.draft!,
          isCurrentPlan: isEditing,
        })
      }
    })

    // If no current plan was found (creating a brand new plan with editingPlanId as null
    // or editingPlanId not in pricingPlans), add currentPlanDraft
    if (!foundCurrentPlan) {
      result.push({
        id: editingPlanId ?? -1,
        draft: currentPlanDraft,
        isCurrentPlan: true,
      })
    }

    return result
  }, [pricingPlans, currentPlanDraft, editingPlanId])

  // Single plan - render normally without horizontal scroll
  if (plansToRender.length === 1) {
    const plan = plansToRender[0]!
    return (
      <div className="flex h-full w-full flex-col items-center justify-start sm:justify-center">
        <div className="flex w-full flex-col items-center">
          <div className="w-full min-w-0">
            <ReceiptCard
              t={t}
              draft={plan.draft}
              planId={plan.id}
              isCurrentPlan={plan.isCurrentPlan}
              numberFormatter={numberFormatter}
              parseNumberValue={parseNumberValue}
              formatCurrencyValue={formatCurrencyValue}
              formatIntegerWithCommas={formatIntegerWithCommas}
              getPlanLabel={getPlanLabel}
              getPlanRateLabel={getPlanRateLabel}
              externalUsageState={{
                planRateUsage,
                setPlanRateUsage,
                planUsageScenarioRates,
                setPlanUsageScenarioRates,
              }}
            />
          </div>
        </div>
      </div>
    )
  }

  // Multiple plans - render side-by-side with wrapping, shrink to 320px min then stack
  return (
    <div className="flex h-full w-full flex-col items-center overflow-y-auto p-4">
      {/* Shared header for multiple plans */}
      <div className="mb-4 px-4 py-2">
        <p className="text-[14px] font-[500] leading-[16px] tracking-[-0.028px] text-[#353A44]">
          {t("Model billing for your customers")}
        </p>
      </div>
      
      {/* Plans container */}
      <div className="flex w-full flex-wrap items-start justify-center gap-6 sm:items-center">
        {plansToRender.map((plan) => (
          <div
            key={plan.id}
            className="w-full min-w-[320px] max-w-[520px] shrink"
            style={{ flexBasis: '360px' }}
          >
            <ReceiptCard
              t={t}
              draft={plan.draft}
              planId={plan.id}
              isCurrentPlan={plan.isCurrentPlan}
              showHeader={false}
              numberFormatter={numberFormatter}
              parseNumberValue={parseNumberValue}
              formatCurrencyValue={formatCurrencyValue}
              formatIntegerWithCommas={formatIntegerWithCommas}
              getPlanLabel={getPlanLabel}
              getPlanRateLabel={getPlanRateLabel}
              externalUsageState={plan.isCurrentPlan ? {
                planRateUsage,
                setPlanRateUsage,
                planUsageScenarioRates,
                setPlanUsageScenarioRates,
              } : undefined}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
