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
const SHARED_DURATION = 0.3
const SHARED_EASE = [0.4, 0, 0.2, 1] as const

export function VariantB() {
  const [isWizardActive, setIsWizardActive] = useState(true)

  const replay = () => {
    setIsWizardActive(true)
    setTimeout(() => setIsWizardActive(false), 350)
  }

  return (
    <VariantFrame
      title="B — Matched timing"
      description="Header animates height and opacity at the same 300ms duration and easing as the sidebar so they move as one motion."
      onReplay={replay}
    >
      <div className="flex h-full w-full flex-col">
        <motion.div
          className="overflow-hidden"
          animate={{
            height: isWizardActive ? 0 : "auto",
            opacity: isWizardActive ? 0 : 1,
          }}
          transition={{ duration: SHARED_DURATION, ease: SHARED_EASE }}
        >
          <MockHeader />
        </motion.div>
        <div className="flex flex-1 overflow-hidden">
          <motion.div
            className="overflow-hidden"
            animate={{ width: isWizardActive ? 0 : SIDEBAR_WIDTH }}
            transition={{ duration: SHARED_DURATION, ease: SHARED_EASE }}
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
