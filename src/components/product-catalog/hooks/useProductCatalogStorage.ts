'use client'

import { useCallback, useEffect, useRef, useState } from "react"

export function useProductCatalogStorage<T>(opts: {
  storageKey: string
  initialValue: T
  isValid?: (value: unknown) => value is T
  /** When true, skip auto-persist and require explicit save() calls */
  manualSaveOnly?: boolean
}) {
  const { storageKey, initialValue, isValid, manualSaveOnly = false } = opts
  const initialValueRef = useRef(initialValue)

  const [value, setValue] = useState<T>(initialValue)
  const [hasRestoredFromStorage, setHasRestoredFromStorage] = useState(false)

  // Restore persisted value on mount
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const stored = window.localStorage.getItem(storageKey)
      if (stored) {
        const parsed = JSON.parse(stored) as unknown
        if (!isValid || isValid(parsed)) {
          const hasDefaults = Array.isArray(initialValueRef.current) && (initialValueRef.current as unknown[]).length > 0
          if (hasDefaults) {
            const storedArr = Array.isArray(parsed) ? parsed as unknown[] : []
            const defaultIds = new Set((initialValueRef.current as { id?: number }[]).map((d) => d.id))
            const userItems = storedArr.filter((item) => {
              const id = (item as { id?: number }).id
              return id !== undefined && !defaultIds.has(id)
            })
            setValue([...(initialValueRef.current as unknown[]), ...userItems] as unknown as T)
          } else {
            setValue(parsed as T)
          }
        }
      }
    } catch {
      // ignore corrupt data
    }

    // Important: avoid clobbering stored values with defaults during initial mount
    // (especially in React StrictMode where effects can run twice in dev).
    setHasRestoredFromStorage(true)
  }, [storageKey])

  // Self-heal: during Fast Refresh, React can preserve state values across edits.
  // If an earlier edit temporarily set an invalid value (e.g. `undefined`), we should
  // recover to the caller-provided initial value rather than crashing render paths.
  useEffect(() => {
    if (!hasRestoredFromStorage) return
    if (!isValid) return
    if (isValid(value)) return
    setValue(initialValueRef.current)
  }, [hasRestoredFromStorage, isValid, value])

  // Persist on change (only if not in manual save mode)
  useEffect(() => {
    if (manualSaveOnly) return // Skip auto-persist in manual save mode
    if (typeof window === "undefined") return
    if (!hasRestoredFromStorage) return
    if (isValid && !isValid(value)) return
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(value))
    } catch {
      // ignore quota errors
    }
  }, [hasRestoredFromStorage, storageKey, value, manualSaveOnly, isValid])

  // Explicit save function for manual save mode
  // Optionally accepts a value to save directly (useful when calling right after setState)
  const save = useCallback((valueToSave?: T) => {
    if (typeof window === "undefined") return
    const saveValue = valueToSave !== undefined ? valueToSave : value
    if (isValid && !isValid(saveValue)) return
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(saveValue))
    } catch {
      // ignore quota errors
    }
  }, [storageKey, value, isValid])

  // Clear function to remove from storage
  const clear = useCallback(() => {
    if (typeof window === "undefined") return
    try {
      window.localStorage.removeItem(storageKey)
    } catch {
      // ignore errors
    }
  }, [storageKey])

  return { value, setValue, hasRestoredFromStorage, save, clear }
}


