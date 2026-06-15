import type { Scenario, ScenarioComponent } from "./scenarioTypes"

/** Stress-test scenarios used by the /save-modal-lab/stress-test route.
 *  These exercise high-volume cases for Option E: many version bumps,
 *  many additions, bulk deletions, the "everything" worst case, stacked
 *  reuse warnings, and the duplicate-across-sections issue. */
export type StressScenarioPresetId =
  | "many-version-bumps"
  | "many-additions"
  | "bulk-deletion"
  | "worst-case"
  | "multiple-reuse-warnings"
  | "duplicate-across-sections"
  | "credit-grant-change"
  | "multiple-credit-grant-changes"

export type StressScenarioPreset = {
  id: StressScenarioPresetId
  label: string
  description: string
  build: () => Scenario
}

const id = (() => {
  let n = 0
  return () => `s${++n}`
})()

function rateCard(
  name: string,
  changeKind: ScenarioComponent["changeKind"],
  opts: Partial<ScenarioComponent> = {}
): ScenarioComponent {
  return {
    id: id(),
    kind: "rateCard",
    name,
    changeKind,
    reusedInOtherPlans: false,
    otherPlanCount: 0,
    rateCount: 3,
    ratesDeleted: 0,
    currentVersionDate: "2026-03-15",
    ...opts,
  }
}

function licenseFee(
  name: string,
  changeKind: ScenarioComponent["changeKind"],
  opts: Partial<ScenarioComponent> = {}
): ScenarioComponent {
  return {
    id: id(),
    kind: "subscriptionFee",
    name,
    changeKind,
    reusedInOtherPlans: false,
    otherPlanCount: 0,
    currentVersionDate: "2026-02-28",
    ...opts,
  }
}

function creditGrant(
  name: string,
  changeKind: ScenarioComponent["changeKind"],
  opts: Partial<ScenarioComponent> = {}
): ScenarioComponent {
  return {
    id: id(),
    kind: "creditGrant",
    name,
    changeKind,
    reusedInOtherPlans: false,
    otherPlanCount: 0,
    ...opts,
  }
}

export const STRESS_SCENARIOS: StressScenarioPreset[] = [
  {
    id: "many-version-bumps",
    label: "Many version bumps",
    description:
      "Existing plan; 7 components all with pricing changes. 2 of them are reused in other plans.",
    build: () => ({
      isNewPlan: false,
      planName: "Volume plan",
      components: [
        rateCard("API rate card 1", "edited-pricing"),
        rateCard("API rate card 2", "edited-pricing"),
        rateCard("API rate card 3", "edited-pricing", {
          reusedInOtherPlans: true,
          otherPlanCount: 2,
          otherPlanNames: ["Starter", "Growth"],
        }),
        rateCard("API rate card 4", "edited-pricing"),
        rateCard("API rate card 5", "edited-pricing", {
          reusedInOtherPlans: true,
          otherPlanCount: 5,
          otherPlanNames: ["Enterprise", "Growth"],
        }),
        rateCard("API rate card 6", "edited-pricing"),
        licenseFee("Platform fee", "edited-pricing"),
      ],
    }),
  },
  {
    id: "many-additions",
    label: "Many additions",
    description:
      "Existing plan; 5 existing components attached unchanged plus 1 license fee with a pricing change.",
    build: () => ({
      isNewPlan: false,
      planName: "Add-on plan",
      components: [
        rateCard("Compute rates", "attached-existing"),
        rateCard("Storage rates", "attached-existing"),
        rateCard("Network rates", "attached-existing"),
        licenseFee("Support tier", "attached-existing"),
        licenseFee("Premium add-on", "attached-existing"),
        licenseFee("Base fee", "edited-pricing"),
      ],
    }),
  },
  {
    id: "bulk-deletion",
    label: "Bulk deletion",
    description:
      "Existing plan; 5 components removed plus 1 remaining rate card with a pricing change.",
    build: () => ({
      isNewPlan: false,
      planName: "Slimmed plan",
      components: [
        rateCard("Old usage rates", "deleted"),
        rateCard("Legacy rates", "deleted"),
        licenseFee("Old base fee", "deleted"),
        licenseFee("Deprecated add-on", "deleted"),
        creditGrant("Promo credits", "deleted"),
        rateCard("Current rates", "edited-pricing"),
      ],
    }),
  },
  {
    id: "worst-case",
    label: "Worst case — everything",
    description:
      "22 items across 5 sections: 5 version bumps (2 reused), 4 added, 4 removed, 4 credit-grant changes (immediate), 4 non-pricing changes. Big enough that collapse-after-3 actually hides rows in every section.",
    build: () => ({
      isNewPlan: false,
      planName: "Mega plan",
      components: [
        rateCard("Core compute", "edited-pricing", {
          reusedInOtherPlans: true,
          otherPlanCount: 3,
          otherPlanNames: ["Starter", "Growth", "Scale"],
        }),
        rateCard("Core storage", "edited-pricing"),
        licenseFee("Core platform fee", "edited-pricing", {
          reusedInOtherPlans: true,
          otherPlanCount: 7,
          otherPlanNames: ["Enterprise", "Scale"],
        }),
        rateCard("Network egress", "edited-pricing"),
        licenseFee("Premium support add-on", "edited-pricing"),
        rateCard("New observability rates", "created-new"),
        licenseFee("Premium support", "created-new"),
        rateCard("Imported partner rates", "attached-existing"),
        licenseFee("Imported support fee", "attached-existing"),
        rateCard("Old vCPU rates", "deleted"),
        rateCard("Legacy bandwidth rates", "deleted"),
        licenseFee("Old base fee", "deleted"),
        licenseFee("Sunset add-on", "deleted"),
        creditGrant("Trial credits", "deleted"),
        creditGrant("Welcome credits", "edited-pricing", {
          priceBefore: "$25.00 / month",
          priceAfter: "$15.00 / month",
        }),
        creditGrant("Loyalty credits", "edited-pricing", {
          priceBefore: "$10.00 / month",
          priceAfter: "$20.00 / month",
        }),
        creditGrant("Power-user credits", "edited-pricing", {
          priceBefore: "$50.00 / month",
          priceAfter: "$60.00 / month",
        }),
        creditGrant("Referral credits", "edited-pricing", {
          priceBefore: "$5.00 / month",
          priceAfter: "$7.00 / month",
        }),
        rateCard("Renamed rate card", "edited-non-pricing", {
          nonPricingFieldChanged: "Display name",
          reusedInOtherPlans: true,
          otherPlanCount: 2,
          otherPlanNames: ["Starter", "Growth"],
        }),
        licenseFee("Updated metadata fee", "edited-non-pricing", {
          nonPricingFieldChanged: "Metadata",
          reusedInOtherPlans: true,
          otherPlanCount: 4,
          otherPlanNames: ["Starter", "Growth"],
        }),
        rateCard("Tagged rate card", "edited-non-pricing", {
          nonPricingFieldChanged: "Tags",
        }),
        licenseFee("Service-window fee", "edited-non-pricing", {
          nonPricingFieldChanged: "Service interval",
        }),
      ],
    }),
  },
  {
    id: "multiple-reuse-warnings",
    label: "Multiple reuse warnings",
    description:
      "Existing plan; 3 rate cards all with pricing changes, all reused in other plans (2, 4, and 8). Tests stacked blue banners.",
    build: () => ({
      isNewPlan: false,
      planName: "Shared core plan",
      components: [
        rateCard("Shared rate card A", "edited-pricing", {
          reusedInOtherPlans: true,
          otherPlanCount: 2,
          otherPlanNames: ["Starter", "Growth"],
        }),
        rateCard("Shared rate card B", "edited-pricing", {
          reusedInOtherPlans: true,
          otherPlanCount: 4,
          otherPlanNames: ["Starter", "Growth"],
        }),
        rateCard("Shared rate card C", "edited-pricing", {
          reusedInOtherPlans: true,
          otherPlanCount: 8,
          otherPlanNames: ["Enterprise", "Growth"],
        }),
      ],
    }),
  },
  {
    id: "duplicate-across-sections",
    label: "Duplicate across sections",
    description:
      "2 existing components attached AND modified (both reused, get version bumps), plus 1 unchanged addition. Tests the double-listing problem at scale.",
    build: () => ({
      isNewPlan: false,
      planName: "Re-bundled plan",
      components: [
        rateCard("Borrowed compute rates", "attached-existing-edited", {
          reusedInOtherPlans: true,
          otherPlanCount: 3,
          otherPlanNames: ["Starter", "Growth", "Scale"],
        }),
        licenseFee("Borrowed base fee", "attached-existing-edited", {
          reusedInOtherPlans: true,
          otherPlanCount: 5,
          otherPlanNames: ["Starter", "Growth"],
        }),
        rateCard("Off-the-shelf rates", "attached-existing"),
      ],
    }),
  },
  {
    id: "credit-grant-change",
    label: "Credit grant change",
    description:
      "Existing plan; one credit grant amount changed ($50/mo → $75/mo) plus one rate card pricing change. The credit grant change is the dangerous one — it affects everyone immediately.",
    build: () => ({
      isNewPlan: false,
      planName: "Standard plan",
      components: [
        creditGrant("Monthly bonus credits", "edited-pricing", {
          priceBefore: "$50.00 / month",
          priceAfter: "$75.00 / month",
        }),
        rateCard("Standard usage rates", "edited-pricing", {
          priceBefore: "$0.02 / unit",
          priceAfter: "$0.025 / unit",
        }),
      ],
    }),
  },
  {
    id: "multiple-credit-grant-changes",
    label: "Multiple credit grant changes",
    description:
      "Existing plan; 2 credit grants edited (different amounts) plus 1 license fee pricing change. Tests stacking inside the warning section.",
    build: () => ({
      isNewPlan: false,
      planName: "Bonus credits plan",
      components: [
        creditGrant("Onboarding credits", "edited-pricing", {
          priceBefore: "$25.00 / month",
          priceAfter: "$40.00 / month",
        }),
        creditGrant("Loyalty credits", "edited-pricing", {
          priceBefore: "$10.00 / month",
          priceAfter: "$15.00 / month",
        }),
        licenseFee("Base fee", "edited-pricing", {
          priceBefore: "$29.00 / month",
          priceAfter: "$35.00 / month",
        }),
      ],
    }),
  },
]

export function getStressPreset(presetId: StressScenarioPresetId): StressScenarioPreset {
  const p = STRESS_SCENARIOS.find((x) => x.id === presetId)
  if (!p) throw new Error(`Unknown stress preset: ${presetId}`)
  return p
}
