'use client'

import Link from "next/link"
import { useMemo, useState } from "react"
import { ControlPanel } from "./ControlPanel"
import { ModalPreviewCard } from "./ModalPreviewCard"
import { deriveChangeBuckets } from "./deriveChangeBuckets"
import { SCENARIO_PRESETS, type ScenarioPresetId } from "./scenarios"
import { SaveModalA } from "./variants/SaveModalA"
import { SaveModalB } from "./variants/SaveModalB"
import { SaveModalC } from "./variants/SaveModalC"
import { SaveModalD } from "./variants/SaveModalD"
import { SaveModalE } from "./variants/SaveModalE"
import { InlineReuseBanner } from "./InlineReuseBanner"
import type { Scenario } from "./scenarioTypes"

const t = (key: string) => key

export function SaveModalLab() {
  const [presetId, setPresetId] = useState<ScenarioPresetId>("the-bug")
  const [scenario, setScenario] = useState<Scenario>(() => SCENARIO_PRESETS[2].build())

  const buckets = useMemo(() => deriveChangeBuckets(scenario), [scenario])
  const activePreset = SCENARIO_PRESETS.find((p) => p.id === presetId)

  const applyPreset = (id: ScenarioPresetId) => {
    const preset = SCENARIO_PRESETS.find((p) => p.id === id)
    if (!preset) return
    setPresetId(id)
    setScenario(preset.build())
  }

  // For the inline banner section, find the most relevant component to display in context.
  const bannerComponent =
    buckets.reusedAndPricingEdited[0] ??
    buckets.newVersions.find((c) => c.reusedInOtherPlans) ??
    null

  return (
    <div className="flex min-h-screen w-full bg-[#F5F6F8]">
      {/* Left: control panel */}
      <aside className="sticky top-0 h-screen w-[360px] flex-shrink-0 overflow-y-auto border-r border-[#EBEEF1] bg-white">
        <ControlPanel
          scenario={scenario}
          setScenario={setScenario}
          presetId={presetId}
          onApplyPreset={applyPreset}
        />
      </aside>

      {/* Right: preview area */}
      <main className="flex-1 px-[32px] py-[28px]">
        <header className="mb-[24px] flex items-start justify-between gap-[24px]">
          <div>
            <p className="text-[11px] font-[600] uppercase leading-[14px] tracking-[0.4px] text-[#6C7688]">
              {t("Save Modal Permutations Lab")}
            </p>
            <h1 className="mt-[4px] text-[22px] font-[600] leading-[28px] tracking-[-0.3px] text-[#1A2C44]">
              {activePreset?.label ?? t("Custom scenario")}
            </h1>
            {activePreset?.description && (
              <p className="mt-[6px] max-w-[720px] text-[12px] font-[400] leading-[18px] text-[#474E5A]">
                {activePreset.description}
              </p>
            )}
          </div>
          <Link
            href="/save-modal-lab/stress-test"
            className="flex h-[28px] flex-shrink-0 items-center rounded-[6px] border border-[#D4DEE9] bg-white px-[10px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#273951] transition-colors hover:bg-[#F5F6F8]"
          >
            Stress test Option E →
          </Link>
        </header>

        <section className="grid grid-cols-1 gap-[20px] xl:grid-cols-2">
          <ModalPreviewCard
            label="A — Today's behavior (baseline)"
            tradeoff="Only lists components whose pricing fields changed. Silent on additions, deletions, non-pricing edits, the bug case, and credit grant changes."
            isNewPlan={scenario.isNewPlan}
          >
            <SaveModalA t={t} scenario={scenario} buckets={buckets} />
          </ModalPreviewCard>

          <ModalPreviewCard
            label="B — Expanded structural lists"
            tradeoff="Adds 'Components added' and 'Components removed' sections. Covers all structural changes; still no field-level detail."
            isNewPlan={scenario.isNewPlan}
          >
            <SaveModalB t={t} scenario={scenario} buckets={buckets} />
          </ModalPreviewCard>

          <ModalPreviewCard
            label="C — Grouped by user impact"
            tradeoff="Plain-language buckets describe who is affected. Loses some structural detail in favor of clarity."
            isNewPlan={scenario.isNewPlan}
          >
            <SaveModalC t={t} scenario={scenario} buckets={buckets} />
          </ModalPreviewCard>

          <ModalPreviewCard
            label="D — Inline before / after"
            tradeoff="Shows field-level diffs and reuse warnings inline. Most informative; risks information density."
            isNewPlan={scenario.isNewPlan}
          >
            <SaveModalD t={t} scenario={scenario} buckets={buckets} />
          </ModalPreviewCard>

          {/* E spans full width on the last row to highlight it as the recommendation */}
          <div className="xl:col-span-2">
            <ModalPreviewCard
              label="E — Recommended hybrid (B + reuse warnings)"
              tradeoff="Option B's structural sections, plus an inline 'Also used in N other plans' warning under any reused component that's been edited. No before/after diffs, no 'who is affected' framing."
              isNewPlan={scenario.isNewPlan}
              highlight
            >
              <SaveModalE t={t} scenario={scenario} buckets={buckets} showRowBadges />
            </ModalPreviewCard>
          </div>
        </section>

        {/* Inline banner section */}
        <section className="mt-[40px]">
          <header className="mb-[12px]">
            <h2 className="text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#1A2C44]">
              {t("Inline editor banner")}
            </h2>
            <p className="mt-[2px] max-w-[720px] text-[12px] font-[400] leading-[18px] text-[#474E5A]">
              {t(
                "This banner would appear in the editor form itself when the user modifies a reused component's pricing — proactively, before save."
              )}
            </p>
          </header>

          <div className="max-w-[640px] rounded-[8px] border border-[#EBEEF1] bg-white p-[16px]">
            {bannerComponent && bannerComponent.reusedInOtherPlans && bannerComponent.otherPlanCount > 0 ? (
              <MockedPriceField component={bannerComponent} />
            ) : (
              <p className="text-[12px] font-[400] leading-[18px] text-[#6C7688]">
                {t(
                  "No reused-component pricing change in the current scenario. Try the 'Reused component edit' or 'The bug scenario' preset to see this banner."
                )}
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

function MockedPriceField({
  component,
}: {
  component: { name: string; otherPlanCount: number; kind: import("./scenarioTypes").ComponentKind; priceBefore?: string; priceAfter?: string }
}) {
  return (
    <div>
      <p className="mb-[8px] text-[11px] font-[600] uppercase leading-[14px] tracking-[0.4px] text-[#6C7688]">
        Editor preview
      </p>
      <div className="mb-[8px]">
        <label className="mb-[6px] block text-[12px] font-[500] leading-[16px] text-[#474E5A]">
          {component.name} — Price
        </label>
        <input
          type="text"
          defaultValue={component.priceAfter ?? "$0.00"}
          className="h-[32px] w-full rounded-[6px] border border-[#A0D0F7] bg-white p-[8px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] outline-none shadow-[0_0_0_1.5px_#A0D0F7]"
        />
      </div>
      <InlineReuseBanner
        componentName={component.name}
        otherPlanCount={component.otherPlanCount}
        kind={component.kind}
      />
    </div>
  )
}
