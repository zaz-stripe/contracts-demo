'use client'

import { motion } from "framer-motion"
import type { WorkflowObject } from "./useWorkflowState"
import type { WorkflowConfig } from "./workflowConfig"

type ReviewSummaryProps = {
  objects: WorkflowObject[]
  config: WorkflowConfig
  onConfirm: () => void
  onBack: () => void
}

/** Formats a data key from camelCase to readable label */
function formatKey(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim()
}

function ObjectCard({
  object,
  kindLabel,
  index,
}: {
  object: WorkflowObject
  kindLabel: string
  index: number
}) {
  const entries = Object.entries(object.data).filter(
    ([, v]) => typeof v === "string" && v.trim().length > 0
  )

  return (
    <motion.div
      className="rounded-[8px] border border-[#E3E8EF] bg-white"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
    >
      {/* Card header */}
      <div className="flex items-center gap-[8px] border-b border-[#F0F3F7] px-[16px] py-[10px]">
        <span className="text-[11px] font-[700] uppercase tracking-[0.5px] text-[#6C7688]">
          {kindLabel}
        </span>
        {object.isComplete && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#30B063" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      {/* Card body */}
      <div className="px-[16px] py-[12px]">
        {entries.length === 0 ? (
          <p className="text-[12px] italic text-[#9CA3B0]">No data entered</p>
        ) : (
          <div className="flex flex-col gap-[8px]">
            {entries.map(([key, value]) => (
              <div key={key} className="flex items-baseline justify-between gap-[16px]">
                <span className="shrink-0 text-[12px] font-[500] text-[#6C7688]">
                  {formatKey(key)}
                </span>
                <span className="min-w-0 truncate text-right text-[12px] font-[400] text-[#1A2C44]">
                  {value as string}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export function ReviewSummary({ objects, config, onConfirm, onBack }: ReviewSummaryProps) {
  return (
    <div className="flex flex-col gap-[20px]">
      {/* Review header */}
      <div className="flex flex-col gap-[4px]">
        <h2 className="text-[16px] font-[600] leading-[22px] tracking-[-0.08px] text-[#1A2C44]">
          Review before sending
        </h2>
        <p className="text-[13px] font-[400] leading-[18px] text-[#6C7688]">
          Check that everything looks right. You can go back to make changes.
        </p>
      </div>

      {/* Object cards */}
      <div className="flex flex-col gap-[12px]">
        {objects.map((obj, i) => (
          <ObjectCard
            key={obj.id}
            object={obj}
            kindLabel={config.objectKinds[obj.kind]?.label ?? obj.kind}
            index={i}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-[8px] pt-[4px]">
        <button
          type="button"
          className="flex h-[32px] items-center rounded-[6px] border border-[#D4DEE9] bg-white px-[12px] text-[13px] font-[600] text-[#273951] transition-colors hover:bg-[#F5F6F8]"
          onClick={onBack}
        >
          Back to editing
        </button>
        <button
          type="button"
          className="flex h-[32px] items-center rounded-[6px] border border-[#533AFD] bg-[#533AFD] px-[12px] text-[13px] font-[600] text-white transition-colors hover:bg-[#4730E0]"
          onClick={onConfirm}
        >
          {config.lifecycle.confirmLabel ?? "Confirm & send"}
        </button>
      </div>
    </div>
  )
}
