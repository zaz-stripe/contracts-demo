"use client"

import { VariantSkeletonBridge } from "@/components/form-transition-lab/variants/VariantSkeletonBridge"
import { VariantFreezeProcess } from "@/components/form-transition-lab/variants/VariantFreezeProcess"
import { VariantFieldMorph } from "@/components/form-transition-lab/variants/VariantFieldMorph"
import { VariantProgressBar } from "@/components/form-transition-lab/variants/VariantProgressBar"

export function FormTransitionLab() {
  return (
    <div className="min-h-screen bg-[#F4F6F9] px-[24px] py-[28px]">
      <div className="mx-auto flex max-w-[1100px] flex-col gap-[20px]">
        <header className="flex flex-col gap-[4px]">
          <h1 className="text-[20px] font-[600] tracking-[-0.3px] text-[#1A2C44]">
            Form transition lab
          </h1>
          <p className="text-[13px] leading-[18px] text-[#3C4F69]">
            Compare techniques for smoothing the jolt between the Get started wizard and the
            destination plan form. Click <strong>▶ Play</strong> on a card to auto‑run its
            transition, or click the purple <strong>Get started</strong> button inside any card
            to trigger it manually.
          </p>
        </header>
        <div className="grid grid-cols-1 gap-[16px] md:grid-cols-2">
          <VariantSkeletonBridge />
          <VariantFreezeProcess />
          <VariantFieldMorph />
          <VariantProgressBar />
        </div>
      </div>
    </div>
  )
}
