'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import type { AssistantAction } from "@/components/ProductAssistantPanel"
import { AiSparkleIcon } from "@/components/ProductCatalogIcons"
import { useAnchoredPopover, type AnchoredPopoverPosition } from "@/components/product-catalog/hooks/useAnchoredPopover"
import { useDismissOnOutsidePointerDownAndEscape } from "@/components/product-catalog/hooks/useDismissOnOutsidePointerDownAndEscape"

function ArrowRightCurrentColorIcon({ className }: { className?: string } = {}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="11"
      viewBox="0 0 12 11"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M7.28033 0.21967C6.98744 -0.0732233 6.51256 -0.0732233 6.21967 0.21967C5.92678 0.512563 5.92678 0.987437 6.21967 1.28033L9.43934 4.5H0.75C0.335786 4.5 0 4.83579 0 5.25C0 5.66421 0.335786 6 0.75 6H9.43934L6.21967 9.21967C5.92678 9.51256 5.92678 9.98744 6.21967 10.2803C6.51256 10.5732 6.98744 10.5732 7.28033 10.2803L11.7803 5.78033C11.9268 5.63388 12 5.44194 12 5.25C12 5.05806 11.9268 4.86612 11.7803 4.71967L7.28033 0.21967Z"
        fill="currentColor"
      />
    </svg>
  )
}

function normalizeActions(rawActions: unknown): AssistantAction[] {
  if (!rawActions) return []
  if (!Array.isArray(rawActions)) return []

  return rawActions
    .map((item): AssistantAction | null => {
      if (!item || typeof item !== "object") return null
      const asRecord = item as Record<string, unknown>

      // Standard format: { type: "action_type", ... }
      if (typeof asRecord.type === "string") {
        return asRecord as AssistantAction
      }

      // Single-key format: { "action_type": { ...params } }
      const keys = Object.keys(asRecord)
      if (keys.length === 1) {
        const actionType = keys[0]!
        const params = asRecord[actionType]
        if (params && typeof params === "object") {
          return { type: actionType, ...(params as Record<string, unknown>) }
        }
        const primitiveValue =
          typeof params === "string" || typeof params === "number" || typeof params === "boolean" ? params : undefined
        return primitiveValue === undefined ? ({ type: actionType } as AssistantAction) : ({ type: actionType, value: primitiveValue } as AssistantAction)
      }

      return null
    })
    .filter((action): action is AssistantAction => action !== null)
}

function buildScopedSystemPrompt(opts: {
  scopeLabel: string
  allowedActionTypes: string[]
  scopedContext: unknown
}) {
  const { scopeLabel, allowedActionTypes, scopedContext } = opts
  return `You are a helpful assistant that edits ONLY the "${scopeLabel}" form in a billing editor.

IMPORTANT: You MUST respond with valid JSON in this exact format:
{
  "message": "A short summary of what you changed",
  "actions": [...]
}

RULES:
- ONLY output actions whose "type" is one of: ${allowedActionTypes.map((t) => `"${t}"`).join(", ")}
- DO NOT output actions outside that list.
- Do not reference or change anything outside this form. Only touch the fields present in CURRENT_FORM_STATE.
- The user may ask you to "generate", "fill in", or "draft" content. That IS in scope as long as you only set fields in this form.
- If the user's request is out of scope (requires changes outside this form), respond with an empty actions array and explain why in "message".
- Prefer the smallest possible set of actions that satisfies the request.

GUIDANCE:
- When the user gives a high-level description (e.g. "I'm building X"), propose reasonable values for any empty fields in this form (name, description, lookup key, etc).
- Keep generated text concise and business-appropriate.

CURRENT_FORM_STATE:
${JSON.stringify(scopedContext, null, 2)}`
}

export type FormScopedAiControlProps = {
  t: (key: string) => string

  scopeKey: string
  scopeLabel: string
  allowedActionTypes: string[]
  scopedContext: unknown

  disabled?: boolean
  onBeginGenerate?: () => void
  onEndGenerate?: () => void
  onPreviewActions?: (actions: AssistantAction[]) => (() => void) | void
  onConfirmPreview?: () => void
  onApplyActions: (actions: AssistantAction[]) => void
}

export function FormScopedAiControl({
  t,
  scopeKey,
  scopeLabel,
  allowedActionTypes,
  scopedContext,
  disabled,
  onBeginGenerate,
  onEndGenerate,
  onPreviewActions,
  onConfirmPreview,
  onApplyActions,
}: FormScopedAiControlProps) {
  const anchorRef = useRef<HTMLButtonElement | null>(null)
  const popoverRef = useRef<HTMLDivElement | null>(null)

  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState<AnchoredPopoverPosition | null>(null)
  const [input, setInput] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [pendingActions, setPendingActions] = useState<AssistantAction[] | null>(null)
  const [previewUndo, setPreviewUndo] = useState<(() => void) | null>(null)
  const [error, setError] = useState<string | null>(null)

  const discardPreview = useCallback(() => {
    if (previewUndo) {
      try {
        previewUndo()
      } finally {
        setPreviewUndo(null)
      }
    }
    setPendingActions(null)
  }, [previewUndo])

  // Reset state if the focused form changes while the popover is open.
  useEffect(() => {
    if (pendingActions && previewUndo) {
      try {
        previewUndo()
      } catch {
        // noop
      }
    }
    setPendingActions(null)
    setPreviewUndo(null)
    setError(null)
    setInput("")
    setIsGenerating(false)
    onEndGenerate?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeKey])

  useAnchoredPopover({
    isOpen,
    setIsOpen,
    anchorRef,
    popoverRef,
    setPosition,
    getPositionFromRect: (rect) => {
      const width = 320
      const left = Math.min(Math.max(16, rect.left), window.innerWidth - width - 16)
      return { top: rect.bottom + 8, left }
    },
  })

  useDismissOnOutsidePointerDownAndEscape({
    isOpen,
    anchorRef,
    popoverRef,
    onDismiss: () => {
      // If the user dismisses while previewing changes, revert.
      if (pendingActions && previewUndo) {
        discardPreview()
      }
      setIsOpen(false)
    },
  })

  const systemPrompt = useMemo(
    () => buildScopedSystemPrompt({ scopeLabel, allowedActionTypes, scopedContext }),
    [allowedActionTypes, scopeLabel, scopedContext]
  )

  const submit = useCallback(async () => {
    const trimmed = input.trim()
    if (!trimmed) return
    if (isGenerating) return

    setError(null)
    if (pendingActions && previewUndo) {
      discardPreview()
    } else {
      setPendingActions(null)
      setPreviewUndo(null)
    }
    setIsGenerating(true)
    onBeginGenerate?.()

    try {
      // Use gpt-5-mini for scoped form edits - excellent instruction following
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gpt-5-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: trimmed },
          ],
        }),
      })

      const raw = await res.text().catch(() => "")
      const data = (() => {
        if (!raw) return null
        try {
          return JSON.parse(raw) as Record<string, unknown>
        } catch {
          return null
        }
      })()
      if (!res.ok) {
        const errFromJson = typeof data?.error === "string" ? data.error : null
        const errFromText = raw.trim() ? raw.trim().slice(0, 500) : null
        const err = errFromJson ?? errFromText ?? `Request failed (${res.status})`
        setError(err.startsWith("Request failed") ? err : `Request failed (${res.status}): ${err}`)
        // eslint-disable-next-line no-console
        console.error("[scoped-ai] request failed", { status: res.status, scopeLabel, scopeKey, error: errFromJson ?? errFromText })
        return
      }

      const rawContent = typeof data?.content === "string" ? data.content : raw
      let parsed: { message?: string; actions?: unknown } | null = null
      try {
        let jsonStr = rawContent.trim()
        if (jsonStr.startsWith("```json")) jsonStr = jsonStr.slice(7)
        else if (jsonStr.startsWith("```")) jsonStr = jsonStr.slice(3)
        if (jsonStr.endsWith("```")) jsonStr = jsonStr.slice(0, -3)
        parsed = JSON.parse(jsonStr.trim())
      } catch {
        parsed = null
      }

      const actions = normalizeActions(parsed?.actions)
        .filter((a) => typeof a.type === "string" && allowedActionTypes.includes(a.type))

      if (actions.length === 0) {
        setError(parsed?.message ? String(parsed.message) : t("No changes suggested for this form."))
        if (pendingActions && previewUndo) {
          discardPreview()
        } else {
          setPendingActions(null)
          setPreviewUndo(null)
        }
        return
      }

      // Apply a preview immediately so the user can review changes in the form fields.
      // This is reverted if they discard or dismiss the popover.
      const undo = onPreviewActions?.(actions)
      setPreviewUndo(() => (typeof undo === "function" ? undo : null))
      setPendingActions(actions)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error"
      setError(msg)
      // eslint-disable-next-line no-console
      console.error("[scoped-ai] unexpected error", { scopeLabel, scopeKey, error: msg })
    } finally {
      onEndGenerate?.()
      setIsGenerating(false)
    }
  }, [
    allowedActionTypes,
    discardPreview,
    input,
    isGenerating,
    onBeginGenerate,
    onEndGenerate,
    onPreviewActions,
    pendingActions,
    previewUndo,
    scopeKey,
    scopeLabel,
    systemPrompt,
    t,
  ])

  const showConfirm = pendingActions != null && pendingActions.length > 0
  const hasInput = input.trim() !== ""

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        className={`flex h-[20px] w-[20px] items-center justify-center rounded-[6px] text-[#474E5A] transition-colors ${
          isOpen ? "bg-[#F5F6F8]" : "bg-transparent hover:bg-[#F5F6F8]"
        }`}
        aria-label={t("Ask AI for changes")}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={disabled}
      >
        <AiSparkleIcon className="h-[12px] w-[12px]" />
      </button>

      {isOpen && position && (
        <div
          ref={popoverRef}
          className="fixed z-50 w-[320px] rounded-[8px] bg-[#F5F6F8] shadow-[0px_15px_35px_0px_rgba(48,49,61,0.08),0px_5px_15px_0px_rgba(0,0,0,0.12)]"
          style={{ top: position.top, left: position.left }}
        >
          <div className="flex items-center justify-between gap-[10px] rounded-[6px] bg-white px-[12px] py-[8px]">
            {showConfirm ? (
              <>
                <div className="text-[14px] font-[500] leading-[20px] tracking-[-0.15px] text-[#353A44]">
                  {pendingActions!.length} {t("changes")}
                </div>
                <div className="flex items-center gap-[10px]">
                  <button
                    type="button"
                    className="relative isolate flex h-[28px] min-h-[28px] items-center justify-center rounded-[6px] border border-[#D8DEE4] bg-white px-[8px] py-[4px] text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#353A44]"
                    onClick={discardPreview}
                    disabled={isGenerating}
                  >
                    <span className="relative z-[3]">{t("Discard")}</span>
                    <span className="absolute inset-0 z-[1] rounded-[6px] bg-white shadow-[0px_1px_1px_0px_rgba(33,37,44,0.16)]" />
                  </button>
                  <button
                    type="button"
                    className="relative isolate flex h-[28px] min-h-[28px] items-center justify-center rounded-[6px] border border-[#675DFF] bg-[#675DFF] px-[8px] py-[4px] text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-white hover:bg-[#5B52F0] transition-colors"
                    onClick={() => {
                      // If preview applied, "Keep" just commits (do not re-apply).
                      if (!previewUndo) {
                        onApplyActions(pendingActions!)
                      } else {
                        onConfirmPreview?.()
                        setPreviewUndo(null)
                      }
                      setPendingActions(null)
                      setIsOpen(false)
                    }}
                    disabled={isGenerating}
                  >
                    <span className="relative z-[3]">{t("Keep")}</span>
                    <span className="absolute inset-0 z-[1] rounded-[6px] bg-[#675DFF] shadow-[0px_1px_1px_0px_rgba(47,14,99,0.32)]" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <input
                  className="min-w-[190px] flex-1 bg-transparent text-[14px] font-[500] leading-[20px] tracking-[-0.15px] text-[#353A44] placeholder:text-[#818DA0] outline-none"
                  placeholder={t("Ask for changes to") + " " + scopeLabel}
                  value={input}
                  disabled={isGenerating}
                  autoFocus
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      void submit()
                    }
                  }}
                />
                <button
                  type="button"
                  className={`flex h-[24px] w-[24px] items-center justify-center rounded-[6px] bg-[#F5F6F8] transition-colors disabled:opacity-100 disabled:cursor-default ${
                    hasInput ? "text-[#474E5A] hover:bg-[#EBEEF1]" : "text-[#6C7688]"
                  }`}
                  onClick={() => void submit()}
                  disabled={isGenerating || !hasInput}
                  aria-label={t("Generate")}
                >
                  <ArrowRightCurrentColorIcon />
                </button>
              </>
            )}
          </div>

          {error ? (
            <div className="px-[12px] pb-[10px] text-[12px] font-[500] leading-[16px] text-[#596171] max-w-[360px]">
              {error}
            </div>
          ) : null}
        </div>
      )}
    </>
  )
}


