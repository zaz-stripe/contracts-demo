'use client'

import { cn } from "@/lib/utils"

type SegmentedControlProps<T extends string> = {
  value: T
  onChange: (next: T) => void
  options: readonly T[]
  getDisplayValue?: (value: T) => string
  className?: string
  onFocus?: () => void
  onBlur?: () => void
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  getDisplayValue,
  className,
  onFocus,
  onBlur,
}: SegmentedControlProps<T>) {
  return (
    <div
      className={cn(
        "flex h-[28px] w-full items-center justify-center overflow-clip rounded-[6px] bg-[#ECF1F6]",
        className
      )}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      {options.map((option) => {
        const isSelected = option === value
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={cn(
              "flex h-full flex-1 items-center justify-center px-[12px] py-[6px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] transition-colors whitespace-nowrap",
              isSelected
                ? "rounded-[6px] border border-[#D4DEE9] bg-white text-[#353A44]"
                : "rounded-[4px] border border-transparent text-[#50617A] hover:bg-[#D4DEE9]"
            )}
            aria-pressed={isSelected}
          >
            {getDisplayValue ? getDisplayValue(option) : option}
          </button>
        )
      })}
    </div>
  )
}
