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

export function VariantC() {
  const [isWizardActive, setIsWizardActive] = useState(true)

  const replay = () => {
    setIsWizardActive(true)
    setTimeout(() => setIsWizardActive(false), 350)
  }

  return (
    <VariantFrame
      title="C — Snap sidebar"
      description="Sidebar appears instantly on wizard exit. Only the header animates so there is one motion at a time."
      onReplay={replay}
    >
      <div className="flex h-full w-full flex-col">
        <motion.div
          className="overflow-hidden"
          animate={{
            height: isWizardActive ? 0 : "auto",
            opacity: isWizardActive ? 0 : 1,
          }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <MockHeader />
        </motion.div>
        <div className="flex flex-1 overflow-hidden">
          <div
            className="overflow-hidden"
            style={{ width: isWizardActive ? 0 : SIDEBAR_WIDTH }}
          >
            <div style={{ width: SIDEBAR_WIDTH }} className="h-full">
              <MockSidebar />
            </div>
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
