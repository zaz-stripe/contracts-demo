'use client'

import type { ReactNode } from "react"
import { motion, AnimatePresence } from "framer-motion"

import { NoPreviewState } from "@/components/creation-workspace/NoPreviewState"

export type WorkspaceMode = "single" | "related" | "hierarchical"

export type WorkspacePresentation = "fullscreen" | "modal"

type CreationWorkspaceProps = {
  mode: WorkspaceMode
  header: ReactNode
  navigator?: ReactNode
  editor: ReactNode
  /** Object-specific preview (e.g. invoice) when the active kind supports it */
  preview?: ReactNode
  isOpen: boolean
  onClose?: () => void
  /** Modal: centered card + dimmed backdrop. Fullscreen: existing full-viewport shell. */
  presentation?: WorkspacePresentation
}

const dissolveEase = [0.25, 0.1, 0.25, 1.0]

export function CreationWorkspace({
  mode,
  header,
  navigator,
  editor,
  preview,
  isOpen,
  presentation = "fullscreen",
}: CreationWorkspaceProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-30" role="dialog" aria-modal="true">
          {/* Backdrop — cross-fades between dimmed (modal) and white (fullscreen) */}
          <AnimatePresence>
            {presentation === "modal" ? (
              <motion.div
                key="backdrop-dim"
                className="absolute inset-0 bg-black/40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: dissolveEase }}
              />
            ) : (
              <motion.div
                key="backdrop-white"
                className="absolute inset-0 bg-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: dissolveEase }}
              />
            )}
          </AnimatePresence>

          {/* Content — cross-dissolve between modal card and fullscreen shell.
              Both surfaces are absolute-positioned so they overlay during the transition. */}
          <AnimatePresence mode="sync">
            {presentation === "modal" ? (
              <motion.div
                key="surface-modal"
                className="absolute inset-0 z-10 flex items-start justify-center px-[16px] pb-[24px] pt-[min(8vh,64px)]"
                initial={{ opacity: 0, scale: 1.01 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.03 }}
                transition={{ duration: 0.32, ease: dissolveEase }}
              >
                <div className="flex max-h-[min(90vh,760px)] w-full max-w-[560px] flex-col overflow-hidden rounded-[12px] border border-[#EBEEF1] bg-white shadow-[0px_15px_35px_0px_rgba(48,49,61,0.08),0px_5px_15px_0px_rgba(0,0,0,0.12)]">
                  {header}
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    <ModalBodyLayout editor={editor} />
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="surface-full"
                className="absolute inset-0 z-10 flex flex-col bg-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.32, ease: dissolveEase }}
              >
                {header}
                <div className="flex min-h-0 flex-1">
                  {mode === "single" && <SingleLayout editor={editor} />}
                  {mode === "related" && (
                    <RelatedLayout navigator={navigator} editor={editor} preview={preview} />
                  )}
                  {mode === "hierarchical" && (
                    <HierarchicalLayout navigator={navigator} editor={editor} preview={preview} />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  )
}

// ── Modal body: single column scroll (no preview column) ─────────────

function ModalBodyLayout({ editor }: { editor: ReactNode }) {
  return (
    <div className="px-[16px] py-[16px]">
      {editor}
    </div>
  )
}

// ── Single mode: centered form ───────────────────────────────────────

function SingleLayout({ editor }: { editor: ReactNode }) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-[520px] py-[24px] px-[16px]">
        {editor}
      </div>
    </div>
  )
}

// ── Related mode: journey nav + form + optional preview ──────────────

function RelatedLayout({
  editor,
  preview,
}: {
  navigator?: ReactNode
  editor: ReactNode
  preview?: ReactNode
}) {
  const rightPanel = preview ?? <NoPreviewState />

  return (
    <div className="flex min-h-0 min-w-0 flex-1">
      <div className="w-full max-w-[380px] shrink-0 overflow-y-auto border-r border-[#EBEEF1]">
        <div className="px-[16px] py-[16px]">{editor}</div>
      </div>
      <div className="relative min-w-[280px] flex-1 overflow-y-auto bg-[#F8FAFB] sm:min-w-[320px]">
        {rightPanel}
      </div>
    </div>
  )
}

// ── Hierarchical mode: sidebar tree + form + preview ─────────────────

function HierarchicalLayout({
  navigator,
  editor,
  preview,
}: {
  navigator: ReactNode
  editor: ReactNode
  preview?: ReactNode
}) {
  return (
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
  )
}
