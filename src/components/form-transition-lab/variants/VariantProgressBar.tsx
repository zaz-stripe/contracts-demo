"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  MockDestinationForm,
  MockWizardForm,
  VariantFrame,
} from "@/components/form-transition-lab/MockForms"

const PROGRESS_MS = 380
const FADE_MS = 0.28

type Phase = "wizard" | "loading" | "destination"

export function VariantProgressBar() {
  const [phase, setPhase] = useState<Phase>("wizard")
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const handleSubmit = () => {
    setPhase("loading")
    timers.current.push(setTimeout(() => setPhase("destination"), PROGRESS_MS))
  }

  const replay = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setPhase("wizard")
    timers.current.push(setTimeout(() => handleSubmit(), 280))
  }

  return (
    <VariantFrame
      title="E — Inline progress bar"
      description="A 2px indeterminate bar runs along the top of the form for ~380ms, then the destination crossfades in. Reads as a 'navigation' moment."
      onReplay={replay}
    >
      {/* Progress bar overlay */}
      <AnimatePresence>
        {phase === "loading" && (
          <motion.div
            key="progress"
            className="absolute left-0 right-0 top-0 z-10 h-[2px] overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
          >
            <motion.div
              className="h-full bg-[#A99CFE]"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: PROGRESS_MS / 1000, ease: [0.4, 0, 0.2, 1] }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {(phase === "wizard" || phase === "loading") && (
          <motion.div
            key="wizard"
            className="absolute inset-0"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
          >
            <MockWizardForm
              disabled={phase === "loading"}
              onSubmit={handleSubmit}
            />
          </motion.div>
        )}
        {phase === "destination" && (
          <motion.div
            key="destination"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: FADE_MS, ease: [0.4, 0, 0.2, 1] }}
          >
            <MockDestinationForm />
          </motion.div>
        )}
      </AnimatePresence>
    </VariantFrame>
  )
}
