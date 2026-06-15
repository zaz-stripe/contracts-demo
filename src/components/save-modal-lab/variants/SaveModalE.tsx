'use client'

import { useState } from "react"
import { ModalShell } from "./ModalShell"
import { KindGlyph } from "../KindGlyph"
import type { ChangeBuckets, Scenario, ScenarioComponent } from "../scenarioTypes"

/** Density modes used by the stress-test route. */
export type DensityMode = "none" | "scroll" | "collapse"

/** Stable order across sections so all rate cards appear before all
 *  subscription/license fees before all credit grants. Within a kind the
 *  caller-provided order is preserved. */
const KIND_ORDER: Record<ScenarioComponent["kind"], number> = {
  rateCard: 0,
  subscriptionFee: 1,
  creditGrant: 2,
}

function sortByKind<T extends ScenarioComponent>(items: T[]): T[] {
  return items
    .map((c, i) => ({ c, i }))
    .sort((a, b) => {
      const k = KIND_ORDER[a.c.kind] - KIND_ORDER[b.c.kind]
      return k !== 0 ? k : a.i - b.i
    })
    .map(({ c }) => c)
}

const VERSION_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
}

/** Formats an ISO date (YYYY-MM-DD) using the same locale options as the
 *  modal's name-input default, so popover dates match the title format. */
function formatVersionDate(iso?: string): string | null {
  if (!iso) return null
  const d = new Date(iso + "T00:00:00")
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString("en-US", VERSION_DATE_OPTIONS)
}

type TagKind = "new-version" | "affects-plans" | "unversioned"

/** Maps a component + section accent onto the tag it should display.
 *
 *  - "new-version" (neutral): a new component version is being created.
 *    Covers pricing edits, attached-existing-edited (the bug case),
 *    version-switched, and non-pricing edits on non-shared components.
 *  - "affects-plans" (amber): non-pricing edit on a shared component.
 *    No new version is created; the change updates the component in
 *    place and propagates to every plan that references it.
 *  - "unversioned" (amber): credit grants. Credit grants have no
 *    versioning at all - changes apply to current subscribers of this
 *    plan immediately. Tagged on creation, edits, and deletions. */
function tagFor(
  c: ScenarioComponent,
  accent: "added" | "removed" | "changed"
): TagKind | null {
  if (c.kind === "creditGrant") {
    if (accent === "added" && c.changeKind === "created-new") return "unversioned"
    if (accent === "changed") return "unversioned"
    if (accent === "removed" && c.changeKind === "deleted") return "unversioned"
    return null
  }
  if (accent !== "changed") return null
  if (
    c.changeKind === "edited-non-pricing" &&
    c.reusedInOtherPlans &&
    c.otherPlanCount > 0
  ) {
    return "affects-plans"
  }
  return "new-version"
}

/** Variant E - Recommended hybrid. Three sections: Added, Removed,
 *  Changed. Every Changed row gets a compact right-side tag describing
 *  what's happening to its component version. Hover the tag for the
 *  full explanation including affected plan names. */
export function SaveModalE({
  t,
  scenario,
  buckets,
  showRowBadges = true,
  showOtherChanges = true,
  density = "none",
  collapseAfter = 3,
}: {
  t: (k: string) => string
  scenario: Scenario
  buckets: ChangeBuckets
  /** When true (default), tags render. When false, tags are suppressed
   *  everywhere - used by the lab to demo the unannotated baseline. */
  showRowBadges?: boolean
  /** When false, hides the non-version-bump rows from the Changed section.
   *  Used by the stress-test density showdown to compare list lengths. */
  showOtherChanges?: boolean
  density?: DensityMode
  collapseAfter?: number
}) {
  const [defaultForNew, setDefaultForNew] = useState(false)

  // Matches ModalShell's defaultVersionName(): the date the modal would
  // stamp on the new version if saved now.
  const newVersionDate = new Date().toLocaleDateString("en-US", VERSION_DATE_OPTIONS)

  const addedRows = sortByKind(buckets.added)
  const removedRows = sortByKind(buckets.removed)
  const changedRows = sortByKind([
    ...buckets.newVersions,
    ...(showOtherChanges
      ? [
          ...buckets.nonPricingEdits,
          ...buckets.creditGrantChanges,
          ...buckets.versionSwitched,
        ]
      : []),
  ])

  const body = (
    <>
      {addedRows.length > 0 && (
        <ListSection title="Added">
          <CollapsibleList items={addedRows} density={density} collapseAfter={collapseAfter}>
            {(c) => (
              <Row
                key={c.id}
                component={c}
                accent="added"
                showTag={showRowBadges}
                newVersionDate={newVersionDate}
              />
            )}
          </CollapsibleList>
        </ListSection>
      )}

      {removedRows.length > 0 && (
        <ListSection title="Removed">
          <CollapsibleList items={removedRows} density={density} collapseAfter={collapseAfter}>
            {(c) => (
              <Row
                key={c.id}
                component={c}
                accent="removed"
                showTag={showRowBadges}
                newVersionDate={newVersionDate}
              />
            )}
          </CollapsibleList>
        </ListSection>
      )}

      {changedRows.length > 0 && (
        <ListSection title="Changed">
          <CollapsibleList items={changedRows} density={density} collapseAfter={collapseAfter}>
            {(c) => (
              <Row
                key={c.id}
                component={c}
                accent="changed"
                showTag={showRowBadges}
                newVersionDate={newVersionDate}
              />
            )}
          </CollapsibleList>
        </ListSection>
      )}
    </>
  )

  return (
    <ModalShell
      title={`${t(scenario.isNewPlan ? "Save" : "Save new version of")} ${scenario.isNewPlan ? "" : `\u201c${scenario.planName}\u201d`}`.trim()}
      showDefaultToggle={!scenario.isNewPlan}
      isDefaultForNewSubscribers={defaultForNew}
      onToggleDefault={() => setDefaultForNew((v) => !v)}
    >
      {density === "scroll" ? (
        <div className="max-h-[300px] overflow-y-auto">{body}</div>
      ) : (
        body
      )}
    </ModalShell>
  )
}

function ListSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="border-b border-[#EBEEF1] px-[16px] py-[12px]">
      <p className="text-[12px] font-[600] leading-[16px] text-[#474E5A]">{title}</p>
      <div className="mt-[8px]">{children}</div>
    </div>
  )
}

function CollapsibleList<T>({
  items,
  density,
  collapseAfter,
  children,
}: {
  items: T[]
  density: DensityMode
  collapseAfter: number
  children: (item: T) => React.ReactNode
}) {
  const [expanded, setExpanded] = useState(false)
  if (density !== "collapse" || items.length <= collapseAfter || expanded) {
    return (
      <>
        {items.map((item) => children(item))}
        {density === "collapse" && expanded && items.length > collapseAfter && (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="mt-[4px] text-[11px] font-[600] leading-[14px] text-[#533AFD] transition-colors hover:underline"
          >
            Show less
          </button>
        )}
      </>
    )
  }
  const visible = items.slice(0, collapseAfter)
  const hidden = items.length - collapseAfter
  return (
    <>
      {visible.map((item) => children(item))}
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="mt-[4px] text-[11px] font-[600] leading-[14px] text-[#533AFD] transition-colors hover:underline"
      >
        and {hidden} more
      </button>
    </>
  )
}

function Row({
  component,
  accent,
  showTag,
  newVersionDate,
}: {
  component: ScenarioComponent
  accent: "added" | "removed" | "changed"
  showTag: boolean
  newVersionDate: string
}) {
  const isCreditGrant = component.kind === "creditGrant"
  const tag = showTag ? tagFor(component, accent) : null

  // The "Also used in..." inline reuse line stays alive only on Added
  // rows for shared, non-credit-grant components. On Changed rows the
  // popover carries the plan list, so we skip the secondary line.
  const isShared =
    !isCreditGrant && component.reusedInOtherPlans && component.otherPlanCount > 0
  const showReuseLine = accent === "added" && isShared

  return (
    <div className="py-[3px]">
      <div className="flex items-start justify-between gap-[8px]">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-[6px]">
            <KindGlyph kind={component.kind} />
            <span className="text-[12px] font-[400] leading-[16px] text-[#1A2C44]">
              {component.name}
            </span>
          </div>
          {showReuseLine && (
            <div className="ml-[20px] mt-[2px]">
              <ReuseLine
                names={component.otherPlanNames}
                count={component.otherPlanCount}
              />
            </div>
          )}
        </div>
        {tag && (
          <Tag
            kind={tag}
            component={component}
            accent={accent}
            newVersionDate={newVersionDate}
          />
        )}
      </div>
    </div>
  )
}

/** Compact right-side tag with a CSS-hover popover for the full
 *  explanation. The wrapping span owns the hover group so the popover
 *  responds to hover anywhere on the tag (including its padding).
 *  Tags are styled `cursor-pointer` to signal interactivity, even
 *  though the popover is currently hover-only. */
function Tag({
  kind,
  component,
  accent,
  newVersionDate,
}: {
  kind: TagKind
  component: ScenarioComponent
  accent: "added" | "removed" | "changed"
  newVersionDate: string
}) {
  const label = labelFor(kind, component)
  const isAmber = kind !== "new-version"
  const tagClasses = isAmber
    ? "bg-[#FFF4E5] text-[#8C5400]"
    : "bg-[#EEF0F3] text-[#474E5A]"

  return (
    <span className="group/tag relative flex-shrink-0">
      <span
        className={`cursor-pointer rounded-[4px] px-[4px] py-[1px] text-[10px] font-[600] leading-[14px] ${tagClasses}`}
      >
        {label}
      </span>
      <Popover
        kind={kind}
        component={component}
        accent={accent}
        newVersionDate={newVersionDate}
      />
    </span>
  )
}

function labelFor(kind: TagKind, component: ScenarioComponent): string {
  if (kind === "new-version") return "New version"
  if (kind === "unversioned") return "Unversioned"
  // affects-plans
  const count = component.otherPlanCount
  const names = component.otherPlanNames
  if (count === 1 && names && names.length >= 1) {
    return `Affects ${names[0]}`
  }
  return `Affects ${count} plan${count === 1 ? "" : "s"}`
}

/** CSS-hover-only popover. No JS state, no click behavior - purely a
 *  progressive-disclosure tooltip. Anchored to the tag's right edge with
 *  enough left margin to land just outside the modal's right border, so
 *  it never covers the list it describes. */
function Popover({
  kind,
  component,
  accent,
  newVersionDate,
}: {
  kind: TagKind
  component: ScenarioComponent
  accent: "added" | "removed" | "changed"
  newVersionDate: string
}) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute left-full top-1/2 z-10 ml-[18px] w-[280px] -translate-y-1/2 rounded-[6px] border border-[#EBEEF1] bg-white px-[12px] py-[10px] text-[12px] font-[400] leading-[16px] text-[#1A2C44] opacity-0 shadow-[0_4px_12px_rgba(26,44,68,0.08)] transition-opacity duration-100 group-hover/tag:pointer-events-auto group-hover/tag:opacity-100"
    >
      <PopoverBody
        kind={kind}
        component={component}
        accent={accent}
        newVersionDate={newVersionDate}
      />
    </span>
  )
}

function PopoverBody({
  kind,
  component,
  accent,
  newVersionDate,
}: {
  kind: TagKind
  component: ScenarioComponent
  accent: "added" | "removed" | "changed"
  newVersionDate: string
}) {
  return (
    <>
      <span className="block font-[600] text-[#1A2C44]">{component.name}</span>
      <span className="mt-[4px] block text-[#474E5A]">
        <PopoverDetail
          kind={kind}
          component={component}
          accent={accent}
          newVersionDate={newVersionDate}
        />
      </span>
    </>
  )
}

function PopoverDetail({
  kind,
  component,
  accent,
  newVersionDate,
}: {
  kind: TagKind
  component: ScenarioComponent
  accent: "added" | "removed" | "changed"
  newVersionDate: string
}) {
  if (kind === "unversioned") {
    if (accent === "removed") {
      return (
        <>
          Credit grants aren{"\u2019"}t versioned. This removal takes effect
          immediately for current subscribers of this plan.
        </>
      )
    }
    if (accent === "added") {
      return (
        <>
          Credit grants aren{"\u2019"}t versioned. This grant applies immediately
          to current subscribers of this plan.
        </>
      )
    }
    return (
      <>
        Credit grants aren{"\u2019"}t versioned. This change applies immediately
        to current subscribers of this plan.
      </>
    )
  }
  if (kind === "affects-plans") {
    const fromDate = formatVersionDate(component.currentVersionDate)
    return (
      <>
        No new version {"\u2014"} this change updates the component directly.
        {fromDate && (
          <span className="mt-[6px] block">
            Current version:{" "}
            <span className="font-[600] text-[#1A2C44]">{fromDate}</span>{" "}
            (unchanged)
          </span>
        )}
        <span className="mt-[6px] block">
          Also used in{" "}
          <PlanList
            names={component.otherPlanNames}
            count={component.otherPlanCount}
            nameClass="text-[#1A2C44]"
          />{" "}
          {"\u2014"} they{"\u2019"}ll see this change too.
        </span>
      </>
    )
  }
  // new-version
  const fromDate = formatVersionDate(component.currentVersionDate)
  if (!fromDate) {
    return <>A new version of this component is being created.</>
  }
  const isShared = component.reusedInOtherPlans && component.otherPlanCount > 0
  return (
    <>
      Version:{" "}
      <span className="font-[600] text-[#1A2C44]">
        {fromDate} {"\u2192"} {newVersionDate}
      </span>
      {isShared && (
        <span className="mt-[6px] block">
          Also used in{" "}
          <PlanList
            names={component.otherPlanNames}
            count={component.otherPlanCount}
            nameClass="text-[#1A2C44]"
          />{" "}
          {"\u2014"} they keep{" "}
          <span className="font-[600] text-[#1A2C44]">{fromDate}</span>.
        </span>
      )}
    </>
  )
}

/** Renders a list of plan names with bolded entries, always leading
 *  with whatever names are available and appending "and N other plan(s)"
 *  when the count exceeds the named entries. Caller passes `nameClass`
 *  so bold names match the parent body's foreground in both the grey
 *  reuse-line and the popover-body contexts.
 *
 *  Examples:
 *  - 1 name, count 1:  Starter
 *  - 2 names, count 2: Starter and Growth
 *  - 3 names, count 3: Starter, Growth, and Scale
 *  - 1 name, count 4:  Enterprise and 3 other plans
 *  - 2 names, count 7: Enterprise, Growth, and 5 other plans
 *  - 0 names, count N: N other plan(s) (defensive fallback) */
function PlanList({
  names,
  count,
  nameClass,
}: {
  names?: string[]
  count: number
  nameClass: string
}) {
  const usable = names && names.length > 0 ? names : []
  const Name = ({ children }: { children: string }) => (
    <span className={`font-[600] ${nameClass}`}>{children}</span>
  )

  // Defensive fallback. Should not occur in well-formed scenarios.
  if (usable.length === 0) {
    return <Name>{`${count} other plan${count === 1 ? "" : "s"}`}</Name>
  }

  const remainder = Math.max(0, count - usable.length)
  const namedNodes = usable.map((n, i) => <Name key={`${i}-${n}`}>{n}</Name>)

  if (remainder === 0) {
    if (namedNodes.length === 1) return namedNodes[0]
    if (namedNodes.length === 2) {
      return (
        <>
          {namedNodes[0]} and {namedNodes[1]}
        </>
      )
    }
    // 3+ names with no remainder: Oxford-comma joining.
    const head = namedNodes.slice(0, -1)
    const tail = namedNodes[namedNodes.length - 1]
    return (
      <>
        {joinWithCommas(head)}, and {tail}
      </>
    )
  }

  const remainderNode = (
    <Name>{`${remainder} other plan${remainder === 1 ? "" : "s"}`}</Name>
  )

  if (namedNodes.length === 1) {
    return (
      <>
        {namedNodes[0]} and {remainderNode}
      </>
    )
  }
  return (
    <>
      {joinWithCommas(namedNodes)}, and {remainderNode}
    </>
  )
}

/** Joins React nodes with ", " between each pair (no trailing comma). */
function joinWithCommas(nodes: React.ReactNode[]): React.ReactNode[] {
  const out: React.ReactNode[] = []
  nodes.forEach((node, i) => {
    if (i > 0) out.push(<span key={`sep-${i}`}>, </span>)
    out.push(node)
  })
  return out
}

/** Subdued grey "Also used in..." line for shared components in the
 *  Added section. Changed rows surface plan names through the popover. */
function ReuseLine({ names, count }: { names?: string[]; count: number }) {
  return (
    <span className="text-[11px] font-[400] leading-[14px] text-[#6C7688]">
      Also used in <PlanList names={names} count={count} nameClass="text-[#474E5A]" />
    </span>
  )
}
