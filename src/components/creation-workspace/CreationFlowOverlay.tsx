'use client'

import { useEffect, useMemo, useState } from "react"
import { CreationWorkspace } from "@/components/creation-workspace/CreationWorkspace"
import { SimpleCreationHeader } from "@/components/creation-workspace/SimpleCreationHeader"
import { NextObjectSuggestions } from "@/components/creation-workspace/NextObjectSuggestions"
import { InvoicePreview } from "@/components/creation-workspace/InvoicePreview"
import { SubscriptionInvoicePreview } from "@/components/creation-workspace/SubscriptionInvoicePreview"
import { ValidationPanel } from "@/components/creation-workspace/ValidationPanel"
import { PreviewSwitcher } from "@/components/creation-workspace/PreviewSwitcher"
import { PreviewEyeIcon } from "@/components/ProductCatalogIcons"

import { useWorkflowState, computeAddOptionsFromMenuKinds } from "@/components/creation-workspace/useWorkflowState"
import {
  createInvoiceWorkflowConfig,
  createSubscriptionWorkflowConfig,
  createUsageBillingWorkflowConfig,
  createCustomerEntryWorkflowConfig,
  createProductEntryWorkflowConfig,
  createCouponEntryWorkflowConfig,
  getPrimaryLabel,
} from "@/components/creation-workspace/workflowConfig"
import { useAddMenuMode } from "@/components/product-catalog/addMenuMode"
import { InvoiceForm } from "@/components/creation-workspace/forms/InvoiceForm"
import { CustomerForm } from "@/components/creation-workspace/forms/CustomerForm"
import { ProductForm } from "@/components/creation-workspace/forms/ProductForm"
import { CouponForm } from "@/components/creation-workspace/forms/CouponForm"
import { MeterForm } from "@/components/creation-workspace/forms/MeterForm"
import { SubscriptionForm } from "@/components/creation-workspace/forms/SubscriptionForm"
import { PricingPlanForm } from "@/components/creation-workspace/forms/PricingPlanForm"

const fullBillingForms = {
  invoice: InvoiceForm,
  customer: CustomerForm,
  product: ProductForm,
  coupon: CouponForm,
  meter: MeterForm,
  subscription: SubscriptionForm,
  pricingPlan: PricingPlanForm,
  invoicePreview: InvoicePreview,
  subscriptionPreview: SubscriptionInvoicePreview,
}

type CreationFlowOverlayProps = {
  flow: string
  onClose: () => void
}

export function CreationFlowOverlay({ flow, onClose }: CreationFlowOverlayProps) {
  const { addMenuMode } = useAddMenuMode()

  const config = useMemo(() => {
    switch (flow) {
      case "invoices":
        return createInvoiceWorkflowConfig({
          invoice: InvoiceForm,
          customer: CustomerForm,
          product: ProductForm,
          coupon: CouponForm,
          meter: MeterForm,
          invoicePreview: InvoicePreview,
        })
      case "subscriptions":
        return createSubscriptionWorkflowConfig({
          subscription: SubscriptionForm,
          customer: CustomerForm,
          pricingPlan: PricingPlanForm,
          product: ProductForm,
          coupon: CouponForm,
          subscriptionPreview: SubscriptionInvoicePreview,
        })
      case "usage-billing":
        return createUsageBillingWorkflowConfig({
          meter: MeterForm,
          product: ProductForm,
          customer: CustomerForm,
        })
      case "customers":
        return createCustomerEntryWorkflowConfig(fullBillingForms)
      case "products":
        return createProductEntryWorkflowConfig(fullBillingForms)
      case "coupons":
        return createCouponEntryWorkflowConfig(fullBillingForms)
      default:
        return createInvoiceWorkflowConfig({
          invoice: InvoiceForm,
          customer: CustomerForm,
          product: ProductForm,
          coupon: CouponForm,
          meter: MeterForm,
          invoicePreview: InvoicePreview,
        })
    }
  }, [flow])

  const workflow = useWorkflowState(config)

  const suggestions = workflow.availableNextSuggestions().map((s) => ({
    actionLabel: s.actionLabel,
    reason: s.reason,
    onClick: () => workflow.addObject(s.kind),
  }))

  // Sync newly created object names onto invoice / subscription forms
  useEffect(() => {
    const invoiceObj = workflow.objects.find((o) => o.kind === "invoice")
    const subscriptionObj = workflow.objects.find((o) => o.kind === "subscription")
    const customerObj = workflow.objects.find((o) => o.kind === "customer")
    const productObj = workflow.objects.find((o) => o.kind === "product")
    const couponObj = workflow.objects.find((o) => o.kind === "coupon")

    if (invoiceObj) {
      const updates: Record<string, any> = {}
      if (invoiceObj.data.customerId === "_new" && customerObj?.data.name) {
        updates.customerName = customerObj.data.name
      }
      if (invoiceObj.data.productId === "_new" && productObj?.data.name) {
        updates.productName = productObj.data.name
      }
      if (couponObj) {
        if (!invoiceObj.data.couponId || invoiceObj.data.couponId === "_new") {
          updates.couponId = "_new"
          if (couponObj.data.name) updates.couponName = couponObj.data.name
          if (couponObj.data.amount) updates.couponAmount = couponObj.data.amount
          if (couponObj.data.discountType) updates.couponDiscountType = couponObj.data.discountType
        }
      }
      if (Object.keys(updates).length > 0) {
        workflow.updateObjectData(invoiceObj.id, updates)
      }
    }

    if (subscriptionObj) {
      const updates: Record<string, any> = {}
      if (subscriptionObj.data.customerId === "_new" && customerObj?.data.name) {
        updates.customerName = customerObj.data.name
      }
      if (subscriptionObj.data.productId === "_new" && productObj?.data.name) {
        updates.productName = productObj.data.name
      }
      if (Object.keys(updates).length > 0) {
        workflow.updateObjectData(subscriptionObj.id, updates)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync when object list / data changes; workflow methods are stable per config
  }, [workflow.objects])

  const addOptions = useMemo(() => {
    const menuKinds =
      addMenuMode === "general"
        ? Object.keys(config.objectKinds)
        : config.addMenuKinds ?? Object.keys(config.objectKinds)
    return computeAddOptionsFromMenuKinds(config, workflow.objects, menuKinds)
  }, [addMenuMode, config, workflow.objects])

  const activeKind = workflow.activeObject?.kind
  const FormComponent = activeKind ? config.objectKinds[activeKind]?.formComponent : null
  const kindLabel = activeKind ? config.objectKinds[activeKind]?.label ?? "Object" : "Object"
  const activeDataName = workflow.activeObject?.data?.name as string | undefined
  const editorTitle = activeDataName?.trim() ? activeDataName.trim() : `New ${kindLabel.toLowerCase()}`

  const availablePreviews = useMemo(() => {
    const seen = new Set<string>()
    const previews: { key: string; label: string }[] = []
    for (const obj of workflow.objects) {
      if (seen.has(obj.kind)) continue
      if (config.objectKinds[obj.kind]?.previewComponent) {
        seen.add(obj.kind)
        previews.push({ key: obj.kind, label: config.objectKinds[obj.kind].label })
      }
    }
    return previews
  }, [workflow.objects, config])

  const [activePreviewKey, setActivePreviewKey] = useState<string>(config.initialObjectKind)

  const resolvedPreviewKey =
    availablePreviews.find((p) => p.key === activePreviewKey)?.key ??
    availablePreviews[0]?.key ??
    config.initialObjectKind

  const renderPreview = () => {
    const kindConfig = config.objectKinds[resolvedPreviewKey]
    const PreviewComp = kindConfig?.previewComponent
    if (!PreviewComp) return null
    const obj = workflow.objects.find((o) => o.kind === resolvedPreviewKey)
    return (
      <PreviewComp data={obj?.data ?? {}} allObjects={workflow.objects} config={config} />
    )
  }

  const switcherOptions = availablePreviews.map((p) => ({
    key: p.key,
    label: `${p.label} preview`,
    icon: (
      <PreviewEyeIcon
        className="h-[12px] w-[12px] shrink-0"
        style={{ color: resolvedPreviewKey === p.key ? "#474E5A" : "#667691" }}
      />
    ),
  }))

  const hasErrors = workflow.validationErrors.length > 0
  const errorObjectIds = useMemo(
    () => new Set(workflow.validationErrors.map((e) => e.objectId)),
    [workflow.validationErrors]
  )
  const activeErrorFields = useMemo(
    () => new Set(
      workflow.validationErrors
        .filter((e) => e.objectId === workflow.activeObjectId)
        .map((e) => e.field)
    ),
    [workflow.validationErrors, workflow.activeObjectId]
  )

  const hasPreview = availablePreviews.length > 0

  const validationPanel = hasErrors ? (
    <ValidationPanel
      errors={workflow.validationErrors}
      config={config}
      onNavigateToError={(objectId) => {
        workflow.setActiveObject(objectId)
      }}
      onDismiss={workflow.clearValidationErrors}
    />
  ) : null

  const previewPanel = (
    <>
      {validationPanel}
      {hasPreview && (
        <>
          {availablePreviews.length > 1 && (
            <PreviewSwitcher
              options={switcherOptions}
              activeKey={resolvedPreviewKey}
              onChange={setActivePreviewKey}
            />
          )}
          {renderPreview()}
        </>
      )}
    </>
  )

  const flowTitles: Record<string, string> = {
    invoices: "Create invoice",
    subscriptions: "Create subscription",
    "usage-billing": "Set up usage-based billing",
    customers: "Create customer",
    products: "Create product",
    coupons: "Create coupon",
  }

  const isCompactEntryFlow = flow === "customers" || flow === "products" || flow === "coupons"
  const presentation = isCompactEntryFlow && !hasPreview ? "modal" : "fullscreen"
  const workspaceMode = hasPreview ? "related" : "single"

  return (
    <CreationWorkspace
      mode={workspaceMode}
      presentation={presentation}
      isOpen={true}
      header={
        <SimpleCreationHeader
          title={flowTitles[flow] ?? "Create"}
          onDiscard={onClose}
          onSubmit={workflow.handlePrimaryAction}
          submitLabel={getPrimaryLabel(config)}
          discardLabel={config.discardLabel}
          onAddObject={(kind) => workflow.addObject(kind)}
          addOptions={addOptions}
          tabs={workflow.objects.map((obj) => ({
            id: obj.id,
            kind: obj.kind,
            label: config.objectKinds[obj.kind]?.label ?? obj.kind,
          }))}
          activeTabId={workflow.activeObjectId}
          onSelectTab={workflow.setActiveObject}
          errorTabIds={hasErrors ? errorObjectIds : undefined}
        />
      }
      editor={
        <div className="relative min-h-[120px]">
          {presentation === "modal" && validationPanel}
          <div key={`form-${workflow.activeObjectId}`}>
            <div className="mb-[16px] flex items-center gap-[8px]">
              <h2 className="text-[14px] font-[600] leading-[20px] tracking-[-0.07px] text-[#1A2C44]">
                {editorTitle}
              </h2>
            </div>

            {FormComponent && workflow.activeObject && (
              <FormComponent
                data={workflow.activeObject.data}
                onChange={(data: Record<string, any>) => {
                  workflow.updateObjectData(workflow.activeObject!.id, data)
                  if (hasErrors) workflow.clearValidationErrors()
                }}
                errorFields={activeErrorFields.size > 0 ? activeErrorFields : undefined}
                onAddObject={(kind: string) => workflow.addObject(kind)}
              />
            )}
            <NextObjectSuggestions suggestions={suggestions} config={config} />
          </div>
        </div>
      }
      preview={previewPanel}
    />
  )
}
