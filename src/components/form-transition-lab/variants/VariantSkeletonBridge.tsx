"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  MockDestinationForm,
  MockSkeletonForm,
  MockWizardForm,
  VariantFrame,
} from "@/components/form-transition-lab/MockForms"

const SKELETON_DURATION_MS = 320
const FADE_MS = 0.28

type Phase = "wizard" | "skeleton" | "destination"

export function VariantSkeletonBridge() {
  const [phase, setPhase] = useState<Phase>("wizard")
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const handleSubmit = () => {
    setPhase("skeleton")
    timers.current.push(setTimeout(() => setPhase("destination"), SKELETON_DURATION_MS))
  }

  const replay = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setPhase("wizard")
    timers.current.push(setTimeout(() => handleSubmit(), 280))
  }

  return (
    <VariantFrame
      title="A — Skeleton bridge"
      description="On click, the form area instantly becomes shimmer skeletons for ~320ms, then fades into the destination form."
      onReplay={replay}
    >
      <AnimatePresence mode="wait">
        {phase === "wizard" && (
          <motion.div
            key="wizard"
            className="absolute inset-0"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
          >
            <MockWizardForm onSubmit={handleSubmit} />
          </motion.div>
        )}
        {phase === "skeleton" && (
          <motion.div
            key="skeleton"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
          >
            <MockSkeletonForm />
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
