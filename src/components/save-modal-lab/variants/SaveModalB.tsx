'use client'

import { useState } from "react"
import { ModalShell } from "./ModalShell"
import { KindGlyph } from "../KindGlyph"
import type { ChangeBuckets, Scenario, ScenarioComponent } from "../scenarioTypes"

/** Variant B — adds explicit "Components added" and "Components removed"
 *  sections so structural changes aren't silent. The bug case is now
 *  surfaced in the new-versions list (since pricing changed), and also
 *  appears under Added (since it was attached this save). */
export function SaveModalB({
  t,
  scenario,
  buckets,
}: {
  t: (k: string) => string
  scenario: Scenario
  buckets: ChangeBuckets
}) {
  const [defaultForNew, setDefaultForNew] = useState(false)

  return (
    <ModalShell
      title={`${t(scenario.isNewPlan ? "Save" : "Save new version of")} ${scenario.isNewPlan ? "" : `\u201c${scenario.planName}\u201d`}`.trim()}
      showDefaultToggle={!scenario.isNewPlan}
      isDefaultForNewSubscribers={defaultForNew}
      onToggleDefault={() => setDefaultForNew((v) => !v)}
    >
      {buckets.newVersions.length > 0 && (
        <ListSection title="New versions will also be created for:">
          {buckets.newVersions.map((c) => (
            <Row key={c.id} component={c} accent="version" />
          ))}
        </ListSection>
      )}

      {buckets.added.length > 0 && (
        <ListSection title="Components added to this plan:">
          {buckets.added.map((c) => (
            <Row key={c.id} component={c} accent="added" />
          ))}
        </ListSection>
      )}

      {buckets.removed.length > 0 && (
        <ListSection title="Components removed from this plan:">
          {buckets.removed.map((c) => (
            <Row key={c.id} component={c} accent="removed" />
          ))}
        </ListSection>
      )}

      {/* Surface non-pricing and credit-grant changes in a small footer note */}
      {(buckets.nonPricingEdits.length > 0 ||
        buckets.creditGrantChanges.length > 0 ||
        buckets.versionSwitched.length > 0) && (
        <ListSection title="Other changes:">
          {[...buckets.nonPricingEdits, ...buckets.creditGrantChanges, ...buckets.versionSwitched].map(
            (c) => (
              <Row key={c.id} component={c} accent="other" />
            )
          )}
        </ListSection>
      )}
    </ModalShell>
  )
}

function ListSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-[#EBEEF1] px-[16px] py-[12px]">
      <p className="mb-[8px] text-[12px] font-[600] leading-[16px] text-[#474E5A]">{title}</p>
      {children}
    </div>
  )
}

function Row({
  component,
  accent,
}: {
  component: ScenarioComponent
  accent: "version" | "added" | "removed" | "other"
}) {
  return (
    <div className="flex items-center justify-between py-[3px]">
      <div className="flex items-center gap-[6px]">
        {accent === "version" && (
          <span className="inline-block h-[6px] w-[6px] flex-shrink-0 rounded-full bg-[#675DFF]" aria-hidden="true" />
        )}
        <KindGlyph kind={component.kind} />
        <span
          className={`text-[12px] font-[400] leading-[16px] ${
            accent === "removed" ? "text-[#6C7688] line-through" : "text-[#1A2C44]"
          }`}
        >
          {component.name}
        </span>
      </div>
      {accent === "added" && (
        <span className="rounded-[4px] bg-[#E6F4EB] px-[4px] py-[1px] text-[10px] font-[600] leading-[14px] text-[#0C6B37]">
          {component.changeKind === "created-new" ? "New" : "Attached"}
        </span>
      )}
      {accent === "removed" && (
        <span className="rounded-[4px] bg-[#FCE8EE] px-[4px] py-[1px] text-[10px] font-[600] leading-[14px] text-[#B3093C]">
          Removed
        </span>
      )}
      {accent === "version" && (
        <span className="rounded-[4px] bg-[#EFEEFF] px-[4px] py-[1px] text-[10px] font-[600] leading-[14px] text-[#533AFD]">
          New version
        </span>
      )}
      {accent === "other" && (
        <span className="rounded-[4px] bg-[#EEF0F3] px-[4px] py-[1px] text-[10px] font-[600] leading-[14px] text-[#474E5A]">
          Updated
        </span>
      )}
    </div>
  )
}
