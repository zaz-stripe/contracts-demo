'use client'

import type { Dispatch, SetStateAction } from "react"
import { KIND_LABELS } from "./KindGlyph"
import { SCENARIO_PRESETS, type ScenarioPresetId } from "./scenarios"
import type { ChangeKind, ComponentKind, Scenario, ScenarioComponent } from "./scenarioTypes"

const CHANGE_KIND_LABELS: Record<ChangeKind, string> = {
  "created-new": "Created from scratch (new)",
  "attached-existing": "Attached from existing (unchanged)",
  "attached-existing-edited": "Attached from existing AND pricing changed",
  "edited-pricing": "Already in plan, pricing fields changed (version bump)",
  "edited-non-pricing": "Already in plan, only non-pricing fields changed",
  "version-switched": "Already in plan, version manually switched",
  deleted: "Deleted from plan",
}

const ALL_CHANGE_KINDS: ChangeKind[] = [
  "created-new",
  "attached-existing",
  "attached-existing-edited",
  "edited-pricing",
  "edited-non-pricing",
  "version-switched",
  "deleted",
]

const ALL_KINDS: ComponentKind[] = ["rateCard", "subscriptionFee", "creditGrant"]

export function ControlPanel({
  scenario,
  setScenario,
  presetId,
  onApplyPreset,
}: {
  scenario: Scenario
  setScenario: Dispatch<SetStateAction<Scenario>>
  presetId: ScenarioPresetId
  onApplyPreset: (id: ScenarioPresetId) => void
}) {
  const updateComponent = (id: string, patch: Partial<ScenarioComponent>) => {
    setScenario((prev) => ({
      ...prev,
      components: prev.components.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }))
  }

  const addComponent = () => {
    setScenario((prev) => ({
      ...prev,
      components: [
        ...prev.components,
        {
          id: `c${Date.now()}`,
          kind: "rateCard",
          name: "New rate card",
          changeKind: "created-new",
          reusedInOtherPlans: false,
          otherPlanCount: 0,
          rateCount: 1,
          ratesDeleted: 0,
        },
      ],
    }))
  }

  const removeComponent = (id: string) => {
    setScenario((prev) => ({
      ...prev,
      components: prev.components.filter((c) => c.id !== id),
    }))
  }

  return (
    <div className="px-[16px] py-[20px]">
      <header className="mb-[20px]">
        <p className="text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#1A2C44]">
          Control panel
        </p>
        <p className="mt-[2px] text-[11px] font-[400] leading-[16px] text-[#6C7688]">
          Configure the save scenario.
        </p>
      </header>

      {/* Quick scenarios */}
      <Section title="Quick scenarios">
        <select
          value={presetId}
          onChange={(e) => onApplyPreset(e.target.value as ScenarioPresetId)}
          className="h-[32px] w-full rounded-[6px] border border-[#D8DEE4] bg-white px-[8px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] outline-none transition-all hover:border-[#B6C0CD] focus:border-[#A0D0F7] focus:shadow-[0_0_0_1.5px_#A0D0F7]"
        >
          {SCENARIO_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
        <p className="mt-[6px] text-[11px] font-[400] leading-[14px] text-[#6C7688]">
          {SCENARIO_PRESETS.find((p) => p.id === presetId)?.description}
        </p>
      </Section>

      {/* Plan */}
      <Section title="Plan">
        <SegmentedControl
          value={scenario.isNewPlan ? "new" : "existing"}
          options={[
            { value: "new", label: "New plan" },
            { value: "existing", label: "Editing existing plan" },
          ]}
          onChange={(v) => setScenario((prev) => ({ ...prev, isNewPlan: v === "new" }))}
        />
        <Field label="Plan name">
          <TextInput
            value={scenario.planName}
            onChange={(v) => setScenario((prev) => ({ ...prev, planName: v }))}
          />
        </Field>
      </Section>

      {/* Components */}
      <Section
        title="Components"
        action={
          <button
            type="button"
            onClick={addComponent}
            className="flex h-[24px] items-center rounded-[6px] border border-[#D4DEE9] bg-white px-[8px] text-[11px] font-[600] leading-[14px] tracking-[-0.022px] text-[#273951] transition-colors hover:bg-[#F5F6F8]"
          >
            + Add component
          </button>
        }
      >
        {scenario.components.length === 0 ? (
          <p className="text-[11px] font-[400] leading-[14px] text-[#6C7688]">
            No components. Add one to see how the modal reacts.
          </p>
        ) : (
          <div className="flex flex-col gap-[10px]">
            {scenario.components.map((c, idx) => (
              <ComponentEditor
                key={c.id}
                index={idx}
                component={c}
                onChange={(patch) => updateComponent(c.id, patch)}
                onRemove={() => removeComponent(c.id)}
              />
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}

function Section({
  title,
  action,
  children,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="mb-[20px]">
      <div className="mb-[8px] flex items-center justify-between">
        <p className="text-[11px] font-[600] uppercase leading-[14px] tracking-[0.4px] text-[#6C7688]">
          {title}
        </p>
        {action}
      </div>
      {children}
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-[8px]">
      <label className="mb-[4px] block text-[11px] font-[500] leading-[14px] text-[#474E5A]">
        {label}
      </label>
      {children}
    </div>
  )
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="h-[28px] w-full rounded-[6px] border border-[#D8DEE4] bg-white px-[8px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] outline-none transition-all hover:border-[#B6C0CD] focus:border-[#A0D0F7] focus:shadow-[0_0_0_1.5px_#A0D0F7] placeholder:text-[#6C7688]"
    />
  )
}

function NumberInput({
  value,
  onChange,
  min = 0,
}: {
  value: number
  onChange: (v: number) => void
  min?: number
}) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      onChange={(e) => {
        const n = Number(e.target.value)
        onChange(Number.isFinite(n) ? Math.max(min, n) : min)
      }}
      className="h-[28px] w-[80px] rounded-[6px] border border-[#D8DEE4] bg-white px-[8px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] outline-none transition-all hover:border-[#B6C0CD] focus:border-[#A0D0F7] focus:shadow-[0_0_0_1.5px_#A0D0F7]"
    />
  )
}

function Select<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="h-[28px] w-full rounded-[6px] border border-[#D8DEE4] bg-white px-[8px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] outline-none transition-all hover:border-[#B6C0CD] focus:border-[#A0D0F7] focus:shadow-[0_0_0_1.5px_#A0D0F7]"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
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
    <div className="inline-flex rounded-[6px] border border-[#D8DEE4] bg-white p-[2px]">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex h-[24px] items-center rounded-[4px] px-[10px] text-[11px] font-[600] leading-[14px] tracking-[-0.022px] transition-colors ${
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

function ComponentEditor({
  index,
  component,
  onChange,
  onRemove,
}: {
  index: number
  component: ScenarioComponent
  onChange: (patch: Partial<ScenarioComponent>) => void
  onRemove: () => void
}) {
  const isRateCard = component.kind === "rateCard"
  return (
    <div className="rounded-[8px] border border-[#EBEEF1] bg-[#FAFBFC] p-[10px]">
      <div className="mb-[8px] flex items-center justify-between">
        <p className="text-[11px] font-[600] leading-[14px] text-[#1A2C44]">
          Component {index + 1}
        </p>
        <button
          type="button"
          onClick={onRemove}
          className="text-[11px] font-[500] leading-[14px] text-[#B3093C] transition-colors hover:underline"
        >
          Remove
        </button>
      </div>

      <Field label="Type">
        <Select<ComponentKind>
          value={component.kind}
          onChange={(v) => onChange({ kind: v })}
          options={ALL_KINDS.map((k) => ({ value: k, label: KIND_LABELS[k] }))}
        />
      </Field>

      <Field label="Name">
        <TextInput value={component.name} onChange={(v) => onChange({ name: v })} />
      </Field>

      <Field label="What happened">
        <Select<ChangeKind>
          value={component.changeKind}
          onChange={(v) => onChange({ changeKind: v })}
          options={ALL_CHANGE_KINDS.map((k) => ({ value: k, label: CHANGE_KIND_LABELS[k] }))}
        />
      </Field>

      <div className="mt-[10px] flex items-center justify-between">
        <span className="text-[11px] font-[500] leading-[14px] text-[#474E5A]">
          Reused in other plans?
        </span>
        <Toggle
          value={component.reusedInOtherPlans}
          onChange={(v) => onChange({ reusedInOtherPlans: v })}
        />
      </div>

      {component.reusedInOtherPlans && (
        <Field label="How many other plans reference it">
          <NumberInput
            value={component.otherPlanCount}
            onChange={(v) => onChange({ otherPlanCount: v })}
            min={0}
          />
        </Field>
      )}

      {isRateCard && (
        <>
          <Field label="Number of rates">
            <NumberInput
              value={component.rateCount ?? 1}
              onChange={(v) => onChange({ rateCount: v })}
              min={1}
            />
          </Field>
          <Field label="Rates deleted">
            <NumberInput
              value={component.ratesDeleted ?? 0}
              onChange={(v) => onChange({ ratesDeleted: v })}
              min={0}
            />
          </Field>
        </>
      )}

      {/* Optional before/after — surfaces in variant D */}
      {(component.changeKind === "edited-pricing" ||
        component.changeKind === "attached-existing-edited") && (
        <>
          <Field label="Price (before)">
            <TextInput
              value={component.priceBefore ?? ""}
              onChange={(v) => onChange({ priceBefore: v })}
              placeholder="$20.00 / month"
            />
          </Field>
          <Field label="Price (after)">
            <TextInput
              value={component.priceAfter ?? ""}
              onChange={(v) => onChange({ priceAfter: v })}
              placeholder="$30.00 / month"
            />
          </Field>
        </>
      )}

      {component.changeKind === "edited-non-pricing" && (
        <Field label="Non-pricing field changed">
          <TextInput
            value={component.nonPricingFieldChanged ?? ""}
            onChange={(v) => onChange({ nonPricingFieldChanged: v })}
            placeholder="Display name"
          />
        </Field>
      )}
    </div>
  )
}
