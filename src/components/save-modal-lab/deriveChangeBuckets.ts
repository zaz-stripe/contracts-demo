import type { ChangeBuckets, Scenario, ScenarioComponent } from "./scenarioTypes"

/** Pure helper that turns a configured Scenario into the groupings the
 *  modal variants and inline banner need. Credit grants short-circuit into
 *  their own bucket since they have no versioning system. */
export function deriveChangeBuckets(scenario: Scenario): ChangeBuckets {
  const newVersions: ScenarioComponent[] = []
  const added: ScenarioComponent[] = []
  const removed: ScenarioComponent[] = []
  const attachedUnchanged: ScenarioComponent[] = []
  const pricingEdits: ScenarioComponent[] = []
  const attachedExistingEdited: ScenarioComponent[] = []
  const nonPricingEdits: ScenarioComponent[] = []
  const versionSwitched: ScenarioComponent[] = []
  const creditGrantChanges: ScenarioComponent[] = []
  const creditGrantImmediate: ScenarioComponent[] = []
  const reusedAndPricingEdited: ScenarioComponent[] = []

  let ratesDeletedCount = 0

  for (const c of scenario.components) {
    if (c.ratesDeleted) ratesDeletedCount += c.ratesDeleted

    // Credit grants have no version system. Anything other than create/delete/attach is just "credit grant changed".
    if (c.kind === "creditGrant") {
      switch (c.changeKind) {
        case "created-new":
        case "attached-existing":
          added.push(c)
          if (c.changeKind === "attached-existing") attachedUnchanged.push(c)
          break
        case "deleted":
          removed.push(c)
          creditGrantImmediate.push(c)
          break
        default:
          creditGrantChanges.push(c)
          creditGrantImmediate.push(c)
      }
      continue
    }

    switch (c.changeKind) {
      case "created-new":
        added.push(c)
        break
      case "attached-existing":
        added.push(c)
        attachedUnchanged.push(c)
        break
      case "attached-existing-edited":
        // Only routed to newVersions: the version bump is the consequential
        // fact, and "the user just attached it" is self-evident from context.
        // Avoids double-listing in both "New versions" and "Components added".
        attachedExistingEdited.push(c)
        newVersions.push(c)
        if (c.reusedInOtherPlans && c.otherPlanCount > 0) reusedAndPricingEdited.push(c)
        break
      case "edited-pricing":
        pricingEdits.push(c)
        newVersions.push(c)
        if (c.reusedInOtherPlans && c.otherPlanCount > 0) reusedAndPricingEdited.push(c)
        break
      case "edited-non-pricing":
        nonPricingEdits.push(c)
        break
      case "version-switched":
        versionSwitched.push(c)
        break
      case "deleted":
        removed.push(c)
        break
    }
  }

  return {
    newVersions,
    added,
    removed,
    attachedUnchanged,
    pricingEdits,
    attachedExistingEdited,
    nonPricingEdits,
    versionSwitched,
    creditGrantChanges,
    creditGrantImmediate,
    ratesDeletedCount,
    reusedAndPricingEdited,
  }
}
