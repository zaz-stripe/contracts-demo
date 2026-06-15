'use client'

import { useState } from "react"
import { ModalShell } from "./ModalShell"
import { KindGlyph } from "../KindGlyph"
import type { ChangeBuckets, Scenario } from "../scenarioTypes"

/** Variant A — today's behavior. Lists only components whose pricing
 *  fields changed AND were already in the plan ("new-version-cut"). The
 *  bug: components attached as existing then edited are silently treated
 *  as new components, so they don't show up here. Deletions, non-pricing
 *  edits, credit-grant edits, and structural additions are all silent. */
export function SaveModalA({
  t,
  scenario,
  buckets,
}: {
  t: (k: string) => string
  scenario: Scenario
  buckets: ChangeBuckets
}) {
  const [defaultForNew, setDefaultForNew] = useState(false)

  // Reproduce today's logic: only `edited-pricing` shows up. The
  // `attached-existing-edited` case is silently treated as a new component.
  const newVersionRows = buckets.pricingEdits

  return (
    <ModalShell
      title={`${t(scenario.isNewPlan ? "Save" : "Save new version of")} ${scenario.isNewPlan ? "" : `\u201c${scenario.planName}\u201d`}`.trim()}
      showDefaultToggle={!scenario.isNewPlan}
      isDefaultForNewSubscribers={defaultForNew}
      onToggleDefault={() => setDefaultForNew((v) => !v)}
    >
      {newVersionRows.length > 0 && (
        <div className="border-b border-[#EBEEF1] px-[16px] py-[12px]">
          <p className="mb-[8px] text-[12px] font-[600] leading-[16px] text-[#474E5A]">
            New versions will also be created for:
          </p>
          {newVersionRows.map((c) => (
            <div key={c.id} className="flex items-center justify-between py-[3px]">
              <div className="flex items-center gap-[6px]">
                <KindGlyph kind={c.kind} />
                <span className="text-[12px] font-[400] leading-[16px] text-[#1A2C44]">{c.name}</span>
              </div>
              <span className="rounded-[4px] bg-[#EEF0F3] px-[4px] py-[1px] text-[10px] font-[600] leading-[14px] text-[#474E5A]">
                Updated
              </span>
            </div>
          ))}
        </div>
      )}
    </ModalShell>
  )
}
