"use client"

import { VariantA } from "@/components/wizard-transition-lab/variants/VariantA"
import { VariantB } from "@/components/wizard-transition-lab/variants/VariantB"
import { VariantC } from "@/components/wizard-transition-lab/variants/VariantC"
import { VariantD } from "@/components/wizard-transition-lab/variants/VariantD"
import { VariantE } from "@/components/wizard-transition-lab/variants/VariantE"
import { VariantF } from "@/components/wizard-transition-lab/variants/VariantF"
import { VariantG } from "@/components/wizard-transition-lab/variants/VariantG"
import { VariantH } from "@/components/wizard-transition-lab/variants/VariantH"
import { VariantI } from "@/components/wizard-transition-lab/variants/VariantI"

export function WizardTransitionLab() {
  return (
    <div className="min-h-screen bg-[#F4F6F9] px-[24px] py-[28px]">
      <div className="mx-auto flex max-w-[1100px] flex-col gap-[20px]">
        <header className="flex flex-col gap-[4px]">
          <h1 className="text-[20px] font-[600] tracking-[-0.3px] text-[#1A2C44]">
            Wizard transition lab
          </h1>
          <p className="text-[13px] leading-[18px] text-[#3C4F69]">
            Click Replay on each card to compare how the inline Get started wizard hands off to the
            real editor. Each card mocks the modal at a small scale so the only thing changing is
            how the top header and sidebar appear when the wizard exits.
          </p>
        </header>
        <div className="grid grid-cols-1 gap-[16px] md:grid-cols-2">
          <VariantA />
          <VariantB />
          <VariantC />
          <VariantD />
          <VariantE />
          <VariantF />
          <VariantG />
          <VariantH />
          <VariantI />
        </div>
      </div>
    </div>
  )
}
