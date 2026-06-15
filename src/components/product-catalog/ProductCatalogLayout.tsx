'use client'

import type { RefObject, ReactNode } from "react"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { ProductTable } from "@/components/ProductTable"
import { AddProductPopover, type PopoverPosition } from "@/components/product-catalog/AddProductPopover"
import { CatalogChromeHeaderSkeleton } from "@/components/product-catalog/CatalogChromeHeaderSkeleton"
import { CatalogSidebarSkeleton } from "@/components/product-catalog/CatalogSidebarSkeleton"
import { CatalogTableToolbarSkeleton } from "@/components/product-catalog/CatalogTableToolbarSkeleton"
import { ProductCatalogHeaderRow } from "@/components/product-catalog/ProductCatalogHeaderRow"
import { ControlsIcon, LoopsBrandIcon, CursorBrandIcon } from "@/components/ProductCatalogIcons"
import { IconographyProvider, useIconographyMode } from "@/components/product-catalog/iconography"
import { FormPanelSideProvider, useFormPanelSide } from "@/components/product-catalog/formPanelSide"
import { ShowAdditionalNodesProvider, useShowAdditionalNodes } from "@/components/product-catalog/showAdditionalNodes"
import { LayoutDirectionProvider, useLayoutDirection } from "@/components/product-catalog/layoutDirection"
import { LayoutModeProvider, useLayoutMode } from "@/components/product-catalog/layoutMode"
import { ShowFieldHelperProvider, useShowFieldHelper } from "@/components/product-catalog/showFieldHelper"
import { MapInteractivityProvider, useMapInteractivity } from "@/components/product-catalog/mapInteractivity"
import { ShowAddPlanProvider, useShowAddPlan } from "@/components/product-catalog/showAddPlan"
import { BulkEditTransitionProvider, useBulkEditTransition } from "@/components/product-catalog/bulkEditTransition"
import { CascadeAlignmentProvider, useCascadeAlignment } from "@/components/product-catalog/cascadeAlignment"
import { OnboardingModeProvider, useOnboardingMode } from "@/components/product-catalog/onboardingMode"
import { SidebarDarkModeProvider, useSidebarDarkMode } from "@/components/product-catalog/sidebarDarkMode"
import { AddMenuModeProvider, useAddMenuMode } from "@/components/product-catalog/addMenuMode"
import { ComboboxStyleProvider, useComboboxStyle } from "@/components/product-catalog/comboboxStyle"
import { useMerchantComponents } from "@/components/product-catalog/merchantComponents"
import { FocusedFieldProvider } from "@/components/product-catalog/FocusedFieldContext"
import type { PricingPlanRow, ProductRow } from "@/components/product-catalog/productCatalogPage.types"
import { cn } from "@/lib/utils"
import { PRODUCT_CATALOG_STORAGE_KEY, PRICING_PLAN_STORAGE_KEY } from "@/lib/product-catalog-storage"
import { getFullBillingFlowEdges, getFlowOmissions } from "@/components/creation-workspace/workflowConfig"

type CatalogItem = ({ kind: "product" } & ProductRow) | ({ kind: "plan" } & PricingPlanRow)

type ProductCatalogLayoutProps = {
  t: (key: string) => string

  addProductButtonRef: RefObject<HTMLButtonElement | null>
  onToggleAddProductPopover: () => void
  onAddPricingPlan: () => void
  onOpenFlow?: (flow: string) => void
  activeBillingView: string | null
  billingViewContent?: ReactNode
  subscriptionsLabel?: string

  isAddProductPopoverOpen: boolean
  addProductPopoverPosition: PopoverPosition | null
  addProductPopoverRef: RefObject<HTMLDivElement | null>
  addProductPromptRef: RefObject<HTMLTextAreaElement | null>
  addProductPromptMode: boolean
  addProductPromptText: string
  isRoutingPrompt: boolean
  onChangeAddProductPromptText: (next: string) => void
  onCancelAddProductPromptMode: () => void
  onEnterAddProductPromptMode: () => void
  onSendAddProductPrompt: () => void
  onCreateSingleProduct: () => void
  onCreatePricingPlan: () => void

  catalogItems: CatalogItem[]
  onCatalogItemClick: (item: CatalogItem) => void

  children: ReactNode
}

export function ProductCatalogLayout({
  t,
  addProductButtonRef,
  onToggleAddProductPopover,
  onAddPricingPlan,
  onOpenFlow,
  activeBillingView,
  billingViewContent,
  subscriptionsLabel,
  isAddProductPopoverOpen,
  addProductPopoverPosition,
  addProductPopoverRef,
  addProductPromptRef,
  addProductPromptMode,
  addProductPromptText,
  isRoutingPrompt,
  onChangeAddProductPromptText,
  onCancelAddProductPromptMode,
  onEnterAddProductPromptMode,
  onSendAddProductPrompt,
  onCreateSingleProduct,
  onCreatePricingPlan,
  catalogItems,
  onCatalogItemClick,
  children,
}: ProductCatalogLayoutProps) {
  return (
    <IconographyProvider>
      <ComboboxStyleProvider>
      <AddMenuModeProvider>
      <FormPanelSideProvider>
        <ShowAdditionalNodesProvider>
          <LayoutDirectionProvider>
            <LayoutModeProvider>
              <ShowFieldHelperProvider>
                <MapInteractivityProvider>
                <ShowAddPlanProvider>
                <BulkEditTransitionProvider>
                <CascadeAlignmentProvider>
                <OnboardingModeProvider>
                <SidebarDarkModeProvider>
                <FocusedFieldProvider>
        <main
          className="min-h-screen bg-white"
          style={{
            fontFamily: '"SF Pro Text", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          }}
        >
          <div className="flex min-h-screen bg-white text-[#353A44]">
            <CatalogSidebarSkeleton onOpenFlow={onOpenFlow} activeFlow={activeBillingView} subscriptionsLabel={subscriptionsLabel} />

            <div className="flex flex-1 flex-col">
              <CatalogChromeHeaderSkeleton />

              <div className="flex-1 px-10 py-10">
                {activeBillingView ? (
                  billingViewContent
                ) : (
                  <>
                    <ProductCatalogHeaderRow
                      t={t}
                      addProductButtonRef={addProductButtonRef}
                      onAddPricingPlan={onAddPricingPlan}
                    />

                    {isAddProductPopoverOpen && addProductPopoverPosition && (
                      <AddProductPopover
                        t={t}
                        position={addProductPopoverPosition}
                        popoverRef={addProductPopoverRef}
                        promptRef={addProductPromptRef}
                        isPromptMode={addProductPromptMode}
                        promptText={addProductPromptText}
                        isRoutingPrompt={isRoutingPrompt}
                        onChangePromptText={onChangeAddProductPromptText}
                        onCancelPromptMode={onCancelAddProductPromptMode}
                        onEnterPromptMode={onEnterAddProductPromptMode}
                        onSendPrompt={onSendAddProductPrompt}
                        onCreateSingleProduct={onCreateSingleProduct}
                        onCreatePricingPlan={onCreatePricingPlan}
                      />
                    )}

                    <CatalogTableToolbarSkeleton />
                    <ProductTable items={catalogItems} onItemClick={onCatalogItemClick} />
                  </>
                )}
              </div>
            </div>

            {children}

            <FloatingOptionsPanel />
          </div>
        </main>
                </FocusedFieldProvider>
                </SidebarDarkModeProvider>
                </OnboardingModeProvider>
                </CascadeAlignmentProvider>
                </BulkEditTransitionProvider>
                </ShowAddPlanProvider>
                </MapInteractivityProvider>
              </ShowFieldHelperProvider>
            </LayoutModeProvider>
          </LayoutDirectionProvider>
        </ShowAdditionalNodesProvider>
      </FormPanelSideProvider>
      </AddMenuModeProvider>
      </ComboboxStyleProvider>
    </IconographyProvider>
  )
}

function FloatingOptionsPanel() {
  const { mode, setMode } = useIconographyMode()
  const { side, setSide } = useFormPanelSide()
  const { showAdditionalNodes, setShowAdditionalNodes } = useShowAdditionalNodes()
  const { direction, setDirection } = useLayoutDirection()
  const { cascadeAlignment, setCascadeAlignment } = useCascadeAlignment()
  const { layoutMode, setLayoutMode } = useLayoutMode()
  const { showFieldHelper, setShowFieldHelper } = useShowFieldHelper()
  const { mapInteractive, setMapInteractive } = useMapInteractivity()
  const { showAddPlan, setShowAddPlan } = useShowAddPlan()
  const { bulkEditTransition, setBulkEditTransition } = useBulkEditTransition()
  const { hasComponents, setHasComponents } = useMerchantComponents()
  const { onboardingMode, setOnboardingMode } = useOnboardingMode()
  const { sidebarDarkMode, setSidebarDarkMode } = useSidebarDarkMode()
  const { addMenuMode, setAddMenuMode } = useAddMenuMode()
  const { comboboxStyle, setComboboxStyle } = useComboboxStyle()
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const [showFlows, setShowFlows] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const currentLanguage = i18n.language
  const [isLocalhost, setIsLocalhost] = useState(false)

  useEffect(() => {
    setIsLocalhost(window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  }, [])

  // Match the gating used by CatalogSidebarSkeleton: only show the simulated
  // pricing-plan shortcuts off-Vercel (i.e. local dev or any other host).
  const isVercelDeployment = Boolean(process.env.NEXT_PUBLIC_VERCEL_ENV)

  // Cmd+/ keyboard shortcut to toggle options panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (!rootRef.current?.contains(target)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
  }

  return (
    <div ref={rootRef} className="fixed bottom-[16px] left-[16px] z-[1100]">
      {open ? (
        <div className="mb-[8px] w-[580px] rounded-[12px] border border-[#EBEEF1] bg-white p-[12px] shadow-[0px_15px_35px_0px_rgba(48,49,61,0.08),0px_5px_15px_0px_rgba(0,0,0,0.12)]">
          <div className="flex items-center justify-between">
            <div className="text-[12px] font-[700] tracking-[0.12px] text-[#353A44]">{t("Options")}</div>
            <button
              type="button"
              className="rounded-[6px] px-2 py-1 text-[12px] font-[500] text-[#596171] hover:bg-[#F5F6F8]"
              onClick={() => setOpen(false)}
            >
              {t("Close")}
            </button>
          </div>
          <div className="mt-[10px]">
            <div className="rounded-[8px] bg-[#EBEEF1] p-[6px]">
              <div className="flex items-center">
                {(["color", "no-color"] as const).map((opt) => {
                  const selected = opt === mode
                  const label = opt === "color" ? t("Color") : t("No color")
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setMode(opt)}
                      className={cn(
                        "flex-1 rounded-[6px] px-[12px] py-[6px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] transition-colors",
                        selected ? "bg-white text-[#353A44]" : "text-[#596171] hover:bg-[#D4DEE9] hover:text-[#353A44]"
                      )}
                      aria-pressed={selected}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          <div className="mt-[10px]">
            <div className="rounded-[8px] bg-[#EBEEF1] p-[6px]">
              <div className="flex items-center">
                {(["en", "de"] as const).map((lng) => {
                  const selected = lng === currentLanguage
                  const label = lng === "en" ? t("English") : t("German")
                  return (
                    <button
                      key={lng}
                      type="button"
                      onClick={() => changeLanguage(lng)}
                      className={cn(
                        "flex-1 rounded-[6px] px-[12px] py-[6px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] transition-colors",
                        selected ? "bg-white text-[#353A44]" : "text-[#596171] hover:bg-[#D4DEE9] hover:text-[#353A44]"
                      )}
                      aria-pressed={selected}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          <div className="mt-[10px]">
            <div className="rounded-[8px] bg-[#EBEEF1] p-[6px]">
              <div className="grid grid-cols-4 gap-[6px]">
                {(["fixed-left", "fixed-right", "float-left", "float-right"] as const).map((opt) => {
                  const selected = opt === side
                  const label =
                    opt === "float-left"
                      ? t("Float left")
                      : opt === "fixed-left"
                        ? t("Fixed left")
                        : opt === "fixed-right"
                          ? t("Fixed right")
                          : t("Float right")
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setSide(opt)}
                      className={cn(
                        "w-full rounded-[6px] px-[10px] py-[6px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] transition-colors whitespace-nowrap",
                        selected ? "bg-white text-[#353A44]" : "text-[#596171] hover:bg-[#D4DEE9] hover:text-[#353A44]"
                      )}
                      aria-pressed={selected}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          <div className="mt-[10px]">
            <div className="rounded-[8px] bg-[#EBEEF1] p-[6px]">
              <div className="flex items-center">
                {(["vertical", "horizontal"] as const).map((opt) => {
                  const selected = opt === direction
                  const label = opt === "vertical" ? t("Vertical") : t("Horizontal")
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setDirection(opt)}
                      className={cn(
                        "flex-1 rounded-[6px] px-[12px] py-[6px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] transition-colors",
                        selected ? "bg-white text-[#353A44]" : "text-[#596171] hover:bg-[#D4DEE9] hover:text-[#353A44]"
                      )}
                      aria-pressed={selected}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          <div className="mt-[10px]">
            <div className="rounded-[8px] bg-[#EBEEF1] p-[6px]">
              <div className="flex items-center">
                {(["top", "center"] as const).map((opt) => {
                  const selected = opt === cascadeAlignment
                  const label = opt === "top" ? t("Top") : t("Center")
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setCascadeAlignment(opt)}
                      className={cn(
                        "flex-1 rounded-[6px] px-[12px] py-[6px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] transition-colors",
                        selected ? "bg-white text-[#353A44]" : "text-[#596171] hover:bg-[#D4DEE9] hover:text-[#353A44]"
                      )}
                      aria-pressed={selected}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          <div className="mt-[10px]">
            <div className="rounded-[8px] bg-[#EBEEF1] p-[6px]">
              <div className="flex items-center">
                {(["A", "B"] as const).map((opt) => {
                  const selected = opt === layoutMode
                  const label = opt === "A" ? t("Layout A") : t("Layout B")
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setLayoutMode(opt)}
                      className={cn(
                        "flex-1 rounded-[6px] px-[12px] py-[6px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] transition-colors",
                        selected ? "bg-white text-[#353A44]" : "text-[#596171] hover:bg-[#D4DEE9] hover:text-[#353A44]"
                      )}
                      aria-pressed={selected}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          <div className="mt-[10px]">
            <div className="rounded-[8px] bg-[#EBEEF1] p-[6px]">
              <div className="flex items-center">
                {([false, true] as const).map((opt) => {
                  const selected = opt === mapInteractive
                  const label = opt ? t("Interactive map") : t("Static map")
                  return (
                    <button
                      key={String(opt)}
                      type="button"
                      onClick={() => setMapInteractive(opt)}
                      className={cn(
                        "flex-1 rounded-[6px] px-[12px] py-[6px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] transition-colors",
                        selected ? "bg-white text-[#353A44]" : "text-[#596171] hover:bg-[#D4DEE9] hover:text-[#353A44]"
                      )}
                      aria-pressed={selected}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          <div className="mt-[10px]">
            <div className="rounded-[8px] bg-[#EBEEF1] p-[6px]">
              <div className="flex items-center">
                {([true, false] as const).map((opt) => {
                  const selected = opt === showAddPlan
                  const label = opt ? t("Show add plan") : t("Hide add plan")
                  return (
                    <button
                      key={String(opt)}
                      type="button"
                      onClick={() => setShowAddPlan(opt)}
                      className={cn(
                        "flex-1 rounded-[6px] px-[12px] py-[6px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] transition-colors",
                        selected ? "bg-white text-[#353A44]" : "text-[#596171] hover:bg-[#D4DEE9] hover:text-[#353A44]"
                      )}
                      aria-pressed={selected}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          <div className="mt-[10px]">
            <div className="rounded-[8px] bg-[#EBEEF1] p-[6px]">
              <div className="flex items-center">
                {(["expand", "inline", "header"] as const).map((opt) => {
                  const selected = opt === bulkEditTransition
                  const label = opt === "expand" ? t("Expand") : opt === "inline" ? t("Inline") : t("Header")
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setBulkEditTransition(opt)}
                      className={cn(
                        "flex-1 rounded-[6px] px-[12px] py-[6px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] transition-colors",
                        selected ? "bg-white text-[#353A44]" : "text-[#596171] hover:bg-[#D4DEE9] hover:text-[#353A44]"
                      )}
                      aria-pressed={selected}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          <div className="mt-[10px]">
            <div className="rounded-[8px] bg-[#EBEEF1] p-[6px]">
              <div className="flex items-center">
                {([false, true] as const).map((opt) => {
                  const selected = opt === hasComponents
                  const label = opt ? t("Has components") : t("No components")
                  return (
                    <button
                      key={String(opt)}
                      type="button"
                      onClick={() => setHasComponents(opt)}
                      className={cn(
                        "flex-1 rounded-[6px] px-[12px] py-[6px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] transition-colors",
                        selected ? "bg-white text-[#353A44]" : "text-[#596171] hover:bg-[#D4DEE9] hover:text-[#353A44]"
                      )}
                      aria-pressed={selected}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          <div className="mt-[10px]">
            <div className="rounded-[8px] bg-[#EBEEF1] p-[6px]">
              <div className="flex items-center">
                {(["tips", "form"] as const).map((opt) => {
                  const selected = opt === onboardingMode
                  const label = opt === "tips" ? t("Plan type") : t("Form")
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setOnboardingMode(opt)}
                      className={cn(
                        "flex-1 rounded-[6px] px-[12px] py-[6px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] transition-colors",
                        selected ? "bg-white text-[#353A44]" : "text-[#596171] hover:bg-[#D4DEE9] hover:text-[#353A44]"
                      )}
                      aria-pressed={selected}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          <div className="mt-[10px]">
            <div className="rounded-[8px] bg-[#EBEEF1] p-[6px]">
              <div className="flex items-center">
                {([true, false] as const).map((opt) => {
                  const selected = opt === sidebarDarkMode
                  const label = opt ? t("Dark nav") : t("Light nav")
                  return (
                    <button
                      key={String(opt)}
                      type="button"
                      onClick={() => setSidebarDarkMode(opt)}
                      className={cn(
                        "flex-1 rounded-[6px] px-[12px] py-[6px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] transition-colors",
                        selected ? "bg-white text-[#353A44]" : "text-[#596171] hover:bg-[#D4DEE9] hover:text-[#353A44]"
                      )}
                      aria-pressed={selected}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          <div className="mt-[10px]">
            <div className="rounded-[8px] bg-[#EBEEF1] p-[6px]">
              <div className="flex items-center">
                {(["contextual", "general"] as const).map((opt) => {
                  const selected = opt === addMenuMode
                  const label = opt === "contextual" ? t("Context-aware add") : t("General add")
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setAddMenuMode(opt)}
                      className={cn(
                        "flex-1 rounded-[6px] px-[12px] py-[6px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] transition-colors",
                        selected ? "bg-white text-[#353A44]" : "text-[#596171] hover:bg-[#D4DEE9] hover:text-[#353A44]"
                      )}
                      aria-pressed={selected}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          <div className="mt-[10px]">
            <div className="rounded-[8px] bg-[#EBEEF1] p-[6px]">
              <div className="grid grid-cols-3 gap-[6px]">
                {(["combobox", "sel-link", "sel-btn", "sel-clear", "sel-segmented", "create-first"] as const).map((opt) => {
                  const selected = opt === comboboxStyle
                  const labels: Record<string, string> = {
                    "combobox": "Combo",
                    "sel-link": "S: Link",
                    "sel-btn": "S: Btn",
                    "sel-clear": "S: Clear",
                    "sel-segmented": "S: Seg",
                    "create-first": "Create 1st",
                  }
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setComboboxStyle(opt)}
                      className={cn(
                        "rounded-[6px] px-[6px] py-[6px] text-[11px] font-[500] leading-[14px] tracking-[-0.024px] transition-colors text-center",
                        selected ? "bg-white text-[#353A44]" : "text-[#596171] hover:bg-[#D4DEE9] hover:text-[#353A44]"
                      )}
                      aria-pressed={selected}
                    >
                      {labels[opt]}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          {!isVercelDeployment && (
            <div className="mt-[10px] flex gap-[8px]">
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("simulate-loops"))
                  setOpen(false)
                }}
                className="flex flex-1 items-center justify-center gap-[6px] rounded-[8px] bg-[#675DFF] px-[12px] py-[8px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-white transition-colors hover:bg-[#5B52F0]"
              >
                <LoopsBrandIcon className="h-[14px] w-[14px] shrink-0" />
                {t("Loops")}
              </button>
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("simulate-cursor"))
                  setOpen(false)
                }}
                className="flex flex-1 items-center justify-center gap-[6px] rounded-[8px] bg-[#675DFF] px-[12px] py-[8px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-white transition-colors hover:bg-[#5B52F0]"
              >
                <CursorBrandIcon className="h-[14px] w-[14px] shrink-0" />
                {t("Cursor")}
              </button>
            </div>
          )}
          <div className="mt-[10px]">
            <button
              type="button"
              className="flex w-full items-center justify-center gap-[6px] rounded-[8px] border border-[#D4DEE9] bg-white px-[12px] py-[8px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#1A2C44] transition-colors hover:bg-[#F5F7FA]"
              onClick={() => setShowFlows(true)}
            >
              {t("Connected flows")}
            </button>
          </div>
          <div className="mt-[10px]">
            <button
              type="button"
              onClick={() => {
                if (window.confirm(t("Are you sure you want to delete all products and plans? This cannot be undone."))) {
                  window.localStorage.removeItem(PRODUCT_CATALOG_STORAGE_KEY)
                  window.localStorage.removeItem(PRICING_PLAN_STORAGE_KEY)
                  window.location.reload()
                }
              }}
              className="w-full rounded-[8px] bg-[#DF1B41] px-[12px] py-[8px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-white transition-colors hover:bg-[#C11638]"
            >
              {t("Delete all products")}
            </button>
          </div>
        </div>
      ) : null}

      {showFlows && <ConnectedFlowsModal onClose={() => setShowFlows(false)} />}
    </div>
  )
}

function ConnectedFlowsModal({ onClose }: { onClose: () => void }) {
  const edges = getFullBillingFlowEdges()
  const omissions = getFlowOmissions()

  const grouped = new Map<string, { toLabel: string; reason: string }[]>()
  for (const e of edges) {
    const list = grouped.get(e.fromLabel) ?? []
    list.push({ toLabel: e.toLabel, reason: e.reason })
    grouped.set(e.fromLabel, list)
  }

  const uncommonByFrom = new Map<string, { notSuggested: string; rationale: string }[]>()
  const omissionsByFrom = new Map<string, { notSuggested: string; reason: string; rationale: string }[]>()
  for (const o of omissions) {
    if (o.reason === "uncommon") {
      const list = uncommonByFrom.get(o.fromLabel) ?? []
      list.push({ notSuggested: o.notSuggested, rationale: o.rationale })
      uncommonByFrom.set(o.fromLabel, list)
    } else {
      const list = omissionsByFrom.get(o.fromLabel) ?? []
      list.push({ notSuggested: o.notSuggested, reason: o.reason, rationale: o.rationale })
      omissionsByFrom.set(o.fromLabel, list)
    }
  }

  const allKinds = Array.from(new Set([...Array.from(grouped.keys()), ...Array.from(uncommonByFrom.keys()), ...Array.from(omissionsByFrom.keys())]))

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 flex max-h-[80vh] w-full max-w-[520px] flex-col overflow-hidden rounded-[12px] border border-[#EBEEF1] bg-white shadow-[0px_15px_35px_0px_rgba(48,49,61,0.08),0px_5px_15px_0px_rgba(0,0,0,0.12)]">
        <div className="flex items-center justify-between border-b border-[#EBEEF1] px-[20px] py-[14px]">
          <h2 className="text-[14px] font-[600] leading-[20px] tracking-[-0.07px] text-[#1A2C44]">
            Connected flows
          </h2>
          <button
            type="button"
            className="rounded-[6px] px-[8px] py-[4px] text-[12px] font-[500] text-[#596171] hover:bg-[#F5F6F8] transition-colors"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-[20px] py-[16px]">
          <div className="mb-[16px] flex flex-col gap-[6px] text-[12px] font-[400] leading-[18px] text-[#6C7688]">
            <p>Suggested (green) flows are what you'd naturally do next. Uncommon (orange) flows are possible but not typical. Not suggested (red) flows go backwards, skip steps, or are unrelated.</p>
          </div>

          <div className="flex flex-col gap-[20px]">
            {allKinds.map((from) => {
              const targets = grouped.get(from) ?? []
              const uncommon = uncommonByFrom.get(from) ?? []
              const excluded = omissionsByFrom.get(from) ?? []
              return (
                <div key={from} className="flex flex-col gap-[6px]">
                  <p className="text-[13px] font-[600] leading-[16px] tracking-[-0.02px] text-[#1A2C44]">
                    {from}
                  </p>

                  {targets.length > 0 && (
                    <div className="flex flex-col gap-[4px]">
                      {targets.map((t, i) => (
                        <div key={`inc-${i}`} className="flex items-start gap-[6px]">
                          <span className="shrink-0 text-[12px] leading-[18px]">✅</span>
                          <p className="text-[12px] font-[400] leading-[18px] text-[#596171]">
                            <span className="font-[500] text-[#1A2C44]">{t.toLabel}</span>
                            {" — "}{t.reason}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {uncommon.length > 0 && (
                    <div className="mt-[2px] flex flex-col gap-[4px]">
                      {uncommon.map((u, i) => (
                        <div key={`unc-${i}`} className="flex items-start gap-[6px]">
                          <span className="shrink-0 text-[12px] leading-[18px]">🟠</span>
                          <p className="text-[12px] font-[400] leading-[18px] text-[#6C7688]">
                            <span className="font-[500] text-[#596171]">{u.notSuggested}</span>
                            <span className="ml-[6px] inline-block rounded-[3px] bg-[#FFF6ED] px-[4px] py-[1px] text-[10px] font-[500] leading-[14px] text-[#B54708]">
                              uncommon
                            </span>
                            {" "}{u.rationale}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {excluded.length > 0 && (
                    <div className="mt-[2px] flex flex-col gap-[4px]">
                      {excluded.map((o, i) => (
                        <div key={`exc-${i}`} className="flex items-start gap-[6px]">
                          <span className="shrink-0 text-[12px] leading-[18px]">🚫</span>
                          <p className="text-[12px] font-[400] leading-[18px] text-[#6C7688]">
                            <span className="font-[500] text-[#596171]">{o.notSuggested}</span>
                            <span className={`ml-[6px] inline-block rounded-[3px] px-[4px] py-[1px] text-[10px] font-[500] leading-[14px] ${
                              o.reason === "backwards" ? "bg-[#FEF3F2] text-[#B42318]"
                              : o.reason === "skips-step" ? "bg-[#FFF6ED] text-[#B54708]"
                              : "bg-[#F2F4F7] text-[#667085]"
                            }`}>
                              {o.reason === "backwards" ? "backwards" : o.reason === "skips-step" ? "skips step" : "unrelated"}
                            </span>
                            {" "}{o.rationale}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
