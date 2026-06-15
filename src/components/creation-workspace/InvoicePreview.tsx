'use client'

import type { WorkflowObject } from "./useWorkflowState"
import type { WorkflowConfig } from "./workflowConfig"

type InvoicePreviewProps = {
  data: Record<string, any>
  allObjects: WorkflowObject[]
  config: WorkflowConfig
}

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T00:00:00")
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  } catch {
    return dateStr
  }
}

export function InvoicePreview({ data, allObjects }: InvoicePreviewProps) {
  const customerObj = allObjects.find((o) => o.kind === "customer")
  const products = allObjects.filter((o) => o.kind === "product")
  const coupon = allObjects.find((o) => o.kind === "coupon")

  const invoiceNumber = data.name || "INV-001"
  const dueDate = data.dueDate ? formatDate(data.dueDate) : "Not set"
  const description = data.description || ""

  // Resolve customer info: prefer the inline customer object when the invoice
  // references it ("_new"), otherwise use the name captured on the invoice data
  // from the dropdown selection.
  const isNewCustomer = data.customerId === "_new"
  const resolvedCustomer = (() => {
    if (isNewCustomer && customerObj && !customerObj.isPlaceholder) {
      return {
        name: customerObj.data.name as string | undefined,
        email: customerObj.data.email as string | undefined,
        address1: customerObj.data.address1 as string | undefined,
        city: customerObj.data.city as string | undefined,
        state: customerObj.data.state as string | undefined,
        zip: customerObj.data.zip as string | undefined,
      }
    }
    if (data.customerName) {
      return { name: data.customerName as string }
    }
    return null
  })()
  const hasCustomer = resolvedCustomer && resolvedCustomer.name?.trim()

  const lineItems = products
    .filter((p) => p.data.unitPrice)
    .map((p) => ({
      name: p.data.name || "Untitled product",
      amount: parseFloat(p.data.unitPrice) || 0,
    }))

  const invoiceAmount = parseFloat(data.amount) || 0
  const subtotal = lineItems.length > 0
    ? lineItems.reduce((sum, item) => sum + item.amount, 0)
    : invoiceAmount

  // Resolve coupon: use the workflow coupon object when linked ("_new"),
  // otherwise use the coupon data stored on the invoice from dropdown selection.
  const couponData = (() => {
    if (data.couponId === "_new" && coupon?.data.amount) {
      return { name: coupon.data.name, amount: coupon.data.amount, discountType: coupon.data.discountType }
    }
    if (data.couponAmount) {
      return { name: data.couponName, amount: data.couponAmount, discountType: data.couponDiscountType }
    }
    return null
  })()

  let discount = 0
  let discountLabel = ""
  if (couponData?.amount) {
    if (couponData.discountType === "percent") {
      const pct = parseFloat(couponData.amount) || 0
      discount = subtotal * (pct / 100)
      discountLabel = `${couponData.name || "Coupon"} (${pct}% off)`
    } else {
      discount = parseFloat(couponData.amount) || 0
      discountLabel = couponData.name || "Coupon"
    }
  }

  const total = Math.max(0, subtotal - discount)

  return (
    <div className="flex h-full items-center justify-center p-[32px]">
      <div className="w-full max-w-[400px] rounded-[12px] border border-dashed border-[#D4DEE9] bg-white">
        {/* Header with invoice title */}
        <div className="px-[24px] pt-[24px] pb-[20px]">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <h3 className="text-[20px] font-[600] leading-[24px] tracking-[-0.3px] text-[#1A2C44]">
                {invoiceNumber}
              </h3>
              {description && (
                <p className="mt-[4px] text-[12px] font-[400] leading-[16px] text-[#3C4F69]">
                  {description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bill to section */}
        {hasCustomer && resolvedCustomer && (
          <div className="border-t border-[#F0F3F7] px-[24px] py-[16px]">
            <p className="text-[10px] font-[600] uppercase tracking-[0.5px] text-[#9CA3B0]">
              Bill to
            </p>
            <p className="mt-[6px] text-[14px] font-[500] leading-[18px] text-[#1A2C44]">
              {resolvedCustomer.name}
            </p>
            {resolvedCustomer.email && (
              <p className="mt-[2px] text-[12px] text-[#6C7688]">{resolvedCustomer.email}</p>
            )}
            {resolvedCustomer.address1 && (
              <p className="mt-[2px] text-[12px] text-[#6C7688]">
                {resolvedCustomer.address1}
                {resolvedCustomer.city && `, ${resolvedCustomer.city}`}
                {resolvedCustomer.state && ` ${resolvedCustomer.state}`}
                {resolvedCustomer.zip && ` ${resolvedCustomer.zip}`}
              </p>
            )}
          </div>
        )}

        {/* Line items section */}
        <div className="border-t border-[#F0F3F7] px-[24px] py-[16px]">
          <p className="text-[10px] font-[600] uppercase tracking-[0.5px] text-[#9CA3B0]">
            Line items
          </p>

          <div className="mt-[12px] flex flex-col gap-[12px]">
            {lineItems.length > 0 ? (
              lineItems.map((item, i) => (
                <div key={i} className="flex items-start justify-between gap-[12px]">
                  <div className="min-w-0">
                    <p className="text-[14px] font-[500] leading-[18px] text-[#1A2C44]">
                      {item.name}
                    </p>
                    <p className="mt-[2px] text-[11px] text-[#6C7688]">Qty 1</p>
                  </div>
                  <p className="shrink-0 text-[14px] font-[600] leading-[18px] text-[#1A2C44]">
                    {formatCurrency(item.amount)}
                  </p>
                </div>
              ))
            ) : invoiceAmount > 0 ? (
              <div className="flex items-start justify-between gap-[12px]">
                <div className="min-w-0">
                  <p className="text-[14px] font-[500] leading-[18px] text-[#1A2C44]">
                    {description || "Invoice amount"}
                  </p>
                </div>
                <p className="shrink-0 text-[14px] font-[600] leading-[18px] text-[#1A2C44]">
                  {formatCurrency(invoiceAmount)}
                </p>
              </div>
            ) : (
              <p className="text-[12px] italic text-[#9CA3B0]">No line items yet</p>
            )}
          </div>
        </div>

        {/* Discount */}
        {discount > 0 && (
          <div className="border-t border-dashed border-[#E3E8EF] px-[24px] py-[12px]">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[12px] font-[500] text-[#30B063]">{discountLabel}</p>
              </div>
              <p className="shrink-0 text-[14px] font-[600] text-[#30B063]">
                -{formatCurrency(discount)}
              </p>
            </div>
          </div>
        )}

        {/* Total section */}
        <div className="border-t border-[#E3E8EF] bg-[#FAFBFC] px-[24px] py-[16px] rounded-b-[12px]">
          <div className="flex items-center justify-between">
            <p className="text-[14px] font-[600] text-[#1A2C44]">Total due</p>
            <p className="text-[20px] font-[600] leading-[24px] tracking-[-0.3px] text-[#1A2C44]">
              {formatCurrency(total)}
            </p>
          </div>
          <div className="mt-[8px] flex items-center justify-between">
            <span className="text-[11px] font-[500] text-[#9CA3B0]">Due date</span>
            <span className="text-[12px] font-[500] text-[#6C7688]">{dueDate}</span>
          </div>
        </div>

        {/* Memo */}
        {data.memo && (
          <div className="border-t border-[#F0F3F7] px-[24px] py-[12px]">
            <p className="text-[11px] font-[500] text-[#9CA3B0]">Memo</p>
            <p className="mt-[2px] text-[12px] text-[#6C7688]">{data.memo}</p>
          </div>
        )}
      </div>
    </div>
  )
}
