"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  MockEditorForm,
  MockHeader,
  MockSidebar,
  MockWizard,
  VariantFrame,
} from "@/components/wizard-transition-lab/MockChrome"

const SIDEBAR_WIDTH = 110

export function VariantF() {
  const [isWizardActive, setIsWizardActive] = useState(true)

  const replay = () => {
    setIsWizardActive(true)
    setTimeout(() => setIsWizardActive(false), 350)
  }

  return (
    <VariantFrame
      title="F — Wizard lifts and fades"
      description="Header and sidebar are already in place. Wizard slides up about 12px as it fades — one focused motion."
      onReplay={replay}
    >
      <div className="flex h-full w-full flex-col">
        <MockHeader />
        <div className="flex flex-1 overflow-hidden">
          <div style={{ width: SIDEBAR_WIDTH }} className="h-full">
            <MockSidebar />
          </div>
          <div className="relative flex-1 overflow-hidden">
            <MockEditorForm />
            <AnimatePresence>
              {isWizardActive && (
                <motion.div
                  key="wizard"
                  className="absolute inset-0 bg-white"
                  initial={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.26, ease: [0.22, 0.61, 0.36, 1] }}
                >
                  <MockWizard />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </VariantFrame>
  )
}
