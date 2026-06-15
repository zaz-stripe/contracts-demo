'use client'

import type { WorkflowObject } from "./useWorkflowState"
import type { WorkflowConfig } from "./workflowConfig"

type SubscriptionInvoicePreviewProps = {
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

export function SubscriptionInvoicePreview({ data, allObjects }: SubscriptionInvoicePreviewProps) {
  const customer = allObjects.find((o) => o.kind === "customer")
  const pricingPlan = allObjects.find((o) => o.kind === "pricingPlan")
  const products = allObjects.filter((o) => o.kind === "product")
  const coupon = allObjects.find((o) => o.kind === "coupon")

  const subscriptionName = data.name || "Subscription"
  const interval = data.interval || "monthly"
  const intervalLabel = interval === "yearly" ? "Per year" : interval === "weekly" ? "Per week" : "Per month"
  const intervalShort = interval === "yearly" ? "/yr" : interval === "weekly" ? "/wk" : "/mo"
  const trialDays = data.trialDays ? parseInt(data.trialDays) : 0
  const startDate = data.startDate || new Date().toISOString().split("T")[0]

  const planName = pricingPlan?.data?.name || pricingPlan?.data?.selectedPlan
  const planPrice = pricingPlan?.data?.basePrice ? parseFloat(pricingPlan.data.basePrice) : 0

  const productItems = products
    .filter((p) => p.data?.unitPrice)
    .map((p) => ({
      name: p.data.name || "Product",
      amount: parseFloat(p.data.unitPrice) || 0,
    }))

  const lineSubtotal = planPrice + productItems.reduce((sum, p) => sum + p.amount, 0)

  // Coupon discount
  let discount = 0
  let discountLabel = ""
  if (coupon?.data?.amount) {
    if (coupon.data.discountType === "percent") {
      const pct = parseFloat(coupon.data.amount) || 0
      discount = lineSubtotal * (pct / 100)
      discountLabel = `${coupon.data.name || "Coupon"} (${pct}% off)`
    } else {
      discount = parseFloat(coupon.data.amount) || 0
      discountLabel = coupon.data.name || "Coupon"
    }
  }

  const subtotal = Math.max(0, lineSubtotal - discount)
  const total = trialDays > 0 ? 0 : subtotal
  const hasCustomer = customer && !customer.isPlaceholder

  return (
    <div className="flex h-full items-center justify-center p-[32px]">
      <div className="w-full max-w-[400px] rounded-[12px] border border-dashed border-[#D4DEE9] bg-white">
        {/* Header */}
        <div className="px-[24px] pt-[24px] pb-[20px]">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <h3 className="text-[20px] font-[600] leading-[24px] tracking-[-0.3px] text-[#1A2C44]">
                {subscriptionName}
              </h3>
              <p className="mt-[4px] text-[12px] font-[400] leading-[16px] text-[#3C4F69]">
                Billed {interval}
              </p>
            </div>
          </div>
        </div>

        {/* Bill to */}
        {hasCustomer && (
          <div className="border-t border-[#F0F3F7] px-[24px] py-[16px]">
            <p className="text-[10px] font-[600] uppercase tracking-[0.5px] text-[#9CA3B0]">
              Bill to
            </p>
            <p className="mt-[6px] text-[14px] font-[500] leading-[18px] text-[#1A2C44]">
              {customer.label}
            </p>
            {customer.data?.email && (
              <p className="mt-[2px] text-[12px] text-[#6C7688]">{customer.data.email}</p>
            )}
          </div>
        )}

        {/* Pricing plan section */}
        {(planName || planPrice > 0) && (
          <div className="border-t border-[#F0F3F7] px-[24px] py-[16px]">
            <div className="flex items-start justify-between gap-[12px]">
              <div className="min-w-0">
                <p className="text-[14px] font-[500] leading-[18px] text-[#1A2C44]">
                  {planName || "Pricing plan"}
                </p>
                <p className="mt-[2px] text-[11px] text-[#6C7688]">{intervalLabel}</p>
              </div>
              <p className="shrink-0 text-[16px] font-[600] leading-[20px] text-[#1A2C44]">
                {formatCurrency(planPrice)}
              </p>
            </div>
          </div>
        )}

        {/* Additional products */}
        {productItems.length > 0 && (
          <div className="border-t border-[#F0F3F7] px-[24px] py-[16px]">
            <p className="text-[10px] font-[600] uppercase tracking-[0.5px] text-[#9CA3B0]">
              Additional items
            </p>
            <div className="mt-[12px] flex flex-col gap-[12px]">
              {productItems.map((item, i) => (
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
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!planName && planPrice === 0 && productItems.length === 0 && (
          <div className="border-t border-[#F0F3F7] px-[24px] py-[16px]">
            <p className="text-[12px] italic text-[#9CA3B0]">No line items yet</p>
          </div>
        )}

        {/* Coupon discount */}
        {discount > 0 && (
          <div className="border-t border-dashed border-[#E3E8EF] px-[24px] py-[12px]">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-[500] text-[#30B063]">{discountLabel}</p>
              <p className="text-[14px] font-[600] text-[#30B063]">
                -{formatCurrency(discount)}
              </p>
            </div>
          </div>
        )}

        {/* Trial discount */}
        {trialDays > 0 && subtotal > 0 && (
          <div className="border-t border-dashed border-[#E3E8EF] px-[24px] py-[12px]">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-[500] text-[#30B063]">
                {trialDays}-day free trial
              </p>
              <p className="text-[14px] font-[600] text-[#30B063]">
                -{formatCurrency(subtotal)}
              </p>
            </div>
          </div>
        )}

        {/* Total */}
        <div className="border-t border-[#E3E8EF] bg-[#FAFBFC] px-[24px] py-[16px] rounded-b-[12px]">
          <div className="flex items-center justify-between">
            <p className="text-[14px] font-[600] text-[#1A2C44]">Amount due</p>
            <p className="text-[20px] font-[600] leading-[24px] tracking-[-0.3px] text-[#1A2C44]">
              {formatCurrency(total)}
            </p>
          </div>
          <div className="mt-[8px] flex items-center justify-between">
            <span className="text-[11px] font-[500] text-[#9CA3B0]">Due date</span>
            <span className="text-[12px] font-[500] text-[#6C7688]">{formatDate(startDate)}</span>
          </div>
          {trialDays > 0 && subtotal > 0 && (
            <div className="mt-[4px] flex items-center justify-between">
              <span className="text-[11px] font-[500] text-[#9CA3B0]">After trial</span>
              <span className="text-[12px] font-[500] text-[#6C7688]">{formatCurrency(subtotal)}{intervalShort}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
