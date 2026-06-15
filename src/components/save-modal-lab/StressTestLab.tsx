'use client'

import Link from "next/link"
import { useMemo, useState } from "react"
import { ModalPreviewCard } from "./ModalPreviewCard"
import { deriveChangeBuckets } from "./deriveChangeBuckets"
import { SCENARIO_PRESETS, type ScenarioPresetId } from "./scenarios"
import {
  STRESS_SCENARIOS,
  type StressScenarioPresetId,
} from "./stressScenarios"
import type { Scenario } from "./scenarioTypes"
import { SaveModalE, type DensityMode } from "./variants/SaveModalE"

const t = (key: string) => key

/** Combined picker: regular presets that are interesting for stress
 *  testing (e.g. the bug scenario) plus the new stress presets. */
type CombinedPresetId = ScenarioPresetId | StressScenarioPresetId

type CombinedPreset = {
  id: CombinedPresetId
  label: string
  description: string
  build: () => Scenario
  group: "Diagnostic" | "Stress test"
}

const COMBINED_PRESETS: CombinedPreset[] = [
  // The bug scenario lives in the original presets but is also useful
  // here as a diagnostic case that demonstrates how the bug-routing
  // (attached-existing-edited goes to "New versions" only) keeps the
  // modal compact even when something the user did was complex.
  ...SCENARIO_PRESETS.filter((p) => p.id === "the-bug").map<CombinedPreset>((p) => ({
    id: p.id,
    label: p.label,
    description: p.description,
    build: p.build,
    group: "Diagnostic" as const,
  })),
  ...STRESS_SCENARIOS.map<CombinedPreset>((p) => ({
    id: p.id,
    label: p.label,
    description: p.description,
    build: p.build,
    group: "Stress test" as const,
  })),
]

/** Scenarios that get the 3-column density showdown grid. Worst-case
 *  also gets a second row comparing with/without "Other changes"; the
 *  rest only render the single density-comparison row. */
const GRID_PRESETS = new Set<CombinedPresetId>(["worst-case", "many-version-bumps"])

export function StressTestLab() {
  const [presetId, setPresetId] = useState<CombinedPresetId>("worst-case")
  const [scenario, setScenario] = useState<Scenario>(() =>
    COMBINED_PRESETS.find((p) => p.id === "worst-case")!.build()
  )
  const [showOtherChanges, setShowOtherChanges] = useState(true)
  const [density, setDensity] = useState<DensityMode>("none")
  const [showRowBadges, setShowRowBadges] = useState(true)

  const buckets = useMemo(() => deriveChangeBuckets(scenario), [scenario])
  const activePreset = COMBINED_PRESETS.find((p) => p.id === presetId)

  const applyPreset = (id: CombinedPresetId) => {
    const preset = COMBINED_PRESETS.find((p) => p.id === id)
    if (!preset) return
    setPresetId(id)
    setScenario(preset.build())
  }

  const isGrid = GRID_PRESETS.has(presetId)
  const isWorstCase = presetId === "worst-case"
  const isSingle = !isGrid

  return (
    <div className="flex min-h-screen w-full bg-[#F5F6F8]">
      {/* Left: control panel — simpler than the comparison lab */}
      <aside className="sticky top-0 h-screen w-[320px] flex-shrink-0 overflow-y-auto border-r border-[#EBEEF1] bg-white px-[16px] py-[20px]">
        <header className="mb-[20px]">
          <p className="text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#1A2C44]">
            Stress test — Option E
          </p>
          <p className="mt-[2px] text-[11px] font-[400] leading-[16px] text-[#6C7688]">
            Pressure-test the recommended hybrid against high-volume scenarios.
          </p>
          <Link
            href="/save-modal-lab"
            className="mt-[8px] inline-flex h-[24px] items-center rounded-[6px] border border-[#D4DEE9] bg-white px-[8px] text-[11px] font-[600] leading-[14px] tracking-[-0.022px] text-[#273951] transition-colors hover:bg-[#F5F6F8]"
          >
            ← Back to A/B/C/D/E comparison
          </Link>
        </header>

        <Section title="Scenario">
          <select
            value={presetId}
            onChange={(e) => applyPreset(e.target.value as CombinedPresetId)}
            className="h-[32px] w-full rounded-[6px] border border-[#D8DEE4] bg-white px-[8px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] outline-none transition-all hover:border-[#B6C0CD] focus:border-[#A0D0F7] focus:shadow-[0_0_0_1.5px_#A0D0F7]"
          >
            {(["Diagnostic", "Stress test"] as const).map((group) => (
              <optgroup key={group} label={group}>
                {COMBINED_PRESETS.filter((p) => p.group === group).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          {activePreset?.description && (
            <p className="mt-[8px] text-[11px] font-[400] leading-[14px] text-[#6C7688]">
              {activePreset.description}
            </p>
          )}
        </Section>

        <Section title="Density controls">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-[500] leading-[14px] text-[#474E5A]">
              Show &ldquo;Other changes&rdquo; section
            </span>
            <Toggle value={showOtherChanges} onChange={setShowOtherChanges} />
          </div>
          <p className="mt-[6px] text-[11px] font-[400] leading-[14px] text-[#6C7688]">
            Toggle to see whether non-pricing edits add useful detail or just noise. The worst-case scenario shows both states side-by-side.
          </p>
          <div className="mt-[12px] flex items-center justify-between">
            <span className="text-[11px] font-[500] leading-[14px] text-[#474E5A]">
              Tags
            </span>
            <Toggle value={showRowBadges} onChange={setShowRowBadges} />
          </div>
          <p className="mt-[6px] text-[11px] font-[400] leading-[14px] text-[#6C7688]">
            Show tags on Changed rows and credit-grant deletions, with hover popovers for the full explanation. Default on.
          </p>
          {isSingle && (
            <div className="mt-[12px]">
              <p className="mb-[6px] text-[11px] font-[500] leading-[14px] text-[#474E5A]">
                Density mode
              </p>
              <SegmentedControl<DensityMode>
                value={density}
                options={[
                  { value: "none", label: "None" },
                  { value: "scroll", label: "Scroll" },
                  { value: "collapse", label: "Collapse" },
                ]}
                onChange={setDensity}
              />
              <p className="mt-[6px] text-[11px] font-[400] leading-[14px] text-[#6C7688]">
                None = full list. Scroll = max-h 300 px with overflow. Collapse = first 3 per section, &ldquo;and N more&rdquo; to expand.
              </p>
            </div>
          )}
        </Section>

        <Section title="What you&rsquo;re looking at">
          <div className="flex flex-col gap-[8px] text-[11px] font-[400] leading-[14px] text-[#6C7688]">
            {isGrid ? (
              <p>
                <strong className="font-[600] text-[#1A2C44]">Density showdown:</strong>{" "}
                Three columns compare no-truncation, max-height-scroll, and collapse-after-3.{" "}
                {isWorstCase
                  ? "Top row keeps \u201cOther changes\u201d; bottom row drops it."
                  : "This is the real test for the collapse pattern \u2014 a single section of 7 rows."}
              </p>
            ) : (
              <p>
                <strong className="font-[600] text-[#1A2C44]">Single Option E preview:</strong>{" "}
                Use the density mode and &ldquo;Other changes&rdquo; toggles above to explore how the design holds up.
              </p>
            )}
          </div>
        </Section>
      </aside>

      {/* Right: previews */}
      <main className="flex-1 px-[32px] py-[28px]">
        <header className="mb-[24px]">
          <p className="text-[11px] font-[600] uppercase leading-[14px] tracking-[0.4px] text-[#6C7688]">
            Stress test — Option E
          </p>
          <h1 className="mt-[4px] text-[22px] font-[600] leading-[28px] tracking-[-0.3px] text-[#1A2C44]">
            {activePreset?.label}
          </h1>
          {activePreset?.description && (
            <p className="mt-[6px] max-w-[720px] text-[12px] font-[400] leading-[18px] text-[#474E5A]">
              {activePreset.description}
            </p>
          )}
        </header>

        {isGrid ? (
          <DensityShowdownGrid
            scenario={scenario}
            buckets={buckets}
            includeWithoutOtherRow={isWorstCase}
            showRowBadges={showRowBadges}
          />
        ) : (
          <section>
            <ModalPreviewCard
              label={`Option E \u2014 ${density === "none" ? "no truncation" : density === "scroll" ? "max-height + scroll" : "collapse after 3"}`}
              tradeoff="Recommended hybrid. Use the sidebar toggles to flip density mode, the 'Other changes' section, and tags."
              isNewPlan={scenario.isNewPlan}
              highlight
            >
              <SaveModalE
                t={t}
                scenario={scenario}
                buckets={buckets}
                showOtherChanges={showOtherChanges}
                density={density}
                showRowBadges={showRowBadges}
              />
            </ModalPreviewCard>
          </section>
        )}
      </main>
    </div>
  )
}

function DensityShowdownGrid({
  scenario,
  buckets,
  includeWithoutOtherRow,
  showRowBadges,
}: {
  scenario: Scenario
  buckets: ReturnType<typeof deriveChangeBuckets>
  /** When true, render a second row that drops the "Other changes" section
   *  for direct with/without comparison. Only meaningful for scenarios that
   *  actually have non-pricing edits / version-switches / credit-grant changes. */
  includeWithoutOtherRow: boolean
  showRowBadges: boolean
}) {
  const variations: Array<{
    label: string
    tradeoff: string
    density: "none" | "scroll" | "collapse"
  }> = [
    {
      label: "No truncation",
      tradeoff: "Full list, modal grows tall. Establishes the worst case.",
      density: "none",
    },
    {
      label: "Max-height + scroll",
      tradeoff: "Body capped at ~300 px with overflow. Same as today's component list.",
      density: "scroll",
    },
    {
      label: "Collapse after 3",
      tradeoff: "Each section shows the first 3 rows with an 'and N more' link.",
      density: "collapse",
    },
  ]

  return (
    <div className="flex flex-col gap-[28px]">
      <div>
        {includeWithoutOtherRow && (
          <p className="mb-[10px] text-[12px] font-[600] uppercase leading-[14px] tracking-[0.4px] text-[#6C7688]">
            With &ldquo;Other changes&rdquo; section
          </p>
        )}
        <div className="grid grid-cols-1 gap-[20px] xl:grid-cols-3">
          {variations.map((v) => (
            <ModalPreviewCard
              key={`with-${v.density}`}
              label={v.label}
              tradeoff={v.tradeoff}
              isNewPlan={scenario.isNewPlan}
            >
              <SaveModalE
                t={t}
                scenario={scenario}
                buckets={buckets}
                showOtherChanges
                density={v.density}
                showRowBadges={showRowBadges}
              />
            </ModalPreviewCard>
          ))}
        </div>
      </div>

      {includeWithoutOtherRow && (
      <div>
        <p className="mb-[10px] text-[12px] font-[600] uppercase leading-[14px] tracking-[0.4px] text-[#6C7688]">
          Without &ldquo;Other changes&rdquo; section
        </p>
        <div className="grid grid-cols-1 gap-[20px] xl:grid-cols-3">
          {variations.map((v) => (
            <ModalPreviewCard
              key={`without-${v.density}`}
              label={v.label}
              tradeoff={v.tradeoff}
              isNewPlan={scenario.isNewPlan}
            >
              <SaveModalE
                t={t}
                scenario={scenario}
                buckets={buckets}
                showOtherChanges={false}
                density={v.density}
                showRowBadges={showRowBadges}
              />
            </ModalPreviewCard>
          ))}
        </div>
      </div>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-[20px]">
      <p className="mb-[8px] text-[11px] font-[600] uppercase leading-[14px] tracking-[0.4px] text-[#6C7688]">
        {title}
      </p>
      {children}
    </section>
  )
}

function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="inline-flex w-full rounded-[6px] border border-[#D8DEE4] bg-white p-[2px]">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex h-[24px] flex-1 items-center justify-center rounded-[4px] px-[8px] text-[11px] font-[600] leading-[14px] tracking-[-0.022px] transition-colors ${
            value === opt.value
              ? "bg-[#EFEEFF] text-[#533AFD]"
              : "text-[#474E5A] hover:bg-[#F5F6F8]"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex items-center"
      aria-pressed={value}
    >
      <span
        className={`relative inline-flex h-[18px] w-[30px] shrink-0 items-center rounded-full transition-colors ${
          value ? "bg-[#675DFF]" : "bg-[#D8DEE4]"
        }`}
      >
        <span
          className={`inline-block h-[14px] w-[14px] rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.16)] transition-transform ${
            value ? "translate-x-[14px]" : "translate-x-[2px]"
          }`}
        />
      </span>
    </button>
  )
}
