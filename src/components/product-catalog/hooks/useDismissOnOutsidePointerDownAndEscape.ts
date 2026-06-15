'use client'

import { useEffect } from "react"

export function useDismissOnOutsidePointerDownAndEscape(opts: {
  isOpen: boolean
  anchorRef: React.RefObject<HTMLElement | null>
  popoverRef: React.RefObject<HTMLElement | null>
  onDismiss: () => void
}): void {
  const { isOpen, anchorRef, popoverRef, onDismiss } = opts

  useEffect(() => {
    if (!isOpen) return
    if (typeof document === "undefined") return

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      const anchor = anchorRef.current
      const popover = popoverRef.current
      if (anchor?.contains(target)) return
      if (popover?.contains(target)) return
      onDismiss()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDismiss()
    }

    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [anchorRef, isOpen, onDismiss, popoverRef])
}


