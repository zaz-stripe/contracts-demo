'use client'

import { useEffect, useRef, useState, useLayoutEffect } from "react"
import { createPortal } from "react-dom"
import { AiSparkleIcon, TrashIcon, DuplicateIcon, CopyIcon, PasteIcon } from "@/components/ProductCatalogIcons"

export type ContextMenuPosition = { top: number; left: number } | null

const VIEWPORT_PADDING = 8

type ContextMenuProps = {
  t: (key: string) => string
  position: ContextMenuPosition
  onClose: () => void
  deleteLabel: string
  onDelete: () => void
  onAskForChanges?: () => void
  showDuplicate?: boolean
  onDuplicate?: () => void
  showCopySettings?: boolean
  onCopySettings?: () => void
  showPasteSettings?: boolean
  onPasteSettings?: () => void
}

export function ContextMenu({
  t,
  position,
  onClose,
  deleteLabel,
  onDelete,
  onAskForChanges,
  showDuplicate,
  onDuplicate,
  showCopySettings,
  onCopySettings,
  showPasteSettings,
  onPasteSettings,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement | null>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  // Store adjusted position in state to avoid recalculation on every render
  const [adjustedPosition, setAdjustedPosition] = useState<{ top: number; left: number } | null>(null)

  // Close on click outside (effect depends only on position so listeners are stable)
  useEffect(() => {
    if (!position) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onCloseRef.current()
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current()
    }
    // Use timeout to avoid closing immediately from the same click that opened
    const timeout = window.setTimeout(() => {
      document.addEventListener("click", handleClick)
      document.addEventListener("contextmenu", handleClick)
    }, 0)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      window.clearTimeout(timeout)
      document.removeEventListener("click", handleClick)
      document.removeEventListener("contextmenu", handleClick)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [position])

  // Adjust position to stay within viewport (runs once after mount when we have dimensions)
  useLayoutEffect(() => {
    if (!position || !menuRef.current) {
      setAdjustedPosition(null)
      return
    }
    const menu = menuRef.current
    const rect = menu.getBoundingClientRect()

    let { top, left } = position

    // Adjust if going off right edge
    if (left + rect.width > window.innerWidth - VIEWPORT_PADDING) {
      left = window.innerWidth - rect.width - VIEWPORT_PADDING
    }
    // Adjust if going off bottom edge
    if (top + rect.height > window.innerHeight - VIEWPORT_PADDING) {
      top = window.innerHeight - rect.height - VIEWPORT_PADDING
    }
    // Clamp to viewport
    left = Math.max(VIEWPORT_PADDING, left)
    top = Math.max(VIEWPORT_PADDING, top)

    setAdjustedPosition({ top, left })
  }, [position])

  if (!position) return null

  const canUseDOM = typeof document !== "undefined"
  if (!canUseDOM) return null

  // Use adjusted position if available, otherwise fall back to original position
  const finalPosition = adjustedPosition ?? position

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-[9999] w-max overflow-hidden rounded-[6px] border border-[#D8DEE4] bg-white shadow-[0_12px_32px_rgba(28,32,40,0.12)]"
      style={{ top: finalPosition.top, left: finalPosition.left }}
      role="menu"
    >
      {onAskForChanges ? (
        <button
          type="button"
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] font-[600] text-[#353A44] hover:bg-[#F5F6F8] transition-colors whitespace-nowrap"
          role="menuitem"
          onClick={() => {
            onAskForChanges()
            onClose()
          }}
        >
          <AiSparkleIcon className="h-[14px] w-[14px] text-[#474E5A]" />
          {t("Ask for changes")}
        </button>
      ) : null}
      {showDuplicate && onDuplicate ? (
        <button
          type="button"
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] font-[600] text-[#353A44] hover:bg-[#F5F6F8] transition-colors whitespace-nowrap"
          role="menuitem"
          onClick={() => {
            onDuplicate()
            onClose()
          }}
        >
          <DuplicateIcon className="h-[12px] w-[12px] text-[#474E5A]" />
          {t("Duplicate")}
        </button>
      ) : null}
      {showCopySettings && onCopySettings ? (
        <button
          type="button"
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] font-[600] text-[#353A44] hover:bg-[#F5F6F8] transition-colors whitespace-nowrap"
          role="menuitem"
          onClick={() => {
            onCopySettings()
            onClose()
          }}
        >
          <CopyIcon className="h-[12px] w-[12px] text-[#474E5A]" />
          {t("Copy settings")}
        </button>
      ) : null}
      {showPasteSettings && onPasteSettings ? (
        <button
          type="button"
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] font-[600] text-[#353A44] hover:bg-[#F5F6F8] transition-colors whitespace-nowrap"
          role="menuitem"
          onClick={() => {
            onPasteSettings()
            onClose()
          }}
        >
          <PasteIcon className="h-[12px] w-[12px] text-[#474E5A]" />
          {t("Paste settings")}
        </button>
      ) : null}
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] font-[600] text-[#C0123C] hover:bg-[#F5F6F8] transition-colors whitespace-nowrap"
        role="menuitem"
        onClick={() => {
          onDelete()
          onClose()
        }}
      >
        <TrashIcon className="text-[#C0123C]" />
        {deleteLabel}
      </button>
    </div>,
    document.body
  )
}
