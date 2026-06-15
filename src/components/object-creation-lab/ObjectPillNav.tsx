'use client'

import { AnimatePresence, motion } from "framer-motion"

type NavObject = {
  id: string
  kind: string
  label: string
  isComplete: boolean
  hasData?: boolean
}

type ObjectPillNavProps = {
  objects: NavObject[]
  activeId: string
  onSelect: (id: string) => void
}

function ObjectIcon({ kind }: { kind: string }) {
  const iconMap: Record<string, string> = {
    invoice: "IN",
    customer: "CU",
    product: "P",
    coupon: "CP",
    meter: "M",
  }
  const letter = iconMap[kind] ?? kind[0]?.toUpperCase() ?? "?"

  return (
    <span
      className="inline-flex h-[16px] items-center justify-center rounded-[3px] text-[9px] font-[700] leading-none tracking-[0.3px] text-[#3C4F69]"
      style={{ minWidth: letter.length > 1 ? 20 : 16 }}
    >
      {letter}
    </span>
  )
}

function CompletionIndicator({ isComplete, hasData }: { isComplete: boolean; hasData: boolean }) {
  if (isComplete) {
    return (
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
        <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#30B063" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  return (
    <span
      className="h-[6px] w-[6px] shrink-0 rounded-full transition-colors duration-200"
      style={{ backgroundColor: hasData ? "#30B063" : "#D4DEE9" }}
    />
  )
}

export function ObjectPillNav({ objects, activeId, onSelect }: ObjectPillNavProps) {
  if (objects.length <= 1) return null

  return (
    <motion.div
      className="flex items-center gap-[6px] border-b border-[#EBEEF1] bg-[#FAFBFC] px-[16px] py-[8px]"
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      <AnimatePresence mode="popLayout">
        {objects.map((object) => {
          const isActive = object.id === activeId
          return (
            <motion.button
              key={object.id}
              type="button"
              layout
              className={`inline-flex items-center gap-[6px] rounded-[6px] px-[8px] py-[4px] text-[12px] font-[500] tracking-[-0.15px] transition-all duration-150 ${
                isActive
                  ? "border border-[#D4DEE9] bg-white text-[#353A44] shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                  : "border border-transparent text-[#6C7688] hover:bg-white/60 hover:text-[#353A44]"
              }`}
              onClick={() => onSelect(object.id)}
              initial={{ opacity: 0, scale: 0.9, x: -8 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: -8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <ObjectIcon kind={object.kind} />
              <span className="max-w-[120px] truncate">{object.label}</span>
              <CompletionIndicator isComplete={object.isComplete} hasData={object.hasData ?? false} />
            </motion.button>
          )
        })}
      </AnimatePresence>
    </motion.div>
  )
}
