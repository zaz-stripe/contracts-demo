"use client"

import { useState, useRef, useCallback } from "react"
import { Loader2 } from "lucide-react"
import ContractEditorBase from "../ContractEditorBase"
import { DEFAULT_STATE, chatJSON, type ContractState } from "../types"

const SYSTEM_PROMPT = `You are helping auto-complete a Stripe enterprise contract form.
Given the field name and current contract state, suggest a single completion value for the field.
If the field already has a good value, return an empty suggestion.
Return JSON: {"suggestion": "<value or empty string>", "reason": "<1 sentence why>"}`

export default function InlineGhosting() {
  const [state, setState] = useState<ContractState>(DEFAULT_STATE)
  const [ghosts, setGhosts] = useState<Record<string, string>>({})
  const [activeField, setActiveField] = useState<string>()
  const [loadingField, setLoadingField] = useState<string>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const debounceRef = useRef<any>(undefined)

  const handleFocus = useCallback(
    (fieldId: string, currentValue: string) => {
      setActiveField(fieldId)
      clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(async () => {
        setLoadingField(fieldId)
        const result = await chatJSON<{ suggestion: string }>(
          SYSTEM_PROMPT,
          `Field: "${fieldId}"\nCurrent value: "${currentValue}"\nContract: ${JSON.stringify(state)}`,
          { suggestion: "" }
        )
        if (result.suggestion?.trim()) {
          setGhosts((prev) => ({ ...prev, [fieldId]: result.suggestion }))
        }
        setLoadingField(undefined)
      }, 700)
    },
    [state]
  )

  const handleBlur = useCallback((fieldId: string) => {
    setTimeout(() => {
      setActiveField(undefined)
      setGhosts((prev) => {
        const next = { ...prev }
        delete next[fieldId]
        return next
      })
    }, 200)
  }, [])

  const handleAccept = useCallback(
    (fieldId: string) => {
      const suggestion = ghosts[fieldId]
      if (!suggestion) return
      const parts = fieldId.split(".")
      if (parts[0] === "customer") {
        setState((s) => ({
          ...s,
          customer: { ...s.customer, [parts[1]]: suggestion },
        }))
      } else if (["startDate", "endDate", "currency"].includes(fieldId)) {
        setState((s) => ({ ...s, [fieldId]: suggestion }))
      }
      setGhosts((prev) => {
        const next = { ...prev }
        delete next[fieldId]
        return next
      })
    },
    [ghosts]
  )

  return (
    <div className="relative h-full flex flex-col">
      {loadingField && (
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-white border border-gray-200 rounded-full px-3 py-1.5 text-xs text-gray-500 shadow-sm">
          <Loader2 size={11} className="animate-spin" />
          Suggesting…
        </div>
      )}

      {/* Explainer */}
      <div className="flex-shrink-0 bg-amber-50 border-b border-amber-100 px-6 py-2.5 flex items-center gap-2">
        <span className="text-xs text-amber-700">
          <strong>V1 · Inline ghosting</strong> — Focus any text field and AI will suggest a completion. Press{" "}
          <kbd className="bg-amber-100 border border-amber-200 rounded px-1 text-[10px]">Tab</kbd>{" "}
          to accept.
        </span>
      </div>

      <ContractEditorBase
        state={state}
        onChange={setState}
        ghostSuggestions={ghosts}
        activeGhostField={activeField}
        onFieldFocus={handleFocus}
        onFieldBlur={handleBlur}
        onAcceptGhost={handleAccept}
      />
    </div>
  )
}
