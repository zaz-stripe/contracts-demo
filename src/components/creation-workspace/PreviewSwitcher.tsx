'use client'

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { ControlTooltip } from "@/components/product-catalog/ControlTooltip"

type PreviewOption = {
  key: string
  label: string
  icon: ReactNode
}

type PreviewSwitcherProps = {
  options: PreviewOption[]
  activeKey: string
  onChange: (key: string) => void
}

export function PreviewSwitcher({ options, activeKey, onChange }: PreviewSwitcherProps) {
  if (options.length <= 1) return null

  return (
    <div className="absolute right-[8px] top-[8px] z-10 flex h-[28px] items-center overflow-visible rounded-[6px] bg-[#ECF1F6]">
      {options.map((opt) => {
        const isActive = opt.key === activeKey
        return (
          <ControlTooltip key={opt.key} label={opt.label}>
            <button
              type="button"
              onClick={() => onChange(opt.key)}
              className={cn(
                "flex h-full items-center justify-center px-[8px] py-[6px] rounded-[6px] shrink-0 transition-colors",
                isActive
                  ? "bg-white border border-[#D4DEE9]"
                  : "border border-transparent hover:bg-[#D4DEE9]"
              )}
              aria-label={opt.label}
              aria-pressed={isActive}
            >
              {opt.icon}
            </button>
          </ControlTooltip>
        )
      })}
    </div>
  )
}
