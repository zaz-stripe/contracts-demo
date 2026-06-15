'use client'

import React, { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react"
import { useTranslation } from "react-i18next"

import type {
  AssistantAction,
  AssistantApplyResult,
  AssistantPreviewResult,
  AssistantContext,
  AssistantReference,
  ChatMessage,
} from "@/components/ProductAssistantPanel"

import {
  nextMessageId,
  selectModel,
  countTotalChanges,
  summarizeActions,
  normalizeActions,
  orderActions,
  compressConversationHistory,
  parseJsonContent,
} from "@/components/ProductAssistantPanel"

import { buildSystemPrompt } from "@/components/ProductAssistantPanel"

// ─── Terminal font — SF Pro Display for a clean, non-monospace look ──────────
const TERMINAL_FONT =
  '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

// ─── Stripe ASCII art (forward-slash style matching Stripe Shell) ────────────
const STRIPE_ASCII = [
  "                                  /////",
  "                ////",
  "    /////////  ////////  //////// /////  ////////////      ////////",
  "  ///////////  ////////  //////// /////  /////////////   ////// /////",
  "  //////       ////      ////     /////  ////     ///// /////     ////",
  "    /////////  ////      ////     /////  ////      //// //////////////",
  "         ///// ////      ////     /////  ////     /////  ////",
  "  ///////////  ////////  ////     /////  /////////////    ///////////",
  "   ////////      //////  ////     /////  //// //////        ///////",
  "                                         ////",
  "                                         ////",
].join("\n")

type TerminalAssistantPanelProps = {
  isOpen: boolean
  isOpenRef: MutableRefObject<boolean>
  onPanelReady: () => void
  onClose: () => void
  context: AssistantContext
  onApplyActions: (actions: AssistantAction[]) => AssistantApplyResult
  onPreviewActions?: (actions: AssistantAction[]) => AssistantPreviewResult
  onConfirmPreview?: () => void
  initialUserMessage: string | null
  onConsumeInitialUserMessage: () => void
  draftReference?: AssistantReference | null
  onConsumeDraftReference?: () => void
  applyDelayMs?: number
  onBeginApply: (actions: AssistantAction[]) => void
  onEndApply: () => void
}

export function TerminalAssistantPanel({
  isOpen,
  isOpenRef,
  onPanelReady,
  onClose,
  context,
  onApplyActions,
  onPreviewActions,
  onConfirmPreview,
  initialUserMessage,
  onConsumeInitialUserMessage,
  draftReference,
  onConsumeDraftReference,
  applyDelayMs = 2000,
  onBeginApply,
  onEndApply,
}: TerminalAssistantPanelProps) {
  const { t } = useTranslation()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [preview, setPreview] = useState<{ messageId: number; undo: () => void; applied: number; errors: string[] } | null>(null)
  const previewRef = useRef<{ messageId: number; undo: () => void; applied: number; errors: string[] } | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const lastConsumedRef = useRef<string | null>(null)

  const hasMessages = messages.length > 0

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages, isSending])

  useEffect(() => { inputRef.current?.focus() }, [])
  useEffect(() => { previewRef.current = preview }, [preview])
  useEffect(() => {
    return () => { if (previewRef.current) { try { previewRef.current.undo() } catch { /* noop */ } } }
  }, [])

  const discardPreview = useCallback(() => {
    if (!preview) return
    try { preview.undo() } finally { setPreview(null) }
  }, [preview])

  // ─── Apply / preview ────────────────────────────────────────────────────────
  const handleApplyActions = async (messageId: number, actions: AssistantAction[]) => {
    if (!onApplyActions && !onPreviewActions) return
    if (isApplying) return
    setIsApplying(true)
    onBeginApply?.(actions)
    try {
      if (preview) discardPreview()
      const delay = typeof applyDelayMs === "number" && applyDelayMs > 0 ? applyDelayMs : 0
      if (delay) await new Promise((r) => setTimeout(r, delay))

      if (onPreviewActions) {
        const result = onPreviewActions(actions)
        setPreview({ messageId, undo: result.undo, applied: result.applied, errors: result.errors })
        setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, actions } : m)))
        return
      }
      if (!onApplyActions) return
      const result = onApplyActions(actions)
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, actionsApplied: true } : m)))
      const summary = summarizeActions(actions)
      const suffix = summary ? ` — ${summary}` : ""
      const errSuffix = result.errors.length > 0 ? ` Errors: ${result.errors.join(", ")}` : ""
      setMessages((prev) => [...prev, { id: nextMessageId(), role: "assistant", content: `Applied ${result.applied} change${result.applied === 1 ? "" : "s"}${suffix}.${errSuffix}` }])
    } finally {
      onEndApply?.()
      setIsApplying(false)
    }
  }

  // ─── Send message ──────────────────────────────────────────────────────────
  const sendMessageWithText = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    if (isSending) return

    if (preview) {
      const { applied, errors, undo } = preview
      const msg = messages.find((m) => m.id === preview.messageId)
      const summary = msg?.actions ? summarizeActions(msg.actions) : null
      onConfirmPreview?.()
      setPreview(null)
      setMessages((prev) => prev.map((m) => m.id === preview.messageId ? { ...m, actionsApplied: true } : m))
      const id = nextMessageId()
      const s = summary ? ` — ${summary}` : ""
      const e = errors.length > 0 ? ` Errors: ${errors.join(", ")}` : ""
      setMessages((prev) => [...prev, {
        id, role: "assistant",
        content: `Applied ${applied} change${applied === 1 ? "" : "s"}${s}.${e}`,
        revertUndo: undo ? () => { try { undo(); setMessages((c) => c.map((m) => m.id === id ? { ...m, reverted: true } : m)); setMessages((c) => [...c, { id: nextMessageId(), role: "assistant", content: "Reverted." }]) } catch {} } : undefined,
      }])
    }

    const allRefs: AssistantReference[] = draftReference ? [draftReference] : []
    const refPrefix = allRefs.length > 0
      ? allRefs.map((r) => `${r.kind}: ${r.label}${r.id ? ` (id: ${r.id})` : ""}${r.content ? `\n  → ${r.content}` : ""}`).join("\n") + "\n\n"
      : ""
    const fullText = refPrefix + trimmed

    setMessages((prev) => [...prev, { id: nextMessageId(), role: "user", content: fullText }])
    setInput("")
    setIsSending(true)
    if (draftReference) onConsumeDraftReference?.()

    try {
      const systemPrompt = buildSystemPrompt(context, fullText)
      const model = selectModel()
      const history = messages.map((m) => ({ role: m.role, content: m.content }))
      const compressed = compressConversationHistory(history)
      const payload = [
        { role: "system" as const, content: systemPrompt },
        ...compressed,
        { role: "user" as const, content: fullText },
      ]

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: payload, model }),
      })
      const data = (await res.json().catch(() => null)) as Record<string, unknown> | null

      if (!res.ok) {
        const err = typeof data?.error === "string" ? data.error : `Request failed (${res.status})`
        setMessages((prev) => [...prev, { id: nextMessageId(), role: "assistant", content: `Error: ${err}` }])
        return
      }

      const rawContent = typeof data?.content === "string" ? data.content : ""
      const parsed = parseJsonContent(rawContent)
      const message = parsed?.message ?? rawContent
      const actions = orderActions(normalizeActions(parsed?.actions))

      const finalId = nextMessageId()
      setMessages((prev) => [
        ...prev,
        {
          id: finalId, role: "assistant",
          content: message || "(empty response)",
          actions: actions.length > 0 && !onPreviewActions ? actions : undefined,
        },
      ])

      if (actions.length > 0 && onPreviewActions) {
        await handleApplyActions(finalId, actions)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error"
      setMessages((prev) => [...prev, { id: nextMessageId(), role: "assistant", content: `Error: ${msg}` }])
    } finally {
      setIsSending(false)
    }
  }

  useEffect(() => {
    const prompt = (initialUserMessage ?? "").trim()
    if (!prompt) return
    if (lastConsumedRef.current === prompt) return
    if (isSending) return
    lastConsumedRef.current = prompt
    onConsumeInitialUserMessage?.()
    void sendMessageWithText(prompt)
  }, [initialUserMessage, isSending, onConsumeInitialUserMessage])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void sendMessageWithText(input)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="flex flex-col border-t border-[#D8DEE4] bg-[#F5F6F8]"
      style={{ fontFamily: TERMINAL_FONT, height: 240 }}
    >
      {/* Scrollable area */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-[16px] pt-[12px] pb-[4px]">
        {/* ─── Empty state ─── */}
        {!hasMessages && !isSending && (
          <div className="flex flex-col gap-[10px] select-none">
            <pre className="text-[6px] leading-[7px] text-[#596171]" style={{ fontFamily: '"SF Mono", "Menlo", monospace' }} aria-hidden="true">{STRIPE_ASCII}</pre>
            <div className="text-[13px] font-[400] leading-[20px] tracking-[-0.15px] text-[#596171]">
              {t("Describe changes to your pricing plan — add rate cards, set prices, configure tiers, create credit grants, and more.")}
            </div>
          </div>
        )}

        {/* ─── Messages ─── */}
        {messages.map((m, idx) => (
          <div key={m.id} className={m.role === "user" && idx > 0 ? "mt-[12px]" : "mt-[2px]"}>
            {m.role === "user" ? (
              <div className="flex items-start gap-[8px]">
                <span className="shrink-0 flex w-[8px] items-center justify-center select-none text-[13px] font-[400] leading-[20px] tracking-[-0.15px] text-[#6C7688]" aria-hidden>&#x203A;</span>
                <span className="text-[13px] font-[400] leading-[20px] tracking-[-0.15px] text-[#353A44] whitespace-pre-wrap">{m.content}</span>
              </div>
            ) : (
              <div className="flex items-start gap-[8px]">
                <span className="shrink-0 flex w-[8px] items-center justify-center pt-[6px]">
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="4" cy="4" r="3.5" fill="#596171" />
                  </svg>
                </span>
                <div className="text-[13px] font-[400] leading-[20px] tracking-[-0.15px] text-[#596171] whitespace-pre-wrap">
                  {m.content}
                  {/* Inline action confirmation */}
                  {m.actions && m.actions.length > 0 && !m.actionsApplied && (
                    <span className="ml-1">
                      {(() => {
                        const n = countTotalChanges(m.actions!)
                        return `[${n} change${n === 1 ? "" : "s"}] `
                      })()}
                      {preview?.messageId === m.id && onPreviewActions ? (
                        <>
                          <button type="button" className="text-[#DF1B41] underline decoration-[#DF1B41]/40 hover:decoration-[#DF1B41]" disabled={isApplying} onClick={() => discardPreview()}>discard</button>
                          <span className="mx-1 text-[#A3ACB9]">/</span>
                          <button type="button" className="text-[#0E6245] underline decoration-[#0E6245]/40 hover:decoration-[#0E6245]" disabled={isApplying} onClick={() => {
                            onConfirmPreview?.()
                            const applied = preview?.applied ?? m.actions?.length ?? 0
                            const errors = preview?.errors ?? []
                            const undo = preview?.undo
                            const summary = m.actions ? summarizeActions(m.actions) : null
                            setPreview(null)
                            setMessages((prev) => prev.map((msg) => msg.id === m.id ? { ...msg, actionsApplied: true } : msg))
                            const id = nextMessageId()
                            const s = summary ? ` — ${summary}` : ""
                            const e = errors.length > 0 ? ` Errors: ${errors.join(", ")}` : ""
                            setMessages((prev) => [...prev, {
                              id, role: "assistant",
                              content: `Applied ${applied} change${applied === 1 ? "" : "s"}${s}.${e}`,
                              revertUndo: undo ? () => { try { undo(); setMessages((c) => c.map((msg) => msg.id === id ? { ...msg, reverted: true } : msg)); setMessages((c) => [...c, { id: nextMessageId(), role: "assistant", content: "Reverted." }]) } catch {} } : undefined,
                            }])
                          }}>keep</button>
                        </>
                      ) : (
                        <button type="button" className="text-[#635BFF] underline decoration-[#635BFF]/40 hover:decoration-[#635BFF]" disabled={isApplying} onClick={() => void handleApplyActions(m.id, m.actions!)}>apply</button>
                      )}
                    </span>
                  )}
                  {m.revertUndo && !m.reverted && (
                    <span className="ml-1">
                      <button type="button" className="text-[#596171] underline decoration-[#596171]/40 hover:decoration-[#596171] hover:text-[#353A44]" onClick={() => m.revertUndo?.()}>undo</button>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Thinking / applying indicator — sparkle icon + purple text */}
        {(isSending || isApplying) && (
          <div className="flex items-start gap-[8px] mt-[2px]">
            <span className="shrink-0 flex w-[8px] items-center justify-center pt-[6px]">
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-[sparkle-pulse_1.5s_ease-in-out_infinite]">
                <path d="M4 0L4.8 3.2L8 4L4.8 4.8L4 8L3.2 4.8L0 4L3.2 3.2L4 0Z" fill="#635BFF" />
              </svg>
            </span>
            <span className="text-[13px] font-[400] leading-[20px] tracking-[-0.15px] text-[#635BFF] animate-[sparkle-pulse_1.5s_ease-in-out_infinite]">
              {isApplying ? "Applying…" : "Thinking…"}
            </span>
            <style jsx>{`
              @keyframes sparkle-pulse {
                0%, 100% { opacity: 0.5; }
                50% { opacity: 1; }
              }
            `}</style>
          </div>
        )}
      </div>

      {/* Input prompt line */}
      <div className="flex items-center border-t border-[#EBEEF1] px-[16px] py-[8px]">
        {/* Wide block cursor — only visible when input is empty, not sending, and input is focused */}
        {!input && !isSending && (
          <div className={`shrink-0 mr-[6px] w-[6px] h-[16px] rounded-[1px] bg-[#D8DEE4] ${isInputFocused ? "animate-[cursor-blink_1s_step-end_infinite]" : "opacity-50"}`} aria-hidden />
        )}
        <input
          ref={inputRef}
          type="text"
          className="min-w-0 flex-1 bg-transparent text-[13px] font-[400] leading-[20px] tracking-[-0.15px] text-[#353A44] placeholder:text-[#6C7688] outline-none caret-[#353A44]"
          style={{ fontFamily: TERMINAL_FONT, caretColor: input ? undefined : "transparent" }}
          placeholder={t("Ask anything")}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
          disabled={isSending}
          autoComplete="off"
          spellCheck={false}
        />
        <style jsx>{`
          @keyframes cursor-blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
          }
        `}</style>
      </div>
    </div>
  )
}
