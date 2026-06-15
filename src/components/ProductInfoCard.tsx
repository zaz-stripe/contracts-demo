'use client'

import type { ChangeEvent } from "react"
import { useEffect, useRef } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Selector } from "@/components/Selector"
import { FormRow } from "@/components/FormRow"
import { LargeChevronIcon, PhotoIcon, TrashIcon } from "@/components/ProductCatalogIcons"
import { DetailChipsOverflow, type DetailChipItem } from "@/components/DetailChipsOverflow"

const inputClasses =
  "h-[32px] w-full rounded-[6px] border border-[#D8DEE4] bg-white p-[8px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] placeholder:text-[#6C7688] outline-none hover:border-[#B6C0CD] focus:border-[#A0D0F7] focus:shadow-[0_0_0_1.5px_#A0D0F7] transition-all"

const textareaClasses =
  "min-h-[120px] w-full resize-none rounded-[6px] border border-[#D8DEE4] bg-white p-[8px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] placeholder:text-[#6C7688] outline-none hover:border-[#B6C0CD] focus:border-[#A0D0F7] focus:shadow-[0_0_0_1.5px_#A0D0F7] transition-all"

const inlineAddButtonClasses =
  "inline-flex h-[26px] items-center rounded-[6px] border border-[#D8DEE4] bg-white px-[8px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#353A44] shadow-[0_0.5px_1px_rgba(0,0,0,0.20)] hover:bg-[#F5F6F8] transition-colors"
const detailTileClasses =
  "flex h-[32px] items-center overflow-clip rounded-[6px] bg-[#F5F6F8] px-[10px] py-[8px] text-[12px] font-[500] leading-[16px] text-[#353A44] hover:bg-[#EBEEF1] transition-colors"

const productTaxCodes = ["Account default", "Digital", "Physical", "Service"]

type ProductInfoCardProps = {
  productName: string
  setProductName: (name: string) => void
  productDescription: string
  setProductDescription: (value: string) => void
  productTaxCode: string
  setProductTaxCode: (code: string) => void
  productImageUrl: string | null
  setProductImageUrl: (url: string | null) => void
  showAdditionalOptions: boolean
  setShowAdditionalOptions: (show: boolean) => void
  statementDescriptor: string
  setStatementDescriptor: (value: string) => void
  unitLabel: string
  setUnitLabel: (value: string) => void
  metadataRows: number[]
  setMetadataRows: (rows: number[] | ((prev: number[]) => number[])) => void
  metadataValues: Record<number, { key: string; value: string }>
  setMetadataValues: (values: Record<number, { key: string; value: string }> | ((prev: Record<number, { key: string; value: string }>) => Record<number, { key: string; value: string }>)) => void
  featureRows: number[]
  setFeatureRows: (rows: number[] | ((prev: number[]) => number[])) => void
  featureValues: Record<number, string>
  setFeatureValues: (values: Record<number, string> | ((prev: Record<number, string>) => Record<number, string>)) => void
  onImageModalOpen: () => void
}

export function ProductInfoCard({
  productName,
  setProductName,
  productDescription,
  setProductDescription,
  productTaxCode,
  setProductTaxCode,
  productImageUrl,
  setProductImageUrl,
  showAdditionalOptions,
  setShowAdditionalOptions,
  statementDescriptor,
  setStatementDescriptor,
  unitLabel,
  setUnitLabel,
  metadataRows,
  setMetadataRows,
  metadataValues,
  setMetadataValues,
  featureRows,
  setFeatureRows,
  featureValues,
  setFeatureValues,
  onImageModalOpen,
}: ProductInfoCardProps) {
  const t = (key: string) => key
  const imageInputRef = useRef<HTMLInputElement | null>(null)
  const chipWithValue = (label: string, value: string | number) => (
    <div className="flex items-center gap-[6px]">
      <span className="text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44]">{label}</span>
      <span className="max-w-[140px] truncate rounded-[4px] bg-[#D8DEE4] px-[3px] py-[2px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44]">
        {value}
      </span>
    </div>
  )

  const focusElement = (selector: string) => {
    if (typeof document === "undefined") return
    const el = document.querySelector<HTMLElement>(selector)
    if (!el) return
    el.focus()
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      try {
        el.select()
      } catch {
        // ignore selection errors for non-text inputs
      }
    }
  }

  // Ensure metadata starts with one blank row when "More options" is expanded.
  useEffect(() => {
    if (!showAdditionalOptions) return
    if (metadataRows.length > 0) return
    setMetadataRows((prev: number[]) => {
      const nextId = prev.length ? Math.max(...prev) + 1 : 0
      setMetadataValues((values) => ({ ...values, [nextId]: { key: "", value: "" } }))
      return [...prev, nextId]
    })
  }, [showAdditionalOptions, metadataRows.length, setMetadataRows, setMetadataValues])

  const metadataFilledCount = metadataRows.reduce((count, id) => {
    const entry = metadataValues[id]
    const key = (entry?.key ?? "").trim()
    const value = (entry?.value ?? "").trim()
    return key || value ? count + 1 : count
  }, 0)

  const featureFilledCount = featureRows.reduce((count, id) => {
    const value = (featureValues[id] ?? "").trim()
    return value ? count + 1 : count
  }, 0)

  const handleMoreOptionsShortcut = (shortcut: "statement" | "unit" | "metadata" | "feature") => {
    setShowAdditionalOptions(true)
    window.setTimeout(() => {
      switch (shortcut) {
        case "statement":
          focusElement(`input[aria-label="${t("Statement descriptor")}"]`)
          break
        case "unit":
          focusElement(`input[aria-label="${t("Unit label")}"]`)
          break
        case "metadata":
          if (metadataRows.length === 0) {
            handleAddMetadataRow()
          }
          focusElement(`input[aria-label="${t("Meta data key")}"]`)
          break
        case "feature":
          if (featureRows.length === 0) {
            handleAddFeatureRow()
          }
          focusElement(`input[aria-label="${t("Feature name")}"]`)
          break
      }
    }, 140)
  }

  const handleImageInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.item(0) ?? null
    if (!file) return
    if (!file.type.startsWith("image/")) return
    const nextUrl = URL.createObjectURL(file)
    setProductImageUrl(nextUrl)
  }

  const handleImageRowClick = () => {
    if (productImageUrl) {
      onImageModalOpen()
      return
    }
    imageInputRef.current?.click()
  }

  const handleAddMetadataRow = () => {
    setMetadataRows((prev: number[]) => {
      const nextId = prev.length ? Math.max(...prev) + 1 : 0
      setMetadataValues((values) => ({ ...values, [nextId]: { key: "", value: "" } }))
      return [...prev, nextId]
    })
  }

  const handleRemoveMetadataRow = (id: number) => {
    setMetadataRows((prev: number[]) => prev.filter((rowId) => rowId !== id))
    setMetadataValues((values) => {
      if (!(id in values)) return values
      const next = { ...values }
      delete next[id]
      return next
    })
  }

  const handleAddFeatureRow = () => {
    setFeatureRows((prev: number[]) => {
      const nextId = prev.length ? Math.max(...prev) + 1 : 0
      setFeatureValues((values) => ({ ...values, [nextId]: "" }))
      return [...prev, nextId]
    })
  }

  const handleRemoveFeatureRow = (id: number) => {
    setFeatureRows((prev: number[]) => prev.filter((rowId) => rowId !== id))
    setFeatureValues((values) => {
      if (!(id in values)) return values
      const next = { ...values }
      delete next[id]
      return next
    })
  }

  return (
    <div className="w-full">
      <div className="flex flex-col gap-[16px] bg-white py-4">
        <FormRow label={t("Name")}>
          <input
            className={inputClasses}
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            aria-label={t("Name")}
            placeholder={t("Product name")}
          />
        </FormRow>

        <FormRow rightWidthPx={null}>
          <textarea
            className={`${textareaClasses} w-full`}
            value={productDescription}
            onChange={(e) => setProductDescription(e.target.value)}
            aria-label={t("Description")}
            placeholder={t("Briefly describe this product")}
          />
        </FormRow>

        <FormRow label={t("Image")}>
          <>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageInputChange}
            />
            <button
              type="button"
              className="flex h-[32px] w-full items-center justify-center gap-[8px] overflow-hidden rounded-[6px] border border-[#D8DEE4] bg-white p-[8px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] hover:bg-[#F5F6F8] transition-colors"
              aria-label={t("Upload image")}
              onClick={handleImageRowClick}
            >
              <PhotoIcon size={20} className="text-[#474E5A]" />
              <span>{productImageUrl ? t("Preview image") : t("Upload image")}</span>
            </button>
          </>
        </FormRow>

        <FormRow label={t("Product tax code")}>
          <Selector
            ariaLabel={t("Product tax code")}
            options={productTaxCodes}
            value={productTaxCode}
            onChange={setProductTaxCode}
            size="sm"
            getDisplayValue={t}
            buttonClassName="h-[32px] px-[12px] py-[8px] text-[12px] leading-[16px] tracking-[-0.024px]"
          />
        </FormRow>
      </div>

      <div className="mt-4 flex items-start justify-between px-4 py-3">
        {showAdditionalOptions ? (
          <span className="text-[12px] font-[500] leading-[16px] text-[#353A44]">{t("More options")}</span>
        ) : (
          <DetailChipsOverflow
            chipClassName={detailTileClasses}
            maxRows={1}
            onOverflowClick={() => setShowAdditionalOptions(true)}
            items={
              [
                {
                  id: "statement",
                  label: statementDescriptor.trim()
                    ? chipWithValue(t("Statement descriptor"), statementDescriptor.trim())
                    : t("Statement descriptor"),
                  onClick: () => handleMoreOptionsShortcut("statement"),
                },
                {
                  id: "unit",
                  label: unitLabel.trim() ? chipWithValue(t("Unit label"), unitLabel.trim()) : t("Unit label"),
                  onClick: () => handleMoreOptionsShortcut("unit"),
                },
                {
                  id: "metadata",
                  label: metadataFilledCount > 0 ? chipWithValue(t("Meta data"), metadataFilledCount) : t("Meta data"),
                  onClick: () => handleMoreOptionsShortcut("metadata"),
                },
                {
                  id: "feature",
                  label: featureFilledCount > 0 ? chipWithValue(t("Feature list"), featureFilledCount) : t("Feature list"),
                  onClick: () => handleMoreOptionsShortcut("feature"),
                },
              ] satisfies DetailChipItem[]
            }
          />
        )}
        <button
          type="button"
          className="flex items-center justify-center p-[8px] rounded-[6px] self-stretch w-[32px] hover:bg-[#F5F6F8] transition-colors"
          aria-label={showAdditionalOptions ? t("Hide more options") : t("Show more options")}
          onClick={() => setShowAdditionalOptions(!showAdditionalOptions)}
        >
          <LargeChevronIcon rotated={showAdditionalOptions} />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {showAdditionalOptions && (
          <motion.div
            key="more-options"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-4 px-4 pb-4 pt-2">
              <FormRow
                label={t("Statement descriptor")}
                helperText={t("Used on customers' bank statements for this subscription only.")}
                containerClassName="flex w-full items-center justify-between gap-4"
              >
                <input
                  className={inputClasses}
                  value={statementDescriptor}
                  onChange={(e) => setStatementDescriptor(e.target.value)}
                  aria-label={t("Statement descriptor")}
                  placeholder={t("Acme Pro plan")}
                />
              </FormRow>

              <FormRow
                label={t("Unit label")}
                helperText={t("Label for the quantity you sell, shown on receipts, invoices, and Checkout.")}
                containerClassName="flex w-full items-center justify-between gap-4"
              >
                <input
                  className={inputClasses}
                  value={unitLabel}
                  onChange={(e) => setUnitLabel(e.target.value)}
                  aria-label={t("Unit label")}
                  placeholder={t("Seat")}
                />
              </FormRow>

              <FormRow
                label={t("Meta data")}
                layout="stacked"
                rightWidthPx={null}
                containerClassName="flex w-full flex-col items-stretch gap-2"
              >
                <div className="flex w-full flex-col items-start gap-[8px]">
                  {metadataRows.map((id) => (
                    <div key={id} className="flex w-full items-center gap-[8px]">
                      <input
                        className={inputClasses}
                        aria-label={t("Meta data key")}
                        placeholder={t("Key")}
                        value={metadataValues[id]?.key ?? ""}
                        onChange={(event) =>
                          setMetadataValues((values) => ({
                            ...values,
                            [id]: { key: event.target.value, value: values[id]?.value ?? "" },
                          }))
                        }
                      />
                      <input
                        className={inputClasses}
                        aria-label={t("Meta data value")}
                        placeholder={t("Value")}
                        value={metadataValues[id]?.value ?? ""}
                        onChange={(event) =>
                          setMetadataValues((values) => ({
                            ...values,
                            [id]: { key: values[id]?.key ?? "", value: event.target.value },
                          }))
                        }
                      />
                      <button
                        type="button"
                        className="flex h-[32px] w-[32px] items-center justify-center rounded-[6px] text-[#474E5A] hover:bg-[#F5F6F8] transition-colors"
                        aria-label={t("Remove meta data")}
                        onClick={() => handleRemoveMetadataRow(id)}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  ))}

                  <button type="button" className={inlineAddButtonClasses} onClick={handleAddMetadataRow}>
                    {t("Add meta data")}
                  </button>
                </div>
              </FormRow>

              <FormRow
                label={t("Feature list")}
                layout="stacked"
                rightWidthPx={null}
                containerClassName="flex w-full flex-col items-stretch gap-2"
              >
                <div className="flex w-full flex-col items-start gap-[8px]">
                  {featureRows.map((id) => (
                    <div key={id} className="flex w-full items-center gap-[8px]">
                      <input
                        className={inputClasses}
                        aria-label={t("Feature name")}
                        placeholder={t("Feature name")}
                        value={featureValues[id] ?? ""}
                        onChange={(event) =>
                          setFeatureValues((values) => ({ ...values, [id]: event.target.value }))
                        }
                      />
                      <button
                        type="button"
                        className="flex h-[32px] w-[32px] items-center justify-center rounded-[6px] text-[#474E5A] hover:bg-[#F5F6F8] transition-colors"
                        aria-label={t("Remove feature")}
                        onClick={() => handleRemoveFeatureRow(id)}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  ))}

                  <button type="button" className={inlineAddButtonClasses} onClick={handleAddFeatureRow}>
                    {t("Add feature")}
                  </button>
                </div>
              </FormRow>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}


