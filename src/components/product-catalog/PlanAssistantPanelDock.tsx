'use client'

import { AnimatePresence, motion } from "framer-motion"
import type { MutableRefObject } from "react"

import {
  ProductAssistantPanel,
  type AssistantAction,
  type AssistantApplyResult,
  type AssistantPreviewResult,
  type AssistantContext,
  type AssistantReference,
} from "@/components/ProductAssistantPanel"

type PlanAssistantPanelDockProps = {
  isOpen: boolean
  widthPx: number
  isOpenRef: MutableRefObject<boolean>
  onPanelReady: () => void
  onClose: () => void
  context: AssistantContext
  onApplyActions: (actions: AssistantAction[]) => AssistantApplyResult
  onPreviewActions?: (actions: AssistantAction[]) => AssistantPreviewResult
  onConfirmPreview?: () => void
  initialUserMessage: string | null
  onConsumeInitialUserMessage: () => void
  draftReference?: AssistantReference | null
  onConsumeDraftReference?: () => void
  applyDelayMs?: number
  onBeginApply: (actions: AssistantAction[]) => void
  onEndApply: () => void
}

export function PlanAssistantPanelDock({
  isOpen,
  widthPx,
  isOpenRef,
  onPanelReady,
  onClose,
  context,
  onApplyActions,
  onPreviewActions,
  onConfirmPreview,
  initialUserMessage,
  onConsumeInitialUserMessage,
  draftReference,
  onConsumeDraftReference,
  applyDelayMs = 2000,
  onBeginApply,
  onEndApply,
}: PlanAssistantPanelDockProps) {
  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          className="flex h-full"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: widthPx, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onAnimationComplete={() => {
            if (isOpenRef.current) onPanelReady()
          }}
        >
          <div
            className="flex min-w-0 flex-col border-l border-[#EBEEF1] bg-white rounded-l-[12px] shadow-[-2px_0_2px_rgba(0,0,0,0.01),-4px_0_4px_rgba(0,0,0,0.01),-8px_0_8px_rgba(0,0,0,0.01),-16px_0_16px_rgba(0,0,0,0.01)] xl:bg-[#F5F6F8] xl:rounded-l-none xl:shadow-none"
            style={{ width: `${widthPx}px` }}
          >
            <ProductAssistantPanel
              onClose={onClose}
              context={context}
              onApplyActions={onApplyActions}
              onPreviewActions={onPreviewActions}
              onConfirmPreview={onConfirmPreview}
              initialUserMessage={initialUserMessage}
              onConsumeInitialUserMessage={onConsumeInitialUserMessage}
              draftReference={draftReference}
              onConsumeDraftReference={onConsumeDraftReference}
              applyDelayMs={applyDelayMs}
              onBeginApply={onBeginApply}
              onEndApply={onEndApply}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}


