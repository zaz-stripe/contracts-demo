'use client'

import type { WorkflowObject } from "./useWorkflowState"

function ObjectIcon({ kind }: { kind: string }) {
  const iconMap: Record<string, { letter: string; color: string }> = {
    invoice: { letter: "IN", color: "#3C4F69" },
    customer: { letter: "CU", color: "#3C4F69" },
    product: { letter: "P", color: "#3C4F69" },
    coupon: { letter: "CO", color: "#3C4F69" },
    meter: { letter: "M", color: "#3C4F69" },
    subscription: { letter: "SU", color: "#3C4F69" },
    pricingPlan: { letter: "PP", color: "#3C4F69" },
  }
  const cfg = iconMap[kind] ?? { letter: kind[0]?.toUpperCase() ?? "?", color: "#3C4F69" }

  return (
    <span
      className="inline-flex h-[16px] items-center justify-center rounded-[3px] text-[9px] font-[700] leading-none tracking-[0.3px]"
      style={{
        color: "currentColor",
        minWidth: cfg.letter.length > 1 ? 20 : 16,
      }}
    >
      {cfg.letter}
    </span>
  )
}

type RelatedObjectsJourneyProps = {
  objects: WorkflowObject[]
  activeObjectId: string | null
  onSelectObject: (id: string) => void
  onAddObject: (kind: string) => void
  addOptions: { kind: string; label: string }[]
  /** Object IDs that have validation errors */
  errorObjectIds?: Set<string>
}

export function RelatedObjectsJourney({
  objects,
  activeObjectId,
  onSelectObject,
  errorObjectIds,
}: RelatedObjectsJourneyProps) {
  if (objects.length <= 1) return null

  return (
    <div className="flex flex-col border-b border-[#ECF1F6] bg-[#FAFBFC]">
      <div className="flex items-center gap-[6px] px-[16px] py-[8px]">
          {objects.map((obj) => {
            const isActive = obj.id === activeObjectId
            const hasError = errorObjectIds?.has(obj.id)
            return (
              <button
                key={obj.id}
                type="button"
                className={`inline-flex items-center gap-[5px] rounded-[6px] px-[8px] py-[4px] text-[12px] font-[500] tracking-[-0.15px] transition-all duration-150 ${
                  hasError
                    ? isActive
                      ? "border border-[#E53E3E] bg-white text-[#353A44] shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                      : "border border-[#E53E3E]/40 text-[#E53E3E] hover:bg-white/60"
                    : isActive
                      ? "border border-[#353A44] bg-[#353A44] text-white"
                      : "border border-transparent text-[#6C7688] hover:bg-white/60 hover:text-[#353A44]"
                }`}
                onClick={() => onSelectObject(obj.id)}
              >
                {hasError ? (
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                    <circle cx="7" cy="7" r="6" stroke="#DF1B41" strokeWidth="1.5" />
                    <path d="M7 4V7.5" stroke="#DF1B41" strokeWidth="1.2" strokeLinecap="round" />
                    <circle cx="7" cy="9.75" r="0.75" fill="#DF1B41" />
                  </svg>
                ) : (
                  <ObjectIcon kind={obj.kind} />
                )}
                <span className={`max-w-[120px] truncate ${obj.isPlaceholder ? "italic text-[#9CA3B0]" : ""}`}>
                  {obj.label}
                </span>
              </button>
            )
          })}
      </div>
    </div>
  )
}
