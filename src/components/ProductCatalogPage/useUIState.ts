"use client"

import { useRef, useState } from "react"
import type { AssistantReference } from "@/components/ProductAssistantPanel"
import { customerPreviewOptions } from "@/components/product-catalog/productCatalogPage.constants"

/**
 * Hook for managing UI state (modals, popovers, navigation)
 */
export function useUIState() {
  // Highlight effect
  const [highlightedId, setHighlightedId] = useState<string | null>(null)

  // Modal states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [isSimplifiedProductPopoverOpen, setIsSimplifiedProductPopoverOpen] = useState(false)
  const [isPricingPlanModalOpen, setIsPricingPlanModalOpen] = useState(false)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)

  // Active form (product, price, meter)
  const [activeObjectForm, setActiveObjectForm] = useState<"product" | "price" | "meter">("product")

  // Assistant panel states
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

  // Scoped AI generation states
  const [scopedProductAiGeneratingKey, setScopedProductAiGeneratingKey] = useState<string | null>(null)
  const [scopedPlanAiGeneratingKey, setScopedPlanAiGeneratingKey] = useState<string | null>(null)
  const [planScopedAiPreviewHighlightedKeys, setPlanScopedAiPreviewHighlightedKeys] = useState<string[]>([])
  const [planScopedAiLoadingKeys, setPlanScopedAiLoadingKeys] = useState<string[]>([])

  // Object actions menu
  const [isObjectActionsOpen, setIsObjectActionsOpen] = useState(false)
  const objectActionsButtonRef = useRef<HTMLButtonElement | null>(null)
  const objectActionsMenuRef = useRef<HTMLDivElement | null>(null)

  // Plan actions menu
  const [isPlanActionsOpen, setIsPlanActionsOpen] = useState(false)
  const planActionsButtonRef = useRef<HTMLButtonElement | null>(null)
  const planActionsMenuRef = useRef<HTMLDivElement | null>(null)

  // Add product popover
  const addProductButtonRef = useRef<HTMLButtonElement>(null)
  const addProductPopoverRef = useRef<HTMLDivElement | null>(null)
  const [isAddProductPopoverOpen, setIsAddProductPopoverOpen] = useState(false)
  const [addProductPopoverPosition, setAddProductPopoverPosition] = useState<{ top: number; left: number } | null>(null)
  const addProductPromptRef = useRef<HTMLTextAreaElement | null>(null)

  // Add plan object popover
  const [isAddPlanObjectOpen, setIsAddPlanObjectOpen] = useState(false)
  const addPlanObjectButtonRef = useRef<HTMLButtonElement | null>(null)
  const addPlanObjectPopoverRef = useRef<HTMLDivElement | null>(null)
  const [addPlanObjectPopoverPosition, setAddPlanObjectPopoverPosition] = useState<{ top: number; left: number } | null>(null)

  // Customer preview
  const [customerPreviewMode, setCustomerPreviewMode] = useState(() =>
    customerPreviewOptions.includes("Map") ? "Map" : customerPreviewOptions[0]
  )
  const [previewUnitQuantity, setPreviewUnitQuantity] = useState("3200")
  const [previewLocation, setPreviewLocation] = useState("USA")
  const [previewState, setPreviewState] = useState("Alaska")

  const triggerHighlight = (id: string) => {
    setHighlightedId(id)
  }

  return {
    // Highlight
    highlightedId,
    setHighlightedId,
    triggerHighlight,

    // Modals
    isProductModalOpen,
    setIsProductModalOpen,
    isSimplifiedProductPopoverOpen,
    setIsSimplifiedProductPopoverOpen,
    isPricingPlanModalOpen,
    setIsPricingPlanModalOpen,
    isImageModalOpen,
    setIsImageModalOpen,

    // Active form
    activeObjectForm,
    setActiveObjectForm,

    // Assistant panel
    isAssistantOpen,
    setIsAssistantOpen,
    isPlanAssistantOpen,
    setIsPlanAssistantOpen,
    assistantSeedPrompt,
    setAssistantSeedPrompt,
    planAssistantSeedPrompt,
    setPlanAssistantSeedPrompt,
    assistantDraftReference,
    setAssistantDraftReference,
    planAssistantDraftReference,
    setPlanAssistantDraftReference,
    setAssistantPanelReady,
    setPlanAssistantPanelReady,
    isAssistantOpenRef,
    isPlanAssistantOpenRef,
    isPlanAssistantApplying,
    setIsPlanAssistantApplying,

    // Scoped AI generation
    scopedProductAiGeneratingKey,
    setScopedProductAiGeneratingKey,
    scopedPlanAiGeneratingKey,
    setScopedPlanAiGeneratingKey,
    planScopedAiPreviewHighlightedKeys,
    setPlanScopedAiPreviewHighlightedKeys,
    planScopedAiLoadingKeys,
    setPlanScopedAiLoadingKeys,

    // Object actions menu
    isObjectActionsOpen,
    setIsObjectActionsOpen,
    objectActionsButtonRef,
    objectActionsMenuRef,

    // Plan actions menu
    isPlanActionsOpen,
    setIsPlanActionsOpen,
    planActionsButtonRef,
    planActionsMenuRef,

    // Add product popover
    addProductButtonRef,
    addProductPopoverRef,
    isAddProductPopoverOpen,
    setIsAddProductPopoverOpen,
    addProductPopoverPosition,
    setAddProductPopoverPosition,
    addProductPromptRef,

    // Add plan object popover
    isAddPlanObjectOpen,
    setIsAddPlanObjectOpen,
    addPlanObjectButtonRef,
    addPlanObjectPopoverRef,
    addPlanObjectPopoverPosition,
    setAddPlanObjectPopoverPosition,

    // Customer preview
    customerPreviewMode,
    setCustomerPreviewMode,
    previewUnitQuantity,
    setPreviewUnitQuantity,
    previewLocation,
    setPreviewLocation,
    previewState,
    setPreviewState,
  }
}

export type UIState = ReturnType<typeof useUIState>
