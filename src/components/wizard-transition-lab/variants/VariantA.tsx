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
const HEADER_DURATION = 0.18

export function VariantA() {
  const [isWizardActive, setIsWizardActive] = useState(true)

  const replay = () => {
    setIsWizardActive(true)
    setTimeout(() => setIsWizardActive(false), 350)
  }

  return (
    <VariantFrame
      title="A — Opacity only header"
      description="Header slot stays at full height. Wizard exit only fades the header in. Sidebar slides as today."
      onReplay={replay}
    >
      <div className="flex h-full w-full flex-col">
        <motion.div
          animate={{ opacity: isWizardActive ? 0 : 1 }}
          transition={{ duration: HEADER_DURATION, ease: "easeOut" }}
        >
          <MockHeader />
        </motion.div>
        <div className="flex flex-1 overflow-hidden">
          <motion.div
            className="overflow-hidden"
            animate={{ width: isWizardActive ? 0 : SIDEBAR_WIDTH }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <div style={{ width: SIDEBAR_WIDTH }} className="h-full">
              <MockSidebar />
            </div>
          </motion.div>
          <div className="relative flex-1 overflow-hidden">
            <MockEditorForm />
            <AnimatePresence>
              {isWizardActive && (
                <motion.div
                  key="wizard"
                  className="absolute inset-0 bg-white"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
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
