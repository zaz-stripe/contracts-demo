'use client'

import { cn } from "@/lib/utils"
import { FormRow } from "@/components/FormRow"
import { SegmentedControl } from "@/components/SegmentedControl"
import { Selector } from "@/components/Selector"
import { textFieldInputClasses, servicingPeriodOptions } from "@/components/product-catalog/productCatalogPage.constants"
import { ProductPriceForm, PriceEditForm, PriceGroupEditForm, PlanEditForm, CreditGrantEditForm } from "@/components/product-catalog/forms/SharedItemForms"
import type { TreeNodeId } from "@/components/product-catalog/CatalogTreeNav"

type PriceInfo = { amount?: string; cadence?: string; name?: string; unitLabel?: string }

type SubscriptionEditorPanelProps = {
  activeNode: TreeNodeId
  activeNodeName?: string
  customer: string
  duration: string
  products: string[]
  onDeleteItem?: (id: string) => void
  activePriceData?: PriceInfo
  onFieldChange?: (nodeType: string, nodeId: string, field: string, value: string) => void
}

function SubscriptionForm({ duration }: { duration: string }) {
  return (
    <div className="flex flex-col gap-[12px] min-w-0">
      <FormRow label="Duration">
        <SegmentedControl
          value={duration}
          onChange={() => {}}
          options={servicingPeriodOptions}
          getDisplayValue={(v) => v}
        />
      </FormRow>
      <FormRow label="Billing cycle anchor">
        <Selector
          ariaLabel="Billing cycle anchor"
          size="sm"
          value="Start of agreement"
          onChange={() => {}}
          options={["Start of agreement", "Start of month", "Custom date"]}
          getDisplayValue={(v) => v}
          buttonClassName="h-[30px] w-full px-[12px] py-[6px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] rounded-[6px]"
        />
      </FormRow>
      <FormRow label="Start date">
        <input type="text" defaultValue="Immediately" className={textFieldInputClasses} />
      </FormRow>
      <FormRow label="Collection method">
        <SegmentedControl
          value="Charge automatically"
          onChange={() => {}}
          options={["Charge automatically", "Send an invoice"]}
          getDisplayValue={(v) => v}
        />
      </FormRow>
      <FormRow label="Days until due">
        <Selector
          ariaLabel="Days until due"
          size="sm"
          value="30"
          onChange={() => {}}
          options={["7", "14", "30", "60", "90"]}
          getDisplayValue={(v) => `${v} days`}
          buttonClassName="h-[30px] w-full px-[12px] py-[6px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] rounded-[6px]"
        />
      </FormRow>
    </div>
  )
}

function CustomerForm({ customer }: { customer: string }) {
  return (
    <div className="flex flex-col gap-[12px] min-w-0">
      <FormRow label="Name">
        <input type="text" defaultValue={customer} readOnly className={cn(textFieldInputClasses, "bg-[#F7F8FA] text-[#596171] cursor-default")} />
      </FormRow>
      <FormRow label="Email">
        <input type="text" defaultValue={`${customer.toLowerCase().replace(/\s+/g, ".")}@example.com`} readOnly className={cn(textFieldInputClasses, "bg-[#F7F8FA] text-[#596171] cursor-default")} />
      </FormRow>
      <FormRow label="Tax status">
        <Selector
          ariaLabel="Tax status"
          size="sm"
          value="None"
          onChange={() => {}}
          options={["None", "Exempt", "Reverse charge"]}
          getDisplayValue={(v) => v}
          buttonClassName="h-[30px] w-full px-[12px] py-[6px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] rounded-[6px]"
        />
      </FormRow>
    </div>
  )
}

export function SubscriptionEditorPanel({ activeNode, activeNodeName, customer, duration, products, onDeleteItem, activePriceData, onFieldChange }: SubscriptionEditorPanelProps) {
  const headerLabel =
    activeNode.type === "subscription" ? "Subscription" :
    activeNode.type === "customer" ? (customer || "Customer") :
    activeNode.type === "price" ? "Price" :
    activeNodeName || (activeNode.type === "price-group" ? "Price group" : activeNode.type === "plan" ? "Plan" : "Product")

  const showDelete = activeNode.type !== "subscription" && activeNode.type !== "customer" && onDeleteItem

  return (
    <>
      {/* Panel header */}
      <div className="px-[16px] pt-[12px]">
        <div className="flex flex-col gap-[8px]">
          <div className="relative flex min-w-0 items-center justify-between">
            <p className="truncate text-[14px] font-[500] leading-[20px] tracking-[-0.15px] text-[#1A2C44]">{headerLabel}</p>
            {showDelete && (
              <div className="flex items-center gap-[8px] shrink-0">
                <button
                  type="button"
                  className="group flex h-[24px] w-[24px] items-center justify-center rounded-[6px] border border-[#D4DEE9] bg-white hover:bg-[#FEF4F6] hover:border-[#FAA9B8]"
                  aria-label="Delete"
                  onClick={() => onDeleteItem(activeNode.id!)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
                    <path fillRule="evenodd" clipRule="evenodd" d="M8.99998 3V1.5C8.99998 0.671573 8.3284 0 7.49998 0H4.49998C3.67155 0 2.99998 0.671573 2.99998 1.5V3H0.75C0.335786 3 0 3.33579 0 3.75C0 4.16421 0.335786 4.5 0.75 4.5H1.49998V10C1.49998 11.1046 2.39541 12 3.49998 12H8.49998C9.60454 12 10.5 11.1046 10.5 10V4.5H11.25C11.6642 4.5 12 4.16421 12 3.75C12 3.33579 11.6642 3 11.25 3H8.99998ZM7.49998 1.4H4.49998C4.44475 1.4 4.39998 1.44477 4.39998 1.5V3H7.59998V1.5C7.59998 1.44477 7.5552 1.4 7.49998 1.4ZM9.09998 4.5V10C9.09998 10.3314 8.83135 10.6 8.49998 10.6H3.49998C3.1686 10.6 2.89998 10.3314 2.89998 10V4.5H9.09998Z" fill="#3C4F69" className="group-hover:fill-[#E61947]"/>
                    <path fillRule="evenodd" clipRule="evenodd" d="M4.62498 5.5C4.97015 5.5 5.24998 5.77982 5.24998 6.125V8.875C5.24998 9.22018 4.97015 9.5 4.62498 9.5C4.2798 9.5 3.99998 9.22018 3.99998 8.875V6.125C3.99998 5.77982 4.2798 5.5 4.62498 5.5Z" fill="#3C4F69" className="group-hover:fill-[#E61947]"/>
                    <path fillRule="evenodd" clipRule="evenodd" d="M7.37498 5.5C7.72015 5.5 7.99998 5.77982 7.99998 6.125V8.875C7.99998 9.22018 7.72015 9.5 7.37498 9.5C7.0298 9.5 6.74998 9.22018 6.74998 8.875V6.125C6.74998 5.77982 7.0298 5.5 7.37498 5.5Z" fill="#3C4F69" className="group-hover:fill-[#E61947]"/>
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Form content (FormRow provides its own px-4) */}
      <div className="flex-1 overflow-y-auto pt-[14px] pb-[24px]">
        {activeNode.type === "subscription" && <SubscriptionForm duration={duration} />}
        {activeNode.type === "customer" && <CustomerForm customer={customer} />}
        {activeNode.type === "product" && <ProductPriceForm name={activeNodeName} amount={activePriceData?.amount} onChange={(field, value) => onFieldChange?.("product", activeNode.id!, field, value)} />}
        {activeNode.type === "price" && <PriceEditForm amount={activePriceData?.amount} cadence={activePriceData?.cadence} unitLabel={activePriceData?.unitLabel} onChange={(field, value) => onFieldChange?.("price", activeNode.id!, field, value)} />}
        {activeNode.type === "price-group" && <PriceGroupEditForm name={activeNodeName} onChange={(field, value) => onFieldChange?.("price-group", activeNode.id!, field, value)} />}
        {activeNode.type === "plan" && <PlanEditForm name={activeNodeName} onChange={(field, value) => onFieldChange?.("plan", activeNode.id!, field, value)} />}
        {activeNode.type === "credit-grant" && <CreditGrantEditForm name={activeNodeName} onChange={(field, value) => onFieldChange?.("credit-grant", activeNode.id!, field, value)} />}
      </div>
    </>
  )
}
