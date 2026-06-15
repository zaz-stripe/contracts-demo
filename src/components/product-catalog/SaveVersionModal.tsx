'use client'

import type { MouseEvent as ReactMouseEvent } from "react"
import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import type { PlanVersion } from "@/components/product-catalog/productCatalogPage.types"
import type { ComponentSaveSummary } from "@/components/product-catalog/componentTypes"
import { CatalogObjectGlyph } from "@/components/product-catalog/iconography"

type SaveVersionModalProps = {
  t: (key: string) => string
  planName: string
  existingVersions: PlanVersion[]
  currentDefaultVersionId?: number
  onConfirm: (versionName: string, defaultVersionId: number) => void
  onCancel: () => void
  /** Component create/update summaries shown in the save dialog */
  componentSummaries?: ComponentSaveSummary[]
}

function formatTodayDate(): string {
  const d = new Date()
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function formatTodayDateTime(): string {
  const d = new Date()
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })
}

/** Generate a unique version name given existing versions. */
function generateVersionName(existingVersions: PlanVersion[]): string {
  const dateName = formatTodayDate()
  const existingNames = new Set(existingVersions.map((v) => v.name))
  if (!existingNames.has(dateName)) return dateName
  // Same-day duplicate — use date + time
  const dateTimeName = formatTodayDateTime()
  if (!existingNames.has(dateTimeName)) return dateTimeName
  // Still collides — append (2), (3), etc.
  let n = 2
  while (existingNames.has(`${dateTimeName} (${n})`)) n++
  return `${dateTimeName} (${n})`
}

export function SaveVersionModal({
  t,
  planName,
  existingVersions,
  currentDefaultVersionId,
  onConfirm,
  onCancel,
  componentSummaries,
}: SaveVersionModalProps) {
  const [versionName, setVersionName] = useState(() => generateVersionName(existingVersions))
  const [isDefaultForNewSubscribers, setIsDefaultForNewSubscribers] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)

  // Focus + select the name input on mount
  useEffect(() => {
    requestAnimationFrame(() => {
      nameInputRef.current?.focus()
      nameInputRef.current?.select()
    })
  }, [])

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel()
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [onCancel])

  const handleConfirm = () => {
    const name = versionName.trim() || generateVersionName(existingVersions)
    const defaultId = isDefaultForNewSubscribers
      ? -1 // sentinel — caller will replace with the real new version id
      : currentDefaultVersionId ?? -1
    onConfirm(name, defaultId)
  }

  return (
    <AnimatePresence>
      <motion.div
        key="save-version-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(192,200,210,0.7)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.12, ease: "easeOut" }}
        onClick={onCancel}
      >
        <motion.div
          className="w-[400px] rounded-[12px] border border-[#EBEEF1] bg-white shadow-[0_25px_80px_rgba(15,23,42,0.35)]"
          role="dialog"
          aria-modal="true"
          aria-label={t("Save new version")}
          initial={{ opacity: 0, scale: 0.97, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.985, y: 4 }}
          transition={{ type: "spring", stiffness: 340, damping: 30, mass: 0.7 }}
          onClick={(e: ReactMouseEvent) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-[16px] pt-[12px] pb-[11px] border-b border-[#EBEEF1]">
            <p className="text-[14px] font-[500] leading-[20px] tracking-[-0.15px] text-[#1A2C44]">
              {t("Save new version of")} &ldquo;{planName}&rdquo;
            </p>
            <button
              type="button"
              className="flex items-center justify-center p-[8px] rounded-[6px] transition-colors hover:bg-[#F5F6F8]"
              onClick={onCancel}
              aria-label={t("Close")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path fillRule="evenodd" clipRule="evenodd" d="M0.248959 0.248959C0.580905 -0.0829864 1.1191 -0.0829864 1.45104 0.248959L5 3.79792L8.54896 0.248959C8.88091 -0.0829864 9.4191 -0.0829864 9.75104 0.248959C10.083 0.580905 10.083 1.1191 9.75104 1.45104L6.20208 5L9.75104 8.54896C10.083 8.88091 10.083 9.4191 9.75104 9.75104C9.4191 10.083 8.88091 10.083 8.54896 9.75104L5 6.20208L1.45104 9.75104C1.1191 10.083 0.580905 10.083 0.248959 9.75104C-0.0829864 9.4191 -0.0829864 8.88091 0.248959 8.54896L3.79792 5L0.248959 1.45104C-0.0829864 1.1191 -0.0829864 0.580905 0.248959 0.248959Z" fill="#474E5A"/>
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="px-[16px] py-[16px] border-b border-[#EBEEF1]">
            {/* Version name field */}
            <div className={existingVersions.length > 0 ? "mb-[16px]" : ""}>
              <label className="mb-[6px] block text-[12px] font-[500] leading-[16px] text-[#474E5A]">
                {t("Name")}
              </label>
              <input
                ref={nameInputRef}
                type="text"
                className="w-full h-[32px] rounded-[6px] border border-[#D8DEE4] bg-white p-[8px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] placeholder:text-[#6C7688] outline-none hover:border-[#B6C0CD] focus:shadow-[0_0_0_1.5px_#A0D0F7] focus:border-[#A0D0F7] transition-all"
                value={versionName}
                onChange={(e) => setVersionName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleConfirm()
                }}
              />
            </div>

            {/* New subscribers get this version toggle */}
            {existingVersions.length > 0 && (
              <button
                type="button"
                className="flex items-center gap-[8px]"
                onClick={() => setIsDefaultForNewSubscribers((v) => !v)}
              >
                <span
                  className={`relative inline-flex h-[20px] w-[34px] shrink-0 items-center rounded-full transition-colors ${
                    isDefaultForNewSubscribers ? "bg-[#675DFF]" : "bg-[#D8DEE4]"
                  }`}
                >
                  <span
                    className={`inline-block h-[16px] w-[16px] rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.16)] transition-transform ${
                      isDefaultForNewSubscribers ? "translate-x-[16px]" : "translate-x-[2px]"
                    }`}
                  />
                </span>
                <span className="text-[12px] font-[500] leading-[16px] text-[#1A2C44]">
                  {t("New subscribers get this version")}
                </span>
              </button>
            )}
          </div>

          {/* Component summaries */}
          {componentSummaries && componentSummaries.length > 0 && (() => {
            const creates = componentSummaries.filter((s) => s.action === "create")
            const updates = componentSummaries.filter((s) => s.action === "update")
            return (
              <div className="px-[16px] py-[12px] border-b border-[#EBEEF1]">
                <p className="mb-[8px] text-[12px] font-[600] leading-[16px] text-[#474E5A]">
                  {t("Components")}
                </p>
                {creates.length > 0 && (
                  <div className="mb-[6px]">
                    <p className="mb-[4px] text-[11px] font-[500] leading-[14px] text-[#667691]">{t("Creating")}</p>
                    {creates.map((s) => (
                      <div key={s.componentId} className="flex items-center justify-between py-[3px]">
                        <div className="flex items-center gap-[6px]">
                          <CatalogObjectGlyph kind={s.kind} />
                          <span className="text-[12px] font-[400] text-[#1A2C44]">{s.name}</span>
                        </div>
                        <span className="rounded-[4px] bg-[#E6F4EB] px-[4px] py-[1px] text-[10px] font-[600] leading-[14px] text-[#0C6B37]">
                          {t("New")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {updates.length > 0 && (
                  <div>
                    <p className="mb-[4px] text-[11px] font-[500] leading-[14px] text-[#667691]">{t("Updating")}</p>
                    {updates.map((s) => (
                      <div key={s.componentId} className="flex items-center justify-between py-[3px]">
                        <div className="flex items-center gap-[6px]">
                          <CatalogObjectGlyph kind={s.kind} />
                          <span className="text-[12px] font-[400] text-[#1A2C44]">{s.name}</span>
                        </div>
                        <span className="rounded-[4px] bg-[#EEF0F3] px-[4px] py-[1px] text-[10px] font-[600] leading-[14px] text-[#474E5A]">
                          {t("Updated")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })()}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-[8px] px-[16px] py-[12px]">
            <button
              type="button"
              className="flex h-[28px] items-center rounded-[6px] border border-[#D4DEE9] bg-white px-[10px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#273951] transition-colors hover:bg-[#F5F6F8]"
              onClick={onCancel}
            >
              {t("Cancel")}
            </button>
            <button
              type="button"
              className="flex h-[28px] items-center rounded-[6px] border border-[#533AFD] bg-[#675DFF] px-[10px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-white transition-colors hover:bg-[#5B52F0]"
              onClick={handleConfirm}
            >
              {t("Confirm")}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
