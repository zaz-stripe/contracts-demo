'use client'

import type { ComponentProps } from "react"

import { ProductFormOverlay } from "@/components/ProductFormOverlay"
import { ProductModalBody } from "@/components/product-catalog/ProductModalBody"
import { ProductModalHeader } from "@/components/product-catalog/ProductModalHeader"

type ProductModalOverlayProps = {
  overlayProps: Omit<ComponentProps<typeof ProductFormOverlay>, "header" | "children">
  headerProps: ComponentProps<typeof ProductModalHeader>
  bodyProps: ComponentProps<typeof ProductModalBody>
}

export function ProductModalOverlay({ overlayProps, headerProps, bodyProps }: ProductModalOverlayProps) {
  return (
    <ProductFormOverlay {...overlayProps} header={<ProductModalHeader {...headerProps} />}>
      <ProductModalBody {...bodyProps} />
    </ProductFormOverlay>
  )
}


