"use client"

import type { ReactNode } from "react"

export function MockHeader({ opacity = 1 }: { opacity?: number }) {
  return (
    <div
      className="flex items-center gap-[8px] border-b border-[#EBEEF1] bg-white px-[12px] py-[8px]"
      style={{ opacity }}
    >
      <div className="h-[10px] w-[10px] rounded-[3px] bg-[#D4DEE9]" />
      <div className="h-[8px] w-[80px] rounded-[3px] bg-[#1A2C44]" />
      <div className="ml-auto flex items-center gap-[6px]">
        <div className="h-[16px] w-[44px] rounded-[6px] bg-[#F5F6F8]" />
        <div className="h-[16px] w-[60px] rounded-[6px] bg-[#1A2C44]" />
      </div>
    </div>
  )
}

export function MockSidebar() {
  return (
    <div className="flex h-full flex-col gap-[8px] bg-white p-[10px]">
      <div className="h-[20px] w-full rounded-[4px] bg-[#F5F6F8]" />
      <div className="mt-[2px] flex items-center gap-[6px]">
        <div className="h-[10px] w-[10px] rounded-[2px] bg-[#1A2C44]" />
        <div className="h-[6px] w-[60px] rounded-[2px] bg-[#1A2C44]" />
      </div>
      <div className="ml-[8px] flex items-center gap-[6px]">
        <div className="h-[10px] w-[10px] rounded-[2px] bg-[#D4DEE9]" />
        <div className="h-[6px] w-[80px] rounded-[2px] bg-[#3C4F69]" />
      </div>
      <div className="ml-[16px] flex items-center gap-[6px]">
        <div className="h-[10px] w-[10px] rounded-[2px] bg-[#D4DEE9]" />
        <div className="h-[6px] w-[40px] rounded-[2px] bg-[#3C4F69]" />
      </div>
      <div className="ml-[8px] flex items-center gap-[6px]">
        <div className="h-[10px] w-[10px] rounded-[2px] bg-[#D4DEE9]" />
        <div className="h-[6px] w-[70px] rounded-[2px] bg-[#3C4F69]" />
      </div>
    </div>
  )
}

export function MockEditorForm() {
  return (
    <div className="flex h-full flex-col gap-[10px] bg-white p-[12px]">
      <div className="h-[8px] w-[80px] rounded-[2px] bg-[#1A2C44]" />
      <div className="h-[28px] w-full rounded-[6px] border border-[#D4DEE9] bg-white" />
      <div className="mt-[6px] h-[8px] w-[60px] rounded-[2px] bg-[#1A2C44]" />
      <div className="h-[28px] w-full rounded-[6px] border border-[#D4DEE9] bg-white" />
      <div className="mt-[6px] h-[8px] w-[100px] rounded-[2px] bg-[#1A2C44]" />
      <div className="h-[28px] w-full rounded-[6px] border border-[#D4DEE9] bg-white" />
    </div>
  )
}

export function MockWizard() {
  return (
    <div className="flex h-full flex-col gap-[12px] bg-white p-[16px]">
      <div className="h-[10px] w-[140px] rounded-[3px] bg-[#1A2C44]" />
      <div className="h-[6px] w-[200px] rounded-[2px] bg-[#3C4F69]" />
      <div className="mt-[8px] h-[8px] w-[80px] rounded-[2px] bg-[#1A2C44]" />
      <div className="h-[28px] w-full rounded-[6px] border border-[#D4DEE9] bg-white" />
      <div className="mt-[6px] h-[8px] w-[160px] rounded-[2px] bg-[#1A2C44]" />
      <div className="h-[28px] w-full rounded-[6px] border border-[#D4DEE9] bg-white" />
      <div className="mt-auto flex justify-end">
        <div className="h-[24px] w-[80px] rounded-[6px] bg-[#1A2C44]" />
      </div>
    </div>
  )
}

export function VariantFrame({
  title,
  description,
  onReplay,
  children,
}: {
  title: string
  description: string
  onReplay: () => void
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-[10px] rounded-[10px] border border-[#EBEEF1] bg-white p-[14px]">
      <div className="flex items-start justify-between gap-[12px]">
        <div className="flex flex-col">
          <p className="text-[13px] font-[600] tracking-[-0.15px] text-[#1A2C44]">{title}</p>
          <p className="text-[12px] leading-[16px] text-[#3C4F69]">{description}</p>
        </div>
        <button
          type="button"
          onClick={onReplay}
          className="shrink-0 rounded-[6px] border border-[#D4DEE9] bg-white px-[10px] py-[5px] text-[12px] font-[500] text-[#1A2C44] hover:bg-[#F5F6F8]"
        >
          Replay
        </button>
      </div>
      <div className="relative h-[300px] w-full overflow-hidden rounded-[8px] border border-[#EBEEF1] bg-[#F8FAFC]">
        {children}
      </div>
    </div>
  )
}
