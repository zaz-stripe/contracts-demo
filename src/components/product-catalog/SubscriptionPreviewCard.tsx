'use client'

import { cn } from "@/lib/utils"
import type { ProductNode, PriceGroupNode, PlanNode } from "@/components/product-catalog/CatalogTreeNav"

type SubscriptionPreviewCardProps = {
  subscriptionNumber?: string
  customer: string
  products?: ProductNode[]
  priceGroups?: PriceGroupNode[]
  plans?: PlanNode[]
}

function formatAmount(amount: string, decimals = -1): string {
  const num = parseFloat(amount)
  if (Number.isNaN(num)) return `$${amount}`
  if (decimals >= 0) return `$${num.toFixed(decimals)}`
  return `$${num}`
}

function getUnitLabel(price: { name?: string; amount?: string }): string {
  if (price.name?.includes("/")) {
    return price.name.split("/").pop() ?? "unit"
  }
  return "unit"
}

function getMeterFromPrice(price?: { name?: string; cadence?: string }): string {
  if (!price?.name) return ""
  // Extract meter from format "Monthly · $0.128/function_active_cpu_hrs"
  if (price.name.includes("/")) {
    const afterSlash = price.name.split("/").pop() ?? ""
    if (afterSlash && !afterSlash.includes("$")) return afterSlash
  }
  return ""
}

function RateLine({ name, meter, price, showLine }: { name: string; meter?: string; price: string; showLine?: boolean }) {
  return (
    <div className="flex gap-[12px] items-start w-full">
      {showLine && <div className="w-[2px] self-stretch bg-[#C3B6FB] shrink-0 rounded-full" />}
      <div className="flex-1 flex items-start justify-between min-w-0 gap-[12px]">
        <div className="flex flex-col gap-[2px] min-w-0">
          <p className="text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#1A2C44] truncate">{name}</p>
          {meter && <p className="text-[11px] font-[400] leading-[16px] text-[#3C4F69]">{meter}</p>}
        </div>
        <p className="text-[12px] font-[400] leading-[16px] text-[#1A2C44] shrink-0 whitespace-nowrap">{price}</p>
      </div>
    </div>
  )
}

function renderRateLines(products: ProductNode[], showLine: boolean) {
  return products.map((product) => {
    const price = product.prices?.[0]
    const unitPrice = price?.amount || ""
    const unit = getUnitLabel(price ?? {})
    const meter = getMeterFromPrice(price)
    const priceText = unitPrice ? `${formatAmount(unitPrice)} per ${unit}` : "$0.00 per unit"
    return (
      <RateLine
        key={product.id}
        name={product.name}
        meter={meter}
        price={priceText}
        showLine={showLine}
      />
    )
  })
}

export function SubscriptionPreviewCard({ subscriptionNumber, customer, products, priceGroups, plans }: SubscriptionPreviewCardProps) {
  const flatProducts = products?.filter((p) => !p.isUsageBased && p.prices?.[0]?.amount && /^\d/.test(p.prices[0].amount)) ?? []
  const usageProducts = products?.filter((p) => p.isUsageBased || !p.prices?.[0]?.amount || !/^\d/.test(p.prices[0].amount ?? "")) ?? []

  const plansWithHeaderContent = plans?.filter((plan) => {
    const planFlats = plan.products?.filter((p) => !p.isUsageBased && p.prices?.[0]?.amount && /^\d/.test(p.prices[0].amount)) ?? []
    return planFlats.length > 0 || (plan.creditGrants?.length ?? 0) > 0
  }) ?? []

  const hasBody = usageProducts.length > 0 || (priceGroups && priceGroups.length > 0) || (plans && plans.some((pl) => (pl.products?.length ?? 0) > 0 || (pl.priceGroups?.length ?? 0) > 0))

  return (
    <div className="min-w-[432px] w-max max-w-full">
      {/* ── Header: subscription number + customer + flat fees + credits ── */}
      <div className={cn(
        "flex flex-col gap-[24px] overflow-clip bg-white p-[24px] border border-[#D4DEE9]",
        hasBody ? "rounded-t-[12px] border-b-0" : "rounded-[12px]"
      )}>
        {/* Subscription number */}
        <div className="flex flex-col min-w-0">
          <p className="text-[20px] font-[600] leading-[24px] tracking-[-0.3px] text-[#1A2C44]">
            {subscriptionNumber || "S-2026-001"}
          </p>
        </div>

        {/* Customer */}
        <div className="flex flex-col gap-[4px]">
          <p className="text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#1A2C44]">Customer</p>
          <p className="text-[12px] font-[400] leading-[16px] text-[#1A2C44]">{customer}</p>
        </div>

        {/* Top-level flat products (not inside a plan) */}
        {flatProducts.map((product) => {
          const price = product.prices?.[0]
          const amount = price?.amount ? formatAmount(price.amount, 2) : "$0.00"
          const period = price?.cadence || "Monthly"
          const billedText = period.toLowerCase().includes("year") ? "Billed annually" : "Billed monthly"
          const perText = period.toLowerCase().includes("year") ? "Per year" : "Per month"
          return (
            <div key={product.id} className="flex flex-col gap-[4px]">
              <div className="flex items-center justify-between">
                <p className="text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#1A2C44]">{product.name}</p>
                <p className="text-[16px] font-[600] leading-[24px] tracking-[-0.31px] text-right text-[#1A2C44]" style={{ fontFeatureSettings: "'lnum' 1, 'pnum' 1" }}>
                  {amount}
                </p>
              </div>
              <div className="flex items-center justify-between text-[12px] font-[400] leading-[16px] text-[#3C4F69]">
                <p>{billedText}</p>
                <p>{perText}</p>
              </div>
            </div>
          )
        })}

        {/* Per-plan sections: plan name + description + license fees + credit grants */}
        {plansWithHeaderContent.map((plan) => {
          const planFlatProducts = plan.products?.filter((p) => !p.isUsageBased && p.prices?.[0]?.amount && /^\d/.test(p.prices[0].amount)) ?? []
          return (
            <div key={plan.id} className="flex flex-col gap-[16px]">
              {/* Plan name + description */}
              <div className="flex flex-col min-w-0">
                <p className="text-[20px] font-[600] leading-[24px] tracking-[-0.3px] text-[#1A2C44]">
                  {plan.name}
                </p>
                {plan.description && (
                  <p className="text-[12px] font-[400] leading-[16px] tracking-[-0.1px] text-[#3C4F69] truncate">
                    {plan.description}
                  </p>
                )}
              </div>

              {/* Plan's license fees */}
              {planFlatProducts.map((product) => {
                const price = product.prices?.[0]
                const amount = price?.amount ? formatAmount(price.amount, 2) : "$0.00"
                const period = price?.cadence || "Monthly"
                const billedText = period.toLowerCase().includes("year") ? "Billed annually" : "Billed monthly"
                const perText = period.toLowerCase().includes("year") ? "Per year" : "Per month"
                return (
                  <div key={product.id} className="flex flex-col gap-[4px]">
                    <div className="flex items-center justify-between">
                      <p className="text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#1A2C44]">{product.name}</p>
                      <p className="text-[16px] font-[600] leading-[24px] tracking-[-0.31px] text-right text-[#1A2C44]" style={{ fontFeatureSettings: "'lnum' 1, 'pnum' 1" }}>
                        {amount}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-[12px] font-[400] leading-[16px] text-[#3C4F69]">
                      <p>{billedText}</p>
                      <p>{perText}</p>
                    </div>
                  </div>
                )
              })}

              {/* Plan's credit grants */}
              {(plan.creditGrants?.length ?? 0) > 0 && (
                <div className="flex flex-col gap-[8px] rounded-[6px] bg-[rgba(26,26,26,0.04)] p-[12px]">
                  <div className="flex items-center gap-[4px]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
                      <rect x="1" y="4" width="10" height="7" rx="1.5" stroke="#3C4F69" strokeWidth="1.2" fill="none" />
                      <path d="M6 4v7M1 7h10" stroke="#3C4F69" strokeWidth="1.2" fill="none" />
                      <circle cx="4.5" cy="2.5" r="1.2" stroke="#3C4F69" strokeWidth="1" fill="none" />
                      <circle cx="7.5" cy="2.5" r="1.2" stroke="#3C4F69" strokeWidth="1" fill="none" />
                    </svg>
                    <p className="text-[12px] font-[500] leading-[20px] tracking-[-0.15px] text-[#1A2C44]">Included</p>
                  </div>
                  <div className="flex flex-col gap-[4px]">
                    {plan.creditGrants!.map((cg) => {
                      const amount = cg.amount ? `$${cg.amount}` : "$0"
                      const periodSuffix = (cg.period ?? "Monthly").toLowerCase().includes("year") ? "/yr" : "/mo"
                      return (
                        <p key={cg.id} className="text-[12px] font-[400] leading-[20px] tracking-[-0.15px] text-[#1A2C44]">
                          {amount}{periodSuffix} of {cg.name}. (applies to all usage)
                        </p>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Body: usage rates ── */}
      {hasBody && (
        <div className="flex flex-col overflow-clip rounded-b-[12px] border border-[#D4DEE9] bg-white py-[8px]">
          {/* Plans — show their internal structure */}
          {plans && plans.map((plan) => {
            const planUsageProducts = plan.products?.filter((p) => p.isUsageBased) ?? []
            return (
              <div key={plan.id}>
                {/* Plan's price groups — products nested with purple line */}
                {plan.priceGroups && plan.priceGroups.map((pg) => (
                  <div key={pg.id} className="flex flex-col">
                    <div className="flex flex-col px-[24px] pb-[4px] pt-[16px]">
                      <p className="text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#1A2C44]">{pg.name}</p>
                    </div>
                    <div className="flex flex-col gap-[12px] px-[24px] py-[8px]">
                      {pg.products && renderRateLines(pg.products, true)}
                    </div>
                  </div>
                ))}
                {/* Plan's usage products (ungrouped) — no purple line */}
                {planUsageProducts.length > 0 && (
                  <div className="flex flex-col gap-[12px] px-[24px] pt-[16px] pb-[8px]">
                    {renderRateLines(planUsageProducts, false)}
                  </div>
                )}
              </div>
            )
          })}

          {/* Top-level price groups — products nested with purple line */}
          {priceGroups && priceGroups.map((pg) => (
            <div key={pg.id} className="flex flex-col">
              <div className="flex flex-col px-[24px] pb-[4px] pt-[16px]">
                <p className="text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#1A2C44]">{pg.name}</p>
              </div>
              <div className="flex flex-col gap-[12px] px-[24px] py-[8px]">
                {pg.products && renderRateLines(pg.products, true)}
              </div>
            </div>
          ))}

          {/* Top-level usage products (ungrouped) — no purple line */}
          {usageProducts.length > 0 && (
            <div className="flex flex-col gap-[12px] px-[24px] pt-[16px] pb-[8px]">
              {renderRateLines(usageProducts, false)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
