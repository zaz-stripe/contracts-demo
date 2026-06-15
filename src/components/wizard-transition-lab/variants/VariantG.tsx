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

export function VariantG() {
  const [isWizardActive, setIsWizardActive] = useState(true)

  const replay = () => {
    setIsWizardActive(true)
    setTimeout(() => setIsWizardActive(false), 350)
  }

  return (
    <VariantFrame
      title="G — Full crossfade"
      description="Two complete states stacked: the wizard-only layout fades out while the full editor layout fades in."
      onReplay={replay}
    >
      <div className="relative h-full w-full">
        <div className="absolute inset-0 flex flex-col">
          <MockHeader />
          <div className="flex flex-1 overflow-hidden">
            <div style={{ width: SIDEBAR_WIDTH }} className="h-full">
              <MockSidebar />
            </div>
            <div className="flex-1 overflow-hidden">
              <MockEditorForm />
            </div>
          </div>
        </div>
        <AnimatePresence>
          {isWizardActive && (
            <motion.div
              key="wizard-state"
              className="absolute inset-0 bg-white"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.26, ease: "easeOut" }}
            >
              <MockWizard />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </VariantFrame>
  )
}
