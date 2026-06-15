'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { ProductCatalogLayout } from "@/components/product-catalog/ProductCatalogLayout"
import {
  type AssistantAction,
  type AssistantApplyResult,
  type AssistantPreviewResult,
  type AssistantContext,
  type AssistantReference,
} from "@/components/ProductAssistantPanel"
import { PlanForm, type PlanFormContext } from "@/components/product-catalog/PlanForm"
import { BulkRateEditor } from "@/components/product-catalog/BulkRateEditor"
import { validatePlanForm, getValidationErrorObjects, type IncompleteField } from "@/components/product-catalog/PlanForm/validatePlanForm"
import { ProductImageModal } from "@/components/product-catalog/ProductImageModal"
import { ProductModalOverlay } from "@/components/product-catalog/ProductModalOverlay"
import { AddPriceModal } from "@/components/product-catalog/AddPriceModal"
import { PricingPlanModalOverlay } from "@/components/product-catalog/PricingPlanModalOverlay"
import { PricingPlanWizardModal, type WizardData } from "@/components/product-catalog/PricingPlanWizardModal"
import { CreationFlowOverlay } from "@/components/creation-workspace/CreationFlowOverlay"
import { BillingListView } from "@/components/creation-workspace/BillingListView"
import { BillingTabbedPage } from "@/components/creation-workspace/BillingTabbedPage"
import { SubscriptionsListView } from "@/components/creation-workspace/SubscriptionsListView"
import { SubscriptionEditorModal } from "@/components/creation-workspace/SubscriptionEditorModal"
import { loadSubscriptions, saveSubscriptions, type SubscriptionRecord } from "@/lib/subscriptions"
import { CustomersListView } from "@/components/product-catalog/CustomersListView"
import { CustomerDetailView } from "@/components/product-catalog/CustomerDetailView"
import { CUSTOMERS } from "@/lib/customers"
import { ProductCatalogView } from "@/components/product-catalog/ProductCatalogView"
import { NewProductFullScreen } from "@/components/product-catalog/NewProductFullScreen"
import {
  SIMULATED_RATE_CARDS,
  SIMULATED_SUBSCRIPTION_FEES,
  SIMULATED_CREDIT_GRANTS,
} from "@/lib/simulated-merchant-components"
import { SimplifiedProductPopover } from "@/components/product-catalog/SimplifiedProductPopover"
import { SimplifiedCreateProductForm } from "@/components/product-catalog/SimplifiedCreateProductForm"
import { useAnchoredPopover } from "@/components/product-catalog/hooks/useAnchoredPopover"
import { useAutosizeTextarea } from "@/components/product-catalog/hooks/useAutosizeTextarea"
import { useAddProductPromptRouting } from "@/components/product-catalog/hooks/useAddProductPromptRouting"
import { useModalPanelResize } from "@/components/product-catalog/hooks/useModalPanelResize"
import { useLockBodyScroll } from "@/components/product-catalog/hooks/useLockBodyScroll"
import { useDismissOnOutsidePointerDownAndEscape } from "@/components/product-catalog/hooks/useDismissOnOutsidePointerDownAndEscape"
import { useProductCatalogStorage } from "@/components/product-catalog/hooks/useProductCatalogStorage"
import { useSyncBoolRef } from "@/components/product-catalog/hooks/useSyncBoolRef"
import { usePointerUpCancel } from "@/components/product-catalog/hooks/usePointerUpCancel"
import { useAutoClearAfterDelay } from "@/components/product-catalog/hooks/useAutoClearAfterDelay"
import { getNumberValue, getStringValue, resolveOption } from "@/components/product-catalog/assistant/assistantValueParsing"
import {
  resolvePriceId as resolvePriceIdFromAssistant,
  resolveRateCardId as resolveRateCardIdFromAssistant,
  resolveRateId as resolveRateIdFromAssistant,
  resolveCurrencyId as resolveCurrencyIdFromAssistant,
  resolvePlanRateCurrencyId as resolvePlanRateCurrencyIdFromAssistant,
  resolveRowId as resolveRowIdFromAssistant,
  resolveTierId as resolveTierIdFromAssistant,
} from "@/components/product-catalog/assistant/assistantResolvers"
import {
  getAiModelSeedPricing as getAiModelSeedPricingFromAssistant,
  inferRateCardNameFromRate as inferRateCardNameFromRateFromAssistant,
  isAiModelRateName as isAiModelRateNameFromAssistant,
} from "@/components/product-catalog/assistant/assistantAiModelSeed"
import { applyProductAssistantAction } from "@/components/product-catalog/assistant/applyProductAssistantAction"
import { applyPlanRateCardAssistantAction } from "@/components/product-catalog/assistant/applyPlanRateCardAssistantAction"
import { applyPlanRateAddAssistantAction } from "@/components/product-catalog/assistant/applyPlanRateAddAssistantAction"
import { applyPlanRateMetadataAssistantAction } from "@/components/product-catalog/assistant/applyPlanRateMetadataAssistantAction"
import { getAllRates, getActivePlanDeleteLabel, getActivePlanHeaderLabel, getActivePlanParentInfo, getFlattenedTreeNodes } from "@/components/product-catalog/planNodeLabels"
import { useMerchantComponents } from "@/components/product-catalog/merchantComponents"
import { useOnboardingMode } from "@/components/product-catalog/onboardingMode"
import type { ComponentKind, ComponentRecord } from "@/components/product-catalog/componentTypes"
import { ProductFormPanelContent } from "@/components/product-catalog/ProductFormPanelContent"
import { ContextMenu } from "@/components/product-catalog/ContextMenu"
import { getPricingPlanModalOverlayProps, getProductModalOverlayProps } from "@/components/product-catalog/modalOverlayProps"
import {
  CHAT_PANEL_MAX_PX,
  CHAT_PANEL_MIN_PX,
  FORM_PANEL_MIN_PX,
  LEFT_PANEL_MIN_PX,
  PLAN_CHAT_PANEL_PX,
  aggregationMethodOptions,
  chargeFrequencyOptions,
  creditApplicationOptions,
  customerPreviewOptions,
  defaultMeterOptions,
  eventTimeWindowOptions,
  includeTaxOptions,
  oneOffPricingOptions,
  planPriceTypeOptions,
  priceBillingPeriodOptions,
  recurringPricingOptions,
  sellAsOptions,
  servicingPeriodOptions,
  textFieldInputClasses,
  tieredByOptions,
  usageBasisOptions,
  vercelIconDarkSrc,
} from "@/components/product-catalog/productCatalogPage.constants"
import type {
  PlanNamedItem,
  PlanNode,
  PlanPriceGroup,
  PlanRate,
  PlanRateCard,
  PlanVersion,
  PriceSummary,
  PricingPlanDraft,
  PricingPlanRow,
  ProductRow,
  SavedPriceConfig,
} from "@/components/product-catalog/productCatalogPage.types"
import { PRICING_PLAN_STORAGE_KEY, PRODUCT_CATALOG_STORAGE_KEY } from "@/lib/product-catalog-storage"
import { EXAMPLE_PRICING_PLAN, EXAMPLE_PLAN_ID, COACHMARK_STEPS_LAYOUT_A, COACHMARK_STEPS_LAYOUT_B, DYNAMIC_COACHMARK_MAP } from "@/lib/example-pricing-plan"
import { PHOTON_PRICING_PLAN } from "@/lib/photon-pricing-plan"
import { VERCEL_PRICING_PLANS as VERCEL_PLANS } from "@/lib/vercel-pricing-plans"
import { VERCEL_PRODUCTS } from "@/lib/vercel-products"
import type { CoachmarkStep } from "@/components/product-catalog/Coachmark"
import {
  formatIntegerWithCommas,
  parseNumberValue,
  formatCurrencyValue,
  getPlanLabel,
  getBillingLabelForPeriod,
  getLocationLabel,
  stateOptionsByLocation,
  createNumberFormatter,
  createCurrencyDisplayNames,
  getCurrencyOptions,
} from "@/components/ProductCatalogPage/formatters"
import { useMeterFormState } from "@/components/ProductCatalogPage/useMeterFormState"
import { usePriceFormState } from "@/components/ProductCatalogPage/usePriceFormState"
import { useProductFormState } from "@/components/ProductCatalogPage/useProductFormState"
import ContractsView, { contracts as contractsData } from "@/components/contracts/contracts-view"
import ContractDetailV4 from "@/components/contracts/contract-detail-v4"
import NewContractWizardV4 from "@/components/contracts/new-contract-wizard-v4"

/** When true, the example plan appears in the catalog; when false, only user-created plans are shown. */
const SHOW_EXAMPLE_PLAN = false
/** When true, the Photon plan appears permanently in the catalog. Set to false to remove it. */
const SHOW_PHOTON_PLAN = false

export default function Home() {
  const { t } = useTranslation()
  const router = useRouter()
  const newFieldEffect = "highlight" as const

  const currencyDisplayNames = useMemo(() => createCurrencyDisplayNames(), [])
  const currencyOptions = useMemo(() => getCurrencyOptions(), [])

  // Product form state
  const {
    productName,
    setProductName,
    productType,
    setProductType,
    productTaxCode,
    setProductTaxCode,
    productImageUrl,
    setProductImageUrl,
    productDescription,
    setProductDescription,
    showAdditionalOptions,
    setShowAdditionalOptions,
    statementDescriptor,
    setStatementDescriptor,
    unitLabel,
    setUnitLabel,
    metadataRows,
    setMetadataRows,
    featureRows,
    setFeatureRows,
    metadataValues,
    setMetadataValues,
    featureValues,
    setFeatureValues,
    editingProductId,
    setEditingProductId,
    resetProductFormToDefaults: resetProductFieldsToDefaults,
  } = useProductFormState()

  const [customerPreviewMode, setCustomerPreviewMode] = useState(() =>
    customerPreviewOptions.includes("Preview") ? "Preview" : customerPreviewOptions[0]
  )
  const [previewUnitQuantity, setPreviewUnitQuantity] = useState("3200")
  const [previewLocation, setPreviewLocation] = useState("USA")
  const [previewState, setPreviewState] = useState("Alaska")

  // Pricing plan state
  const [isPricingPlanWizardOpen, setIsPricingPlanWizardOpen] = useState(false)
  const [wizardExiting, setWizardExiting] = useState(false)
  const [showPlanSkeleton, setShowPlanSkeleton] = useState(false)
  const [quickStartGhostKinds, setQuickStartGhostKinds] = useState<("subscription-fee" | "rate" | "credit-grant")[] | null>(null)
  const [showFieldHints, setShowFieldHints] = useState(false)
  const [importedPriceGroupSourcePlan, setImportedPriceGroupSourcePlan] = useState<string | null>(null)
  const [isPricingPlanModalOpen, setIsPricingPlanModalOpen] = useState(false)
  const [isAddPriceModalOpen, setIsAddPriceModalOpen] = useState(false)
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false)
  const [editingSubscription, setEditingSubscription] = useState<{ id?: string; customer: string; items: string; treeData?: SubscriptionRecord["treeData"] } | null>(null)
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>(() => loadSubscriptions())
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null)
  const [demoMode, setDemoMode] = useState<"plg-slg" | "plg" | "new-users">("plg-slg")
  const [demoFlash, setDemoFlash] = useState(false)
  const [isCreateDropdownOpen, setIsCreateDropdownOpen] = useState(false)
  const [contractsView, setContractsView] = useState<"list" | "detail" | "create">("list")
  const [selectedContract, setSelectedContract] = useState<any>(null)
  const [activeBillingView, setActiveBillingView] = useState<string | null>("product-catalog")
  const [activeCreationFlow, setActiveCreationFlow] = useState<string | null>(null)
  const [incompleteFields, setIncompleteFields] = useState<IncompleteField[]>([])
  const [showValidationPanel, setShowValidationPanel] = useState(false)
  const [showSaveVersionModal, setShowSaveVersionModal] = useState(false)
  const [activeVersionId, setActiveVersionId] = useState<number | null>(null)
  const [bulkEditRateCardId, setBulkEditRateCardId] = useState<number | null>(null)
  const [isCoachmarkTourActive, setIsCoachmarkTourActive] = useState(false)
  const [currentCoachmarkStep, setCurrentCoachmarkStep] = useState(0)
  const [seenCoachmarks, setSeenCoachmarks] = useState<Set<string>>(new Set())
  const [activeCoachmark, setActiveCoachmark] = useState<string | null>(null)
  const [planName, setPlanName] = useState("")
  const [planDescription, setPlanDescription] = useState("")
  const [planCurrency, setPlanCurrency] = useState("USD")
  const [planLookupKey, setPlanLookupKey] = useState("")
  const [planTaxTreatment, setPlanTaxTreatment] = useState("Yes")
  const [planPriceGroups, setPlanPriceGroups] = useState<PlanPriceGroup[]>([])
  const [planRateCards, setPlanRateCards] = useState<PlanRateCard[]>([])
  const [planRates, setPlanRates] = useState<PlanRate[]>([])
  // Used to resolve assistant actions that refer to rate cards / rates created earlier in the same apply batch.
  // This avoids "No rate found..." errors caused by React state updates not being synchronous.
  const assistantPlanRateCardsDraftRef = useRef<PlanRateCard[] | null>(null)
  const [activePlanRateCardId, setActivePlanRateCardId] = useState<number>(0)
  const [planRateUsage, setPlanRateUsage] = useState<Record<number, string>>({ 0: "0" })
  const [planRateUnitPrices, setPlanRateUnitPrices] = useState<Record<number, string>>({ 0: "" })
  const [planRateTiers, setPlanRateTiers] = useState<Record<number, number[]>>({ 0: [0, 1] })
  const [planRateTierToValues, setPlanRateTierToValues] = useState<Record<number, Record<number, string>>>({})
  const [planRateTierUnitPrices, setPlanRateTierUnitPrices] = useState<Record<number, Record<number, string>>>({})
  const [planRateTierFlatFees, setPlanRateTierFlatFees] = useState<Record<number, Record<number, string>>>({})
  const [planRateIncludeTax, setPlanRateIncludeTax] = useState<Record<number, string>>({})
  const [planRateCurrencies, setPlanRateCurrencies] = useState<Record<number, { id: number; code: string }[]>>({})
  const [planRateActiveCurrencyId, setPlanRateActiveCurrencyId] = useState<Record<number, number>>({})
  const [planUsageScenarioRates, setPlanUsageScenarioRates] = useState<number[]>([])
  const hasUserEditedPlanUsageScenarioRef = useRef(false)
  const [usageScenarioDraggingRateId, setUsageScenarioDraggingRateId] = useState<number | null>(null)
  const [planCreditGrants, setPlanCreditGrants] = useState<PlanNamedItem[]>([])
  const [planSubscriptionFees, setPlanSubscriptionFees] = useState<PlanNamedItem[]>([])
  const [activePlanNode, setActivePlanNode] = useState<PlanNode>({ type: "plan" })
  // Multi-select state: additional selected nodes (activePlanNode is always included)
  const [additionalSelectedNodes, setAdditionalSelectedNodes] = useState<PlanNode[]>([])

  // Helper to compare plan nodes (including planId for cross-plan support)
  const isSamePlanNode = useCallback((a: PlanNode, b: PlanNode) =>
    a.type === b.type && a.id === b.id && a.planId === b.planId,
    []
  )

  // Computed: all selected nodes (always includes activePlanNode)
  const selectedPlanNodes = useMemo(() => {
    const nodes = [activePlanNode, ...additionalSelectedNodes]
    // Deduplicate (including planId for cross-plan support)
    return nodes.filter((node, index, arr) =>
      arr.findIndex(n => isSamePlanNode(n, node)) === index
    )
  }, [activePlanNode, additionalSelectedNodes, isSamePlanNode])

  // Check if a node is selected
  const isNodeSelected = useCallback((node: PlanNode) =>
    selectedPlanNodes.some(n => isSamePlanNode(n, node)),
    [selectedPlanNodes, isSamePlanNode]
  )

  // Tracks whether the user has explicitly selected a plan node (used to suppress selection styling until first click)
  const userHasSelectedPlanNodeRef = useRef(false)
  const [hasUserSelectedNode, setHasUserSelectedNode] = useState(false)

  // Map from node type to dynamic coachmark id
  const nodeTypeToCoachmarkId: Record<string, string> = useMemo(
    () => ({ plan: "pricing-plan", rateCard: "rate-card", rate: "rate", rateMeter: "meter", subscriptionFee: "subscription-fee" }),
    []
  )

  // Ref to read editingPricingPlanId inside handleNodeSelect without a block-scope ordering issue
  const editingPricingPlanIdRef = useRef<number | null>(null)

  // Handle node selection with shift/command-click support
  // Supports cross-plan multi-select - forms will look up each node's source plan data
  const handleNodeSelect = useCallback((node: PlanNode, shiftKey: boolean) => {
    userHasSelectedPlanNodeRef.current = true
    setHasUserSelectedNode(true)

    // Dynamic coachmarks: dismiss any open coachmark on every click, and show a new one if applicable
    const currentEditingId = editingPricingPlanIdRef.current
    if (currentEditingId == null || currentEditingId === EXAMPLE_PLAN_ID) {
      setActiveCoachmark(null)
    } else {
      const coachmarkId = nodeTypeToCoachmarkId[node.type]
      if (!coachmarkId || !DYNAMIC_COACHMARK_MAP[coachmarkId]) {
        setActiveCoachmark(null)
      } else {
        setSeenCoachmarks((prev) => {
          if (prev.has(coachmarkId)) {
            // Already seen — just dismiss current coachmark
            setActiveCoachmark(null)
            return prev
          }
          const next = new Set(prev)
          next.add(coachmarkId)
          setActiveCoachmark(coachmarkId)
          return next
        })
      }
    }

    if (shiftKey) {
      // Shift/Cmd+click: toggle node in additional selection
      if (isSamePlanNode(node, activePlanNode)) {
        // Can't deselect the active node with shift-click
        return
      }
      setAdditionalSelectedNodes(prev => {
        const isAlreadySelected = prev.some(n => isSamePlanNode(n, node))
        if (isAlreadySelected) {
          return prev.filter(n => !isSamePlanNode(n, node))
        }
        return [...prev, node]
      })
    } else {
      // Regular click: set as active node and clear additional selection
      setActivePlanNode(node)
      setAdditionalSelectedNodes([])
      setShowFieldHints(false)
    }
  }, [activePlanNode, isSamePlanNode, nodeTypeToCoachmarkId])

  // Handle closing a specific additional form (removes from multi-selection)
  const handleCloseAdditionalForm = useCallback((node: PlanNode) => {
    setAdditionalSelectedNodes(prev => prev.filter(n => !isSamePlanNode(n, node)))
  }, [isSamePlanNode])

  const [pendingFocusRateId, setPendingFocusRateId] = useState<number | null>(null)
  const [planExpandedRateCards, setPlanExpandedRateCards] = useState<Record<number, boolean>>({})
  const [showRateCardAdvanced, setShowRateCardAdvanced] = useState(false)
  const [showRateAdvanced, setShowRateAdvanced] = useState(false)
  const [showCreditAdvanced, setShowCreditAdvanced] = useState(false)
  const [showPlanAdvanced, setShowPlanAdvanced] = useState(false)
  const [showSubscriptionFeeAdvanced, setShowSubscriptionFeeAdvanced] = useState(false)
  const [rateCardLookupKeys, setRateCardLookupKeys] = useState<Record<number, string>>({})
  const [rateCardServicingPeriods, setRateCardServicingPeriods] = useState<Record<number, string>>({})
  const [rateCardMetadataRows, setRateCardMetadataRows] = useState<Record<number, number[]>>({})
  const [rateCardMetadataValues, setRateCardMetadataValues] = useState<
    Record<number, Record<number, { key: string; value: string }>>
  >({})
  const [rateMeters, setRateMeters] = useState<Record<number, string>>({})
  const [availablePlanMeterOptions, setAvailablePlanMeterOptions] = useState<string[]>(defaultMeterOptions)
  const SAVED_RATE_NAMES_KEY = "stripe-saved-rate-names"
  const SAVED_FEE_NAMES_KEY = "stripe-saved-fee-names"
  const [savedRateNames, setSavedRateNames] = useState<string[]>(() => {
    if (typeof window === "undefined") return []
    try {
      const stored = window.localStorage.getItem(SAVED_RATE_NAMES_KEY)
      const parsed = stored ? JSON.parse(stored) : null
      return parsed && parsed.length > 0 ? parsed : ["API calls", "Storage GB", "Compute hours", "Seats", "Messages sent"]
    } catch { return ["API calls", "Storage GB", "Compute hours", "Seats", "Messages sent"] }
  })
  const [savedFeeNames, setSavedFeeNames] = useState<string[]>(() => {
    if (typeof window === "undefined") return []
    try {
      const stored = window.localStorage.getItem(SAVED_FEE_NAMES_KEY)
      const parsed = stored ? JSON.parse(stored) : null
      return parsed && parsed.length > 0 ? parsed : ["Platform fee", "Base subscription", "Membership"]
    } catch { return ["Platform fee", "Base subscription", "Membership"] }
  })
  const [planRateMeterConfigs, setPlanRateMeterConfigs] = useState<
    Record<
      number,
      {
        name: string
        eventName: string
        aggregationMethod: string
        eventTimeWindow: string
        showCountingOptions: boolean
        valueKeyOverride: string
      }
    >
  >({})
  const [ratePriceTypes, setRatePriceTypes] = useState<Record<number, string>>({})
  const [rateSellAs, setRateSellAs] = useState<Record<number, string>>({})
  const [ratePriceVariants, setRatePriceVariants] = useState<Record<number, { label: string; price: string; cadence: string; meter: string; priceType: string; sellAs: string; unitLabel: string }[]>>({})
  const [rateUnitLabels, setRateUnitLabels] = useState<Record<number, string>>({})
  const [rateTaxCodes, setRateTaxCodes] = useState<Record<number, string>>({})
  const [rateItemLookupKeys, setRateItemLookupKeys] = useState<Record<number, string>>({})
  const [rateItemMetadataRows, setRateItemMetadataRows] = useState<Record<number, number[]>>({})
  const [rateItemMetadataValues, setRateItemMetadataValues] = useState<
    Record<number, Record<number, { key: string; value: string }>>
  >({})
  const [rateSettingsMetadataRows, setRateSettingsMetadataRows] = useState<Record<number, number[]>>({})
  const [rateSettingsMetadataValues, setRateSettingsMetadataValues] = useState<
    Record<number, Record<number, { key: string; value: string }>>
  >({})
  const [creditGrantAmounts, setCreditGrantAmounts] = useState<Record<number, string>>({})
  const [creditGrantPeriods, setCreditGrantPeriods] = useState<Record<number, string>>({})
  const [creditGrantApplications, setCreditGrantApplications] = useState<Record<number, string>>({})
  const [creditGrantLookupKeys, setCreditGrantLookupKeys] = useState<Record<number, string>>({})
  const [creditGrantItemMetadataRows, setCreditGrantItemMetadataRows] = useState<Record<number, number[]>>({})
  const [creditGrantItemMetadataValues, setCreditGrantItemMetadataValues] = useState<
    Record<number, Record<number, { key: string; value: string }>>
  >({})
  const [creditGrantInstanceMetadataRows, setCreditGrantInstanceMetadataRows] = useState<Record<number, number[]>>({})
  const [creditGrantInstanceMetadataValues, setCreditGrantInstanceMetadataValues] = useState<
    Record<number, Record<number, { key: string; value: string }>>
  >({})
  const [planMetadataRows, setPlanMetadataRows] = useState<Record<number, number[]>>({})
  const [planMetadataValues, setPlanMetadataValues] = useState<
    Record<number, Record<number, { key: string; value: string }>>
  >({})
  const [subscriptionFeeAmounts, setSubscriptionFeeAmounts] = useState<Record<number, string>>({})
  const [subscriptionFeePeriods, setSubscriptionFeePeriods] = useState<Record<number, string>>({})
  const [subscriptionFeePriceTypes, setSubscriptionFeePriceTypes] = useState<Record<number, string>>({})
  const [subscriptionFeeSellAs, setSubscriptionFeeSellAs] = useState<Record<number, string>>({})
  const [subscriptionFeeUnitLabels, setSubscriptionFeeUnitLabels] = useState<Record<number, string>>({})
  const [subscriptionFeeTaxCodes, setSubscriptionFeeTaxCodes] = useState<Record<number, string>>({})
  const [subscriptionFeeItemLookupKeys, setSubscriptionFeeItemLookupKeys] = useState<Record<number, string>>({})
  const [subscriptionFeeFeeLookupKeys, setSubscriptionFeeFeeLookupKeys] = useState<Record<number, string>>({})
  const [subscriptionFeeItemMetadataRows, setSubscriptionFeeItemMetadataRows] = useState<Record<number, number[]>>({})
  const [subscriptionFeeFeeMetadataRows, setSubscriptionFeeFeeMetadataRows] = useState<Record<number, number[]>>({})
  const [subscriptionFeeItemMetadataValues, setSubscriptionFeeItemMetadataValues] = useState<
    Record<number, Record<number, { key: string; value: string }>>
  >({})
  const [subscriptionFeeFeeMetadataValues, setSubscriptionFeeFeeMetadataValues] = useState<
    Record<number, Record<number, { key: string; value: string }>>
  >({})
  const [isAddPlanObjectOpen, setIsAddPlanObjectOpen] = useState(false)
  const [isAddPlanObjectFromMap, setIsAddPlanObjectFromMap] = useState(false)
  const addPlanObjectButtonRef = useRef<HTMLButtonElement | null>(null)
  const addPlanObjectPopoverRef = useRef<HTMLDivElement | null>(null)

  // Tree nav slide-out state
  const [isTreeNavOpen, setIsTreeNavOpen] = useState(false)
  const [hasTreeChanges, setHasTreeChanges] = useState(false)

  // Onboarding popover state
  const [getStartedDismissed, setGetStartedDismissed] = useState(false)
  const [isInlineGetStartedActive, setIsInlineGetStartedActive] = useState(false)
  // Drives the modal header's primary button while the inline "Get started"
  // wizard is active. The wizard registers its current submit handler /
  // canSubmit on this ref each render; the header reads them via state below.
  const wizardSubmitRef = useRef<{ submit: () => void; canSubmit: boolean } | null>(null)
  const [isWizardSubmittable, setIsWizardSubmittable] = useState(false)
  // True while the inline Get started wizard is in its simulated 2s load
  // state (progress bar running). Used to dim the preview / chrome.
  const [isWizardLoading, setIsWizardLoading] = useState(false)
  const [navHintDismissed, setNavHintDismissed] = useState(false)
  const [showNavHint, setShowNavHint] = useState(false)
  const [isNewPlanSession, setIsNewPlanSession] = useState(false)
  const [onboardingTourStep, setOnboardingTourStep] = useState<1 | 2 | 3 | null>(null)
  // Dismiss onboarding tour step 2 when add popover closes without selecting
  const prevAddPlanObjectOpenRef = useRef(isAddPlanObjectOpen)
  useEffect(() => {
    const wasOpen = prevAddPlanObjectOpenRef.current
    prevAddPlanObjectOpenRef.current = isAddPlanObjectOpen
    // Only dismiss when going from open → closed while on step 2
    if (wasOpen && !isAddPlanObjectOpen && onboardingTourStep === 2) {
      setOnboardingTourStep(null)
    }
  }, [isAddPlanObjectOpen, onboardingTourStep])
  const addedItemCountRef = useRef(0)
  const hasOpenedNavRef = useRef(false)
  const [showSidebarTip, setShowSidebarTip] = useState(false)
  // Refs for onboarding popover anchors
  const hamburgerButtonRef = useRef<HTMLButtonElement | null>(null)
  const formAddButtonRef = useRef<HTMLButtonElement | null>(null)
  const [addPlanObjectPopoverPosition, setAddPlanObjectPopoverPosition] = useState<{ top: number; left: number; above?: boolean; centerY?: boolean } | null>(
    null
  )

  // Context menu state for right-click menus
  const [contextMenuPosition, setContextMenuPosition] = useState<{ top: number; left: number } | null>(null)
  const [contextMenuNodeType, setContextMenuNodeType] = useState<PlanNode["type"] | null>(null)
  const [contextMenuNodeId, setContextMenuNodeId] = useState<number | undefined>(undefined)
  const [contextMenuLabel, setContextMenuLabel] = useState<string>("")

  // Clipboard state for copy/paste settings
  type ClipboardContent = {
    type: 'rateCard' | 'rate' | 'rateMeter' | 'creditGrant' | 'subscriptionFee'
    data: Record<string, unknown>
  }
  const [clipboardContent, setClipboardContent] = useState<ClipboardContent | null>(null)

  useEffect(() => {
    console.log("[copySettings] clipboardContent changed:", clipboardContent ? { type: clipboardContent.type, dataKeys: Object.keys(clipboardContent.data) } : null)
  }, [clipboardContent])

  // Meter form state
  const {
    meterName,
    setMeterName,
    meterEventName,
    setMeterEventName,
    aggregationMethod,
    setAggregationMethod,
    eventTimeWindow,
    setEventTimeWindow,
    valueKeyOverride,
    setValueKeyOverride,
    showCountingOptions,
    setShowCountingOptions,
  } = useMeterFormState()

  // Price form state
  const {
    chargeFrequency,
    setChargeFrequency,
    pricingModel,
    setPricingModel,
    billingPeriod,
    setBillingPeriod,
    includeTax,
    setIncludeTax,
    tieredBy,
    setTieredBy,
    tiers,
    setTiers,
    tierToValues,
    setTierToValues,
    tierUnitPrices,
    setTierUnitPrices,
    tierFlatFees,
    setTierFlatFees,
    usageBasis,
    setUsageBasis,
    meter,
    setMeter,
    pricingCurrencies,
    setPricingCurrencies,
    activeCurrencyId,
    setActiveCurrencyId,
    currencyAmounts,
    setCurrencyAmounts,
    primaryCurrencyCode,
    showInternalReference,
    setShowInternalReference,
    priceDescription,
    setPriceDescription,
    lookupKey,
    setLookupKey,
    collapsedPrices,
    setCollapsedPrices,
    editingPriceId,
    setEditingPriceId,
    priceNamesById,
    setPriceNamesById,
    priceFormInstance,
    setPriceFormInstance,
    showPriceForm,
    setShowPriceForm,
    shouldAnimatePriceForm,
    setShouldAnimatePriceForm,
    priceDraftName,
    setPriceDraftName,
    resetPriceFormToDefaults,
    captureCurrentPriceConfig,
    applyPriceConfig,
  } = usePriceFormState()

  // UI state
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [isSimplifiedProductPopoverOpen, setIsSimplifiedProductPopoverOpen] = useState(false)
  const [isNewProductFullScreenOpen, setIsNewProductFullScreenOpen] = useState(false)
  const [newProductFullScreenData, setNewProductFullScreenData] = useState<{ name?: string; description?: string; taxCode?: string; taxBehavior?: string; chargeType?: string; amount?: string; currency?: string; cadence?: string; productType?: string; meter?: string; prices?: { chargeType?: "Recurring" | "One-off"; pricingModel?: string; amount?: string; currency?: string; billingPeriod?: string; unitLabel?: string; meter?: string }[] } | undefined>(undefined)
  const [activeObjectForm, setActiveObjectForm] = useState<"product" | "price" | "meter">("product")
  const [isAssistantOpen, setIsAssistantOpen] = useState(false)
  const [isPlanAssistantOpen, setIsPlanAssistantOpen] = useState(false)
  const [assistantSeedPrompt, setAssistantSeedPrompt] = useState<string | null>(null)
  const [planAssistantSeedPrompt, setPlanAssistantSeedPrompt] = useState<string | null>(null)
  const [assistantDraftReference, setAssistantDraftReference] = useState<AssistantReference | null>(null)
  const [planAssistantDraftReference, setPlanAssistantDraftReference] = useState<AssistantReference | null>(null)
  const [, setAssistantPanelReady] = useState(false)
  const [, setPlanAssistantPanelReady] = useState(false)
  const isAssistantOpenRef = useRef(false)
  const isPlanAssistantOpenRef = useRef(false)
  const [isPlanAssistantApplying, setIsPlanAssistantApplying] = useState(false)
  const [scopedProductAiGeneratingKey, setScopedProductAiGeneratingKey] = useState<string | null>(null)
  const [scopedPlanAiGeneratingKey, setScopedPlanAiGeneratingKey] = useState<string | null>(null)
  const [planScopedAiPreviewHighlightedKeys, setPlanScopedAiPreviewHighlightedKeys] = useState<string[]>([])
  const [planScopedAiLoadingKeys, setPlanScopedAiLoadingKeys] = useState<string[]>([])
  const {
    chatPanelWidthPx,
    resizeContainerRef,
    beginResize,
    resetPanelWidths,
  } = useModalPanelResize({
    initialFormPx: 460,
    initialChatPx: 320,
    isAssistantOpen,
    leftPanelMinPx: LEFT_PANEL_MIN_PX,
    formPanelMinPx: FORM_PANEL_MIN_PX,
    chatPanelMinPx: CHAT_PANEL_MIN_PX,
    chatPanelMaxPx: CHAT_PANEL_MAX_PX,
  })
  const { value: products, setValue: setProducts } = useProductCatalogStorage<ProductRow[]>({
    storageKey: PRODUCT_CATALOG_STORAGE_KEY,
    initialValue: VERCEL_PRODUCTS,
    isValid: (value): value is ProductRow[] => Array.isArray(value),
  })
  const { value: pricingPlans, setValue: setPricingPlans, save: savePricingPlans } = useProductCatalogStorage<PricingPlanRow[]>({
    storageKey: PRICING_PLAN_STORAGE_KEY,
    initialValue: VERCEL_PLANS,
    isValid: (value): value is PricingPlanRow[] => Array.isArray(value),
    manualSaveOnly: true, // Only persist when explicitly saved (not on every state change)
  })
  const addProductButtonRef = useRef<HTMLButtonElement>(null)
  const addProductPopoverRef = useRef<HTMLDivElement | null>(null)
  const [isAddProductPopoverOpen, setIsAddProductPopoverOpen] = useState(false)
  const [addProductPopoverPosition, setAddProductPopoverPosition] = useState<{ top: number; left: number } | null>(
    null
  )
  const addProductPromptRef = useRef<HTMLTextAreaElement | null>(null)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [isObjectActionsOpen, setIsObjectActionsOpen] = useState(false)
  const objectActionsButtonRef = useRef<HTMLButtonElement | null>(null)
  const objectActionsMenuRef = useRef<HTMLDivElement | null>(null)
  const [isPlanActionsOpen, setIsPlanActionsOpen] = useState(false)
  const planActionsButtonRef = useRef<HTMLButtonElement | null>(null)
  const planActionsMenuRef = useRef<HTMLDivElement | null>(null)

  // Products state (persisted via `useProductCatalogStorage`)
  const [editingPricingPlanId, setEditingPricingPlanId] = useState<number | null>(null)
  editingPricingPlanIdRef.current = editingPricingPlanId
  const { onboardingMode } = useOnboardingMode()
  const isPlanStructurallyEmpty =
    planRateCards.length === 0 &&
    planRates.length === 0 &&
    planSubscriptionFees.length === 0 &&
    planCreditGrants.length === 0
  // "Get Started" shows whenever the pricing plan editor loads (only in tips mode)
  const showGetStarted = onboardingMode === "tips" && !getStartedDismissed && isPricingPlanModalOpen

  // Sidebar is always open unless Get Started is active
  useEffect(() => {
    if (!showGetStarted && isPricingPlanModalOpen) {
      setIsTreeNavOpen(true)
    }
  }, [showGetStarted, isPricingPlanModalOpen])

  useEffect(() => {
    if (
      isPricingPlanModalOpen &&
      onboardingMode === "form" &&
      activePlanNode.type === "plan" &&
      !getStartedDismissed &&
      isPlanStructurallyEmpty
    ) {
      setIsInlineGetStartedActive(true)
    }
  }, [isPricingPlanModalOpen, onboardingMode, activePlanNode.type, getStartedDismissed, isPlanStructurallyEmpty])

  useEffect(() => {
    if (getStartedDismissed || activePlanNode.type !== "plan") {
      setIsInlineGetStartedActive(false)
    }
  }, [getStartedDismissed, activePlanNode.type])

  const numberFormatter = useMemo(() => createNumberFormatter(), [])

  const getPlanRateCardLabel = (card?: PlanRateCard | null) =>
    getPlanLabel(card?.name ?? "", t("Product"))

  const getPlanRateLabel = (rate?: PlanRate | null) => {
    if (rate?.name) return rate.name
    const unitPrice = planRateUnitPrices[rate?.id ?? -1]
    if (unitPrice) {
      const unitLabel = rateUnitLabels[rate?.id ?? -1]
      return unitLabel ? `$${unitPrice} / ${unitLabel}` : `$${unitPrice}`
    }
    return t("Price")
  }

  const getPlanCreditGrantLabel = (grant?: PlanNamedItem | null) =>
    getPlanLabel(grant?.name ?? "", t("Credit grant"))

  const getPlanSubscriptionFeeLabel = (fee?: PlanNamedItem | null) =>
    getPlanLabel(fee?.name ?? "", t("Subscription fee"))

  const getPriceLabel = (price: PriceSummary | null) => {
    if (!price) return t("Untitled price")
    const name = (priceNamesById[price.id] ?? "").trim()
    if (name !== "") return name
    return t("Untitled price")
  }

  const activePlanRateCard =
    planRateCards.find((card) => card.id === activePlanRateCardId) ?? planRateCards[0] ?? null
  const planUsageEntries = planUsageScenarioRates
    .map((rateId) => {
      const rate = getAllRates(planRateCards, planRates).find((item) => item.id === rateId)
      if (!rate) return null
      const quantity = parseNumberValue(planRateUsage[rate.id] ?? "0") ?? 0
      const priceType = (ratePriceTypes[rate.id] ?? planPriceTypeOptions[0]).trim()
      const fixedUnitPrice = parseNumberValue(planRateUnitPrices[rate.id] ?? "0") ?? 0

      const tierIds = planRateTiers[rate.id] ?? [0, 1]
      const tierToValues = planRateTierToValues[rate.id] ?? {}
      const tierUnitPrices = planRateTierUnitPrices[rate.id] ?? {}
      const tierFlatFees = planRateTierFlatFees[rate.id] ?? {}
      const tierRanges = tierIds.reduce<{ id: number; from: number; to: number; unitPrice: number; flatFee: number }[]>(
        (acc, id, index) => {
          const isLast = index === tierIds.length - 1
          const defaultTo = (index + 1) * 1000
          const toRaw = tierToValues[id] || numberFormatter.format(defaultTo)
          const parsedTo = isLast ? Infinity : parseNumberValue(toRaw || `${defaultTo}`)
          const previousTo = acc[index - 1]?.to ?? 0
          acc.push({
            id,
            from: index === 0 ? 0 : previousTo + 1,
            to: isLast ? Infinity : parsedTo,
            unitPrice: parseNumberValue(tierUnitPrices[id] || "0"),
            flatFee: parseNumberValue(tierFlatFees[id] || "0"),
          })
          return acc
        },
        []
      )

      const isTiered = priceType === "Graduated" || priceType === "Volume"
      const activeTier = isTiered
        ? tierRanges.find((tier) => quantity <= tier.to) ?? tierRanges[tierRanges.length - 1] ?? null
        : null
      const unitPrice = isTiered ? activeTier?.unitPrice ?? 0 : fixedUnitPrice
      const total = isTiered
        ? priceType === "Graduated"
          ? tierRanges.reduce((sum, tier) => {
              const upper = tier.to === Infinity ? quantity : Math.min(quantity, tier.to)
              const units = Math.max(0, upper - tier.from + (tier.from === 0 ? 0 : 1))
              if (!units) return sum
              return sum + units * tier.unitPrice + tier.flatFee
            }, 0)
          : quantity * unitPrice + (activeTier?.flatFee ?? 0)
        : quantity * unitPrice
      return {
        id: rate.id,
        name: getPlanRateLabel(rate),
        quantity,
        unitPrice,
        total,
      }
    })
    .filter(Boolean) as {
    id: number
    name: string
    quantity: number
    unitPrice: number
    total: number
  }[]
  const planUsageTotal = planUsageEntries.reduce((sum, entry) => sum + entry.total, 0)
  const planSubscriptionFeeAmount = Object.values(subscriptionFeeAmounts).reduce((sum, value) => {
    return sum + (parseNumberValue(value ?? "0") ?? 0)
  }, 0)
  const planSubtotal = planUsageTotal + planSubscriptionFeeAmount
  const planSalesTax = planSubtotal * 0.05
  const planTotal = planSubtotal + planSalesTax

  // Memoized current plan draft for multi-plan preview
  const currentPlanDraft = useMemo<PricingPlanDraft>(() => ({
    planName,
    planDescription,
    planCurrency,
    planLookupKey,
    planTaxTreatment,
    planPriceGroups,
    planRateCards,
    planRates,
    activePlanRateCardId,
    planRateUsage,
    planRateUnitPrices,
    planRateTiers,
    planRateTierToValues,
    planRateTierUnitPrices,
    planRateTierFlatFees,
    planRateIncludeTax,
    planRateCurrencies,
    planRateActiveCurrencyId,
    planUsageScenarioRates,
    planCreditGrants,
    planSubscriptionFees,
    planExpandedRateCards,
    showRateCardAdvanced,
    showRateAdvanced,
    showCreditAdvanced,
    showSubscriptionFeeAdvanced,
    rateCardLookupKeys,
    rateCardServicingPeriods,
    rateCardMetadataRows,
    rateCardMetadataValues,
    rateMeters,
    availablePlanMeterOptions,
    planRateMeterConfigs,
    ratePriceTypes,
    rateSellAs,
    rateUnitLabels,
    rateTaxCodes,
    rateItemLookupKeys,
    rateItemMetadataRows,
    rateItemMetadataValues,
    rateSettingsMetadataRows,
    rateSettingsMetadataValues,
    creditGrantAmounts,
    creditGrantPeriods,
    creditGrantApplications,
    creditGrantLookupKeys,
    subscriptionFeeAmounts,
    subscriptionFeePeriods,
    subscriptionFeePriceTypes,
    subscriptionFeeSellAs,
    subscriptionFeeUnitLabels,
    subscriptionFeeTaxCodes,
    subscriptionFeeItemLookupKeys,
    subscriptionFeeFeeLookupKeys,
    subscriptionFeeItemMetadataRows,
    subscriptionFeeFeeMetadataRows,
    subscriptionFeeItemMetadataValues,
    subscriptionFeeFeeMetadataValues,
  }), [
    planName, planDescription, planCurrency, planLookupKey, planTaxTreatment, planPriceGroups,
    planRateCards, planRates, activePlanRateCardId, planRateUsage, planRateUnitPrices,
    planRateTiers, planRateTierToValues, planRateTierUnitPrices, planRateTierFlatFees,
    planRateIncludeTax, planRateCurrencies, planRateActiveCurrencyId, planUsageScenarioRates,
    planCreditGrants, planSubscriptionFees, planExpandedRateCards,
    showRateCardAdvanced, showRateAdvanced, showCreditAdvanced, showSubscriptionFeeAdvanced,
    rateCardLookupKeys, rateCardServicingPeriods, rateCardMetadataRows, rateCardMetadataValues,
    rateMeters, availablePlanMeterOptions, planRateMeterConfigs,
    ratePriceTypes, rateSellAs, rateUnitLabels, rateTaxCodes,
    rateItemLookupKeys, rateItemMetadataRows, rateItemMetadataValues,
    rateSettingsMetadataRows, rateSettingsMetadataValues,
    creditGrantAmounts, creditGrantPeriods, creditGrantApplications, creditGrantLookupKeys,
    subscriptionFeeAmounts, subscriptionFeePeriods, subscriptionFeePriceTypes, subscriptionFeeSellAs,
    subscriptionFeeUnitLabels, subscriptionFeeTaxCodes, subscriptionFeeItemLookupKeys, subscriptionFeeFeeLookupKeys,
    subscriptionFeeItemMetadataRows, subscriptionFeeFeeMetadataRows, subscriptionFeeItemMetadataValues, subscriptionFeeFeeMetadataValues,
  ])

  const locationOptions = useMemo(() => {
    const seen = new Set<string>()
    const options: string[] = []
    pricingCurrencies.forEach((currency) => {
      const code = currency.code?.trim().toUpperCase()
      if (!code) return
      const label = getLocationLabel(code)
      if (seen.has(label)) return
      seen.add(label)
      options.push(label)
    })
    if (!options.length) options.push("USA")
    return options
  }, [pricingCurrencies])

  const stateOptions = stateOptionsByLocation[previewLocation] ?? ["Alaska"]

  useEffect(() => {
    if (!locationOptions.includes(previewLocation)) {
      setPreviewLocation(locationOptions[0] ?? "USA")
    }
  }, [locationOptions, previewLocation])

  useEffect(() => {
    if (!stateOptions.includes(previewState)) {
      setPreviewState(stateOptions[0] ?? "Alaska")
    }
  }, [stateOptions, previewState])

  useEffect(() => {
    // Initialize usage scenario with a single default rate, without overriding user edits.
    // NOTE: We intentionally do NOT auto-add multiple "provider defaults" (e.g. GPT/Claude) — the receipt should
    // only reflect what the user adds in the modeller.
    if (hasUserEditedPlanUsageScenarioRef.current) return

    const allRateIds = new Set<number>()
    planRateCards.forEach((card) => card.rates.forEach((r) => allRateIds.add(r.id)))

    // If the current selection is still valid (all ids exist), keep it.
    if (planUsageScenarioRates.length > 0 && planUsageScenarioRates.every((id) => allRateIds.has(id))) {
      return
    }

    // Pick the first named rate we can find; fall back to the first rate.
    const allRatesFlat = getAllRates(planRateCards, planRates)
    const firstNamed =
      allRatesFlat.find((r) => r.name.trim() !== "") ??
      allRatesFlat[0] ??
      null

    if (!firstNamed) return

    setPlanUsageScenarioRates([firstNamed.id])
  }, [planRateCards, planUsageScenarioRates])

  useEffect(() => {
    // Heal older/buggy AI-created tier ranges that were left with placeholder-ish "To" values (e.g. 1000/2000/3000),
    // which makes the modeller slider max too small and can leave blank "To" inputs.
    if (!isPricingPlanModalOpen) return

    const rateNameById = new Map<number, string>()
    planRateCards.forEach((card) => {
      card.rates.forEach((rate) => {
        rateNameById.set(rate.id, rate.name ?? "")
      })
    })

    const updates: Record<number, Record<number, string>> = {}

    Object.entries(planRateTiers).forEach(([rateIdRaw, tierIds]) => {
      const rateId = Number(rateIdRaw)
      if (!Number.isFinite(rateId)) return
      if (!Array.isArray(tierIds) || tierIds.length < 4) return

      const name = (rateNameById.get(rateId) ?? "").trim()
      const isAiModelRate = /gpt|gemini|claude|anthropic|openai/i.test(name)
      if (!isAiModelRate) return

      const [tier0, tier1, tier2] = tierIds
      if (tier0 == null || tier1 == null || tier2 == null) return

      const current = planRateTierToValues[rateId] ?? {}
      const raw0 = (current[tier0] ?? "").trim()
      const raw1 = (current[tier1] ?? "").trim()
      const raw2 = (current[tier2] ?? "").trim()

      const p0 = parseNumberValue(raw0)
      const p1 = parseNumberValue(raw1)
      const p2 = parseNumberValue(raw2)

      const missingOrBlank = raw0 === "" || raw1 === "" || raw2 === ""
      const looksPlaceholderLike = (p1 != null && p1 <= 3000) || (p2 != null && p2 <= 5000)
      const invalidOrder = (p0 != null && p1 != null && p0 >= p1) || (p1 != null && p2 != null && p1 >= p2)

      if (!missingOrBlank && !looksPlaceholderLike && !invalidOrder) return

      const nextForRate: Record<number, string> = {
        ...current,
        [tier0]: numberFormatter.format(1000),
        [tier1]: numberFormatter.format(10000),
        [tier2]: numberFormatter.format(100000),
      }

      if (
        nextForRate[tier0] === current[tier0] &&
        nextForRate[tier1] === current[tier1] &&
        nextForRate[tier2] === current[tier2]
      ) {
        return
      }

      updates[rateId] = nextForRate
    })

    const updateRateIds = Object.keys(updates)
    if (!updateRateIds.length) return

    setPlanRateTierToValues((prev) => {
      let changed = false
      const next = { ...prev }
      updateRateIds.forEach((rateIdStr) => {
        const rateId = Number(rateIdStr)
        if (!Number.isFinite(rateId)) return
        const nextMap = updates[rateId]
        if (!nextMap) return
        if (next[rateId] === nextMap) return
        next[rateId] = nextMap
        changed = true
      })
      return changed ? next : prev
    })
  }, [isPricingPlanModalOpen, planRateCards, planRateTiers, planRateTierToValues])

  useEffect(() => {
    // Heal buggy AI-created tier pricing where the last/open-ended (∞) tier is missing a unit price.
    // This doesn't make sense in the UI and breaks usage scenario estimates.
    if (!isPricingPlanModalOpen) return

    const rateNameById = new Map<number, string>()
    planRateCards.forEach((card) => {
      card.rates.forEach((rate) => {
        rateNameById.set(rate.id, rate.name ?? "")
      })
    })

    const updates: Record<number, Record<number, string>> = {}

    Object.entries(planRateTiers).forEach(([rateIdRaw, tierIds]) => {
      const rateId = Number(rateIdRaw)
      if (!Number.isFinite(rateId)) return
      if (!Array.isArray(tierIds) || tierIds.length < 2) return

      const priceType = ratePriceTypes[rateId] ?? "Fixed rate"
      if (priceType !== "Graduated" && priceType !== "Volume") return

      const lastTierId = tierIds[tierIds.length - 1]
      if (lastTierId == null) return

      const current = planRateTierUnitPrices[rateId] ?? {}
      const lastRaw = (current[lastTierId] ?? "").trim()
      if (lastRaw !== "") return

      const rateName = (rateNameById.get(rateId) ?? "").trim()
      let fallback = ""

      // Prefer a deterministic AI-model seed when the rate looks like a known LLM model.
      if (isAiModelRateNameFromAssistant(rateName)) {
        const seed = getAiModelSeedPricingFromAssistant(rateName)
        const seedIndex = Math.min(Math.max(0, tierIds.length - 1), Math.max(0, seed.unitPrices.length - 1))
        fallback = (seed.unitPrices[seedIndex] ?? seed.unitPrices[seed.unitPrices.length - 1] ?? "").trim()
      }

      // Otherwise, use the last non-empty earlier tier's unit price.
      if (!fallback) {
        for (let index = tierIds.length - 2; index >= 0; index -= 1) {
          const tierId = tierIds[index]
          if (tierId == null) continue
          const raw = (current[tierId] ?? "").trim()
          if (raw) {
            fallback = raw
            break
          }
        }
      }

      if (!fallback) return

      const nextForRate: Record<number, string> = { ...current, [lastTierId]: fallback }
      if (nextForRate[lastTierId] === current[lastTierId]) return
      updates[rateId] = nextForRate
    })

    const updateRateIds = Object.keys(updates)
    if (!updateRateIds.length) return

    setPlanRateTierUnitPrices((prev) => {
      let changed = false
      const next = { ...prev }
      updateRateIds.forEach((rateIdStr) => {
        const rateId = Number(rateIdStr)
        if (!Number.isFinite(rateId)) return
        const nextMap = updates[rateId]
        if (!nextMap) return
        if (next[rateId] === nextMap) return
        next[rateId] = nextMap
        changed = true
      })
      return changed ? next : prev
    })
  }, [isPricingPlanModalOpen, planRateCards, planRateTiers, planRateTierUnitPrices, ratePriceTypes])

  useEffect(() => {
    setShowRateCardAdvanced(false)
    setShowRateAdvanced(false)
    setShowCreditAdvanced(false)
    setShowSubscriptionFeeAdvanced(false)
    setIsPlanActionsOpen(false)
  }, [activePlanNode.type, activePlanNode.id])

  useEffect(() => {
    const isTieredPreview =
      pricingModel === "Tiered pricing" || (pricingModel === "Usage-based" && usageBasis === "Tier")
    const tierRanges = tiers.reduce<{ to: number; from: number }[]>((acc, id, index) => {
      const isLast = index === tiers.length - 1
      const defaultTo = (index + 1) * 1000
      const toRaw = tierToValues[id] || numberFormatter.format(defaultTo)
      const parsedTo = isLast ? Infinity : parseNumberValue(toRaw || `${defaultTo}`)
      const previousTo = acc[index - 1]?.to ?? 0
      acc.push({
        from: index === 0 ? 0 : previousTo + 1,
        to: parsedTo,
      })
      return acc
    }, [])
    const lastFrom = tierRanges.length ? tierRanges[tierRanges.length - 1]!.from : 0
    const sliderMax = isTieredPreview ? Math.max(100, lastFrom * 2) : 100
    const current = parseNumberValue(previewUnitQuantity)
    if (!isTieredPreview && current > 100) {
      setPreviewUnitQuantity("1")
      return
    }
    if (current > sliderMax) {
      setPreviewUnitQuantity(numberFormatter.format(sliderMax))
    }
  }, [pricingModel, usageBasis, tiers, tierToValues, previewUnitQuantity, numberFormatter, parseNumberValue])
  // Sync pricing model with charge frequency
  useEffect(() => {
    const allowed = chargeFrequency === "Recurring" ? recurringPricingOptions : oneOffPricingOptions
    if (!allowed.includes(pricingModel)) {
      setPricingModel(allowed[0])
    }
  }, [chargeFrequency, pricingModel])

  useLockBodyScroll(isProductModalOpen || isSimplifiedProductPopoverOpen || isPricingPlanModalOpen || isNewProductFullScreenOpen)

  useDismissOnOutsidePointerDownAndEscape({
    isOpen: isObjectActionsOpen,
    anchorRef: objectActionsButtonRef,
    popoverRef: objectActionsMenuRef,
    onDismiss: () => setIsObjectActionsOpen(false),
  })

  useDismissOnOutsidePointerDownAndEscape({
    isOpen: isPlanActionsOpen,
    anchorRef: planActionsButtonRef,
    popoverRef: planActionsMenuRef,
    onDismiss: () => setIsPlanActionsOpen(false),
  })

  useSyncBoolRef(isAssistantOpen, isAssistantOpenRef, { onFalse: () => setAssistantPanelReady(false) })

  useSyncBoolRef(isPlanAssistantOpen, isPlanAssistantOpenRef, {
    onFalse: () => {
      setPlanAssistantPanelReady(false)
      setIsPlanAssistantApplying(false)
    },
  })

  usePointerUpCancel(usageScenarioDraggingRateId != null, () => setUsageScenarioDraggingRateId(null))

  useAutoClearAfterDelay(highlightedId, 1000, () => setHighlightedId(null))

  const triggerHighlight = (id: string) => {
    setHighlightedId(id)
  }

  const handlePricingModelChange = (next: string) => {
    setPricingModel(next)
    if (next === "Usage-based") {
      triggerHighlight("usage-basis")
      triggerHighlight("meter")
    } else if (next === "Tiered pricing" || next === "Package pricing" || next === "Flat rate") {
      triggerHighlight("pricing")
    }
  }

  const handleUsageBasisChange = (next: string) => {
    setUsageBasis(next)
    triggerHighlight("pricing")
    if (next === "Tier") {
      triggerHighlight("tiered-by")
    }
  }

  const handleMeterChange = (next: string) => {
    setMeter(next)
  }

  const handleAddTier = () => {
    setTiers((prev) => {
      const nextId = prev.length ? Math.max(...prev) + 1 : 0
      setTierToValues((values) => ({ ...values, [nextId]: "" }))
      setTierUnitPrices((values) => ({ ...values, [nextId]: "" }))
      setTierFlatFees((values) => ({ ...values, [nextId]: "" }))
      return [...prev, nextId]
    })
  }

  const handleRemoveTier = (id: number) => {
    setTiers((prev) => {
      if (prev.length <= 1) return prev
      return prev.filter((tierId) => tierId !== id)
    })
    setTierToValues((values) => {
      const next = { ...values }
      delete next[id]
      return next
    })
    setTierUnitPrices((values) => {
      const next = { ...values }
      delete next[id]
      return next
    })
    setTierFlatFees((values) => {
      const next = { ...values }
      delete next[id]
      return next
    })
  }

  const handleAddCurrency = (code?: string) => {
    setPricingCurrencies((prev) => {
      const nextId = prev.length ? Math.max(...prev.map((c) => c.id)) + 1 : 0
      const newCurrency = { id: nextId, code: code ?? "" }
      if (code) {
        setActiveCurrencyId(nextId)
      }
      return [...prev, newCurrency]
    })
  }

  const handleDeleteCurrency = (id: number) => {
    setPricingCurrencies((prev) => {
      const filtered = prev.filter((c) => c.id !== id)
      if (activeCurrencyId === id && filtered.length > 0) {
        setActiveCurrencyId(filtered[0].id)
      }
      return filtered
    })
  }

  const handleCurrencyChange = (id: number, code: string) => {
    setPricingCurrencies((prev) => prev.map((c) => (c.id === id ? { ...c, code } : c)))
  }

  const getPriceSummaryLabel = () => {
    const primaryCurrency = pricingCurrencies[0]
    const amountForPrimary =
      primaryCurrency != null ? currencyAmounts[primaryCurrency.id]?.trim() ?? "" : ""
    const safeAmount = amountForPrimary !== "" ? amountForPrimary : "0.00"
    const billingLabel = getBillingLabelForPeriod(billingPeriod)
    return `$${safeAmount}|${billingLabel}`
  }

  const getPriceSummaryLabelFromConfig = (config: SavedPriceConfig) => {
    const primaryCurrency = config.currencies[0]
    const amountForPrimary =
      primaryCurrency != null ? config.currencyAmounts?.[primaryCurrency.id]?.trim() ?? "" : ""
    const safeAmount = amountForPrimary !== "" ? amountForPrimary : "0.00"
    const billingLabel = getBillingLabelForPeriod(config.billingPeriod)
    return `$${safeAmount}|${billingLabel}`
  }

  const draftPriceHasMeaningfulChanges = () => {
    if (Object.values(currencyAmounts).some((value) => value.trim() !== "")) return true
    if (chargeFrequency !== chargeFrequencyOptions[0]) return true
    if (pricingModel !== recurringPricingOptions[0]) return true
    if (usageBasis !== usageBasisOptions[0]) return true
    if (tieredBy !== tieredByOptions[0]) return true
    if (billingPeriod !== "Monthly") return true
    if (includeTax !== includeTaxOptions[0]) return true
    if (meter.trim() !== "") return true
    if (pricingCurrencies.length !== 1) return true
    if ((pricingCurrencies[0]?.code ?? "") !== "USD") return true
    if (tiers.length !== 2 || tiers[0] !== 0 || tiers[1] !== 1) return true
    return false
  }

  const handleAddPrice = () => {
    const summaryLabel = getPriceSummaryLabel()
    const config = captureCurrentPriceConfig()

    setCollapsedPrices((prev) => {
      const nextId =
        editingPriceId != null ? editingPriceId : prev.length ? Math.max(...prev.map((price) => price.id)) + 1 : 0
      const nextPrice: PriceSummary = {
        id: nextId,
        label: summaryLabel,
        config,
      }
      if (editingPriceId != null) {
        const exists = prev.some((price) => price.id === nextId)
        if (!exists) return [...prev, nextPrice]
        return prev.map((price) => (price.id === nextId ? nextPrice : price))
      }
      return [...prev, nextPrice]
    })

    setEditingPriceId(null)
    setShowPriceForm(false)

    resetPriceFormToDefaults()
    setShouldAnimatePriceForm(false)
    setPriceFormInstance((prev) => prev + 1)
    setIsAddPriceModalOpen(true)
  }

  const handleSaveAddPriceModal = () => {
    const summaryLabel = getPriceSummaryLabel()
    const config = captureCurrentPriceConfig()
    const nextId = Date.now()

    setCollapsedPrices((prev) => {
      const nextPrice: PriceSummary = { id: nextId, label: summaryLabel, config }
      return [...prev, nextPrice]
    })
    setPriceNamesById((prev) => ({ ...prev, [nextId]: "" }))

    setIsAddPriceModalOpen(false)
    applyPriceConfig(config)
    setEditingPriceId(nextId)
    setShowPriceForm(true)
  }

  const handleCloseAddPriceModal = () => {
    setIsAddPriceModalOpen(false)
  }

  const handleEditCollapsedPrice = (priceId: number) => {
    const price = collapsedPrices.find((item) => item.id === priceId)
    if (!price) return

    const currentConfig = captureCurrentPriceConfig()
    const currentSummaryLabel = getPriceSummaryLabel()
    const shouldPersistDraft = editingPriceId == null && draftPriceHasMeaningfulChanges()

    // If a price is currently open (draft or existing), collapse/persist it before switching.
    setCollapsedPrices((prev) => {
      if (editingPriceId != null) {
        const updated: PriceSummary = { id: editingPriceId, label: currentSummaryLabel, config: currentConfig }
        const exists = prev.some((p) => p.id === updated.id)
        return exists ? prev.map((p) => (p.id === updated.id ? updated : p)) : [...prev, updated]
      }
      if (shouldPersistDraft) {
        const nextId = prev.length ? Math.max(...prev.map((p) => p.id)) + 1 : 0
        const draft: PriceSummary = { id: nextId, label: currentSummaryLabel, config: currentConfig }
        return [...prev, draft]
      }
      return prev
    })

    applyPriceConfig(price.config)
    setEditingPriceId(priceId)
  }

  const handleDeleteCollapsedPrice = (priceId: number) => {
    setCollapsedPrices((prev) => prev.filter((item) => item.id !== priceId))
    setPriceNamesById((prev) => {
      if (!(priceId in prev)) return prev
      const next = { ...prev }
      delete next[priceId]
      return next
    })

    if (editingPriceId === priceId) {
      setEditingPriceId(null)
      resetPriceFormToDefaults()
    }
  }

  const handleOpenMeterBuilder = (mode: "create" | "edit" = "create") => {
    setActiveObjectForm("meter")
    setMeterName(mode === "edit" ? (meter.trim() || meterName) : "")
    setMeterEventName("")
    setAggregationMethod(aggregationMethodOptions[0])
    setEventTimeWindow(eventTimeWindowOptions[0])
    setValueKeyOverride("")
    setShowCountingOptions(false)
  }

  const handleSaveMeter = () => {
    const label = meterName.trim() || "Custom meter"
    setMeter(label)
    // After creating/editing a meter, return to the price form (meter selection remains on the price).
    setActiveObjectForm("price")
  }

  const resetProductFormToDefaults = () => {
    resetProductFieldsToDefaults()

    // Price
    resetPriceFormToDefaults()
    setCollapsedPrices([])
    setEditingPriceId(null)
    setPriceFormInstance((prev) => prev + 1)
    setShowPriceForm(true)
    setShouldAnimatePriceForm(false)
  }

  const applyProductToForm = (product: ProductRow) => {
    // Avoid leaking pricing/editor state between modal opens.
    resetPriceFormToDefaults()
    setCollapsedPrices([])
    setEditingPriceId(null)
    setShowPriceForm(true)
    setShouldAnimatePriceForm(false)
    setPriceFormInstance((prev) => prev + 1)
    setShowInternalReference(false)
    setPriceDescription("")
    setLookupKey("")

    setProductName(product.name ?? "")
    setProductDescription(product.description ?? "")
    setProductImageUrl(product.imageUrl ?? null)

    const normalizedCurrency = (product.currency ?? "USD").trim().toUpperCase() || "USD"
    setPricingCurrencies([{ id: 0, code: normalizedCurrency }])
    setActiveCurrencyId(0)
    setCurrencyAmounts({ 0: product.amount ?? "" })

    const draft = product.draft
    setChargeFrequency(draft?.chargeFrequency ?? chargeFrequencyOptions[0])
    setPricingModel(draft?.pricingModel ?? recurringPricingOptions[0])
    setUsageBasis(draft?.usageBasis ?? usageBasisOptions[0])
    setMeter(draft?.meter ?? "")
    setBillingPeriod(draft?.billingPeriod ?? product.billingPeriod ?? "Monthly")
    setIncludeTax(draft?.includeTax ?? includeTaxOptions[0])
    setTieredBy(draft?.tieredBy ?? tieredByOptions[0])
    const tiersFromDraft = draft?.tiers
    setTiers(Array.isArray(tiersFromDraft) && tiersFromDraft.length ? [...tiersFromDraft] : [0, 1])
    setTierToValues(draft?.tierToValues ? { ...draft.tierToValues } : {})
    setTierUnitPrices(draft?.tierUnitPrices ? { ...draft.tierUnitPrices } : {})
    setTierFlatFees(draft?.tierFlatFees ? { ...draft.tierFlatFees } : {})
    setProductTaxCode(draft?.productTaxCode ?? "Account default")
    setStatementDescriptor(draft?.statementDescriptor ?? "")
    setUnitLabel(draft?.unitLabel ?? "")
    const metadataFromDraft = draft?.metadataRows
    const featuresFromDraft = draft?.featureRows
    setMetadataRows(Array.isArray(metadataFromDraft) ? [...metadataFromDraft] : [])
    setFeatureRows(Array.isArray(featuresFromDraft) ? [...featuresFromDraft] : [])
    setMetadataValues(draft?.metadataValues ? { ...draft.metadataValues } : {})
    setFeatureValues(draft?.featureValues ? { ...draft.featureValues } : {})

    const hasAdditional =
      (draft?.statementDescriptor ?? "").trim() !== "" ||
      (draft?.unitLabel ?? "").trim() !== "" ||
      (draft?.metadataRows?.length ?? 0) > 0 ||
      (draft?.featureRows?.length ?? 0) > 0
    setShowAdditionalOptions(hasAdditional)
  }

  const computePrimaryAmountAndCurrency = (
    priceOverride?: { amount?: string; currency?: string }
  ): { amount: string; currency: string } => {
    // Prefer an explicit override (used by the condensed popover header price input).
    // Be defensive: React onClick handlers can accidentally pass a MouseEvent if wired directly.
    const overrideAmount =
      priceOverride && typeof priceOverride === "object" && typeof (priceOverride as any).amount === "string"
        ? ((priceOverride as any).amount as string).trim()
        : ""
    const overrideCurrency =
      priceOverride && typeof priceOverride === "object" && typeof (priceOverride as any).currency === "string"
        ? ((priceOverride as any).currency as string).trim()
        : ""

    // Otherwise, derive from the pricing editor state (multi-currency) or the most recently added collapsed price.
    const primaryCurrency = pricingCurrencies[0]
    const amountFromDraft =
      primaryCurrency != null ? (currencyAmounts[primaryCurrency.id]?.trim() ?? "") : ""

    const lastCollapsed = collapsedPrices.length ? collapsedPrices[collapsedPrices.length - 1] : null
    const collapsedPrimaryCurrency = lastCollapsed?.config?.currencies?.[0]
    const amountFromCollapsed =
      collapsedPrimaryCurrency != null
        ? (lastCollapsed?.config?.currencyAmounts?.[collapsedPrimaryCurrency.id]?.trim() ?? "")
        : ""

    const computedAmount = overrideAmount || amountFromDraft || amountFromCollapsed || "0.00"
    const computedCurrency =
      (overrideCurrency ||
        collapsedPrimaryCurrency?.code ||
        primaryCurrency?.code ||
        primaryCurrencyCode ||
        "USD"
      )
        .trim()
        .toUpperCase() || "USD"

    return { amount: computedAmount, currency: computedCurrency }
  }

  const persistProduct = (nextStatus: "draft" | "live", priceOverride?: { amount?: string; currency?: string }) => {
    const trimmedName = productName.trim() || t("Untitled product")
    const { amount, currency } = computePrimaryAmountAndCurrency(priceOverride)

    const nextDraft = {
      chargeFrequency,
      pricingModel,
      usageBasis,
      meter,
      billingPeriod,
      includeTax,
      tieredBy,
      tiers: [...tiers],
      tierToValues: { ...tierToValues },
      tierUnitPrices: { ...tierUnitPrices },
      tierFlatFees: { ...tierFlatFees },
      productTaxCode,
      statementDescriptor,
      unitLabel,
      metadataRows: [...metadataRows],
      featureRows: [...featureRows],
      metadataValues: { ...metadataValues },
      featureValues: { ...featureValues },
    }

    if (editingProductId != null) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProductId
            ? {
                ...p,
                name: trimmedName,
                description: productDescription,
                billingPeriod,
                amount,
                currency,
                imageUrl: productImageUrl,
                status: nextStatus,
                draft: nextDraft,
              }
            : p
        )
      )
    } else {
      const newProduct: ProductRow = {
        id: Date.now(),
        name: trimmedName,
        description: productDescription,
        billingPeriod,
        amount,
        currency,
        imageUrl: productImageUrl,
        status: nextStatus,
        draft: nextDraft,
      }
      setProducts((prev) => [newProduct, ...prev])
    }

    setIsProductModalOpen(false)
    setIsSimplifiedProductPopoverOpen(false)
    setEditingProductId(null)
  }

  const handleSaveProductDraft = (priceOverride?: { amount?: string; currency?: string }) => {
    persistProduct("draft", priceOverride)
  }

  const handleSubmitProduct = (priceOverride?: { amount?: string; currency?: string }) => {
    persistProduct("live", priceOverride)
  }

  const handleDeleteProduct = () => {
    if (editingProductId == null) return
    setProducts((prev) => prev.filter((product) => product.id !== editingProductId))
    setEditingProductId(null)
    setIsProductModalOpen(false)
    setProductName("")
    setProductDescription("")
  }

  const handleOpenCreateModal = () => {
    setEditingProductId(null)
    resetProductFormToDefaults()
    setActiveObjectForm("product")
    setIsObjectActionsOpen(false)
    resetPanelWidths()
    setIsProductModalOpen(true)
  }

  const handleOpenSimplifiedCreateModal = () => {
    setEditingProductId(null)
    resetProductFormToDefaults()
    setActiveObjectForm("product")
    setIsObjectActionsOpen(false)
    resetPanelWidths()
    setIsProductModalOpen(false)
    setIsSimplifiedProductPopoverOpen(true)
  }

  const handleOpenFullSettingsFromSimplified = () => {
    setEditingProductId(null)
    setIsSimplifiedProductPopoverOpen(false)
    setIsObjectActionsOpen(false)
    resetPanelWidths()
    setIsProductModalOpen(true)
  }

  const resetPricingPlanFormToDefaults = () => {
    setPlanName("")
    setPlanDescription("")
    setPlanCurrency("USD")
    setPlanLookupKey("")
    setPlanTaxTreatment("Included in prices")
    // Start empty — user adds their first item via onboarding
    setPlanPriceGroups([])
    setPlanRateCards([])
    setPlanRates([])
    assistantPlanRateCardsDraftRef.current = null
    setActivePlanRateCardId(0)
    setPlanRateUsage({})
    setPlanRateUnitPrices({})
    setPlanRateTiers({})
    setPlanRateTierToValues({})
    setPlanRateTierUnitPrices({})
    setPlanRateTierFlatFees({})
    setPlanRateIncludeTax({})
    setPlanRateCurrencies({})
    setPlanRateActiveCurrencyId({})
    setPlanUsageScenarioRates([])
    hasUserEditedPlanUsageScenarioRef.current = false
    setUsageScenarioDraggingRateId(null)
    setPlanCreditGrants([])
    setPlanSubscriptionFees([])
    setActivePlanNode({ type: "plan" })
    setPlanExpandedRateCards({})
    setShowRateCardAdvanced(false)
    setShowRateAdvanced(false)
    setShowCreditAdvanced(false)
    setShowSubscriptionFeeAdvanced(false)
    setRateCardLookupKeys({})
    setRateCardServicingPeriods({})
    setRateCardMetadataRows({})
    setRateCardMetadataValues({})
    setRateMeters({ 0: "" })
    setAvailablePlanMeterOptions(defaultMeterOptions)
    setPlanRateMeterConfigs({})
    setRatePriceTypes({})
    setRateSellAs({})
    setRateUnitLabels({})
    setRateTaxCodes({})
    setRateItemLookupKeys({})
    setRateItemMetadataRows({})
    setRateItemMetadataValues({})
    setRateSettingsMetadataRows({})
    setRateSettingsMetadataValues({})
    setCreditGrantAmounts({})
    setCreditGrantPeriods({})
    setCreditGrantApplications({})
    setCreditGrantLookupKeys({})
    setSubscriptionFeeAmounts({})
    setSubscriptionFeePeriods({})
    setSubscriptionFeePriceTypes({})
    setSubscriptionFeeSellAs({})
    setSubscriptionFeeUnitLabels({})
    setSubscriptionFeeTaxCodes({})
    setSubscriptionFeeItemLookupKeys({})
    setSubscriptionFeeFeeLookupKeys({})
    setSubscriptionFeeItemMetadataRows({})
    setSubscriptionFeeFeeMetadataRows({})
    setSubscriptionFeeItemMetadataValues({})
    setSubscriptionFeeFeeMetadataValues({})
    setIsAddPlanObjectOpen(false)
    setAddPlanObjectPopoverPosition(null)
    setIsPlanActionsOpen(false)
    setSeenCoachmarks(new Set())
    setActiveCoachmark(null)
    userHasSelectedPlanNodeRef.current = false
    setHasUserSelectedNode(false)
    // Reset onboarding popovers
    setGetStartedDismissed(false)
    setIsInlineGetStartedActive(false)
    setNavHintDismissed(false)
    setShowNavHint(false)
    addedItemCountRef.current = 0
    hasOpenedNavRef.current = false
    setIsTreeNavOpen(false)
    setShowSidebarTip(false)
    setIsNewPlanSession(false)
  }

  const buildPricingPlanDraft = (): PricingPlanDraft => {
    return {
      planName,
      planDescription,
      planCurrency,
      planLookupKey,
      planTaxTreatment,
      planRateCards: JSON.parse(JSON.stringify(planRateCards)) as PlanRateCard[],
      planRates: JSON.parse(JSON.stringify(planRates)) as PlanRate[],
      activePlanRateCardId,
      planRateUsage: { ...planRateUsage },
      planRateUnitPrices: { ...planRateUnitPrices },
      planRateTiers: JSON.parse(JSON.stringify(planRateTiers)) as Record<number, number[]>,
      planRateTierToValues: JSON.parse(JSON.stringify(planRateTierToValues)) as Record<number, Record<number, string>>,
      planRateTierUnitPrices: JSON.parse(JSON.stringify(planRateTierUnitPrices)) as Record<number, Record<number, string>>,
      planRateTierFlatFees: JSON.parse(JSON.stringify(planRateTierFlatFees)) as Record<number, Record<number, string>>,
      planRateIncludeTax: { ...planRateIncludeTax },
      planRateCurrencies: JSON.parse(JSON.stringify(planRateCurrencies)) as Record<number, { id: number; code: string }[]>,
      planRateActiveCurrencyId: { ...planRateActiveCurrencyId },
      planUsageScenarioRates: [...planUsageScenarioRates],
      planCreditGrants: JSON.parse(JSON.stringify(planCreditGrants)) as PlanNamedItem[],
      planSubscriptionFees: JSON.parse(JSON.stringify(planSubscriptionFees)) as PlanNamedItem[],
      planExpandedRateCards: { ...planExpandedRateCards },
      showRateCardAdvanced,
      showRateAdvanced,
      showCreditAdvanced,
      showSubscriptionFeeAdvanced,
      rateCardLookupKeys: { ...rateCardLookupKeys },
      rateCardServicingPeriods: { ...rateCardServicingPeriods },
      rateCardMetadataRows: JSON.parse(JSON.stringify(rateCardMetadataRows)) as Record<number, number[]>,
      rateCardMetadataValues: JSON.parse(JSON.stringify(rateCardMetadataValues)) as Record<
        number,
        Record<number, { key: string; value: string }>
      >,
      rateMeters: { ...rateMeters },
      availablePlanMeterOptions: [...availablePlanMeterOptions],
      planRateMeterConfigs: JSON.parse(JSON.stringify(planRateMeterConfigs)) as PricingPlanDraft["planRateMeterConfigs"],
      ratePriceTypes: { ...ratePriceTypes },
      rateSellAs: { ...rateSellAs },
      rateUnitLabels: { ...rateUnitLabels },
      rateTaxCodes: { ...rateTaxCodes },
      rateItemLookupKeys: { ...rateItemLookupKeys },
      rateItemMetadataRows: JSON.parse(JSON.stringify(rateItemMetadataRows)) as Record<number, number[]>,
      rateItemMetadataValues: JSON.parse(JSON.stringify(rateItemMetadataValues)) as Record<
        number,
        Record<number, { key: string; value: string }>
      >,
      rateSettingsMetadataRows: JSON.parse(JSON.stringify(rateSettingsMetadataRows)) as Record<number, number[]>,
      rateSettingsMetadataValues: JSON.parse(JSON.stringify(rateSettingsMetadataValues)) as Record<
        number,
        Record<number, { key: string; value: string }>
      >,
      creditGrantAmounts: { ...creditGrantAmounts },
      creditGrantPeriods: { ...creditGrantPeriods },
      creditGrantApplications: { ...creditGrantApplications },
      creditGrantLookupKeys: { ...creditGrantLookupKeys },
      subscriptionFeeAmounts: { ...subscriptionFeeAmounts },
      subscriptionFeePeriods: { ...subscriptionFeePeriods },
      subscriptionFeePriceTypes: { ...subscriptionFeePriceTypes },
      subscriptionFeeSellAs: { ...subscriptionFeeSellAs },
      subscriptionFeeUnitLabels: { ...subscriptionFeeUnitLabels },
      subscriptionFeeTaxCodes: { ...subscriptionFeeTaxCodes },
      subscriptionFeeItemLookupKeys: { ...subscriptionFeeItemLookupKeys },
      subscriptionFeeFeeLookupKeys: { ...subscriptionFeeFeeLookupKeys },
      subscriptionFeeItemMetadataRows: JSON.parse(JSON.stringify(subscriptionFeeItemMetadataRows)) as Record<number, number[]>,
      subscriptionFeeFeeMetadataRows: JSON.parse(JSON.stringify(subscriptionFeeFeeMetadataRows)) as Record<number, number[]>,
      subscriptionFeeItemMetadataValues: JSON.parse(JSON.stringify(subscriptionFeeItemMetadataValues)) as Record<
        number,
        Record<number, { key: string; value: string }>
      >,
      subscriptionFeeFeeMetadataValues: JSON.parse(JSON.stringify(subscriptionFeeFeeMetadataValues)) as Record<
        number,
        Record<number, { key: string; value: string }>
      >,
    }
  }

  const loadPricingPlanDraft = (draft: PricingPlanDraft) => {
    setPlanName(draft.planName ?? "")
    setPlanDescription(draft.planDescription ?? "")
    setPlanCurrency(draft.planCurrency ?? "USD")
    setPlanLookupKey(draft.planLookupKey ?? "")
    setPlanTaxTreatment(draft.planTaxTreatment ?? "Included in prices")
    setPlanPriceGroups(JSON.parse(JSON.stringify(draft.planPriceGroups ?? [])) as PlanPriceGroup[])
    setPlanRateCards(JSON.parse(JSON.stringify(draft.planRateCards ?? [])) as PlanRateCard[])
    setPlanRates(JSON.parse(JSON.stringify(draft.planRates ?? [])) as PlanRate[])
    setActivePlanRateCardId(Number.isFinite(draft.activePlanRateCardId) ? draft.activePlanRateCardId : 0)
    setPlanRateUsage({ ...(draft.planRateUsage ?? {}) })
    setPlanRateUnitPrices({ ...(draft.planRateUnitPrices ?? {}) })
    setPlanRateTiers(JSON.parse(JSON.stringify(draft.planRateTiers ?? {})) as Record<number, number[]>)
    setPlanRateTierToValues(
      JSON.parse(JSON.stringify(draft.planRateTierToValues ?? {})) as Record<number, Record<number, string>>
    )
    setPlanRateTierUnitPrices(
      JSON.parse(JSON.stringify(draft.planRateTierUnitPrices ?? {})) as Record<number, Record<number, string>>
    )
    setPlanRateTierFlatFees(
      JSON.parse(JSON.stringify(draft.planRateTierFlatFees ?? {})) as Record<number, Record<number, string>>
    )
    setPlanRateIncludeTax({ ...(draft.planRateIncludeTax ?? {}) })
    setPlanRateCurrencies(
      JSON.parse(JSON.stringify(draft.planRateCurrencies ?? {})) as Record<number, { id: number; code: string }[]>
    )
    setPlanRateActiveCurrencyId({ ...(draft.planRateActiveCurrencyId ?? {}) })
    setPlanUsageScenarioRates([...(draft.planUsageScenarioRates ?? [])])
    hasUserEditedPlanUsageScenarioRef.current = false
    setUsageScenarioDraggingRateId(null)
    setPlanCreditGrants(JSON.parse(JSON.stringify(draft.planCreditGrants ?? [])) as PlanNamedItem[])
    setPlanSubscriptionFees(JSON.parse(JSON.stringify(draft.planSubscriptionFees ?? [])) as PlanNamedItem[])
    // Default all products (rate cards) to expanded so prices are visible
    const expandAll: Record<number, boolean> = {}
    for (const card of (draft.planRateCards ?? [])) {
      expandAll[card.id] = true
    }
    setPlanExpandedRateCards({ ...expandAll, ...(draft.planExpandedRateCards ?? {}) })
    setShowRateCardAdvanced(Boolean(draft.showRateCardAdvanced))
    setShowRateAdvanced(Boolean(draft.showRateAdvanced))
    setShowCreditAdvanced(Boolean(draft.showCreditAdvanced))
    setShowSubscriptionFeeAdvanced(Boolean(draft.showSubscriptionFeeAdvanced))
    setRateCardLookupKeys({ ...(draft.rateCardLookupKeys ?? {}) })
    setRateCardServicingPeriods({ ...(draft.rateCardServicingPeriods ?? {}) })
    setRateCardMetadataRows(JSON.parse(JSON.stringify(draft.rateCardMetadataRows ?? {})) as Record<number, number[]>)
    setRateCardMetadataValues(
      JSON.parse(JSON.stringify(draft.rateCardMetadataValues ?? {})) as Record<number, Record<number, { key: string; value: string }>>
    )
    setRateMeters({ ...(draft.rateMeters ?? {}) })
    setAvailablePlanMeterOptions([...(draft.availablePlanMeterOptions ?? defaultMeterOptions)])
    setPlanRateMeterConfigs(
      JSON.parse(JSON.stringify(draft.planRateMeterConfigs ?? {})) as PricingPlanDraft["planRateMeterConfigs"]
    )
    setRatePriceTypes({ ...(draft.ratePriceTypes ?? {}) })
    setRateSellAs({ ...(draft.rateSellAs ?? {}) })
    setRateUnitLabels({ ...(draft.rateUnitLabels ?? {}) })
    setRateTaxCodes({ ...(draft.rateTaxCodes ?? {}) })
    setRateItemLookupKeys({ ...(draft.rateItemLookupKeys ?? {}) })
    setRateItemMetadataRows(JSON.parse(JSON.stringify(draft.rateItemMetadataRows ?? {})) as Record<number, number[]>)
    setRateItemMetadataValues(
      JSON.parse(JSON.stringify(draft.rateItemMetadataValues ?? {})) as Record<number, Record<number, { key: string; value: string }>>
    )
    setRateSettingsMetadataRows(
      JSON.parse(JSON.stringify(draft.rateSettingsMetadataRows ?? {})) as Record<number, number[]>
    )
    setRateSettingsMetadataValues(
      JSON.parse(JSON.stringify(draft.rateSettingsMetadataValues ?? {})) as Record<
        number,
        Record<number, { key: string; value: string }>
      >
    )
    setCreditGrantAmounts({ ...(draft.creditGrantAmounts ?? {}) })
    setCreditGrantPeriods({ ...(draft.creditGrantPeriods ?? {}) })
    setCreditGrantApplications({ ...(draft.creditGrantApplications ?? {}) })
    setCreditGrantLookupKeys({ ...(draft.creditGrantLookupKeys ?? {}) })
    setSubscriptionFeeAmounts({ ...(draft.subscriptionFeeAmounts ?? {}) })
    setSubscriptionFeePeriods({ ...(draft.subscriptionFeePeriods ?? {}) })
    setSubscriptionFeePriceTypes({ ...(draft.subscriptionFeePriceTypes ?? {}) })
    setSubscriptionFeeSellAs({ ...(draft.subscriptionFeeSellAs ?? {}) })
    setSubscriptionFeeUnitLabels({ ...(draft.subscriptionFeeUnitLabels ?? {}) })
    setSubscriptionFeeTaxCodes({ ...(draft.subscriptionFeeTaxCodes ?? {}) })
    setSubscriptionFeeItemLookupKeys({ ...(draft.subscriptionFeeItemLookupKeys ?? {}) })
    setSubscriptionFeeFeeLookupKeys({ ...(draft.subscriptionFeeFeeLookupKeys ?? {}) })
    setSubscriptionFeeItemMetadataRows(
      JSON.parse(JSON.stringify(draft.subscriptionFeeItemMetadataRows ?? {})) as Record<number, number[]>
    )
    setSubscriptionFeeFeeMetadataRows(
      JSON.parse(JSON.stringify(draft.subscriptionFeeFeeMetadataRows ?? {})) as Record<number, number[]>
    )
    setSubscriptionFeeItemMetadataValues(
      JSON.parse(JSON.stringify(draft.subscriptionFeeItemMetadataValues ?? {})) as Record<
        number,
        Record<number, { key: string; value: string }>
      >
    )
    setSubscriptionFeeFeeMetadataValues(
      JSON.parse(JSON.stringify(draft.subscriptionFeeFeeMetadataValues ?? {})) as Record<
        number,
        Record<number, { key: string; value: string }>
      >
    )
  }

  const persistItemNames = () => {
    const rateNames = new Set(savedRateNames)
    for (const card of planRateCards) {
      for (const rate of card.rates) {
        const n = rate.name.trim()
        if (n) rateNames.add(n)
      }
    }
    const nextRates = Array.from(rateNames).sort()
    setSavedRateNames(nextRates)
    try { window.localStorage.setItem(SAVED_RATE_NAMES_KEY, JSON.stringify(nextRates)) } catch {}

    const feeNames = new Set(savedFeeNames)
    for (const fee of planSubscriptionFees) {
      const n = fee.name.trim()
      if (n) feeNames.add(n)
    }
    const nextFees = Array.from(feeNames).sort()
    setSavedFeeNames(nextFees)
    try { window.localStorage.setItem(SAVED_FEE_NAMES_KEY, JSON.stringify(nextFees)) } catch {}
  }

  const persistPricingPlan = (nextStatus: "draft" | "live") => {
    const trimmedName = getPlanLabel(planName, t("Untitled pricing plan"))
    const amount = Number.isFinite(planTotal) ? (Math.round(planTotal * 100) / 100).toFixed(2) : "0.00"
    const draft = buildPricingPlanDraft()

    let newPlans: PricingPlanRow[]

    if (editingPricingPlanId != null) {
      newPlans = pricingPlans.map((p) =>
        p.id === editingPricingPlanId
          ? {
              ...p,
              name: trimmedName,
              description: planDescription,
              billingPeriod: "Monthly",
              amount,
              currency: planCurrency,
              status: nextStatus,
              draft,
            }
          : p
      )
    } else {
      const newPlan: PricingPlanRow = {
        id: Date.now(),
        name: trimmedName,
        description: planDescription,
        billingPeriod: "Monthly",
        amount,
        currency: planCurrency,
        status: nextStatus,
        draft,
      }
      newPlans = [newPlan, ...pricingPlans]
    }

    setPricingPlans(newPlans)
    savePricingPlans(newPlans)
    persistItemNames()

    setIsPricingPlanModalOpen(false)
    setIsPlanAssistantOpen(() => false)
    setEditingPricingPlanId(null)
  }

  const handleSavePricingPlanDraft = () => {
    persistPricingPlan("draft")
  }

  const handleSubmitPricingPlan = () => {
    const fields = validatePlanForm({
      t,
      planName,
      planDescription,
      planLookupKey,
      planRateCards,
      rateMeters,
      ratePriceTypes,
      planRateUnitPrices,
      rateUnitLabels,
      planCreditGrants,
      creditGrantAmounts,
      planSubscriptionFees,
      subscriptionFeeAmounts,
      subscriptionFeeUnitLabels,
      planPriceTypeOptions,
      getPlanRateLabel,
      getPlanCreditGrantLabel,
      getPlanSubscriptionFeeLabel,
    })

    if (fields.length > 0) {
      setIncompleteFields(fields)
      setShowValidationPanel(true)
      setIsTreeNavOpen(true)

      // Auto-expand rate cards that contain rates with errors so they're visible in the sidebar
      const rateIdsWithErrors = new Set(
        fields.filter((f) => f.nodeType === "rate" && f.nodeId != null).map((f) => f.nodeId!)
      )
      if (rateIdsWithErrors.size > 0) {
        const expansions: Record<number, boolean> = {}
        for (const card of planRateCards) {
          if (card.rates.some((r) => rateIdsWithErrors.has(r.id))) {
            expansions[card.id] = true
          }
        }
        if (Object.keys(expansions).length > 0) {
          setPlanExpandedRateCards((prev) => ({ ...prev, ...expansions }))
        }
      }

      return
    }

    // For new plans (no existing versions), skip the modal and save directly using the plan name
    const existingVersions = editingPricingPlanId != null
      ? pricingPlans.find((p) => p.id === editingPricingPlanId)?.versions
      : undefined
    if (!existingVersions || existingVersions.length === 0) {
      handleConfirmSaveVersion(getPlanLabel(planName, t("Untitled pricing plan")), -1)
      return
    }

    setShowSaveVersionModal(true)
  }

  const handleConfirmSaveVersion = (versionName: string, defaultVersionId: number) => {
    setShowSaveVersionModal(false)

    // Create new component versions for any dirty components
    {
      const dirtyComponents = getAllDirtyComponents()
      for (const ds of dirtyComponents) {
        const newComponentVersion = {
          id: crypto.randomUUID(),
          label: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }),
          createdAt: Date.now(),
          isLatest: true,
        }
        addVersionToComponent(ds.componentId, newComponentVersion)

        // Update the plan object's componentLink to point to the new version
        setPlanRateCards((prev) =>
          prev.map((c) =>
            c.componentLink?.componentId === ds.componentId
              ? { ...c, componentLink: { ...c.componentLink, versionId: newComponentVersion.id } }
              : c
          )
        )
        setPlanSubscriptionFees((prev) =>
          prev.map((f) =>
            f.componentLink?.componentId === ds.componentId
              ? { ...f, componentLink: { ...f.componentLink, versionId: newComponentVersion.id } }
              : f
          )
        )
        setPlanCreditGrants((prev) =>
          prev.map((g) =>
            g.componentLink?.componentId === ds.componentId
              ? { ...g, componentLink: { ...g.componentLink, versionId: newComponentVersion.id } }
              : g
          )
        )

        clearDirty(ds.componentId)
      }
    }

    const draft = buildPricingPlanDraft()
    const newVersion: PlanVersion = {
      id: Date.now(),
      name: versionName,
      createdAt: Date.now(),
      draft,
    }
    persistPricingPlanWithVersion(newVersion, defaultVersionId)
  }

  const persistPricingPlanWithVersion = (newVersion: PlanVersion, defaultVersionId: number) => {
    const trimmedName = getPlanLabel(planName, t("Untitled pricing plan"))
    const amount = Number.isFinite(planTotal) ? (Math.round(planTotal * 100) / 100).toFixed(2) : "0.00"
    const draft = newVersion.draft

    // Resolve the sentinel -1 (meaning "the new version") to the real new version id
    const resolvedDefaultId = defaultVersionId === -1 ? newVersion.id : defaultVersionId

    let newPlans: PricingPlanRow[]

    if (editingPricingPlanId != null) {
      newPlans = pricingPlans.map((p) =>
        p.id === editingPricingPlanId
          ? {
              ...p,
              name: trimmedName,
              description: planDescription,
              billingPeriod: "Monthly",
              amount,
              currency: planCurrency,
              status: "live" as const,
              draft,
              versions: [newVersion, ...(p.versions ?? [])],
              defaultVersionId: resolvedDefaultId,
            }
          : p
      )
    } else {
      const newPlan: PricingPlanRow = {
        id: Date.now(),
        name: trimmedName,
        description: planDescription,
        billingPeriod: "Monthly",
        amount,
        currency: planCurrency,
        status: "live",
        draft,
        versions: [newVersion],
        defaultVersionId: resolvedDefaultId,
      }
      newPlans = [newPlan, ...pricingPlans]
    }

    setPricingPlans(newPlans)
    savePricingPlans(newPlans)
    persistItemNames()

    setIsPricingPlanModalOpen(false)
    setIsPlanAssistantOpen(() => false)
    setEditingPricingPlanId(null)
    setActiveVersionId(null)
  }

  const handleChangeVersion = (versionId: number) => {
    if (editingPricingPlanId == null) return
    const plan = pricingPlans.find((p) => p.id === editingPricingPlanId)
    if (!plan?.versions) return
    const version = plan.versions.find((v) => v.id === versionId)
    if (!version) return
    setActiveVersionId(versionId)
    loadPricingPlanDraft(version.draft)
    autoRegisterAndLinkPlanComponents(editingPricingPlanId, version.draft)
  }

  const handlePricingPlanClick = (plan: PricingPlanRow) => {
    setIsProductModalOpen(false)
    setIsSimplifiedProductPopoverOpen(false)
    setIsPlanAssistantOpen(() => false)
    // Clear any leftover validation state from a previous plan
    setIncompleteFields([])
    setShowValidationPanel(false)
    setEditingPricingPlanId(plan.id)
    // Load the default version's draft if versions exist, otherwise fall back to top-level draft
    const defaultVersion = plan.versions?.find((v) => v.id === plan.defaultVersionId) ?? plan.versions?.[0]
    if (defaultVersion) {
      loadPricingPlanDraft(defaultVersion.draft)
      autoRegisterAndLinkPlanComponents(plan.id, defaultVersion.draft)
      setActiveVersionId(defaultVersion.id)
    } else if (plan.draft) {
      loadPricingPlanDraft(plan.draft)
      autoRegisterAndLinkPlanComponents(plan.id, plan.draft)
      setActiveVersionId(null)
    } else {
      resetPricingPlanFormToDefaults()
      setActiveVersionId(null)
    }
    setActivePlanNode({ type: "plan" })
    setIsPricingPlanModalOpen(true)
    setIsTreeNavOpen(true)
    setGetStartedDismissed(true)
    // Start coachmark tour for example plan
    if (plan.id === EXAMPLE_PLAN_ID) {
      setIsCoachmarkTourActive(true)
      setCurrentCoachmarkStep(0)
    } else {
      setIsCoachmarkTourActive(false)
    }
  }

  const handleOpenPricingPlanModal = () => {
    setIsProductModalOpen(false)
    setIsSimplifiedProductPopoverOpen(false)
    if (onboardingMode === "tips") {
      // Tips mode: skip wizard entirely, open a blank plan editor directly
      setShowPlanSkeleton(true)
      setIncompleteFields([])
      setShowValidationPanel(false)
      const newPlanId = Date.now()
      setPricingPlans((prev) => [...prev, {
        id: newPlanId, name: "", description: "", billingPeriod: "Monthly",
        amount: "0.00", currency: "USD", status: "draft", draft: undefined,
      }])
      setEditingPricingPlanId(newPlanId)
      resetPricingPlanFormToDefaults()
      setPlanSubscriptionFees([])
      setActiveVersionId(null)
      setIsPricingPlanModalOpen(true)
      setActivePlanNode({ type: "plan" })
    } else {
      setIsPricingPlanWizardOpen(true)
    }
  }

  const scaffoldPricingPlanFromWizard = (data: WizardData) => {
    resetPricingPlanFormToDefaults()
    setPlanName(data.planName)

    // "Start empty" — just a bare plan node with nothing else
    if (data.mode === "existing" && data.startEmpty) {
      setPlanRateCards([])
      setPlanSubscriptionFees([])
      setPlanCreditGrants([])
      setRateMeters({})
      return
    }

    if (data.mode === "new") {
      const rates: PlanRate[] = data.features.length > 0
        ? data.features.map((name, i) => ({ id: i, name }))
        : [{ id: 0, name: "" }]

      if (data.importedFromPlanName) {
        // Imported from another plan — wrap in a price group (rate card)
        setPlanRateCards([{ id: 0, name: "", rates }])
        setPlanRates([])
        setPlanExpandedRateCards({ 0: true })
        setActivePlanRateCardId(0)
        setActivePlanNode({ type: "rateCard", id: 0 })
        setImportedPriceGroupSourcePlan(data.importedFromPlanName ?? null)

        // Also move standalone rates into a price group on the source plan
        if (data.importedFromPlanId != null) {
          setPricingPlans((prev) => prev.map((plan) => {
            if (plan.id !== data.importedFromPlanId || !plan.draft) return plan
            const standaloneRates = plan.draft.planRates ?? []
            if (standaloneRates.length === 0) return plan
            const existingCards = plan.draft.planRateCards ?? []
            const nextCardId = existingCards.length > 0 ? Math.max(...existingCards.map((c) => c.id)) + 1 : 0
            return {
              ...plan,
              draft: {
                ...plan.draft,
                planRates: [],
                planRateCards: [...existingCards, { id: nextCardId, name: "", rates: standaloneRates }],
                planExpandedRateCards: { ...plan.draft.planExpandedRateCards, [nextCardId]: true },
              },
            }
          }))
        }
      } else {
        setPlanRateCards([{ id: 0, name: "", rates }])
        setPlanRates([])
        setPlanExpandedRateCards({ 0: true })
        setActivePlanRateCardId(0)
        setActivePlanNode({ type: "rateCard", id: 0 })
      }

      const rateMetersInit: Record<number, string> = {}
      for (const rate of rates) { rateMetersInit[rate.id] = "" }
      setRateMeters(rateMetersInit)

      if (parseFloat(data.costPerMonth) > 0) {
        const feeName = `${data.planName} \u2014 Subscription Fee`
        setPlanSubscriptionFees([{ id: 0, name: feeName }])
        setSubscriptionFeeAmounts({ 0: data.costPerMonth })
        setSubscriptionFeePeriods({ 0: data.costPeriod })
      } else {
        setPlanSubscriptionFees([])
      }

      if (parseFloat(data.freeCreditsAmount) > 0) {
        const creditName = `${data.planName} \u2014 Credits`
        setPlanCreditGrants([{ id: 0, name: creditName }])
        setCreditGrantAmounts({ 0: data.freeCreditsAmount })
        setCreditGrantPeriods({ 0: data.freeCreditsPeriod })
      }
    } else {
      // "existing" mode — resolve picked components + inline new ones

      // --- Rate Cards ---
      let rateCardId = 0
      const allRateCards: PlanRateCard[] = []
      const metersInit: Record<number, string> = {}

      for (const rcId of data.pickedRateCardIds) {
        const sim = SIMULATED_RATE_CARDS.find((rc) => rc.id === rcId)
        if (!sim) continue
        const rates = sim.rates.map((r, i) => ({ id: rateCardId * 100 + i, name: r.name }))
        allRateCards.push({ id: rateCardId, name: sim.name, rates })
        for (const rate of rates) { metersInit[rate.id] = "" }
        rateCardId++
      }
      for (const newRc of data.newRateCards) {
        const newRates = newRc.rates.length > 0
          ? newRc.rates.map((rateName, i) => ({ id: rateCardId * 100 + i, name: rateName }))
          : [{ id: rateCardId * 100, name: "" }]
        allRateCards.push({ id: rateCardId, name: newRc.name, rates: newRates })
        for (const r of newRates) metersInit[r.id] = ""
        rateCardId++
      }
      if (allRateCards.length === 0) {
        allRateCards.push({ id: 0, name: "", rates: [{ id: 0, name: "" }] })
        metersInit[0] = ""
      }

      setPlanRateCards(allRateCards)
      setActivePlanRateCardId(allRateCards[0].id)
      setRateMeters(metersInit)

      // --- License Fees ---
      let feeId = 0
      const allFees: PlanNamedItem[] = []
      const feeAmounts: Record<number, string> = {}
      const feePeriods: Record<number, string> = {}

      for (const lfId of data.pickedSubscriptionFeeIds) {
        const sim = SIMULATED_SUBSCRIPTION_FEES.find((lf) => lf.id === lfId)
        if (!sim) continue
        allFees.push({ id: feeId, name: sim.name })
        feeAmounts[feeId] = sim.amount
        feePeriods[feeId] = sim.period
        feeId++
      }
      for (const newLf of data.newSubscriptionFees) {
        allFees.push({ id: feeId, name: newLf.name })
        feeAmounts[feeId] = newLf.amount
        feePeriods[feeId] = newLf.period
        feeId++
      }

      setPlanSubscriptionFees(allFees)
      setSubscriptionFeeAmounts(feeAmounts)
      setSubscriptionFeePeriods(feePeriods)

      // --- Credit Grants ---
      let grantId = 0
      const allGrants: PlanNamedItem[] = []
      const grantAmounts: Record<number, string> = {}
      const grantPeriods: Record<number, string> = {}

      for (const cgId of data.pickedCreditGrantIds) {
        const sim = SIMULATED_CREDIT_GRANTS.find((cg) => cg.id === cgId)
        if (!sim) continue
        allGrants.push({ id: grantId, name: sim.name })
        grantAmounts[grantId] = sim.amount
        grantPeriods[grantId] = sim.period
        grantId++
      }
      for (const newCg of data.newCreditGrants) {
        allGrants.push({ id: grantId, name: newCg.name })
        grantAmounts[grantId] = newCg.amount
        grantPeriods[grantId] = newCg.period
        grantId++
      }

      setPlanCreditGrants(allGrants)
      setCreditGrantAmounts(grantAmounts)
      setCreditGrantPeriods(grantPeriods)
    }
  }

  const handlePricingPlanWizardConfirm = (data: WizardData) => {
    // Phase 1: start card exit animation, mount overlay with skeleton behind wizard
    setWizardExiting(true)
    setShowPlanSkeleton(true)

    // Clear any leftover validation state from a previous plan
    setIncompleteFields([])
    setShowValidationPanel(false)

    const newPlanId = Date.now()
    const newPlan: PricingPlanRow = {
      id: newPlanId,
      name: "",
      description: "",
      billingPeriod: "Monthly",
      amount: "0.00",
      currency: "USD",
      status: "draft",
      draft: undefined,
    }
    setPricingPlans((prev) => [...prev, newPlan])
    setEditingPricingPlanId(newPlanId)
    scaffoldPricingPlanFromWizard(data)
    setActiveVersionId(null)
    setIsPricingPlanModalOpen(true)
    setActivePlanNode({ type: "plan" })
    setIsNewPlanSession(true)
  }

  // Phase 2: card exited → backdrop starts fading
  const handleWizardCardExited = useCallback(() => {
    // backdrop will fade via the isExiting + cardExited logic in the modal
  }, [])

  // Phase 3: backdrop exited → unmount wizard entirely
  const handleWizardBackdropExited = useCallback(() => {
    setIsPricingPlanWizardOpen(false)
    setWizardExiting(false)
  }, [])

  // Phase 4: skeleton timer done → show real content
  const handleSkeletonDone = useCallback(() => {
    setShowPlanSkeleton(false)
  }, [])

  const handlePricingPlanWizardSkip = () => {
    // Skip wizard: create a blank plan with defaults and open the editor
    setWizardExiting(true)
    setShowPlanSkeleton(true)

    // Clear any leftover validation state
    setIncompleteFields([])
    setShowValidationPanel(false)

    const newPlanId = Date.now()
    const newPlan: PricingPlanRow = {
      id: newPlanId,
      name: "",
      description: "",
      billingPeriod: "Monthly",
      amount: "0.00",
      currency: "USD",
      status: "draft",
      draft: undefined,
    }
    setPricingPlans((prev) => [...prev, newPlan])
    setEditingPricingPlanId(newPlanId)
    resetPricingPlanFormToDefaults()
    // Skip starts with just a plan + rate card — no subscription fee
    setPlanSubscriptionFees([])
    setActiveVersionId(null)
    setIsPricingPlanModalOpen(true)
    setActivePlanNode({ type: "plan" })
  }

  const handlePricingPlanWizardCancel = () => {
    setIsPricingPlanWizardOpen(false)
    setWizardExiting(false)
  }

  // Helper: open a fresh plan and populate it
  const openSimulatedPlan = useCallback((setup: {
    name: string
    description: string
    rateCards: { id: number; name: string; rates: { id: number; name: string }[] }[]
    subscriptionFees?: { id: number; name: string; amount: string; period: string }[]
    rateConfigs: Record<number, {
      priceType: string; meter: string; unitLabel: string; sellAs?: string
      unitPrice?: string
      tiers?: { ids: number[]; toValues: Record<number, string>; unitPrices: Record<number, string>; flatFees: Record<number, string> }
    }>
    servicingPeriods: Record<number, string>
  }) => {
    const newPlanId = Date.now()
    const newPlan: PricingPlanRow = {
      id: newPlanId, name: "", description: "", billingPeriod: "Monthly",
      amount: "0.00", currency: "USD", status: "draft" as const, draft: undefined,
    }
    setPricingPlans([newPlan])
    setEditingPricingPlanId(newPlanId)
    resetPricingPlanFormToDefaults()
    setGetStartedDismissed(true)
    setIsInlineGetStartedActive(false)
    setIsTreeNavOpen(true)
    setHasTreeChanges(false)

    setPlanName(setup.name)
    setPlanDescription(setup.description)

    if (setup.subscriptionFees?.length) {
      setPlanSubscriptionFees(setup.subscriptionFees.map((f) => ({ id: f.id, name: f.name })))
      const amounts: Record<number, string> = {}
      const periods: Record<number, string> = {}
      for (const f of setup.subscriptionFees) { amounts[f.id] = f.amount; periods[f.id] = f.period }
      setSubscriptionFeeAmounts(amounts)
      setSubscriptionFeePeriods(periods)
    } else {
      setPlanSubscriptionFees([])
    }

    setPlanRateCards(setup.rateCards)
    setActivePlanRateCardId(setup.rateCards[0]?.id ?? 0)
    setPlanExpandedRateCards({})
    setRateCardServicingPeriods(setup.servicingPeriods)

    const unitPrices: Record<number, string> = {}
    const priceTypes: Record<number, string> = {}
    const metersMap: Record<number, string> = {}
    const unitLabelsMap: Record<number, string> = {}
    const sellAsMap: Record<number, string> = {}
    const tiersMap: Record<number, number[]> = {}
    const tierToValues: Record<number, Record<number, string>> = {}
    const tierUnitPricesMap: Record<number, Record<number, string>> = {}
    const tierFlatFeesMap: Record<number, Record<number, string>> = {}

    for (const [rateIdStr, cfg] of Object.entries(setup.rateConfigs)) {
      const rateId = Number(rateIdStr)
      priceTypes[rateId] = cfg.priceType
      metersMap[rateId] = cfg.meter
      unitLabelsMap[rateId] = cfg.unitLabel
      if (cfg.sellAs) sellAsMap[rateId] = cfg.sellAs
      if (cfg.unitPrice) unitPrices[rateId] = cfg.unitPrice
      if (cfg.tiers) {
        tiersMap[rateId] = cfg.tiers.ids
        tierToValues[rateId] = cfg.tiers.toValues
        tierUnitPricesMap[rateId] = cfg.tiers.unitPrices
        tierFlatFeesMap[rateId] = cfg.tiers.flatFees
      } else {
        tiersMap[rateId] = [0, 1]
      }
    }

    setPlanRateUnitPrices(unitPrices)
    setRatePriceTypes(priceTypes)
    setRateMeters(metersMap)
    setRateUnitLabels(unitLabelsMap)
    setRateSellAs(sellAsMap)
    setPlanRateTiers(tiersMap)
    setPlanRateTierToValues(tierToValues)
    setPlanRateTierUnitPrices(tierUnitPricesMap)
    setPlanRateTierFlatFees(tierFlatFeesMap)

    // Register the plan's rate cards and subscription fees as session components
    const nowLabel = () => new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })
    for (const rc of setup.rateCards) {
      const compId = `plan-${newPlanId}-rc-${rc.id}`
      registerComponent({
        componentId: compId,
        kind: "rateCard",
        name: rc.name || `Rate Card ${rc.id}`,
        summary: `${rc.rates.length} rate${rc.rates.length !== 1 ? "s" : ""}`,
        versions: [{ id: `${compId}-v1`, label: nowLabel(), createdAt: Date.now(), isLatest: true }],
        activeVersionId: `${compId}-v1`,
      })
      setBaseline(compId, JSON.stringify({ name: rc.name }))
    }
    if (setup.rateCards.length > 0) {
      setPlanRateCards((prev) =>
        prev.map((rc) => {
          if (rc.componentLink) return rc
          const compId = `plan-${newPlanId}-rc-${rc.id}`
          return { ...rc, componentLink: { componentId: compId, versionId: `${compId}-v1` } }
        })
      )
    }
    const subFeeItems = setup.subscriptionFees ?? []
    for (const sf of subFeeItems) {
      const compId = `plan-${newPlanId}-sf-${sf.id}`
      registerComponent({
        componentId: compId,
        kind: "subscriptionFee",
        name: sf.name,
        summary: "",
        versions: [{ id: `${compId}-v1`, label: nowLabel(), createdAt: Date.now(), isLatest: true }],
        activeVersionId: `${compId}-v1`,
      })
      setBaseline(compId, JSON.stringify({ name: sf.name }))
    }
    if (subFeeItems.length > 0) {
      setPlanSubscriptionFees((prev) =>
        prev.map((sf) => {
          if (sf.componentLink) return sf
          const compId = `plan-${newPlanId}-sf-${sf.id}`
          return { ...sf, componentLink: { componentId: compId, versionId: `${compId}-v1` } }
        })
      )
    }

    setIsProductModalOpen(false)
    setIsPricingPlanModalOpen(true)
    setActivePlanNode({ type: "plan" })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Simulate Loops / Simulate Cursor via settings panel
  useEffect(() => {
    const handleLoops = () => {
      // Loops: 1000 flat-rate contact tiers, $19-$399/mo
      const rates: { id: number; name: string }[] = []
      const rateConfigs: Record<number, { priceType: string; meter: string; unitLabel: string; unitPrice: string }> = {}
      for (let i = 0; i < 1000; i++) {
        const contacts = 1000 + i * 999
        const price = Math.round(19 + 380 * Math.pow(i / 999, 1.3))
        rates.push({ id: i, name: `Up to ${new Intl.NumberFormat().format(contacts)} subscribed contacts` })
        rateConfigs[i] = {
          priceType: "Fixed rate", meter: "subscribed_contacts",
          unitLabel: "month", unitPrice: `${price}.00`,
        }
      }
      openSimulatedPlan({
        name: "Loops",
        description: "Send product, marketing, and transactional emails",
        rateCards: [{ id: 0, name: "Email Contacts", rates }],
        rateConfigs,
        servicingPeriods: { 0: "Monthly" },
      })
    }

    const handleCursor = () => {
      // Cursor: 57 AI models with graduated per-token pricing
      const models: { name: string; meter: string; inputPer1M: number }[] = [
        { name: "GPT-4o", meter: "openai_gpt4o_tokens", inputPer1M: 2.50 },
        { name: "GPT-4o mini", meter: "openai_gpt4o_mini_tokens", inputPer1M: 0.15 },
        { name: "GPT-4 Turbo", meter: "openai_gpt4_turbo_tokens", inputPer1M: 10.00 },
        { name: "GPT-4", meter: "openai_gpt4_tokens", inputPer1M: 30.00 },
        { name: "GPT-3.5 Turbo", meter: "openai_gpt35_turbo_tokens", inputPer1M: 0.50 },
        { name: "o1", meter: "openai_o1_tokens", inputPer1M: 15.00 },
        { name: "o1-mini", meter: "openai_o1_mini_tokens", inputPer1M: 3.00 },
        { name: "o1-pro", meter: "openai_o1_pro_tokens", inputPer1M: 150.00 },
        { name: "o3-mini", meter: "openai_o3_mini_tokens", inputPer1M: 1.10 },
        { name: "GPT-4.5 Preview", meter: "openai_gpt45_preview_tokens", inputPer1M: 75.00 },
        { name: "Claude 4 Opus", meter: "anthropic_claude4_opus_tokens", inputPer1M: 15.00 },
        { name: "Claude 4 Sonnet", meter: "anthropic_claude4_sonnet_tokens", inputPer1M: 3.00 },
        { name: "Claude 3.5 Sonnet", meter: "anthropic_claude35_sonnet_tokens", inputPer1M: 3.00 },
        { name: "Claude 3.5 Haiku", meter: "anthropic_claude35_haiku_tokens", inputPer1M: 0.80 },
        { name: "Claude 3 Opus", meter: "anthropic_claude3_opus_tokens", inputPer1M: 15.00 },
        { name: "Claude 3 Sonnet", meter: "anthropic_claude3_sonnet_tokens", inputPer1M: 3.00 },
        { name: "Claude 3 Haiku", meter: "anthropic_claude3_haiku_tokens", inputPer1M: 0.25 },
        { name: "Gemini 2.0 Flash", meter: "google_gemini2_flash_tokens", inputPer1M: 0.10 },
        { name: "Gemini 2.0 Pro", meter: "google_gemini2_pro_tokens", inputPer1M: 1.25 },
        { name: "Gemini 1.5 Pro", meter: "google_gemini15_pro_tokens", inputPer1M: 1.25 },
        { name: "Gemini 1.5 Flash", meter: "google_gemini15_flash_tokens", inputPer1M: 0.075 },
        { name: "Gemini 1.5 Flash-8B", meter: "google_gemini15_flash8b_tokens", inputPer1M: 0.0375 },
        { name: "Gemini 1.0 Pro", meter: "google_gemini1_pro_tokens", inputPer1M: 0.50 },
        { name: "Llama 3.3 70B", meter: "meta_llama33_70b_tokens", inputPer1M: 0.60 },
        { name: "Llama 3.1 405B", meter: "meta_llama31_405b_tokens", inputPer1M: 3.00 },
        { name: "Llama 3.1 70B", meter: "meta_llama31_70b_tokens", inputPer1M: 0.60 },
        { name: "Llama 3.1 8B", meter: "meta_llama31_8b_tokens", inputPer1M: 0.05 },
        { name: "Llama 3 70B", meter: "meta_llama3_70b_tokens", inputPer1M: 0.59 },
        { name: "Llama 3 8B", meter: "meta_llama3_8b_tokens", inputPer1M: 0.05 },
        { name: "Mistral Large", meter: "mistral_large_tokens", inputPer1M: 2.00 },
        { name: "Mistral Medium", meter: "mistral_medium_tokens", inputPer1M: 2.70 },
        { name: "Mistral Small", meter: "mistral_small_tokens", inputPer1M: 0.20 },
        { name: "Mistral Nemo", meter: "mistral_nemo_tokens", inputPer1M: 0.15 },
        { name: "Mixtral 8x22B", meter: "mistral_mixtral_8x22b_tokens", inputPer1M: 0.90 },
        { name: "Mixtral 8x7B", meter: "mistral_mixtral_8x7b_tokens", inputPer1M: 0.24 },
        { name: "Codestral", meter: "mistral_codestral_tokens", inputPer1M: 0.30 },
        { name: "Command R+", meter: "cohere_command_rplus_tokens", inputPer1M: 2.50 },
        { name: "Command R", meter: "cohere_command_r_tokens", inputPer1M: 0.15 },
        { name: "Command Light", meter: "cohere_command_light_tokens", inputPer1M: 0.30 },
        { name: "DeepSeek V3", meter: "deepseek_v3_tokens", inputPer1M: 0.27 },
        { name: "DeepSeek R1", meter: "deepseek_r1_tokens", inputPer1M: 0.55 },
        { name: "DeepSeek Coder V2", meter: "deepseek_coder_v2_tokens", inputPer1M: 0.14 },
        { name: "Grok 2", meter: "xai_grok2_tokens", inputPer1M: 2.00 },
        { name: "Grok 2 Mini", meter: "xai_grok2_mini_tokens", inputPer1M: 0.20 },
        { name: "Grok 3", meter: "xai_grok3_tokens", inputPer1M: 3.00 },
        { name: "Grok 3 Mini", meter: "xai_grok3_mini_tokens", inputPer1M: 0.30 },
        { name: "Nova Pro", meter: "amazon_nova_pro_tokens", inputPer1M: 0.80 },
        { name: "Nova Lite", meter: "amazon_nova_lite_tokens", inputPer1M: 0.06 },
        { name: "Nova Micro", meter: "amazon_nova_micro_tokens", inputPer1M: 0.035 },
        { name: "Jamba 1.5 Large", meter: "ai21_jamba15_large_tokens", inputPer1M: 2.00 },
        { name: "Jamba 1.5 Mini", meter: "ai21_jamba15_mini_tokens", inputPer1M: 0.20 },
        { name: "Qwen 2.5 72B", meter: "qwen_25_72b_tokens", inputPer1M: 0.40 },
        { name: "Qwen 2.5 Coder 32B", meter: "qwen_25_coder_32b_tokens", inputPer1M: 0.20 },
        { name: "QwQ 32B", meter: "qwen_qwq_32b_tokens", inputPer1M: 0.20 },
        { name: "Sonar Large", meter: "perplexity_sonar_large_tokens", inputPer1M: 1.00 },
        { name: "Sonar Small", meter: "perplexity_sonar_small_tokens", inputPer1M: 0.20 },
        { name: "Sonar Reasoning", meter: "perplexity_sonar_reasoning_tokens", inputPer1M: 1.00 },
      ]

      const rates = models.map((m, i) => ({ id: i, name: m.name }))
      const rateConfigs: Record<number, { priceType: string; meter: string; unitLabel: string; sellAs: string; tiers: { ids: number[]; toValues: Record<number, string>; unitPrices: Record<number, string>; flatFees: Record<number, string> } }> = {}
      for (let i = 0; i < models.length; i++) {
        const m = models[i]
        const t0 = i * 3; const t1 = t0 + 1; const t2 = t0 + 2
        const base = m.inputPer1M / 1000
        rateConfigs[i] = {
          priceType: "Graduated", meter: m.meter, unitLabel: "1K token", sellAs: "Individual units",
          tiers: {
            ids: [t0, t1, t2],
            toValues: { [t0]: "1000", [t1]: "10000", [t2]: "" },
            unitPrices: { [t0]: base.toFixed(6), [t1]: (base * 0.8).toFixed(6), [t2]: (base * 0.6).toFixed(6) },
            flatFees: { [t0]: "0", [t1]: "0", [t2]: "0" },
          },
        }
      }
      openSimulatedPlan({
        name: "AI Platform Pro",
        description: "Access to all AI models with usage-based token pricing",
        rateCards: [{ id: 0, name: "AI Model Usage", rates }],
        subscriptionFees: [{ id: 0, name: "Platform License", amount: "20.00", period: "Monthly" }],
        rateConfigs,
        servicingPeriods: { 0: "Monthly" },
      })
    }

    const handleRetell = () => {
      // Retell AI: per-minute voice AI platform — 18 phone/feature subscription fees + 118-rate "Retell Rates" card
      const subscriptionFees = [
        { id: 0,  name: "Australia Twilio Phone Number",     amount: "5.00",  period: "Monthly" },
        { id: 1,  name: "Canada Twilio Phone Number",        amount: "2.00",  period: "Monthly" },
        { id: 2,  name: "Concurrency",                       amount: "8.00",  period: "Monthly" },
        { id: 3,  name: "CPS Telnyx",                        amount: "25.00", period: "Monthly" },
        { id: 4,  name: "CPS Twilio",                        amount: "25.00", period: "Monthly" },
        { id: 5,  name: "Indonesia Twilio Phone Number",     amount: "39.00", period: "Monthly" },
        { id: 6,  name: "Italy Twilio Phone Number",         amount: "42.00", period: "Monthly" },
        { id: 7,  name: "Japan Twilio Phone Number",         amount: "7.00",  period: "Monthly" },
        { id: 8,  name: "Knowledge Base Hosting",            amount: "0.00",  period: "Monthly" },
        { id: 9,  name: "Malaysia Twilio Phone Number",      amount: "7.00",  period: "Monthly" },
        { id: 10, name: "Mexico Twilio Phone Number",        amount: "11.00", period: "Monthly" },
        { id: 11, name: "Philippines Twilio Phone Number",   amount: "5.00",  period: "Monthly" },
        { id: 12, name: "SMS Subscription",                  amount: "20.00", period: "Monthly" },
        { id: 13, name: "UK Twilio Phone Number",            amount: "2.00",  period: "Monthly" },
        { id: 14, name: "US Telnyx Phone Number",            amount: "2.00",  period: "Monthly" },
        { id: 15, name: "US Twilio Phone Number",            amount: "2.00",  period: "Monthly" },
        { id: 16, name: "US Twilio Tollfree Phone Number",   amount: "5.00",  period: "Monthly" },
        { id: 17, name: "Verified Phone Number",             amount: "10.00", period: "Monthly" },
      ]
      import("@/lib/retell-rates.json").then((mod) => {
        const retellRates: { n: string; p: string }[] = mod.default as { n: string; p: string }[]
        const rates = retellRates.map((r, i) => ({ id: i, name: r.n }))
        const rateConfigs: Record<number, { priceType: string; meter: string; unitLabel: string; unitPrice: string }> = {}
        for (let i = 0; i < retellRates.length; i++) {
          const meterName = retellRates[i].n.toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_").replace(/[^a-z0-9_]/g, "")
          rateConfigs[i] = {
            priceType: "Fixed rate",
            meter: meterName,
            unitLabel: "min",
            unitPrice: retellRates[i].p,
          }
        }
        openSimulatedPlan({
          name: "Retell Pricing Plan",
          description: "Retell AI voice agent platform — per-minute usage pricing across telephony, LLM, and voice providers",
          subscriptionFees,
          rateCards: [{ id: 0, name: "Retell Rates", rates }],
          rateConfigs,
          servicingPeriods: { 0: "Monthly" },
        })
      })
    }

    const handlePhoton = () => {
      // Photon Health: $50/mo platform fee + $0.50 per order
      openSimulatedPlan({
        name: "Doximity Pricing Plan",
        description: "Photon Health pharmacy platform — platform fee plus per-order pricing",
        subscriptionFees: [{ id: 0, name: "Platform Fee", amount: "50.00", period: "Monthly" }],
        rateCards: [{ id: 0, name: "Per-Order Fee", rates: [{ id: 0, name: "Orders" }] }],
        rateConfigs: {
          0: { priceType: "Fixed rate", meter: "orders", unitLabel: "order", unitPrice: "0.50" },
        },
        servicingPeriods: { 0: "Monthly" },
      })
    }

    const handleCloudflare = () => {
      import("@/lib/cloudflare-rates.json").then((mod) => {
        const cfRates: { n: string; p: string }[] = mod.default as { n: string; p: string }[]
        const rates = cfRates.map((r, i) => ({ id: i, name: r.n }))
        const rateConfigs: Record<number, { priceType: string; meter: string; unitLabel: string; unitPrice: string }> = {}
        for (let i = 0; i < cfRates.length; i++) {
          const meterName = cfRates[i].n.toLowerCase().replace(/\s+/g, "_")
          rateConfigs[i] = {
            priceType: "Fixed rate",
            meter: meterName,
            unitLabel: "token",
            unitPrice: cfRates[i].p,
          }
        }
        openSimulatedPlan({
          name: "AI Gateway Standard",
          description: "Cloudflare AI Gateway — usage-based token pricing across all providers",
          rateCards: [{ id: 0, name: "AI Gateway Standard Rate Card", rates }],
          rateConfigs,
          servicingPeriods: { 0: "Monthly" },
        })
      })
    }

    window.addEventListener("simulate-loops", handleLoops)
    window.addEventListener("simulate-cursor", handleCursor)
    window.addEventListener("simulate-cloudflare", handleCloudflare)
    window.addEventListener("simulate-retell", handleRetell)
    window.addEventListener("simulate-photon", handlePhoton)
    return () => {
      window.removeEventListener("simulate-loops", handleLoops)
      window.removeEventListener("simulate-cursor", handleCursor)
      window.removeEventListener("simulate-cloudflare", handleCloudflare)
      window.removeEventListener("simulate-retell", handleRetell)
      window.removeEventListener("simulate-photon", handlePhoton)
    }
  }, [openSimulatedPlan])

  // Add a new pricing plan inline (from sidebar) - saves current draft and starts a new one
  const handleAddPlanInline = () => {
    // Save current plan as draft first (if it has content)
    const trimmedName = getPlanLabel(planName, t("Untitled pricing plan"))
    const amount = Number.isFinite(planTotal) ? (Math.round(planTotal * 100) / 100).toFixed(2) : "0.00"
    const draft = buildPricingPlanDraft()

    let updatedPlans = pricingPlans

    if (editingPricingPlanId != null) {
      // Update existing plan
      updatedPlans = pricingPlans.map((p) =>
        p.id === editingPricingPlanId
          ? { ...p, name: trimmedName, description: planDescription, billingPeriod: "Monthly" as const, amount, currency: planCurrency, status: p.status, draft }
          : p
      )
    } else if (planName.trim() || planRateCards.length > 0) {
      // Save current as new draft if there's any content (first plan being edited)
      const savedPlan: PricingPlanRow = {
        id: Date.now(),
        name: trimmedName,
        description: planDescription,
        billingPeriod: "Monthly",
        amount,
        currency: planCurrency,
        status: "draft",
        draft,
      }
      updatedPlans = [...pricingPlans, savedPlan]
    }

    // Create a NEW plan entry for the fresh plan
    const newPlanId = Date.now() + 1 // Ensure different ID from any saved plan
    const newPlan: PricingPlanRow = {
      id: newPlanId,
      name: "",
      description: "",
      billingPeriod: "Monthly",
      amount: "0.00",
      currency: "USD",
      status: "draft",
      draft: undefined, // Will use defaults from form
    }

    setPricingPlans([...updatedPlans, newPlan])
    setEditingPricingPlanId(newPlanId)
    resetPricingPlanFormToDefaults()
    setActivePlanNode({ type: "plan" })
  }

  // Switch to editing another plan (from sidebar)
  const handleSwitchToPlan = (planId: number) => {
    // Save current plan as draft first (if it has content)
    const trimmedName = getPlanLabel(planName, t("Untitled pricing plan"))
    const amount = Number.isFinite(planTotal) ? (Math.round(planTotal * 100) / 100).toFixed(2) : "0.00"
    const draft = buildPricingPlanDraft()

    if (editingPricingPlanId != null) {
      // Update existing plan
      setPricingPlans((prev) =>
        prev.map((p) =>
          p.id === editingPricingPlanId
            ? { ...p, name: trimmedName, description: planDescription, billingPeriod: "Monthly", amount, currency: planCurrency, status: p.status, draft }
            : p
        )
      )
    } else if (planName.trim() || planRateCards.length > 0) {
      // Save as new draft if there's any content
      const newPlan: PricingPlanRow = {
        id: Date.now(),
        name: trimmedName,
        description: planDescription,
        billingPeriod: "Monthly",
        amount,
        currency: planCurrency,
        status: "draft",
        draft,
      }
      setPricingPlans((prev) => [newPlan, ...prev])
    }

    // Load the target plan
    const targetPlan = pricingPlans.find((p) => p.id === planId)
    if (targetPlan) {
      setEditingPricingPlanId(targetPlan.id)
      if (targetPlan.draft) {
        loadPricingPlanDraft(targetPlan.draft)
        autoRegisterAndLinkPlanComponents(targetPlan.id, targetPlan.draft)
      } else {
        resetPricingPlanFormToDefaults()
      }
      setActivePlanNode({ type: "plan" })
    }
  }

  // Coachmark tour handlers
  // Note: The actual step count is determined by layout mode in PricingPlanModalOverlay
  // Using COACHMARK_STEPS_LAYOUT_A.length as the upper bound since it has the most steps
  const handleCoachmarkNext = () => {
    if (currentCoachmarkStep < COACHMARK_STEPS_LAYOUT_A.length - 1) {
      setCurrentCoachmarkStep((prev) => prev + 1)
    } else {
      // Tour complete
      setIsCoachmarkTourActive(false)
      setCurrentCoachmarkStep(0)
    }
  }

  const handleCoachmarkPrev = () => {
    if (currentCoachmarkStep > 0) {
      setCurrentCoachmarkStep((prev) => prev - 1)
    }
  }

  const handleCoachmarkClose = () => {
    setIsCoachmarkTourActive(false)
    setCurrentCoachmarkStep(0)
  }

  const handleCoachmarkNavigateToStep = (stepId: string) => {
    // Check both layout step arrays to find the step
    let stepIndex = COACHMARK_STEPS_LAYOUT_A.findIndex((s) => s.id === stepId)
    if (stepIndex === -1) {
      stepIndex = COACHMARK_STEPS_LAYOUT_B.findIndex((s) => s.id === stepId)
    }
    if (stepIndex !== -1) {
      setCurrentCoachmarkStep(stepIndex)
      // Navigate to the appropriate tab based on the step
      if (stepId === "map-tab") {
        setCustomerPreviewMode("Map")
      } else if (stepId === "preview-tab") {
        setCustomerPreviewMode("Preview")
      } else if (stepId === "code-tab") {
        setCustomerPreviewMode("Code")
      }
    }
  }

  const addProductPrompt = useAddProductPromptRouting({
    isPopoverOpen: isAddProductPopoverOpen,
    setIsPopoverOpen: setIsAddProductPopoverOpen,
    onOpenCreateModal: handleOpenCreateModal,
    onOpenPricingPlanModal: handleOpenPricingPlanModal,
    setIsAssistantOpen,
    setAssistantSeedPrompt,
    setIsPlanAssistantOpen,
    setPlanAssistantSeedPrompt,
  })

  type MetadataMap = Record<number, number[]>
  type MetadataValueMap = Record<number, Record<number, { key: string; value: string }>>

  const getMetadataRows = (map: MetadataMap, id: number) => map[id] ?? []

  const addMetadataRow = (
    setter: Dispatch<SetStateAction<MetadataMap>>,
    id: number,
    valueSetter?: Dispatch<SetStateAction<MetadataValueMap>>
  ) => {
    let nextId = 0
    setter((prev) => {
      const current = prev[id] ?? []
      nextId = current.length ? Math.max(...current) + 1 : 0
      return { ...prev, [id]: [...current, nextId] }
    })
    if (valueSetter) {
      valueSetter((prev) => {
        const current = prev[id] ?? {}
        return { ...prev, [id]: { ...current, [nextId]: { key: "", value: "" } } }
      })
    }
  }

  const removeMetadataRow = (
    setter: Dispatch<SetStateAction<MetadataMap>>,
    id: number,
    rowId: number,
    valueSetter?: Dispatch<SetStateAction<MetadataValueMap>>
  ) => {
    setter((prev) => {
      const current = prev[id] ?? []
      return { ...prev, [id]: current.filter((entry) => entry !== rowId) }
    })
    if (valueSetter) {
      valueSetter((prev) => {
        const current = prev[id]
        if (!current || !(rowId in current)) return prev
        const next = { ...current }
        delete next[rowId]
        return { ...prev, [id]: next }
      })
    }
  }

  const handleAddPlanRateCard = () => {
    setPlanRateCards((prev) => {
      const nextCardId = prev.length ? Math.max(...prev.map((card) => card.id)) + 1 : 0
      const nextRateId = (() => {
        const cardMax = prev.reduce((max, item) => {
          const cMax = item.rates.length ? Math.max(...item.rates.map((rate) => rate.id)) : -1
          return Math.max(max, cMax)
        }, -1)
        const standaloneMax = planRates.length ? Math.max(...planRates.map((r) => r.id)) : -1
        return Math.max(cardMax, standaloneMax) + 1
      })()
      const next = [
        ...prev,
        {
          id: nextCardId,
          name: "",
          rates: [{ id: nextRateId, name: "" }],
        },
      ]
      setActivePlanRateCardId(nextCardId)
      setPlanExpandedRateCards((cards) => ({ ...cards, [nextCardId]: true }))
      return next
    })
  }

  const getMaxRateId = () => {
    const cardMax = planRateCards.reduce((max, item) => {
      const cMax = item.rates.length ? Math.max(...item.rates.map((rate) => rate.id)) : -1
      return Math.max(max, cMax)
    }, -1)
    const standaloneMax = planRates.length ? Math.max(...planRates.map((r) => r.id)) : -1
    return Math.max(cardMax, standaloneMax)
  }

  const handleAddPlanRate = (rateCardId: number) => {
    const card = planRateCards.find((c) => c.id === rateCardId)
    if (!card) return

    // Create a new rate, inheriting settings from the last rate in the card
    const lastRate = card.rates[card.rates.length - 1]
    const nextId = getMaxRateId() + 1
    const totalRates = planRateCards.reduce((sum, c) => sum + c.rates.length, 0) + planRates.length
    const nextRate = { id: nextId, name: "" }

    // Inherit settings from last rate, or use defaults
    const sourcePriceType = lastRate ? (ratePriceTypes[lastRate.id] ?? planPriceTypeOptions[0]) : planPriceTypeOptions[0]
    const sourceTiers = lastRate ? (planRateTiers[lastRate.id] ?? [0, 1]) : [0, 1]
    const sourceTierToValues = lastRate ? (planRateTierToValues[lastRate.id] ?? {}) : {}
    const sourceTierUnitPrices = lastRate ? (planRateTierUnitPrices[lastRate.id] ?? {}) : {}
    const sourceTierFlatFees = lastRate ? (planRateTierFlatFees[lastRate.id] ?? {}) : {}
    const sourceIncludeTax = lastRate ? (planRateIncludeTax[lastRate.id] ?? includeTaxOptions[0]) : includeTaxOptions[0]

    setPlanRateUsage((usage) => ({ ...usage, [nextId]: "0" }))
    setPlanRateUnitPrices((prices) => ({ ...prices, [nextId]: "" }))
    setRatePriceTypes((types) => ({ ...types, [nextId]: sourcePriceType }))
    setPlanRateTiers((tiers) => ({ ...tiers, [nextId]: [...sourceTiers] }))
    setPlanRateTierToValues((values) => ({ ...values, [nextId]: { ...sourceTierToValues } }))
    setPlanRateTierUnitPrices((values) => ({ ...values, [nextId]: { ...sourceTierUnitPrices } }))
    setPlanRateTierFlatFees((values) => ({ ...values, [nextId]: { ...sourceTierFlatFees } }))
    setPlanRateIncludeTax((values) => ({ ...values, [nextId]: sourceIncludeTax }))
    setPlanRateCurrencies((currencies) => ({ ...currencies, [nextId]: [{ id: 0, code: planCurrency }] }))
    setPlanRateActiveCurrencyId((ids) => ({ ...ids, [nextId]: 0 }))

    setActivePlanRateCardId(rateCardId)
    setPlanExpandedRateCards((cards) => ({ ...cards, [rateCardId]: true }))

    setPlanRateCards((prev) =>
      prev.map((c) => {
        if (c.id !== rateCardId) return c
        return { ...c, rates: [...c.rates, nextRate] }
      })
    )
  }

  const handleAddStandaloneRate = () => {
    const nextId = getMaxRateId() + 1
    const nextRate = { id: nextId, name: "" }

    setPlanRateUsage((usage) => ({ ...usage, [nextId]: "0" }))
    setPlanRateUnitPrices((prices) => ({ ...prices, [nextId]: "" }))
    setRatePriceTypes((types) => ({ ...types, [nextId]: planPriceTypeOptions[0] }))
    setPlanRateTiers((tiers) => ({ ...tiers, [nextId]: [0, 1] }))
    setPlanRateTierToValues((values) => ({ ...values, [nextId]: {} }))
    setPlanRateTierUnitPrices((values) => ({ ...values, [nextId]: {} }))
    setPlanRateTierFlatFees((values) => ({ ...values, [nextId]: {} }))
    setPlanRateIncludeTax((values) => ({ ...values, [nextId]: includeTaxOptions[0] }))
    setPlanRateCurrencies((currencies) => ({ ...currencies, [nextId]: [{ id: 0, code: planCurrency }] }))
    setPlanRateActiveCurrencyId((ids) => ({ ...ids, [nextId]: 0 }))

    setPlanRates((prev) => [...prev, nextRate])
    setActivePlanNode({ type: "rate", id: nextId })
  }

  const handleAddPlanUsageScenarioRate = (rateCardId: number) => {
    hasUserEditedPlanUsageScenarioRef.current = true
    const rateCard = planRateCards.find((card) => card.id === rateCardId)
    if (!rateCard) return
    const used = new Set(planUsageScenarioRates)
    const nextRate =
      rateCard.rates.find((rate) => rate.name.trim() !== "" && !used.has(rate.id)) ??
      rateCard.rates.find((rate) => !used.has(rate.id)) ??
      null
    if (!nextRate) return
    setPlanUsageScenarioRates((prev) => (prev.includes(nextRate.id) ? prev : [...prev, nextRate.id]))
  }

  const updateRateCardName = (id: number, value: string) => {
    setPlanRateCards((prev) => prev.map((card) => (card.id === id ? { ...card, name: value } : card)))
  }

  const updateRateName = (rateId: number, value: string) => {
    const isStandalone = planRates.some((r) => r.id === rateId)
    if (isStandalone) {
      setPlanRates((prev) => prev.map((rate) => (rate.id === rateId ? { ...rate, name: value } : rate)))
    } else {
      setPlanRateCards((prev) =>
        prev.map((card) => ({
          ...card,
          rates: card.rates.map((rate) => (rate.id === rateId ? { ...rate, name: value } : rate)),
        }))
      )
    }
  }

  const updateCreditGrantName = (id: number, value: string) => {
    setPlanCreditGrants((prev) => prev.map((grant) => (grant.id === id ? { ...grant, name: value } : grant)))
  }

  const updateSubscriptionFeeName = (id: number, value: string) => {
    setPlanSubscriptionFees((prev) => prev.map((fee) => (fee.id === id ? { ...fee, name: value } : fee)))
  }

  const handleDeletePlanRateCard = (id: number) => {
    setPlanRateCards((prev) => {
      const next = prev.filter((card) => card.id !== id)
      if (!next.length) {
        const fallback = { id: 0, name: "", rates: [{ id: 0, name: "" }] }
        setActivePlanRateCardId(0)
        setPlanExpandedRateCards({})
        setPlanRateUsage({ 0: "0" })
        setPlanRateUnitPrices({ 0: "" })
        setPlanUsageScenarioRates([0])
        setActivePlanNode({ type: "rateCard", id: 0 })
        return [fallback]
      }
      if (activePlanRateCardId === id) {
        setActivePlanRateCardId(next[0].id)
        setActivePlanNode({ type: "rateCard", id: next[0].id })
      }
      setPlanExpandedRateCards((prevExpanded) => {
        const updated = { ...prevExpanded }
        delete updated[id]
        return updated
      })
      return next
    })
  }

  const handleDeletePlanRate = (rateId: number) => {
    const isStandalone = planRates.some((r) => r.id === rateId)
    if (isStandalone) {
      setPlanRates((prev) => prev.filter((rate) => rate.id !== rateId))
    } else {
      setPlanRateCards((prev) =>
        prev.map((card) => {
          if (!card.rates.some((rate) => rate.id === rateId)) return card
          const nextRates = card.rates.filter((rate) => rate.id !== rateId)
          return { ...card, rates: nextRates }
        })
      )
    }
    if (activePlanNode.type === "rate" && activePlanNode.id === rateId) {
      if (isStandalone) {
        setActivePlanNode({ type: "plan" })
      } else {
        setActivePlanNode({ type: "rateCard", id: activePlanRateCardId })
      }
    }
  }

  const handleMoveRateToPriceGroup = (rateId: number, rateCardId: number) => {
    const rate = planRates.find((r) => r.id === rateId)
    if (!rate) return
    setPlanRates((prev) => prev.filter((r) => r.id !== rateId))
    setPlanRateCards((prev) =>
      prev.map((card) => {
        if (card.id !== rateCardId) return card
        return { ...card, rates: [...card.rates, rate] }
      })
    )
    setPlanExpandedRateCards((prev) => ({ ...prev, [rateCardId]: true }))
  }

  const handleDeletePlanCreditGrant = (id: number) => {
    setPlanCreditGrants((prev) => prev.filter((grant) => grant.id !== id))
    if (activePlanNode.type === "creditGrant" && activePlanNode.id === id) {
      setActivePlanNode({ type: "plan" })
    }
  }

  const handleDeletePlanSubscriptionFee = (id: number) => {
    setPlanSubscriptionFees((prev) => prev.filter((fee) => fee.id !== id))
    if (activePlanNode.type === "subscriptionFee" && activePlanNode.id === id) {
      setActivePlanNode({ type: "plan" })
    }
  }

  const handleAddPlanObject = (kind: "rate-card" | "rate" | "credit-grant" | "subscription-fee" | "meter" | "product-with-price" | "price-group", rateCardId?: number) => {
    // Advance onboarding tour to form step (before closing popover so the effect doesn't dismiss it)
    if (onboardingTourStep === 2) {
      setOnboardingTourStep(3)
    }
    setIsAddPlanObjectOpen(false)
    // Mark that the user has a selected node so the preview can highlight it
    setHasUserSelectedNode(true)
    // Show field hints for the newly created item
    setShowFieldHints(true)
    // Signal tree change when sidebar is closed
    if (!isTreeNavOpen) setHasTreeChanges(true)
    // Trigger onboarding: show "Nav Hint" after second add (tips mode only),
    // but only if the user hasn't already opened the nav themselves.
    addedItemCountRef.current += 1
    if (addedItemCountRef.current === 1) {
      // Dismiss "Get Started" after first add and auto-open the sidebar nav
      setGetStartedDismissed(true)
      setIsTreeNavOpen(true)
      setHasTreeChanges(false)
      setShowSidebarTip(true)
    }
    if (addedItemCountRef.current >= 2 && onboardingMode === "tips" && !navHintDismissed && !showNavHint && !hasOpenedNavRef.current) {
      setShowNavHint(true)
    }
    if (kind === "price-group") {
      const nextId = planPriceGroups.length ? Math.max(...planPriceGroups.map((g) => g.id)) + 1 : 0
      setPlanPriceGroups((prev) => [...prev, { id: nextId, name: "", serviceInterval: "Monthly" }])
      setActivePlanNode({ type: "priceGroup", id: nextId })
      return
    }
    if (kind === "product-with-price") {
      const nextCardId = planRateCards.length ? Math.max(...planRateCards.map((c) => c.id)) + 1 : 0
      handleAddPlanRateCard()
      // Default new products to Flat
      setRateCardServicingPeriods((prev) => ({ ...prev, [nextCardId]: "Flat" }))
      // Also add a rate inside the new card
      const nextRateId = getMaxRateId() + 1
      handleAddPlanRate(nextCardId)
      // Select the product form first so user fills out product details before price
      setActivePlanNode({ type: "rateCard", id: nextCardId })
      setPlanExpandedRateCards((prev) => ({ ...prev, [nextCardId]: true }))
      return
    }
    if (kind === "rate-card") {
      const nextCardId = planRateCards.length ? Math.max(...planRateCards.map((c) => c.id)) + 1 : 0
      handleAddPlanRateCard()
      setActivePlanNode({ type: "rateCard", id: nextCardId })
      return
    }
    if (kind === "rate") {
      if (rateCardId != null) {
        // Adding rate inside a specific rate card
        handleAddPlanRate(rateCardId)
        const newId = getMaxRateId() + 1
        setActivePlanNode({ type: "rate", id: newId })
      } else {
        // Adding standalone rate at plan level
        handleAddStandaloneRate()
      }
      return
    }
    if (kind === "meter") {
      // Add a meter: needs a rate card → rate → meter.
      // 1. Ensure a rate card exists
      let targetCardId = rateCardId ?? activePlanRateCardId ?? planRateCards[0]?.id
      if (targetCardId == null) {
        // Create a rate card — we need to read the new ID after state update
        handleAddPlanRateCard()
        // The new card will have the next sequential ID
        const nextCardId = planRateCards.length ? Math.max(...planRateCards.map((c) => c.id)) + 1 : 0
        targetCardId = nextCardId
      }
      // 2. Create a rate on that rate card
      handleAddPlanRate(targetCardId)
      // 3. Attach a meter to the new rate and navigate to it
      // The new rate will have the next sequential ID
      const currentMaxRateId = planRateCards.reduce((max, card) => {
        const cardMax = card.rates.length ? Math.max(...card.rates.map((r) => r.id)) : -1
        return Math.max(max, cardMax)
      }, -1)
      const newRateId = currentMaxRateId + 1
      setRateMeters((prev) => ({ ...prev, [newRateId]: "" }))
      setActivePlanNode({ type: "rateMeter", id: newRateId })
      return
    }
    if (kind === "credit-grant") {
      const nextId = planCreditGrants.length ? Math.max(...planCreditGrants.map((item) => item.id)) + 1 : 0
      setPlanCreditGrants((prev) => [...prev, { id: nextId, name: "" }])
      setActivePlanNode({ type: "creditGrant", id: nextId })
      return
    }
    const nextId = planSubscriptionFees.length ? Math.max(...planSubscriptionFees.map((item) => item.id)) + 1 : 0
    setPlanSubscriptionFees((prev) => [...prev, { id: nextId, name: "" }])
    setActivePlanNode({ type: "subscriptionFee", id: nextId })
  }

  // ── Component system ────────────────────────────────────────────────
  const {
    hasComponents: merchantHasComponents,
    componentRegistry: allMerchantComponents,
    getSubscriptionFeeComponents,
    getRateCardComponents,
    getCreditGrantComponents,
    getComponent: getMerchantComponent,
    registerComponent,
    addVersionToComponent,
    getDraftState,
    setBaseline,
    markDirty,
    clearDirty,
    getAllDirtyComponents,
  } = useMerchantComponents()

  /**
   * Auto-register all rate cards, subscription fees, and credit grants from an
   * existing plan as session components so they always appear in the component
   * registry and show the version icon — regardless of the "has components" toggle.
   */
  const autoRegisterAndLinkPlanComponents = useCallback(
    (planId: number, draft: PricingPlanDraft) => {
      const nowLabel = () => new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })

      const rcCards = draft.planRateCards ?? []
      rcCards.forEach((rc) => {
        const compId = `plan-${planId}-rc-${rc.id}`
        if (!getMerchantComponent(compId)) {
          const rateCount = rc.rates.length
          const versionLabel = nowLabel()
          registerComponent({
            componentId: compId,
            kind: "rateCard",
            name: rc.name || `Rate Card ${rc.id}`,
            summary: `${rateCount} rate${rateCount !== 1 ? "s" : ""}`,
            versions: [{ id: `${compId}-v1`, label: versionLabel, createdAt: Date.now(), isLatest: true }],
            activeVersionId: `${compId}-v1`,
          })
          setBaseline(compId, JSON.stringify({ name: rc.name }))
        }
      })
      if (rcCards.length > 0) {
        setPlanRateCards((prev) =>
          prev.map((rc) => {
            if (rc.componentLink) return rc
            const compId = `plan-${planId}-rc-${rc.id}`
            return { ...rc, componentLink: { componentId: compId, versionId: `${compId}-v1` } }
          })
        )
      }

      const subFees = draft.planSubscriptionFees ?? []
      subFees.forEach((sf) => {
        const compId = `plan-${planId}-sf-${sf.id}`
        if (!getMerchantComponent(compId)) {
          const versionLabel = nowLabel()
          registerComponent({
            componentId: compId,
            kind: "subscriptionFee",
            name: sf.name || `Subscription Fee ${sf.id}`,
            summary: "",
            versions: [{ id: `${compId}-v1`, label: versionLabel, createdAt: Date.now(), isLatest: true }],
            activeVersionId: `${compId}-v1`,
          })
          setBaseline(compId, JSON.stringify({ name: sf.name }))
        }
      })
      if (subFees.length > 0) {
        setPlanSubscriptionFees((prev) =>
          prev.map((sf) => {
            if (sf.componentLink) return sf
            const compId = `plan-${planId}-sf-${sf.id}`
            return { ...sf, componentLink: { componentId: compId, versionId: `${compId}-v1` } }
          })
        )
      }

      const cGrants = draft.planCreditGrants ?? []
      cGrants.forEach((cg) => {
        const compId = `plan-${planId}-cg-${cg.id}`
        if (!getMerchantComponent(compId)) {
          const versionLabel = nowLabel()
          registerComponent({
            componentId: compId,
            kind: "creditGrant",
            name: cg.name || `Credit Grant ${cg.id}`,
            summary: "",
            versions: [{ id: `${compId}-v1`, label: versionLabel, createdAt: Date.now(), isLatest: true }],
            activeVersionId: `${compId}-v1`,
          })
          setBaseline(compId, JSON.stringify({ name: cg.name }))
        }
      })
      if (cGrants.length > 0) {
        setPlanCreditGrants((prev) =>
          prev.map((cg) => {
            if (cg.componentLink) return cg
            const compId = `plan-${planId}-cg-${cg.id}`
            return { ...cg, componentLink: { componentId: compId, versionId: `${compId}-v1` } }
          })
        )
      }
    },
    [getMerchantComponent, registerComponent, setBaseline, setPlanRateCards, setPlanSubscriptionFees, setPlanCreditGrants],
  )

  // Existing components filtered for the currently active node type,
  // excluding the current node's own component (can't "Replace with" yourself)
  const existingComponentsForNodeType = useMemo(() => {
    let currentCompId: string | undefined
    if (activePlanNode.id != null) {
      if (activePlanNode.type === "rateCard") {
        currentCompId = planRateCards.find((c) => c.id === activePlanNode.id)?.componentLink?.componentId
      } else if (activePlanNode.type === "subscriptionFee") {
        currentCompId = planSubscriptionFees.find((f) => f.id === activePlanNode.id)?.componentLink?.componentId
      } else if (activePlanNode.type === "creditGrant") {
        currentCompId = planCreditGrants.find((g) => g.id === activePlanNode.id)?.componentLink?.componentId
      }
    }
    const filterSelf = (comps: ComponentRecord[]) =>
      currentCompId ? comps.filter((c) => c.componentId !== currentCompId) : comps
    if (activePlanNode.type === "rateCard") return filterSelf(getRateCardComponents())
    if (activePlanNode.type === "subscriptionFee") return filterSelf(getSubscriptionFeeComponents())
    if (activePlanNode.type === "creditGrant") return filterSelf(getCreditGrantComponents())
    return undefined
  }, [activePlanNode, planRateCards, planSubscriptionFees, planCreditGrants, getRateCardComponents, getSubscriptionFeeComponents, getCreditGrantComponents])

  // Component version info for the active node
  const activeNodeComponentLink = useMemo(() => {
    if (activePlanNode.type === "rateCard" && activePlanNode.id != null) {
      return planRateCards.find((c) => c.id === activePlanNode.id)?.componentLink
    }
    if (activePlanNode.type === "subscriptionFee" && activePlanNode.id != null) {
      return planSubscriptionFees.find((f) => f.id === activePlanNode.id)?.componentLink
    }
    if (activePlanNode.type === "creditGrant" && activePlanNode.id != null) {
      return planCreditGrants.find((g) => g.id === activePlanNode.id)?.componentLink
    }
    return undefined
  }, [activePlanNode, planRateCards, planSubscriptionFees, planCreditGrants])

  const activeNodeComponentVersions = useMemo(() => {
    if (!activeNodeComponentLink) return undefined
    return getMerchantComponent(activeNodeComponentLink.componentId)?.versions
  }, [activeNodeComponentLink, getMerchantComponent])

  const activeNodeComponentVersionId = activeNodeComponentLink?.versionId
  const activeNodeIsDraft = activeNodeComponentLink ? (getDraftState(activeNodeComponentLink.componentId)?.isDirty ?? false) : false

  // Read-only when viewing a non-latest component version
  const isComponentReadOnly = useMemo(() => {
    if (!activeNodeComponentVersions || !activeNodeComponentVersionId) return false
    const activeVersion = activeNodeComponentVersions.find((v) => v.id === activeNodeComponentVersionId)
    return activeVersion ? !activeVersion.isLatest : false
  }, [activeNodeComponentVersions, activeNodeComponentVersionId])

  /** Mark the active node's component dirty (handles rates inside component rate cards too) */
  const markActiveComponentDirty = useCallback(() => {
    if (activeNodeComponentLink) {
      markDirty(activeNodeComponentLink.componentId)
      return
    }
    // Rate or rateMeter inside a component-linked rate card
    if ((activePlanNode.type === "rate" || activePlanNode.type === "rateMeter") && activePlanNode.id != null) {
      const parentCard = planRateCards.find((c) => c.rates.some((r) => r.id === activePlanNode.id))
      if (parentCard?.componentLink) markDirty(parentCard.componentLink.componentId)
    }
  }, [activeNodeComponentLink, activePlanNode, planRateCards, markDirty])

  /** Called from AddPlanObjectPopover when user picks an existing component */
  const handleUseExistingComponent = useCallback((componentId: string, kind: ComponentKind) => {
    setIsAddPlanObjectOpen(false)
    setHasUserSelectedNode(true)
    const comp = getMerchantComponent(componentId)
    if (!comp) return

    if (kind === "rateCard") {
      // Find the simulated rate card for full data
      const simulated = SIMULATED_RATE_CARDS.find((rc) => rc.id === componentId)
      const nextCardId = planRateCards.length ? Math.max(...planRateCards.map((c) => c.id)) + 1 : 0
      const newRates = simulated?.rates.map((r, i) => ({ id: nextCardId * 100 + i, name: r.name })) ?? []
      const latestVersion = comp.versions.find((v) => v.isLatest) ?? comp.versions[0]
      setPlanRateCards((prev) => [...prev, {
        id: nextCardId,
        name: comp.name,
        rates: newRates,
        componentLink: { componentId, versionId: latestVersion?.id ?? "" },
      }])
      setActivePlanNode({ type: "rateCard", id: nextCardId })
      if (latestVersion) setBaseline(componentId, JSON.stringify({ name: comp.name, rates: newRates.map((r) => r.name) }))
    } else if (kind === "subscriptionFee") {
      const simulated = SIMULATED_SUBSCRIPTION_FEES.find((sf) => sf.id === componentId)
      const nextId = planSubscriptionFees.length ? Math.max(...planSubscriptionFees.map((f) => f.id)) + 1 : 0
      const latestVersion = comp.versions.find((v) => v.isLatest) ?? comp.versions[0]
      setPlanSubscriptionFees((prev) => [...prev, {
        id: nextId,
        name: comp.name,
        componentLink: { componentId, versionId: latestVersion?.id ?? "" },
      }])
      if (simulated) {
        setSubscriptionFeeAmounts((prev) => ({ ...prev, [nextId]: simulated.amount }))
        setSubscriptionFeePeriods((prev) => ({ ...prev, [nextId]: simulated.period }))
      }
      setActivePlanNode({ type: "subscriptionFee", id: nextId })
      if (latestVersion) setBaseline(componentId, JSON.stringify({ name: comp.name, amount: simulated?.amount, period: simulated?.period }))
    } else if (kind === "creditGrant") {
      const simulated = SIMULATED_CREDIT_GRANTS.find((cg) => cg.id === componentId)
      const nextId = planCreditGrants.length ? Math.max(...planCreditGrants.map((g) => g.id)) + 1 : 0
      const latestVersion = comp.versions.find((v) => v.isLatest) ?? comp.versions[0]
      setPlanCreditGrants((prev) => [...prev, {
        id: nextId,
        name: comp.name,
        componentLink: { componentId, versionId: latestVersion?.id ?? "" },
      }])
      if (simulated) {
        setCreditGrantAmounts((prev) => ({ ...prev, [nextId]: simulated.amount }))
        setCreditGrantPeriods((prev) => ({ ...prev, [nextId]: simulated.period }))
      }
      setActivePlanNode({ type: "creditGrant", id: nextId })
      if (latestVersion) setBaseline(componentId, JSON.stringify({ name: comp.name, amount: simulated?.amount, period: simulated?.period }))
    }
  }, [getMerchantComponent, planRateCards, planSubscriptionFees, planCreditGrants, setBaseline])

  /** Called from the ellipsis "Use existing" fly-out to replace current object with a component */
  const handleReplaceWithExistingComponent = useCallback((componentId: string) => {
    const comp = getMerchantComponent(componentId)
    if (!comp || activePlanNode.id == null) return

    const latestVersion = comp.versions.find((v) => v.isLatest) ?? comp.versions[0]
    const link = { componentId, versionId: latestVersion?.id ?? "" }

    if (activePlanNode.type === "rateCard") {
      const simulated = SIMULATED_RATE_CARDS.find((rc) => rc.id === componentId)
      setPlanRateCards((prev) =>
        prev.map((c) =>
          c.id === activePlanNode.id
            ? { ...c, name: comp.name, rates: simulated?.rates.map((r, i) => ({ id: c.id * 100 + i, name: r.name })) ?? c.rates, componentLink: link }
            : c
        )
      )
    } else if (activePlanNode.type === "subscriptionFee") {
      const simulated = SIMULATED_SUBSCRIPTION_FEES.find((sf) => sf.id === componentId)
      setPlanSubscriptionFees((prev) =>
        prev.map((f) => (f.id === activePlanNode.id ? { ...f, name: comp.name, componentLink: link } : f))
      )
      if (simulated) {
        setSubscriptionFeeAmounts((prev) => ({ ...prev, [activePlanNode.id!]: simulated.amount }))
        setSubscriptionFeePeriods((prev) => ({ ...prev, [activePlanNode.id!]: simulated.period }))
      }
    } else if (activePlanNode.type === "creditGrant") {
      const simulated = SIMULATED_CREDIT_GRANTS.find((cg) => cg.id === componentId)
      setPlanCreditGrants((prev) =>
        prev.map((g) => (g.id === activePlanNode.id ? { ...g, name: comp.name, componentLink: link } : g))
      )
      if (simulated) {
        setCreditGrantAmounts((prev) => ({ ...prev, [activePlanNode.id!]: simulated.amount }))
        setCreditGrantPeriods((prev) => ({ ...prev, [activePlanNode.id!]: simulated.period }))
      }
    }

    if (latestVersion) setBaseline(componentId, JSON.stringify({ name: comp.name }))
  }, [getMerchantComponent, activePlanNode, setBaseline])

  /** Called from ComponentVersionDropdown */
  const handleChangeComponentVersion = useCallback((versionId: string) => {
    if (!activeNodeComponentLink || activePlanNode.id == null) return
    const componentId = activeNodeComponentLink.componentId
    const link = { componentId, versionId }

    if (activePlanNode.type === "rateCard") {
      setPlanRateCards((prev) =>
        prev.map((c) => (c.id === activePlanNode.id ? { ...c, componentLink: link } : c))
      )
    } else if (activePlanNode.type === "subscriptionFee") {
      setPlanSubscriptionFees((prev) =>
        prev.map((f) => (f.id === activePlanNode.id ? { ...f, componentLink: link } : f))
      )
    } else if (activePlanNode.type === "creditGrant") {
      setPlanCreditGrants((prev) =>
        prev.map((g) => (g.id === activePlanNode.id ? { ...g, componentLink: link } : g))
      )
    }
  }, [activeNodeComponentLink, activePlanNode])

  const handleOpenAddPlanObjectPopover = (position: { top: number; left: number; above?: boolean }) => {
    setAddPlanObjectPopoverPosition(position)
    setIsAddPlanObjectFromMap(true)
    setIsAddPlanObjectOpen(true)
  }

  const handleProductClick = (product: ProductRow) => {
    setEditingProductId(product.id)
    applyProductToForm(product)
    setActiveObjectForm("product")
    setIsObjectActionsOpen(false)
    resetPanelWidths()
    setIsProductModalOpen(true)
  }

  const activeTreePriceId = editingPriceId ?? (collapsedPrices.length ? collapsedPrices[collapsedPrices.length - 1].id : null)

  const productAssistantContext = useMemo<AssistantContext>(
    () => ({
      mode: "product",
      product: {
        name: productName,
        description: productDescription,
        taxCode: productTaxCode,
        imageUrl: productImageUrl,
        statementDescriptor,
        unitLabel,
        activeForm: activeObjectForm,
      },
      productMetadata: {
        rows: [...metadataRows],
        values: { ...metadataValues },
      },
      productFeatures: {
        rows: [...featureRows],
        values: { ...featureValues },
      },
      priceDraft: {
        chargeFrequency,
        pricingModel,
        billingPeriod,
        includeTax,
        usageBasis,
        tieredBy,
        meter,
        currencies: pricingCurrencies.map((currency) => ({ ...currency })),
        currencyAmounts: { ...currencyAmounts },
      },
      priceTiers: {
        ids: [...tiers],
        tierToValues: { ...tierToValues },
        tierUnitPrices: { ...tierUnitPrices },
        tierFlatFees: { ...tierFlatFees },
      },
      prices: collapsedPrices.map((price) => ({
        id: price.id,
        label: (priceNamesById[price.id] ?? "").trim() || getPriceLabel(price),
      })),
      activePriceId: activeTreePriceId,
      meterName: meter,
      meterForm: {
        name: meterName,
        eventName: meterEventName,
        aggregationMethod,
        eventTimeWindow,
        showCountingOptions,
        valueKeyOverride,
      },
      preview: {
        mode: customerPreviewMode,
        unitQuantity: previewUnitQuantity,
        location: previewLocation,
        state: previewState,
      },
    }),
    [
      activeObjectForm,
      activeTreePriceId,
      billingPeriod,
      chargeFrequency,
      collapsedPrices,
      currencyAmounts,
      customerPreviewMode,
      includeTax,
      meter,
      priceNamesById,
      pricingCurrencies,
      pricingModel,
      productDescription,
      productName,
      productTaxCode,
      productImageUrl,
      featureRows,
      featureValues,
      metadataRows,
      metadataValues,
      meterEventName,
      meterName,
      previewLocation,
      previewState,
      previewUnitQuantity,
      statementDescriptor,
      showCountingOptions,
      tierFlatFees,
      tierToValues,
      tierUnitPrices,
      tiers,
      tieredBy,
      unitLabel,
      usageBasis,
      valueKeyOverride,
    ]
  )

  const planAssistantContext = useMemo<AssistantContext>(
    () => ({
      mode: "plan",
      focus: (() => {
        if (activePlanNode.type === "plan") {
          return { kind: "plan", label: getPlanLabel(planName, t("Untitled pricing plan")) }
        }
        if (activePlanNode.type === "rateCard") {
          const id = activePlanNode.id ?? activePlanRateCardId ?? null
          const card = planRateCards.find((c) => c.id === (id ?? -1)) ?? null
          return { kind: "rateCard", id: id ?? undefined, label: getPlanRateCardLabel(card) }
        }
        if (activePlanNode.type === "rate") {
          const rateId = activePlanNode.id ?? null
          const rate = getAllRates(planRateCards, planRates).find((r) => r.id === rateId) ?? null
          return { kind: "rate", id: rateId ?? undefined, label: getPlanRateLabel(rate) }
        }
        if (activePlanNode.type === "rateMeter") {
          return { kind: "rateMeter", label: t("Meter") }
        }
        if (activePlanNode.type === "creditGrant") {
          const id = activePlanNode.id ?? null
          const grant = planCreditGrants.find((g) => g.id === (id ?? -1)) ?? null
          return { kind: "creditGrant", id: id ?? undefined, label: getPlanCreditGrantLabel(grant) }
        }
        const id = activePlanNode.id ?? null
        const fee = planSubscriptionFees.find((f) => f.id === (id ?? -1)) ?? null
        return { kind: "subscriptionFee", id: id ?? undefined, label: getPlanSubscriptionFeeLabel(fee) }
      })(),
      plan: {
        name: planName,
        description: planDescription,
        currency: planCurrency,
        lookupKey: planLookupKey,
        taxTreatment: planTaxTreatment,
      },
      rateCards: planRateCards.map((card) => ({
        id: card.id,
        name: card.name,
        rates: card.rates.map((rate) => ({ id: rate.id, name: rate.name })),
      })),
      rateCardLookupKeys: { ...rateCardLookupKeys },
      rateCardServicingPeriods: { ...rateCardServicingPeriods },
      rateCardMetadataRows: { ...rateCardMetadataRows },
      rateCardMetadataValues: { ...rateCardMetadataValues },
      creditGrants: planCreditGrants.map((grant) => ({ id: grant.id, name: grant.name })),
      subscriptionFees: planSubscriptionFees.map((fee) => ({ id: fee.id, name: fee.name })),
      expandedRateCards: { ...planExpandedRateCards },
      activePlanNode,
      activePlanRateCardId,
      planUsageScenarioRates: [...planUsageScenarioRates],
      planRateUsage: { ...planRateUsage },
      planRateUnitPrices: { ...planRateUnitPrices },
      planRatePricing: {
        tiers: { ...planRateTiers },
        tierToValues: { ...planRateTierToValues },
        tierUnitPrices: { ...planRateTierUnitPrices },
        tierFlatFees: { ...planRateTierFlatFees },
        includeTax: { ...planRateIncludeTax },
        currencies: { ...planRateCurrencies },
        activeCurrencyId: { ...planRateActiveCurrencyId },
      },
      creditGrantAmounts: { ...creditGrantAmounts },
      creditGrantPeriods: { ...creditGrantPeriods },
      creditGrantApplications: { ...creditGrantApplications },
      creditGrantLookupKeys: { ...creditGrantLookupKeys },
      subscriptionFeeAmounts: { ...subscriptionFeeAmounts },
      subscriptionFeePeriods: { ...subscriptionFeePeriods },
      subscriptionFeePriceTypes: { ...subscriptionFeePriceTypes },
      subscriptionFeeSellAs: { ...subscriptionFeeSellAs },
      subscriptionFeeUnitLabels: { ...subscriptionFeeUnitLabels },
      subscriptionFeeTaxCodes: { ...subscriptionFeeTaxCodes },
      subscriptionFeeItemLookupKeys: { ...subscriptionFeeItemLookupKeys },
      subscriptionFeeFeeLookupKeys: { ...subscriptionFeeFeeLookupKeys },
      meterOptions: [...availablePlanMeterOptions],
      rateMeters: { ...rateMeters },
      ratePriceTypes: { ...ratePriceTypes },
      rateSellAs: { ...rateSellAs },
      rateUnitLabels: { ...rateUnitLabels },
      rateTaxCodes: { ...rateTaxCodes },
      rateItemLookupKeys: { ...rateItemLookupKeys },
      rateItemMetadataRows: { ...rateItemMetadataRows },
      rateItemMetadataValues: { ...rateItemMetadataValues },
      rateSettingsMetadataRows: { ...rateSettingsMetadataRows },
      rateSettingsMetadataValues: { ...rateSettingsMetadataValues },
      subscriptionFeeItemMetadataRows: { ...subscriptionFeeItemMetadataRows },
      subscriptionFeeItemMetadataValues: { ...subscriptionFeeItemMetadataValues },
      subscriptionFeeFeeMetadataRows: { ...subscriptionFeeFeeMetadataRows },
      subscriptionFeeFeeMetadataValues: { ...subscriptionFeeFeeMetadataValues },
    }),
    [
      activePlanNode,
      activePlanRateCardId,
      creditGrantAmounts,
      creditGrantApplications,
      creditGrantLookupKeys,
      creditGrantPeriods,
      getPlanCreditGrantLabel,
      getPlanLabel,
      getPlanSubscriptionFeeLabel,
      getPlanRateCardLabel,
      getPlanRateLabel,
      subscriptionFeeAmounts,
      subscriptionFeeFeeLookupKeys,
      subscriptionFeeItemLookupKeys,
      subscriptionFeePeriods,
      subscriptionFeePriceTypes,
      subscriptionFeeSellAs,
      subscriptionFeeTaxCodes,
      subscriptionFeeUnitLabels,
      planCreditGrants,
      planCurrency,
      planDescription,
      planExpandedRateCards,
      planSubscriptionFees,
      planLookupKey,
      planName,
      planRateCards,
      planRateUnitPrices,
      planRateTiers,
      planRateTierToValues,
      planRateTierUnitPrices,
      planRateTierFlatFees,
      planRateIncludeTax,
      planRateCurrencies,
      planRateActiveCurrencyId,
      planRateUsage,
      planTaxTreatment,
      planUsageScenarioRates,
      rateCardLookupKeys,
      rateCardServicingPeriods,
      rateCardMetadataRows,
      rateCardMetadataValues,
      rateItemMetadataValues,
      rateItemMetadataRows,
      rateSettingsMetadataRows,
      rateSettingsMetadataValues,
      rateItemLookupKeys,
      availablePlanMeterOptions,
      rateMeters,
      ratePriceTypes,
      rateSellAs,
      rateTaxCodes,
      rateUnitLabels,
      subscriptionFeeItemMetadataRows,
      subscriptionFeeFeeMetadataRows,
      subscriptionFeeItemMetadataValues,
      subscriptionFeeFeeMetadataValues,
      t,
    ]
  )

  const handleApplyProductAssistantActions = (actions: AssistantAction[]) => {
    return applyAssistantActions("product", actions)
  }

  const handleApplyPlanAssistantActions = (actions: AssistantAction[]) => {
    return applyAssistantActions("plan", actions)
  }

  const handlePreviewPlanAssistantActions = (actions: AssistantAction[]): AssistantPreviewResult => {
    const deepCopy = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T

    const highlightKeys = Array.from(
      new Set(
        actions.flatMap((a) => {
          switch (a.type) {
            case "set_plan_name":
              return ["plan.name"]
            case "set_plan_description":
              return ["plan.description"]
            case "set_plan_currency":
              return ["plan.currency"]
            case "set_plan_lookup_key":
              return ["plan.lookupKey"]
            case "set_plan_tax_treatment":
              return ["plan.taxTreatment"]
            case "add_plan_rate_card":
            case "rename_plan_rate_card":
              return ["rateCard.name"]
            case "set_rate_card_servicing_period":
              return ["rateCard.servicingPeriod"]
            case "set_rate_card_lookup_key":
              return ["rateCard.lookupKey"]
            case "add_rate_card_metadata_row":
            case "remove_rate_card_metadata_row":
            case "set_rate_card_metadata_key":
            case "set_rate_card_metadata_value":
              return ["rateCard.metadata"]
            case "rename_plan_rate":
              return ["rate.name"]
            case "add_plan_rate":
            case "add_plan_rates":
              return ["rate.name", "rate.meter", "rate.priceType", "rate.sellAs", "rate.unitPrice", "rate.unitLabel"]
            case "set_plan_rate_meter":
              return ["rate.meter"]
            case "set_plan_rate_price_type":
              return ["rate.priceType"]
            case "set_plan_rate_sell_as":
              return ["rate.sellAs"]
            case "set_plan_rate_unit_price":
              return ["rate.unitPrice"]
            case "set_plan_rate_unit_label":
              return ["rate.unitLabel"]
            case "set_plan_rate_tax_code":
              return ["rate.taxCode"]
            case "set_plan_rate_item_lookup_key":
              return ["rate.itemLookupKey"]
            case "set_plan_rate_include_tax":
              return ["rate.includeTax"]
            case "add_plan_rate_currency": {
              const code = "code" in a ? (a as unknown as { code: string }).code : null
              return code ? [`rate.currency.${code}`] : ["rate.currency"]
            }
            case "add_currency_to_all_rates": {
              const code = "code" in a ? (a as unknown as { code: string }).code : null
              return code ? [`rate.currency.${code}`] : ["rate.currency"]
            }
            case "set_plan_rate_currency_code":
            case "set_plan_rate_active_currency":
              return ["rate.currency"]
            case "add_plan_rate_tier": {
              const tierId = "tierId" in a ? (a as unknown as { tierId: number }).tierId : null
              return tierId != null ? [`rate.tier.${tierId}`] : ["rate.tier"]
            }
            case "set_plan_rate_tier_to": {
              const tierId = "tierId" in a ? (a as unknown as { tierId: number }).tierId : null
              return tierId != null ? [`rate.tier.${tierId}.to`] : ["rate.tier"]
            }
            case "set_plan_rate_tier_unit_price": {
              const tierId = "tierId" in a ? (a as unknown as { tierId: number }).tierId : null
              return tierId != null ? [`rate.tier.${tierId}.unitPrice`] : ["rate.tier"]
            }
            case "set_plan_rate_tier_flat_fee": {
              const tierId = "tierId" in a ? (a as unknown as { tierId: number }).tierId : null
              return tierId != null ? [`rate.tier.${tierId}.flatFee`] : ["rate.tier"]
            }
            case "add_rate_item_metadata_row":
            case "remove_rate_item_metadata_row":
            case "set_rate_item_metadata_key":
            case "set_rate_item_metadata_value":
              return ["rate.itemMetadata"]
            case "add_rate_settings_metadata_row":
            case "remove_rate_settings_metadata_row":
            case "set_rate_settings_metadata_key":
            case "set_rate_settings_metadata_value":
              return ["rate.rateMetadata"]
            case "add_plan_credit_grant":
              return ["creditGrant.name", "creditGrant.amount", "creditGrant.period", "creditGrant.application", "creditGrant.lookupKey"]
            case "rename_plan_credit_grant":
              return ["creditGrant.name"]
            case "set_plan_credit_grant_amount":
              return ["creditGrant.amount"]
            case "set_plan_credit_grant_period":
              return ["creditGrant.period"]
            case "set_plan_credit_grant_application":
              return ["creditGrant.application"]
            case "set_plan_credit_grant_lookup_key":
              return ["creditGrant.lookupKey"]
            case "add_plan_subscription_fee":
              return ["subscriptionFee.name", "subscriptionFee.amount", "subscriptionFee.period", "subscriptionFee.priceType", "subscriptionFee.sellAs", "subscriptionFee.unitLabel"]
            case "rename_plan_subscription_fee":
              return ["subscriptionFee.name"]
            case "set_plan_subscription_fee_amount":
              return ["subscriptionFee.amount"]
            case "set_plan_subscription_fee_period":
              return ["subscriptionFee.period"]
            case "set_plan_subscription_fee_price_type":
              return ["subscriptionFee.priceType"]
            case "set_plan_subscription_fee_sell_as":
              return ["subscriptionFee.sellAs"]
            case "set_plan_subscription_fee_unit_label":
              return ["subscriptionFee.unitLabel"]
            case "set_plan_subscription_fee_tax_code":
              return ["subscriptionFee.taxCode"]
            case "set_plan_subscription_fee_item_lookup_key":
              return ["subscriptionFee.itemLookupKey"]
            case "set_plan_subscription_fee_fee_lookup_key":
              return ["subscriptionFee.feeLookupKey"]
            case "add_subscription_fee_item_metadata_row":
            case "remove_subscription_fee_item_metadata_row":
            case "set_subscription_fee_item_metadata_key":
            case "set_subscription_fee_item_metadata_value":
              return ["subscriptionFee.itemMetadata"]
            case "add_subscription_fee_fee_metadata_row":
            case "remove_subscription_fee_fee_metadata_row":
            case "set_subscription_fee_fee_metadata_key":
            case "set_subscription_fee_fee_metadata_value":
              return ["subscriptionFee.feeMetadata"]
            default:
              return []
          }
        })
      )
    )

    setPlanScopedAiPreviewHighlightedKeys(highlightKeys)

    // Set focus to the entity being modified
    const rateAction = actions.find(a => 'rateId' in a && typeof a.rateId === 'number')
    const rateCardAction = actions.find(a => 'rateCardId' in a && typeof a.rateCardId === 'number')
    if (rateAction && typeof rateAction.rateId === 'number') {
      const rateId = rateAction.rateId
      const containingCard = planRateCards.find(c => c.rates.some(r => r.id === rateId))
      if (containingCard) {
        setPlanExpandedRateCards(prev => ({ ...prev, [containingCard.id]: true }))
        setActivePlanRateCardId(containingCard.id)
      }
      setActivePlanNode({ type: 'rate', id: rateId })
    } else if (rateCardAction && typeof rateCardAction.rateCardId === 'number') {
      const cardId = rateCardAction.rateCardId
      setPlanExpandedRateCards(prev => ({ ...prev, [cardId]: true }))
      setActivePlanRateCardId(cardId)
      setActivePlanNode({ type: 'rateCard', id: cardId })
    }

    const snapshot = {
      planName,
      planDescription,
      planCurrency,
      planLookupKey,
      planTaxTreatment,
      planRateCards: deepCopy(planRateCards),
      activePlanRateCardId,
      planRateUsage: deepCopy(planRateUsage),
      planRateUnitPrices: deepCopy(planRateUnitPrices),
      planRateTiers: deepCopy(planRateTiers),
      planRateTierToValues: deepCopy(planRateTierToValues),
      planRateTierUnitPrices: deepCopy(planRateTierUnitPrices),
      planRateTierFlatFees: deepCopy(planRateTierFlatFees),
      planRateIncludeTax: deepCopy(planRateIncludeTax),
      planRateCurrencies: deepCopy(planRateCurrencies),
      planRateActiveCurrencyId: deepCopy(planRateActiveCurrencyId),
      planUsageScenarioRates: deepCopy(planUsageScenarioRates),
      planCreditGrants: deepCopy(planCreditGrants),
      planSubscriptionFees: deepCopy(planSubscriptionFees),
      activePlanNode: deepCopy(activePlanNode),
      planExpandedRateCards: deepCopy(planExpandedRateCards),
      rateCardLookupKeys: deepCopy(rateCardLookupKeys),
      rateCardServicingPeriods: deepCopy(rateCardServicingPeriods),
      rateCardMetadataRows: deepCopy(rateCardMetadataRows),
      rateCardMetadataValues: deepCopy(rateCardMetadataValues),
      rateMeters: deepCopy(rateMeters),
      availablePlanMeterOptions: deepCopy(availablePlanMeterOptions),
      planRateMeterConfigs: deepCopy(planRateMeterConfigs),
      ratePriceTypes: deepCopy(ratePriceTypes),
      rateSellAs: deepCopy(rateSellAs),
      rateUnitLabels: deepCopy(rateUnitLabels),
      rateTaxCodes: deepCopy(rateTaxCodes),
      rateItemLookupKeys: deepCopy(rateItemLookupKeys),
      rateItemMetadataRows: deepCopy(rateItemMetadataRows),
      rateItemMetadataValues: deepCopy(rateItemMetadataValues),
      rateSettingsMetadataRows: deepCopy(rateSettingsMetadataRows),
      rateSettingsMetadataValues: deepCopy(rateSettingsMetadataValues),
      creditGrantAmounts: deepCopy(creditGrantAmounts),
      creditGrantPeriods: deepCopy(creditGrantPeriods),
      creditGrantApplications: deepCopy(creditGrantApplications),
      creditGrantLookupKeys: deepCopy(creditGrantLookupKeys),
      subscriptionFeeAmounts: deepCopy(subscriptionFeeAmounts),
      subscriptionFeePeriods: deepCopy(subscriptionFeePeriods),
      subscriptionFeePriceTypes: deepCopy(subscriptionFeePriceTypes),
      subscriptionFeeSellAs: deepCopy(subscriptionFeeSellAs),
      subscriptionFeeUnitLabels: deepCopy(subscriptionFeeUnitLabels),
      subscriptionFeeTaxCodes: deepCopy(subscriptionFeeTaxCodes),
      subscriptionFeeItemLookupKeys: deepCopy(subscriptionFeeItemLookupKeys),
      subscriptionFeeFeeLookupKeys: deepCopy(subscriptionFeeFeeLookupKeys),
      subscriptionFeeItemMetadataRows: deepCopy(subscriptionFeeItemMetadataRows),
      subscriptionFeeFeeMetadataRows: deepCopy(subscriptionFeeFeeMetadataRows),
      subscriptionFeeItemMetadataValues: deepCopy(subscriptionFeeItemMetadataValues),
      subscriptionFeeFeeMetadataValues: deepCopy(subscriptionFeeFeeMetadataValues),
    }

    const result = handleApplyPlanAssistantActions(actions)

    return {
      ...result,
      undo: () => {
        setPlanScopedAiPreviewHighlightedKeys([])
        setPlanName(snapshot.planName)
        setPlanDescription(snapshot.planDescription)
        setPlanCurrency(snapshot.planCurrency)
        setPlanLookupKey(snapshot.planLookupKey)
        setPlanTaxTreatment(snapshot.planTaxTreatment)
        setPlanRateCards(snapshot.planRateCards)
        setActivePlanRateCardId(snapshot.activePlanRateCardId)
        setPlanRateUsage(snapshot.planRateUsage)
        setPlanRateUnitPrices(snapshot.planRateUnitPrices)
        setPlanRateTiers(snapshot.planRateTiers)
        setPlanRateTierToValues(snapshot.planRateTierToValues)
        setPlanRateTierUnitPrices(snapshot.planRateTierUnitPrices)
        setPlanRateTierFlatFees(snapshot.planRateTierFlatFees)
        setPlanRateIncludeTax(snapshot.planRateIncludeTax)
        setPlanRateCurrencies(snapshot.planRateCurrencies)
        setPlanRateActiveCurrencyId(snapshot.planRateActiveCurrencyId)
        setPlanUsageScenarioRates(snapshot.planUsageScenarioRates)
        setPlanCreditGrants(snapshot.planCreditGrants)
        setPlanSubscriptionFees(snapshot.planSubscriptionFees)
        setActivePlanNode(snapshot.activePlanNode)
        setPlanExpandedRateCards(snapshot.planExpandedRateCards)
        setRateCardLookupKeys(snapshot.rateCardLookupKeys)
        setRateCardServicingPeriods(snapshot.rateCardServicingPeriods)
        setRateCardMetadataRows(snapshot.rateCardMetadataRows)
        setRateCardMetadataValues(snapshot.rateCardMetadataValues)
        setRateMeters(snapshot.rateMeters)
        setAvailablePlanMeterOptions(snapshot.availablePlanMeterOptions)
        setPlanRateMeterConfigs(snapshot.planRateMeterConfigs)
        setRatePriceTypes(snapshot.ratePriceTypes)
        setRateSellAs(snapshot.rateSellAs)
        setRateUnitLabels(snapshot.rateUnitLabels)
        setRateTaxCodes(snapshot.rateTaxCodes)
        setRateItemLookupKeys(snapshot.rateItemLookupKeys)
        setRateItemMetadataRows(snapshot.rateItemMetadataRows)
        setRateItemMetadataValues(snapshot.rateItemMetadataValues)
        setRateSettingsMetadataRows(snapshot.rateSettingsMetadataRows)
        setRateSettingsMetadataValues(snapshot.rateSettingsMetadataValues)
        setCreditGrantAmounts(snapshot.creditGrantAmounts)
        setCreditGrantPeriods(snapshot.creditGrantPeriods)
        setCreditGrantApplications(snapshot.creditGrantApplications)
        setCreditGrantLookupKeys(snapshot.creditGrantLookupKeys)
        setSubscriptionFeeAmounts(snapshot.subscriptionFeeAmounts)
        setSubscriptionFeePeriods(snapshot.subscriptionFeePeriods)
        setSubscriptionFeePriceTypes(snapshot.subscriptionFeePriceTypes)
        setSubscriptionFeeSellAs(snapshot.subscriptionFeeSellAs)
        setSubscriptionFeeUnitLabels(snapshot.subscriptionFeeUnitLabels)
        setSubscriptionFeeTaxCodes(snapshot.subscriptionFeeTaxCodes)
        setSubscriptionFeeItemLookupKeys(snapshot.subscriptionFeeItemLookupKeys)
        setSubscriptionFeeFeeLookupKeys(snapshot.subscriptionFeeFeeLookupKeys)
        setSubscriptionFeeItemMetadataRows(snapshot.subscriptionFeeItemMetadataRows)
        setSubscriptionFeeFeeMetadataRows(snapshot.subscriptionFeeFeeMetadataRows)
        setSubscriptionFeeItemMetadataValues(snapshot.subscriptionFeeItemMetadataValues)
        setSubscriptionFeeFeeMetadataValues(snapshot.subscriptionFeeFeeMetadataValues)
      },
    }
  }

  const handleConfirmPlanAssistantPreview = () => setPlanScopedAiPreviewHighlightedKeys([])

  const handleSelectPriceFromTree = (priceId: number) => {
    setIsObjectActionsOpen(false)
    setActiveObjectForm("price")
    handleEditCollapsedPrice(priceId)
  }

  const productScopedFormKey = useMemo(() => {
    if (activeObjectForm === "price") return `price:${activeTreePriceId ?? "none"}`
    return activeObjectForm
  }, [activeObjectForm, activeTreePriceId])

  useMemo(() => {
    const deepCopy = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T
    const scopeLabel = activeObjectForm === "product" ? "product" : activeObjectForm === "meter" ? "meter" : "price"

    const allowedActionTypes =
      activeObjectForm === "product"
        ? [
            "set_product_name",
            "set_product_description",
            "set_product_tax_code",
            "set_statement_descriptor",
            "set_unit_label",
            "set_product_image_url",
            "toggle_additional_options",
            "add_product_metadata_row",
            "remove_product_metadata_row",
            "set_product_metadata_key",
            "set_product_metadata_value",
            "add_product_feature_row",
            "remove_product_feature_row",
            "set_product_feature_value",
          ]
        : activeObjectForm === "meter"
          ? [
              "set_meter_name",
              "set_meter_event_name",
              "set_meter_aggregation_method",
              "set_meter_event_time_window",
              "toggle_meter_counting_options",
              "set_meter_value_key_override",
            ]
          : [
              "set_price_name",
              "set_price_description",
              "set_price_lookup_key",
              "set_charge_frequency",
              "set_pricing_model",
              "set_billing_period",
              "set_include_tax",
              "set_usage_basis",
              "set_tiered_by",
              "set_meter",
              "add_currency",
              "remove_currency",
              "set_active_currency",
              "set_currency_code",
              "set_currency_amount",
              "add_tier",
              "remove_tier",
              "set_tier_to",
              "set_tier_unit_price",
              "set_tier_flat_fee",
            ]

    const ctx = productAssistantContext
    const scopedContext =
      activeObjectForm === "product"
        ? { product: ctx.product, productMetadata: ctx.productMetadata, productFeatures: ctx.productFeatures }
        : activeObjectForm === "meter"
          ? { meterBuilder: ctx.meterBuilder }
          : { activeTreePriceId: ctx.activeTreePriceId, priceDraft: ctx.priceDraft, tierDraft: ctx.tierDraft }

    return {
      scopeKey: productScopedFormKey,
      scopeLabel,
      allowedActionTypes,
      scopedContext,
      disabled: false,
      onBeginGenerate: () => setScopedProductAiGeneratingKey(productScopedFormKey),
      onEndGenerate: () => setScopedProductAiGeneratingKey(null),
      onPreviewActions: (actions: AssistantAction[]) => {
        if (activeObjectForm === "product") {
          const snapshot = {
            productName,
            productDescription,
            productTaxCode,
            statementDescriptor,
            unitLabel,
            productImageUrl,
            showAdditionalOptions,
            metadataRows: deepCopy(metadataRows),
            metadataValues: deepCopy(metadataValues),
            featureRows: deepCopy(featureRows),
            featureValues: deepCopy(featureValues),
          }
          handleApplyProductAssistantActions(actions)
          return () => {
            setProductName(snapshot.productName)
            setProductDescription(snapshot.productDescription)
            setProductTaxCode(snapshot.productTaxCode)
            setStatementDescriptor(snapshot.statementDescriptor)
            setUnitLabel(snapshot.unitLabel)
            setProductImageUrl(snapshot.productImageUrl)
            setShowAdditionalOptions(snapshot.showAdditionalOptions)
            setMetadataRows(snapshot.metadataRows)
            setMetadataValues(snapshot.metadataValues)
            setFeatureRows(snapshot.featureRows)
            setFeatureValues(snapshot.featureValues)
          }
        }

        if (activeObjectForm === "meter") {
          const snapshot = {
            meter,
            meterName,
            meterEventName,
            aggregationMethod,
            eventTimeWindow,
            showCountingOptions,
            valueKeyOverride,
            activeObjectForm,
          }
          handleApplyProductAssistantActions(actions)
          return () => {
            setMeter(snapshot.meter)
            setMeterName(snapshot.meterName)
            setMeterEventName(snapshot.meterEventName)
            setAggregationMethod(snapshot.aggregationMethod)
            setEventTimeWindow(snapshot.eventTimeWindow)
            setShowCountingOptions(snapshot.showCountingOptions)
            setValueKeyOverride(snapshot.valueKeyOverride)
            setActiveObjectForm(snapshot.activeObjectForm)
          }
        }

        // price
        const snapshot = {
          priceNamesById: deepCopy(priceNamesById),
          chargeFrequency,
          pricingModel,
          billingPeriod,
          includeTax,
          usageBasis,
          tieredBy,
          meter,
          pricingCurrencies: deepCopy(pricingCurrencies),
          activeCurrencyId,
          currencyAmounts: deepCopy(currencyAmounts),
          tiers: deepCopy(tiers),
          tierToValues: deepCopy(tierToValues),
          tierUnitPrices: deepCopy(tierUnitPrices),
          tierFlatFees: deepCopy(tierFlatFees),
          priceDescription,
          lookupKey,
          activeObjectForm,
          activeTreePriceId,
        }
        handleApplyProductAssistantActions(actions)
        return () => {
          setPriceNamesById(snapshot.priceNamesById)
          setChargeFrequency(snapshot.chargeFrequency)
          setPricingModel(snapshot.pricingModel)
          setBillingPeriod(snapshot.billingPeriod)
          setIncludeTax(snapshot.includeTax)
          setUsageBasis(snapshot.usageBasis)
          setTieredBy(snapshot.tieredBy)
          setMeter(snapshot.meter)
          setPricingCurrencies(snapshot.pricingCurrencies)
          setActiveCurrencyId(snapshot.activeCurrencyId)
          setCurrencyAmounts(snapshot.currencyAmounts)
          setTiers(snapshot.tiers)
          setTierToValues(snapshot.tierToValues)
          setTierUnitPrices(snapshot.tierUnitPrices)
          setTierFlatFees(snapshot.tierFlatFees)
          setPriceDescription(snapshot.priceDescription)
          setLookupKey(snapshot.lookupKey)
          setActiveObjectForm(snapshot.activeObjectForm)
          if (snapshot.activeTreePriceId != null) {
            handleSelectPriceFromTree(snapshot.activeTreePriceId)
          }
        }
      },
      onConfirmPreview: () => undefined,
      onApplyActions: (actions: AssistantAction[]) => {
        handleApplyProductAssistantActions(actions)
      },
    }
  }, [
    activeCurrencyId,
    activeObjectForm,
    activeTreePriceId,
    aggregationMethod,
    billingPeriod,
    chargeFrequency,
    currencyAmounts,
    eventTimeWindow,
    featureRows,
    featureValues,
    handleApplyProductAssistantActions,
    handleSelectPriceFromTree,
    includeTax,
    lookupKey,
    metadataRows,
    metadataValues,
    meter,
    meterEventName,
    meterName,
    priceDescription,
    priceNamesById,
    pricingCurrencies,
    pricingModel,
    productAssistantContext,
    productDescription,
    productImageUrl,
    productName,
    productScopedFormKey,
    productTaxCode,
    showAdditionalOptions,
    showCountingOptions,
    statementDescriptor,
    tierFlatFees,
    tierToValues,
    tierUnitPrices,
    tiers,
    tieredBy,
    unitLabel,
    usageBasis,
    valueKeyOverride,
  ])

  const isProductScopedFormGenerating = scopedProductAiGeneratingKey === productScopedFormKey

  const planScopedFormKey = useMemo(() => `${activePlanNode.type}:${activePlanNode.id ?? ""}`, [activePlanNode.id, activePlanNode.type])

  useMemo(() => {
    const deepCopy = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T
    const ctx = planAssistantContext

    const scopeLabel =
      activePlanNode.type === "plan"
        ? "pricing plan"
        : activePlanNode.type === "rateCard"
          ? "rate card"
          : activePlanNode.type === "rate"
            ? "rate"
            : activePlanNode.type === "rateMeter"
              ? "meter"
              : activePlanNode.type === "creditGrant"
                ? "credit grant"
                : "subscription fee"

    const allowedActionTypes =
      activePlanNode.type === "plan"
        ? ["set_plan_name", "set_plan_description", "set_plan_currency", "set_plan_lookup_key", "set_plan_tax_treatment"]
        : activePlanNode.type === "rateCard"
          ? [
              "rename_plan_rate_card",
              "set_rate_card_lookup_key",
              "set_rate_card_servicing_period",
              "add_rate_card_metadata_row",
              "remove_rate_card_metadata_row",
              "set_rate_card_metadata_key",
              "set_rate_card_metadata_value",
            ]
          : activePlanNode.type === "rate"
            ? [
                "rename_plan_rate",
                "set_plan_rate_unit_price",
                "set_plan_rate_meter",
                "set_plan_rate_price_type",
                "set_plan_rate_sell_as",
                "set_plan_rate_unit_label",
                "set_plan_rate_tax_code",
                "set_plan_rate_item_lookup_key",
                "set_plan_rate_include_tax",
                "add_plan_rate_tier",
                "remove_plan_rate_tier",
                "set_plan_rate_tier_to",
                "set_plan_rate_tier_unit_price",
                "set_plan_rate_tier_flat_fee",
                "add_plan_rate_currency",
                "remove_plan_rate_currency",
                "set_plan_rate_currency_code",
                "set_plan_rate_active_currency",
                "add_rate_item_metadata_row",
                "remove_rate_item_metadata_row",
                "set_rate_item_metadata_key",
                "set_rate_item_metadata_value",
                "add_rate_settings_metadata_row",
                "remove_rate_settings_metadata_row",
                "set_rate_settings_metadata_key",
                "set_rate_settings_metadata_value",
              ]
            : activePlanNode.type === "creditGrant"
              ? [
                  "rename_plan_credit_grant",
                  "set_plan_credit_grant_amount",
                  "set_plan_credit_grant_period",
                  "set_plan_credit_grant_application",
                  "set_plan_credit_grant_lookup_key",
                ]
              : activePlanNode.type === "subscriptionFee"
                ? [
                    "rename_plan_subscription_fee",
                    "set_plan_subscription_fee_amount",
                    "set_plan_subscription_fee_period",
                    "set_plan_subscription_fee_price_type",
                    "set_plan_subscription_fee_sell_as",
                    "set_plan_subscription_fee_unit_label",
                    "set_plan_subscription_fee_tax_code",
                    "set_plan_subscription_fee_item_lookup_key",
                    "set_plan_subscription_fee_fee_lookup_key",
                    "add_subscription_fee_item_metadata_row",
                    "remove_subscription_fee_item_metadata_row",
                    "set_subscription_fee_item_metadata_key",
                    "set_subscription_fee_item_metadata_value",
                    "add_subscription_fee_fee_metadata_row",
                    "remove_subscription_fee_fee_metadata_row",
                    "set_subscription_fee_fee_metadata_key",
                    "set_subscription_fee_fee_metadata_value",
                  ]
                : []

    const scopedContext = (() => {
      if (activePlanNode.type === "plan") return { plan: ctx.plan }

      if (activePlanNode.type === "rateCard") {
        const rateCardId = activePlanNode.id ?? ctx.activePlanRateCardId ?? null
        if (rateCardId == null) return null
        const card = ctx.rateCards?.find((c) => c.id === rateCardId) ?? null
        if (!card) return null
        return {
          rateCard: card,
          rateCardLookupKey: ctx.rateCardLookupKeys?.[rateCardId] ?? "",
          rateCardServicingPeriod: ctx.rateCardServicingPeriods?.[rateCardId] ?? "",
          rateCardMetadataRows: ctx.rateCardMetadataRows?.[rateCardId] ?? [],
          rateCardMetadataValues: ctx.rateCardMetadataValues?.[rateCardId] ?? {},
        }
      }

      if (activePlanNode.type === "rate") {
        const rateId = activePlanNode.id ?? null
        if (rateId == null) return null
        const card = ctx.rateCards?.find((c) => c.rates.some((r) => r.id === rateId)) ?? null
        const rate = card?.rates.find((r) => r.id === rateId) ?? planRates.find((r) => r.id === rateId) ?? null
        if (!rate) return null
        return {
          planCurrency: ctx.plan?.currency ?? "USD",
          rateCard: card ? { id: card.id, name: card.name } : null,
          rate,
          rateMeter: ctx.rateMeters?.[rateId] ?? "",
          ratePriceType: ctx.ratePriceTypes?.[rateId] ?? "",
          rateSellAs: ctx.rateSellAs?.[rateId] ?? "",
          rateUnitLabel: ctx.rateUnitLabels?.[rateId] ?? "",
          rateTaxCode: ctx.rateTaxCodes?.[rateId] ?? "",
          rateItemLookupKey: ctx.rateItemLookupKeys?.[rateId] ?? "",
          rateItemMetadataRows: ctx.rateItemMetadataRows?.[rateId] ?? [],
          rateItemMetadataValues: ctx.rateItemMetadataValues?.[rateId] ?? {},
          rateSettingsMetadataRows: ctx.rateSettingsMetadataRows?.[rateId] ?? [],
          rateSettingsMetadataValues: ctx.rateSettingsMetadataValues?.[rateId] ?? {},
          pricing: {
            tiers: ctx.planRatePricing?.tiers?.[rateId] ?? [],
            tierToValues: ctx.planRatePricing?.tierToValues?.[rateId] ?? {},
            tierUnitPrices: ctx.planRatePricing?.tierUnitPrices?.[rateId] ?? {},
            tierFlatFees: ctx.planRatePricing?.tierFlatFees?.[rateId] ?? {},
            includeTax: ctx.planRatePricing?.includeTax?.[rateId] ?? "",
            currencies: ctx.planRatePricing?.currencies?.[rateId] ?? [{ id: 0, code: ctx.plan?.currency ?? "USD" }],
            activeCurrencyId: ctx.planRatePricing?.activeCurrencyId?.[rateId] ?? 0,
          },
          unitPrice: ctx.planRateUnitPrices?.[rateId] ?? "",
        }
      }

      if (activePlanNode.type === "creditGrant") {
        const id = activePlanNode.id ?? null
        if (id == null) return null
        const grant = ctx.creditGrants?.find((g) => g.id === id) ?? null
        if (!grant) return null
        return {
          creditGrant: grant,
          amount: ctx.creditGrantAmounts?.[id] ?? "",
          period: ctx.creditGrantPeriods?.[id] ?? "",
          application: ctx.creditGrantApplications?.[id] ?? "",
          lookupKey: ctx.creditGrantLookupKeys?.[id] ?? "",
        }
      }

      if (activePlanNode.type === "subscriptionFee") {
        const id = activePlanNode.id ?? null
        if (id == null) return null
        const fee = ctx.subscriptionFees?.find((f) => f.id === id) ?? null
        if (!fee) return null
        return {
          subscriptionFee: fee,
          amount: ctx.subscriptionFeeAmounts?.[id] ?? "",
          period: ctx.subscriptionFeePeriods?.[id] ?? "",
          priceType: ctx.subscriptionFeePriceTypes?.[id] ?? "",
          sellAs: ctx.subscriptionFeeSellAs?.[id] ?? "",
          unitLabel: ctx.subscriptionFeeUnitLabels?.[id] ?? "",
          taxCode: ctx.subscriptionFeeTaxCodes?.[id] ?? "",
          itemLookupKey: ctx.subscriptionFeeItemLookupKeys?.[id] ?? "",
          feeLookupKey: ctx.subscriptionFeeFeeLookupKeys?.[id] ?? "",
          itemMetadataRows: ctx.subscriptionFeeItemMetadataRows?.[id] ?? [],
          itemMetadataValues: ctx.subscriptionFeeItemMetadataValues?.[id] ?? {},
          feeMetadataRows: ctx.subscriptionFeeFeeMetadataRows?.[id] ?? [],
          feeMetadataValues: ctx.subscriptionFeeFeeMetadataValues?.[id] ?? {},
        }
      }

      return null
    })()

    if (!scopedContext || allowedActionTypes.length === 0) return null

    return {
      scopeKey: planScopedFormKey,
      scopeLabel,
      allowedActionTypes,
      scopedContext,
      disabled: false,
      onBeginGenerate: () => setScopedPlanAiGeneratingKey(planScopedFormKey),
      onEndGenerate: () => setScopedPlanAiGeneratingKey(null),
      onPreviewActions: (actions: AssistantAction[]) => {
        const highlightKeys = Array.from(
          new Set(
            actions.flatMap((a) => {
              switch (a.type) {
                case "set_plan_name":
                  return ["plan.name"]
                case "set_plan_description":
                  return ["plan.description"]
                case "set_plan_currency":
                  return ["plan.currency"]
                case "set_plan_lookup_key":
                  return ["plan.lookupKey"]
                case "set_plan_tax_treatment":
                  return ["plan.taxTreatment"]
                case "add_plan_rate_card":
                case "rename_plan_rate_card":
                  return ["rateCard.name"]
                case "set_rate_card_servicing_period":
                  return ["rateCard.servicingPeriod"]
                case "set_rate_card_lookup_key":
                  return ["rateCard.lookupKey"]
                case "add_rate_card_metadata_row":
                case "remove_rate_card_metadata_row":
                case "set_rate_card_metadata_key":
                case "set_rate_card_metadata_value":
                  return ["rateCard.metadata"]
                case "rename_plan_rate":
                  return ["rate.name"]
                case "add_plan_rate":
                case "add_plan_rates":
                  return ["rate.name", "rate.meter", "rate.priceType", "rate.sellAs", "rate.unitPrice", "rate.unitLabel"]
                case "set_plan_rate_meter":
                  return ["rate.meter"]
                case "set_plan_rate_price_type":
                  return ["rate.priceType"]
                case "set_plan_rate_sell_as":
                  return ["rate.sellAs"]
                case "set_plan_rate_unit_price":
                  return ["rate.unitPrice"]
                case "set_plan_rate_unit_label":
                  return ["rate.unitLabel"]
                case "set_plan_rate_tax_code":
                  return ["rate.taxCode"]
                case "set_plan_rate_item_lookup_key":
                  return ["rate.itemLookupKey"]
                case "set_plan_rate_include_tax":
                  return ["rate.includeTax"]
                case "add_plan_rate_currency":
                case "add_currency_to_all_rates":
                case "set_plan_rate_currency_code":
                case "set_plan_rate_active_currency":
                  return ["rate.currency"]
                case "add_rate_item_metadata_row":
                case "remove_rate_item_metadata_row":
                case "set_rate_item_metadata_key":
                case "set_rate_item_metadata_value":
                  return ["rate.itemMetadata"]
                case "add_rate_settings_metadata_row":
                case "remove_rate_settings_metadata_row":
                case "set_rate_settings_metadata_key":
                case "set_rate_settings_metadata_value":
                  return ["rate.rateMetadata"]
                case "add_plan_credit_grant":
                  return ["creditGrant.name", "creditGrant.amount", "creditGrant.period", "creditGrant.application", "creditGrant.lookupKey"]
                case "rename_plan_credit_grant":
                  return ["creditGrant.name"]
                case "set_plan_credit_grant_amount":
                  return ["creditGrant.amount"]
                case "set_plan_credit_grant_period":
                  return ["creditGrant.period"]
                case "set_plan_credit_grant_application":
                  return ["creditGrant.application"]
                case "set_plan_credit_grant_lookup_key":
                  return ["creditGrant.lookupKey"]
                case "add_plan_subscription_fee":
                  return ["subscriptionFee.name", "subscriptionFee.amount", "subscriptionFee.period", "subscriptionFee.priceType", "subscriptionFee.sellAs", "subscriptionFee.unitLabel"]
                case "rename_plan_subscription_fee":
                  return ["subscriptionFee.name"]
                case "set_plan_subscription_fee_amount":
                  return ["subscriptionFee.amount"]
                case "set_plan_subscription_fee_period":
                  return ["subscriptionFee.period"]
                case "set_plan_subscription_fee_price_type":
                  return ["subscriptionFee.priceType"]
                case "set_plan_subscription_fee_sell_as":
                  return ["subscriptionFee.sellAs"]
                case "set_plan_subscription_fee_unit_label":
                  return ["subscriptionFee.unitLabel"]
                case "set_plan_subscription_fee_tax_code":
                  return ["subscriptionFee.taxCode"]
                case "set_plan_subscription_fee_item_lookup_key":
                  return ["subscriptionFee.itemLookupKey"]
                case "set_plan_subscription_fee_fee_lookup_key":
                  return ["subscriptionFee.feeLookupKey"]
                case "add_subscription_fee_item_metadata_row":
                case "remove_subscription_fee_item_metadata_row":
                case "set_subscription_fee_item_metadata_key":
                case "set_subscription_fee_item_metadata_value":
                  return ["subscriptionFee.itemMetadata"]
                case "add_subscription_fee_fee_metadata_row":
                case "remove_subscription_fee_fee_metadata_row":
                case "set_subscription_fee_fee_metadata_key":
                case "set_subscription_fee_fee_metadata_value":
                  return ["subscriptionFee.feeMetadata"]
                default:
                  return []
              }
            })
          )
        )
        setPlanScopedAiPreviewHighlightedKeys(highlightKeys)

        const snapshot = {
          planName,
          planDescription,
          planCurrency,
          planLookupKey,
          planTaxTreatment,
          planRateCards: deepCopy(planRateCards),
          activePlanRateCardId,
          planRateUsage: deepCopy(planRateUsage),
          planRateUnitPrices: deepCopy(planRateUnitPrices),
          planRateTiers: deepCopy(planRateTiers),
          planRateTierToValues: deepCopy(planRateTierToValues),
          planRateTierUnitPrices: deepCopy(planRateTierUnitPrices),
          planRateTierFlatFees: deepCopy(planRateTierFlatFees),
          planRateIncludeTax: deepCopy(planRateIncludeTax),
          planRateCurrencies: deepCopy(planRateCurrencies),
          planRateActiveCurrencyId: deepCopy(planRateActiveCurrencyId),
          planUsageScenarioRates: deepCopy(planUsageScenarioRates),
          planCreditGrants: deepCopy(planCreditGrants),
          planSubscriptionFees: deepCopy(planSubscriptionFees),
          activePlanNode: deepCopy(activePlanNode),
          planExpandedRateCards: deepCopy(planExpandedRateCards),
          rateCardLookupKeys: deepCopy(rateCardLookupKeys),
          rateCardServicingPeriods: deepCopy(rateCardServicingPeriods),
          rateCardMetadataRows: deepCopy(rateCardMetadataRows),
          rateCardMetadataValues: deepCopy(rateCardMetadataValues),
          rateMeters: deepCopy(rateMeters),
          availablePlanMeterOptions: deepCopy(availablePlanMeterOptions),
          planRateMeterConfigs: deepCopy(planRateMeterConfigs),
          ratePriceTypes: deepCopy(ratePriceTypes),
          rateSellAs: deepCopy(rateSellAs),
          rateUnitLabels: deepCopy(rateUnitLabels),
          rateTaxCodes: deepCopy(rateTaxCodes),
          rateItemLookupKeys: deepCopy(rateItemLookupKeys),
          rateItemMetadataRows: deepCopy(rateItemMetadataRows),
          rateItemMetadataValues: deepCopy(rateItemMetadataValues),
          rateSettingsMetadataRows: deepCopy(rateSettingsMetadataRows),
          rateSettingsMetadataValues: deepCopy(rateSettingsMetadataValues),
          creditGrantAmounts: deepCopy(creditGrantAmounts),
          creditGrantPeriods: deepCopy(creditGrantPeriods),
          creditGrantApplications: deepCopy(creditGrantApplications),
          creditGrantLookupKeys: deepCopy(creditGrantLookupKeys),
          subscriptionFeeAmounts: deepCopy(subscriptionFeeAmounts),
          subscriptionFeePeriods: deepCopy(subscriptionFeePeriods),
          subscriptionFeePriceTypes: deepCopy(subscriptionFeePriceTypes),
          subscriptionFeeSellAs: deepCopy(subscriptionFeeSellAs),
          subscriptionFeeUnitLabels: deepCopy(subscriptionFeeUnitLabels),
          subscriptionFeeTaxCodes: deepCopy(subscriptionFeeTaxCodes),
          subscriptionFeeItemLookupKeys: deepCopy(subscriptionFeeItemLookupKeys),
          subscriptionFeeFeeLookupKeys: deepCopy(subscriptionFeeFeeLookupKeys),
          subscriptionFeeItemMetadataRows: deepCopy(subscriptionFeeItemMetadataRows),
          subscriptionFeeFeeMetadataRows: deepCopy(subscriptionFeeFeeMetadataRows),
          subscriptionFeeItemMetadataValues: deepCopy(subscriptionFeeItemMetadataValues),
          subscriptionFeeFeeMetadataValues: deepCopy(subscriptionFeeFeeMetadataValues),
        }

        handleApplyPlanAssistantActions(actions)

        return () => {
          setPlanScopedAiPreviewHighlightedKeys([])
          setPlanName(snapshot.planName)
          setPlanDescription(snapshot.planDescription)
          setPlanCurrency(snapshot.planCurrency)
          setPlanLookupKey(snapshot.planLookupKey)
          setPlanTaxTreatment(snapshot.planTaxTreatment)
          setPlanRateCards(snapshot.planRateCards)
          setActivePlanRateCardId(snapshot.activePlanRateCardId)
          setPlanRateUsage(snapshot.planRateUsage)
          setPlanRateUnitPrices(snapshot.planRateUnitPrices)
          setPlanRateTiers(snapshot.planRateTiers)
          setPlanRateTierToValues(snapshot.planRateTierToValues)
          setPlanRateTierUnitPrices(snapshot.planRateTierUnitPrices)
          setPlanRateTierFlatFees(snapshot.planRateTierFlatFees)
          setPlanRateIncludeTax(snapshot.planRateIncludeTax)
          setPlanRateCurrencies(snapshot.planRateCurrencies)
          setPlanRateActiveCurrencyId(snapshot.planRateActiveCurrencyId)
          setPlanUsageScenarioRates(snapshot.planUsageScenarioRates)
          setPlanCreditGrants(snapshot.planCreditGrants)
          setPlanSubscriptionFees(snapshot.planSubscriptionFees)
          setActivePlanNode(snapshot.activePlanNode)
          setPlanExpandedRateCards(snapshot.planExpandedRateCards)
          setRateCardLookupKeys(snapshot.rateCardLookupKeys)
          setRateCardServicingPeriods(snapshot.rateCardServicingPeriods)
          setRateCardMetadataRows(snapshot.rateCardMetadataRows)
          setRateCardMetadataValues(snapshot.rateCardMetadataValues)
          setRateMeters(snapshot.rateMeters)
          setAvailablePlanMeterOptions(snapshot.availablePlanMeterOptions)
          setPlanRateMeterConfigs(snapshot.planRateMeterConfigs)
          setRatePriceTypes(snapshot.ratePriceTypes)
          setRateSellAs(snapshot.rateSellAs)
          setRateUnitLabels(snapshot.rateUnitLabels)
          setRateTaxCodes(snapshot.rateTaxCodes)
          setRateItemLookupKeys(snapshot.rateItemLookupKeys)
          setRateItemMetadataRows(snapshot.rateItemMetadataRows)
          setRateItemMetadataValues(snapshot.rateItemMetadataValues)
          setRateSettingsMetadataRows(snapshot.rateSettingsMetadataRows)
          setRateSettingsMetadataValues(snapshot.rateSettingsMetadataValues)
          setCreditGrantAmounts(snapshot.creditGrantAmounts)
          setCreditGrantPeriods(snapshot.creditGrantPeriods)
          setCreditGrantApplications(snapshot.creditGrantApplications)
          setCreditGrantLookupKeys(snapshot.creditGrantLookupKeys)
          setSubscriptionFeeAmounts(snapshot.subscriptionFeeAmounts)
          setSubscriptionFeePeriods(snapshot.subscriptionFeePeriods)
          setSubscriptionFeePriceTypes(snapshot.subscriptionFeePriceTypes)
          setSubscriptionFeeSellAs(snapshot.subscriptionFeeSellAs)
          setSubscriptionFeeUnitLabels(snapshot.subscriptionFeeUnitLabels)
          setSubscriptionFeeTaxCodes(snapshot.subscriptionFeeTaxCodes)
          setSubscriptionFeeItemLookupKeys(snapshot.subscriptionFeeItemLookupKeys)
          setSubscriptionFeeFeeLookupKeys(snapshot.subscriptionFeeFeeLookupKeys)
          setSubscriptionFeeItemMetadataRows(snapshot.subscriptionFeeItemMetadataRows)
          setSubscriptionFeeFeeMetadataRows(snapshot.subscriptionFeeFeeMetadataRows)
          setSubscriptionFeeItemMetadataValues(snapshot.subscriptionFeeItemMetadataValues)
          setSubscriptionFeeFeeMetadataValues(snapshot.subscriptionFeeFeeMetadataValues)
        }
      },
      onConfirmPreview: () => setPlanScopedAiPreviewHighlightedKeys([]),
      onApplyActions: (actions: AssistantAction[]) => {
        setPlanScopedAiPreviewHighlightedKeys([])
        handleApplyPlanAssistantActions(actions)
      },
    }
  }, [
    activePlanNode,
    activePlanRateCardId,
    creditGrantAmounts,
    creditGrantApplications,
    creditGrantLookupKeys,
    creditGrantPeriods,
    handleApplyPlanAssistantActions,
    subscriptionFeeAmounts,
    subscriptionFeeFeeLookupKeys,
    subscriptionFeeFeeMetadataRows,
    subscriptionFeeFeeMetadataValues,
    subscriptionFeeItemLookupKeys,
    subscriptionFeeItemMetadataRows,
    subscriptionFeeItemMetadataValues,
    subscriptionFeePeriods,
    subscriptionFeePriceTypes,
    subscriptionFeeSellAs,
    subscriptionFeeTaxCodes,
    subscriptionFeeUnitLabels,
    planAssistantContext,
    planCreditGrants,
    planCurrency,
    planDescription,
    planExpandedRateCards,
    planSubscriptionFees,
    planLookupKey,
    planName,
    planRateActiveCurrencyId,
    planRateCards,
    planRateCurrencies,
    planRateIncludeTax,
    planRateTierFlatFees,
    planRateTierToValues,
    planRateTierUnitPrices,
    planRateTiers,
    planRateUnitPrices,
    planRateUsage,
    planScopedFormKey,
    planTaxTreatment,
    planUsageScenarioRates,
    rateCardLookupKeys,
    rateCardMetadataRows,
    rateCardMetadataValues,
    rateCardServicingPeriods,
    rateItemLookupKeys,
    rateItemMetadataRows,
    rateItemMetadataValues,
    rateMeters,
    ratePriceTypes,
    rateSellAs,
    rateSettingsMetadataRows,
    rateSettingsMetadataValues,
    rateTaxCodes,
    rateUnitLabels,
  ])

  const isPlanScopedFormGenerating = scopedPlanAiGeneratingKey === planScopedFormKey

  const hasObjectActions =
    activeObjectForm === "product"
      ? editingProductId != null
      : activeObjectForm === "meter"
        ? meter.trim() !== ""
        : activeTreePriceId != null

  useAnchoredPopover({
    isOpen: isAddProductPopoverOpen,
    setIsOpen: setIsAddProductPopoverOpen,
    anchorRef: addProductButtonRef,
    popoverRef: addProductPopoverRef,
    setPosition: setAddProductPopoverPosition,
    getPositionFromRect: (rect) => {
      const width = 320
      const margin = 16
      const desiredLeft = rect.right - width
      const viewportWidth = typeof document !== "undefined" ? document.documentElement.clientWidth : 1440
      const maxLeft = viewportWidth - width - margin
      const left = Math.min(Math.max(desiredLeft, margin), Math.max(maxLeft, margin))
      return { top: rect.bottom + 8, left }
    },
  })

  useAutosizeTextarea({
    isEnabled: addProductPrompt.promptMode,
    textareaRef: addProductPromptRef,
    value: addProductPrompt.promptText,
  })

  useAnchoredPopover({
    isOpen: isAddPlanObjectOpen && !isAddPlanObjectFromMap,
    setIsOpen: (next) => {
      setIsAddPlanObjectOpen(next)
      if (!next) setIsAddPlanObjectFromMap(false)
    },
    anchorRef: addPlanObjectButtonRef,
    popoverRef: addPlanObjectPopoverRef,
    setPosition: setAddPlanObjectPopoverPosition,
    getPositionFromRect: (rect) => ({ top: rect.top, left: rect.right + 4 }),
  })

  // Handle outside click dismiss when popover is opened from map
  useEffect(() => {
    if (!isAddPlanObjectOpen || !isAddPlanObjectFromMap) return
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (!addPlanObjectPopoverRef.current?.contains(target)) {
        setIsAddPlanObjectOpen(false)
        setIsAddPlanObjectFromMap(false)
      }
    }
    document.addEventListener("mousedown", handlePointerDown)
    return () => document.removeEventListener("mousedown", handlePointerDown)
  }, [isAddPlanObjectOpen, isAddPlanObjectFromMap])

  const createDraftPrice = (config: SavedPriceConfig, name = "") => {
    // Create a new price node in the tree and open it for editing.
    setIsObjectActionsOpen(false)
    setActiveObjectForm("price")
    setShowInternalReference(false)
    setPriceDescription("")
    setLookupKey("")

    const nextId = Date.now()
    const nextLabel = getPriceSummaryLabelFromConfig(config)

    setCollapsedPrices((prev) => [...prev, { id: nextId, label: nextLabel, config }])
    setPriceNamesById((prev) => ({ ...prev, [nextId]: name }))
    applyPriceConfig(config)
    setEditingPriceId(nextId)
    setShowPriceForm(true)
    setShouldAnimatePriceForm(false)
    setPriceFormInstance((prev) => prev + 1)
    return nextId
  }

  const handleNavAddPrice = () => {
    resetPriceFormToDefaults()
    setShouldAnimatePriceForm(false)
    setPriceFormInstance((prev) => prev + 1)
    setEditingPriceId(null)
    setIsAddPriceModalOpen(true)
  }

  const resolvePriceId = (action: AssistantAction) =>
    resolvePriceIdFromAssistant({
      action,
      collapsedPrices,
      priceNamesById,
      getPriceLabel,
      activeTreePriceId,
    })

  const resolveRateCardId = (
    action: AssistantAction,
    createdRateCards?: Map<string, number>,
    fallbackRateCardId?: number | null
  ) =>
    resolveRateCardIdFromAssistant({
      action,
      createdRateCards,
      fallbackRateCardId,
      activePlanRateCardId,
      getRateCards: () => assistantPlanRateCardsDraftRef.current ?? planRateCards,
    })

  const resolveRateId = (action: AssistantAction) =>
    resolveRateIdFromAssistant({
      action,
      getRateCards: () => assistantPlanRateCardsDraftRef.current ?? planRateCards,
      fallbackRateId: activePlanNode.type === "rate" ? (activePlanNode.id ?? null) : null,
    })

  const inferRateCardNameFromRate = (rateName: string) => inferRateCardNameFromRateFromAssistant(rateName)

  const isAiModelRateName = (value: string) => isAiModelRateNameFromAssistant(value)

  const getAiModelSeedPricing = (value: string) => getAiModelSeedPricingFromAssistant(value)

  const resolveCurrencyId = (action: AssistantAction) =>
    resolveCurrencyIdFromAssistant({ action, pricingCurrencies, activeCurrencyId })

  const resolveTierId = (action: AssistantAction) => resolveTierIdFromAssistant({ action, tiers })

  const resolvePlanRateCurrencyId = (rateId: number, action: AssistantAction) =>
    resolvePlanRateCurrencyIdFromAssistant({
      rateId,
      action,
      planRateCurrencies,
      planCurrency,
      planRateActiveCurrencyId,
    })

  const resolveRowId = (rows: number[], action: AssistantAction, label: string) =>
    resolveRowIdFromAssistant({ rows, action, label })

  const addProductMetadataRow = () => {
    let nextId = 0
    setMetadataRows((prev) => {
      nextId = prev.length ? Math.max(...prev) + 1 : 0
      return [...prev, nextId]
    })
    setMetadataValues((prev) => ({ ...prev, [nextId]: { key: "", value: "" } }))
    return nextId
  }

  const addProductFeatureRow = () => {
    let nextId = 0
    setFeatureRows((prev) => {
      nextId = prev.length ? Math.max(...prev) + 1 : 0
      return [...prev, nextId]
    })
    setFeatureValues((prev) => ({ ...prev, [nextId]: "" }))
    return nextId
  }

  const updateProductMetadataValue = (rowId: number, patch: Partial<{ key: string; value: string }>) => {
    setMetadataValues((prev) => {
      const current = prev[rowId] ?? { key: "", value: "" }
      return { ...prev, [rowId]: { ...current, ...patch } }
    })
  }

  const updatePlanMetadataValue = (
    setter: Dispatch<SetStateAction<MetadataValueMap>>,
    entityId: number,
    rowId: number,
    patch: Partial<{ key: string; value: string }>
  ) => {
    setter((prev) => {
      const currentEntity = prev[entityId] ?? {}
      const currentRow = currentEntity[rowId] ?? { key: "", value: "" }
      return {
        ...prev,
        [entityId]: { ...currentEntity, [rowId]: { ...currentRow, ...patch } },
      }
    })
  }

  const resolveCreditGrantId = (action: AssistantAction, createdCreditGrants?: Map<string, number>) => {
    const id = getNumberValue(action.creditGrantId)
    if (id != null && planCreditGrants.some((grant) => grant.id === id)) return { id }
    // Check if ID matches a just-created credit grant
    if (id != null && createdCreditGrants) {
      for (const createdId of Array.from(createdCreditGrants.values())) {
        if (createdId === id) return { id }
      }
    }
    const name = getStringValue(action.creditGrantName ?? action.name)
    if (name) {
      // Check recently created grants first
      if (createdCreditGrants) {
        const createdId = createdCreditGrants.get(name.toLowerCase())
        if (createdId != null) return { id: createdId }
      }
      const match = planCreditGrants.find((grant) => grant.name.trim().toLowerCase() === name.toLowerCase())
      if (match) return { id: match.id }
      return { id: null, error: `No credit grant found named "${name}".` }
    }
    return { id: null, error: "Credit grant id or name is missing." }
  }

  const resolveSubscriptionFeeId = (action: AssistantAction, createdSubscriptionFees?: Map<string, number>) => {
    const id = getNumberValue(action.subscriptionFeeId ?? action.subscriptionFeeId)
    if (id != null && planSubscriptionFees.some((fee) => fee.id === id)) return { id }
    // Check if ID matches a just-created subscription fee
    if (id != null && createdSubscriptionFees) {
      for (const createdId of Array.from(createdSubscriptionFees.values())) {
        if (createdId === id) return { id }
      }
    }
    const name = getStringValue(action.subscriptionFeeName ?? action.subscriptionFeeName ?? action.name)
    if (name) {
      // Check recently created fees first
      if (createdSubscriptionFees) {
        const createdId = createdSubscriptionFees.get(name.toLowerCase())
        if (createdId != null) return { id: createdId }
      }
      const match = planSubscriptionFees.find((fee) => fee.name.trim().toLowerCase() === name.toLowerCase())
      if (match) return { id: match.id }
      return { id: null, error: `No subscription fee found named "${name}".` }
    }
    return { id: null, error: "Subscription fee id or name is missing." }
  }

  const formatPreviewQuantity = (value: unknown) => {
    if (typeof value === "number" && Number.isFinite(value)) {
      return numberFormatter.format(value)
    }
    const raw = getStringValue(value)
    const digits = raw.replace(/[^0-9]/g, "")
    return digits ? numberFormatter.format(Number(digits)) : ""
  }

  const applyPlanRateNamesToDraft = (cards: PlanRateCard[], rateCardId: number, names: string[], allowEmpty = false) => {
    const sanitizedNames = allowEmpty ? names.map((name) => name.trim()) : names.map((name) => name.trim()).filter(Boolean)
    if (!sanitizedNames.length) return cards

    // First, find existing rates with matching names from ANY card (for moving instead of duplicating)
    const existingRatesByName = new Map<string, { id: number; sourceCardId: number }>()
    for (const card of cards) {
      for (const rate of card.rates) {
        const normalizedName = rate.name.trim().toLowerCase()
        if (normalizedName && !existingRatesByName.has(normalizedName)) {
          existingRatesByName.set(normalizedName, { id: rate.id, sourceCardId: card.id })
        }
      }
    }

    // Separate names into: rates to move vs truly new rates
    const ratesToMove: { id: number; name: string; sourceCardId: number }[] = []
    const trulyNewNames: string[] = []
    for (const name of sanitizedNames) {
      const existing = existingRatesByName.get(name.toLowerCase())
      if (existing && existing.sourceCardId !== rateCardId) {
        ratesToMove.push({ id: existing.id, name, sourceCardId: existing.sourceCardId })
      } else if (!existing) {
        trulyNewNames.push(name)
      }
    }

    const currentMaxRateId = cards.reduce((max, card) => {
      const cardMax = card.rates.length ? Math.max(...card.rates.map((rate) => rate.id)) : -1
      return Math.max(max, cardMax)
    }, -1)
    let nextGlobalRateId = currentMaxRateId + 1

    return cards.map((card) => {
      // Remove rates that are being moved TO a different card
      if (card.id !== rateCardId) {
        const movingAwayIds = new Set(ratesToMove.filter(r => r.sourceCardId === card.id).map(r => r.id))
        if (movingAwayIds.size > 0) {
          return { ...card, rates: card.rates.filter(rate => !movingAwayIds.has(rate.id)) }
        }
        return card
      }

      // This is the target card - add moved rates and create new ones
      const emptyRate = card.rates.find((rate) => rate.name.trim() === "")
      const remainingNames = emptyRate ? trulyNewNames.slice(1) : trulyNewNames
      const newRates = remainingNames.map((name) => ({ id: nextGlobalRateId++, name }))
      const reusedRateId = emptyRate ? emptyRate.id : null
      const reuseName = emptyRate ? trulyNewNames[0] ?? "" : ""
      const nextRates = emptyRate
        ? card.rates.map((rate) => (rate.id === reusedRateId ? { ...rate, name: reuseName } : rate))
        : card.rates
      const movedRateEntries = ratesToMove.map(r => ({ id: r.id, name: r.name }))
      return { ...card, rates: [...nextRates, ...movedRateEntries, ...newRates] }
    })
  }

  const addPlanRateCardWithName = (name: string, idOverride?: number) => {
    const trimmedName = name.trim()
    const emptyCard = planRateCards.find(
      (card) => card.name.trim() === "" && card.rates.every((rate) => rate.name.trim() === "")
    )
    if (emptyCard && idOverride == null) {
      updateRateCardName(emptyCard.id, trimmedName)
      setActivePlanRateCardId(emptyCard.id)
      setPlanExpandedRateCards((cards) => ({ ...cards, [emptyCard.id]: true }))
      setActivePlanNode({ type: "rateCard", id: emptyCard.id })
      return emptyCard.id
    }
    const nextId = idOverride ?? (planRateCards.length ? Math.max(...planRateCards.map((card) => card.id)) + 1 : 0)
    setPlanRateCards((prev) => [...prev, { id: nextId, name: trimmedName, rates: [] }])
    setActivePlanRateCardId(nextId)
    setPlanExpandedRateCards((cards) => ({ ...cards, [nextId]: true }))
    setActivePlanNode({ type: "rateCard", id: nextId })
    return nextId
  }

  const addPlanRatesToCard = (rateCardId: number, names: string[], allowEmpty = false) => {
    const sanitizedNames = allowEmpty ? names.map((name) => name.trim()) : names.map((name) => name.trim()).filter(Boolean)
    if (!sanitizedNames.length) return
    setPlanRateCards((prev) => {
      // First, find existing rates with matching names from ANY card (for moving instead of duplicating)
      const existingRatesByName = new Map<string, { id: number; sourceCardId: number }>()
      for (const card of prev) {
        for (const rate of card.rates) {
          const normalizedName = rate.name.trim().toLowerCase()
          if (normalizedName && !existingRatesByName.has(normalizedName)) {
            existingRatesByName.set(normalizedName, { id: rate.id, sourceCardId: card.id })
          }
        }
      }

      // Separate names into: rates to move vs truly new rates
      const ratesToMove: { id: number; name: string; sourceCardId: number }[] = []
      const trulyNewNames: string[] = []
      for (const name of sanitizedNames) {
        const existing = existingRatesByName.get(name.toLowerCase())
        if (existing && existing.sourceCardId !== rateCardId) {
          // Rate exists in a different card - we'll move it
          ratesToMove.push({ id: existing.id, name, sourceCardId: existing.sourceCardId })
        } else if (!existing) {
          // Truly new rate
          trulyNewNames.push(name)
        }
        // If rate already exists in target card, skip it (no action needed)
      }

      return prev.map((card) => {
        // Remove rates that are being moved TO a different card
        if (card.id !== rateCardId) {
          const movingAwayIds = new Set(ratesToMove.filter(r => r.sourceCardId === card.id).map(r => r.id))
          if (movingAwayIds.size > 0) {
            return { ...card, rates: card.rates.filter(rate => !movingAwayIds.has(rate.id)) }
          }
          return card
        }

        // This is the target card - add moved rates and create new ones
        const emptyRate = card.rates.find((rate) => rate.name.trim() === "")
        const remainingNames = emptyRate ? trulyNewNames.slice(1) : trulyNewNames
        const currentMaxRateId = prev.reduce((max, item) => {
          const cardMax = item.rates.length ? Math.max(...item.rates.map((rate) => rate.id)) : -1
          return Math.max(max, cardMax)
        }, -1)
        let nextGlobalRateId = currentMaxRateId + 1
        const newRates = remainingNames.map((name) => ({ id: nextGlobalRateId++, name }))
        const reusedRateId = emptyRate ? emptyRate.id : null
        const reuseName = emptyRate ? trulyNewNames[0] ?? "" : ""
        const allNewRateEntries = [
          ...(reusedRateId != null ? [{ id: reusedRateId, name: reuseName }] : []),
          ...newRates.map((rate) => ({ id: rate.id, name: rate.name })),
        ]
        const allNewRateIds = allNewRateEntries.map((entry) => entry.id)
        const seededTierToValuesForAi = {
          0: numberFormatter.format(1000),
          1: numberFormatter.format(10000),
          2: numberFormatter.format(100000),
        } as const
        const seededUnitPricesByRateId = Object.fromEntries(
          allNewRateEntries.map((entry) => {
            if (!isAiModelRateName(entry.name)) return [entry.id, ""]
            const seed = getAiModelSeedPricing(entry.name)
            return [entry.id, seed.unitPrices[0] ?? ""]
          })
        )
        const seededPriceTypesByRateId = Object.fromEntries(
          allNewRateEntries.map((entry) => [entry.id, isAiModelRateName(entry.name) ? "Graduated" : "Fixed rate"])
        )
        const seededTierIdsByRateId = Object.fromEntries(
          allNewRateEntries.map((entry) => [entry.id, isAiModelRateName(entry.name) ? [0, 1, 2, 3] : [0, 1]])
        )
        const seededTierToValuesByRateId = Object.fromEntries(
          allNewRateEntries.map((entry) => {
            if (!isAiModelRateName(entry.name)) return [entry.id, {}]
            return [entry.id, { ...seededTierToValuesForAi }]
          })
        )
        const seededTierUnitPricesByRateId = Object.fromEntries(
          allNewRateEntries.map((entry) => {
            if (!isAiModelRateName(entry.name)) return [entry.id, {}]
            const seed = getAiModelSeedPricing(entry.name)
            return [
              entry.id,
              {
                0: seed.unitPrices[0] ?? "",
                1: seed.unitPrices[1] ?? "",
                2: seed.unitPrices[2] ?? "",
                3: seed.unitPrices[3] ?? "",
              },
            ]
          })
        )
        const seededTierFlatFeesByRateId = Object.fromEntries(
          allNewRateEntries.map((entry) => {
            if (!isAiModelRateName(entry.name)) return [entry.id, {}]
            const seed = getAiModelSeedPricing(entry.name)
            return [entry.id, { 0: seed.flatFeeTier0, 1: "", 2: "", 3: "" }]
          })
        )
        setPlanRateUsage((usage) => ({
          ...usage,
          ...Object.fromEntries(allNewRateIds.map((id) => [id, "0"])),
        }))
        setPlanRateUnitPrices((prices) => ({
          ...prices,
          ...seededUnitPricesByRateId,
        }))
        setRatePriceTypes((types) => ({
          ...types,
          ...seededPriceTypesByRateId,
        }))
        setPlanRateTiers((tiers) => ({
          ...tiers,
          ...seededTierIdsByRateId,
        }))
        setPlanRateTierToValues((values) => ({
          ...values,
          ...seededTierToValuesByRateId,
        }))
        setPlanRateTierUnitPrices((values) => ({
          ...values,
          ...seededTierUnitPricesByRateId,
        }))
        setPlanRateTierFlatFees((values) => ({
          ...values,
          ...seededTierFlatFeesByRateId,
        }))
        setPlanRateIncludeTax((values) => ({
          ...values,
          ...Object.fromEntries(allNewRateIds.map((id) => [id, includeTaxOptions[0]])),
        }))
        setPlanRateCurrencies((currencies) => ({
          ...currencies,
          ...Object.fromEntries(allNewRateIds.map((id) => [id, [{ id: 0, code: planCurrency }]])),
        }))
        setPlanRateActiveCurrencyId((ids) => ({
          ...ids,
          ...Object.fromEntries(allNewRateIds.map((id) => [id, 0])),
        }))
        setPlanExpandedRateCards((cards) => ({ ...cards, [rateCardId]: true }))
        setActivePlanRateCardId(rateCardId)
        if (allNewRateIds.length === 1) {
          setActivePlanNode({ type: "rate", id: allNewRateIds[0] })
        } else {
          setActivePlanNode({ type: "rateCard", id: rateCardId })
        }
        const nextRates = emptyRate
          ? card.rates.map((rate) => (rate.id === reusedRateId ? { ...rate, name: reuseName } : rate))
          : card.rates
        // Add moved rates (keeping their IDs) and new rates
        const movedRateEntries = ratesToMove.map(r => ({ id: r.id, name: r.name }))
        return { ...card, rates: [...nextRates, ...movedRateEntries, ...newRates] }
      })
    })
  }

  const applyAssistantActions = (mode: "product" | "plan", actions: AssistantAction[]): AssistantApplyResult => {
    let applied = 0
    const errors: string[] = []
    const addError = (message: string) => errors.push(message)
    const createdRateCards = new Map<string, number>()
    let nextRateCardId = planRateCards.length ? Math.max(...planRateCards.map((card) => card.id)) + 1 : 0
    let defaultRateCardId = activePlanRateCardId ?? planRateCards[0]?.id ?? null

    // Track subscription fees and credit grants created in this batch
    const createdSubscriptionFees = new Map<string, number>()
    let nextSubscriptionFeeId = planSubscriptionFees.length ? Math.max(...planSubscriptionFees.map((f) => f.id)) + 1 : 0
    const createdCreditGrants = new Map<string, number>()
    let nextCreditGrantId = planCreditGrants.length ? Math.max(...planCreditGrants.map((g) => g.id)) + 1 : 0

    // Track tier additions locally since state updates are async
    const localTierTracker: Record<number, number[]> = JSON.parse(JSON.stringify(planRateTiers))
    const getLocalTiers = (rateId: number) => localTierTracker[rateId] ?? [0, 1]
    const addLocalTier = (rateId: number): number => {
      const current = getLocalTiers(rateId)
      const nextId = current.length ? Math.max(...current) + 1 : 0
      localTierTracker[rateId] = [...current, nextId]
      return nextId
    }
    // Track tier "to" values locally so subsequent actions can see values set earlier in the batch
    const localTierToTracker: Record<number, Record<number, string>> = JSON.parse(JSON.stringify(planRateTierToValues))
    const getLocalTierTo = (rateId: number, tierId: number): string | undefined => {
      return localTierToTracker[rateId]?.[tierId]
    }
    const setLocalTierTo = (rateId: number, tierId: number, value: string) => {
      if (!localTierToTracker[rateId]) localTierToTracker[rateId] = {}
      localTierToTracker[rateId][tierId] = value
    }
    // Helper to compute the minimum "to" value for a tier (must be > previous tier's "to")
    const getMinTierToValue = (rateId: number, tierId: number): number => {
      const tierIds = getLocalTiers(rateId)
      const tierIndex = tierIds.indexOf(tierId)
      if (tierIndex <= 0) return 0 // First tier, no minimum
      const prevTierId = tierIds[tierIndex - 1]
      const prevToRaw = getLocalTierTo(rateId, prevTierId)
      if (prevToRaw != null && prevToRaw.trim() !== "") {
        const prevTo = Number(prevToRaw.replace(/[^0-9.]/g, ""))
        if (Number.isFinite(prevTo)) return prevTo + 1
      }
      // Fallback: use default step-based calculation
      const STEP = 1000
      return tierIndex * STEP + 1
    }
    // Local tier resolver that uses the tracked state
    const resolveLocalPlanRateTierId = (rateId: number, action: AssistantAction) => {
      const tierIds = getLocalTiers(rateId)
      const id = getNumberValue(action.tierId)
      // First try tierId as an actual tier ID
      if (id != null && tierIds.includes(id)) return { id }
      // Then check for explicit tierIndex
      const index = getNumberValue(action.tierIndex)
      if (index != null) {
        const tierId = tierIds[index]
        if (tierId != null) return { id: tierId }
        return { id: null, error: `No tier found at index ${index}.` as const }
      }
      // Fallback: try tierId as an index (AI often sends tier index as tierId)
      if (id != null && id >= 0 && id < tierIds.length) {
        return { id: tierIds[id]! }
      }
      return { id: null, error: "Tier id or index is missing." as const }
    }

    if (mode === "plan") {
      assistantPlanRateCardsDraftRef.current = planRateCards.map((card) => ({
        ...card,
        rates: card.rates.map((rate) => ({ ...rate })),
      }))
    }

    const getDraftPlanRateCards = () => assistantPlanRateCardsDraftRef.current ?? planRateCards
    const updateDraftPlanRateCards = (updater: (prev: PlanRateCard[]) => PlanRateCard[]) => {
      if (mode !== "plan") return
      const current = assistantPlanRateCardsDraftRef.current
      if (!current) return
      assistantPlanRateCardsDraftRef.current = updater(current)
    }

    const ensureProductMode = (type: string) => {
      if (mode !== "product") {
        addError(`Ignored "${type}" because the product form is not active.`)
        return false
      }
      return true
    }

    const ensurePlanMode = (type: string) => {
      if (mode !== "plan") {
        addError(`Ignored "${type}" because the pricing plan form is not active.`)
        return false
      }
      return true
    }

    try {
      actions.forEach((action) => {
      const type = typeof action.type === "string" ? action.type : ""
      if (!type) {
        addError("Action missing type.")
        return
      }

      if (
        [
          "set_active_form",
          "set_product_name",
          "set_product_description",
          "set_product_tax_code",
          "set_statement_descriptor",
          "set_unit_label",
          "set_product_image_url",
          "toggle_additional_options",
          "add_product_metadata_row",
          "remove_product_metadata_row",
          "set_product_metadata_key",
          "set_product_metadata_value",
          "add_product_feature_row",
          "remove_product_feature_row",
          "set_product_feature_value",
          "set_price_name",
          "select_price",
          "set_price_description",
          "set_price_lookup_key",
          "set_charge_frequency",
          "set_pricing_model",
          "set_billing_period",
          "set_include_tax",
          "set_usage_basis",
          "set_tiered_by",
          "set_meter",
          "open_meter_builder",
          "add_currency",
          "remove_currency",
          "set_active_currency",
          "set_currency_code",
          "set_currency_amount",
          "add_tier",
          "remove_tier",
          "set_tier_to",
          "set_tier_unit_price",
          "set_tier_flat_fee",
          "set_meter_name",
          "set_meter_event_name",
          "set_meter_aggregation_method",
          "set_meter_event_time_window",
          "toggle_meter_counting_options",
          "set_meter_value_key_override",
          "save_meter",
          "unlink_meter",
          "add_price",
          "open_internal_reference",
          "set_preview_mode",
          "set_preview_unit_quantity",
          "set_preview_location",
          "set_preview_state",
        ].includes(type)
      ) {
        if (!ensureProductMode(type)) return
      }

      if (
        [
          "set_plan_name",
          "set_plan_description",
          "set_plan_currency",
          "set_plan_lookup_key",
          "set_plan_tax_treatment",
          "add_plan_rate_card",
          "rename_plan_rate_card",
          "set_rate_card_lookup_key",
          "set_rate_card_servicing_period",
          "add_rate_card_metadata_row",
          "remove_rate_card_metadata_row",
          "set_rate_card_metadata_key",
          "set_rate_card_metadata_value",
          "add_plan_rate",
          "add_plan_rates",
          "rename_plan_rate",
          "toggle_rate_card_advanced",
          "toggle_rate_advanced",
          "toggle_credit_advanced",
          "toggle_subscription_fee_advanced",
          "add_rate_item_metadata_row",
          "remove_rate_item_metadata_row",
          "set_rate_item_metadata_key",
          "set_rate_item_metadata_value",
          "add_rate_settings_metadata_row",
          "remove_rate_settings_metadata_row",
          "set_rate_settings_metadata_key",
          "set_rate_settings_metadata_value",
          "set_plan_rate_usage",
          "set_plan_rate_unit_price",
          "set_plan_rate_meter",
          "set_plan_rate_price_type",
          "set_plan_rate_sell_as",
          "set_plan_rate_unit_label",
          "set_plan_rate_tax_code",
          "set_plan_rate_item_lookup_key",
          "set_plan_rate_include_tax",
          "add_plan_rate_tier",
          "remove_plan_rate_tier",
          "set_plan_rate_tier_to",
          "set_plan_rate_tier_unit_price",
          "set_plan_rate_tier_flat_fee",
          "add_plan_rate_currency",
          "remove_plan_rate_currency",
          "set_plan_rate_currency_code",
          "set_plan_rate_active_currency",
          "set_plan_usage_scenario_rates",
          "add_plan_usage_rate",
          "remove_plan_usage_rate",
          "add_plan_credit_grant",
          "rename_plan_credit_grant",
          "set_plan_credit_grant_amount",
          "set_plan_credit_grant_period",
          "set_plan_credit_grant_application",
          "set_plan_credit_grant_lookup_key",
          "add_plan_subscription_fee",
          "rename_plan_subscription_fee",
          "set_plan_subscription_fee_amount",
          "set_plan_subscription_fee_period",
          "set_plan_subscription_fee_price_type",
          "set_plan_subscription_fee_sell_as",
          "set_plan_subscription_fee_unit_label",
          "set_plan_subscription_fee_tax_code",
          "set_plan_subscription_fee_item_lookup_key",
          "set_plan_subscription_fee_fee_lookup_key",
          "add_subscription_fee_item_metadata_row",
          "remove_subscription_fee_item_metadata_row",
          "set_subscription_fee_item_metadata_key",
          "set_subscription_fee_item_metadata_value",
          "add_subscription_fee_fee_metadata_row",
          "remove_subscription_fee_fee_metadata_row",
          "set_subscription_fee_fee_metadata_key",
          "set_subscription_fee_fee_metadata_value",
          "expand_rate_card",
          "collapse_rate_card",
          "expand_all_rate_cards",
          "collapse_all_rate_cards",
          "select_plan_node",
          "remove_empty_rate_cards",
        ].includes(type)
      ) {
        if (!ensurePlanMode(type)) return
      }

      const productResult =
        mode === "product"
          ? applyProductAssistantAction({
              type,
              action,
              ctx: {
                meter,
                metadataRows,
                featureRows,
                tiers,
                pricingCurrencies,
                activeCurrencyId,
                locationOptions,
                stateOptions,
                aggregationMethodOptions,
                eventTimeWindowOptions,
                chargeFrequencyOptions,
                recurringPricingOptions,
                oneOffPricingOptions,
                priceBillingPeriodOptions,
                includeTaxOptions,
                usageBasisOptions,
                tieredByOptions,
                customerPreviewOptions,
                setActiveObjectForm,
                setMeterName,
                setProductName,
                setProductDescription,
                setProductTaxCode,
                setStatementDescriptor,
                setUnitLabel,
                setProductImageUrl,
                setShowAdditionalOptions,
                addProductMetadataRow,
                setMetadataRows,
                setMetadataValues,
                updateProductMetadataValue,
                addProductFeatureRow,
                setFeatureRows,
                setFeatureValues,
                resolveRowId,
                resolvePriceId,
                setPriceNamesById,
                handleSelectPriceFromTree,
                setPriceDescription,
                setLookupKey,
                setChargeFrequency,
                handlePricingModelChange,
                setBillingPeriod,
                setIncludeTax,
                handleUsageBasisChange,
                setTieredBy,
                setMeter,
                handleOpenMeterBuilder,
                handleAddCurrency,
                resolveCurrencyId,
                handleDeleteCurrency,
                setActiveCurrencyId,
                handleCurrencyChange,
                setCurrencyAmounts,
                handleAddTier,
                resolveTierId,
                handleRemoveTier,
                setTierToValues,
                setTierUnitPrices,
                setTierFlatFees,
                setMeterEventName,
                setAggregationMethod,
                setEventTimeWindow,
                setShowCountingOptions,
                setValueKeyOverride,
                handleSaveMeter,
                createDraftPrice,
                setShowInternalReference,
                setCustomerPreviewMode,
                formatPreviewQuantity,
                setPreviewUnitQuantity,
                setPreviewLocation,
                setPreviewState,
              },
            })
          : null

      if (productResult?.handled) {
        if (productResult.error) addError(productResult.error)
        else applied += productResult.applied
        return
      }

      const planRateCardResult =
        mode === "plan"
          ? applyPlanRateCardAssistantAction({
              type,
              action,
              ctx: {
                planName,
                servicingPeriodOptions,
                getDraftPlanRateCards,
                updateDraftPlanRateCards,
                resolveRateCardId,
                getMetadataRows,
                resolveRowId,
                addMetadataRow,
                removeMetadataRow,
                updatePlanMetadataValue,
                setPlanName,
                setPlanDescription,
                setPlanCurrency,
                setPlanLookupKey,
                setPlanTaxTreatment,
                updateRateCardName,
                addPlanRateCardWithName,
                setActivePlanRateCardId,
                setPlanExpandedRateCards,
                setActivePlanNode,
                setRateCardLookupKeys,
                setRateCardServicingPeriods,
                rateCardMetadataRows,
                setRateCardMetadataRows,
                setRateCardMetadataValues,
              },
              draft: {
                createdRateCards,
                getDefaultRateCardId: () => defaultRateCardId,
                setDefaultRateCardId: (next) => {
                  defaultRateCardId = next
                },
                allocateNextRateCardId: () => {
                  const id = nextRateCardId
                  nextRateCardId += 1
                  return id
                },
              },
            })
          : null

      if (planRateCardResult?.handled) {
        if (planRateCardResult.error) addError(planRateCardResult.error)
        else applied += planRateCardResult.applied
        return
      }

      const planRateAddResult =
        mode === "plan"
          ? applyPlanRateAddAssistantAction({
              type,
              action,
              ctx: {
                planName,
                setPlanName,
                inferRateCardNameFromRate,
                resolveRateCardId,
                getDraftPlanRateCards,
                addPlanRateCardWithName,
                updateRateCardName,
                updateDraftPlanRateCards,
                addPlanRatesToCard,
                applyPlanRateNamesToDraft,
              },
              draft: {
                createdRateCards,
                getDefaultRateCardId: () => defaultRateCardId,
                setDefaultRateCardId: (next) => {
                  defaultRateCardId = next
                },
                allocateNextRateCardId: () => {
                  const id = nextRateCardId
                  nextRateCardId += 1
                  return id
                },
              },
            })
          : null

      if (planRateAddResult?.handled) {
        if (planRateAddResult.error) addError(planRateAddResult.error)
        else applied += planRateAddResult.applied
        return
      }

      const planRateMetadataResult =
        mode === "plan"
          ? applyPlanRateMetadataAssistantAction({
              type,
              action,
              ctx: {
                resolveRateId,
                updateRateName,
                updateDraftPlanRateCards,
                addMetadataRow,
                removeMetadataRow,
                getMetadataRows,
                resolveRowId,
                updatePlanMetadataValue,
                rateItemMetadataRows,
                setRateItemMetadataRows,
                setRateItemMetadataValues,
                rateSettingsMetadataRows,
                setRateSettingsMetadataRows,
                setRateSettingsMetadataValues,
              },
            })
          : null

      if (planRateMetadataResult?.handled) {
        if (planRateMetadataResult.error) addError(planRateMetadataResult.error)
        else applied += planRateMetadataResult.applied
        return
      }

      switch (type) {
        case "toggle_rate_card_advanced": {
          setShowRateCardAdvanced(Boolean(action.open))
          applied += 1
          return
        }
        case "toggle_rate_advanced": {
          setShowRateAdvanced(Boolean(action.open))
          applied += 1
          return
        }
        case "toggle_credit_advanced": {
          setShowCreditAdvanced(Boolean(action.open))
          applied += 1
          return
        }
        case "toggle_subscription_fee_advanced": {
          setShowSubscriptionFeeAdvanced(Boolean(action.open))
          applied += 1
          return
        }
        case "set_plan_rate_usage": {
          const value = getStringValue(action.value)
          const resolved = resolveRateId(action)
          if (resolved.id == null) {
            addError(resolved.error ?? "Could not find rate to update usage.")
            return
          }
          setPlanRateUsage((prev) => ({ ...prev, [resolved.id]: value }))
          applied += 1
          return
        }
        case "set_plan_rate_unit_price": {
          const value = getStringValue(action.value)
          const resolved = resolveRateId(action)
          if (resolved.id == null) {
            addError(resolved.error ?? "Could not find rate to update unit price.")
            return
          }
          setPlanRateUnitPrices((prev) => ({ ...prev, [resolved.id]: value }))
          applied += 1
          return
        }
        case "set_plan_rate_meter": {
          const value = getStringValue(action.value)
          const resolved = resolveRateId(action)
          if (resolved.id == null) {
            addError(resolved.error ?? "Could not find rate to update meter.")
            return
          }
          setRateMeters((prev) => ({ ...prev, [resolved.id]: value }))
          applied += 1
          return
        }
        case "set_plan_rate_price_type": {
          const value = getStringValue(action.value)
          const match = resolveOption(value, planPriceTypeOptions)
          if (!match) {
            addError(`Rate price type "${value}" is not valid.`)
            return
          }
          const resolved = resolveRateId(action)
          if (resolved.id == null) {
            addError(resolved.error ?? "Could not find rate to update price type.")
            return
          }
          setRatePriceTypes((prev) => ({ ...prev, [resolved.id]: match }))
          applied += 1
          return
        }
        case "set_plan_rate_sell_as": {
          const value = getStringValue(action.value)
          const match = resolveOption(value, sellAsOptions)
          if (!match) {
            addError(`Rate sell-as "${value}" is not valid.`)
            return
          }
          const resolved = resolveRateId(action)
          if (resolved.id == null) {
            addError(resolved.error ?? "Could not find rate to update sell-as.")
            return
          }
          setRateSellAs((prev) => ({ ...prev, [resolved.id]: match }))
          applied += 1
          return
        }
        case "set_plan_rate_unit_label": {
          const value = getStringValue(action.value)
          const resolved = resolveRateId(action)
          if (resolved.id == null) {
            addError(resolved.error ?? "Could not find rate to update unit label.")
            return
          }
          setRateUnitLabels((prev) => ({ ...prev, [resolved.id]: value }))
          applied += 1
          return
        }
        case "set_plan_rate_tax_code": {
          const value = getStringValue(action.value)
          const resolved = resolveRateId(action)
          if (resolved.id == null) {
            addError(resolved.error ?? "Could not find rate to update tax code.")
            return
          }
          setRateTaxCodes((prev) => ({ ...prev, [resolved.id]: value }))
          applied += 1
          return
        }
        case "set_plan_rate_item_lookup_key": {
          const value = getStringValue(action.value)
          const resolved = resolveRateId(action)
          if (resolved.id == null) {
            addError(resolved.error ?? "Could not find rate to update lookup key.")
            return
          }
          setRateItemLookupKeys((prev) => ({ ...prev, [resolved.id]: value }))
          applied += 1
          return
        }
        case "set_plan_rate_include_tax": {
          const value = getStringValue(action.value)
          const match = resolveOption(value, includeTaxOptions)
          if (!match) {
            addError(`Rate tax setting "${value}" is not valid.`)
            return
          }
          const resolved = resolveRateId(action)
          if (resolved.id == null) {
            addError(resolved.error ?? "Could not find rate to update tax setting.")
            return
          }
          setPlanRateIncludeTax((prev) => ({ ...prev, [resolved.id]: match }))
          applied += 1
          return
        }
        case "add_plan_rate_tier": {
          const resolved = resolveRateId(action)
          if (resolved.id == null) {
            addError(resolved.error ?? "Could not find rate to add a tier.")
            return
          }
          // Track the tier addition locally for subsequent actions in this batch
          const localNextId = addLocalTier(resolved.id)
          // Initialize tier values OUTSIDE the setPlanRateTiers callback to avoid race conditions
          // where nested setState calls would be deferred and overwrite values set by later actions
          setPlanRateTierToValues((values) => ({
            ...values,
            [resolved.id!]: { ...(values[resolved.id!] ?? {}), [localNextId]: "" },
          }))
          setPlanRateTierUnitPrices((values) => ({
            ...values,
            [resolved.id!]: { ...(values[resolved.id!] ?? {}), [localNextId]: "" },
          }))
          setPlanRateTierFlatFees((values) => ({
            ...values,
            [resolved.id!]: { ...(values[resolved.id!] ?? {}), [localNextId]: "" },
          }))
          setPlanRateTiers((prev) => {
            const current = prev[resolved.id!] ?? [0, 1]
            // Use localNextId to ensure consistency with the tier values initialized above
            // This prevents ID mismatches when multiple tiers are added in a single batch
            return { ...prev, [resolved.id!]: [...current, localNextId] }
          })
          applied += 1
          return
        }
        case "remove_plan_rate_tier": {
          const resolved = resolveRateId(action)
          if (resolved.id == null) {
            addError(resolved.error ?? "Could not find rate to remove tier.")
            return
          }
          const tierResolved = resolveLocalPlanRateTierId(resolved.id, action)
          if (tierResolved.id == null) {
            addError(tierResolved.error ?? "Could not find tier to remove.")
            return
          }
          setPlanRateTiers((prev) => {
            const current = prev[resolved.id!] ?? [0, 1]
            if (current.length <= 1) return prev
            return { ...prev, [resolved.id!]: current.filter((id) => id !== tierResolved.id) }
          })
          setPlanRateTierToValues((prev) => {
            const current = { ...(prev[resolved.id!] ?? {}) }
            delete current[tierResolved.id!]
            return { ...prev, [resolved.id!]: current }
          })
          setPlanRateTierUnitPrices((prev) => {
            const current = { ...(prev[resolved.id!] ?? {}) }
            delete current[tierResolved.id!]
            return { ...prev, [resolved.id!]: current }
          })
          setPlanRateTierFlatFees((prev) => {
            const current = { ...(prev[resolved.id!] ?? {}) }
            delete current[tierResolved.id!]
            return { ...prev, [resolved.id!]: current }
          })
          applied += 1
          return
        }
        case "set_plan_rate_tier_to": {
          const rawValue = getStringValue(action.value)
          const resolved = resolveRateId(action)
          if (resolved.id == null) {
            addError(resolved.error ?? "Could not find rate to update tier.")
            return
          }
          const tierResolved = resolveLocalPlanRateTierId(resolved.id, action)
          if (tierResolved.id == null) {
            addError(tierResolved.error ?? "Could not find tier to update.")
            return
          }
          // Validate and clamp: "to" must be >= minimum (previous tier's "to" + 1)
          const minToValue = getMinTierToValue(resolved.id, tierResolved.id)
          const parsedValue = Number(rawValue.replace(/[^0-9.]/g, ""))
          const unitFormatter = new Intl.NumberFormat("en-US")
          let finalValue = rawValue
          if (Number.isFinite(parsedValue)) {
            // Format with commas and clamp to minimum if needed
            const clampedValue = Math.max(parsedValue, minToValue)
            finalValue = unitFormatter.format(clampedValue)
          }
          // Track locally for subsequent actions in this batch
          setLocalTierTo(resolved.id, tierResolved.id, finalValue)
          setPlanRateTierToValues((prev) => ({
            ...prev,
            [resolved.id!]: { ...(prev[resolved.id!] ?? {}), [tierResolved.id!]: finalValue },
          }))
          applied += 1
          return
        }
        case "set_plan_rate_tier_unit_price": {
          const value = getStringValue(action.value)
          const resolved = resolveRateId(action)
          if (resolved.id == null) {
            addError(resolved.error ?? "Could not find rate to update tier.")
            return
          }
          const tierResolved = resolveLocalPlanRateTierId(resolved.id, action)
          if (tierResolved.id == null) {
            addError(tierResolved.error ?? "Could not find tier to update.")
            return
          }
          setPlanRateTierUnitPrices((prev) => ({
            ...prev,
            [resolved.id!]: { ...(prev[resolved.id!] ?? {}), [tierResolved.id!]: value },
          }))
          applied += 1
          return
        }
        case "set_plan_rate_tier_flat_fee": {
          const value = getStringValue(action.value)
          const resolved = resolveRateId(action)
          if (resolved.id == null) {
            addError(resolved.error ?? "Could not find rate to update tier.")
            return
          }
          const tierResolved = resolveLocalPlanRateTierId(resolved.id, action)
          if (tierResolved.id == null) {
            addError(tierResolved.error ?? "Could not find tier to update.")
            return
          }
          setPlanRateTierFlatFees((prev) => ({
            ...prev,
            [resolved.id!]: { ...(prev[resolved.id!] ?? {}), [tierResolved.id!]: value },
          }))
          applied += 1
          return
        }
        case "setup_graduated_tiers": {
          // Bulk action to set up graduated pricing tiers in one go
          // Parameters: rateId, maxValue (e.g., 40000), increment (e.g., 5000)
          const resolved = resolveRateId(action)
          if (resolved.id == null) {
            addError(resolved.error ?? "Could not find rate to set up graduated tiers.")
            return
          }
          const maxValue = getNumberValue(action.maxValue ?? action.max)
          const increment = getNumberValue(action.increment ?? action.step)
          if (maxValue == null || maxValue <= 0) {
            addError("maxValue is required for setup_graduated_tiers.")
            return
          }
          if (increment == null || increment <= 0) {
            addError("increment is required for setup_graduated_tiers.")
            return
          }
          // Calculate tier boundaries: 0→increment, increment+1→2*increment, ..., up to maxValue, then →∞
          const tierBoundaries: number[] = []
          for (let v = increment; v <= maxValue; v += increment) {
            tierBoundaries.push(v)
          }
          // Ensure the last boundary is exactly maxValue (in case increment doesn't divide evenly)
          if (tierBoundaries.length === 0 || tierBoundaries[tierBoundaries.length - 1] !== maxValue) {
            tierBoundaries.push(maxValue)
          }
          const numTiers = tierBoundaries.length + 1 // +1 for the final ∞ tier

          // Set price type to Graduated
          const graduatedOption = planPriceTypeOptions.find((opt) => opt.toLowerCase().includes("graduated"))
          if (graduatedOption) {
            setRatePriceTypes((prev) => ({ ...prev, [resolved.id!]: graduatedOption }))
          }

          // Create the tier structure: tier IDs will be 0, 1, 2, ..., numTiers-1
          const newTierIds = Array.from({ length: numTiers }, (_, i) => i)
          localTierTracker[resolved.id!] = newTierIds
          setPlanRateTiers((prev) => ({ ...prev, [resolved.id!]: newTierIds }))

          // Set the "To" values for each tier (except the last one which is ∞)
          const newToValues: Record<number, string> = {}
          const unitFormatter = new Intl.NumberFormat("en-US")
          for (let i = 0; i < tierBoundaries.length; i++) {
            newToValues[i] = unitFormatter.format(tierBoundaries[i]!)
          }
          // Last tier (∞) has no "To" value
          newToValues[numTiers - 1] = ""

          // Update local tracker for subsequent actions
          localTierToTracker[resolved.id!] = newToValues

          // Update state
          setPlanRateTierToValues((prev) => ({ ...prev, [resolved.id!]: newToValues }))
          // Initialize unit prices and flat fees to empty
          const emptyTierValues: Record<number, string> = {}
          for (const tierId of newTierIds) {
            emptyTierValues[tierId] = ""
          }
          setPlanRateTierUnitPrices((prev) => ({ ...prev, [resolved.id!]: emptyTierValues }))
          setPlanRateTierFlatFees((prev) => ({ ...prev, [resolved.id!]: emptyTierValues }))

          applied += 1
          return
        }
        case "setup_graduated_tiers_for_all_rates": {
          // Bulk action to set up graduated pricing tiers for ALL rates at once
          // Parameters: maxValue (e.g., 40000), increment (e.g., 5000)
          const maxValue = getNumberValue(action.maxValue ?? action.max)
          const increment = getNumberValue(action.increment ?? action.step)
          if (maxValue == null || maxValue <= 0) {
            addError("maxValue is required for setup_graduated_tiers_for_all_rates.")
            return
          }
          if (increment == null || increment <= 0) {
            addError("increment is required for setup_graduated_tiers_for_all_rates.")
            return
          }
          // Get all rate IDs
          const allRateIds = getAllRates(planRateCards, planRates).map((rate) => rate.id)
          if (allRateIds.length === 0) {
            addError("No rates available to set up graduated tiers.")
            return
          }
          // Calculate tier boundaries
          const tierBoundaries: number[] = []
          for (let v = increment; v <= maxValue; v += increment) {
            tierBoundaries.push(v)
          }
          if (tierBoundaries.length === 0 || tierBoundaries[tierBoundaries.length - 1] !== maxValue) {
            tierBoundaries.push(maxValue)
          }
          const numTiers = tierBoundaries.length + 1
          const newTierIds = Array.from({ length: numTiers }, (_, i) => i)

          // Build the "To" values
          const newToValues: Record<number, string> = {}
          const unitFormatter = new Intl.NumberFormat("en-US")
          for (let i = 0; i < tierBoundaries.length; i++) {
            newToValues[i] = unitFormatter.format(tierBoundaries[i]!)
          }
          newToValues[numTiers - 1] = ""

          // Build empty tier values for prices
          const emptyTierValues: Record<number, string> = {}
          for (const tierId of newTierIds) {
            emptyTierValues[tierId] = ""
          }

          // Find the graduated option
          const graduatedOption = planPriceTypeOptions.find((opt) => opt.toLowerCase().includes("graduated"))

          // Apply to all rates
          for (const rateId of allRateIds) {
            // Set price type to Graduated
            if (graduatedOption) {
              setRatePriceTypes((prev) => ({ ...prev, [rateId]: graduatedOption }))
            }
            // Update local tracker
            localTierTracker[rateId] = newTierIds
            localTierToTracker[rateId] = newToValues
          }

          // Batch update all state
          setPlanRateTiers((prev) => {
            const next = { ...prev }
            for (const rateId of allRateIds) {
              next[rateId] = newTierIds
            }
            return next
          })
          setPlanRateTierToValues((prev) => {
            const next = { ...prev }
            for (const rateId of allRateIds) {
              next[rateId] = newToValues
            }
            return next
          })
          setPlanRateTierUnitPrices((prev) => {
            const next = { ...prev }
            for (const rateId of allRateIds) {
              next[rateId] = emptyTierValues
            }
            return next
          })
          setPlanRateTierFlatFees((prev) => {
            const next = { ...prev }
            for (const rateId of allRateIds) {
              next[rateId] = emptyTierValues
            }
            return next
          })

          applied += allRateIds.length
          return
        }
        case "add_plan_rate_currency": {
          const code = getStringValue(action.code ?? action.currencyCode ?? action.currency ?? action.value).toUpperCase()
          if (!code) {
            addError("Currency code is missing.")
            return
          }
          const resolved = resolveRateId(action)
          if (resolved.id == null) {
            addError(resolved.error ?? "Could not find rate to add currency.")
            return
          }
          setPlanRateCurrencies((prev) => {
            const current = prev[resolved.id!] ?? [{ id: 0, code: planCurrency }]
            const existing = current.find((c) => c.code.trim().toUpperCase() === code)
            if (existing) {
              // Avoid duplicate currencies; just activate the existing currency.
              setPlanRateActiveCurrencyId((ids) => ({ ...ids, [resolved.id!]: existing.id }))
              return prev
            }
            const nextId = current.length ? Math.max(...current.map((c) => c.id)) + 1 : 0
            const next = [...current, { id: nextId, code }]
            setPlanRateActiveCurrencyId((ids) => ({ ...ids, [resolved.id!]: nextId }))
            return { ...prev, [resolved.id!]: next }
          })
          applied += 1
          return
        }
        case "add_currency_to_all_rates": {
          const code = getStringValue(action.code ?? action.currencyCode ?? action.currency ?? action.value).toUpperCase()
          if (!code) {
            addError("Currency code is missing.")
            return
          }
          // Add currency to ALL rates across all rate cards
          const allRateIds = getAllRates(planRateCards, planRates).map((rate) => rate.id)
          if (allRateIds.length === 0) {
            addError("No rates available to add currency to.")
            return
          }
          setPlanRateCurrencies((prev) => {
            const next = { ...prev }
            for (const rateId of allRateIds) {
              const current = next[rateId] ?? [{ id: 0, code: planCurrency }]
              const existing = current.find((c) => c.code.trim().toUpperCase() === code)
              if (!existing) {
                const nextId = current.length ? Math.max(...current.map((c) => c.id)) + 1 : 0
                next[rateId] = [...current, { id: nextId, code }]
                setPlanRateActiveCurrencyId((ids) => ({ ...ids, [rateId]: nextId }))
              } else {
                setPlanRateActiveCurrencyId((ids) => ({ ...ids, [rateId]: existing.id }))
              }
            }
            return next
          })
          applied += allRateIds.length
          return
        }
        case "remove_plan_rate_currency": {
          const resolved = resolveRateId(action)
          if (resolved.id == null) {
            addError(resolved.error ?? "Could not find rate to remove currency.")
            return
          }
          const currencyResolved = resolvePlanRateCurrencyId(resolved.id, action)
          if (currencyResolved.id == null) {
            addError(currencyResolved.error ?? "Could not find currency to remove.")
            return
          }
          setPlanRateCurrencies((prev) => {
            const current = prev[resolved.id!] ?? [{ id: 0, code: planCurrency }]
            const next = current.filter((c) => c.id !== currencyResolved.id)
            const fallback = next.length ? next : [{ id: 0, code: planCurrency }]
            if (!fallback.some((c) => c.id === planRateActiveCurrencyId[resolved.id!])) {
              setPlanRateActiveCurrencyId((ids) => ({ ...ids, [resolved.id!]: fallback[0]!.id }))
            }
            return { ...prev, [resolved.id!]: fallback }
          })
          applied += 1
          return
        }
        case "set_plan_rate_currency_code": {
          const value = getStringValue(action.value)
          if (!value) {
            addError("Currency code is missing.")
            return
          }
          const resolved = resolveRateId(action)
          if (resolved.id == null) {
            addError(resolved.error ?? "Could not find rate to update currency.")
            return
          }
          const currencyResolved = resolvePlanRateCurrencyId(resolved.id, action)
          if (currencyResolved.id == null) {
            addError(currencyResolved.error ?? "Could not find currency to update.")
            return
          }
          setPlanRateCurrencies((prev) => {
            const current = prev[resolved.id!] ?? [{ id: 0, code: planCurrency }]
            return {
              ...prev,
              [resolved.id!]: current.map((currency) =>
                currency.id === currencyResolved.id ? { ...currency, code: value.toUpperCase() } : currency
              ),
            }
          })
          applied += 1
          return
        }
        case "set_plan_rate_active_currency": {
          const resolved = resolveRateId(action)
          if (resolved.id == null) {
            addError(resolved.error ?? "Could not find rate to update currency.")
            return
          }
          const currencyResolved = resolvePlanRateCurrencyId(resolved.id, action)
          if (currencyResolved.id == null) {
            addError(currencyResolved.error ?? "Could not find currency to activate.")
            return
          }
          setPlanRateActiveCurrencyId((prev) => ({ ...prev, [resolved.id!]: currencyResolved.id! }))
          applied += 1
          return
        }
        case "set_plan_usage_scenario_rates": {
          hasUserEditedPlanUsageScenarioRef.current = true
          const ids = Array.isArray(action.rateIds) ? action.rateIds.map((id) => Number(id)) : []
          const names = Array.isArray(action.rateNames) ? action.rateNames.map((name) => String(name)) : []
          const resolvedIds: number[] = []
          const rateCards = getDraftPlanRateCards()
          if (ids.length) {
            ids.forEach((id) => {
              if (Number.isFinite(id) && rateCards.some((card) => card.rates.some((rate) => rate.id === id))) {
                resolvedIds.push(id)
              } else {
                addError(`Rate id "${id}" is not valid for usage scenario.`)
              }
            })
          } else if (names.length) {
            names.forEach((name) => {
              const match = rateCards
                .flatMap((card) => card.rates)
                .find((rate) => rate.name.trim().toLowerCase() === name.toLowerCase())
              if (match) {
                resolvedIds.push(match.id)
              } else {
                addError(`Rate "${name}" is not available for usage scenario.`)
              }
            })
          } else {
            addError("Usage scenario rates are missing.")
            return
          }
          if (resolvedIds.length) {
            const uniqueIds = resolvedIds.filter((id, index) => resolvedIds.indexOf(id) === index)
            setPlanUsageScenarioRates(uniqueIds)
            applied += 1
          }
          return
        }
        case "add_plan_usage_rate": {
          hasUserEditedPlanUsageScenarioRef.current = true
          const resolved = resolveRateId(action)
          if (resolved.id == null) {
            addError(resolved.error ?? "Could not find rate to add to usage scenario.")
            return
          }
          setPlanUsageScenarioRates((prev) => (prev.includes(resolved.id!) ? prev : [...prev, resolved.id!]))
          applied += 1
          return
        }
        case "remove_plan_usage_rate": {
          hasUserEditedPlanUsageScenarioRef.current = true
          const index = getNumberValue(action.index)
          if (index != null) {
            setPlanUsageScenarioRates((prev) => prev.filter((_, idx) => idx !== index))
            applied += 1
            return
          }
          const resolved = resolveRateId(action)
          if (resolved.id == null) {
            addError(resolved.error ?? "Could not find rate to remove from usage scenario.")
            return
          }
          setPlanUsageScenarioRates((prev) => prev.filter((id) => id !== resolved.id))
          applied += 1
          return
        }
        case "add_plan_credit_grant": {
          const name = getStringValue(action.name)
          const newId = nextCreditGrantId
          nextCreditGrantId += 1
          if (name) createdCreditGrants.set(name.toLowerCase(), newId)
          setPlanCreditGrants((prev) => {
            setActivePlanNode({ type: "creditGrant", id: newId })
            return [...prev, { id: newId, name }]
          })
          applied += 1
          return
        }
        case "rename_plan_credit_grant": {
          const value = getStringValue(action.value)
          const resolved = resolveCreditGrantId(action, createdCreditGrants)
          if (resolved.id == null) {
            addError(resolved.error ?? "Could not find credit grant to rename.")
            return
          }
          updateCreditGrantName(resolved.id, value)
          applied += 1
          return
        }
        case "set_plan_credit_grant_amount": {
          const value = getStringValue(action.value)
          const resolved = resolveCreditGrantId(action, createdCreditGrants)
          if (resolved.id == null) {
            addError(resolved.error ?? "Could not find credit grant to update amount.")
            return
          }
          setCreditGrantAmounts((prev) => ({ ...prev, [resolved.id]: value }))
          applied += 1
          return
        }
        case "set_plan_credit_grant_period": {
          const value = getStringValue(action.value)
          const match = resolveOption(value, servicingPeriodOptions)
          if (!match) {
            addError(`Credit grant period "${value}" is not valid.`)
            return
          }
          const resolved = resolveCreditGrantId(action, createdCreditGrants)
          if (resolved.id == null) {
            addError(resolved.error ?? "Could not find credit grant to update period.")
            return
          }
          setCreditGrantPeriods((prev) => ({ ...prev, [resolved.id]: match }))
          applied += 1
          return
        }
        case "set_plan_credit_grant_application": {
          const value = getStringValue(action.value)
          const match = resolveOption(value, creditApplicationOptions)
          if (!match) {
            addError(`Credit grant application "${value}" is not valid.`)
            return
          }
          const resolved = resolveCreditGrantId(action, createdCreditGrants)
          if (resolved.id == null) {
            addError(resolved.error ?? "Could not find credit grant to update application.")
            return
          }
          setCreditGrantApplications((prev) => ({ ...prev, [resolved.id]: match }))
          applied += 1
          return
        }
        case "set_plan_credit_grant_lookup_key": {
          const value = getStringValue(action.value)
          const resolved = resolveCreditGrantId(action, createdCreditGrants)
          if (resolved.id == null) {
            addError(resolved.error ?? "Could not find credit grant to update lookup key.")
            return
          }
          setCreditGrantLookupKeys((prev) => ({ ...prev, [resolved.id]: value }))
          applied += 1
          return
        }
        case "add_plan_subscription_fee": {
          const name = getStringValue(action.name)
          const amount = getStringValue(action.amount)
          const newId = nextSubscriptionFeeId
          nextSubscriptionFeeId += 1
          if (name) createdSubscriptionFees.set(name.toLowerCase(), newId)
          setPlanSubscriptionFees((prev) => {
            setActivePlanNode({ type: "subscriptionFee", id: newId })
            return [...prev, { id: newId, name }]
          })
          if (amount) {
            setSubscriptionFeeAmounts((prev) => ({ ...prev, [newId]: amount }))
          }
          applied += 1
          return
        }
        case "rename_plan_subscription_fee": {
          const value = getStringValue(action.value)
          const resolved = resolveSubscriptionFeeId(action, createdSubscriptionFees)
          if (resolved.id == null) {
            addError(resolved.error ?? "Could not find subscription fee to rename.")
            return
          }
          updateSubscriptionFeeName(resolved.id, value)
          applied += 1
          return
        }
        case "set_plan_subscription_fee_amount": {
          const value = getStringValue(action.value)
          const resolved = resolveSubscriptionFeeId(action, createdSubscriptionFees)
          if (resolved.id == null) {
            addError(resolved.error ?? "Could not find subscription fee to update amount.")
            return
          }
          setSubscriptionFeeAmounts((prev) => ({ ...prev, [resolved.id]: value }))
          applied += 1
          return
        }
        case "set_plan_subscription_fee_period": {
          const value = getStringValue(action.value)
          const match = resolveOption(value, servicingPeriodOptions)
          if (!match) {
            addError(`Subscription fee period "${value}" is not valid.`)
            return
          }
          const resolved = resolveSubscriptionFeeId(action, createdSubscriptionFees)
          if (resolved.id == null) {
            addError(resolved.error ?? "Could not find subscription fee to update period.")
            return
          }
          setSubscriptionFeePeriods((prev) => ({ ...prev, [resolved.id]: match }))
          applied += 1
          return
        }
        case "set_plan_subscription_fee_price_type": {
          const value = getStringValue(action.value)
          const match = resolveOption(value, planPriceTypeOptions)
          if (!match) {
            addError(`Subscription fee price type "${value}" is not valid.`)
            return
          }
          const resolved = resolveSubscriptionFeeId(action, createdSubscriptionFees)
          if (resolved.id == null) {
            addError(resolved.error ?? "Could not find subscription fee to update price type.")
            return
          }
          setSubscriptionFeePriceTypes((prev) => ({ ...prev, [resolved.id]: match }))
          applied += 1
          return
        }
        case "set_plan_subscription_fee_sell_as": {
          const value = getStringValue(action.value)
          const match = resolveOption(value, sellAsOptions)
          if (!match) {
            addError(`Subscription fee sell-as "${value}" is not valid.`)
            return
          }
          const resolved = resolveSubscriptionFeeId(action, createdSubscriptionFees)
          if (resolved.id == null) {
            addError(resolved.error ?? "Could not find subscription fee to update sell-as.")
            return
          }
          setSubscriptionFeeSellAs((prev) => ({ ...prev, [resolved.id]: match }))
          applied += 1
          return
        }
        case "set_plan_subscription_fee_unit_label": {
          const value = getStringValue(action.value)
          const resolved = resolveSubscriptionFeeId(action, createdSubscriptionFees)
          if (resolved.id == null) {
            addError(resolved.error ?? "Could not find subscription fee to update unit label.")
            return
          }
          setSubscriptionFeeUnitLabels((prev) => ({ ...prev, [resolved.id]: value }))
          applied += 1
          return
        }
        case "set_plan_subscription_fee_tax_code": {
          const value = getStringValue(action.value)
          const resolved = resolveSubscriptionFeeId(action, createdSubscriptionFees)
          if (resolved.id == null) {
            addError(resolved.error ?? "Could not find subscription fee to update tax code.")
            return
          }
          setSubscriptionFeeTaxCodes((prev) => ({ ...prev, [resolved.id]: value }))
          applied += 1
          return
        }
        case "set_plan_subscription_fee_item_lookup_key": {
          const value = getStringValue(action.value)
          const resolved = resolveSubscriptionFeeId(action, createdSubscriptionFees)
          if (resolved.id == null) {
            addError(resolved.error ?? "Could not find subscription fee to update item lookup key.")
            return
          }
          setSubscriptionFeeItemLookupKeys((prev) => ({ ...prev, [resolved.id]: value }))
          applied += 1
          return
        }
        case "set_plan_subscription_fee_fee_lookup_key": {
          const value = getStringValue(action.value)
          const resolved = resolveSubscriptionFeeId(action, createdSubscriptionFees)
          if (resolved.id == null) {
            addError(resolved.error ?? "Could not find subscription fee to update fee lookup key.")
            return
          }
          setSubscriptionFeeFeeLookupKeys((prev) => ({ ...prev, [resolved.id]: value }))
          applied += 1
          return
        }
        case "add_subscription_fee_item_metadata_row": {
          const resolved = resolveSubscriptionFeeId(action, createdSubscriptionFees)
          if (resolved.id == null) {
            addError(resolved.error ?? "Could not find subscription fee to add metadata.")
            return
          }
          addMetadataRow(setSubscriptionFeeItemMetadataRows, resolved.id, setSubscriptionFeeItemMetadataValues)
          applied += 1
          return
        }
        case "remove_subscription_fee_item_metadata_row": {
          const resolved = resolveSubscriptionFeeId(action, createdSubscriptionFees)
          if (resolved.id == null) {
            addError(resolved.error ?? "Could not find subscription fee metadata to remove.")
            return
          }
          const rows = getMetadataRows(subscriptionFeeItemMetadataRows, resolved.id)
          const rowResolved = resolveRowId(rows, action, "subscription fee item metadata")
          if (rowResolved.id == null) {
            addError(rowResolved.error ?? "Could not find subscription fee item metadata row.")
            return
          }
          removeMetadataRow(setSubscriptionFeeItemMetadataRows, resolved.id, rowResolved.id, setSubscriptionFeeItemMetadataValues)
          applied += 1
          return
        }
        case "set_subscription_fee_item_metadata_key": {
          const value = getStringValue(action.value)
          const resolved = resolveSubscriptionFeeId(action, createdSubscriptionFees)
          if (resolved.id == null) {
            addError(resolved.error ?? "Could not find subscription fee metadata to update.")
            return
          }
          const rows = getMetadataRows(subscriptionFeeItemMetadataRows, resolved.id)
          const rowResolved = resolveRowId(rows, action, "subscription fee item metadata")
          if (rowResolved.id == null) {
            addError(rowResolved.error ?? "Could not find subscription fee item metadata row.")
            return
          }
          updatePlanMetadataValue(setSubscriptionFeeItemMetadataValues, resolved.id, rowResolved.id, { key: value })
          applied += 1
          return
        }
        case "set_subscription_fee_item_metadata_value": {
          const value = getStringValue(action.value)
          const resolved = resolveSubscriptionFeeId(action, createdSubscriptionFees)
          if (resolved.id == null) {
            addError(resolved.error ?? "Could not find subscription fee metadata to update.")
            return
          }
          const rows = getMetadataRows(subscriptionFeeItemMetadataRows, resolved.id)
          const rowResolved = resolveRowId(rows, action, "subscription fee item metadata")
          if (rowResolved.id == null) {
            addError(rowResolved.error ?? "Could not find subscription fee item metadata row.")
            return
          }
          updatePlanMetadataValue(setSubscriptionFeeItemMetadataValues, resolved.id, rowResolved.id, { value })
          applied += 1
          return
        }
        case "add_subscription_fee_fee_metadata_row": {
          const resolved = resolveSubscriptionFeeId(action, createdSubscriptionFees)
          if (resolved.id == null) {
            addError(resolved.error ?? "Could not find subscription fee fee metadata to add.")
            return
          }
          addMetadataRow(setSubscriptionFeeFeeMetadataRows, resolved.id, setSubscriptionFeeFeeMetadataValues)
          applied += 1
          return
        }
        case "remove_subscription_fee_fee_metadata_row": {
          const resolved = resolveSubscriptionFeeId(action, createdSubscriptionFees)
          if (resolved.id == null) {
            addError(resolved.error ?? "Could not find subscription fee fee metadata to remove.")
            return
          }
          const rows = getMetadataRows(subscriptionFeeFeeMetadataRows, resolved.id)
          const rowResolved = resolveRowId(rows, action, "subscription fee fee metadata")
          if (rowResolved.id == null) {
            addError(rowResolved.error ?? "Could not find subscription fee fee metadata row.")
            return
          }
          removeMetadataRow(setSubscriptionFeeFeeMetadataRows, resolved.id, rowResolved.id, setSubscriptionFeeFeeMetadataValues)
          applied += 1
          return
        }
        case "set_subscription_fee_fee_metadata_key": {
          const value = getStringValue(action.value)
          const resolved = resolveSubscriptionFeeId(action, createdSubscriptionFees)
          if (resolved.id == null) {
            addError(resolved.error ?? "Could not find subscription fee fee metadata to update.")
            return
          }
          const rows = getMetadataRows(subscriptionFeeFeeMetadataRows, resolved.id)
          const rowResolved = resolveRowId(rows, action, "subscription fee fee metadata")
          if (rowResolved.id == null) {
            addError(rowResolved.error ?? "Could not find subscription fee fee metadata row.")
            return
          }
          updatePlanMetadataValue(setSubscriptionFeeFeeMetadataValues, resolved.id, rowResolved.id, { key: value })
          applied += 1
          return
        }
        case "set_subscription_fee_fee_metadata_value": {
          const value = getStringValue(action.value)
          const resolved = resolveSubscriptionFeeId(action, createdSubscriptionFees)
          if (resolved.id == null) {
            addError(resolved.error ?? "Could not find subscription fee fee metadata to update.")
            return
          }
          const rows = getMetadataRows(subscriptionFeeFeeMetadataRows, resolved.id)
          const rowResolved = resolveRowId(rows, action, "subscription fee fee metadata")
          if (rowResolved.id == null) {
            addError(rowResolved.error ?? "Could not find subscription fee fee metadata row.")
            return
          }
          updatePlanMetadataValue(setSubscriptionFeeFeeMetadataValues, resolved.id, rowResolved.id, { value })
          applied += 1
          return
        }
        case "expand_rate_card": {
          const resolved = resolveRateCardId(action, createdRateCards, defaultRateCardId)
          if (resolved.id == null) {
            addError(resolved.error ?? "Could not find rate card to expand.")
            return
          }
          setPlanExpandedRateCards((prev) => ({ ...prev, [resolved.id]: true }))
          applied += 1
          return
        }
        case "collapse_rate_card": {
          const resolved = resolveRateCardId(action, createdRateCards, defaultRateCardId)
          if (resolved.id == null) {
            addError(resolved.error ?? "Could not find rate card to collapse.")
            return
          }
          setPlanExpandedRateCards((prev) => ({ ...prev, [resolved.id]: false }))
          applied += 1
          return
        }
        case "expand_all_rate_cards": {
          setPlanExpandedRateCards((prev) => {
            const next = { ...prev }
            getDraftPlanRateCards().forEach((card) => {
              next[card.id] = true
            })
            return next
          })
          applied += 1
          return
        }
        case "collapse_all_rate_cards": {
          setPlanExpandedRateCards((prev) => {
            const next = { ...prev }
            getDraftPlanRateCards().forEach((card) => {
              next[card.id] = false
            })
            return next
          })
          applied += 1
          return
        }
        case "remove_empty_rate_cards": {
          // Remove any rate cards that have no rates, or no name and only empty/untitled rates
          setPlanRateCards((prev) => {
            const nonEmpty = prev.filter((card) => {
              // Remove cards with no rates at all
              if (card.rates.length === 0) return false
              const hasName = card.name.trim() !== ""
              const hasNamedRates = card.rates.some((rate) => rate.name.trim() !== "")
              return hasName || hasNamedRates
            })
            // Always keep at least one rate card
            if (nonEmpty.length === 0 && prev.length > 0) {
              return [prev[0]]
            }
            return nonEmpty.length > 0 ? nonEmpty : prev
          })
          updateDraftPlanRateCards((prev) => {
            const nonEmpty = prev.filter((card) => {
              // Remove cards with no rates at all
              if (card.rates.length === 0) return false
              const hasName = card.name.trim() !== ""
              const hasNamedRates = card.rates.some((rate) => rate.name.trim() !== "")
              return hasName || hasNamedRates
            })
            if (nonEmpty.length === 0 && prev.length > 0) {
              return [prev[0]]
            }
            return nonEmpty.length > 0 ? nonEmpty : prev
          })
          applied += 1
          return
        }
        case "select_plan_node": {
          const nodeType = getStringValue(action.nodeType)
          if (!nodeType) {
            addError("Plan node type is missing.")
            return
          }
          if (nodeType === "plan") {
            setActivePlanNode({ type: "plan" })
            applied += 1
            return
          }
          if (nodeType === "rateCard") {
            const resolved = resolveRateCardId(action, createdRateCards, defaultRateCardId)
            if (resolved.id == null) {
              addError(resolved.error ?? "Could not find rate card to select.")
              return
            }
            setActivePlanRateCardId(resolved.id)
            setActivePlanNode({ type: "rateCard", id: resolved.id })
            defaultRateCardId = resolved.id
            applied += 1
            return
          }
          if (nodeType === "rate") {
            const resolved = resolveRateId(action)
            if (resolved.id == null) {
              addError(resolved.error ?? "Could not find rate to select.")
              return
            }
            if (resolved.cardId != null) {
              setActivePlanRateCardId(resolved.cardId)
              defaultRateCardId = resolved.cardId
            }
            setActivePlanNode({ type: "rate", id: resolved.id })
            applied += 1
            return
          }
          if (nodeType === "creditGrant") {
            const id = getNumberValue(action.id ?? action.creditGrantId)
            if (id != null) {
              setActivePlanNode({ type: "creditGrant", id })
              applied += 1
              return
            }
            const name = getStringValue(action.name ?? action.creditGrantName)
            const match = planCreditGrants.find((grant) => grant.name.trim().toLowerCase() === name.toLowerCase())
            if (!match) {
              addError("Credit grant id or name is missing.")
              return
            }
            setActivePlanNode({ type: "creditGrant", id: match.id })
            applied += 1
            return
          }
          if (nodeType === "subscriptionFee" || nodeType === "subscriptionFee") {
            const id = getNumberValue(action.id ?? action.subscriptionFeeId ?? action.subscriptionFeeId)
            if (id != null) {
              setActivePlanNode({ type: "subscriptionFee", id })
              applied += 1
              return
            }
            const name = getStringValue(action.name ?? action.subscriptionFeeName ?? action.subscriptionFeeName)
            const match = planSubscriptionFees.find((fee) => fee.name.trim().toLowerCase() === name.toLowerCase())
            if (!match) {
              addError("Subscription fee id or name is missing.")
              return
            }
            setActivePlanNode({ type: "subscriptionFee", id: match.id })
            applied += 1
            return
          }
          addError(`Unknown plan node type "${nodeType}".`)
          return
        }
        default: {
          addError(`Unsupported action "${type}".`)
        }
      }
    })
    } finally {
      if (mode === "plan") assistantPlanRateCardsDraftRef.current = null
    }

    // Cleanup: Remove empty tiers that shouldn't exist (AI sometimes adds one too many)
    // Keep only one empty tier at the end (the infinity tier)
    if (mode === "plan") {
      setPlanRateTiers((prev) => {
        const updated = { ...prev }
        for (const rateIdStr of Object.keys(updated)) {
          const rateId = Number(rateIdStr)
          const tierIds = updated[rateId] ?? []
          if (tierIds.length <= 2) continue // Need at least 3 tiers for this to matter

          // Find consecutive empty tiers at the end
          const toValues = localTierToTracker[rateId] ?? {}
          let firstEmptyFromEnd = tierIds.length
          for (let i = tierIds.length - 1; i >= 0; i--) {
            const tierId = tierIds[i]
            const toValue = toValues[tierId]
            if (toValue != null && toValue.trim() !== "") {
              break
            }
            firstEmptyFromEnd = i
          }

          // If there are multiple empty tiers at the end, keep only the last one
          const emptyCount = tierIds.length - firstEmptyFromEnd
          if (emptyCount > 1) {
            // Remove all empty tiers except the last one
            const toRemove = tierIds.slice(firstEmptyFromEnd, tierIds.length - 1)
            updated[rateId] = tierIds.filter((id) => !toRemove.includes(id))

            // Also clean up the tier values for removed tiers
            for (const tierId of toRemove) {
              setPlanRateTierToValues((vals) => {
                const copy = { ...vals[rateId] }
                delete copy[tierId]
                return { ...vals, [rateId]: copy }
              })
              setPlanRateTierUnitPrices((vals) => {
                const copy = { ...vals[rateId] }
                delete copy[tierId]
                return { ...vals, [rateId]: copy }
              })
              setPlanRateTierFlatFees((vals) => {
                const copy = { ...vals[rateId] }
                delete copy[tierId]
                return { ...vals, [rateId]: copy }
              })
            }
          }
        }
        return updated
      })
    }

    return { applied, errors }
  }

  // Re-validate on form changes so errors clear per-field as the user fixes them
  useEffect(() => {
    if (incompleteFields.length === 0) return
    const updated = validatePlanForm({
      t,
      planName,
      planDescription,
      planLookupKey,
      planRateCards,
      rateMeters,
      ratePriceTypes,
      planRateUnitPrices,
      rateUnitLabels,
      planCreditGrants,
      creditGrantAmounts,
      planSubscriptionFees,
      subscriptionFeeAmounts,
      subscriptionFeeUnitLabels,
      planPriceTypeOptions,
      getPlanRateLabel,
      getPlanCreditGrantLabel,
      getPlanSubscriptionFeeLabel,
    })
    setIncompleteFields(updated)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    planName, planDescription, planLookupKey, planRateCards,
    rateMeters, ratePriceTypes, planRateUnitPrices, rateUnitLabels,
    creditGrantAmounts, subscriptionFeeAmounts, subscriptionFeeUnitLabels,
  ])

  const validationErrorKeys = useMemo(
    () => incompleteFields.map((f) => f.key),
    [incompleteFields]
  )

  const validationErrorMessages = useMemo(() => {
    const map: Record<string, string> = {}
    for (const f of incompleteFields) {
      map[f.key] = f.message
    }
    return map
  }, [incompleteFields])

  const validationErrorObjects = useMemo(
    () => incompleteFields.length > 0
      ? getValidationErrorObjects(incompleteFields, {
          getPlanLabel,
          getPlanRateLabel,
          getPlanCreditGrantLabel,
          getPlanSubscriptionFeeLabel,
          planName,
          planRateCards,
          planCreditGrants: planCreditGrants,
          planSubscriptionFees: planSubscriptionFees,
          t,
        })
      : [],
    [incompleteFields, getPlanLabel, getPlanRateLabel, getPlanCreditGrantLabel, getPlanSubscriptionFeeLabel, planName, planRateCards, planCreditGrants, planSubscriptionFees, t]
  )

  const validationErrorNodeIds = useMemo(
    () => validationErrorObjects.map((obj) => ({ type: obj.nodeType, id: obj.nodeId })),
    [validationErrorObjects]
  )

  const planFormCtx: PlanFormContext = {
    t,
    textFieldInputClasses,
    currencyOptions,
    currencyDisplayNames,
    includeTaxOptions,
    servicingPeriodOptions,
    planPriceTypeOptions,
    sellAsOptions,
    creditApplicationOptions,
    numberFormatter,
    parseNumberValue,
    activePlanNode,
    setActivePlanNode,
    activePlanRateCardId,
    activePlanRateCard,
    planRateCards,
    planRates,
    planCurrency,
    getMetadataRows,
    addMetadataRow,
    removeMetadataRow,
    rateCardServicingPeriods,
    setRateCardServicingPeriods,
    rateCardLookupKeys,
    setRateCardLookupKeys,
    showRateCardAdvanced,
    setShowRateCardAdvanced,
    updateRateCardName,
    rateCardMetadataRows,
    setRateCardMetadataRows,
    rateCardMetadataValues,
    setRateCardMetadataValues,
    updateRateName,
    existingRateNames: (() => {
      const names = new Set(savedRateNames)
      try {
        const raw = window.localStorage.getItem("product-catalog-standalone-products")
        const prods: { name: string }[] = raw ? JSON.parse(raw) : []
        for (const p of prods) { if (p.name) names.add(p.name) }
      } catch {}
      return Array.from(names)
    })(),
    existingFeeNames: savedFeeNames,
    meterOptions: availablePlanMeterOptions,
    onOpenMeterBuilderForRate: (rateId: number) => {
      setPlanRateMeterConfigs((prev) => {
        if (prev[rateId]) return prev
        const fallbackName = (rateMeters[rateId] ?? "").trim()
        return {
          ...prev,
          [rateId]: {
            name: fallbackName,
            eventName: "",
            aggregationMethod: aggregationMethodOptions[0],
            eventTimeWindow: eventTimeWindowOptions[0],
            showCountingOptions: false,
            valueKeyOverride: "",
          },
        }
      })
      setActivePlanNode({ type: "rateMeter", id: rateId })
    },
    aggregationMethodOptions,
    eventTimeWindowOptions,
    planRateMeterConfigs,
    setPlanRateMeterConfigs,
    setAvailableMeterOptions: setAvailablePlanMeterOptions,
    updateAvailableMeterName: (prevList: string[], previous: string, next: string) => {
      const prevTrim = previous.trim()
      const nextTrim = next.trim()
      const out: string[] = []
      const seen = new Set<string>()
      for (const raw of prevList) {
        const value = raw.trim()
        if (!value) continue
        if (value === prevTrim && nextTrim) {
          if (!seen.has(nextTrim)) {
            seen.add(nextTrim)
            out.push(nextTrim)
          }
          continue
        }
        if (seen.has(value)) continue
        seen.add(value)
        out.push(value)
      }
      if (nextTrim && !seen.has(nextTrim)) out.push(nextTrim)
      return out
    },
    rateMeters,
    setRateMeters,
    ratePriceTypes,
    setRatePriceTypes: ((action) => { setRatePriceTypes(action); markActiveComponentDirty() }) as typeof setRatePriceTypes,
    rateSellAs,
    setRateSellAs: ((action) => { setRateSellAs(action); markActiveComponentDirty() }) as typeof setRateSellAs,
    planRateUnitPrices,
    setPlanRateUnitPrices: ((action) => { setPlanRateUnitPrices(action); markActiveComponentDirty() }) as typeof setPlanRateUnitPrices,
    planRateTiers,
    setPlanRateTiers: ((action) => { setPlanRateTiers(action); markActiveComponentDirty() }) as typeof setPlanRateTiers,
    planRateTierToValues,
    setPlanRateTierToValues: ((action) => { setPlanRateTierToValues(action); markActiveComponentDirty() }) as typeof setPlanRateTierToValues,
    planRateTierUnitPrices,
    setPlanRateTierUnitPrices: ((action) => { setPlanRateTierUnitPrices(action); markActiveComponentDirty() }) as typeof setPlanRateTierUnitPrices,
    planRateTierFlatFees,
    setPlanRateTierFlatFees: ((action) => { setPlanRateTierFlatFees(action); markActiveComponentDirty() }) as typeof setPlanRateTierFlatFees,
    planRateIncludeTax,
    setPlanRateIncludeTax,
    planRateCurrencies,
    setPlanRateCurrencies,
    planRateActiveCurrencyId,
    setPlanRateActiveCurrencyId,
    usageScenarioDraggingRateId,
    planRateUsage,
    rateUnitLabels,
    setRateUnitLabels,
    showRateAdvanced,
    setShowRateAdvanced,
    rateTaxCodes,
    setRateTaxCodes,
    rateItemLookupKeys,
    setRateItemLookupKeys,
    rateItemMetadataRows,
    setRateItemMetadataRows,
    rateItemMetadataValues,
    setRateItemMetadataValues,
    rateSettingsMetadataRows,
    setRateSettingsMetadataRows,
    rateSettingsMetadataValues,
    setRateSettingsMetadataValues,
    ratePriceVariants,
    onSelectRatePriceVariant: (rateId: number, variantIndex: number) => {
      const variants = ratePriceVariants[rateId]
      if (!variants?.[variantIndex]) return
      const v = variants[variantIndex]
      setPlanRateUnitPrices((p) => ({ ...p, [rateId]: v.price }))
      setRatePriceTypes((t) => ({ ...t, [rateId]: v.priceType || planPriceTypeOptions[0] }))
      if (v.meter) setRateMeters((m) => ({ ...m, [rateId]: v.meter }))
      if (v.sellAs) setRateSellAs((s) => ({ ...s, [rateId]: v.sellAs }))
      if (v.unitLabel) setRateUnitLabels((l) => ({ ...l, [rateId]: v.unitLabel }))
    },
    planPriceGroups,
    setPlanPriceGroups,
    planCreditGrants,
    setPlanCreditGrants,
    updateCreditGrantName,
    creditGrantPeriods,
    setCreditGrantPeriods: ((action) => { setCreditGrantPeriods(action); markActiveComponentDirty() }) as typeof setCreditGrantPeriods,
    creditGrantAmounts,
    setCreditGrantAmounts: ((action) => { setCreditGrantAmounts(action); markActiveComponentDirty() }) as typeof setCreditGrantAmounts,
    creditGrantApplications,
    setCreditGrantApplications,
    showCreditAdvanced,
    setShowCreditAdvanced,
    creditGrantLookupKeys,
    setCreditGrantLookupKeys,
    creditGrantItemMetadataRows,
    setCreditGrantItemMetadataRows,
    creditGrantItemMetadataValues,
    setCreditGrantItemMetadataValues,
    creditGrantInstanceMetadataRows,
    setCreditGrantInstanceMetadataRows,
    creditGrantInstanceMetadataValues,
    setCreditGrantInstanceMetadataValues,
    planSubscriptionFees,
    updateSubscriptionFeeName,
    subscriptionFeeItemMetadataRows,
    setSubscriptionFeeItemMetadataRows,
    subscriptionFeeItemMetadataValues,
    setSubscriptionFeeItemMetadataValues,
    subscriptionFeeFeeMetadataRows,
    setSubscriptionFeeFeeMetadataRows,
    subscriptionFeeFeeMetadataValues,
    setSubscriptionFeeFeeMetadataValues,
    subscriptionFeePeriods,
    setSubscriptionFeePeriods: ((action) => { setSubscriptionFeePeriods(action); markActiveComponentDirty() }) as typeof setSubscriptionFeePeriods,
    subscriptionFeePriceTypes,
    setSubscriptionFeePriceTypes: ((action) => { setSubscriptionFeePriceTypes(action); markActiveComponentDirty() }) as typeof setSubscriptionFeePriceTypes,
    subscriptionFeeSellAs,
    setSubscriptionFeeSellAs: ((action) => { setSubscriptionFeeSellAs(action); markActiveComponentDirty() }) as typeof setSubscriptionFeeSellAs,
    subscriptionFeeAmounts,
    setSubscriptionFeeAmounts: ((action) => { setSubscriptionFeeAmounts(action); markActiveComponentDirty() }) as typeof setSubscriptionFeeAmounts,
    subscriptionFeeUnitLabels,
    setSubscriptionFeeUnitLabels,
    showSubscriptionFeeAdvanced,
    setShowSubscriptionFeeAdvanced,
    subscriptionFeeTaxCodes,
    setSubscriptionFeeTaxCodes,
    subscriptionFeeItemLookupKeys,
    setSubscriptionFeeItemLookupKeys,
    subscriptionFeeFeeLookupKeys,
    setSubscriptionFeeFeeLookupKeys,
    planName,
    setPlanName,
    planDescription,
    setPlanDescription,
    setPlanCurrency,
    planLookupKey,
    setPlanLookupKey,
    planTaxTreatment,
    setPlanTaxTreatment,
    planMetadataRows,
    setPlanMetadataRows,
    planMetadataValues,
    setPlanMetadataValues,
    showPlanAdvanced,
    setShowPlanAdvanced,
    assistantHighlightedKeys: planScopedAiPreviewHighlightedKeys,
    // Use !bg to override default bg-white on inputs (matches object-map/scoped preview highlight).
    assistantHighlightClass: "!bg-[#E0D9FB]",
    assistantLoadingKeys: planScopedAiLoadingKeys,
    validationErrorKeys,
    validationErrorMessages,
    onEditAllRates: (rateCardId: number) => setBulkEditRateCardId(rateCardId),
    pendingFocusRateId,
    clearPendingFocusRateId: () => setPendingFocusRateId(null),
    onHoverQuickStart: (kind) => {
      if (kind) {
        const map: Record<string, ("subscription-fee" | "rate" | "credit-grant")[]> = {
          "subscription": ["subscription-fee"],
          "usage": ["rate"],
          "subscription-usage": ["subscription-fee", "rate"],
          "credits-usage": ["credit-grant", "rate"],
        }
        setQuickStartGhostKinds(map[kind] ?? null)
      } else {
        setQuickStartGhostKinds(null)
      }
    },
    onSkipGetStarted: () => {
      setIsInlineGetStartedActive(false)
      setGetStartedDismissed(true)
      setIsTreeNavOpen(true)
      setHasTreeChanges(false)
    },
    onQuickStart: (kind) => {
      setIsInlineGetStartedActive(false)
      setQuickStartGhostKinds(null)
      setShowFieldHints(true)
      if (kind === "subscription") {
        handleAddPlanObject("rate-card")
      } else if (kind === "usage") {
        handleAddPlanObject("rate-card")
      } else if (kind === "subscription-usage") {
        handleAddPlanObject("rate-card")
      } else if (kind === "credits-usage") {
        handleAddPlanObject("rate-card")
      }
    },
    onWizardSubmit: (data) => {
      setIsInlineGetStartedActive(false)
      // Scaffold the plan using the same logic as the wizard modal ("new" mode)
      scaffoldPricingPlanFromWizard({
        mode: "new",
        planName: data.planName,
        costPerMonth: data.costPerMonth,
        costPeriod: data.costPeriod,
        costCustomCount: data.costCustomCount,
        costCustomUnit: data.costCustomUnit,
        features: data.features,
        freeCreditsAmount: data.freeCreditsAmount,
        freeCreditsPeriod: data.freeCreditsPeriod,
        freeCreditsCustomCount: data.freeCreditsCustomCount,
        freeCreditsCustomUnit: data.freeCreditsCustomUnit,
        importedFromPlanName: data.importedFromPlanName,
        importedFromPlanId: data.importedFromPlanId,
      })
      setGetStartedDismissed(true)
      setShowFieldHints(true)
    },
    onWizardFormChange: (data) => {
      // Once the wizard has been submitted/skipped, ignore any further form
      // change events. Without this guard, when the wizard mask remounts
      // inside the cross-blur exit transition, its mount-time effect fires
      // onFormChange with empty values — wiping the plan name we just
      // scaffolded and re-flipping isInlineGetStartedActive on, which hides
      // the destination panel header.
      if (getStartedDismissed) return
      setIsInlineGetStartedActive(true)
      setPlanName(data.planName)

      // Subscription fee
      if (parseFloat(data.costPerMonth) > 0) {
        setPlanSubscriptionFees([{ id: 0, name: `${data.planName || "Plan"} \u2014 Subscription Fee` }])
        setSubscriptionFeeAmounts({ 0: data.costPerMonth })
        // Resolve custom period to a displayable string
        const resolvedCostPeriod = data.costPeriod === "Custom" && data.costCustomCount && data.costCustomUnit
          ? `Every ${data.costCustomCount} ${data.costCustomUnit}`
          : data.costPeriod
        setSubscriptionFeePeriods({ 0: resolvedCostPeriod })
      } else {
        setPlanSubscriptionFees([])
        setSubscriptionFeeAmounts({})
        setSubscriptionFeePeriods({})
      }

      // Credit grant
      if (parseFloat(data.freeCreditsAmount) > 0) {
        setPlanCreditGrants([{ id: 0, name: `${data.planName || "Plan"} \u2014 Credits` }])
        setCreditGrantAmounts({ 0: data.freeCreditsAmount })
        // Resolve custom period to a displayable string
        const resolvedCreditPeriod = data.freeCreditsPeriod === "Custom" && data.freeCreditsCustomCount && data.freeCreditsCustomUnit
          ? `Every ${data.freeCreditsCustomCount} ${data.freeCreditsCustomUnit}`
          : data.freeCreditsPeriod
        setCreditGrantPeriods({ 0: resolvedCreditPeriod })
      } else {
        setPlanCreditGrants([])
        setCreditGrantAmounts({})
        setCreditGrantPeriods({})
      }

      if (data.features.length > 0) {
        if (data.importedFromPlanName) {
          const rates = data.features.map((name, i) => ({ id: i, name }))
          setPlanRateCards([{ id: 0, name: "", rates }])
          setPlanRates([])
          setPlanExpandedRateCards((prev) => prev[0] ? prev : { 0: true })
          const metersInit: Record<number, string> = {}
          for (const rate of rates) metersInit[rate.id] = ""
          setRateMeters(metersInit)
        } else {
          const cards = data.features.map((name, i) => ({ id: i, name, rates: [{ id: i, name: "" }] }))
          setPlanRateCards(cards)
          setPlanRates([])
          const expanded: Record<number, boolean> = {}
          for (const card of cards) expanded[card.id] = true
          setPlanExpandedRateCards(expanded)
          const metersInit: Record<number, string> = {}
          for (const card of cards) metersInit[card.rates[0].id] = ""
          setRateMeters(metersInit)
        }
      } else {
        setPlanRateCards([])
        setPlanRates([])
        setRateMeters({})
      }
    },
    wizardSubmitRef,
    onWizardCanSubmitChange: setIsWizardSubmittable,
    onWizardLoadingChange: setIsWizardLoading,
    showFieldHints,
    importedPriceGroupSourcePlan: importedPriceGroupSourcePlan ?? undefined,
    onDismissImportedPriceGroupTip: () => setImportedPriceGroupSourcePlan(null),
    existingPlans: pricingPlans
      .filter((p) => p.id !== editingPricingPlanId)
      .map((p) => {
        const rateNames = [
          ...(p.draft?.planRateCards ?? []).flatMap((c) => c.rates.map((r) => r.name)),
          ...(p.draft?.planRates ?? []).map((r) => r.name),
        ].filter((n) => n.trim() !== "")
        return { id: p.id, name: p.name, rateNames }
      })
      .filter((p) => p.rateNames.length > 0),
  }

  const formPanelContent = (
    <ProductFormPanelContent
      activeObjectForm={activeObjectForm}
      productInfoProps={{
        productName,
        setProductName,
        productDescription,
        setProductDescription,
        productTaxCode,
        setProductTaxCode,
        productImageUrl,
        setProductImageUrl,
        showAdditionalOptions,
        setShowAdditionalOptions,
        statementDescriptor,
        setStatementDescriptor,
        unitLabel,
        setUnitLabel,
        metadataRows,
        setMetadataRows,
        metadataValues,
        setMetadataValues,
        featureRows,
        setFeatureRows,
        featureValues,
        setFeatureValues,
        onImageModalOpen: () => setIsImageModalOpen(true),
      }}
      meterFormProps={{
        meterName: meterName || meter,
        setMeterName,
        meterEventName,
        setMeterEventName,
        aggregationMethod,
        setAggregationMethod,
        aggregationMethodOptions,
        eventTimeWindow,
        setEventTimeWindow,
        eventTimeWindowOptions,
        showCountingOptions,
        setShowCountingOptions,
        valueKeyOverride,
        setValueKeyOverride,
        onUnlink: () => {
          setMeter("")
          setMeterName("")
          setActiveObjectForm("price")
        },
        onSave: handleSaveMeter,
      }}
      priceFormProps={{
        showTopBar: false,
        showCollapsedPriceList: false,
        priceName: activeTreePriceId != null ? (priceNamesById[activeTreePriceId] ?? "") : priceDraftName,
        setPriceName: (value) => {
          const id = activeTreePriceId
          if (id == null) {
            setPriceDraftName(value)
            return
          }
          setPriceNamesById((prev) => ({ ...prev, [id]: value }))
        },
        priceNamePlaceholder: t("Price name"),
        collapsedPrices: collapsedPrices.map((p) => ({ id: p.id, label: p.label })),
        onEditCollapsedPrice: (priceId) => {
          setActiveObjectForm("price")
          handleEditCollapsedPrice(priceId)
        },
        onDeleteCollapsedPrice: handleDeleteCollapsedPrice,
        editingCollapsedPriceId: null,
        chargeFrequency,
        setChargeFrequency,
        pricingModel,
        onPricingModelChange: handlePricingModelChange,
        billingPeriod,
        setBillingPeriod,
        includeTax,
        setIncludeTax,
        usageBasis,
        onUsageBasisChange: handleUsageBasisChange,
        tieredBy,
        setTieredBy,
        meter,
        onMeterChange: (next) => {
          setActiveObjectForm("price")
          handleMeterChange(next)
        },
        onOpenMeterBuilder: () => {
          handleOpenMeterBuilder("create")
        },
        meterOptions: (() => {
          const out: string[] = []
          const seen = new Set<string>()
          const add = (raw: string) => {
            const value = raw.trim()
            if (!value) return
            if (seen.has(value)) return
            seen.add(value)
            out.push(value)
          }
          add(meter)
          add(meterName)
          for (const option of defaultMeterOptions) add(option)
          return out
        })(),
        tiers,
        onAddTier: handleAddTier,
        onRemoveTier: handleRemoveTier,
        tierToValues,
        onChangeTierTo: (id, value) => setTierToValues((prev) => ({ ...prev, [id]: value })),
        tierUnitPrices,
        onChangeTierUnitPrice: (id, value) => setTierUnitPrices((prev) => ({ ...prev, [id]: value })),
        tierFlatFees,
        onChangeTierFlatFee: (id, value) => setTierFlatFees((prev) => ({ ...prev, [id]: value })),
        pricingCurrencies,
        activeCurrencyId,
        setActiveCurrencyId,
        currencyAmounts,
        setCurrencyAmounts,
        currencyOptions,
        currencyDisplayNames,
        onAddCurrency: handleAddCurrency,
        onDeleteCurrency: handleDeleteCurrency,
        onCurrencyChange: handleCurrencyChange,
        showInternalReference,
        setShowInternalReference,
        priceDescription,
        setPriceDescription,
        lookupKey,
        setLookupKey,
        showPriceForm,
        shouldAnimatePriceForm,
        onAnimationComplete: () => setShouldAnimatePriceForm(false),
        priceFormInstance,
        highlightedId,
        newFieldEffect,
        isDrawerSurface: false,
        onAddPrice: handleAddPrice,
      }}
    />
  )

  const planHeaderLabel = getActivePlanHeaderLabel({
    t,
    activePlanNode,
    planName,
    planRateCards,
    planCreditGrants,
    planSubscriptionFees,
    getPlanLabel,
    getPlanRateCardLabel,
    getPlanRateLabel,
    getPlanCreditGrantLabel,
    getPlanSubscriptionFeeLabel,
  })

  const planParentInfo = getActivePlanParentInfo({
    t,
    activePlanNode,
    planName,
    planRateCards,
    getPlanLabel,
    getPlanRateCardLabel,
    getPlanRateLabel,
  })

  const flattenedTreeNodes = getFlattenedTreeNodes({ planRateCards, planCreditGrants, planSubscriptionFees })
  const activeNodeIndex = flattenedTreeNodes.findIndex(
    (n) => n.type === activePlanNode.type && n.id === activePlanNode.id
  )
  const prevTreeNode = activeNodeIndex > 0 ? flattenedTreeNodes[activeNodeIndex - 1] : null
  const nextTreeNode = activeNodeIndex < flattenedTreeNodes.length - 1 ? flattenedTreeNodes[activeNodeIndex + 1] : null

  const planDeleteLabel = getActivePlanDeleteLabel(t, activePlanNode)

  // Generate forms for additional selected nodes (multi-select)
  const additionalPlanForms = useMemo(() => {
    if (additionalSelectedNodes.length === 0) return []

    // Debug: log selected nodes for multi-select troubleshooting
    console.log('[additionalPlanForms] Building forms for nodes:', additionalSelectedNodes.map(n => `${n.type}:${n.id}`).join(', '))

    return additionalSelectedNodes.map((node, mapIndex) => {

      // Check if this node is from a different plan
      const isFromDifferentPlan = node.planId !== undefined && node.planId !== editingPricingPlanId

      // Get source plan data - either from a different plan or the current one
      let sourceRateCards = planRateCards
      let sourceCreditGrants = planCreditGrants
      let sourceSubscriptionFees = planSubscriptionFees
      let sourcePlanName = planName

      // Data fields to potentially override for cross-plan nodes
      let sourceRatePriceTypes = ratePriceTypes
      let sourceRateSellAs = rateSellAs
      let sourcePlanRateUnitPrices = planRateUnitPrices
      let sourcePlanRateTiers = planRateTiers
      let sourcePlanRateTierToValues = planRateTierToValues
      let sourcePlanRateTierUnitPrices = planRateTierUnitPrices
      let sourcePlanRateTierFlatFees = planRateTierFlatFees
      let sourcePlanRateIncludeTax = planRateIncludeTax
      let sourcePlanRateCurrencies = planRateCurrencies
      let sourcePlanRateActiveCurrencyId = planRateActiveCurrencyId
      let sourceRateMeters = rateMeters
      let sourceRateUnitLabels = rateUnitLabels
      let sourceRateTaxCodes = rateTaxCodes
      let sourceRateItemLookupKeys = rateItemLookupKeys
      let sourceRateItemMetadataRows = rateItemMetadataRows
      let sourceRateItemMetadataValues = rateItemMetadataValues
      let sourceRateSettingsMetadataRows = rateSettingsMetadataRows
      let sourceRateSettingsMetadataValues = rateSettingsMetadataValues
      let sourceRateCardServicingPeriods = rateCardServicingPeriods
      let sourceRateCardLookupKeys = rateCardLookupKeys
      let sourceRateCardMetadataRows = rateCardMetadataRows
      let sourceRateCardMetadataValues = rateCardMetadataValues
      let sourceCreditGrantAmounts = creditGrantAmounts
      let sourceCreditGrantPeriods = creditGrantPeriods
      let sourceCreditGrantApplications = creditGrantApplications
      let sourceCreditGrantLookupKeys = creditGrantLookupKeys
      let sourceSubscriptionFeeAmounts = subscriptionFeeAmounts
      let sourceSubscriptionFeePeriods = subscriptionFeePeriods
      let sourceSubscriptionFeePriceTypes = subscriptionFeePriceTypes
      let sourceSubscriptionFeeSellAs = subscriptionFeeSellAs
      let sourceSubscriptionFeeUnitLabels = subscriptionFeeUnitLabels
      let sourceSubscriptionFeeTaxCodes = subscriptionFeeTaxCodes
      let sourceSubscriptionFeeItemLookupKeys = subscriptionFeeItemLookupKeys
      let sourceSubscriptionFeeFeeLookupKeys = subscriptionFeeFeeLookupKeys
      let sourceSubscriptionFeeItemMetadataRows = subscriptionFeeItemMetadataRows
      let sourceSubscriptionFeeItemMetadataValues = subscriptionFeeItemMetadataValues
      let sourceSubscriptionFeeFeeMetadataRows = subscriptionFeeFeeMetadataRows
      let sourceSubscriptionFeeFeeMetadataValues = subscriptionFeeFeeMetadataValues

      if (isFromDifferentPlan) {
        // Look up the source plan's data
        const sourcePlan = pricingPlans.find((p) => p.id === node.planId)
        const sourceDraft = sourcePlan?.draft

        if (sourceDraft) {
          sourceRateCards = sourceDraft.planRateCards ?? []
          sourceCreditGrants = sourceDraft.planCreditGrants ?? []
          sourceSubscriptionFees = sourceDraft.planSubscriptionFees ?? []
          sourcePlanName = sourceDraft.planName ?? sourcePlan?.name ?? ""

          // Rate data
          sourceRatePriceTypes = sourceDraft.ratePriceTypes ?? {}
          sourceRateSellAs = sourceDraft.rateSellAs ?? {}
          sourcePlanRateUnitPrices = sourceDraft.planRateUnitPrices ?? {}
          sourcePlanRateTiers = sourceDraft.planRateTiers ?? {}
          sourcePlanRateTierToValues = sourceDraft.planRateTierToValues ?? {}
          sourcePlanRateTierUnitPrices = sourceDraft.planRateTierUnitPrices ?? {}
          sourcePlanRateTierFlatFees = sourceDraft.planRateTierFlatFees ?? {}
          sourcePlanRateIncludeTax = sourceDraft.planRateIncludeTax ?? {}
          sourcePlanRateCurrencies = sourceDraft.planRateCurrencies ?? {}
          sourcePlanRateActiveCurrencyId = sourceDraft.planRateActiveCurrencyId ?? {}
          sourceRateMeters = sourceDraft.rateMeters ?? {}
          sourceRateUnitLabels = sourceDraft.rateUnitLabels ?? {}
          sourceRateTaxCodes = sourceDraft.rateTaxCodes ?? {}
          sourceRateItemLookupKeys = sourceDraft.rateItemLookupKeys ?? {}
          sourceRateItemMetadataRows = sourceDraft.rateItemMetadataRows ?? {}
          sourceRateItemMetadataValues = sourceDraft.rateItemMetadataValues ?? {}
          sourceRateSettingsMetadataRows = sourceDraft.rateSettingsMetadataRows ?? {}
          sourceRateSettingsMetadataValues = sourceDraft.rateSettingsMetadataValues ?? {}

          // Rate card data
          sourceRateCardServicingPeriods = sourceDraft.rateCardServicingPeriods ?? {}
          sourceRateCardLookupKeys = sourceDraft.rateCardLookupKeys ?? {}
          sourceRateCardMetadataRows = sourceDraft.rateCardMetadataRows ?? {}
          sourceRateCardMetadataValues = sourceDraft.rateCardMetadataValues ?? {}

          // Credit grant data
          sourceCreditGrantAmounts = sourceDraft.creditGrantAmounts ?? {}
          sourceCreditGrantPeriods = sourceDraft.creditGrantPeriods ?? {}
          sourceCreditGrantApplications = sourceDraft.creditGrantApplications ?? {}
          sourceCreditGrantLookupKeys = sourceDraft.creditGrantLookupKeys ?? {}

          // Subscription fee data
          sourceSubscriptionFeeAmounts = sourceDraft.subscriptionFeeAmounts ?? {}
          sourceSubscriptionFeePeriods = sourceDraft.subscriptionFeePeriods ?? {}
          sourceSubscriptionFeePriceTypes = sourceDraft.subscriptionFeePriceTypes ?? {}
          sourceSubscriptionFeeSellAs = sourceDraft.subscriptionFeeSellAs ?? {}
          sourceSubscriptionFeeUnitLabels = sourceDraft.subscriptionFeeUnitLabels ?? {}
          sourceSubscriptionFeeTaxCodes = sourceDraft.subscriptionFeeTaxCodes ?? {}
          sourceSubscriptionFeeItemLookupKeys = sourceDraft.subscriptionFeeItemLookupKeys ?? {}
          sourceSubscriptionFeeFeeLookupKeys = sourceDraft.subscriptionFeeFeeLookupKeys ?? {}
          sourceSubscriptionFeeItemMetadataRows = sourceDraft.subscriptionFeeItemMetadataRows ?? {}
          sourceSubscriptionFeeItemMetadataValues = sourceDraft.subscriptionFeeItemMetadataValues ?? {}
          sourceSubscriptionFeeFeeMetadataRows = sourceDraft.subscriptionFeeFeeMetadataRows ?? {}
          sourceSubscriptionFeeFeeMetadataValues = sourceDraft.subscriptionFeeFeeMetadataValues ?? {}
        }
      }

      // Create a modified context with this node as the active one
      // For rate/rateMeter nodes, also find and set the correct rate card
      let nodeRateCardId = planFormCtx.activePlanRateCardId
      let nodeRateCard = planFormCtx.activePlanRateCard

      if ((node.type === "rate" || node.type === "rateMeter") && node.id != null) {
        // Find the rate card that contains this rate (using source plan's rate cards)
        const rateCardForNode = sourceRateCards.find((card) =>
          card.rates.some((rate) => rate.id === node.id)
        )
        if (rateCardForNode) {
          nodeRateCardId = rateCardForNode.id
          nodeRateCard = rateCardForNode
        }
      } else if (node.type === "rateCard" && node.id != null) {
        // For rate card nodes, use the rate card's own ID (using source plan's rate cards)
        const rateCardNode = sourceRateCards.find((card) => card.id === node.id)
        if (rateCardNode) {
          nodeRateCardId = rateCardNode.id
          nodeRateCard = rateCardNode
        }
      }

      // Create cross-plan setter wrappers when editing a node from a different plan
      // These setters update the target plan's draft in pricingPlans instead of the current state
      const targetPlanId = node.planId

      // Helper to create a setter that updates a specific field in the target plan's draft
      const createCrossPlanSetter = <T,>(
        draftField: keyof PricingPlanDraft,
        originalSetter: Dispatch<SetStateAction<T>>
      ): Dispatch<SetStateAction<T>> => {
        if (!isFromDifferentPlan || targetPlanId === undefined) {
          return originalSetter
        }
        return (updater) => {
          setPricingPlans((prevPlans) =>
            prevPlans.map((plan) => {
              if (plan.id !== targetPlanId) return plan
              const currentDraft = plan.draft ?? {} as PricingPlanDraft
              const currentValue = currentDraft[draftField] as T
              const newValue = typeof updater === "function"
                ? (updater as (prev: T) => T)(currentValue)
                : updater
              return {
                ...plan,
                draft: {
                  ...currentDraft,
                  [draftField]: newValue,
                },
              }
            })
          )
        }
      }

      // Helper to update rate cards (for updateRateName, updateRateCardName)
      const createCrossPlanRateCardsUpdater = (
        originalFn: (id: number, value: string) => void,
        updateFn: (rateCards: PlanRateCard[], id: number, value: string) => PlanRateCard[]
      ) => {
        if (!isFromDifferentPlan || targetPlanId === undefined) {
          return originalFn
        }
        return (id: number, value: string) => {
          setPricingPlans((prevPlans) =>
            prevPlans.map((plan) => {
              if (plan.id !== targetPlanId) return plan
              const currentDraft = plan.draft ?? {} as PricingPlanDraft
              const currentRateCards = currentDraft.planRateCards ?? []
              return {
                ...plan,
                draft: {
                  ...currentDraft,
                  planRateCards: updateFn(currentRateCards, id, value),
                },
              }
            })
          )
        }
      }

      // Helper to update named items (credit grants, subscription fees)
      const createCrossPlanNamedItemsUpdater = (
        draftField: "planCreditGrants" | "planSubscriptionFees",
        originalFn: (id: number, value: string) => void
      ) => {
        if (!isFromDifferentPlan || targetPlanId === undefined) {
          return originalFn
        }
        return (id: number, value: string) => {
          setPricingPlans((prevPlans) =>
            prevPlans.map((plan) => {
              if (plan.id !== targetPlanId) return plan
              const currentDraft = plan.draft ?? {} as PricingPlanDraft
              const items = (currentDraft[draftField] as PlanNamedItem[]) ?? []
              return {
                ...plan,
                draft: {
                  ...currentDraft,
                  [draftField]: items.map((item) =>
                    item.id === id ? { ...item, name: value } : item
                  ),
                },
              }
            })
          )
        }
      }

      // Create wrapped setters for cross-plan editing
      const crossPlanSetRatePriceTypes = createCrossPlanSetter<Record<number, string>>("ratePriceTypes", setRatePriceTypes)
      const crossPlanSetRateSellAs = createCrossPlanSetter<Record<number, string>>("rateSellAs", setRateSellAs)
      const crossPlanSetPlanRateUnitPrices = createCrossPlanSetter<Record<number, string>>("planRateUnitPrices", setPlanRateUnitPrices)
      const crossPlanSetPlanRateTiers = createCrossPlanSetter<Record<number, number[]>>("planRateTiers", setPlanRateTiers)
      const crossPlanSetPlanRateTierToValues = createCrossPlanSetter<Record<number, Record<number, string>>>("planRateTierToValues", setPlanRateTierToValues)
      const crossPlanSetPlanRateTierUnitPrices = createCrossPlanSetter<Record<number, Record<number, string>>>("planRateTierUnitPrices", setPlanRateTierUnitPrices)
      const crossPlanSetPlanRateTierFlatFees = createCrossPlanSetter<Record<number, Record<number, string>>>("planRateTierFlatFees", setPlanRateTierFlatFees)
      const crossPlanSetPlanRateIncludeTax = createCrossPlanSetter<Record<number, string>>("planRateIncludeTax", setPlanRateIncludeTax)
      const crossPlanSetPlanRateCurrencies = createCrossPlanSetter<Record<number, { id: number; code: string }[]>>("planRateCurrencies", setPlanRateCurrencies)
      const crossPlanSetPlanRateActiveCurrencyId = createCrossPlanSetter<Record<number, number>>("planRateActiveCurrencyId", setPlanRateActiveCurrencyId)
      const crossPlanSetRateMeters = createCrossPlanSetter<Record<number, string>>("rateMeters", setRateMeters)
      const crossPlanSetRateUnitLabels = createCrossPlanSetter<Record<number, string>>("rateUnitLabels", setRateUnitLabels)
      const crossPlanSetRateTaxCodes = createCrossPlanSetter<Record<number, string>>("rateTaxCodes", setRateTaxCodes)
      const crossPlanSetRateItemLookupKeys = createCrossPlanSetter<Record<number, string>>("rateItemLookupKeys", setRateItemLookupKeys)
      const crossPlanSetRateItemMetadataRows = createCrossPlanSetter<Record<number, number[]>>("rateItemMetadataRows", setRateItemMetadataRows)
      const crossPlanSetRateItemMetadataValues = createCrossPlanSetter<Record<number, Record<number, { key: string; value: string }>>>("rateItemMetadataValues", setRateItemMetadataValues)
      const crossPlanSetRateSettingsMetadataRows = createCrossPlanSetter<Record<number, number[]>>("rateSettingsMetadataRows", setRateSettingsMetadataRows)
      const crossPlanSetRateSettingsMetadataValues = createCrossPlanSetter<Record<number, Record<number, { key: string; value: string }>>>("rateSettingsMetadataValues", setRateSettingsMetadataValues)
      const crossPlanSetRateCardServicingPeriods = createCrossPlanSetter<Record<number, string>>("rateCardServicingPeriods", setRateCardServicingPeriods)
      const crossPlanSetRateCardLookupKeys = createCrossPlanSetter<Record<number, string>>("rateCardLookupKeys", setRateCardLookupKeys)
      const crossPlanSetRateCardMetadataRows = createCrossPlanSetter<Record<number, number[]>>("rateCardMetadataRows", setRateCardMetadataRows)
      const crossPlanSetRateCardMetadataValues = createCrossPlanSetter<Record<number, Record<number, { key: string; value: string }>>>("rateCardMetadataValues", setRateCardMetadataValues)
      const crossPlanSetCreditGrantAmounts = createCrossPlanSetter<Record<number, string>>("creditGrantAmounts", setCreditGrantAmounts)
      const crossPlanSetCreditGrantPeriods = createCrossPlanSetter<Record<number, string>>("creditGrantPeriods", setCreditGrantPeriods)
      const crossPlanSetCreditGrantApplications = createCrossPlanSetter<Record<number, string>>("creditGrantApplications", setCreditGrantApplications)
      const crossPlanSetCreditGrantLookupKeys = createCrossPlanSetter<Record<number, string>>("creditGrantLookupKeys", setCreditGrantLookupKeys)
      const crossPlanSetSubscriptionFeeAmounts = createCrossPlanSetter<Record<number, string>>("subscriptionFeeAmounts", setSubscriptionFeeAmounts)
      const crossPlanSetSubscriptionFeePeriods = createCrossPlanSetter<Record<number, string>>("subscriptionFeePeriods", setSubscriptionFeePeriods)
      const crossPlanSetSubscriptionFeePriceTypes = createCrossPlanSetter<Record<number, string>>("subscriptionFeePriceTypes", setSubscriptionFeePriceTypes)
      const crossPlanSetSubscriptionFeeSellAs = createCrossPlanSetter<Record<number, string>>("subscriptionFeeSellAs", setSubscriptionFeeSellAs)
      const crossPlanSetSubscriptionFeeUnitLabels = createCrossPlanSetter<Record<number, string>>("subscriptionFeeUnitLabels", setSubscriptionFeeUnitLabels)
      const crossPlanSetSubscriptionFeeTaxCodes = createCrossPlanSetter<Record<number, string>>("subscriptionFeeTaxCodes", setSubscriptionFeeTaxCodes)
      const crossPlanSetSubscriptionFeeItemLookupKeys = createCrossPlanSetter<Record<number, string>>("subscriptionFeeItemLookupKeys", setSubscriptionFeeItemLookupKeys)
      const crossPlanSetSubscriptionFeeFeeLookupKeys = createCrossPlanSetter<Record<number, string>>("subscriptionFeeFeeLookupKeys", setSubscriptionFeeFeeLookupKeys)
      const crossPlanSetSubscriptionFeeItemMetadataRows = createCrossPlanSetter<Record<number, number[]>>("subscriptionFeeItemMetadataRows", setSubscriptionFeeItemMetadataRows)
      const crossPlanSetSubscriptionFeeItemMetadataValues = createCrossPlanSetter<Record<number, Record<number, { key: string; value: string }>>>("subscriptionFeeItemMetadataValues", setSubscriptionFeeItemMetadataValues)
      const crossPlanSetSubscriptionFeeFeeMetadataRows = createCrossPlanSetter<Record<number, number[]>>("subscriptionFeeFeeMetadataRows", setSubscriptionFeeFeeMetadataRows)
      const crossPlanSetSubscriptionFeeFeeMetadataValues = createCrossPlanSetter<Record<number, Record<number, { key: string; value: string }>>>("subscriptionFeeFeeMetadataValues", setSubscriptionFeeFeeMetadataValues)

      // Create wrapped update functions for name changes
      const crossPlanUpdateRateName = createCrossPlanRateCardsUpdater(
        updateRateName,
        (rateCards, rateId, value) =>
          rateCards.map((card) => ({
            ...card,
            rates: card.rates.map((rate) =>
              rate.id === rateId ? { ...rate, name: value } : rate
            ),
          }))
      )
      const crossPlanUpdateRateCardName = createCrossPlanRateCardsUpdater(
        updateRateCardName,
        (rateCards, cardId, value) =>
          rateCards.map((card) =>
            card.id === cardId ? { ...card, name: value } : card
          )
      )
      const crossPlanUpdateCreditGrantName = createCrossPlanNamedItemsUpdater("planCreditGrants", updateCreditGrantName)
      const crossPlanUpdateSubscriptionFeeName = createCrossPlanNamedItemsUpdater("planSubscriptionFees", updateSubscriptionFeeName)

      // Create a fresh copy of the node to ensure no reference issues
      const nodeForContext: PlanNode = { type: node.type, id: node.id, planId: node.planId }

      const modifiedCtx: PlanFormContext = {
        ...planFormCtx,
        activePlanNode: nodeForContext,
        activePlanRateCardId: nodeRateCardId,
        activePlanRateCard: nodeRateCard,
        // Override with source plan's data for cross-plan nodes
        planRateCards: sourceRateCards,
        planCreditGrants: sourceCreditGrants,
        planSubscriptionFees: sourceSubscriptionFees,
        ratePriceTypes: sourceRatePriceTypes,
        rateSellAs: sourceRateSellAs,
        planRateUnitPrices: sourcePlanRateUnitPrices,
        planRateTiers: sourcePlanRateTiers,
        planRateTierToValues: sourcePlanRateTierToValues,
        planRateTierUnitPrices: sourcePlanRateTierUnitPrices,
        planRateTierFlatFees: sourcePlanRateTierFlatFees,
        planRateIncludeTax: sourcePlanRateIncludeTax,
        planRateCurrencies: sourcePlanRateCurrencies,
        planRateActiveCurrencyId: sourcePlanRateActiveCurrencyId,
        rateMeters: sourceRateMeters,
        rateUnitLabels: sourceRateUnitLabels,
        rateTaxCodes: sourceRateTaxCodes,
        rateItemLookupKeys: sourceRateItemLookupKeys,
        rateItemMetadataRows: sourceRateItemMetadataRows,
        rateItemMetadataValues: sourceRateItemMetadataValues,
        rateSettingsMetadataRows: sourceRateSettingsMetadataRows,
        rateSettingsMetadataValues: sourceRateSettingsMetadataValues,
        rateCardServicingPeriods: sourceRateCardServicingPeriods,
        rateCardLookupKeys: sourceRateCardLookupKeys,
        rateCardMetadataRows: sourceRateCardMetadataRows,
        rateCardMetadataValues: sourceRateCardMetadataValues,
        creditGrantAmounts: sourceCreditGrantAmounts,
        creditGrantPeriods: sourceCreditGrantPeriods,
        creditGrantApplications: sourceCreditGrantApplications,
        creditGrantLookupKeys: sourceCreditGrantLookupKeys,
        subscriptionFeeAmounts: sourceSubscriptionFeeAmounts,
        subscriptionFeePeriods: sourceSubscriptionFeePeriods,
        subscriptionFeePriceTypes: sourceSubscriptionFeePriceTypes,
        subscriptionFeeSellAs: sourceSubscriptionFeeSellAs,
        subscriptionFeeUnitLabels: sourceSubscriptionFeeUnitLabels,
        subscriptionFeeTaxCodes: sourceSubscriptionFeeTaxCodes,
        subscriptionFeeItemLookupKeys: sourceSubscriptionFeeItemLookupKeys,
        subscriptionFeeFeeLookupKeys: sourceSubscriptionFeeFeeLookupKeys,
        subscriptionFeeItemMetadataRows: sourceSubscriptionFeeItemMetadataRows,
        subscriptionFeeItemMetadataValues: sourceSubscriptionFeeItemMetadataValues,
        subscriptionFeeFeeMetadataRows: sourceSubscriptionFeeFeeMetadataRows,
        subscriptionFeeFeeMetadataValues: sourceSubscriptionFeeFeeMetadataValues,
        // Override setters with cross-plan versions that update the correct plan
        setRatePriceTypes: crossPlanSetRatePriceTypes,
        setRateSellAs: crossPlanSetRateSellAs,
        setPlanRateUnitPrices: crossPlanSetPlanRateUnitPrices,
        setPlanRateTiers: crossPlanSetPlanRateTiers,
        setPlanRateTierToValues: crossPlanSetPlanRateTierToValues,
        setPlanRateTierUnitPrices: crossPlanSetPlanRateTierUnitPrices,
        setPlanRateTierFlatFees: crossPlanSetPlanRateTierFlatFees,
        setPlanRateIncludeTax: crossPlanSetPlanRateIncludeTax,
        setPlanRateCurrencies: crossPlanSetPlanRateCurrencies,
        setPlanRateActiveCurrencyId: crossPlanSetPlanRateActiveCurrencyId,
        setRateMeters: crossPlanSetRateMeters,
        setRateUnitLabels: crossPlanSetRateUnitLabels,
        setRateTaxCodes: crossPlanSetRateTaxCodes,
        setRateItemLookupKeys: crossPlanSetRateItemLookupKeys,
        setRateItemMetadataRows: crossPlanSetRateItemMetadataRows,
        setRateItemMetadataValues: crossPlanSetRateItemMetadataValues,
        setRateSettingsMetadataRows: crossPlanSetRateSettingsMetadataRows,
        setRateSettingsMetadataValues: crossPlanSetRateSettingsMetadataValues,
        setRateCardServicingPeriods: crossPlanSetRateCardServicingPeriods,
        setRateCardLookupKeys: crossPlanSetRateCardLookupKeys,
        setRateCardMetadataRows: crossPlanSetRateCardMetadataRows,
        setRateCardMetadataValues: crossPlanSetRateCardMetadataValues,
        setCreditGrantAmounts: crossPlanSetCreditGrantAmounts,
        setCreditGrantPeriods: crossPlanSetCreditGrantPeriods,
        setCreditGrantApplications: crossPlanSetCreditGrantApplications,
        setCreditGrantLookupKeys: crossPlanSetCreditGrantLookupKeys,
        setSubscriptionFeeAmounts: crossPlanSetSubscriptionFeeAmounts,
        setSubscriptionFeePeriods: crossPlanSetSubscriptionFeePeriods,
        setSubscriptionFeePriceTypes: crossPlanSetSubscriptionFeePriceTypes,
        setSubscriptionFeeSellAs: crossPlanSetSubscriptionFeeSellAs,
        setSubscriptionFeeUnitLabels: crossPlanSetSubscriptionFeeUnitLabels,
        setSubscriptionFeeTaxCodes: crossPlanSetSubscriptionFeeTaxCodes,
        setSubscriptionFeeItemLookupKeys: crossPlanSetSubscriptionFeeItemLookupKeys,
        setSubscriptionFeeFeeLookupKeys: crossPlanSetSubscriptionFeeFeeLookupKeys,
        setSubscriptionFeeItemMetadataRows: crossPlanSetSubscriptionFeeItemMetadataRows,
        setSubscriptionFeeItemMetadataValues: crossPlanSetSubscriptionFeeItemMetadataValues,
        setSubscriptionFeeFeeMetadataRows: crossPlanSetSubscriptionFeeFeeMetadataRows,
        setSubscriptionFeeFeeMetadataValues: crossPlanSetSubscriptionFeeFeeMetadataValues,
        // Override update functions for name changes
        updateRateName: crossPlanUpdateRateName,
        updateRateCardName: crossPlanUpdateRateCardName,
        updateCreditGrantName: crossPlanUpdateCreditGrantName,
        updateSubscriptionFeeName: crossPlanUpdateSubscriptionFeeName,
      }

      // Debug: verify the form context has correct node
      console.log(`[additionalPlanForms] Form ${mapIndex} context: ${nodeForContext.type}:${nodeForContext.id}`)

      // Generate header label for this node (using source plan's data)
      const headerLabel = getActivePlanHeaderLabel({
        t,
        activePlanNode: node,
        planName: sourcePlanName,
        planRateCards: sourceRateCards,
        planCreditGrants: sourceCreditGrants,
        planSubscriptionFees: sourceSubscriptionFees,
        getPlanLabel,
        getPlanRateCardLabel,
        getPlanRateLabel,
        getPlanCreditGrantLabel,
        getPlanSubscriptionFeeLabel,
      })

      const deleteLabel = getActivePlanDeleteLabel(t, node)

      return {
        node,
        form: <PlanForm ctx={modifiedCtx} />,
        editorProps: {
          t,
          headerLabel,
          deleteLabel,
          nodeType: node.type,
          isActionsOpen: false,
          onToggleActions: () => {},
          onCloseActions: () => {},
          actionsButtonRef: { current: null },
          actionsMenuRef: { current: null },
          onDelete: () => {
            // Remove this node from additional selection and delete it
            setAdditionalSelectedNodes((prev) =>
              prev.filter((n) => !(n.type === node.type && n.id === node.id))
            )
            if (node.type === "rateCard" && node.id != null) {
              handleDeletePlanRateCard(node.id)
            } else if (node.type === "rate" && node.id != null) {
              handleDeletePlanRate(node.id)
            } else if (node.type === "creditGrant" && node.id != null) {
              handleDeletePlanCreditGrant(node.id)
            } else if (node.type === "subscriptionFee" && node.id != null) {
              handleDeletePlanSubscriptionFee(node.id)
            }
          },
          isLoading: false,
        },
      }
    })
  }, [
    additionalSelectedNodes,
    planFormCtx,
    pricingPlans,
    editingPricingPlanId,
    t,
    planName,
    planRateCards,
    planCreditGrants,
    planSubscriptionFees,
    ratePriceTypes,
    rateSellAs,
    planRateUnitPrices,
    planRateTiers,
    planRateTierToValues,
    planRateTierUnitPrices,
    planRateTierFlatFees,
    planRateIncludeTax,
    planRateCurrencies,
    planRateActiveCurrencyId,
    rateMeters,
    rateUnitLabels,
    rateTaxCodes,
    rateItemLookupKeys,
    rateItemMetadataRows,
    rateItemMetadataValues,
    rateSettingsMetadataRows,
    rateSettingsMetadataValues,
    rateCardServicingPeriods,
    rateCardLookupKeys,
    rateCardMetadataRows,
    rateCardMetadataValues,
    creditGrantAmounts,
    creditGrantPeriods,
    creditGrantApplications,
    creditGrantLookupKeys,
    subscriptionFeeAmounts,
    subscriptionFeePeriods,
    subscriptionFeePriceTypes,
    subscriptionFeeSellAs,
    subscriptionFeeUnitLabels,
    subscriptionFeeTaxCodes,
    subscriptionFeeItemLookupKeys,
    subscriptionFeeFeeLookupKeys,
    subscriptionFeeItemMetadataRows,
    subscriptionFeeItemMetadataValues,
    subscriptionFeeFeeMetadataRows,
    subscriptionFeeFeeMetadataValues,
    getPlanLabel,
    getPlanRateCardLabel,
    getPlanRateLabel,
    getPlanCreditGrantLabel,
    getPlanSubscriptionFeeLabel,
    handleDeletePlanRateCard,
    handleDeletePlanRate,
    handleDeletePlanCreditGrant,
    handleDeletePlanSubscriptionFee,
  ])

  const handleDeleteActivePlanNode = () => {
    if (activePlanNode.type === "rateCard") {
      handleDeletePlanRateCard(activePlanNode.id ?? activePlanRateCardId)
      return
    }
    if (activePlanNode.type === "rate") {
      if (activePlanNode.id != null) {
        handleDeletePlanRate(activePlanNode.id)
      }
      return
    }
    if (activePlanNode.type === "creditGrant") {
      if (activePlanNode.id != null) {
        handleDeletePlanCreditGrant(activePlanNode.id)
      }
      return
    }
    if (activePlanNode.type === "subscriptionFee") {
      if (activePlanNode.id != null) {
        handleDeletePlanSubscriptionFee(activePlanNode.id)
      }
      return
    }
    if (activePlanNode.type === "plan") {
      if (editingPricingPlanId != null) {
        const newPlans = pricingPlans.filter((p) => p.id !== editingPricingPlanId)
        setPricingPlans(newPlans)
        savePricingPlans(newPlans)
        setEditingPricingPlanId(null)
        setIsPricingPlanModalOpen(false)
        setIsPlanAssistantOpen(() => false)
      }
      resetPricingPlanFormToDefaults()
      return
    }
    setPlanName("")
    setPlanDescription("")
    setPlanLookupKey("")
  }

  /** Duplicate the active plan node (rate, subscription fee, or credit grant) */
  const handleDuplicateActivePlanNode = () => {
    duplicateNode(activePlanNode.type, activePlanNode.id)
  }

  // Context menu handlers for sidebar and map right-click menus
  const handleSidebarContextMenu = (info: {
    position: { top: number; left: number }
    nodeType: PlanNode["type"]
    nodeId?: number
    label: string
  }) => {
    console.log("[sidebarContextMenu] nodeType:", info.nodeType, "nodeId:", info.nodeId, "label:", info.label, "clipboard:", clipboardContent)
    setContextMenuPosition(info.position)
    setContextMenuNodeType(info.nodeType)
    setContextMenuNodeId(info.nodeId)
    setContextMenuLabel(info.label)
  }

  const handleMapNodeContextMenu = (info: {
    position: { top: number; left: number }
    nodeKey: string
    label: string
  }) => {
    // Parse the node key to determine type and id.
    // Keys may include a plan prefix like "plan123:rateCard:1", so strip any
    // leading "planNN:" prefix before matching the base segment.
    const raw = info.nodeKey
    const key = raw.replace(/^plan\d+:/, "")
    let nodeType: PlanNode["type"] = "plan"
    let nodeId: number | undefined

    if (key === "plan") {
      nodeType = "plan"
    } else if (key.startsWith("rateCard:")) {
      nodeType = "rateCard"
      nodeId = parseInt(key.replace("rateCard:", ""), 10)
    } else if (key.startsWith("rate:")) {
      nodeType = "rate"
      nodeId = parseInt(key.replace("rate:", ""), 10)
    } else if (key.startsWith("rateMeter:")) {
      nodeType = "rateMeter"
      nodeId = parseInt(key.replace("rateMeter:", ""), 10)
    } else if (key.startsWith("creditGrant:")) {
      nodeType = "creditGrant"
      nodeId = parseInt(key.replace("creditGrant:", ""), 10)
    } else if (key.startsWith("subscriptionFee:")) {
      nodeType = "subscriptionFee"
      nodeId = parseInt(key.replace("subscriptionFee:", ""), 10)
    }

    const pasteAvailable = clipboardContent != null && clipboardContent.type === nodeType
    console.log("[mapContextMenu] raw key:", raw, "→ stripped:", key, "→ nodeType:", nodeType, "nodeId:", nodeId, "pasteAvailable:", pasteAvailable, "clipboardType:", clipboardContent?.type ?? "none")
    setContextMenuPosition(info.position)
    setContextMenuNodeType(nodeType)
    setContextMenuNodeId(nodeId)
    setContextMenuLabel(info.label)
  }

  const handleContextMenuClose = () => {
    console.log("[contextMenuClose] clearing state. Was: nodeType=", contextMenuNodeType, "nodeId=", contextMenuNodeId, "clipboard=", clipboardContent)
    setContextMenuPosition(null)
    setContextMenuNodeType(null)
    setContextMenuNodeId(undefined)
    setContextMenuLabel("")
  }

  const handleContextMenuDelete = () => {
    if (!contextMenuNodeType) return

    // Navigate to the node first so the form shows the correct item
    setActivePlanNode({ type: contextMenuNodeType, id: contextMenuNodeId })

    // Now call the appropriate delete handler
    if (contextMenuNodeType === "rateCard" && contextMenuNodeId != null) {
      handleDeletePlanRateCard(contextMenuNodeId)
    } else if (contextMenuNodeType === "rate" && contextMenuNodeId != null) {
      handleDeletePlanRate(contextMenuNodeId)
    } else if (contextMenuNodeType === "creditGrant" && contextMenuNodeId != null) {
      handleDeletePlanCreditGrant(contextMenuNodeId)
    } else if (contextMenuNodeType === "subscriptionFee" && contextMenuNodeId != null) {
      handleDeletePlanSubscriptionFee(contextMenuNodeId)
    } else if (contextMenuNodeType === "plan") {
      if (editingPricingPlanId != null) {
        const newPlans = pricingPlans.filter((p) => p.id !== editingPricingPlanId)
        setPricingPlans(newPlans)
        savePricingPlans(newPlans)
        setEditingPricingPlanId(null)
        setIsPricingPlanModalOpen(false)
        setIsPlanAssistantOpen(() => false)
      }
      resetPricingPlanFormToDefaults()
    }
  }

  const handleContextMenuAskForChanges = () => {
    if (!contextMenuNodeType) return

    // Navigate to the node first
    setActivePlanNode({ type: contextMenuNodeType, id: contextMenuNodeId })

    // Open the assistant with the appropriate reference
    const kind: AssistantReference["kind"] = contextMenuNodeType === "plan"
      ? "plan"
      : contextMenuNodeType === "rateCard"
        ? "rateCard"
        : contextMenuNodeType === "rate"
          ? "rate"
          : contextMenuNodeType === "rateMeter"
            ? "rateMeter"
            : contextMenuNodeType === "creditGrant"
              ? "creditGrant"
              : "subscriptionFee"

    openPlanAssistantWithReference({ kind, label: contextMenuLabel })
  }

  const contextMenuDeleteLabel = (() => {
    if (!contextMenuNodeType) return t("Delete")
    const type = contextMenuNodeType
    if (type === "plan") return t("Delete pricing plan")
    if (type === "rateCard") return t("Delete rate card")
    if (type === "rate") return t("Delete rate")
    if (type === "rateMeter") return t("Delete meter")
    if (type === "creditGrant") return t("Delete credit grant")
    if (type === "subscriptionFee") return t("Delete subscription fee")
    return t("Delete")
  })()

  // Check if current context menu node type supports duplication
  const contextMenuSupportsDuplicate = contextMenuNodeType != null && contextMenuNodeType !== "plan"

  // Check if clipboard can be pasted to current node type
  const contextMenuCanPaste = clipboardContent != null && clipboardContent.type === contextMenuNodeType

  /** Generate a copy name: "Foo" → "Foo (copy)", "Foo (copy)" → "Foo (copy 2)", "Foo (copy 2)" → "Foo (copy 3)" */
  const makeCopyName = (name: string, existingNames: string[]): string => {
    // Strip existing copy suffix to get the base name
    const base = name.replace(/\s*\(copy(?:\s+\d+)?\)$/, "")
    // Find the highest existing copy number for this base
    let maxNum = 0
    for (const n of existingNames) {
      if (n === `${base} (copy)`) maxNum = Math.max(maxNum, 1)
      const m = n.match(new RegExp(`^${base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\(copy\\s+(\\d+)\\)$`))
      if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10))
    }
    return maxNum === 0 ? `${base} (copy)` : `${base} (copy ${maxNum + 1})`
  }

  // Core duplicate logic — parameterized by node type and ID
  const duplicateNode = (dupNodeType: PlanNode["type"] | null, dupNodeId: number | undefined | null) => {
    if (!dupNodeType || dupNodeType === "plan") return

    if (dupNodeType === "rateCard" && dupNodeId != null) {
      const card = planRateCards.find(c => c.id === dupNodeId)
      if (card) {
        const newCardId = Math.max(0, ...planRateCards.map(c => c.id)) + 1
        const newRates = (card.rates ?? []).map((rate, idx) => ({
          ...rate,
          id: newCardId * 1000 + idx,
          name: rate.name
        }))
        const newCard = {
          ...card,
          id: newCardId,
          name: makeCopyName(card.name || t("Untitled rate card"), planRateCards.map(c => c.name)),
          rates: newRates
        }
        setPlanRateCards(prev => [...prev, newCard])
        // Copy associated state for each rate
        const newPlanRateTiers = { ...planRateTiers }
        const newPlanRateTierToValues = { ...planRateTierToValues }
        const newPlanRateTierUnitPrices = { ...planRateTierUnitPrices }
        const newPlanRateTierFlatFees = { ...planRateTierFlatFees }
        const newRateMeters = { ...rateMeters }
        const newRatePriceTypes = { ...ratePriceTypes }
        const newRateSellAs = { ...rateSellAs }
        const newRateUnitLabels = { ...rateUnitLabels }
        const newPlanRateUnitPrices = { ...planRateUnitPrices }
        for (let i = 0; i < (card.rates ?? []).length; i++) {
          const oldRateId = card.rates[i].id
          const newRateId = newRates[i].id
          if (planRateTiers[oldRateId] != null) newPlanRateTiers[newRateId] = [...planRateTiers[oldRateId]]
          if (planRateTierToValues[oldRateId] != null) newPlanRateTierToValues[newRateId] = { ...planRateTierToValues[oldRateId] }
          if (planRateTierUnitPrices[oldRateId] != null) newPlanRateTierUnitPrices[newRateId] = { ...planRateTierUnitPrices[oldRateId] }
          if (planRateTierFlatFees[oldRateId] != null) newPlanRateTierFlatFees[newRateId] = { ...planRateTierFlatFees[oldRateId] }
          if (rateMeters[oldRateId] != null) newRateMeters[newRateId] = rateMeters[oldRateId]
          if (ratePriceTypes[oldRateId] != null) newRatePriceTypes[newRateId] = ratePriceTypes[oldRateId]
          if (rateSellAs[oldRateId] != null) newRateSellAs[newRateId] = rateSellAs[oldRateId]
          if (rateUnitLabels[oldRateId] != null) newRateUnitLabels[newRateId] = rateUnitLabels[oldRateId]
          if (planRateUnitPrices[oldRateId] != null) newPlanRateUnitPrices[newRateId] = planRateUnitPrices[oldRateId]
        }
        setPlanRateTiers(newPlanRateTiers)
        setPlanRateTierToValues(newPlanRateTierToValues)
        setPlanRateTierUnitPrices(newPlanRateTierUnitPrices)
        setPlanRateTierFlatFees(newPlanRateTierFlatFees)
        setRateMeters(newRateMeters)
        setRatePriceTypes(newRatePriceTypes)
        setRateSellAs(newRateSellAs)
        setRateUnitLabels(newRateUnitLabels)
        setPlanRateUnitPrices(newPlanRateUnitPrices)
      }
    } else if (dupNodeType === "rate" && dupNodeId != null) {
      // Find which rate card contains this rate
      for (const card of planRateCards) {
        const rateIdx = (card.rates ?? []).findIndex(r => r.id === dupNodeId)
        if (rateIdx >= 0) {
          const rate = card.rates[rateIdx]
          const newRateId = Math.max(0, ...getAllRates(planRateCards, planRates).map(r => r.id)) + 1
          const newRate = {
            ...rate,
            id: newRateId,
            name: makeCopyName(rate.name || t("Untitled rate"), getAllRates(planRateCards, planRates).map(r => r.name))
          }
          setPlanRateCards(prev => prev.map(c => c.id === card.id ? { ...c, rates: [...(c.rates ?? []), newRate] } : c))
          // Copy associated state
          if (planRateTiers[dupNodeId] != null) setPlanRateTiers(prev => ({ ...prev, [newRateId]: [...planRateTiers[dupNodeId!]] }))
          if (planRateTierToValues[dupNodeId] != null) setPlanRateTierToValues(prev => ({ ...prev, [newRateId]: { ...planRateTierToValues[dupNodeId!] } }))
          if (planRateTierUnitPrices[dupNodeId] != null) setPlanRateTierUnitPrices(prev => ({ ...prev, [newRateId]: { ...planRateTierUnitPrices[dupNodeId!] } }))
          if (planRateTierFlatFees[dupNodeId] != null) setPlanRateTierFlatFees(prev => ({ ...prev, [newRateId]: { ...planRateTierFlatFees[dupNodeId!] } }))
          if (rateMeters[dupNodeId] != null) setRateMeters(prev => ({ ...prev, [newRateId]: rateMeters[dupNodeId!] }))
          if (ratePriceTypes[dupNodeId] != null) setRatePriceTypes(prev => ({ ...prev, [newRateId]: ratePriceTypes[dupNodeId!] }))
          if (rateSellAs[dupNodeId] != null) setRateSellAs(prev => ({ ...prev, [newRateId]: rateSellAs[dupNodeId!] }))
          if (rateUnitLabels[dupNodeId] != null) setRateUnitLabels(prev => ({ ...prev, [newRateId]: rateUnitLabels[dupNodeId!] }))
          if (planRateUnitPrices[dupNodeId] != null) setPlanRateUnitPrices(prev => ({ ...prev, [newRateId]: planRateUnitPrices[dupNodeId!] }))
          break
        }
      }
    } else if (dupNodeType === "creditGrant" && dupNodeId != null) {
      const grant = planCreditGrants.find(g => g.id === dupNodeId)
      if (grant) {
        const newId = Math.max(0, ...planCreditGrants.map(g => g.id)) + 1
        const newGrant = {
          ...grant,
          id: newId,
          name: makeCopyName(grant.name || t("Untitled credit grant"), planCreditGrants.map(g => g.name))
        }
        setPlanCreditGrants(prev => [...prev, newGrant])
        // Copy associated state
        if (creditGrantAmounts[dupNodeId] != null) setCreditGrantAmounts(prev => ({ ...prev, [newId]: creditGrantAmounts[dupNodeId!] }))
        if (creditGrantPeriods[dupNodeId] != null) setCreditGrantPeriods(prev => ({ ...prev, [newId]: creditGrantPeriods[dupNodeId!] }))
        if (creditGrantApplications[dupNodeId] != null) setCreditGrantApplications(prev => ({ ...prev, [newId]: creditGrantApplications[dupNodeId!] }))
        if (creditGrantLookupKeys[dupNodeId] != null) setCreditGrantLookupKeys(prev => ({ ...prev, [newId]: creditGrantLookupKeys[dupNodeId!] }))
      }
    } else if (dupNodeType === "subscriptionFee" && dupNodeId != null) {
      const fee = planSubscriptionFees.find(f => f.id === dupNodeId)
      if (fee) {
        const newId = Math.max(0, ...planSubscriptionFees.map(f => f.id)) + 1
        const newFee = {
          ...fee,
          id: newId,
          name: makeCopyName(fee.name || t("Untitled subscription fee"), planSubscriptionFees.map(f => f.name))
        }
        setPlanSubscriptionFees(prev => [...prev, newFee])
        // Copy associated state
        if (subscriptionFeeAmounts[dupNodeId] != null) setSubscriptionFeeAmounts(prev => ({ ...prev, [newId]: subscriptionFeeAmounts[dupNodeId!] }))
        if (subscriptionFeePeriods[dupNodeId] != null) setSubscriptionFeePeriods(prev => ({ ...prev, [newId]: subscriptionFeePeriods[dupNodeId!] }))
        if (subscriptionFeePriceTypes[dupNodeId] != null) setSubscriptionFeePriceTypes(prev => ({ ...prev, [newId]: subscriptionFeePriceTypes[dupNodeId!] }))
        if (subscriptionFeeSellAs[dupNodeId] != null) setSubscriptionFeeSellAs(prev => ({ ...prev, [newId]: subscriptionFeeSellAs[dupNodeId!] }))
      }
    }
  }

  // Handle duplication from context menu (delegates to duplicateNode)
  const handleContextMenuDuplicate = () => {
    duplicateNode(contextMenuNodeType, contextMenuNodeId)
  }

  // Handle copy settings from context menu
  const handleContextMenuCopySettings = () => {
    console.log("[copySettings] contextMenuNodeType:", contextMenuNodeType, "contextMenuNodeId:", contextMenuNodeId)
    if (!contextMenuNodeType || contextMenuNodeType === "plan") {
      console.log("[copySettings] EARLY RETURN — nodeType is", contextMenuNodeType)
      return
    }

    if (contextMenuNodeType === "rateCard" && contextMenuNodeId != null) {
      const card = planRateCards.find(c => c.id === contextMenuNodeId)
      if (!card) {
        console.log("[copySettings] rateCard MISS — planRateCards.find() returned nothing. planRateCards ids:", planRateCards.map(c => c.id), "contextMenuNodeId:", contextMenuNodeId)
        return
      }
      const data = {
        name: card.name,
        lookupKey: rateCardLookupKeys[contextMenuNodeId] ?? "",
        servicingPeriod: rateCardServicingPeriods[contextMenuNodeId] ?? "",
      }
      console.log("[copySettings] rateCard OK — copied data:", data)
      setClipboardContent({ type: "rateCard", data })
    } else if (contextMenuNodeType === "rate" && contextMenuNodeId != null) {
      const copied = {
        type: "rate" as const,
        data: {
          priceType: ratePriceTypes[contextMenuNodeId] ?? "",
          sellAs: rateSellAs[contextMenuNodeId] ?? "",
          unitLabel: rateUnitLabels[contextMenuNodeId] ?? "",
          unitPrice: planRateUnitPrices[contextMenuNodeId] ?? "",
          tiers: planRateTiers[contextMenuNodeId] ?? [],
          tierToValues: planRateTierToValues[contextMenuNodeId] ?? {},
          tierUnitPrices: planRateTierUnitPrices[contextMenuNodeId] ?? {},
          tierFlatFees: planRateTierFlatFees[contextMenuNodeId] ?? {},
        }
      }
      console.log("[copySettings] rate OK — copied settings:", copied)
      setClipboardContent(copied)
    } else if (contextMenuNodeType === "creditGrant" && contextMenuNodeId != null) {
      const data = {
        amount: creditGrantAmounts[contextMenuNodeId] ?? "",
        period: creditGrantPeriods[contextMenuNodeId] ?? "",
        application: creditGrantApplications[contextMenuNodeId] ?? "",
        lookupKey: creditGrantLookupKeys[contextMenuNodeId] ?? "",
      }
      console.log("[copySettings] creditGrant OK — copied data:", data)
      setClipboardContent({ type: "creditGrant", data })
    } else if (contextMenuNodeType === "subscriptionFee" && contextMenuNodeId != null) {
      const data = {
        amount: subscriptionFeeAmounts[contextMenuNodeId] ?? "",
        period: subscriptionFeePeriods[contextMenuNodeId] ?? "",
        priceType: subscriptionFeePriceTypes[contextMenuNodeId] ?? "",
        sellAs: subscriptionFeeSellAs[contextMenuNodeId] ?? "",
      }
      console.log("[copySettings] subscriptionFee OK — copied data:", data)
      setClipboardContent({ type: "subscriptionFee", data })
    } else {
      console.log("[copySettings] NO BRANCH — nodeType:", contextMenuNodeType, "nodeId:", contextMenuNodeId, "(rateMeter not implemented)")
    }
  }

  // Handle paste settings from context menu
  const handleContextMenuPasteSettings = () => {
    console.log("[pasteSettings] clipboardContent:", clipboardContent, "contextMenuNodeType:", contextMenuNodeType, "contextMenuNodeId:", contextMenuNodeId)
    if (!clipboardContent || !contextMenuNodeType || clipboardContent.type !== contextMenuNodeType) {
      console.log("[pasteSettings] EARLY RETURN — clipboard type:", clipboardContent?.type, "menu type:", contextMenuNodeType)
      return
    }

    if (contextMenuNodeType === "rateCard" && contextMenuNodeId != null) {
      const data = clipboardContent.data as { lookupKey?: string; servicingPeriod?: string }
      console.log("[pasteSettings] rateCard — applying to nodeId:", contextMenuNodeId, "data:", data)
      if (data.lookupKey != null) setRateCardLookupKeys(prev => ({ ...prev, [contextMenuNodeId]: data.lookupKey as string }))
      if (data.servicingPeriod != null) setRateCardServicingPeriods(prev => ({ ...prev, [contextMenuNodeId]: data.servicingPeriod as string }))
      console.log("[pasteSettings] rateCard DONE — applied lookupKey, servicingPeriod to", contextMenuNodeId)
    } else if (contextMenuNodeType === "rate" && contextMenuNodeId != null) {
      const data = clipboardContent.data as {
        priceType?: string
        sellAs?: string
        unitLabel?: string
        unitPrice?: string
        tiers?: number[]
        tierToValues?: Record<number, string>
        tierUnitPrices?: Record<number, string>
        tierFlatFees?: Record<number, string>
      }
      console.log("[pasteSettings] rate — applying to nodeId:", contextMenuNodeId, "data keys:", Object.keys(data))
      if (data.priceType != null) setRatePriceTypes(prev => ({ ...prev, [contextMenuNodeId]: data.priceType as string }))
      if (data.sellAs != null) setRateSellAs(prev => ({ ...prev, [contextMenuNodeId]: data.sellAs as string }))
      if (data.unitLabel != null) setRateUnitLabels(prev => ({ ...prev, [contextMenuNodeId]: data.unitLabel as string }))
      if (data.unitPrice != null) setPlanRateUnitPrices(prev => ({ ...prev, [contextMenuNodeId]: data.unitPrice as string }))
      if (data.tiers != null) setPlanRateTiers(prev => ({ ...prev, [contextMenuNodeId]: data.tiers as number[] }))
      if (data.tierToValues != null) setPlanRateTierToValues(prev => ({ ...prev, [contextMenuNodeId]: data.tierToValues as Record<number, string> }))
      if (data.tierUnitPrices != null) setPlanRateTierUnitPrices(prev => ({ ...prev, [contextMenuNodeId]: data.tierUnitPrices as Record<number, string> }))
      if (data.tierFlatFees != null) setPlanRateTierFlatFees(prev => ({ ...prev, [contextMenuNodeId]: data.tierFlatFees as Record<number, string> }))
      console.log("[pasteSettings] rate DONE — applied to", contextMenuNodeId)
    } else if (contextMenuNodeType === "creditGrant" && contextMenuNodeId != null) {
      const data = clipboardContent.data as { amount?: string; period?: string; application?: string; lookupKey?: string }
      console.log("[pasteSettings] creditGrant — applying to nodeId:", contextMenuNodeId, "data:", data)
      if (data.amount != null) setCreditGrantAmounts(prev => ({ ...prev, [contextMenuNodeId]: data.amount as string }))
      if (data.period != null) setCreditGrantPeriods(prev => ({ ...prev, [contextMenuNodeId]: data.period as string }))
      if (data.application != null) setCreditGrantApplications(prev => ({ ...prev, [contextMenuNodeId]: data.application as string }))
      if (data.lookupKey != null) setCreditGrantLookupKeys(prev => ({ ...prev, [contextMenuNodeId]: data.lookupKey as string }))
      console.log("[pasteSettings] creditGrant DONE — applied to", contextMenuNodeId)
    } else if (contextMenuNodeType === "subscriptionFee" && contextMenuNodeId != null) {
      const data = clipboardContent.data as { amount?: string; period?: string; priceType?: string; sellAs?: string }
      console.log("[pasteSettings] subscriptionFee — applying to nodeId:", contextMenuNodeId, "data:", data)
      if (data.amount != null) setSubscriptionFeeAmounts(prev => ({ ...prev, [contextMenuNodeId]: data.amount as string }))
      if (data.period != null) setSubscriptionFeePeriods(prev => ({ ...prev, [contextMenuNodeId]: data.period as string }))
      if (data.priceType != null) setSubscriptionFeePriceTypes(prev => ({ ...prev, [contextMenuNodeId]: data.priceType as string }))
      if (data.sellAs != null) setSubscriptionFeeSellAs(prev => ({ ...prev, [contextMenuNodeId]: data.sellAs as string }))
      console.log("[pasteSettings] subscriptionFee DONE — applied to", contextMenuNodeId)
    }
  }

  const selectedProductNodeKey = (() => {
    if (activeObjectForm === "product") return "product"
    if (activeObjectForm === "meter") return "meter"
    if (activeObjectForm === "price") return activeTreePriceId != null ? `price:${activeTreePriceId}` : "prices"
    return null
  })()

  // Helper to convert a PlanNode to its object map key
  const planNodeToKey = useCallback((node: PlanNode): string | null => {
    const planId = node.planId ?? editingPricingPlanId
    const prefix = planId ? `plan${planId}:` : ""

    if (node.type === "plan") return `${prefix}plan`
    if (node.type === "rateCard") return `${prefix}rateCard:${node.id ?? activePlanRateCardId}`
    if (node.type === "rate") return node.id != null ? `${prefix}rate:${node.id}` : `${prefix}plan:rateCards`
    if (node.type === "creditGrant") return node.id != null ? `${prefix}creditGrant:${node.id}` : `${prefix}plan:credits`
    if (node.type === "subscriptionFee") return node.id != null ? `${prefix}subscriptionFee:${node.id}` : `${prefix}plan:fees`
    if (node.type === "rateMeter") return node.id != null ? `${prefix}rateMeter:${node.id}` : `${prefix}plan:meters`
    return null
  }, [editingPricingPlanId, activePlanRateCardId])

  // Only show selection styling on map/sidebar when user has explicitly clicked a node
  const selectedPlanNodeKey = hasUserSelectedNode ? planNodeToKey(activePlanNode) : null

  // Array of all selected node keys (for multi-select highlighting in object map)
  const selectedPlanNodeKeys = useMemo(() => {
    if (!hasUserSelectedNode) return []
    return selectedPlanNodes
      .map(node => planNodeToKey(node))
      .filter((key): key is string => key != null)
  }, [selectedPlanNodes, planNodeToKey, hasUserSelectedNode])

  const rateMeterNames = useMemo(() => {
    const seen = new Set<string>()
    const out: string[] = []
    for (const card of planRateCards) {
      for (const rate of card.rates ?? []) {
        const name = (rateMeters[rate.id] ?? "").trim()
        if (!name) continue
        if (seen.has(name)) continue
        seen.add(name)
        out.push(name)
      }
    }
    return out
  }, [planRateCards, rateMeters])

  useEffect(() => {
    if (!rateMeterNames.length) return
    setAvailablePlanMeterOptions((prev) => {
      const seen = new Set(prev.map((v) => v.trim()).filter(Boolean))
      let changed = false
      const next = [...prev]
      for (const name of rateMeterNames) {
        const value = name.trim()
        if (!value) continue
        if (seen.has(value)) continue
        seen.add(value)
        next.push(value)
        changed = true
      }
      return changed ? next : prev
    })
  }, [rateMeterNames])

  const openProductAssistantWithReference = (ref: AssistantReference) => {
    setIsAssistantOpen(() => true)
    setAssistantDraftReference(ref)
  }

  useEffect(() => {
    if (!isAssistantOpen) return

    setAssistantDraftReference((prev) => {
      if (!prev) return prev

      const nextKind: AssistantReference["kind"] =
        activeObjectForm === "product" ? "product" : activeObjectForm === "meter" ? "meter" : "price"

      // Only keep the label in sync for the currently-active form kind.
      // (Avoid stomping a reference created for a different object kind.)
      if (prev.kind !== nextKind) return prev

      const nextLabel =
        activeObjectForm === "product"
          ? (productName || t("Product name"))
          : activeObjectForm === "meter"
            ? (meter || t("Meter name"))
            : (() => {
                const name = (priceNamesById[activeTreePriceId ?? -1] ?? "").trim()
                if (name !== "") return name
                const primaryCurrency = pricingCurrencies[0]
                const rawAmount =
                  primaryCurrency != null ? (currencyAmounts[primaryCurrency.id] ?? "").trim() : ""
                const amountValue = parseNumberValue(rawAmount)
                return amountValue != null
                  ? formatCurrencyValue(amountValue, primaryCurrency?.code ?? "USD", 2)
                  : t("Price")
              })()

      if (prev.label === nextLabel) return prev
      return { ...prev, label: nextLabel }
    })
  }, [
    isAssistantOpen,
    activeObjectForm,
    productName,
    meter,
    activeTreePriceId,
    priceNamesById,
    pricingCurrencies,
    currencyAmounts,
    parseNumberValue,
    formatCurrencyValue,
    t,
  ])

  const openPlanAssistantWithReference = (ref: AssistantReference) => {
    setIsPlanAssistantOpen(() => true)
    setPlanAssistantDraftReference(ref)
  }

  const catalogItems = useMemo(() => {
    const defaultProductIds = new Set(VERCEL_PRODUCTS.map((p) => p.id))
    const defaultPlanIds = new Set(VERCEL_PLANS.map((p) => p.id))
    const userProducts = products.filter((p) => !defaultProductIds.has(p.id))
    const userPlans = pricingPlans.filter((p) => !defaultPlanIds.has(p.id))
    const allProducts = [...VERCEL_PRODUCTS, ...userProducts]
    const allPlans = [...VERCEL_PLANS, ...userPlans]
    const productItems = allProducts.map((p) => ({ kind: "product" as const, ...p }))
    const planItems = allPlans.map((p) => ({ kind: "plan" as const, ...p }))
    const sortedItems = [...productItems, ...planItems].sort((a, b) => b.id - a.id)
    const pinnedItems: ({ kind: "plan" } & typeof PHOTON_PRICING_PLAN)[] = []
    if (SHOW_PHOTON_PLAN) pinnedItems.push({ kind: "plan" as const, ...PHOTON_PRICING_PLAN })
    if (SHOW_EXAMPLE_PLAN) pinnedItems.push({ kind: "plan" as const, ...EXAMPLE_PRICING_PLAN })
    return [...pinnedItems, ...sortedItems]
  }, [pricingPlans, products])

  const handleCatalogItemClick = (item: ({ kind: "product" } & ProductRow) | ({ kind: "plan" } & PricingPlanRow)) => {
    const { kind, ...rest } = item as any
    if (kind === "product") {
      handleProductClick(rest as ProductRow)
      return
    }
    handlePricingPlanClick(rest as PricingPlanRow)
  }

  // While the inline "Get started" wizard is active, the modal header's primary
  // action becomes the wizard's submit (driving the wizard) instead of the
  // normal "Create pricing plan". Once the wizard completes (or is dismissed),
  // it reverts to the regular create/save action.
  const showWizardSubmitInHeader = isInlineGetStartedActive
  const pricingPlanCreateLabel = showWizardSubmitInHeader
    ? t("Get started")
    : editingPricingPlanId != null &&
        (pricingPlans.find((p) => p.id === editingPricingPlanId)?.status ?? "live") === "live"
      ? t("Save")
      : t("Create pricing plan")
  // - In wizard mode: disabled until the wizard's `canSubmit` is true (plan name).
  // - Otherwise: disabled until the plan has at least one rate card / credit
  //   grant / subscription fee (either added manually or via the wizard).
  const pricingPlanCreateDisabled = showWizardSubmitInHeader
    ? !isWizardSubmittable
    : isPlanStructurallyEmpty
  const pricingPlanOnCreate = () => {
    if (showWizardSubmitInHeader) {
      wizardSubmitRef.current?.submit()
      return
    }
    handleSubmitPricingPlan()
  }
  const pricingPlanOnDiscard = () => {
    if (editingPricingPlanId != null) {
      const editingPlan = pricingPlans.find((p) => p.id === editingPricingPlanId)
      if (editingPlan) {
        const draft = editingPlan.draft
        const hasNoName = !editingPlan.name || editingPlan.name === t("Untitled pricing plan") || editingPlan.name === "Pricing plan"
        const hasNoContent = !draft || (
          (!draft.planRateCards || draft.planRateCards.length === 0) &&
          (!draft.planCreditGrants || draft.planCreditGrants.length === 0) &&
          (!draft.planSubscriptionFees || draft.planSubscriptionFees.length === 0)
        )
        if (hasNoName && hasNoContent) {
          const newPlans = pricingPlans.filter((p) => p.id !== editingPricingPlanId)
          setPricingPlans(newPlans)
          savePricingPlans(newPlans)
        }
      }
    }
    setIsPricingPlanModalOpen(false)
    setEditingPricingPlanId(null)
    setIsPlanAssistantOpen(() => false)
    setIsCoachmarkTourActive(false)
    setCurrentCoachmarkStep(0)
    resetPricingPlanFormToDefaults()
  }
  return (
    <ProductCatalogLayout
      t={t}
      addProductButtonRef={addProductButtonRef}
      onToggleAddProductPopover={() => setIsAddProductPopoverOpen((prev) => !prev)}
      onAddPricingPlan={handleOpenPricingPlanModal}
      onOpenFlow={(flow) => setActiveBillingView(flow || null)}
      activeBillingView={activeBillingView}
      subscriptionsLabel="Subscriptions"
      billingViewContent={
        activeBillingView === "product-catalog" ? (
          <ProductCatalogView
            onCreatePricingPlan={handleOpenPricingPlanModal}
            pricingPlans={pricingPlans.map((p) => ({
              id: p.id,
              name: p.name,
              status: p.status,
              amount: p.amount,
              currency: p.currency,
              billingPeriod: p.billingPeriod,
            }))}
            onPlanClick={(planId) => {
              const plan = pricingPlans.find((p) => p.id === planId)
              if (plan) handlePricingPlanClick(plan)
            }}
            onProductClick={(product) => {
              const prices = product.prices?.map((sp) => ({
                chargeType: (sp.cadence === "One time" || sp.pricingModel === "One-off" ? "One-off" : "Recurring") as "Recurring" | "One-off",
                pricingModel: sp.priceType === "Graduated" ? "Graduated" : sp.priceType === "Volume" ? "Volume" : sp.pricingModel === "Flat rate" ? "Flat rate" : "Flat rate",
                amount: sp.price,
                currency: sp.currency,
                billingPeriod: sp.cadence === "One time" ? "Monthly" : sp.cadence,
                unitLabel: sp.unitLabel,
                meter: sp.meter,
              }))
              setNewProductFullScreenData({
                name: product.name,
                description: product.description,
                chargeType: product.cadence === "One time" ? "One-off" : "Recurring",
                amount: product.price?.replace(/[^0-9.]/g, "") ?? "",
                currency: product.currency,
                cadence: product.cadence === "One time" ? undefined : product.cadence,
                prices,
                productType: product.type === "Usage" ? "Usage-based" : (product.type === "Flat" ? "Flat" : "Flat"),
                meter: product.prices?.[0]?.meter,
              })
              setIsNewProductFullScreenOpen(true)
            }}
            onMorePricingOptions={(data) => {
              setNewProductFullScreenData({
                name: data.name,
                description: data.description,
                taxCode: data.taxCode,
                taxBehavior: data.taxBehavior,
                chargeType: data.chargeType,
                amount: data.price,
                currency: data.currency,
                cadence: data.cadence,
              })
              setIsNewProductFullScreenOpen(true)
            }}
          />
        ) : activeBillingView === "subscriptions" || activeBillingView === "agreements" ? (
          contractsView === "detail" && selectedContract ? (
            <ContractDetailV4 data={selectedContract} onBack={() => { setContractsView("list"); setSelectedContract(null) }} onEdit={() => setContractsView("create")} />
          ) : <>
            <BillingTabbedPage
              title="Subscriptions"
              tabs={["Subscriptions", "Simulations", "Migrations"]}
              tabContent={{
                "Subscriptions": demoMode === "plg-slg" ? (
                  <SubscriptionsListView subscriptions={subscriptions} onEdit={(sub) => { setEditingSubscription({ id: sub.id, customer: sub.customer, items: sub.items, treeData: sub.treeData }); setIsSubscriptionModalOpen(true) }} onDelete={(id) => { const next = subscriptions.filter((s) => s.id !== id); setSubscriptions(next); saveSubscriptions(next) }} filterOptions={["Subscriptions", "Subscription agreements"]} advancedSubscriptions={contractsData.map((c) => ({ id: c.id, status: c.status, startDate: c.startDate, endDate: c.endDate, pricing: c.contractValue, customer: c.customer, email: c.email, paymentBrand: c.paymentBrand, paymentLast4: c.paymentLast4, paymentInitial: c.paymentInitial }))} onAdvancedClick={(adv) => { setSelectedContract({ id: adv.id, status: adv.status, customer: adv.customer, email: adv.email, contractValue: adv.pricing, startDate: adv.startDate, endDate: adv.endDate }); setContractsView("detail") }} />
                ) : demoMode === "new-users" ? (
                  <SubscriptionsListView subscriptions={subscriptions} onEdit={(sub) => { setEditingSubscription({ id: sub.id, customer: sub.customer, items: sub.items, treeData: sub.treeData }); setIsSubscriptionModalOpen(true) }} onDelete={(id) => { const next = subscriptions.filter((s) => s.id !== id); setSubscriptions(next); saveSubscriptions(next) }} filterOptions={["No commitments", "Has overrides", "Has commits"]} advancedSubscriptions={contractsData.map((c) => ({ id: c.id, status: c.status, startDate: c.startDate, endDate: c.endDate, pricing: c.contractValue, customer: c.customer, email: c.email, paymentBrand: c.paymentBrand, paymentLast4: c.paymentLast4, paymentInitial: c.paymentInitial }))} onAdvancedClick={(adv) => { setSelectedContract({ id: adv.id, status: adv.status, customer: adv.customer, email: adv.email, contractValue: adv.pricing, startDate: adv.startDate, endDate: adv.endDate }); setContractsView("detail") }} />
                ) : (
                  <SubscriptionsListView subscriptions={subscriptions} onEdit={(sub) => { setEditingSubscription({ id: sub.id, customer: sub.customer, items: sub.items, treeData: sub.treeData }); setIsSubscriptionModalOpen(true) }} onDelete={(id) => { const next = subscriptions.filter((s) => s.id !== id); setSubscriptions(next); saveSubscriptions(next) }} hideColumns={["endDate", "committedSpend"]} />
                ),
              }}
              headerAction={(activeTab) => (
                activeTab === "Subscriptions" && demoMode === "plg-slg" ? (
                  <div className="relative">
                    <button
                      type="button"
                      className="flex h-[34px] items-center gap-[6px] rounded-[6px] bg-[#533AFD] px-[12px] text-[13px] font-[600] leading-[18px] text-white hover:bg-[#4730E0] transition-colors"
                      onClick={() => setIsCreateDropdownOpen(!isCreateDropdownOpen)}
                    >
                      Create subscription
                      <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    {isCreateDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-[50]" onClick={() => setIsCreateDropdownOpen(false)} />
                        <div className="absolute right-0 top-[40px] z-[51] w-[220px] rounded-[8px] border border-[#E3E8EF] bg-white py-[4px] shadow-lg">
                          <button
                            type="button"
                            className="flex w-full items-center px-[12px] py-[8px] text-[13px] font-[500] text-[#353A44] hover:bg-[#F5F6F8] transition-colors text-left"
                            onClick={() => { setIsCreateDropdownOpen(false); setIsSubscriptionModalOpen(true) }}
                          >
                            Subscription
                          </button>
                          <button
                            type="button"
                            className="flex w-full items-center px-[12px] py-[8px] text-[13px] font-[500] text-[#353A44] hover:bg-[#F5F6F8] transition-colors text-left"
                            onClick={() => { setIsCreateDropdownOpen(false); setContractsView("create") }}
                          >
                            Subscription agreement
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    className="flex h-[34px] items-center rounded-[6px] bg-[#533AFD] px-[12px] text-[13px] font-[600] leading-[18px] text-white hover:bg-[#4730E0] transition-colors"
                    onClick={() => setIsSubscriptionModalOpen(true)}
                  >
                    Create subscription
                  </button>
                )
              )}
            />
            {isSubscriptionModalOpen && <SubscriptionEditorModal onClose={() => { setIsSubscriptionModalOpen(false); setEditingSubscription(null) }} catalogProducts={products.map((p) => {
              const tierPrices = p.draft?.tierUnitPrices ? Object.values(p.draft.tierUnitPrices) : []
              const unitPrice = tierPrices.find((v) => v && parseFloat(v) > 0) ?? ""
              return { id: p.id, name: p.name, amount: p.amount, billingPeriod: p.billingPeriod, pricingModel: p.draft?.pricingModel, unitPrice, unitLabel: p.draft?.unitLabel }
            })} catalogPricingPlans={pricingPlans.map((p) => {
              const draft = p.draft
              return {
                id: p.id,
                name: p.name || `Plan ${p.id}`,
                description: draft?.planDescription || "",
                creditGrants: draft?.planCreditGrants?.map((cg) => ({
                  id: cg.id,
                  name: cg.name,
                  amount: draft.creditGrantAmounts?.[cg.id] ?? "",
                  period: draft.creditGrantPeriods?.[cg.id] ?? "Monthly",
                })),
                subscriptionFees: draft?.planSubscriptionFees?.map((sf) => ({
                  id: sf.id,
                  name: sf.name,
                  amount: draft.subscriptionFeeAmounts?.[sf.id] ?? "",
                  period: draft.subscriptionFeePeriods?.[sf.id] ?? "Monthly",
                })),
                rateCards: draft?.planRateCards?.map((rc) => ({
                  id: rc.id,
                  name: rc.name,
                  servicingPeriod: draft.rateCardServicingPeriods?.[rc.id] ?? "Usage-based",
                  rates: rc.rates.map((r) => ({
                    id: r.id,
                    name: r.name,
                    unitPrice: draft.planRateUnitPrices?.[r.id] ?? "",
                    meter: draft.rateMeters?.[r.id] ?? "",
                  })),
                })),
              }
            })} initialData={editingSubscription ?? undefined} onSave={(data) => {
              if (editingSubscription?.id) {
                const next = subscriptions.map((s) => s.id === editingSubscription.id ? { ...s, customer: data.customer, items: data.items, treeData: data.treeData } : s)
                setSubscriptions(next)
                saveSubscriptions(next)
              } else {
                const num = Math.floor(10000000 + Math.random() * 90000000)
                const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ"
                const suffix = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
                const newSub: SubscriptionRecord = { id: `${num}-${suffix}`, customer: data.customer, status: "active", items: data.items, createdAt: new Date().toISOString().split("T")[0], treeData: data.treeData }
                const next = [newSub, ...subscriptions]
                setSubscriptions(next)
                saveSubscriptions(next)
              }
            }} />}
            {contractsView === "create" && <NewContractWizardV4 onGetStarted={(data) => { setSelectedContract(data); setContractsView("detail") }} onDiscard={() => setContractsView("list")} />}
          </>
        ) : activeBillingView === "usage-based-billing" ? (
          <BillingTabbedPage
            title="Usage-based billing"
            tabs={["Overview", "Meters", "Alerts", "Credits"]}
          />
        ) : activeBillingView === "customers" ? (
          selectedCustomerId != null ? (
            <CustomerDetailView customer={CUSTOMERS.find((c) => c.id === selectedCustomerId) ?? CUSTOMERS[0]} onBack={() => setSelectedCustomerId(null)} agreementsLabel={demoMode === "new-users" ? "Agreements" : "Subscriptions"} />
          ) : (
            <CustomersListView onSelectCustomer={(id) => setSelectedCustomerId(id)} />
          )
        ) : activeBillingView === "billing-overview" || activeBillingView === "invoices" || activeBillingView === "lifecycle" ? (
          <div>
            <div className="flex items-center justify-between mb-[4px]">
              <h1 className="text-[28px] font-[700] leading-[36px] tracking-[0.38px] text-[#353A44]">
                {activeBillingView === "billing-overview" ? "Overview" : activeBillingView === "invoices" ? "Invoices" : "Lifecycle"}
              </h1>
            </div>
            <div className="flex flex-col items-center justify-center gap-[12px] py-[80px]">
              <div className="flex h-[48px] w-[48px] items-center justify-center rounded-[12px] bg-[#F4F7FA]">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <rect x="2" y="2" width="7" height="7" rx="2" fill="#B6C0CD" />
                  <rect x="11" y="2" width="7" height="7" rx="2" fill="#B6C0CD" opacity="0.5" />
                  <rect x="2" y="11" width="7" height="7" rx="2" fill="#B6C0CD" opacity="0.5" />
                  <rect x="11" y="11" width="7" height="7" rx="2" fill="#B6C0CD" opacity="0.3" />
                </svg>
              </div>
              <p className="text-[14px] font-[500] leading-[20px] text-[#353A44]">Coming soon</p>
              <p className="text-[13px] font-[400] leading-[18px] text-[#596171]">This section is under development.</p>
            </div>
          </div>
        ) : activeBillingView ? (
          <BillingListView
            {...({
              invoices: {
                title: "Invoices",
                createLabel: "Create invoice",
                columns: ["Customer", "Amount", "Status", "Due date", "Created"],
              },
              "usage-billing": {
                title: "Usage-based billing",
                createLabel: "Add pricing plan",
                columns: ["Meter", "Product", "Events", "Status", "Created"],
              },
              customers: {
                title: "Customers",
                createLabel: "Create customer",
                columns: ["Name", "Email", "Status", "Created"],
              },
              coupons: {
                title: "Coupons",
                createLabel: "Create coupon",
                columns: ["Name", "Amount", "Status", "Created"],
              },
            }[activeBillingView] ?? {
              title: "Billing",
              createLabel: "Create",
              columns: ["Name", "Status", "Created"],
            })}
            onCreate={() => {
              if (activeBillingView === "usage-billing") {
                handleOpenPricingPlanModal()
              } else {
                setActiveCreationFlow(activeBillingView)
              }
            }}
          />
        ) : undefined
      }
      isAddProductPopoverOpen={isAddProductPopoverOpen}
      addProductPopoverPosition={addProductPopoverPosition}
      addProductPopoverRef={addProductPopoverRef}
      addProductPromptRef={addProductPromptRef}
      addProductPromptMode={addProductPrompt.promptMode}
      addProductPromptText={addProductPrompt.promptText}
      isRoutingPrompt={addProductPrompt.isRoutingPrompt}
      onChangeAddProductPromptText={addProductPrompt.setPromptText}
      onCancelAddProductPromptMode={() => {
        addProductPrompt.setPromptMode(false)
        addProductPrompt.setPromptText("")
      }}
      onEnterAddProductPromptMode={() => {
        addProductPrompt.setPromptMode(true)
        setTimeout(() => addProductPromptRef.current?.focus(), 0)
      }}
      onSendAddProductPrompt={() => void addProductPrompt.startWithPrompt()}
      onCreateSingleProduct={() => {
        setIsAddProductPopoverOpen(false)
        handleOpenSimplifiedCreateModal()
      }}
      onCreatePricingPlan={() => {
        setIsAddProductPopoverOpen(false)
        handleOpenPricingPlanModal()
      }}
      catalogItems={catalogItems}
      onCatalogItemClick={handleCatalogItemClick}
    >
      <SimplifiedProductPopover
        isOpen={isSimplifiedProductPopoverOpen}
        onClose={() => setIsSimplifiedProductPopoverOpen(false)}
        t={t}
        onDiscard={() => setIsSimplifiedProductPopoverOpen(false)}
        onSubmit={() => handleSubmitProduct()}
        onOpenFullSettings={handleOpenFullSettingsFromSimplified}
        submitLabel={editingProductId != null ? t("Save") : t("Create product")}
        title={t("New product")}
        formContent={
          <SimplifiedCreateProductForm
            t={t}
            productName={productName}
            setProductName={setProductName}
            productDescription={productDescription}
            setProductDescription={setProductDescription}
            productImageUrl={productImageUrl}
            setProductImageUrl={setProductImageUrl}
            productType={productType}
            setProductType={setProductType}
            productTaxCode={productTaxCode}
            setProductTaxCode={setProductTaxCode}
            chargeFrequency={chargeFrequency}
            setChargeFrequency={setChargeFrequency}
            billingPeriod={billingPeriod}
            setBillingPeriod={setBillingPeriod}
            includeTax={includeTax}
            setIncludeTax={setIncludeTax}
            pricingCurrencyCode={pricingCurrencies[0]?.code ?? "USD"}
            currencyOptions={currencyOptions}
            currencyDisplayNames={currencyDisplayNames}
            onChangeCurrency={(code) => {
              const id = pricingCurrencies[0]?.id ?? 0
              handleCurrencyChange(id, code)
            }}
            amount={currencyAmounts[pricingCurrencies[0]?.id ?? 0] ?? ""}
            setAmount={(next) => {
              const id = pricingCurrencies[0]?.id ?? 0
              setCurrencyAmounts({ ...currencyAmounts, [id]: next })
            }}
            onOpenFullSettings={handleOpenFullSettingsFromSimplified}
          />
        }
      />

      <NewProductFullScreen
        key={newProductFullScreenData?.name ?? "new"}
        isOpen={isNewProductFullScreenOpen}
        onClose={() => {
          setIsNewProductFullScreenOpen(false)
          setNewProductFullScreenData(undefined)
        }}
        initialData={newProductFullScreenData}
      />

      <ProductModalOverlay
        {...getProductModalOverlayProps({
          t,
          isOpen: isProductModalOpen,
          editingProductId,
          status:
            editingProductId != null
              ? (products.find((p) => p.id === editingProductId)?.status ?? "live")
              : "draft",
          setIsOpen: setIsProductModalOpen,
          setEditingProductId,
          isAssistantOpen,
          setIsAssistantOpen,
          onSaveDraft: () => handleSaveProductDraft(),
          onSubmit: () => handleSubmitProduct(),
          containerRef: resizeContainerRef,
          activeObjectForm,
          setActiveObjectForm,
          setIsObjectActionsOpen,
          meter,
          setMeterName,
          productName,
          productDescription,
          productLookupKey: "", // Product lookup key not currently stored
          collapsedPrices,
          priceNamesById,
          activeTreePriceId,
          priceDraftName,
          onSelectPriceFromTree: handleSelectPriceFromTree,
          onAddPriceFromNav: handleNavAddPrice,
          parseNumberValue,
          formatCurrencyValue,
          pricingCurrencies,
          currencyAmounts,
          hasObjectActions,
          isObjectActionsOpen,
          objectActionsButtonRef,
          objectActionsMenuRef,
          onDeleteProduct: handleDeleteProduct,
          onUnlinkMeter: () => setMeter(""),
          onDeletePrice: handleDeleteCollapsedPrice,
          formContent: formPanelContent,
          customerPreviewMode,
          setCustomerPreviewMode,
          customerPreviewOptions,
          selectedNodeKey: selectedProductNodeKey,
          onOpenAssistantFromObjectMap: openProductAssistantWithReference,
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
          formatCurrencyValueForPreview: formatCurrencyValue,
          getPriceLabel,
          vercelIconDarkSrc,
          assistantWidthPx: chatPanelWidthPx,
          assistantIsOpenRef: isAssistantOpenRef,
          onAssistantPanelReady: () => setAssistantPanelReady(true),
          assistantContext: productAssistantContext,
          onApplyAssistantActions: handleApplyProductAssistantActions,
          initialAssistantMessage: assistantSeedPrompt,
          onConsumeInitialAssistantMessage: () => setAssistantSeedPrompt(null),
          assistantDraftReference,
          onConsumeAssistantDraftReference: () => setAssistantDraftReference(null),
          onResizePointerDown: beginResize("right"),
          isScopedFormGenerating: isProductScopedFormGenerating,
          onOpenAssistantFromForm: () => {
            const label =
              activeObjectForm === "product"
                ? (productName || t("Product name"))
                : activeObjectForm === "meter"
                  ? (meter || t("Meter name"))
                  : (() => {
                      const name = (priceNamesById[activeTreePriceId ?? -1] ?? "").trim()
                      if (name !== "") return name
                      const primaryCurrency = pricingCurrencies[0]
                      const rawAmount =
                        primaryCurrency != null ? (currencyAmounts[primaryCurrency.id] ?? "").trim() : ""
                      const amountValue = parseNumberValue(rawAmount)
                      return amountValue != null
                        ? formatCurrencyValue(amountValue, primaryCurrency?.code ?? "USD", 2)
                        : t("Price")
                    })()
            const kind: AssistantReference["kind"] =
              activeObjectForm === "product" ? "product" : activeObjectForm === "meter" ? "meter" : "price"
            openProductAssistantWithReference({ kind, label })
          },
        })}
      />

      <AddPriceModal
        isOpen={isAddPriceModalOpen}
        onClose={handleCloseAddPriceModal}
        onSave={handleSaveAddPriceModal}
        priceFormProps={{
          editingCollapsedPriceId: null,
          showCollapsedPriceList: false,
          typography: "default",
          chargeFrequency,
          setChargeFrequency,
          pricingModel,
          onPricingModelChange: handlePricingModelChange,
          billingPeriod,
          setBillingPeriod,
          includeTax,
          setIncludeTax,
          usageBasis,
          onUsageBasisChange: handleUsageBasisChange,
          tieredBy,
          setTieredBy,
          meter,
          onMeterChange: (next) => {
            setActiveObjectForm("price")
            handleMeterChange(next)
          },
          onOpenMeterBuilder: () => handleOpenMeterBuilder("create"),
          meterOptions: (() => {
            const out: string[] = []
            const seen = new Set<string>()
            const add = (raw: string) => {
              const value = raw.trim()
              if (!value || seen.has(value)) return
              seen.add(value)
              out.push(value)
            }
            add(meter)
            add(meterName)
            for (const option of defaultMeterOptions) add(option)
            return out
          })(),
          tiers,
          onAddTier: handleAddTier,
          onRemoveTier: handleRemoveTier,
          tierToValues,
          onChangeTierTo: (id, value) => setTierToValues((prev) => ({ ...prev, [id]: value })),
          tierUnitPrices,
          onChangeTierUnitPrice: (id, value) => setTierUnitPrices((prev) => ({ ...prev, [id]: value })),
          tierFlatFees,
          onChangeTierFlatFee: (id, value) => setTierFlatFees((prev) => ({ ...prev, [id]: value })),
          pricingCurrencies,
          activeCurrencyId,
          setActiveCurrencyId,
          currencyAmounts,
          setCurrencyAmounts,
          currencyOptions,
          currencyDisplayNames,
          onAddCurrency: handleAddCurrency,
          onDeleteCurrency: handleDeleteCurrency,
          onCurrencyChange: handleCurrencyChange,
          showInternalReference,
          setShowInternalReference,
          priceDescription,
          setPriceDescription,
          lookupKey,
          setLookupKey,
          showPriceForm: true,
          shouldAnimatePriceForm: false,
          onAnimationComplete: () => {},
          priceFormInstance,
          highlightedId,
          newFieldEffect,
          isDrawerSurface: false,
        }}
      />

      {isPricingPlanWizardOpen && (
        <PricingPlanWizardModal
          t={t}
          onConfirm={handlePricingPlanWizardConfirm}
          onCancel={handlePricingPlanWizardCancel}
          onSkip={handlePricingPlanWizardSkip}
          isExiting={wizardExiting}
          onCardExited={handleWizardCardExited}
          onBackdropExited={handleWizardBackdropExited}
        />
      )}

      <PricingPlanModalOverlay
        {...getPricingPlanModalOverlayProps({
          t,
          isOpen: isPricingPlanModalOpen,
          setIsOpen: setIsPricingPlanModalOpen,
          title: editingPricingPlanId != null ? t("Edit pricing plan") : t("Add a pricing plan"),
          status:
            editingPricingPlanId != null
              ? (pricingPlans.find((p) => p.id === editingPricingPlanId)?.status ?? "live")
              : "draft",
          onSaveDraft: () => handleSavePricingPlanDraft(),
          createLabel: pricingPlanCreateLabel,
          createDisabled: pricingPlanCreateDisabled,
          onCreate: pricingPlanOnCreate,
          onDiscard: pricingPlanOnDiscard,
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
          onMoveProductToPriceGroup: (productId: number, priceGroupId: number) => {
            setPlanRateCards((prev) => prev.map((c) => c.id === productId ? { ...c, priceGroupId } : c))
          },
          planRateCards,
          planRates,
          rateCardServicingPeriods,
          planExpandedRateCards,
          setPlanExpandedRateCards,
          setActivePlanRateCardId,
          onAddPlanRate: (rateCardId: number) => {
            handleAddPlanRate(rateCardId)
            const currentMaxRateId = planRateCards.reduce((max, card) => {
              const cardMax = card.rates.length ? Math.max(...card.rates.map((r) => r.id)) : -1
              return Math.max(max, cardMax)
            }, -1)
            setActivePlanNode({ type: "rate", id: currentMaxRateId + 1 })
            // Auto-open sidebar on first item add
            addedItemCountRef.current += 1
            if (addedItemCountRef.current === 1) {
              setGetStartedDismissed(true)
              setIsTreeNavOpen(true)
              setHasTreeChanges(false)
              setShowSidebarTip(true)
            } else if (!isTreeNavOpen) {
              setHasTreeChanges(true)
            }
          },
          onMoveRateToPriceGroup: handleMoveRateToPriceGroup,
          onAddStandaloneRate: () => {
            handleAddStandaloneRate()
            addedItemCountRef.current += 1
            if (addedItemCountRef.current === 1) {
              setGetStartedDismissed(true)
              setIsTreeNavOpen(true)
              setHasTreeChanges(false)
              setShowSidebarTip(true)
            } else if (!isTreeNavOpen) {
              setHasTreeChanges(true)
            }
          },
          activePlanRateCardId,
          planCreditGrants,
          planSubscriptionFees,
          addPlanObjectButtonRef,
          onToggleAddPlanObject: (anchorEl?: HTMLElement) => {
            if (anchorEl) {
              const rect = anchorEl.getBoundingClientRect()
              // Inline "+" buttons: position to the right, top-aligned.
              // Sticky bottom "Add object" button: position above, centered in sidebar.
              const isBottomButton = anchorEl.closest('[class*="bg-[#F7F5FD]"]') != null
              const isFormPanelButton = anchorEl.closest('[data-form-panel]') != null
              if (isBottomButton || isFormPanelButton) {
                // Horizontally centered in container, above the button
                const container = isFormPanelButton ? anchorEl.closest('[data-form-panel]') : anchorEl.closest('aside')
                const containerRect = container?.getBoundingClientRect()
                const popoverWidth = 264
                if (containerRect) {
                  const leftPos = containerRect.left + (containerRect.width - popoverWidth) / 2
                  setAddPlanObjectPopoverPosition({ top: rect.top - 16, left: leftPos, above: true })
                } else {
                  setAddPlanObjectPopoverPosition({ top: rect.top - 16, left: rect.right + 4, above: true })
                }
              } else {
                // Inline "+" buttons: drop the popover just below the button,
                // left-aligned with it.
                setAddPlanObjectPopoverPosition({ top: rect.bottom + 4, left: rect.left })
              }
              setIsAddPlanObjectFromMap(true)
              setIsAddPlanObjectOpen((prev) => !prev)
            } else {
              // Form header "+" button: position below the button, left-aligned with it
              if (formAddButtonRef.current) {
                const rect = formAddButtonRef.current.getBoundingClientRect()
                setAddPlanObjectPopoverPosition({ top: rect.bottom + 9.5, left: rect.left })
                setIsAddPlanObjectFromMap(true)
              } else {
                setIsAddPlanObjectFromMap(false)
              }
              setIsAddPlanObjectOpen((prev) => {
                // Advance onboarding tour when opening (not closing) the popover
                if (!prev && onboardingTourStep === 1) {
                  setOnboardingTourStep(2)
                }
                return !prev
              })
            }
          },
          onAddPlan: handleAddPlanInline,
          allPlans: pricingPlans.filter((p) => editingPricingPlanId == null || p.id === editingPricingPlanId).map((p) => ({ id: p.id, name: p.name, draft: p.draft })),
          onSwitchToPlan: handleSwitchToPlan,
          planHeaderLabel,
          planParentInfo,
          prevTreeNode,
          nextTreeNode,
          hasTreeChanges,
          planDeleteLabel,
          isPlanActionsOpen,
          setIsPlanActionsOpen,
          planActionsButtonRef: planActionsButtonRef,
          planActionsMenuRef: planActionsMenuRef,
          onDeleteActivePlanNode: handleDeleteActivePlanNode,
          onDuplicateActivePlanNode: handleDuplicateActivePlanNode,
          planForm: <PlanForm key={`plan-form-${editingPricingPlanId ?? "draft"}`} ctx={planFormCtx} />,
          additionalPlanForms,
          onCloseAdditionalForm: handleCloseAdditionalForm,
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
          editingPlanId: editingPricingPlanId,
          currentPlanDraft,
          rateMeters,
          rateMeterNames,
          selectedNodeKey: selectedPlanNodeKey,
          activeNodeKey: planNodeToKey(activePlanNode),
          selectedNodeKeys: selectedPlanNodeKeys,
          onOpenAssistantFromObjectMap: openPlanAssistantWithReference,
          onOpenAddPlanObjectPopover: handleOpenAddPlanObjectPopover,
          onAddRateFromMap: handleAddPlanRate,
          planCurrency,
          formatCurrencyValue,
          planDescription,
          planLookupKey,
          rateMetersByRate: rateMeters,
          rateUnitLabels,
          rateSellAs,
          planRateTierFlatFees,
          creditGrantAmounts,
          creditGrantPeriods,
          subscriptionFeeAmounts: subscriptionFeeAmounts,
          subscriptionFeePeriods: subscriptionFeePeriods,
          isExamplePlan: editingPricingPlanId === EXAMPLE_PLAN_ID,
          sidebarSelectionEnabled: hasUserSelectedNode,
          validationErrorNodeIds,
          quickStartGhostKinds,
          onBackgroundClick: () => {
            // Clicking the empty canvas background deselects the current node
            setActivePlanNode({ type: "plan" })
            setAdditionalSelectedNodes([])
            setHasUserSelectedNode(false)
            userHasSelectedPlanNodeRef.current = false
            setActiveCoachmark(null)
          },
          planAssistantIsOpenRef: isPlanAssistantOpenRef,
          onPlanAssistantPanelReady: () => setPlanAssistantPanelReady(true),
          planAssistantContext,
          onApplyPlanAssistantActions: handleApplyPlanAssistantActions,
          onPreviewPlanAssistantActions: handlePreviewPlanAssistantActions,
          onConfirmPlanAssistantPreview: handleConfirmPlanAssistantPreview,
          planAssistantSeedPrompt: planAssistantSeedPrompt,
          onConsumePlanAssistantSeedPrompt: () => setPlanAssistantSeedPrompt(null),
          planAssistantDraftReference,
          onConsumePlanAssistantDraftReference: () => setPlanAssistantDraftReference(null),
          planChatPanelPx: PLAN_CHAT_PANEL_PX,
          assistantHighlightedKeys: planScopedAiPreviewHighlightedKeys,
          assistantHighlightClass: "!bg-[#E0D9FB]",
          onSidebarContextMenu: handleSidebarContextMenu,
          onMapNodeContextMenu: handleMapNodeContextMenu,
          isAddPlanObjectOpen,
          addPlanObjectPopoverPosition: addPlanObjectPopoverPosition,
          addPlanObjectPopoverRef: addPlanObjectPopoverRef,
          onAddPlanObject: handleAddPlanObject,
          // Catalog search items (products & price groups from localStorage)
          catalogItems: (() => {
            const items: import("@/components/product-catalog/AddPlanObjectPopover").CatalogSearchItem[] = []
            try {
              const rawProducts = window.localStorage.getItem("product-catalog-standalone-products")
              const prods: { id: number; name: string; type: string; price: string; currency: string; cadence: string; prices?: { id: number; name: string; pricingModel: string; price: string; currency: string; cadence: string; meter: string; priceType: string; sellAs: string; unitLabel: string }[] }[] = rawProducts ? JSON.parse(rawProducts) : []
              for (const p of prods) {
                const priceCount = p.prices?.length ?? (p.price ? 1 : 0)
                const detail = priceCount > 1 ? `Product (${priceCount} prices)` : "Product"
                const catalogPrices = p.prices?.map((sp) => ({ id: sp.id, name: sp.name, price: sp.price, cadence: sp.cadence, pricingModel: sp.pricingModel, meter: sp.meter, priceType: sp.priceType, sellAs: sp.sellAs, unitLabel: sp.unitLabel }))
                items.push({ id: p.id, name: p.name, kind: "product", productType: (p.type === "Usage" ? "Usage-based" : (p.type || "Flat")) as "Flat" | "Usage-based" | "Composite", detail, prices: catalogPrices })
              }
            } catch {}
            try {
              const rawGroups = window.localStorage.getItem("product-catalog-price-groups")
              const groups: { id: number; name: string; rates: unknown[] }[] = rawGroups ? JSON.parse(rawGroups) : []
              for (const g of groups) {
                const n = g.rates.length
                items.push({ id: g.id, name: g.name || "Untitled", kind: "priceGroup", detail: `Price group (${n} price${n !== 1 ? "s" : ""})`, prices: g.rates.map((r: any, i: number) => ({ id: i, name: r.name || "", price: "", cadence: "", pricingModel: "", meter: "", priceType: "", sellAs: "", unitLabel: "" })) })
              }
            } catch {}
            return items
          })(),
          onSelectCatalogItem: (item) => {
            setIsAddPlanObjectOpen(false)
            // Remove any empty (unnamed) products that were just created as placeholders
            setPlanRateCards((prev) => prev.filter((c) => c.name.trim() !== "" || c.rates.some((r) => (planRateUnitPrices[r.id] ?? "").trim() !== "")))
            setHasUserSelectedNode(true)
            setShowFieldHints(true)
            if (!isTreeNavOpen) setHasTreeChanges(true)
            addedItemCountRef.current += 1
            if (addedItemCountRef.current === 1) {
              setGetStartedDismissed(true)
              setIsTreeNavOpen(true)
              setHasTreeChanges(false)
              setShowSidebarTip(true)
            }

            if (item.kind === "product") {
              try {
                const raw = window.localStorage.getItem("product-catalog-standalone-products")
                const prods: { id: number; name: string; type: string; price: string; currency: string; cadence: string; prices?: { id: number; name: string; pricingModel: string; price: string; currency: string; cadence: string; meter: string; priceType: string; sellAs: string; unitLabel: string }[] }[] = raw ? JSON.parse(raw) : []
                const product = prods.find((p) => p.id === item.id)
                if (product) {
                  const selectedPrice = (item as any).prices?.[0] ?? null
                  const sp = selectedPrice ?? (product.prices?.[0] ?? { id: 0, name: product.name, pricingModel: product.type === "Usage" ? "Usage-based" : "Recurring", price: product.price, currency: product.currency, cadence: product.cadence, meter: "", priceType: "Fixed rate", sellAs: "Individual units", unitLabel: "" })
                  const isNewPrice = (item as any).prices?.length === 0
                  const rateId = getMaxRateId() + 1
                  const nextCardId = planRateCards.length ? Math.max(...planRateCards.map((c) => c.id)) + 1 : 0
                  // Set up price state
                  setPlanRateUsage((u) => ({ ...u, [rateId]: "0" }))
                  setPlanRateUnitPrices((p) => ({ ...p, [rateId]: isNewPrice ? "" : (sp.price || "") }))
                  setRatePriceTypes((t) => ({ ...t, [rateId]: isNewPrice ? planPriceTypeOptions[0] : (sp.pricingModel === "Usage-based" ? (sp.priceType || planPriceTypeOptions[0]) : "Fixed rate") }))
                  setPlanRateTiers((t) => ({ ...t, [rateId]: [0, 1] }))
                  setPlanRateTierToValues((v) => ({ ...v, [rateId]: {} }))
                  setPlanRateTierUnitPrices((v) => ({ ...v, [rateId]: {} }))
                  setPlanRateTierFlatFees((v) => ({ ...v, [rateId]: {} }))
                  setPlanRateIncludeTax((v) => ({ ...v, [rateId]: includeTaxOptions[0] }))
                  setPlanRateCurrencies((c) => ({ ...c, [rateId]: [{ id: 0, code: isNewPrice ? planCurrency : (sp.currency || planCurrency) }] }))
                  setPlanRateActiveCurrencyId((ids) => ({ ...ids, [rateId]: 0 }))
                  if (!isNewPrice && sp.meter) setRateMeters((m) => ({ ...m, [rateId]: sp.meter }))
                  if (!isNewPrice && sp.sellAs) setRateSellAs((s) => ({ ...s, [rateId]: sp.sellAs }))
                  // Create product (rate card) with price (rate) nested inside
                  const productType = product.type === "Usage" ? "Usage-based" : (product.type || "Flat")
                  setPlanRateCards((prev) => [...prev, { id: nextCardId, name: product.name, rates: [{ id: rateId, name: "" }] }])
                  setRateCardServicingPeriods((prev) => ({ ...prev, [nextCardId]: productType }))
                  setPlanExpandedRateCards((prev) => ({ ...prev, [nextCardId]: true }))
                  setActivePlanNode({ type: "rate", id: rateId })
                  return
                }
              } catch {}
              // Fallback: create product with price
              const nextCardId = planRateCards.length ? Math.max(...planRateCards.map((c) => c.id)) + 1 : 0
              const nextRateId = getMaxRateId() + 1
              handleAddPlanRateCard()
              handleAddPlanRate(nextCardId)
              setActivePlanNode({ type: "rate", id: nextRateId })
            } else {
              try {
                const raw = window.localStorage.getItem("product-catalog-price-groups")
                const groups: { id: number; name: string; serviceInterval: string; rates: { id: number; name: string }[] }[] = raw ? JSON.parse(raw) : []
                const group = groups.find((g) => g.id === item.id)
                if (group) {
                  // Create a price group
                  const nextPgId = planPriceGroups.length ? Math.max(...planPriceGroups.map((g) => g.id)) + 1 : 0
                  setPlanPriceGroups((prev) => [...prev, { id: nextPgId, name: group.name, serviceInterval: group.serviceInterval }])

                  // Create a product (rate card) with a price (rate) for each item in the group
                  let cardIdBase = planRateCards.length ? Math.max(...planRateCards.map((c) => c.id)) + 1 : 0
                  let rateIdBase = getMaxRateId() + 1
                  const newCards: typeof planRateCards = []
                  for (const r of group.rates) {
                    const cardId = cardIdBase++
                    const rateId = rateIdBase++
                    newCards.push({ id: cardId, name: r.name, rates: [{ id: rateId, name: "" }], priceGroupId: nextPgId })
                    setPlanRateUsage((u) => ({ ...u, [rateId]: "0" }))
                    setPlanRateUnitPrices((p) => ({ ...p, [rateId]: "" }))
                    setRatePriceTypes((t) => ({ ...t, [rateId]: planPriceTypeOptions[0] }))
                    setPlanRateTiers((t) => ({ ...t, [rateId]: [0, 1] }))
                    setPlanRateTierToValues((v) => ({ ...v, [rateId]: {} }))
                    setPlanRateTierUnitPrices((v) => ({ ...v, [rateId]: {} }))
                    setPlanRateTierFlatFees((v) => ({ ...v, [rateId]: {} }))
                    setPlanRateIncludeTax((v) => ({ ...v, [rateId]: includeTaxOptions[0] }))
                    setPlanRateCurrencies((c) => ({ ...c, [rateId]: [{ id: 0, code: planCurrency }] }))
                    setPlanRateActiveCurrencyId((ids) => ({ ...ids, [rateId]: 0 }))
                    setPlanExpandedRateCards((prev) => ({ ...prev, [cardId]: true }))
                  }
                  setPlanRateCards((prev) => [...prev, ...newCards])
                  setActivePlanNode({ type: "priceGroup", id: nextPgId })
                  return
                }
              } catch {}
              handleAddPlanRateCard()
            }
          },
          // Component system
          hasComponents: merchantHasComponents,
          existingComponents: allMerchantComponents,
          onUseExistingComponent: handleUseExistingComponent,
          existingComponentsForNodeType: existingComponentsForNodeType,
          onReplaceWithExistingComponent: handleReplaceWithExistingComponent,
          componentVersions: activeNodeComponentVersions,
          activeComponentVersionId: activeNodeComponentVersionId,
          onChangeComponentVersion: handleChangeComponentVersion,
          isDraftComponent: activeNodeIsDraft,
          isComponentReadOnly,
          isScopedFormGenerating: isPlanScopedFormGenerating,
          versions: editingPricingPlanId != null ? pricingPlans.find((p) => p.id === editingPricingPlanId)?.versions : undefined,
          activeVersionId: activeVersionId ?? undefined,
          onChangeVersion: handleChangeVersion,
          showSaveVersionModal,
          onConfirmSaveVersion: handleConfirmSaveVersion,
          onCancelSaveVersion: () => setShowSaveVersionModal(false),
          currentDefaultVersionId: editingPricingPlanId != null ? pricingPlans.find((p) => p.id === editingPricingPlanId)?.defaultVersionId : undefined,
          componentSummaries: (() => {
            const summaries: import("@/components/product-catalog/componentTypes").ComponentSaveSummary[] = []
            for (const rc of planRateCards) {
              if (rc.componentLink) {
                const ds = getDraftState(rc.componentLink.componentId)
                if (ds?.isDirty) summaries.push({ componentId: rc.componentLink.componentId, name: rc.name, kind: "rateCard", action: "update" })
              } else if (rc.name) {
                summaries.push({ componentId: `new-rc-${rc.id}`, name: rc.name, kind: "rateCard", action: "create" })
              }
            }
            for (const sf of planSubscriptionFees) {
              if (sf.componentLink) {
                const ds = getDraftState(sf.componentLink.componentId)
                if (ds?.isDirty) summaries.push({ componentId: sf.componentLink.componentId, name: sf.name, kind: "subscriptionFee", action: "update" })
              } else if (sf.name) {
                summaries.push({ componentId: `new-sf-${sf.id}`, name: sf.name, kind: "subscriptionFee", action: "create" })
              }
            }
            for (const cg of planCreditGrants) {
              if (cg.componentLink) {
                const ds = getDraftState(cg.componentLink.componentId)
                if (ds?.isDirty) summaries.push({ componentId: cg.componentLink.componentId, name: cg.name, kind: "creditGrant", action: "update" })
              } else if (cg.name) {
                summaries.push({ componentId: `new-cg-${cg.id}`, name: cg.name, kind: "creditGrant", action: "create" })
              }
            }
            return summaries.length > 0 ? summaries : undefined
          })(),
          // Tree nav slide-out
          isTreeNavOpen,
          onToggleTreeNav: () => { hasOpenedNavRef.current = true; setIsTreeNavOpen((prev) => { if (!prev) setHasTreeChanges(false); else setTimeout(() => setShowSidebarTip(false), 300); return !prev }) },
          hamburgerButtonRef,
          formAddButtonRef,
          // Sidebar tip
          showSidebarTip,
          onDismissSidebarTip: () => setShowSidebarTip(false),
          // Onboarding popovers
          showGetStarted,
          onDismissGetStarted: () => setGetStartedDismissed(true),
          getStartedDismissed,
          isInlineGetStartedActive,
          isWizardLoading,
          onboardingMode,
          showNavHint,
          onDismissNavHint: () => { setNavHintDismissed(true); setShowNavHint(false) },
          onboardingTourStep,
          onDismissOnboardingTour: () => setOnboardingTourStep(null),
          isBulkEditMode: bulkEditRateCardId != null,
          bulkEditRateCardId,
          onExitBulkEdit: () => setBulkEditRateCardId(null),
          bulkEditContent: bulkEditRateCardId != null ? (
            <BulkRateEditor
              t={t}
              planRateCards={planRateCards}
              rateCardId={bulkEditRateCardId}
              rateMeters={rateMeters}
              setRateMeters={setRateMeters}
              ratePriceTypes={ratePriceTypes}
              setRatePriceTypes={setRatePriceTypes}
              rateSellAs={rateSellAs}
              setRateSellAs={setRateSellAs}
              planRateUnitPrices={planRateUnitPrices}
              setPlanRateUnitPrices={setPlanRateUnitPrices}
              rateUnitLabels={rateUnitLabels}
              setRateUnitLabels={setRateUnitLabels}
              updateRateName={updateRateName}
              meterOptions={availablePlanMeterOptions}
              planPriceTypeOptions={planPriceTypeOptions}
              sellAsOptions={sellAsOptions}
              onBack={() => setBulkEditRateCardId(null)}
              headerTitle={getPlanLabel(planName, t("Untitled pricing plan"))}
              onDiscard={pricingPlanOnDiscard}
              onCreate={pricingPlanOnCreate}
              createLabel={pricingPlanCreateLabel}
              createDisabled={pricingPlanCreateDisabled}
            />
          ) : null,
          onOpenAssistantFromForm: () => {
            const kind: AssistantReference["kind"] =
              activePlanNode.type === "plan"
                ? "plan"
                : activePlanNode.type === "rateCard"
                  ? "rateCard"
                  : activePlanNode.type === "rate"
                    ? "rate"
                    : activePlanNode.type === "rateMeter"
                      ? "rateMeter"
                      : activePlanNode.type === "creditGrant"
                        ? "creditGrant"
                        : "subscriptionFee"

            const label =
              activePlanNode.type === "plan"
                ? getPlanLabel(planName, t("Untitled pricing plan"))
                : activePlanNode.type === "rateCard"
                  ? getPlanRateCardLabel(
                      planRateCards.find((c) => c.id === (activePlanNode.id ?? activePlanRateCardId)) ?? null
                    )
                  : activePlanNode.type === "rate"
                    ? getPlanRateLabel(
                        (() => {
                          const rateId = activePlanNode.id ?? null
                          if (rateId == null) return null
                          return getAllRates(planRateCards, planRates).find((r) => r.id === rateId) ?? null
                        })()
                      )
                    : activePlanNode.type === "creditGrant"
                      ? getPlanCreditGrantLabel(
                          planCreditGrants.find((g) => g.id === (activePlanNode.id ?? -1)) ?? null
                        )
                      : activePlanNode.type === "subscriptionFee"
                        ? getPlanSubscriptionFeeLabel(
                            planSubscriptionFees.find((f) => f.id === (activePlanNode.id ?? -1)) ?? null
                          )
                        : t("Meter")

            openPlanAssistantWithReference({ kind, label })
          },
        })}
        validationErrorObjects={showValidationPanel ? validationErrorObjects : undefined}
        onNavigateToValidationError={(obj) => {
          if (obj.nodeType === "rateCard" || obj.nodeType === "rate") {
            const card = planRateCards.find((c) =>
              obj.nodeType === "rateCard" ? c.id === obj.nodeId : c.rates.some((r) => r.id === obj.nodeId)
            )
            if (card) {
              setActivePlanRateCardId(card.id)
              setPlanExpandedRateCards((prev) => ({ ...prev, [card.id]: true }))
            }
          }
          setActivePlanNode({ type: obj.nodeType, id: obj.nodeId })
        }}
        onDismissValidationPanel={() => setShowValidationPanel(false)}
        coachmarkProps={{
          isActive: isCoachmarkTourActive,
          currentStep: currentCoachmarkStep,
          steps: COACHMARK_STEPS_LAYOUT_A, // Actual steps determined by layout mode in PricingPlanModalOverlay
          onNext: handleCoachmarkNext,
          onPrev: handleCoachmarkPrev,
          onClose: handleCoachmarkClose,
          onNavigateToStep: handleCoachmarkNavigateToStep,
        }}
        activeCoachmark={activeCoachmark}
        onDismissCoachmark={() => setActiveCoachmark(null)}
        showSkeleton={showPlanSkeleton}
        onSkeletonDone={handleSkeletonDone}
      />

      {/* Context menu for right-click on sidebar items and map nodes */}
      <ContextMenu
        t={t}
        position={contextMenuPosition}
        onClose={handleContextMenuClose}
        deleteLabel={contextMenuDeleteLabel}
        onDelete={handleContextMenuDelete}
        onAskForChanges={handleContextMenuAskForChanges}
        showDuplicate={contextMenuSupportsDuplicate}
        onDuplicate={handleContextMenuDuplicate}
        showCopySettings={contextMenuSupportsDuplicate}
        onCopySettings={handleContextMenuCopySettings}
        showPasteSettings={contextMenuCanPaste}
        onPasteSettings={handleContextMenuPasteSettings}
      />

      <ProductImageModal
        imageUrl={productImageUrl}
        isOpen={isImageModalOpen}
        t={t}
        onClose={() => setIsImageModalOpen(false)}
      />
      {activeCreationFlow && (
        <CreationFlowOverlay
          flow={activeCreationFlow}
          onClose={() => setActiveCreationFlow(null)}
        />
      )}

      {/* Demo mode flash overlay */}
      {demoFlash && (
        <div className="fixed inset-0 z-[9998] bg-white animate-[fadeOut_300ms_ease-out_forwards]" />
      )}

      {/* Demo mode toggle */}
      <div className="fixed bottom-[24px] right-[24px] z-[9999] flex flex-col gap-[4px] rounded-[10px] bg-[#F4F5F7] p-[4px]">
        <div className="flex items-center gap-[2px]">
          <span className="px-[10px] py-[7px] text-[12px] font-[500] text-[#6C7688]">Alloy use cases:</span>
          <button
            type="button"
            className={`rounded-[7px] px-[14px] py-[7px] text-[13px] font-[500] transition-all ${demoMode === "plg" ? "bg-white text-[#353A44] shadow-sm" : "text-[#6C7688] hover:text-[#353A44]"}`}
            onClick={() => { if (demoMode !== "plg") { setDemoFlash(true); setTimeout(() => setDemoFlash(false), 300); setDemoMode("plg"); setActiveBillingView("product-catalog"); setContractsView("list"); setSelectedContract(null) } }}
          >
            Existing subs user (PLG only)
          </button>
          <button
            type="button"
            className={`rounded-[7px] px-[14px] py-[7px] text-[13px] font-[500] transition-all ${demoMode === "plg-slg" ? "bg-white text-[#353A44] shadow-sm" : "text-[#6C7688] hover:text-[#353A44]"}`}
            onClick={() => { if (demoMode !== "plg-slg") { setDemoFlash(true); setTimeout(() => setDemoFlash(false), 300); setDemoMode("plg-slg"); setActiveBillingView("product-catalog"); setContractsView("list"); setSelectedContract(null) } }}
          >
            Existing subs user (PLG+SLG)
          </button>
          <button
            type="button"
            className={`rounded-[7px] px-[14px] py-[7px] text-[13px] font-[500] transition-all ${demoMode === "new-users" ? "bg-white text-[#353A44] shadow-sm" : "text-[#6C7688] hover:text-[#353A44]"}`}
            onClick={() => { if (demoMode !== "new-users") { setDemoFlash(true); setTimeout(() => setDemoFlash(false), 300); setDemoMode("new-users"); setActiveBillingView("product-catalog"); setContractsView("list"); setSelectedContract(null) } }}
          >
            New to Stripe
          </button>
        </div>
      </div>
    </ProductCatalogLayout>
  )
}

