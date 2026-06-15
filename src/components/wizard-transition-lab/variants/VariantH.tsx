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

export function VariantH() {
  const [isWizardActive, setIsWizardActive] = useState(true)

  const replay = () => {
    setIsWizardActive(true)
    setTimeout(() => setIsWizardActive(false), 350)
  }

  return (
    <VariantFrame
      title="H — Wizard settles into the panel"
      description="Header and sidebar are already in place. Wizard scales down to about 96% as it fades, like it's settling into the form panel."
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
                  className="absolute inset-0 origin-center bg-white"
                  initial={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
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
