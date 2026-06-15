"use client"

import { useState } from "react"

/**
 * Hook for managing product form state
 */
export function useProductFormState() {
  // Core product fields
  const [productName, setProductName] = useState("")
  const [productType, setProductType] = useState<"Flat" | "Usage-based" | "Composite">("Flat")
  const [productTaxCode, setProductTaxCode] = useState("Account default")
  const [productImageUrl, setProductImageUrl] = useState<string | null>(null)
  const [productDescription, setProductDescription] = useState("")

  // Additional options
  const [showAdditionalOptions, setShowAdditionalOptions] = useState(false)
  const [statementDescriptor, setStatementDescriptor] = useState("")
  const [unitLabel, setUnitLabel] = useState("")

  // Metadata and features
  const [metadataRows, setMetadataRows] = useState<number[]>([])
  const [featureRows, setFeatureRows] = useState<number[]>([])
  const [metadataValues, setMetadataValues] = useState<Record<number, { key: string; value: string }>>({})
  const [featureValues, setFeatureValues] = useState<Record<number, string>>({})

  // Editing state
  const [editingProductId, setEditingProductId] = useState<number | null>(null)

  const resetProductFormToDefaults = () => {
    setProductName("")
    setProductType("Flat")
    setProductDescription("")
    setProductTaxCode("Account default")
    setProductImageUrl(null)
    setShowAdditionalOptions(false)
    setStatementDescriptor("")
    setUnitLabel("")
    setMetadataRows([])
    setFeatureRows([])
    setMetadataValues({})
    setFeatureValues({})
  }

  return {
    // State
    productName,
    setProductName,
    productType,
    setProductType,
    productTaxCode,
    setProductTaxCode,
    productImageUrl,
    setProductImageUrl,
    productDescription,
    setProductDescription,
    showAdditionalOptions,
    setShowAdditionalOptions,
    statementDescriptor,
    setStatementDescriptor,
    unitLabel,
    setUnitLabel,
    metadataRows,
    setMetadataRows,
    featureRows,
    setFeatureRows,
    metadataValues,
    setMetadataValues,
    featureValues,
    setFeatureValues,
    editingProductId,
    setEditingProductId,

    // Actions
    resetProductFormToDefaults,
  }
}

export type ProductFormState = ReturnType<typeof useProductFormState>
