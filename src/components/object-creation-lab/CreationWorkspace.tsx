'use client'

import type { ReactNode } from "react"
import { motion, AnimatePresence } from "framer-motion"

import { NoPreviewState } from "@/components/creation-workspace/NoPreviewState"

type CreationWorkspaceProps = {
  mode: "single" | "related" | "hierarchical"
  isOpen: boolean
  onClose?: () => void
  header: ReactNode
  navigator?: ReactNode
  editor: ReactNode
  preview?: ReactNode
}

/**
 * Full-screen creation shell (edge-to-edge, no floating modal card).
 */
export function CreationWorkspace({
  mode,
  isOpen,
  header,
  navigator,
  editor,
  preview,
}: CreationWorkspaceProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {header}

          <div className="flex min-h-0 flex-1">
            {mode === "single" && (
              <div className="flex-1 overflow-y-auto">
                <div className="mx-auto max-w-[480px] px-[16px] py-[24px]">
                  {editor}
                </div>
              </div>
            )}
            {mode === "related" && (
              <div className="flex min-h-0 flex-1 flex-col">
                {navigator}
                <div className="flex min-h-0 min-w-0 flex-1">
                  <div className="w-full max-w-[480px] shrink-0 overflow-y-auto border-r border-[#EBEEF1]">
                    <div className="px-[16px] py-[16px]">{editor}</div>
                  </div>
                  <div className="min-h-0 min-w-[280px] max-w-[480px] flex-1 overflow-y-auto bg-[#F8FAFB] shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)] sm:min-w-[320px]">
                    {preview ?? <NoPreviewState />}
                  </div>
                </div>
              </div>
            )}
            {mode === "hierarchical" && (
              <div className="flex min-h-0 flex-1">
                {navigator && (
                  <div className="w-[280px] shrink-0 overflow-y-auto border-r border-[#EBEEF1]">
                    {navigator}
                  </div>
                )}
                <div className="w-[380px] shrink-0 overflow-y-auto border-r border-[#EBEEF1]">
                  {editor}
                </div>
                {preview && (
                  <div className="flex-1 overflow-y-auto bg-[#F8FAFB]">
                    {preview}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
