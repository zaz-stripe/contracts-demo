# Local Features Built (Not Yet Committed)

This document summarizes all features and changes built locally that differ from `origin/main`.

**Files Changed:** 25 modified, 5 new files
**Lines Changed:** +2,429 / -1,074

---

## New Components & Files

### 1. Coachmark System (New Directory)
**Location:** `src/components/product-catalog/Coachmark/`

A guided tour/onboarding system for the pricing plan editor:
- `CoachmarkProvider.tsx` - React context for tour state management
- `CoachmarkOverlay.tsx` - Popover overlay with title, description, navigation
- `CoachmarkPulse.tsx` - Pulsing indicator dots on target elements
- `index.ts` - Barrel exports

**Features:**
- Multi-step guided tours
- Arrow pointers with borders (positioned based on alignment)
- Keyboard navigation (arrows, Escape)
- Pulse indicators grow larger when selected
- Configurable positioning (top/bottom/left/right) and alignment

### 2. Receipt Preview Components
**Location:** `src/components/product-catalog/`

- `ReceiptCard.tsx` (421 lines) - Individual pricing plan receipt/invoice preview
- `MultiReceiptPreview.tsx` (148 lines) - Side-by-side comparison of multiple plans
- `hooks/useReceiptCalculations.ts` (126 lines) - Pricing calculation logic

**Features:**
- Real-time pricing calculations based on usage inputs
- Multi-plan comparison view
- Responsive layout (shrink to 280px min, then stack vertically)
- Stable card ordering when switching between plans

### 3. Example Pricing Plan
**Location:** `src/lib/example-pricing-plan.ts`

Pre-configured example plan with:
- Tiered pricing (GPT-4 and Claude API calls)
- Credit grants
- Subscription fees
- Coachmark step definitions for the guided tour

---

## Feature Changes by Category

### A. Multiple Pricing Plans Support

**Files:** `PlanSidebarNav.tsx`, `ProductCatalogPage.tsx`, `MultiReceiptPreview.tsx`

- Support for creating and managing multiple pricing plans
- Sidebar shows all plans in a tree structure
- Click to switch between plans
- "Add plan" button to create new plans inline
- Plans maintain stable order in preview (no swapping when switching)
- Other plans stay expanded by default when clicking between them

### B. Manual Save Mode (No Auto-Save)

**Files:** `hooks/useProductCatalogStorage.ts`, `ProductCatalogPage.tsx`

- Added `manualSaveOnly` option to storage hook
- Drafts are NOT auto-saved on every change
- Explicit `save()` function must be called
- Only "Save Draft" and "Create" buttons persist changes
- Prevents accidental data loss when exiting without saving
- Delete operations still persist immediately

### C. Context Menu Enhancements

**Files:** `ContextMenu.tsx`, `ProductCatalogIcons.tsx`

Added new context menu actions:
- **Duplicate** - Copy an item
- **Copy settings** - Copy configuration
- **Paste settings** - Paste copied configuration

New icons: `DuplicateIcon`, `CopyIcon`, `PasteIcon`

### D. Input Improvements

**Files:** `TieredPricingEditor.tsx`

- **Decimal input support** - Can now enter values like "2.50" (trailing decimals preserved while typing)
- **Proper deletion** - Can delete entire values from price inputs without issues

### E. Iconography & Design Updates

**Files:** `iconography.tsx`, `ProductCatalogIcons.tsx`

- Updated color scheme to match Figma design
- Changed mode from "icons"/"letters" to "color"/"no-color"
- New color palette using Info/25, Attention/25, Success/25, Critical/25 backgrounds
- Updated icon colors for better contrast
- Exported `GLYPH_CONFIG_BY_KIND` and `normalizeKind` for external use

### F. Sidebar Navigation Improvements

**Files:** `PlanSidebarNav.tsx`

- Multi-select support with shift-click (`selectedPlanNodes`, `handleNodeSelect`)
- `data-coachmark="sidebar"` attribute for tour targeting
- Frosted glass effect: `bg-white/[0.94] backdrop-blur-[6px]`
- Helper functions: `isNodeSelected()`, `onNodeClick()`
- Separate expansion state for current plan vs other plans

### G. Object Map View Enhancements

**Files:** `ObjectMapView/` directory (multiple files)

- `NodeCard.tsx` - Enhanced node cards
- `ObjectMapBase.tsx` - Base component updates
- `PlanObjectMapView.tsx` - Plan-specific view (~327 lines changed)
- `objectMapTypes.ts` - New type definitions
- `objectMapUtils.ts` - New utility functions

### H. Modal & Form Improvements

**Files:** `PricingPlanModalBody.tsx`, `PricingPlanModalHeader.tsx`, `PricingPlanModalOverlay.tsx`, `modalOverlayProps.ts`

- Coachmark integration in modal overlay
- Pass coachmark props through modal layers
- Header updates for tour support

### I. Preview Area Refactor

**Files:** `PlanPreviewArea.tsx`

- Significant refactor (~418 lines changed, likely simplified)
- Now uses `MultiReceiptPreview` component
- Removed inline receipt rendering logic

### J. CSS Updates

**Files:** `globals.css`

- Added `subtle-pulse` animation for coachmarks
- Additional utility styles

---

## Bug Fixes Included

1. **No blue ring on selected preview** - Removed selection indicator from receipt cards
2. **Decimal input** - Fixed "2." becoming "2" while typing
3. **Input deletion** - Fixed inability to clear price fields completely
4. **Nav collapse** - Plans stay expanded when switching between them
5. **Preview card swapping** - Cards maintain stable positions
6. **Responsive stacking** - Cards shrink to 280px then stack vertically
7. **Rates in P2 preview** - Non-current plans now show their rates correctly
8. **Auto-save disabled** - Drafts only save on explicit button click
9. **Fresh state for new plans** - Form properly resets all nested state
10. **Coachmark styling** - Arrow with border, selected pulse larger, proper positioning

---

## Files Summary

### New Files (5)
```
src/components/product-catalog/Coachmark/CoachmarkOverlay.tsx
src/components/product-catalog/Coachmark/CoachmarkProvider.tsx
src/components/product-catalog/Coachmark/CoachmarkPulse.tsx
src/components/product-catalog/Coachmark/index.ts
src/components/product-catalog/MultiReceiptPreview.tsx
src/components/product-catalog/ReceiptCard.tsx
src/components/product-catalog/hooks/useReceiptCalculations.ts
src/lib/example-pricing-plan.ts
```

### Modified Files (25)
```
src/app/globals.css
src/components/ProductCatalogIcons.tsx
src/components/ProductCatalogPage.tsx
src/components/TieredPricingEditor.tsx
src/components/product-catalog/AddProductPopover.tsx
src/components/product-catalog/ContextMenu.tsx
src/components/product-catalog/ObjectMapView/NodeCard.tsx
src/components/product-catalog/ObjectMapView/ObjectMapBase.tsx
src/components/product-catalog/ObjectMapView/PlanObjectMapView.tsx
src/components/product-catalog/ObjectMapView/objectMapTypes.ts
src/components/product-catalog/ObjectMapView/objectMapUtils.ts
src/components/product-catalog/PlanEditorPanel.tsx
src/components/product-catalog/PlanPreviewArea.tsx
src/components/product-catalog/PlanSidebarNav.tsx
src/components/product-catalog/PricingPlanModalBody.tsx
src/components/product-catalog/PricingPlanModalHeader.tsx
src/components/product-catalog/PricingPlanModalOverlay.tsx
src/components/product-catalog/ProductCatalogLayout.tsx
src/components/product-catalog/formPanelSide.tsx
src/components/product-catalog/hooks/useAnchoredPopover.ts
src/components/product-catalog/hooks/useProductCatalogStorage.ts
src/components/product-catalog/hooks/useSyncBoolRef.ts
src/components/product-catalog/iconography.tsx
src/components/product-catalog/modalOverlayProps.ts
src/components/product-catalog/productCatalogPage.types.ts
```

---

## Reset Instructions

To reset and start fresh:
```bash
git checkout -- .
git clean -fd
```

Then systematically re-implement features from this document.
