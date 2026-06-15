"use client"

import { AnimatePresence, motion } from "framer-motion"
import { LargeChevronIcon } from "@/components/ProductCatalogIcons"
import { FormRow } from "@/components/FormRow"
import { DetailChipsOverflow } from "@/components/DetailChipsOverflow"
import { textFieldInputClasses, detailTileClasses } from "./priceFormConstants"
import { t, focusElement } from "./priceFormUtils"
import type { BillingShortcutId } from "./priceFormTypes"

type InternalReferenceSectionProps = {
  showInternalReference: boolean
  setShowInternalReference: (show: boolean) => void
  internalReferenceDisclosure: "collapsible" | "always"
  priceDescription: string
  setPriceDescription: (value: string) => void
  lookupKey: string
  setLookupKey: (value: string) => void
}

export function InternalReferenceSection({
  showInternalReference,
  setShowInternalReference,
  internalReferenceDisclosure,
  priceDescription,
  setPriceDescription,
  lookupKey,
  setLookupKey,
}: InternalReferenceSectionProps) {
  const isInternalAlways = internalReferenceDisclosure === "always"
  const internalOpen = isInternalAlways ? true : showInternalReference

  const handleBillingShortcutClick = (shortcutId: BillingShortcutId) => {
    setShowInternalReference(true)

    // Let the internal reference panel animate in before focusing the target field.
    window.setTimeout(() => {
      switch (shortcutId) {
        case "description":
          focusElement(`input[aria-label="${t("Internal description")}"]`)
          break
        case "lookup-key":
          focusElement(`input[aria-label="${t("Lookup key")}"]`)
          break
      }
    }, 140)
  }

  const formFields = (
    <div className="flex flex-col gap-[16px] bg-white py-4">
      <FormRow label={t("Description")} helperText={t("Short internal label. Not shown to customers.")}>
        <input
          type="text"
          placeholder={t("e.g. Monthly pro plan")}
          className={textFieldInputClasses}
          aria-label={t("Internal description")}
          value={priceDescription}
          onChange={(e) => setPriceDescription(e.target.value)}
        />
      </FormRow>

      <FormRow label={t("Lookup key")} helperText={t("Stable key used in code and APIs. Must be unique.")}>
        <input
          type="text"
          placeholder={t("e.g. pro_monthly")}
          className={textFieldInputClasses}
          aria-label={t("Lookup key")}
          value={lookupKey}
          onChange={(e) => setLookupKey(e.target.value)}
        />
      </FormRow>
    </div>
  )

  return (
    <>
      <div className="flex items-start justify-between px-4 py-4 bg-white">
        {internalOpen ? (
          <span className="text-[12px] font-[500] leading-[16px] text-[#353A44]">
            {t("Additional details")}
          </span>
        ) : (
          <DetailChipsOverflow
            chipClassName={detailTileClasses}
            containerClassName="flex flex-wrap items-center gap-[8px]"
            maxRows={1}
            items={[
              { id: "description", label: t("Description"), onClick: () => handleBillingShortcutClick("description") },
              { id: "lookup-key", label: t("Lookup key"), onClick: () => handleBillingShortcutClick("lookup-key") },
            ]}
          />
        )}
        {!isInternalAlways && (
          <button
            type="button"
            className="flex items-center justify-center p-[8px] rounded-[6px] self-stretch w-[32px] hover:bg-[#F5F6F8] transition-colors"
            aria-label={showInternalReference ? t("Collapse internal reference") : t("Expand internal reference")}
            onClick={() => setShowInternalReference(!showInternalReference)}
          >
            <LargeChevronIcon rotated={showInternalReference} />
          </button>
        )}
      </div>

      {/* Animate only the expanding/collapsing content below the header row. */}
      {isInternalAlways ? (
        formFields
      ) : (
        <AnimatePresence initial={false}>
          {showInternalReference && (
            <motion.div
              key="internal-reference-content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="overflow-hidden"
            >
              {formFields}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </>
  )
}
