'use client'

import type { ReactNode } from "react"

import { SegmentedControl } from "@/components/SegmentedControl"
import { NoPreviewState } from "@/components/creation-workspace/NoPreviewState"
import type {
  RelatedFlowData,
  RelatedObjectKind,
  RelatedObjectSummary,
} from "@/components/object-creation-lab/useRelatedObjectFlow"

/** Kinds that render a dedicated preview panel in the lab (extend as needed). */
export type PreviewableKind = "invoice" | "product"

export function getAvailablePreviewKinds(objectOrder: RelatedObjectKind[]): PreviewableKind[] {
  return objectOrder.filter((k): k is PreviewableKind => k === "invoice" || k === "product")
}

const PREVIEW_TAB_LABEL: Record<PreviewableKind, string> = {
  invoice: "Invoice",
  product: "Product",
}

type RelatedFlowRightPanelProps = {
  availablePreviewKinds: PreviewableKind[]
  selectedPreviewKind: PreviewableKind | null
  onSelectPreviewKind: (kind: PreviewableKind) => void
  invoicePreview: ReactNode
  productPreview: ReactNode
}

export function RelatedFlowRightPanel({
  availablePreviewKinds,
  selectedPreviewKind,
  onSelectPreviewKind,
  invoicePreview,
  productPreview,
}: RelatedFlowRightPanelProps) {
  if (availablePreviewKinds.length === 0 || selectedPreviewKind === null) {
    return (
      <NoPreviewState
        hint="Edits happen in the form on the left. A live preview appears when your flow includes an object that has one—for example, add an invoice or a product."
      />
    )
  }

  const showTabs = availablePreviewKinds.length > 1

  const content = selectedPreviewKind === "invoice" ? invoicePreview : productPreview

  if (!showTabs) {
    return <div className="h-full min-h-0">{content}</div>
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-end border-b border-[#EBEEF1] bg-[#F8FAFB] px-[16px] py-[10px] sm:px-[20px]">
        <SegmentedControl
          className="w-full max-w-[240px]"
          value={selectedPreviewKind}
          onChange={onSelectPreviewKind}
          options={availablePreviewKinds}
          getDisplayValue={(k) => PREVIEW_TAB_LABEL[k]}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">{content}</div>
    </div>
  )
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[#F0F2F5] py-[8px] last:border-b-0">
      <span className="text-[12px] text-[#6C7688]">{label}</span>
      <span className="text-[12px] font-[500] text-[#353A44]">{value}</span>
    </div>
  )
}

export function InvoiceDocumentPreview({
  data,
  objects,
  embedded = false,
}: {
  data: RelatedFlowData
  objects: RelatedObjectSummary[]
  embedded?: boolean
}) {
  const hasCustomer = objects.some((o) => o.kind === "customer")
  const hasProduct = objects.some((o) => o.kind === "product")
  const hasCoupon = objects.some((o) => o.kind === "coupon")
  const hasMeter = objects.some((o) => o.kind === "meter")

  return (
    <div className={embedded ? "p-[20px] pt-[16px]" : "p-[20px]"}>
      {!embedded && <p className="text-[12px] font-[500] text-[#6C7688]">Invoice preview</p>}
      <div className={embedded ? "mt-0" : "mt-[12px]"}>
        <div className="rounded-[8px] border border-[#E3E8EF] bg-white p-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
          <h3 className="text-[16px] font-[600] text-[#353A44]">{data.invoice.invoiceNumber || "Draft invoice"}</h3>
          <p className="mt-[4px] text-[13px] text-[#6C7688]">{data.invoice.description || "No description yet"}</p>
          <div className="mt-[16px] border-t border-[#F0F2F5] pt-[12px]">
            <PreviewRow label="Amount due" value={data.invoice.amount ? `$${data.invoice.amount}` : "—"} />
            <PreviewRow label="Due date" value={data.invoice.dueDate || "—"} />
            <PreviewRow label="Customer" value={hasCustomer ? data.customer.name || "Draft" : "Not added"} />
            <PreviewRow label="Line item" value={hasProduct ? data.product.name || "Draft product" : "Not added"} />
            <PreviewRow
              label="Meter"
              value={
                hasMeter && data.meter?.eventName?.trim()
                  ? data.meter.eventName
                  : hasMeter
                    ? "Draft meter"
                    : "Not added"
              }
            />
            <PreviewRow label="Discount" value={hasCoupon ? data.coupon.name || "Draft coupon" : "None"} />
          </div>
        </div>
      </div>
    </div>
  )
}

export function ProductDocumentPreview({
  data,
  objects,
  embedded = false,
}: {
  data: RelatedFlowData
  objects: RelatedObjectSummary[]
  embedded?: boolean
}) {
  const hasMeter = objects.some((o) => o.kind === "meter")

  return (
    <div className={embedded ? "p-[20px] pt-[16px]" : "p-[20px]"}>
      {!embedded && <p className="text-[12px] font-[500] text-[#6C7688]">Product preview</p>}
      <div className={embedded ? "mt-0" : "mt-[12px]"}>
        <div className="rounded-[8px] border border-[#E3E8EF] bg-white p-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
          <h3 className="text-[16px] font-[600] text-[#353A44]">{data.product.name || "Draft product"}</h3>
          <p className="mt-[4px] text-[13px] text-[#6C7688]">{data.product.description || "No description yet"}</p>
          <div className="mt-[16px] border-t border-[#F0F2F5] pt-[12px]">
            <PreviewRow
              label="Unit price"
              value={data.product.unitPrice ? `$${data.product.unitPrice}` : "—"}
            />
            <PreviewRow label="Billing model" value={data.product.billingModel || "—"} />
            <PreviewRow
              label="Linked meter"
              value={
                hasMeter && data.meter.eventName?.trim()
                  ? data.meter.eventName
                  : hasMeter
                    ? "Draft meter"
                    : "None in flow"
              }
            />
          </div>
        </div>
      </div>
    </div>
  )
}
