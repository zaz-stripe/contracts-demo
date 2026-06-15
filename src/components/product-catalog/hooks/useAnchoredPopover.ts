'use client'

import { useEffect, useRef } from "react"

export type AnchoredPopoverPosition = { top: number; left: number }

type AnchoredPopoverOpts = {
  isOpen: boolean
  setIsOpen: (next: boolean) => void
  anchorRef: React.RefObject<HTMLElement | null>
  popoverRef: React.RefObject<HTMLElement | null>
  setPosition: (pos: AnchoredPopoverPosition | null) => void
  getPositionFromRect: (rect: DOMRect) => AnchoredPopoverPosition
}

export function useAnchoredPopover({
  isOpen,
  setIsOpen,
  anchorRef,
  popoverRef,
  setPosition,
  getPositionFromRect,
}: AnchoredPopoverOpts) {
  // Callers often pass inline lambdas; keep the latest callback without re-triggering the
  // open/close effect (which would cause a render loop if it sets state).
  const getPositionFromRectRef = useRef(getPositionFromRect)
  useEffect(() => {
    getPositionFromRectRef.current = getPositionFromRect
  }, [getPositionFromRect])

  // Also use refs for setPosition and setIsOpen to avoid re-triggering the effect
  const setPositionRef = useRef(setPosition)
  useEffect(() => {
    setPositionRef.current = setPosition
  }, [setPosition])

  const setIsOpenRef = useRef(setIsOpen)
  useEffect(() => {
    setIsOpenRef.current = setIsOpen
  }, [setIsOpen])

  useEffect(() => {
    if (!isOpen) return

    const rect = anchorRef.current?.getBoundingClientRect()
    if (rect) setPositionRef.current(getPositionFromRectRef.current(rect))

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (!popoverRef.current?.contains(target) && !anchorRef.current?.contains(target)) {
        setIsOpenRef.current(false)
      }
    }

    document.addEventListener("mousedown", handlePointerDown)
    return () => document.removeEventListener("mousedown", handlePointerDown)
  }, [anchorRef, isOpen, popoverRef])
}


