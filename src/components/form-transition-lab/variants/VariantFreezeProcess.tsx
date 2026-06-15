"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  MockDestinationForm,
  MockWizardForm,
  VariantFrame,
} from "@/components/form-transition-lab/MockForms"

const FREEZE_MS = 280
const FADE_MS = 0.28

type Phase = "wizard" | "freezing" | "destination"

export function VariantFreezeProcess() {
  const [phase, setPhase] = useState<Phase>("wizard")
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const handleSubmit = () => {
    setPhase("freezing")
    timers.current.push(setTimeout(() => setPhase("destination"), FREEZE_MS))
  }

  const replay = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setPhase("wizard")
    timers.current.push(setTimeout(() => handleSubmit(), 280))
  }

  return (
    <VariantFrame
      title="B — Freeze and process"
      description="Wizard fields disable + dim with a button spinner for ~280ms (registers click), then fade and reveal destination."
      onReplay={replay}
    >
      <AnimatePresence mode="wait">
        {(phase === "wizard" || phase === "freezing") && (
          <motion.div
            key="wizard"
            className="absolute inset-0"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <MockWizardForm
              disabled={phase === "freezing"}
              loading={phase === "freezing"}
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
