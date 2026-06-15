'use client'

import { useEffect } from "react"

export function usePointerUpCancel(isActive: boolean, onCancel: () => void): void {
  useEffect(() => {
    if (!isActive) return
    if (typeof window === "undefined") return

    const handlePointerUp = () => onCancel()
    window.addEventListener("pointerup", handlePointerUp)
    window.addEventListener("pointercancel", handlePointerUp)
    return () => {
      window.removeEventListener("pointerup", handlePointerUp)
      window.removeEventListener("pointercancel", handlePointerUp)
    }
  }, [isActive, onCancel])
}


