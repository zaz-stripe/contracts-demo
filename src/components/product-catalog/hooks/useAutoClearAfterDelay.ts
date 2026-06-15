'use client'

import { useEffect } from "react"

export function useAutoClearAfterDelay<T>(value: T | null, delayMs: number, onClear: () => void): void {
  useEffect(() => {
    if (value == null) return
    const timeout = setTimeout(() => onClear(), delayMs)
    return () => clearTimeout(timeout)
  }, [delayMs, onClear, value])
}


