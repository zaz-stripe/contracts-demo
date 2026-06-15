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

export function VariantI() {
  const [isWizardActive, setIsWizardActive] = useState(true)

  const replay = () => {
    setIsWizardActive(true)
    setTimeout(() => setIsWizardActive(false), 350)
  }

  return (
    <VariantFrame
      title="I — Header sheet drops in"
      description="Sidebar already in place. Header slides down from the top edge after the wizard fades, like a sheet attaching."
      onReplay={replay}
    >
      <div className="relative flex h-full w-full flex-col overflow-hidden">
        <motion.div
          animate={{ y: isWizardActive ? -40 : 0, opacity: isWizardActive ? 0 : 1 }}
          transition={{ duration: 0.28, ease: [0.22, 0.61, 0.36, 1], delay: isWizardActive ? 0 : 0.12 }}
        >
          <MockHeader />
        </motion.div>
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
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
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
