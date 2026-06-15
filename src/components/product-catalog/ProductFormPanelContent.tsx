'use client'

import type { ComponentProps } from "react"

import { PriceFormSection } from "@/components/PriceFormSection"
import { ProductInfoCard } from "@/components/ProductInfoCard"
import { MeterForm } from "@/components/MeterForm"

type ProductFormPanelContentProps = {
  activeObjectForm: "product" | "meter" | "price"
  productInfoProps: ComponentProps<typeof ProductInfoCard>
  meterFormProps: ComponentProps<typeof MeterForm>
  priceFormProps: ComponentProps<typeof PriceFormSection>
}

export function ProductFormPanelContent({
  activeObjectForm,
  productInfoProps,
  meterFormProps,
  priceFormProps,
}: ProductFormPanelContentProps) {
  if (activeObjectForm === "product") {
    return <ProductInfoCard {...productInfoProps} />
  }

  if (activeObjectForm === "meter") {
    return <MeterForm {...meterFormProps} />
  }

  return (
    <div className="text-[#353A44]">
      <PriceFormSection {...priceFormProps} />
    </div>
  )
}


