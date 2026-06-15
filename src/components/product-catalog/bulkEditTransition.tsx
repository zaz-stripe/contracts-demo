'use client'

import type { ReactNode } from "react"
import { createContext, useContext, useMemo, useState } from "react"

/**
 * Expand: Current behaviour — left dock expands to full width, sidebar slides away,
 *         header swaps to BulkRateEditor's internal title row.
 * Inline: Nav stays in place, only the form area swaps to the bulk-edit spreadsheet.
 * Header: Left dock expands, sidebar slides away, but the modal header stays in place
 *         and cross-fades its contents (plan name → "Editing N rates", buttons fade out).
 */
export type BulkEditTransition = "expand" | "inline" | "header"

type BulkEditTransitionContextValue = {
  bulkEditTransition: BulkEditTransition
  setBulkEditTransition: (next: BulkEditTransition) => void
}

const BulkEditTransitionContext = createContext<BulkEditTransitionContextValue | null>(null)

export function BulkEditTransitionProvider({ children }: { children: ReactNode }) {
  const [bulkEditTransition, setBulkEditTransition] = useState<BulkEditTransition>("header")

  const value = useMemo(() => ({ bulkEditTransition, setBulkEditTransition }), [bulkEditTransition])

  return <BulkEditTransitionContext.Provider value={value}>{children}</BulkEditTransitionContext.Provider>
}

export function useBulkEditTransition(): BulkEditTransitionContextValue {
  const ctx = useContext(BulkEditTransitionContext)
  if (!ctx) return { bulkEditTransition: "header", setBulkEditTransition: () => {} }
  return ctx
}
