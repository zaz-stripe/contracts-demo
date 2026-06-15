'use client'

import { useState } from "react"
import { ModalShell } from "./ModalShell"
import { KindGlyph } from "../KindGlyph"
import type { ChangeBuckets, Scenario, ScenarioComponent } from "../scenarioTypes"

/** Variant C — groups changes by user impact rather than by component
 *  type. Surfaces the "version bumps don't propagate to existing
 *  subscribers" rule as a footnote on the relevant bucket. */
export function SaveModalC({
  t,
  scenario,
  buckets,
}: {
  t: (k: string) => string
  scenario: Scenario
  buckets: ChangeBuckets
}) {
  const [defaultForNew, setDefaultForNew] = useState(false)

  const futureSubscriberChanges = [
    ...buckets.added,
    ...buckets.removed,
    ...buckets.newVersions,
    ...buckets.creditGrantChanges,
  ]
  // Dedupe — a single component can be in multiple buckets (e.g. attached + version-bump).
  const seen = new Set<string>()
  const futureChangesUnique = futureSubscriberChanges.filter((c) => {
    if (seen.has(c.id)) return false
    seen.add(c.id)
    return true
  })

  const otherChanges = [...buckets.nonPricingEdits, ...buckets.versionSwitched]

  return (
    <ModalShell
      title={`${t(scenario.isNewPlan ? "Save" : "Save new version of")} ${scenario.isNewPlan ? "" : `\u201c${scenario.planName}\u201d`}`.trim()}
      showDefaultToggle={!scenario.isNewPlan}
      isDefaultForNewSubscribers={defaultForNew}
      onToggleDefault={() => setDefaultForNew((v) => !v)}
    >
      {futureChangesUnique.length > 0 && (
        <Bucket
          title="Changes that affect future subscribers"
          subtitle="These take effect when this version becomes the default."
        >
          {futureChangesUnique.map((c) => (
            <ImpactRow key={`f-${c.id}`} component={c} buckets={buckets} />
          ))}
        </Bucket>
      )}

      {buckets.newVersions.length > 0 && (
        <Bucket
          title="Existing subscribers won't be affected"
          subtitle="They stay on their current version. New versions only apply to new subscribers (or when migrated explicitly)."
          tone="muted"
        >
          {buckets.newVersions.map((c) => (
            <ImpactRow key={`e-${c.id}`} component={c} buckets={buckets} compact />
          ))}
        </Bucket>
      )}

      {otherChanges.length > 0 && (
        <Bucket title="Other changes" subtitle="These don't change pricing.">
          {otherChanges.map((c) => (
            <ImpactRow key={`o-${c.id}`} component={c} buckets={buckets} compact />
          ))}
        </Bucket>
      )}
    </ModalShell>
  )
}

function Bucket({
  title,
  subtitle,
  tone,
  children,
}: {
  title: string
  subtitle?: string
  tone?: "muted"
  children: React.ReactNode
}) {
  return (
    <div className="border-b border-[#EBEEF1] px-[16px] py-[12px]">
      <p
        className={`mb-[2px] text-[12px] font-[600] leading-[16px] ${
          tone === "muted" ? "text-[#6C7688]" : "text-[#1A2C44]"
        }`}
      >
        {title}
      </p>
      {subtitle && (
        <p className="mb-[8px] text-[11px] font-[400] leading-[14px] text-[#6C7688]">{subtitle}</p>
      )}
      {children}
    </div>
  )
}

function ImpactRow({
  component,
  buckets,
  compact = false,
}: {
  component: ScenarioComponent
  buckets: ChangeBuckets
  compact?: boolean
}) {
  // Determine a single label for this component's role in the change.
  const isRemoved = buckets.removed.some((c) => c.id === component.id)
  const isAdded = buckets.added.some((c) => c.id === component.id)
  const isNewVersion = buckets.newVersions.some((c) => c.id === component.id)
  const isCreditGrant = buckets.creditGrantChanges.some((c) => c.id === component.id)

  let label = "Updated"
  let pillClass = "bg-[#EEF0F3] text-[#474E5A]"
  if (isRemoved) {
    label = "Removed"
    pillClass = "bg-[#FCE8EE] text-[#B3093C]"
  } else if (isNewVersion) {
    label = "New version"
    pillClass = "bg-[#EFEEFF] text-[#533AFD]"
  } else if (isAdded) {
    label = component.changeKind === "created-new" ? "New" : "Attached"
    pillClass = "bg-[#E6F4EB] text-[#0C6B37]"
  } else if (isCreditGrant) {
    label = "Credit grant changed"
    pillClass = "bg-[#FFF4E5] text-[#8C5400]"
  }

  return (
    <div className={`flex items-center justify-between ${compact ? "py-[2px]" : "py-[3px]"}`}>
      <div className="flex items-center gap-[6px]">
        <KindGlyph kind={component.kind} />
        <span
          className={`text-[12px] font-[400] leading-[16px] ${
            isRemoved ? "text-[#6C7688] line-through" : "text-[#1A2C44]"
          }`}
        >
          {component.name}
        </span>
      </div>
      <span className={`rounded-[4px] px-[4px] py-[1px] text-[10px] font-[600] leading-[14px] ${pillClass}`}>
        {label}
      </span>
    </div>
  )
}
