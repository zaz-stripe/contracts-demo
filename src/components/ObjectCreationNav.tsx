'use client'

import { AddSmallIcon } from "@/components/ProductCatalogIcons"
import { CatalogObjectGlyph } from "@/components/product-catalog/iconography"
import { cn } from "@/lib/utils"

type ObjectCreationNavProps = {
  activeForm: "product" | "price" | "meter"
  onSelectForm: (next: "product" | "price" | "meter") => void
  productLabel: string
  productIsPlaceholder?: boolean
  prices: { id: number; label: string; isPlaceholder?: boolean }[]
  emptyPriceLabel?: string
  emptyPriceIsPlaceholder?: boolean
  activePriceId: number | null
  onSelectPrice: (id: number) => void
  meterLabel: string
  meterIsPlaceholder?: boolean
  showMeter: boolean
  onAddPrice: () => void
}

export function ObjectCreationNav({
  activeForm,
  onSelectForm,
  productLabel,
  productIsPlaceholder,
  prices,
  emptyPriceLabel,
  emptyPriceIsPlaceholder,
  activePriceId,
  onSelectPrice,
  meterLabel,
  meterIsPlaceholder,
  showMeter,
  onAddPrice,
}: ObjectCreationNavProps) {
  const t = (key: string) => key

  const baseItemClasses =
    "inline-flex max-w-full items-center gap-[6px] overflow-hidden rounded-[4px] px-[8px] py-[2px] text-[12px] font-[500] tracking-[-0.15px] transition-colors"

  const iconWrapClasses = "flex h-[16px] shrink-0 items-center justify-center"

  return (
    <aside
      className="relative z-10 flex h-full w-full shrink-0 flex-col gap-[2px] border-r border-[#EBEEF1] bg-white py-4 pl-4 pr-6 sm:w-fit sm:max-w-[220px] rounded-r-[12px] shadow-[2px_0_2px_rgba(0,0,0,0.01),4px_0_4px_rgba(0,0,0,0.01),8px_0_8px_rgba(0,0,0,0.01),16px_0_16px_rgba(0,0,0,0.01)] lg:rounded-none lg:shadow-none"
    >
      <div className="flex flex-col items-start px-[2.5px]">
        <button
          type="button"
          className={`${baseItemClasses} ${activeForm === "product" ? "bg-[#F5F6F8]" : "hover:bg-[#F5F6F8]"}`}
          onClick={() => onSelectForm("product")}
        >
          <span className={iconWrapClasses}>
            <CatalogObjectGlyph kind="product" />
          </span>
          <span className={cn("min-w-0 truncate", productIsPlaceholder ? "text-[#6C7688]" : "text-[#353A44]")}>
            {productLabel || t("Untitled product")}
          </span>
        </button>
      </div>

      <div className="flex flex-col gap-[2px]">
        {prices.length === 0 ? (
          <button
            type="button"
            className={`${baseItemClasses} ${activeForm === "price" ? "bg-[#F5F6F8]" : "hover:bg-[#F5F6F8]"}`}
            onClick={() => onSelectForm("price")}
          >
            <span className={iconWrapClasses}>
              <CatalogObjectGlyph kind="price" />
            </span>
            <span className={cn("min-w-0 truncate", emptyPriceIsPlaceholder ? "text-[#6C7688]" : "text-[#353A44]")}>
              {emptyPriceLabel ?? t("Untitled price")}
            </span>
          </button>
        ) : (
          <div className="flex flex-col gap-[2px]">
            {prices.map((price) => {
              const isSelected = activeForm === "price" && activePriceId === price.id
              return (
                <button
                  key={price.id}
                  type="button"
                  className={`${baseItemClasses} ${isSelected ? "bg-[#F5F6F8]" : "hover:bg-[#F5F6F8]"}`}
                  onClick={() => {
                    onSelectForm("price")
                    onSelectPrice(price.id)
                  }}
                >
                  <span className={iconWrapClasses}>
                    <CatalogObjectGlyph kind="price" />
                  </span>
                  <span className={`min-w-0 truncate ${price.isPlaceholder ? "text-[#6C7688]" : "text-[#353A44]"}`}>
                    {price.label}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {(showMeter || activeForm === "meter") && (
          <div className="pl-[24px]">
            <button
              type="button"
              className={`${baseItemClasses} ${
                activeForm === "meter" ? "bg-[#F5F6F8]" : "hover:bg-[#F5F6F8]"
              }`}
              onClick={() => onSelectForm("meter")}
            >
              <span className={iconWrapClasses}>
                <CatalogObjectGlyph kind="meter" />
              </span>
              <span className={cn("min-w-0 truncate", meterIsPlaceholder ? "text-[#6C7688]" : "text-[#353A44]")}>
                {meterLabel || t("Untitled meter")}
              </span>
            </button>
          </div>
        )}

        <div className="flex flex-col items-start px-[4px]">
          <button
            type="button"
            className="inline-flex max-w-full items-center gap-[8px] rounded-[6px] px-[8px] py-[2px] text-[12px] font-[500] tracking-[-0.15px] text-[#533AFD] hover:bg-[#F5F6F8] transition-colors"
            onClick={onAddPrice}
          >
            <AddSmallIcon />
            <span className="min-w-0 truncate">{t("Add price")}</span>
          </button>
        </div>
      </div>
    </aside>
  )
}


