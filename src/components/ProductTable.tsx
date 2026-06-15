'use client'

import type { PricingPlanRow, ProductRow } from "@/components/product-catalog/productCatalogPage.types"
import { PricingPlanIcon, SingleProductIcon } from "@/components/ProductCatalogIcons"
import { cn } from "@/lib/utils"

type CatalogItem = ({ kind: "product" } & ProductRow) | ({ kind: "plan" } & PricingPlanRow)

type ProductTableProps = {
  // Defensive: during Fast Refresh / state hydration, callers can temporarily pass undefined.
  // This component should never hard-crash the page in that case.
  items?: CatalogItem[] | null
  onItemClick: (item: CatalogItem) => void
}

// Width variants for table placeholder bars
const tableWidthClasses = [
  "w-[30%]",
  "w-[35%]",
  "w-[40%]",
  "w-[45%]",
  "w-[50%]",
  "w-[55%]",
  "w-[60%]",
  "w-[65%]",
  "w-[70%]",
  "w-[75%]",
  "w-[80%]",
  "w-[85%]",
]

export function ProductTable({ items, onItemClick }: ProductTableProps) {
  const t = (key: string) => key
  const safeItems = Array.isArray(items) ? items : []

  return (
    <div className="mt-6 -mx-10 border-b border-[#EBEEF1]">
      <div className="px-10">
        {/* Header row */}
        <div className="border-b border-[#EBEEF1] bg-white">
          <div className="grid h-[40px] grid-cols-[1.5fr_0.8fr_0.8fr_1fr_0.7fr_0.8fr_0.7fr_0.8fr] items-center gap-6 text-[12px] font-[500] text-[#6C7688]">
            <span>{t("Item")}</span>
            <span>{t("Type")}</span>
            <span>{t("Billing period")}</span>
            <span>{t("Amount")}</span>
            <span>{t("Currency")}</span>
            <span>{t("Price groups")}</span>
            <span>{t("Status")}</span>
            <span>{t("Created")}</span>
          </div>
        </div>

        {/* Data rows */}
        <div className="divide-y divide-[#EBEEF1] bg-white">
          {safeItems.map((item) => (
            <button
              key={`${item.kind}:${item.id}`}
              type="button"
              className="table-row-hover grid h-[40px] w-full grid-cols-[1.5fr_0.8fr_0.8fr_1fr_0.7fr_0.8fr_0.7fr_0.8fr] items-center gap-6 text-left text-[13px] font-[500] text-[#353A44]"
              onClick={() => onItemClick(item)}
            >
              <span className="flex items-center gap-2 truncate">
                {item.kind === "product" ? (
                  <>
                    <span
                      className="flex h-[14px] w-[14px] items-center justify-center text-[#474E5A] flex-none"
                      aria-hidden="true"
                    >
                      <SingleProductIcon />
                    </span>
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="h-[20px] w-[20px] rounded-[6px] object-cover flex-none"
                      />
                    ) : null}
                    <span className="truncate">{item.name}</span>
                  </>
                ) : (
                  <>
                    <span
                      className="flex h-[14px] w-[14px] items-center justify-center text-[#474E5A] flex-none"
                      aria-hidden="true"
                    >
                      <PricingPlanIcon />
                    </span>
                    <span className="truncate">{item.name}</span>
                  </>
                )}
              </span>
              <span className="text-[#596171]">
                {item.kind === "plan" ? t("Pricing plan") : t("Product")}
              </span>
              <span>{item.billingPeriod}</span>
              <span>
                {item.amount}
              </span>
              <span className="text-[#596171]">{item.currency}</span>
              <span className="text-[#596171]">
                {item.kind === "plan" && item.draft?.planRateCards
                  ? item.draft.planRateCards.length
                  : "—"}
              </span>
              <span>
                {(() => {
                  const status = item.status ?? "live"
                  const label = status === "live" ? t("Live") : t("Draft")
                  const statusClassName = status === "live" ? "bg-[#E4FAE7]" : "bg-[#E2FBFE]"
                  return (
                    <span
                      className={cn(
                        "inline-flex h-[20px] items-center rounded-[6px] px-[6px] text-[12px] font-[500] leading-[20px] tracking-[-0.15px] text-[#353A44]",
                        statusClassName
                      )}
                    >
                      {label}
                    </span>
                  )
                })()}
              </span>
              <span className="text-[#596171]">{t("Just now")}</span>
            </button>
          ))}

          {Array.from({ length: 50 }).map((_, rowIndex) => (
            <div key={rowIndex} className="grid h-[40px] grid-cols-[1.5fr_0.8fr_0.8fr_1fr_0.7fr_0.8fr_0.7fr_0.8fr] items-center gap-6">
              {Array.from({ length: 8 }).map((_, colIndex) => {
                const seed = rowIndex * 8 + colIndex
                const wordCount = seed % 7 === 0 ? 3 : seed % 3 === 0 ? 2 : 1

                return (
                  <div key={colIndex} className="flex items-center gap-3">
                    {Array.from({ length: wordCount }).map((_, wordIndex) => {
                      const widthIndex =
                        (rowIndex * 11 + colIndex * 5 + wordIndex * 3) %
                        tableWidthClasses.length
                      const widthClass = tableWidthClasses[widthIndex]
                      return (
                        <div
                          key={wordIndex}
                          className={`h-[9px] rounded-full bg-[#F5F6F8] ${widthClass}`}
                        />
                      )
                    })}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

