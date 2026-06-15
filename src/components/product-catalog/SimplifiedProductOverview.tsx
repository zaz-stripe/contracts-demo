'use client'

import type { ChangeEvent, DragEvent } from "react"
import { useRef, useState } from "react"

import { FORM_LABEL_TEXT_CLASSES } from "@/components/formStyles"
import { Selector } from "@/components/Selector"
import { PhotoIcon } from "@/components/ProductCatalogIcons"

const productTaxCodes = ["Account default", "Digital", "Physical", "Service"]

const nameRowWrapperBase = "flex w-full items-center gap-[8px] overflow-hidden rounded-[6px] bg-white pb-[16px] pt-0"

const bigNameInputClasses =
  "min-w-0 flex-1 bg-transparent text-[18px] font-[500] leading-[normal] text-[#353A44] placeholder:text-[#6C7688] outline-none"

const descriptionTextareaClasses =
  "min-h-[120px] w-full resize-none bg-transparent text-[14px] font-[400] leading-[normal] text-[#353A44] placeholder:text-[#6C7688] outline-none"

// (chips / additional-details UI intentionally removed from simplified modal)

type SimplifiedProductOverviewProps = {
  t: (key: string) => string

  productName: string
  setProductName: (next: string) => void

  productDescription: string
  setProductDescription: (next: string) => void

  productImageUrl: string | null
  setProductImageUrl: (next: string | null) => void

  productTaxCode: string
  setProductTaxCode: (next: string) => void
}

export function SimplifiedProductOverview({
  t,
  productName,
  setProductName,
  productDescription,
  setProductDescription,
  productImageUrl,
  setProductImageUrl,
  productTaxCode,
  setProductTaxCode,
}: SimplifiedProductOverviewProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)

  const handleFile = (file: File | null) => {
    if (!file) return
    if (!file.type.startsWith("image/")) return
    const nextUrl = URL.createObjectURL(file)
    setProductImageUrl(nextUrl)
  }

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.item(0) ?? null
    handleFile(file)
  }

  const handleDrop = (event: DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragActive(false)
    const file = event.dataTransfer.files?.item(0) ?? null
    handleFile(file)
  }

  return (
    <div className="pb-0">
      <div className="rounded-[6px] bg-white">
        <div className="flex flex-col items-start">
          <div className={`${nameRowWrapperBase} px-[16px]`}>
            <div className="flex w-full items-center gap-[8px] overflow-hidden rounded-[6px]">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileInputChange}
              />

              {/* Image dropzone (only this should open file picker / react to drag) */}
              <div
                className={`group flex shrink-0 items-center overflow-hidden rounded-[6px] p-[8px] transition-colors ${
                  isDragActive
                    ? "bg-[#EFECFC] border border-dashed border-[#675DFF]"
                    : "bg-[#F5F6F8] hover:bg-[#EFECFC]"
                }`}
                role="button"
                tabIndex={0}
                aria-label={t("Upload image")}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    fileInputRef.current?.click()
                  }
                }}
                onDragEnter={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsDragActive(true)
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsDragActive(true)
                }}
                onDragLeave={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsDragActive(false)
                }}
                onDrop={(e) => {
                  handleDrop(e)
                }}
              >
                {productImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={productImageUrl} alt="" className="size-[20px] rounded-[3px] object-cover" />
                ) : (
                  <PhotoIcon
                    size={20}
                    className={
                      isDragActive ? "text-[#675DFF]" : "text-[#6C7688] group-hover:text-[#675DFF] transition-colors"
                    }
                  />
                )}
              </div>
              <input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder={t("Product name")}
                aria-label={t("Product name")}
                className={bigNameInputClasses}
              />
            </div>
          </div>

          <textarea
            value={productDescription}
            onChange={(e) => setProductDescription(e.target.value)}
            placeholder={t("Briefly describe this product")}
            aria-label={t("Description")}
            className={`${descriptionTextareaClasses} px-[16px]`}
          />
        </div>
      </div>

      {/* Product tax code row */}
      <div className="mt-[16px] bg-[#F5F6F8]">
        <div className="flex items-center justify-between bg-white px-[16px] py-[8px]">
          <div className={FORM_LABEL_TEXT_CLASSES}>{t("Product tax code")}</div>
          <Selector
            ariaLabel={t("Product tax code")}
            options={productTaxCodes}
            value={productTaxCode}
            onChange={setProductTaxCode}
            size="sm"
            getDisplayValue={t}
            buttonClassName="h-[32px] justify-between border border-[#D8DEE4] px-[12px] py-[8px] text-[12px] font-[500] text-[#353A44]"
          />
        </div>
      </div>
    </div>
  )
}


