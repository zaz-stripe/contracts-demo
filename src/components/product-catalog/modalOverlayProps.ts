import type { ComponentProps, Dispatch, PointerEvent as ReactPointerEvent, ReactNode, RefObject, SetStateAction } from "react"

import type {
  AssistantAction,
  AssistantApplyResult,
  AssistantPreviewResult,
  AssistantContext,
  AssistantReference,
} from "@/components/ProductAssistantPanel"
import { PricingPlanModalOverlay } from "@/components/product-catalog/PricingPlanModalOverlay"
import { ProductModalOverlay } from "@/components/product-catalog/ProductModalOverlay"
import type {
  PlanNamedItem,
  PlanNode,
  PlanRate,
  PlanRateCard,
  PlanVersion,
  PriceSummary,
  PricingPlanDraft,
  PricingPlanRow,
} from "@/components/product-catalog/productCatalogPage.types"

type TFn = (key: string) => string
type PlanUsageEntry = { id: number; name: string; total: number }

export function getProductModalOverlayProps(args: {
  t: TFn
  isOpen: boolean
  editingProductId: number | null
  status: "draft" | "live"
  setIsOpen: (next: boolean) => void
  setEditingProductId: (next: number | null) => void

  isAssistantOpen: boolean
  setIsAssistantOpen: (updater: (prev: boolean) => boolean) => void
  onSaveDraft: () => void
  onSubmit: () => void

  containerRef: RefObject<HTMLDivElement | null>

  activeObjectForm: "product" | "meter" | "price"
  setActiveObjectForm: (next: "product" | "meter" | "price") => void
  setIsObjectActionsOpen: (next: boolean | ((prev: boolean) => boolean)) => void

  meter: string
  setMeterName: (updater: (prev: string) => string) => void

  productName: string
  productDescription: string
  productLookupKey: string
  collapsedPrices: PriceSummary[]
  priceNamesById: Record<number, string>
  activeTreePriceId: number | null
  priceDraftName: string
  onSelectPriceFromTree: (priceId: number) => void
  onAddPriceFromNav: () => void

  parseNumberValue: (value: string) => number
  formatCurrencyValue: (amount: number, currencyCode: string, minimumFractionDigits?: number) => string

  pricingCurrencies: { id: number; code: string }[]
  currencyAmounts: Record<number, string>

  hasObjectActions: boolean
  isObjectActionsOpen: boolean
  objectActionsButtonRef: RefObject<HTMLButtonElement | null>
  objectActionsMenuRef: RefObject<HTMLDivElement | null>
  onDeleteProduct: () => void
  onUnlinkMeter: () => void
  onDeletePrice: (priceId: number) => void

  formContent: ReactNode

  customerPreviewMode: string
  setCustomerPreviewMode: (next: string) => void
  customerPreviewOptions: string[]

  // Object map
  selectedNodeKey?: string | null
  onOpenAssistantFromObjectMap?: (ref: AssistantReference) => void

  primaryCurrencyCode: string
  pricingModel: string
  chargeFrequency: string
  billingPeriod: string
  includeTax: string
  usageBasis: string
  tieredBy: string
  tiers: number[]
  tierToValues: Record<number, string>
  tierUnitPrices: Record<number, string>
  tierFlatFees: Record<number, string>
  previewUnitQuantity: string
  setPreviewUnitQuantity: (next: string) => void
  previewLocation: string
  setPreviewLocation: (next: string) => void
  previewState: string
  setPreviewState: (next: string) => void
  locationOptions: string[]
  stateOptions: string[]
  getLocationLabel: (value: string) => string
  numberFormatter: Intl.NumberFormat
  formatCurrencyValueForPreview: (amount: number, currency: string, minimumFractionDigits?: number) => string
  getPriceLabel: (price: PriceSummary | null) => string
  vercelIconDarkSrc: string

  assistantWidthPx: number
  assistantIsOpenRef: RefObject<boolean>
  onAssistantPanelReady: () => void
  assistantContext: AssistantContext
  onApplyAssistantActions: (actions: AssistantAction[]) => AssistantApplyResult
  initialAssistantMessage: string | null
  onConsumeInitialAssistantMessage: () => void
  assistantDraftReference?: AssistantReference | null
  onConsumeAssistantDraftReference?: () => void
  onResizePointerDown: (event: ReactPointerEvent) => void

  isScopedFormGenerating?: boolean
  onOpenAssistantFromForm?: () => void
}): ComponentProps<typeof ProductModalOverlay> {
  const {
    t,
    isOpen,
    editingProductId,
    status,
    setIsOpen,
    setEditingProductId,
    isAssistantOpen,
    setIsAssistantOpen,
    onSaveDraft,
    onSubmit,
    containerRef,
    activeObjectForm,
    setActiveObjectForm,
    setIsObjectActionsOpen,
    meter,
    setMeterName,
    productName,
    productDescription,
    productLookupKey,
    collapsedPrices,
    priceNamesById,
    activeTreePriceId,
    priceDraftName,
    onSelectPriceFromTree,
    onAddPriceFromNav,
    parseNumberValue,
    pricingCurrencies,
    currencyAmounts,
    hasObjectActions,
    isObjectActionsOpen,
    objectActionsButtonRef,
    objectActionsMenuRef,
    onDeleteProduct,
    onUnlinkMeter,
    onDeletePrice,
    formContent,
    customerPreviewMode,
    setCustomerPreviewMode,
    customerPreviewOptions,
    selectedNodeKey,
    onOpenAssistantFromObjectMap,
    primaryCurrencyCode,
    pricingModel,
    chargeFrequency,
    billingPeriod,
    includeTax,
    usageBasis,
    tieredBy,
    tiers,
    tierToValues,
    tierUnitPrices,
    tierFlatFees,
    previewUnitQuantity,
    setPreviewUnitQuantity,
    previewLocation,
    setPreviewLocation,
    previewState,
    setPreviewState,
    locationOptions,
    stateOptions,
    getLocationLabel,
    numberFormatter,
    formatCurrencyValueForPreview,
    getPriceLabel,
    vercelIconDarkSrc,
    assistantWidthPx,
    assistantIsOpenRef,
    onAssistantPanelReady,
    assistantContext,
    onApplyAssistantActions,
    initialAssistantMessage,
    onConsumeInitialAssistantMessage,
    assistantDraftReference,
    onConsumeAssistantDraftReference,
    onResizePointerDown,
    isScopedFormGenerating,
    onOpenAssistantFromForm,
  } = args

  const ariaTitle = editingProductId != null ? t("Edit product") : t("New product")
  const headerTitle = editingProductId != null
    ? (productName.trim() || t("Untitled product"))
    : t("New product")
  const submitLabel = status === "live" && editingProductId != null ? t("Save") : t("Create product")

  const pricesForNav = collapsedPrices.map((p) => {
    const name = (priceNamesById[p.id] ?? "").trim()
    return { id: p.id, label: name !== "" ? name : t("Untitled price"), isPlaceholder: name === "" }
  })
  const emptyPriceLabel = priceDraftName.trim() ? priceDraftName.trim() : t("Untitled price")
  const emptyPriceIsPlaceholder = priceDraftName.trim() === ""

  const formHeaderTitle =
    activeObjectForm === "product"
      ? productName.trim() || t("Untitled product")
      : activeObjectForm === "meter"
        ? meter.trim() || t("Untitled meter")
        : (() => {
            const name = (priceNamesById[activeTreePriceId ?? -1] ?? "").trim()
            if (name !== "") return name
            return t("Untitled price")
          })()

  const props: ComponentProps<typeof ProductModalOverlay> = {
    overlayProps: {
      isOpen,
      ariaLabel: ariaTitle,
      onClose: () => {
        setIsOpen(false)
        setEditingProductId(null)
      },
    },
    headerProps: {
      title: headerTitle,
      t,
      status,
      customerPreviewMode,
      setCustomerPreviewMode,
      isAssistantOpen,
      onToggleAssistant: () => setIsAssistantOpen((prev) => !prev),
      onDiscard: () => {
        setIsOpen(false)
        setEditingProductId(null)
      },
      onSaveDraft,
      onSubmit,
      submitLabel,
      simplified: editingProductId == null,
    },
    bodyProps: {
      containerRef,
      navProps: {
        activeForm: activeObjectForm,
        onSelectForm: (next) => {
          setActiveObjectForm(next)
          setIsObjectActionsOpen(false)
          if (next === "meter") {
            setMeterName((prev) => (prev.trim() !== "" ? prev : meter))
          }
        },
        productLabel: productName.trim() || t("Untitled product"),
        productIsPlaceholder: productName.trim() === "",
        prices: pricesForNav,
        emptyPriceLabel,
        emptyPriceIsPlaceholder,
        activePriceId: activeTreePriceId,
        onSelectPrice: onSelectPriceFromTree,
        meterLabel: meter.trim() || t("Untitled meter"),
        meterIsPlaceholder: meter.trim() === "",
        showMeter: meter.trim() !== "",
        onAddPrice: onAddPriceFromNav,
      },
      formHeaderProps: {
        title: formHeaderTitle,
        t,
        hasObjectActions,
        isObjectActionsOpen,
        objectActionsButtonRef,
        objectActionsMenuRef,
        onToggleObjectActions: () => setIsObjectActionsOpen((prev: boolean) => !prev),
        activeObjectForm,
        activePriceId: activeTreePriceId,
        onCloseObjectActions: () => setIsObjectActionsOpen(false),
        onDeleteProduct,
        onUnlinkMeter,
        onDeletePrice,
        onOpenAssistant: onOpenAssistantFromForm,
      },
      formContent,
      isFormLoading: isScopedFormGenerating,
      previewProps: {
        t,
        customerPreviewMode,
        setCustomerPreviewMode,
        customerPreviewOptions,
        activeObjectForm,
        productName,
        productDescription,
        productLookupKey,
        setActiveObjectForm,
        setMeterName,
        selectedNodeKey,
        onOpenAssistant: onOpenAssistantFromObjectMap,
        pricingCurrencies,
        currencyAmounts,
        primaryCurrencyCode,
        pricingModel,
        chargeFrequency,
        billingPeriod,
        includeTax,
        usageBasis,
        tieredBy,
        tiers,
        tierToValues,
        tierUnitPrices,
        tierFlatFees,
        previewUnitQuantity,
        setPreviewUnitQuantity,
        previewLocation,
        setPreviewLocation,
        previewState,
        setPreviewState,
        locationOptions,
        stateOptions,
        getLocationLabel,
        numberFormatter,
        parseNumberValue,
        formatCurrencyValue: formatCurrencyValueForPreview,
        collapsedPrices,
        getPriceLabel,
        activeTreePriceId,
        onSelectPrice: onSelectPriceFromTree,
        draftPriceName: priceDraftName,
        vercelIconDarkSrc,
      },
      assistantDockProps: {
        isOpen: isAssistantOpen,
        widthPx: assistantWidthPx,
        isOpenRef: assistantIsOpenRef,
        onPanelReady: onAssistantPanelReady,
        onClose: () => setIsAssistantOpen(() => false),
        context: assistantContext,
        onApplyActions: onApplyAssistantActions,
        initialUserMessage: initialAssistantMessage,
        onConsumeInitialUserMessage: onConsumeInitialAssistantMessage,
        draftReference: assistantDraftReference ?? null,
        onConsumeDraftReference: onConsumeAssistantDraftReference,
        onResizePointerDown,
      },
    },
  }

  return props
}

export function getPricingPlanModalOverlayProps(args: {
  t: TFn
  isOpen: boolean
  setIsOpen: (next: boolean) => void
  title: string
  status: "draft" | "live"
  onSaveDraft: () => void
  createLabel: string
  createDisabled?: boolean
  onCreate: () => void
  onDiscard: () => void
  isPlanAssistantOpen: boolean
  setIsPlanAssistantOpen: (updater: (prev: boolean) => boolean) => void

  isPlanAssistantApplying: boolean
  setIsPlanAssistantApplying: (next: boolean) => void
  setPlanScopedAiLoadingKeys: (keys: string[]) => void

  activePlanNode: PlanNode
  setActivePlanNode: Dispatch<SetStateAction<PlanNode>>
  // Multi-select support
  selectedPlanNodes?: PlanNode[]
  handleNodeSelect?: (node: PlanNode, shiftKey: boolean) => void
  planName: string
  getPlanLabel: (name: string, fallback: string) => string
  getPlanRateCardLabel: (card?: PlanRateCard | null) => string
  getPlanRateLabel: (rate?: { id: number; name: string } | null) => string
  getPlanCreditGrantLabel: (grant?: PlanNamedItem | null) => string
  getPlanSubscriptionFeeLabel: (fee?: PlanNamedItem | null) => string
  planPriceGroups: { id: number; name: string; serviceInterval: string }[]
  onMoveProductToPriceGroup?: (productId: number, priceGroupId: number) => void
  planRateCards: PlanRateCard[]
  planRates?: PlanRate[]
  rateCardServicingPeriods: Record<number, string>
  rateMeters: Record<number, string>
  planExpandedRateCards: Record<number, boolean>
  setPlanExpandedRateCards: Dispatch<SetStateAction<Record<number, boolean>>>
  setActivePlanRateCardId: Dispatch<SetStateAction<number>>
  onAddPlanRate: (rateCardId: number) => void
  onAddStandaloneRate?: () => void
  onMoveRateToPriceGroup?: (rateId: number, rateCardId: number) => void
  activePlanRateCardId: number
  planCreditGrants: PlanNamedItem[]
  planSubscriptionFees: PlanNamedItem[]
  addPlanObjectButtonRef: RefObject<HTMLButtonElement | null>
  onToggleAddPlanObject: () => void
  onAddPlan?: () => void
  // Multiple plan support in sidebar
  allPlans?: { id: number; name: string; draft?: PricingPlanDraft }[]
  onSwitchToPlan?: (planId: number) => void

  planHeaderLabel: string
  planParentInfo: { parentLabel: string; parentNode: { type: string; id?: number } } | null
  prevTreeNode: { type: string; id?: number } | null
  nextTreeNode: { type: string; id?: number } | null
  hasTreeChanges: boolean
  planDeleteLabel: string
  isPlanActionsOpen: boolean
  setIsPlanActionsOpen: (updater: (prev: boolean) => boolean) => void
  planActionsButtonRef: RefObject<HTMLButtonElement | null>
  planActionsMenuRef: RefObject<HTMLDivElement | null>
  onDeleteActivePlanNode: () => void
  onDuplicateActivePlanNode?: () => void

  planForm: ReactNode
  /**
   * The bound `<PlanGetStarted />` element rendered inside the inline
   * wizard overlay (when active in `form` onboarding mode on an empty plan).
   */
  inlineWizardForm?: ReactNode
  /** Additional forms for multi-selected nodes */
  additionalPlanForms?: {
    node: PlanNode
    form: ReactNode
    editorProps: {
      t: TFn
      headerLabel: string
      deleteLabel: string
      isActionsOpen: boolean
      onToggleActions: () => void
      onCloseActions: () => void
      actionsButtonRef: RefObject<HTMLButtonElement | null>
      actionsMenuRef: RefObject<HTMLDivElement | null>
      onDelete: () => void
      isLoading: boolean
    }
  }[]
  /** Callback to close a specific additional form (remove from multi-selection) */
  onCloseAdditionalForm?: (node: PlanNode) => void

  customerPreviewMode: string
  setCustomerPreviewMode: (next: string) => void
  customerPreviewOptions: string[]
  planUsageScenarioRates: number[]
  setPlanUsageScenarioRates: Dispatch<SetStateAction<number[]>>
  handleAddPlanUsageScenarioRate: (rateCardId: number) => void
  planRateUsage: Record<number, string>
  setPlanRateUsage: Dispatch<SetStateAction<Record<number, string>>>
  planRateTiers: Record<number, number[]>
  planRateTierToValues: Record<number, Record<number, string>>
  planRateTierUnitPrices: Record<number, Record<number, string>>
  planRateUnitPrices: Record<number, string>
  ratePriceTypes: Record<number, string>
  numberFormatter: Intl.NumberFormat
  parseNumberValue: (value: string) => number
  formatIntegerWithCommas: (raw: string) => string

  // Multi-plan preview
  pricingPlans: PricingPlanRow[]
  editingPlanId: number | null
  currentPlanDraft: PricingPlanDraft

  // Object map
  rateMeterNames: string[]
  selectedNodeKey?: string | null
  activeNodeKey?: string | null
  /** Array of selected node keys (for multi-select support) */
  selectedNodeKeys?: string[]
  onOpenAssistantFromObjectMap?: (ref: AssistantReference) => void
  /** Callback when clicking plus button after plan node in object map - opens dropdown at position */
  onOpenAddPlanObjectPopover?: (position: { top: number; left: number; above?: boolean }) => void
  /** Callback when clicking plus button after rate card in object map - adds a rate */
  onAddRateFromMap?: (rateCardId: number) => void

  planCurrency: string
  formatCurrencyValue: (amount: number, currency: string, minimumFractionDigits?: number) => string

  // Code view props
  planDescription: string
  planLookupKey: string
  rateMetersByRate: Record<number, string>
  rateUnitLabels: Record<number, string>
  rateSellAs: Record<number, string>
  planRateTierFlatFees: Record<number, Record<number, string>>
  creditGrantAmounts: Record<number, string>
  creditGrantPeriods: Record<number, string>
  subscriptionFeeAmounts: Record<number, string>
  subscriptionFeePeriods: Record<number, string>

  planAssistantIsOpenRef: RefObject<boolean>
  onPlanAssistantPanelReady: () => void
  planAssistantContext: AssistantContext
  onApplyPlanAssistantActions: (actions: AssistantAction[]) => AssistantApplyResult
  onPreviewPlanAssistantActions?: (actions: AssistantAction[]) => AssistantPreviewResult
  onConfirmPlanAssistantPreview?: () => void
  planAssistantSeedPrompt: string | null
  onConsumePlanAssistantSeedPrompt: () => void
  planAssistantDraftReference?: AssistantReference | null
  onConsumePlanAssistantDraftReference?: () => void
  planChatPanelPx: number

  isAddPlanObjectOpen: boolean
  addPlanObjectPopoverPosition: { top: number; left: number; above?: boolean; centerY?: boolean } | null
  addPlanObjectPopoverRef: RefObject<HTMLDivElement | null>
  onAddPlanObject: (kind: "rate" | "rate-card" | "credit-grant" | "subscription-fee" | "meter" | "product-with-price" | "price-group", rateCardId?: number) => void

  // Catalog items for search in the add popover
  catalogItems?: import("./AddPlanObjectPopover").CatalogSearchItem[]
  onSelectCatalogItem?: (item: import("./AddPlanObjectPopover").CatalogSearchItem) => void

  // Component system
  hasComponents?: boolean
  existingComponents?: import("./componentTypes").ComponentRecord[]
  onUseExistingComponent?: (componentId: string, kind: import("./componentTypes").ComponentKind) => void
  /** Existing components filtered for the current node type (for ellipsis "Use existing") */
  existingComponentsForNodeType?: import("./componentTypes").ComponentRecord[]
  onReplaceWithExistingComponent?: (componentId: string) => void
  /** Version info for the currently active node's component link */
  componentVersions?: import("./componentTypes").ComponentVersion[]
  activeComponentVersionId?: string
  onChangeComponentVersion?: (versionId: string) => void
  isDraftComponent?: boolean
  isComponentReadOnly?: boolean
  componentSummaries?: import("./componentTypes").ComponentSaveSummary[]

  isScopedFormGenerating?: boolean
  onOpenAssistantFromForm?: () => void

  // Assistant preview highlighting (used for Keep/Discard preview flow)
  assistantHighlightedKeys?: string[]
  assistantHighlightClass?: string

  // Context menu callbacks
  onSidebarContextMenu?: (info: {
    position: { top: number; left: number }
    nodeType: PlanNode["type"]
    nodeId?: number
    label: string
  }) => void
  onMapNodeContextMenu?: (info: {
    position: { top: number; left: number }
    nodeKey: string
    label: string
  }) => void

  // Coachmark support
  isExamplePlan?: boolean

  /** When false, suppress selection styling in sidebar (no row appears selected). */
  sidebarSelectionEnabled?: boolean

  /** Called when user clicks the empty canvas background (not a node). */
  onBackgroundClick?: () => void
  /** Ghost items for quick-start hover preview */
  quickStartGhostKinds?: ("subscription-fee" | "rate" | "credit-grant")[] | null

  /** Node IDs with validation errors — used to show red text on sidebar items */
  validationErrorNodeIds?: { type: string; id?: number }[]

  // Tree nav slide-out
  isTreeNavOpen: boolean
  onToggleTreeNav: () => void
  hamburgerButtonRef: RefObject<HTMLButtonElement | null>
  formAddButtonRef: RefObject<HTMLButtonElement | null>
  // Sidebar tip
  showSidebarTip: boolean
  onDismissSidebarTip: () => void
  // Onboarding popovers
  showGetStarted: boolean
  onDismissGetStarted: () => void
  showNavHint: boolean
  onDismissNavHint: () => void
  /** Action-driven onboarding tour step (null = inactive) */
  onboardingTourStep?: 1 | 2 | 3 | null
  onDismissOnboardingTour?: () => void
  /** When true, the Get Started wizard has been explicitly dismissed (skip or submit). */
  getStartedDismissed?: boolean
  isInlineGetStartedActive?: boolean
  /** True while the inline wizard's simulated 2s load is running (progress bar at top). */
  isWizardLoading?: boolean
  onboardingMode?: "tips" | "form"

  // Bulk edit
  isBulkEditMode?: boolean
  bulkEditContent?: ReactNode
  bulkEditRateCardId?: number | null
  onExitBulkEdit?: () => void

  // Version support
  versions?: PlanVersion[]
  activeVersionId?: number
  onChangeVersion?: (versionId: number) => void
  showSaveVersionModal?: boolean
  onConfirmSaveVersion?: (versionName: string, defaultVersionId: number) => void
  onCancelSaveVersion?: () => void
  currentDefaultVersionId?: number
}): ComponentProps<typeof PricingPlanModalOverlay> {
  const {
    t,
    isOpen,
    title,
    status,
    onSaveDraft,
    createLabel,
    createDisabled,
    onCreate,
    onDiscard,
    isPlanAssistantOpen,
    setIsPlanAssistantOpen,
    isPlanAssistantApplying,
    setIsPlanAssistantApplying,
    setPlanScopedAiLoadingKeys,
    activePlanNode,
    setActivePlanNode,
    selectedPlanNodes,
    handleNodeSelect,
    planName,
    getPlanLabel,
    getPlanRateCardLabel,
    getPlanRateLabel,
    getPlanCreditGrantLabel,
    getPlanSubscriptionFeeLabel,
    planPriceGroups,
    onMoveProductToPriceGroup,
    planRateCards,
    planRates,
    rateCardServicingPeriods,
    planExpandedRateCards,
    setPlanExpandedRateCards,
    setActivePlanRateCardId,
    onAddPlanRate,
    onAddStandaloneRate,
    onMoveRateToPriceGroup,
    activePlanRateCardId,
    planCreditGrants,
    planSubscriptionFees,
    addPlanObjectButtonRef,
    onToggleAddPlanObject,
    onAddPlan,
    allPlans,
    onSwitchToPlan,
    planHeaderLabel,
    planParentInfo,
    prevTreeNode,
    nextTreeNode,
    hasTreeChanges,
    planDeleteLabel,
    isPlanActionsOpen,
    setIsPlanActionsOpen,
    planActionsButtonRef,
    planActionsMenuRef,
    onDeleteActivePlanNode,
    onDuplicateActivePlanNode,
    planForm,
    inlineWizardForm,
    additionalPlanForms,
    onCloseAdditionalForm,
    customerPreviewMode,
    setCustomerPreviewMode,
    customerPreviewOptions,
    planUsageScenarioRates,
    setPlanUsageScenarioRates,
    handleAddPlanUsageScenarioRate,
    planRateUsage,
    setPlanRateUsage,
    planRateTiers,
    planRateTierToValues,
    planRateTierUnitPrices,
    planRateUnitPrices,
    ratePriceTypes,
    numberFormatter,
    parseNumberValue,
    formatIntegerWithCommas,
    pricingPlans,
    editingPlanId,
    currentPlanDraft,
    rateMeters,
    rateMeterNames,
    selectedNodeKey,
    activeNodeKey,
    selectedNodeKeys,
    onOpenAssistantFromObjectMap,
    onOpenAddPlanObjectPopover,
    onAddRateFromMap,
    planCurrency,
    formatCurrencyValue,
    planDescription,
    planLookupKey,
    rateMetersByRate,
    rateUnitLabels,
    rateSellAs,
    planRateTierFlatFees,
    creditGrantAmounts,
    creditGrantPeriods,
    subscriptionFeeAmounts,
    subscriptionFeePeriods,
    planAssistantIsOpenRef,
    onPlanAssistantPanelReady,
    planAssistantContext,
    onApplyPlanAssistantActions,
    onPreviewPlanAssistantActions,
    onConfirmPlanAssistantPreview,
    planAssistantSeedPrompt,
    onConsumePlanAssistantSeedPrompt,
    planAssistantDraftReference,
    onConsumePlanAssistantDraftReference,
    planChatPanelPx,
    isAddPlanObjectOpen,
    addPlanObjectPopoverPosition,
    addPlanObjectPopoverRef,
    onAddPlanObject,
    isScopedFormGenerating,
    onOpenAssistantFromForm,
    assistantHighlightedKeys,
    assistantHighlightClass,
    onSidebarContextMenu,
    onMapNodeContextMenu,
    isExamplePlan,
    sidebarSelectionEnabled,
    onBackgroundClick,
    quickStartGhostKinds,
    validationErrorNodeIds,
    versions,
    activeVersionId,
    onChangeVersion,
    showSaveVersionModal,
    onConfirmSaveVersion,
    onCancelSaveVersion,
    currentDefaultVersionId,
    isBulkEditMode,
    bulkEditContent,
    bulkEditRateCardId,
    onExitBulkEdit,
    isTreeNavOpen,
    onToggleTreeNav,
    hamburgerButtonRef,
    formAddButtonRef,
    showSidebarTip,
    onDismissSidebarTip,
    showGetStarted,
    onDismissGetStarted,
    showNavHint,
    onDismissNavHint,
    onboardingTourStep,
    onDismissOnboardingTour,
    getStartedDismissed,
    isInlineGetStartedActive,
    isWizardLoading,
    onboardingMode,
  } = args

  const headerTitle = getPlanLabel(planName, t("Untitled pricing plan"))

  return {
    overlayProps: {
      isOpen,
      ariaLabel: title,
      onClose: () => {
        onDiscard()
      },
    },
    inlineWizardForm,
    headerProps: {
      t,
      title: headerTitle,
      status,
      customerPreviewMode,
      setCustomerPreviewMode,
      isPlanAssistantOpen,
      onToggleAssistant: () => setIsPlanAssistantOpen((prev) => !prev),
      onDiscard,
      onSaveDraft,
      onCreate,
      createLabel,
      createDisabled,
      isBulkEditMode,
      bulkEditTitle: isBulkEditMode ? headerTitle : undefined,
      onBulkEditBack: onExitBulkEdit,
    },
    saveVersionModalProps: showSaveVersionModal && onConfirmSaveVersion && onCancelSaveVersion ? {
      t,
      planName: getPlanLabel(planName, t("Untitled pricing plan")),
      existingVersions: versions ?? [],
      currentDefaultVersionId,
      onConfirm: onConfirmSaveVersion,
      onCancel: onCancelSaveVersion,
      componentSummaries: args.componentSummaries,
    } : undefined,
    bodyProps: {
      sidebarProps: {
        t,
        isPlanAssistantApplying,
        assistantHighlightedKeys,
        assistantHighlightClass,
        isFormOpen: sidebarSelectionEnabled,
        activePlanNode,
        setActivePlanNode,
        selectedPlanNodes,
        handleNodeSelect,
        planName,
        getPlanLabel,
        getPlanRateCardLabel,
        getPlanRateLabel,
        getPlanCreditGrantLabel,
        getPlanSubscriptionFeeLabel,
        planPriceGroups,
        onMoveProductToPriceGroup: (productId: number, priceGroupId: number) => {
          onMoveProductToPriceGroup?.(productId, priceGroupId)
        },
        planRateCards,
        planRates,
        rateCardServicingPeriods,
        rateMeters,
        planExpandedRateCards,
        setPlanExpandedRateCards,
        setActivePlanRateCardId,
        onAddPlanRate,
        onAddStandaloneRate,
        onMoveRateToPriceGroup,
        planCreditGrants,
        planSubscriptionFees,
        addPlanObjectButtonRef,
        onToggleAddPlanObject,
        onAddPlan,
        editingPlanId,
        allPlans,
        onSwitchToPlan,
        showSidebarTip,
        onDismissSidebarTip,
        onContextMenu: onSidebarContextMenu,
        validationErrorNodeIds,
      },
      editorProps: {
        t,
        headerLabel: planHeaderLabel,
        parentLabel: planParentInfo?.parentLabel,
        onNavigateToParent: planParentInfo ? () => {
          setActivePlanNode(planParentInfo.parentNode as typeof activePlanNode)
        } : undefined,
        onNavigateToPlan: () => {
          setActivePlanNode({ type: "plan" } as typeof activePlanNode)
        },
        onNavigatePrev: prevTreeNode ? () => {
          setActivePlanNode(prevTreeNode as typeof activePlanNode)
        } : undefined,
        onNavigateNext: nextTreeNode ? () => {
          setActivePlanNode(nextTreeNode as typeof activePlanNode)
        } : undefined,
        hasTreeChanges,
        deleteLabel: planDeleteLabel,
        nodeType: activePlanNode.type,
        isActionsOpen: isPlanActionsOpen,
        onToggleActions: () => setIsPlanActionsOpen((prev) => !prev),
        onCloseActions: () => setIsPlanActionsOpen(() => false),
        actionsButtonRef: planActionsButtonRef,
        actionsMenuRef: planActionsMenuRef,
        onDelete: onDeleteActivePlanNode,
        onDuplicate: onDuplicateActivePlanNode,
        onAddFirstRate: () => onAddPlanObject("rate"),
        hideHeader: activePlanNode.type === "plan" && (Boolean(isInlineGetStartedActive) || Boolean(showGetStarted)),
        isLoading: Boolean(isPlanAssistantApplying || isScopedFormGenerating),
        onOpenAssistant: onOpenAssistantFromForm,
        onClose: onDiscard,
        // Tree nav + add button
        isTreeNavOpen,
        onToggleTreeNav,
        hamburgerButtonRef,
        formAddButtonRef,
        onToggleAddPlanObject,
        onDirectAddRate: () => {
          // Determine which rate card to add to based on the active node
          const targetCardId = activePlanNode.type === "rateCard" && activePlanNode.id != null
            ? activePlanNode.id
            : activePlanNode.type === "rate" || activePlanNode.type === "rateMeter"
              ? planRateCards.find((c) => c.rates.some((r) => r.id === activePlanNode.id))?.id ?? activePlanRateCardId
              : activePlanRateCardId
          onAddPlanRate(targetCardId)
        },
        hasRateComponents: false,
        // Component system
        hasComponents: args.hasComponents,
        existingComponents: args.existingComponentsForNodeType,
        onUseExistingComponent: args.onReplaceWithExistingComponent,
        componentVersions: args.componentVersions,
        activeComponentVersionId: args.activeComponentVersionId,
        onChangeComponentVersion: args.onChangeComponentVersion,
        isDraftComponent: args.isDraftComponent,
        isComponentReadOnly: args.isComponentReadOnly,
        // Next-step prompt state
        currentRateCount: activePlanNode.type === "rateCard" && activePlanNode.id != null
          ? (planRateCards.find((c) => c.id === activePlanNode.id)?.rates.length ?? 0)
          : undefined,
        currentRateHasMeter: activePlanNode.type === "rate" && activePlanNode.id != null
          ? Boolean(rateMetersByRate[activePlanNode.id])
          : undefined,
        planHasRateCards: planRateCards.length > 0,
      },
      planForm,
      additionalPlanForms,
      onCloseAdditionalForm,
      isBulkEditMode,
      bulkEditContent,
      bulkEditRateCardId,
      onExitBulkEdit,
      // Tree nav state for body layout
      isTreeNavOpen,
      onToggleTreeNav,
      // Onboarding popovers
      showGetStarted,
      onDismissGetStarted,
      showNavHint,
      onDismissNavHint,
      onboardingTourStep,
      onDismissOnboardingTour,
      hamburgerButtonRef,
      formAddButtonRef,
      previewProps: {
        t,
        isPlanAssistantApplying,
        isInlineGetStartedActive,
        isWizardLoading,
        // Action buttons (moved from header to preview area)
        onDiscard,
        onCreate,
        createLabel,
        isBulkEditMode,
        bulkEditTitle: isBulkEditMode ? headerTitle : undefined,
        onBulkEditBack: onExitBulkEdit,
        customerPreviewMode,
        setCustomerPreviewMode,
        customerPreviewOptions,
        planRateCards,
        getPlanRateCardLabel,
        getPlanRateLabel,
        rateMeters,
        planCreditGrants,
        planSubscriptionFees,
        getPlanCreditGrantLabel,
        getPlanSubscriptionFeeLabel,
        selectedNodeKey,
        activeNodeKey,
        selectedNodeKeys,
        onOpenAssistant: onOpenAssistantFromObjectMap,
        onAddPlanObject: onOpenAddPlanObjectPopover,
        onAddRate: onAddRateFromMap,
        onNodeContextMenu: onMapNodeContextMenu,
        planUsageScenarioRates,
        setPlanUsageScenarioRates,
        handleAddPlanUsageScenarioRate,
        planRateUsage,
        setPlanRateUsage,
        planRateTiers,
        planRateTierToValues,
        planRateTierUnitPrices,
        planRateUnitPrices,
        ratePriceTypes,
        numberFormatter,
        parseNumberValue,
        formatIntegerWithCommas,
        setActivePlanRateCardId,
        setPlanExpandedRateCards,
        setActivePlanNode,
        handleNodeSelect,
        pricingPlans,
        editingPlanId,
        currentPlanDraft,
        allPlans,
        onSwitchToPlan,
        getPlanLabel,
        planName,
        planCurrency,
        formatCurrencyValue,
        planDescription,
        planLookupKey,
        rateMetersByRate,
        rateUnitLabels,
        rateSellAs,
        planRateTierFlatFees,
        creditGrantAmounts,
        creditGrantPeriods,
        subscriptionFeeAmounts,
        subscriptionFeePeriods,
        isExamplePlan,
        onBackgroundClick,
        quickStartGhostKinds,
      },
      assistantDockProps: {
        isOpen: isPlanAssistantOpen,
        widthPx: planChatPanelPx,
        isOpenRef: planAssistantIsOpenRef,
        onPanelReady: onPlanAssistantPanelReady,
        onClose: () => setIsPlanAssistantOpen(() => false),
        context: planAssistantContext,
        onApplyActions: onApplyPlanAssistantActions,
        onPreviewActions: onPreviewPlanAssistantActions,
        onConfirmPreview: onConfirmPlanAssistantPreview,
        initialUserMessage: planAssistantSeedPrompt,
        onConsumeInitialUserMessage: onConsumePlanAssistantSeedPrompt,
        draftReference: planAssistantDraftReference ?? null,
        onConsumeDraftReference: onConsumePlanAssistantDraftReference,
        applyDelayMs: 2000,
        onBeginApply: (actions) => {
          // Compute loading keys based on which fields the actions will modify
          const loadingKeys: string[] = []
          for (const action of actions) {
            const type = action.type
            if (type === "rename_plan_rate_card" && "rateCardId" in action) {
              const rateCardId = (action as unknown as { rateCardId: number }).rateCardId
              loadingKeys.push(`rateCard.${rateCardId}.name`)
            } else if (type === "rename_plan_rate" && "rateId" in action) {
              const rateId = (action as unknown as { rateId: number }).rateId
              loadingKeys.push(`rate.${rateId}.name`)
            } else if (type === "set_plan_rate_meter" && "rateId" in action) {
              const rateId = (action as unknown as { rateId: number }).rateId
              loadingKeys.push(`rate.${rateId}.meter`)
            } else if (type === "set_plan_rate_price_type" && "rateId" in action) {
              const rateId = (action as unknown as { rateId: number }).rateId
              loadingKeys.push(`rate.${rateId}.priceType`)
            } else if (type === "add_plan_rate_currency" && "rateId" in action) {
              const rateId = (action as unknown as { rateId: number }).rateId
              const code = (action as unknown as { code: string }).code
              loadingKeys.push(`rate.${rateId}.currency.${code}`)
            } else if (type === "set_plan_name") {
              loadingKeys.push("plan.name")
            } else if (type === "set_plan_description") {
              loadingKeys.push("plan.description")
            }
            // Other action types that don't have obvious single-field targets are ignored
            // and won't trigger full-form loading (the action will just apply without skeleton)
          }
          // Use granular loading if we have keys, otherwise just apply without skeleton
          // (don't fall back to full-form loading for unknown action types)
          if (loadingKeys.length > 0) {
            setPlanScopedAiLoadingKeys(loadingKeys)
          }
        },
        onEndApply: () => {
          setIsPlanAssistantApplying(false)
          setPlanScopedAiLoadingKeys([])
        },
      },
      addObjectPopoverProps: {
        isOpen: isAddPlanObjectOpen,
        position: addPlanObjectPopoverPosition,
        popoverRef: addPlanObjectPopoverRef,
        t,
        onAddObject: onAddPlanObject,
        hasComponents: args.hasComponents,
        existingComponents: args.existingComponents,
        onUseExistingComponent: args.onUseExistingComponent,
        rateCardCount: planRateCards.length,
        catalogItems: args.catalogItems,
        onSelectCatalogItem: args.onSelectCatalogItem,
      },
    },
  }
}


