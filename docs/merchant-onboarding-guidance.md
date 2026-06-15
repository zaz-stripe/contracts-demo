# Merchant Onboarding Guidance Features

## Problem Statement

Pricing plans are complex multi-part objects. Without guidance, merchants don't know where to start, what the pieces mean, or what to add next. We embed contextual, state-aware guidance directly into the editor so they always know what to do next.

---

## Feature Inventory

### 1. Get Started — Quick-start templates
**File:** `PlanGetStarted.tsx`, triggered from `PlanForm.tsx`

When the plan is completely empty, instead of showing a blank form, we present four common pricing structures as clickable cards:

| Template | Description |
|---|---|
| **Subscription** | "Flat recurring fee, billed each period" |
| **Usage-based** | "Charge per unit of metered usage" |
| **Subscription + usage** | "Base fee plus metered overage charges" |
| **Credits + usage** | "Prepaid allowance with overage billing" |

Plus a "Start from scratch" escape hatch for advanced users.

**Why it's compelling:** Eliminates the blank-canvas problem entirely. Merchants don't need to understand the object model — they pick a pricing pattern they recognise and the system scaffolds the right objects for them.

---

### 2. Add Object Popover — Descriptive menu with subtitles
**File:** `AddPlanObjectPopover.tsx`

When merchants click the "+" button, each option includes a short subtitle explaining what it is:

| Item | Subtitle |
|---|---|
| **Rate** | "Based on use" |
| **Subscription fee** | "Fixed amount" |
| **Credit grant** | "Included usage" |
| **Rate card** | "Groups rates" |

The popover also includes search, shows existing reusable components, and disables rate card creation when at the max (2).

**Why it's compelling:** Every option is self-describing. Merchants don't need to know the difference between a "rate" and a "subscription fee" upfront — the subtitle tells them instantly.

---

### 3. Ghost Preview Items — Show what you're about to add
**File:** `PricingPlanStructurePreview.tsx`

When hovering over an item in the add popover, a ghost placeholder animates into the plan preview card showing exactly where the new item will appear and what it is. Each ghost includes an info line:

| Ghost Type | Info Text |
|---|---|
| **Subscription fee** | "A fixed recurring charge billed each period" |
| **Rate card** | "Groups related rates that share a billing period" |
| **Rate** | "Charges based on metered usage" |
| **Credit grant** | "Prepaid allowance that offsets usage charges" |

When adding a credit grant to a plan that already has grants: *"New credit grant will appear in the Included section above"*

Ghosts show placeholder values ($0.00, "Billed monthly") so merchants can see the structure before committing.

**Why it's compelling:** Removes the fear of "what happens if I click this?" Merchants can preview exactly where each item lands in the plan structure and understand what it does — before they add anything.

---

### 4. Plan Overview — Category sections with empty-state hints
**File:** `PlanOverviewForm.tsx`

The plan overview organises items into three labelled categories, each with a description and an empty-state hint card (dashed border):

| Category | Description | Empty Hint |
|---|---|---|
| **Fixed charges** | "A recurring amount charged each billing period, regardless of usage" | "Most plans start with a monthly or annual fee" |
| **Usage-based charges** | "Rates define per-unit pricing tracked by meters. Rate cards group related rates." | "Track and charge for what customers use" |
| **Credits** | "Prepaid allowances that offset usage-based charges before billing" | "Optionally include prepaid usage allowances" |

**Why it's compelling:** The category descriptions teach the pricing model as merchants build. The empty-state hints are suggestive rather than prescriptive — "Most plans start with..." gently guides without forcing.

---

### 5. Contextual Tip — "Connect a meter to track usage"
**File:** `RateForm.tsx`

When editing a rate and the meter field is empty (and there's no validation error), a tip box appears:

> **Tip:** Connect a meter to track usage

**Why it's compelling:** Appears at exactly the moment it's relevant — when the merchant is configuring a rate but hasn't connected it to a meter. It teaches the meter-rate relationship in context rather than requiring upfront understanding.

---

### 6. Contextual Tip — "Add a rate to this card"
**File:** `PlanEditorPanel.tsx`

When viewing a rate card that has zero rates, a clickable tip appears:

> **Tip:** Add a rate to this card

Clicking it directly triggers rate creation inside that card.

**Why it's compelling:** Rate cards without rates are incomplete, but merchants might not realise that. The tip both explains what's needed and provides a one-click action to fix it — guidance and action in one.

---

### 7. Suggested Next Step — "What's next?"
**File:** `PlanEditorPanel.tsx`

When viewing a subscription fee or credit grant, AND the plan has no rate cards yet, a prompt appears at the bottom:

> **What's next?**
> [Add your first rate] to charge for usage-based

The "Add your first rate" text is a clickable link that opens the add object flow.

**Why it's compelling:** This is *smart* contextual guidance — it only appears when it's relevant (you have fees/credits but no rates). It understands the plan's current state and suggests the logical next step, preventing merchants from thinking they're "done" when the plan is actually incomplete.

---

### 8. Helper Text — Targeted guidance on high-confusion fields
**Files:** `RateCardForm.tsx`, `SubscriptionFeeForm.tsx`, `CreditGrantForm.tsx`, `RateForm.tsx`, `PlanDetailsForm.tsx`

Not every field needs explanation — "Price per unit" and "Currency" are self-evident. But some fields consistently trip merchants up: What's a meter? Where does this name appear? How often am I charging? We add helper text only to these high-struggle fields, keeping forms clean while catching merchants right where they'd otherwise get stuck:

| Form | Field | Helper Text |
|---|---|---|
| Rate | Meter | "Track usage by adding a meter." |
| Rate card | Display name | "Shows on the customer portal and Checkout." |
| Subscription fee | Service interval | "How often this fee is charged." |
| Credit grant | Meter applicability | "Choose which meters this credit grant applies to." |
| Plan details | Description | "Shows on your Checkout and Invoice." |
| Plan details | Lookup key | "Unique identifier in code." |

Fields like price, currency, tax settings, and metadata get no helper text — they're self-explanatory or aimed at developers who don't need hand-holding.

**Why it's compelling:** By being selective rather than exhaustive, the helper text carries more weight. Merchants notice it precisely because it *isn't* on every field — it signals "this one's worth paying attention to" without creating a wall of grey text that gets ignored.

---

### 9. Simplified Actions — Inline creation without navigation
**Files:** `RateForm.tsx`, `RateMeterForm.tsx`, `planFormUtils.tsx`

Rather than forcing merchants to leave the current form to create related objects, the editor provides inline creation flows:

| Action | Location | Trigger |
|---|---|---|
| **Create new meter** | Rate form meter selector | Footer button in dropdown — opens meter builder without leaving the rate |
| **Add new meter** | Rate meter selector | Footer "Add new" option — transitions the selector to inline creation mode |
| **Add item metadata** | Rate, Subscription fee, Credit grant forms | Inline button below metadata fields — adds a new key/value row in place |
| **Add rate metadata** | Rate form | Inline button — adds rate-level metadata row |

The meter creation flow is the standout example: when editing a rate, the meter dropdown includes a "Create new meter" footer action. Clicking it opens the meter builder directly in context, and once created, the new meter is automatically selected — all without navigating away from the rate being configured.

**Why it's compelling:** Every time a merchant has to leave their current context to create a prerequisite object, there's a risk they lose their train of thought or abandon the flow. Inline creation keeps them in the zone — they can create exactly what they need, right when they need it, and continue where they left off.

---

## The Overall Design Philosophy

These features work as a **progressive guidance system** — not a tutorial, not a wizard, but embedded intelligence throughout the editor:

1. **Start**: Templates eliminate the blank page (Get Started)
2. **Discover**: Subtitles explain what each item is (Add Popover)
3. **Preview**: Ghost items show what will happen before you commit (Ghost Preview)
4. **Learn**: Descriptions teach the pricing model as you build (Category Sections)
5. **Configure**: Tips appear when fields need attention (Meter Tip)
6. **Understand**: Helper text and examples explain every field in context (Helper Text)
7. **Create**: Inline actions let merchants build related objects without leaving the flow (Simplified Actions)
8. **Complete**: Smart prompts know what's missing and suggest next steps (What's Next, Add Rate tip)

The key insight is that all of this guidance is **contextual and state-aware** — it appears based on what the merchant has (and hasn't) done, not on a fixed script. A merchant who adds a subscription fee sees different guidance than one who adds a rate card. A plan with rates doesn't show "What's next?" This makes the editor feel intelligent rather than lecturing.
