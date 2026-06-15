"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { VariantFrame } from "@/components/form-transition-lab/MockForms"

const FADE_MS = 0.28
const STAGGER_MS = 0.04

type Phase = "wizard" | "destination"

export function VariantFieldMorph() {
  const [phase, setPhase] = useState<Phase>("wizard")
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const handleSubmit = () => setPhase("destination")
  const replay = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setPhase("wizard")
    timers.current.push(setTimeout(() => handleSubmit(), 280))
  }

  const isWizard = phase === "wizard"

  return (
    <VariantFrame
      title="D — Field morph (FLIP)"
      description="The Plan name field stays anchored and becomes Display name. Surrounding fields cascade out / in for spatial continuity."
      onReplay={replay}
    >
      <div className="absolute inset-0 flex flex-col bg-white">
        {/* Top swap zone: wizard subtitle <-> destination panel header */}
        <div className="relative h-[44px]">
          <AnimatePresence mode="wait">
            {isWizard ? (
              <motion.div
                key="wizard-subtitle"
                className="absolute inset-0 flex flex-col gap-[2px] px-[16px] pt-[16px]"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: FADE_MS / 2, ease: "easeOut" }}
              >
                <p className="text-[14px] font-[500] leading-[20px] tracking-[-0.15px] text-[#1A2C44]">
                  Get started
                </p>
                <p className="text-[12px] font-[400] leading-[16px] text-[#50617A]">
                  Create a new pricing plan
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="dest-header"
                className="absolute inset-0 flex items-end px-[16px] pb-[8px]"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: FADE_MS, ease: [0.4, 0, 0.2, 1], delay: FADE_MS / 2 }}
              >
                <p className="text-[14px] font-[500] leading-[20px] tracking-[-0.15px] text-[#1A2C44]">
                  Pricing plan
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-col gap-[12px] px-[16px] pt-[8px]">
          {/* Anchored field: Plan name <-> Display name */}
          <div className="flex flex-col gap-[4px]">
            <div className="relative h-[16px]">
              <AnimatePresence mode="wait">
                <motion.p
                  key={isWizard ? "label-wizard" : "label-dest"}
                  className="absolute inset-0 text-[12px] font-[600] leading-[16px] text-[#1A2C44]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: FADE_MS / 2, ease: "easeOut" }}
                >
                  {isWizard ? "Plan name" : "Display name"}
                </motion.p>
              </AnimatePresence>
            </div>
            <motion.div
              layout
              className="flex h-[30px] w-full items-center rounded-[6px] border border-[#D4DEE9] bg-white px-[10px]"
              transition={{ duration: FADE_MS, ease: [0.4, 0, 0.2, 1] }}
            >
              <p className="text-[12px] font-[400] text-[#8C95A6]">
                {isWizard ? "e.g. Starter" : "e.g. Pro plan"}
              </p>
            </motion.div>
          </div>

          {/* Swap zone: wizard remainder vs destination remainder */}
          <div className="relative">
            <AnimatePresence mode="wait">
              {isWizard ? (
                <motion.div
                  key="wizard-rest"
                  className="flex flex-col gap-[12px]"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: FADE_MS / 2, ease: "easeOut" }}
                >
                  <FieldRow label="Subscription fee" />
                  <FieldRow label="Credit grant" />
                  <Field label="What usage will customers be billed for?" placeholder="e.g. Credits, API calls" />
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="mt-[4px] flex h-[34px] w-full items-center justify-center rounded-[6px] bg-[#A99CFE] text-[12px] font-[600] text-white hover:bg-[#8A77F5]"
                  >
                    Get started
                  </button>
                </motion.div>
              ) : (
                <motion.div key="dest-rest" className="flex flex-col gap-[12px]">
                  {[
                    { label: "Currency", placeholder: "🇺🇸 USD", chevron: true },
                    { label: "Include tax in prices", placeholder: "Included in prices", chevron: true },
                  ].map((f, i) => (
                    <motion.div
                      key={f.label}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: FADE_MS,
                        ease: [0.4, 0, 0.2, 1],
                        delay: FADE_MS / 2 + i * STAGGER_MS,
                      }}
                    >
                      <Field {...f} />
                    </motion.div>
                  ))}
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: FADE_MS,
                      ease: [0.4, 0, 0.2, 1],
                      delay: FADE_MS / 2 + 2 * STAGGER_MS,
                    }}
                    className="mt-[4px] flex items-center justify-between rounded-[6px] border border-transparent px-[2px] py-[4px]"
                  >
                    <p className="text-[13px] font-[600] text-[#1A2C44]">Advanced settings</p>
                    <ChevronDown />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </VariantFrame>
  )
}

function Field({
  label,
  placeholder,
  chevron,
}: {
  label: string
  placeholder: string
  chevron?: boolean
}) {
  return (
    <div className="flex flex-col gap-[4px]">
      <p className="text-[12px] font-[600] leading-[16px] text-[#1A2C44]">{label}</p>
      <div className="flex h-[30px] w-full items-center justify-between rounded-[6px] border border-[#D4DEE9] bg-white px-[10px]">
        <p className="text-[12px] font-[400] text-[#8C95A6]">{placeholder}</p>
        {chevron && <ChevronDown />}
      </div>
    </div>
  )
}

function FieldRow({ label }: { label: string }) {
  return (
    <div className="flex flex-col gap-[4px]">
      <p className="text-[12px] font-[600] leading-[16px] text-[#1A2C44]">{label}</p>
      <div className="flex w-full">
        <div className="flex h-[30px] flex-1 items-center rounded-l-[6px] border border-[#D4DEE9] bg-white px-[10px]">
          <p className="text-[12px] font-[400] text-[#8C95A6]">$ 0</p>
        </div>
        <div className="flex h-[30px] w-[110px] items-center justify-between rounded-r-[6px] border-y border-r border-[#D4DEE9] bg-white px-[10px]">
          <p className="text-[12px] font-[400] text-[#1A2C44]">Monthly</p>
          <ChevronDown />
        </div>
      </div>
    </div>
  )
}

function ChevronDown() {
  return (
    <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
      <path
        d="M1 1L5 5L9 1"
        stroke="#8C95A6"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
