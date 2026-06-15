'use client'

import { useState } from "react"
import { ModalShell } from "./ModalShell"
import { KindGlyph } from "../KindGlyph"
import type { ChangeBuckets, Scenario, ScenarioComponent } from "../scenarioTypes"

/** Variant D — most information-rich. Shows before → after for pricing
 *  changes, calls out reuse warnings inline with an info icon, lists
 *  non-pricing edits in their own subdued section, and surfaces total
 *  rates-deleted and deletion counts. Risk: density. */
export function SaveModalD({
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
      {/* Pricing changes — version-bumping */}
      {buckets.newVersions.length > 0 && (
        <Section title="Pricing changes" subtitle="A new version will be created for each.">
          {buckets.newVersions.map((c) => (
            <PricingRow key={c.id} component={c} />
          ))}
          {buckets.ratesDeletedCount > 0 && (
            <p className="mt-[6px] text-[11px] font-[400] leading-[14px] text-[#6C7688]">
              {buckets.ratesDeletedCount} rate{buckets.ratesDeletedCount === 1 ? "" : "s"} removed across rate cards.
            </p>
          )}
        </Section>
      )}

      {/* Credit grant changes */}
      {buckets.creditGrantChanges.length > 0 && (
        <Section
          title="Credit grant changes"
          subtitle="Credit grants don't have versions — these apply immediately to all subscribers on this plan."
        >
          {buckets.creditGrantChanges.map((c) => (
            <PricingRow key={c.id} component={c} creditGrant />
          ))}
        </Section>
      )}

      {/* Structural — added */}
      {buckets.added.length > 0 && (
        <Section title="Components added">
          {buckets.added.map((c) => (
            <CompactRow key={c.id} component={c} variant="added" />
          ))}
        </Section>
      )}

      {/* Structural — removed */}
      {buckets.removed.length > 0 && (
        <Section title={`Components removed (${buckets.removed.length})`}>
          {buckets.removed.map((c) => (
            <CompactRow key={c.id} component={c} variant="removed" />
          ))}
        </Section>
      )}

      {/* Other (non-version-bumping) changes */}
      {(buckets.nonPricingEdits.length > 0 || buckets.versionSwitched.length > 0) && (
        <Section title="Other changes" subtitle="These don't create a new component version.">
          {buckets.nonPricingEdits.map((c) => (
            <NonPricingRow key={c.id} component={c} kind="non-pricing" />
          ))}
          {buckets.versionSwitched.map((c) => (
            <NonPricingRow key={c.id} component={c} kind="version-switched" />
          ))}
        </Section>
      )}
    </ModalShell>
  )
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="border-b border-[#EBEEF1] px-[16px] py-[12px]">
      <p className="text-[12px] font-[600] leading-[16px] text-[#474E5A]">{title}</p>
      {subtitle && (
        <p className="mb-[6px] mt-[2px] text-[11px] font-[400] leading-[14px] text-[#6C7688]">
          {subtitle}
        </p>
      )}
      <div className={subtitle ? undefined : "mt-[6px]"}>{children}</div>
    </div>
  )
}

function PricingRow({
  component,
  creditGrant = false,
}: {
  component: ScenarioComponent
  creditGrant?: boolean
}) {
  return (
    <div className="mb-[6px] last:mb-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[6px]">
          {!creditGrant && (
            <span
              className="inline-block h-[6px] w-[6px] flex-shrink-0 rounded-full bg-[#675DFF]"
              aria-hidden="true"
            />
          )}
          <KindGlyph kind={component.kind} />
          <span className="text-[12px] font-[500] leading-[16px] text-[#1A2C44]">
            {component.name}
          </span>
        </div>
        {creditGrant ? (
          <span className="rounded-[4px] bg-[#FFF4E5] px-[4px] py-[1px] text-[10px] font-[600] leading-[14px] text-[#8C5400]">
            No version
          </span>
        ) : (
          <span className="rounded-[4px] bg-[#EFEEFF] px-[4px] py-[1px] text-[10px] font-[600] leading-[14px] text-[#533AFD]">
            New version
          </span>
        )}
      </div>

      {/* before → after */}
      {(component.priceBefore || component.priceAfter) && (
        <div className="ml-[20px] mt-[2px] flex items-center gap-[6px] text-[11px] font-[400] leading-[14px] text-[#474E5A]">
          {component.priceBefore && (
            <span className="text-[#6C7688] line-through">{component.priceBefore}</span>
          )}
          {component.priceBefore && component.priceAfter && (
            <span aria-hidden="true" className="text-[#6C7688]">
              →
            </span>
          )}
          {component.priceAfter && <span className="text-[#1A2C44]">{component.priceAfter}</span>}
        </div>
      )}

      {/* rate-card detail */}
      {component.kind === "rateCard" && (component.ratesDeleted ?? 0) > 0 && (
        <p className="ml-[20px] mt-[2px] text-[11px] font-[400] leading-[14px] text-[#B3093C]">
          {component.ratesDeleted} rate{component.ratesDeleted === 1 ? "" : "s"} removed
        </p>
      )}

      {/* reuse warning */}
      {component.reusedInOtherPlans && component.otherPlanCount > 0 && (
        <div className="ml-[20px] mt-[4px] flex items-start gap-[4px] rounded-[4px] bg-[#EAF4FE] px-[6px] py-[4px]">
          <InfoIcon />
          <span className="text-[11px] font-[400] leading-[14px] text-[#0073E6]">
            Also used in {component.otherPlanCount} other plan
            {component.otherPlanCount === 1 ? "" : "s"} — they won&apos;t be affected.
          </span>
        </div>
      )}
    </div>
  )
}

function CompactRow({
  component,
  variant,
}: {
  component: ScenarioComponent
  variant: "added" | "removed"
}) {
  return (
    <div className="flex items-center justify-between py-[2px]">
      <div className="flex items-center gap-[6px]">
        <KindGlyph kind={component.kind} />
        <span
          className={`text-[12px] font-[400] leading-[16px] ${
            variant === "removed" ? "text-[#6C7688] line-through" : "text-[#1A2C44]"
          }`}
        >
          {component.name}
        </span>
      </div>
      {variant === "added" ? (
        <span className="rounded-[4px] bg-[#E6F4EB] px-[4px] py-[1px] text-[10px] font-[600] leading-[14px] text-[#0C6B37]">
          {component.changeKind === "created-new" ? "New" : "Attached"}
        </span>
      ) : (
        <span className="rounded-[4px] bg-[#FCE8EE] px-[4px] py-[1px] text-[10px] font-[600] leading-[14px] text-[#B3093C]">
          Removed
        </span>
      )}
    </div>
  )
}

function NonPricingRow({
  component,
  kind,
}: {
  component: ScenarioComponent
  kind: "non-pricing" | "version-switched"
}) {
  return (
    <div className="py-[2px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[6px]">
          <KindGlyph kind={component.kind} color="#6C7688" />
          <span className="text-[12px] font-[400] leading-[16px] text-[#474E5A]">
            {component.name}
          </span>
        </div>
        <span className="rounded-[4px] bg-[#EEF0F3] px-[4px] py-[1px] text-[10px] font-[600] leading-[14px] text-[#474E5A]">
          {kind === "version-switched" ? "Version switched" : "Updated"}
        </span>
      </div>
      {kind === "non-pricing" && component.nonPricingFieldChanged && (
        <p className="ml-[20px] text-[11px] font-[400] leading-[14px] text-[#6C7688]">
          {component.nonPricingFieldChanged} changed
        </p>
      )}
    </div>
  )
}

function InfoIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mt-[1px] flex-shrink-0"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 6C12 9.31371 9.31371 12 6 12C2.68629 12 0 9.31371 0 6C0 2.68629 2.68629 0 6 0C9.31371 0 12 2.68629 12 6ZM6 5C6.41421 5 6.75 5.33579 6.75 5.75V8.25C6.75 8.66421 6.41421 9 6 9C5.58579 9 5.25 8.66421 5.25 8.25V5.75C5.25 5.33579 5.58579 5 6 5ZM6 4.25C6.41421 4.25 6.75 3.91421 6.75 3.5C6.75 3.08579 6.41421 2.75 6 2.75C5.58579 2.75 5.25 3.08579 5.25 3.5C5.25 3.91421 5.58579 4.25 6 4.25Z"
        fill="#0073E6"
      />
    </svg>
  )
}
