/** Types for the Save Modal Permutations Lab.
 *  These describe a save-flow scenario the user has configured: the plan,
 *  and what happened to each component since the last save. */

export type ComponentKind = "rateCard" | "subscriptionFee" | "creditGrant"

/** What happened to a single component when the user clicks Save. */
export type ChangeKind =
  | "created-new"               // brand new component built in this session
  | "attached-existing"         // existing component attached, unchanged
  | "attached-existing-edited"  // existing attached AND modified — THE BUG today
  | "edited-pricing"            // already in plan, pricing fields changed → version bump
  | "edited-non-pricing"        // already in plan, only non-pricing fields changed
  | "version-switched"          // user picked a different version from the dropdown
  | "deleted"                   // removed from plan

export type ScenarioComponent = {
  id: string
  kind: ComponentKind
  name: string
  changeKind: ChangeKind
  reusedInOtherPlans: boolean
  /** Only meaningful when reusedInOtherPlans is true. */
  otherPlanCount: number
  /** Names of the other plans referencing this component. Used by Option E
   *  for the named-plan reuse line ("Also used in Starter and Growth").
   *  When omitted or shorter than otherPlanCount, the count branch renders
   *  instead. */
  otherPlanNames?: string[]
  /** Rate-card only. */
  rateCount?: number
  ratesDeleted?: number
  /** Optional before/after used by the most detail-rich variant. */
  priceBefore?: string
  priceAfter?: string
  /** Free-text label used by variants that show non-pricing edits. */
  nonPricingFieldChanged?: string
  /** When the component's currently-attached version was created.
   *  ISO date (YYYY-MM-DD); the renderer formats it. Used by Option E's
   *  popovers to show the "Mar 15, 2026 -> Apr 29, 2026" transition.
   *  Optional so legacy fixtures keep compiling and credit grants
   *  (which aren't versioned) can omit it. */
  currentVersionDate?: string
}

export type Scenario = {
  isNewPlan: boolean
  planName: string
  components: ScenarioComponent[]
}

/** Pre-computed groupings consumed by every variant. */
export type ChangeBuckets = {
  /** Pricing edits that bump the component version (the existing modal's "new versions" list). */
  newVersions: ScenarioComponent[]
  /** Components added to the plan in this save (new + attached existing). */
  added: ScenarioComponent[]
  /** Components removed from the plan in this save. */
  removed: ScenarioComponent[]
  /** Existing components attached without modification. */
  attachedUnchanged: ScenarioComponent[]
  /** Already-in-plan components whose pricing fields changed (subset of newVersions, excludes the bug case). */
  pricingEdits: ScenarioComponent[]
  /** The bug case: existing component attached AND price changed. */
  attachedExistingEdited: ScenarioComponent[]
  /** Non-version-bumping edits. */
  nonPricingEdits: ScenarioComponent[]
  /** Version manually switched via dropdown. */
  versionSwitched: ScenarioComponent[]
  /** Credit-grant edits (no versioning system at all). */
  creditGrantChanges: ScenarioComponent[]
  /** Credit grants that change immediately for all subscribers — edits AND deletions.
   *  Used by Option E's warning treatment in the stress-test route. */
  creditGrantImmediate: ScenarioComponent[]
  /** Total count of rates deleted across all rate cards. */
  ratesDeletedCount: number
  /** Components reused across multiple plans that were also pricing-edited. */
  reusedAndPricingEdited: ScenarioComponent[]
}
