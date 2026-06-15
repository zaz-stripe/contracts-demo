import type { Scenario } from "./scenarioTypes"

export type ScenarioPresetId =
  | "happy-path"
  | "simple-edit"
  | "the-bug"
  | "complex-edit"
  | "reused-component-edit"
  | "mixed-changes"

export type ScenarioPreset = {
  id: ScenarioPresetId
  label: string
  description: string
  build: () => Scenario
}

export const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: "happy-path",
    label: "Happy path — new plan with 2 new components",
    description: "Brand new plan; nothing pre-existing.",
    build: () => ({
      isNewPlan: true,
      planName: "Starter pricing",
      components: [
        {
          id: "c1",
          kind: "rateCard",
          name: "API usage rate card",
          changeKind: "created-new",
          reusedInOtherPlans: false,
          otherPlanCount: 0,
          rateCount: 3,
          ratesDeleted: 0,
        },
        {
          id: "c2",
          kind: "subscriptionFee",
          name: "Monthly base fee",
          changeKind: "created-new",
          reusedInOtherPlans: false,
          otherPlanCount: 0,
          priceAfter: "$29.00 / month",
        },
      ],
    }),
  },
  {
    id: "simple-edit",
    label: "Simple edit — one license fee price changed",
    description: "Existing plan; one pricing field changed.",
    build: () => ({
      isNewPlan: false,
      planName: "Pro plan",
      components: [
        {
          id: "c1",
          kind: "subscriptionFee",
          name: "Pro base fee",
          changeKind: "edited-pricing",
          reusedInOtherPlans: false,
          otherPlanCount: 0,
          priceBefore: "$29.00 / month",
          priceAfter: "$39.00 / month",
          currentVersionDate: "2026-02-28",
        },
      ],
    }),
  },
  {
    id: "the-bug",
    label: "The bug scenario — added existing + changed price",
    description: "Existing plan; user attached an existing component then edited its price. Today, this is silently treated as a brand-new component.",
    build: () => ({
      isNewPlan: false,
      planName: "Growth plan",
      components: [
        {
          id: "c1",
          kind: "rateCard",
          name: "Standard API rates",
          changeKind: "attached-existing-edited",
          reusedInOtherPlans: true,
          otherPlanCount: 1,
          otherPlanNames: ["Starter"],
          rateCount: 3,
          ratesDeleted: 0,
          priceBefore: "$0.01 / request",
          priceAfter: "$0.008 / request",
          currentVersionDate: "2026-01-20",
        },
      ],
    }),
  },
  {
    id: "complex-edit",
    label: "Complex edit — price change, rename, delete, add",
    description: "Existing plan; one pricing change, one rename, one deletion, one addition.",
    build: () => ({
      isNewPlan: false,
      planName: "Enterprise plan",
      components: [
        {
          id: "c1",
          kind: "subscriptionFee",
          name: "Platform fee",
          changeKind: "edited-pricing",
          reusedInOtherPlans: false,
          otherPlanCount: 0,
          priceBefore: "$199.00 / month",
          priceAfter: "$249.00 / month",
          currentVersionDate: "2026-02-28",
        },
        {
          id: "c2",
          kind: "rateCard",
          name: "Enterprise overage rates",
          changeKind: "edited-non-pricing",
          reusedInOtherPlans: false,
          otherPlanCount: 0,
          rateCount: 4,
          nonPricingFieldChanged: "Display name",
          currentVersionDate: "2026-03-15",
        },
        {
          id: "c3",
          kind: "creditGrant",
          name: "Welcome credits",
          changeKind: "deleted",
          reusedInOtherPlans: false,
          otherPlanCount: 0,
        },
        {
          id: "c4",
          kind: "subscriptionFee",
          name: "Premium support",
          changeKind: "created-new",
          reusedInOtherPlans: false,
          otherPlanCount: 0,
          priceAfter: "$49.00 / month",
        },
      ],
    }),
  },
  {
    id: "reused-component-edit",
    label: "Reused component edit — price on a shared component",
    description: "Existing plan; pricing changed on a component that 3 other plans reference. Other plans won't be affected.",
    build: () => ({
      isNewPlan: false,
      planName: "Standard plan",
      components: [
        {
          id: "c1",
          kind: "rateCard",
          name: "Shared compute rates",
          changeKind: "edited-pricing",
          reusedInOtherPlans: true,
          otherPlanCount: 3,
          otherPlanNames: ["Starter", "Growth", "Scale"],
          rateCount: 5,
          ratesDeleted: 0,
          priceBefore: "$0.05 / vCPU-hr",
          priceAfter: "$0.06 / vCPU-hr",
          currentVersionDate: "2026-02-10",
        },
      ],
    }),
  },
  {
    id: "mixed-changes",
    label: "Mixed changes — rate deleted, name change, credit grant edit",
    description: "Rate card with a rate deleted and another rate's price changed; license fee renamed; credit grant amount changed.",
    build: () => ({
      isNewPlan: false,
      planName: "Bundle plan",
      components: [
        {
          id: "c1",
          kind: "rateCard",
          name: "Bundle usage rates",
          changeKind: "edited-pricing",
          reusedInOtherPlans: false,
          otherPlanCount: 0,
          rateCount: 4,
          ratesDeleted: 1,
          priceBefore: "$0.02 / unit",
          priceAfter: "$0.025 / unit",
          currentVersionDate: "2026-03-15",
        },
        {
          id: "c2",
          kind: "subscriptionFee",
          name: "Bundle base fee",
          changeKind: "edited-non-pricing",
          reusedInOtherPlans: false,
          otherPlanCount: 0,
          nonPricingFieldChanged: "Display name",
          currentVersionDate: "2026-02-28",
        },
        {
          id: "c3",
          kind: "creditGrant",
          name: "Monthly bonus credits",
          changeKind: "edited-pricing",
          reusedInOtherPlans: false,
          otherPlanCount: 0,
          priceBefore: "$50.00 / month",
          priceAfter: "$75.00 / month",
        },
      ],
    }),
  },
]

export function getPreset(id: ScenarioPresetId): ScenarioPreset {
  const preset = SCENARIO_PRESETS.find((p) => p.id === id)
  if (!preset) throw new Error(`Unknown preset: ${id}`)
  return preset
}
