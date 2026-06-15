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

type ProductAssistantPanelDockProps = {
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
  onResizePointerDown: (event: React.PointerEvent) => void
}

export function ProductAssistantPanelDock({
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
  onResizePointerDown,
}: ProductAssistantPanelDockProps) {
  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          key="assistant-panel"
          className="flex min-w-0 h-full overflow-hidden"
          initial={{ width: 0, opacity: 0, x: 16 }}
          animate={{ width: widthPx + 1, opacity: 1, x: 0 }}
          exit={{ width: 0, opacity: 0, x: 16 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onAnimationComplete={() => {
            if (isOpenRef.current) onPanelReady()
          }}
        >
          <div className="relative w-px bg-[#EBEEF1]">
            <div
              className="absolute left-1/2 top-0 h-full w-[12px] -translate-x-1/2 cursor-col-resize"
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize panels"
              onPointerDown={onResizePointerDown}
            />
          </div>
          <div className="flex min-w-0 h-full flex-col bg-[#F5F6F8]" style={{ width: `${widthPx}px` }}>
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
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}


