/** Types for the reusable component system.
 *  Components are rate cards, subscription fees, or credit grants that can be
 *  shared across plans, carry version history, and track draft state. */

export type ComponentKind = "rateCard" | "subscriptionFee" | "creditGrant"

/** A version snapshot for a component */
export type ComponentVersion = {
  id: string
  label: string       // e.g. "Mar 5, 2024, 3:00 PM"
  createdAt: number   // epoch millis
  isLatest: boolean
}

/** A component in the registry (simulated or session-created) */
export type ComponentRecord = {
  componentId: string
  kind: ComponentKind
  name: string
  /** Summary for listing — e.g. "5 rates" for rate cards, "$29.00" for subscription fees */
  summary: string
  versions: ComponentVersion[]
  activeVersionId: string
}

/** Stored on a plan object to link it back to a component */
export type ComponentLink = {
  componentId: string
  versionId: string
}

/** Tracks whether a linked component has been edited */
export type ComponentDraftState = {
  componentId: string
  /** JSON snapshot at time of link — used for dirty comparison */
  baselineSnapshot: string
  isDirty: boolean
}

/** Entry in the save-flow summary */
export type ComponentSaveSummary = {
  componentId: string
  name: string
  kind: ComponentKind
  action: "create" | "update"
}
