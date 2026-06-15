'use client'

import React, { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { CloseIcon } from "@/components/ProductCatalogIcons"
import { CatalogObjectGlyph } from "@/components/product-catalog/iconography"

// Import from extracted modules
import type {
  AssistantAction,
  AssistantReference,
  AssistantReferenceKind,
  ChatMessage,
  MentionableObject,
  ProductAssistantPanelProps,
} from "./assistantTypes"

import {
  nextMessageId,
  selectModel,
  getMentionableObjects,
  countTotalChanges,
  summarizeActions,
  normalizeActions,
  orderActions,
  compressConversationHistory,
  parseJsonContent,
} from "./assistantUtils"

import { buildSystemPrompt } from "./assistantPrompts"

import { AccountLogo, RevertIcon, ContentTooltip } from "./assistantComponents"

/**
 * Prototype guard: the assistant is currently only intended to work for Pricing Plans.
 * Flip this env var to re-enable product-mode calls without reworking the UI:
 * `NEXT_PUBLIC_ENABLE_PRODUCT_ASSISTANT_FOR_PRODUCTS=true`
 */
const ENABLE_PRODUCT_ASSISTANT_FOR_PRODUCTS =
  process.env.NEXT_PUBLIC_ENABLE_PRODUCT_ASSISTANT_FOR_PRODUCTS === "true"

export function ProductAssistantPanel({
  onClose,
  context,
  onApplyActions,
  onPreviewActions,
  onConfirmPreview,
  initialUserMessage,
  onConsumeInitialUserMessage,
  draftReference,
  onConsumeDraftReference,
  applyDelayMs,
  onBeginApply,
  onEndApply,
}: ProductAssistantPanelProps) {
  const { t } = useTranslation()
  const mode = context?.mode ?? "product"
  const isProductMode = mode === "product"
  const isAssistantEnabled = !isProductMode || ENABLE_PRODUCT_ASSISTANT_FOR_PRODUCTS

  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const toastTimeoutRef = useRef<number | null>(null)

  const showToast = useCallback((message: string) => {
    setToastMessage(message)
    if (toastTimeoutRef.current != null) {
      window.clearTimeout(toastTimeoutRef.current)
    }
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null)
      toastTimeoutRef.current = null
    }, 2600)
  }, [])

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 0,
      role: "assistant",
      content: t("Tell me what to change in your product or pricing plan, and I can apply it for you."),
    },
  ])
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [preview, setPreview] = useState<{ messageId: number; undo: () => void; applied: number; errors: string[] } | null>(null)
  const previewRef = useRef<{ messageId: number; undo: () => void; applied: number; errors: string[] } | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const lastConsumedInitialUserMessageRef = useRef<string | null>(null)
  const lastDraftReferenceRef = useRef<AssistantReference | null>(null)

  // @ mention state
  const [mentions, setMentions] = useState<AssistantReference[]>([])
  const [showMentionDropdown, setShowMentionDropdown] = useState(false)
  const [mentionFilter, setMentionFilter] = useState("")
  const [mentionDropdownIndex, setMentionDropdownIndex] = useState(0)
  const [highlightedMentionIndex, setHighlightedMentionIndex] = useState<number | null>(null)
  const [highlightedDraftReference, setHighlightedDraftReference] = useState(false)
  const mentionDropdownRef = useRef<HTMLDivElement | null>(null)

  // Multi-tab chat session management
  const [sessionIds, setSessionIds] = useState<number[]>([1])
  const [activeSessionId, setActiveSessionId] = useState(1)
  const [sessionLabels, setSessionLabels] = useState<Record<number, string>>({ 1: "Chat 1" })
  const nextSessionIdRef = useRef(2)
  const sessionsStore = useRef<Record<number, { messages: ChatMessage[]; input: string; mentions: AssistantReference[] }>>({})

  // Refs for session save/restore (avoid stale closures in callbacks)
  const messagesRef = useRef<ChatMessage[]>(messages)
  messagesRef.current = messages
  const inputRef = useRef(input)
  inputRef.current = input
  const mentionsRef = useRef<AssistantReference[]>(mentions)
  mentionsRef.current = mentions

  const referenceKindLabel = (kind: AssistantReferenceKind) => {
    switch (kind) {
      case "plan":
        return "Pricing plan"
      case "rateCard":
        return "Price group"
      case "rate":
        return "Price"
      case "rateMeter":
        return "Meter"
      case "creditGrant":
        return "Credit grant"
      case "subscriptionFee":
        return "Subscription fee"
      case "product":
        return "Product"
      case "price":
        return "Price"
      case "meter":
        return "Meter"
      case "accountName":
        return "Account name"
      case "accountAddress":
        return "Address"
      case "accountWebsite":
        return "Website"
      case "accountDescription":
        return "Business description"
    }
  }

  const renderReferenceIcon = (kind: AssistantReferenceKind, size: number = 12) => {
    // Account items use the Stripe logo with black background
    if (kind === "accountName" || kind === "accountAddress" || kind === "accountWebsite" || kind === "accountDescription") {
      return <AccountLogo size={size} />
    }
    return <CatalogObjectGlyph kind={kind} />
  }

  // Parse and render message content with styled object references
  const renderMessageContent = (content: string) => {
    // Pattern to match object references like "Rate: Claude 3.5 Sonnet" or "Pricing plan: AI Model Pricing"
    const referencePattern = /^(Pricing plan|Rate card|Rate|Credit grant|Subscription fee|Subscription fee|Product|Price|Meter):\s*(.+?)(?:\s*\(id:\s*\d+\))?$/gm

    const parts: React.ReactNode[] = []
    let lastIndex = 0
    let match: RegExpExecArray | null
    let keyIndex = 0

    // Reset regex state
    referencePattern.lastIndex = 0

    while ((match = referencePattern.exec(content)) !== null) {
      // Add text before this match
      if (match.index > lastIndex) {
        parts.push(content.slice(lastIndex, match.index))
      }

      const kindLabel = match[1]
      const label = match[2]

      // Map label to kind
      const kindMap: Record<string, AssistantReferenceKind> = {
        "Pricing plan": "plan",
        "Price group": "rateCard",
        "Rate card": "rateCard",
        "Price": "rate",
        "Rate": "rate",
        "Credit grant": "creditGrant",
        "Subscription fee": "subscriptionFee",
        "Product": "product",
        "Meter": "meter",
      }
      const kind = kindMap[kindLabel] ?? "rate"

      // Render as pill with line break after
      parts.push(
        <span key={`ref-wrapper-${keyIndex}`} className="block mb-1">
          <span
            key={`ref-${keyIndex++}`}
            className="inline-flex items-center gap-[4px] rounded-[4px] bg-[#EBEEF1] px-[6px] py-[2px] text-[12px] font-[500] text-[#353A44]"
          >
            <span className="flex size-[12px] shrink-0 items-center justify-center">
              {renderReferenceIcon(kind)}
            </span>
            <span>{label}</span>
          </span>
        </span>
      )

      // Skip the newline after the reference line
      lastIndex = match.index + match[0].length
      if (content[lastIndex] === "\n") {
        lastIndex++
      }
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex))
    }

    // If no references found, return original content
    if (parts.length === 0) {
      return content
    }

    return parts
  }

  // Get mentionable objects filtered by current filter text
  const mentionableObjects = getMentionableObjects(context).filter((o) => o.category === "existing")
  const filterLower = mentionFilter.toLowerCase()
  const filteredMentions = mentionableObjects.filter((obj) => {
    return obj.label.toLowerCase().includes(filterLower)
  })

  // Add a mention from dropdown selection
  const handleSelectMention = useCallback((obj: MentionableObject) => {
    const newMention: AssistantReference = { kind: obj.kind, label: obj.label, id: obj.id, content: obj.content }
    setMentions((prev) => [...prev, newMention])
    setShowMentionDropdown(false)
    setMentionFilter("")
    setMentionDropdownIndex(0)
    // Remove the @... text from input
    setInput((prev) => {
      const atIndex = prev.lastIndexOf("@")
      if (atIndex >= 0) {
        return prev.slice(0, atIndex)
      }
      return prev
    })
    textareaRef.current?.focus()
  }, [])

  // Remove a mention by index
  const handleRemoveMention = useCallback((index: number) => {
    setMentions((prev) => prev.filter((_, i) => i !== index))
    setHighlightedMentionIndex(null)
    setHighlightedDraftReference(false)
  }, [])

  const handleRemoveDraftReference = useCallback(() => {
    onConsumeDraftReference?.()
    setHighlightedDraftReference(false)
    setHighlightedMentionIndex(null)
  }, [onConsumeDraftReference])

  // Handle input changes to detect @ mentions
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setInput(value)

    // Check if user typed @ to trigger dropdown
    const lastChar = value.slice(-1)
    const charBeforeLast = value.slice(-2, -1)

    if (lastChar === "@" && (charBeforeLast === "" || charBeforeLast === " " || charBeforeLast === "\n")) {
      setShowMentionDropdown(true)
      setMentionFilter("")
      setMentionDropdownIndex(0)
      return
    }

    // If dropdown is open, update filter
    if (showMentionDropdown) {
      const atIndex = value.lastIndexOf("@")
      if (atIndex >= 0) {
        const filterText = value.slice(atIndex + 1)
        // Close dropdown if user typed space or newline
        if (filterText.includes(" ") || filterText.includes("\n")) {
          setShowMentionDropdown(false)
          setMentionFilter("")
        } else {
          setMentionFilter(filterText)
          setMentionDropdownIndex(0)
        }
      } else {
        setShowMentionDropdown(false)
        setMentionFilter("")
      }
    }
  }, [showMentionDropdown])

  // Handle keyboard events for mentions
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle mention dropdown navigation
    if (showMentionDropdown) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setMentionDropdownIndex((prev) => Math.min(prev + 1, filteredMentions.length - 1))
        return
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setMentionDropdownIndex((prev) => Math.max(prev - 1, 0))
        return
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault()
        if (filteredMentions[mentionDropdownIndex]) {
          handleSelectMention(filteredMentions[mentionDropdownIndex])
        }
        return
      }
      if (e.key === "Escape") {
        e.preventDefault()
        setShowMentionDropdown(false)
        setMentionFilter("")
        return
      }
    }

    const isPillDeletionKey = e.key === "Backspace" || (e.key === "Delete" && input.length === 0)
    // Handle keyboard deletion for pill(s) when the caret is at the start of an empty composer.
    // - Backspace: works even if there is text (backspace at pos=0 is a no-op anyway)
    // - Delete: only intercept when input is empty so we don't prevent deleting actual text
    if (isPillDeletionKey && (mentions.length > 0 || !!draftReference)) {
      const textarea = textareaRef.current
      if (!textarea) return

      // If cursor is at position 0 and there's no input text
      if (textarea.selectionStart === 0 && textarea.selectionEnd === 0) {
        if (highlightedMentionIndex !== null) {
          // Second backspace: delete the highlighted mention
          e.preventDefault()
          handleRemoveMention(highlightedMentionIndex)
        } else if (highlightedDraftReference && draftReference) {
          // Second backspace: delete the highlighted draft reference
          e.preventDefault()
          handleRemoveDraftReference()
        } else {
          // First backspace: highlight the last pill (mentions take precedence; otherwise draft reference)
          e.preventDefault()
          if (mentions.length > 0) {
            setHighlightedMentionIndex(mentions.length - 1)
            setHighlightedDraftReference(false)
          } else if (draftReference) {
            setHighlightedDraftReference(true)
            setHighlightedMentionIndex(null)
          }
        }
        return
      }
    }

    // Clear highlight if user types anything else
    if ((highlightedMentionIndex !== null || highlightedDraftReference) && !isPillDeletionKey) {
      setHighlightedMentionIndex(null)
      setHighlightedDraftReference(false)
    }

    // Send on Enter (without shift)
    if (e.key === "Enter" && !e.shiftKey && !showMentionDropdown) {
      e.preventDefault()
      void sendMessage()
    }
  }, [
    showMentionDropdown,
    filteredMentions,
    mentionDropdownIndex,
    handleSelectMention,
    mentions,
    highlightedMentionIndex,
    highlightedDraftReference,
    handleRemoveMention,
    draftReference,
    handleRemoveDraftReference,
    input,
  ])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (mentionDropdownRef.current && !mentionDropdownRef.current.contains(e.target as Node)) {
        setShowMentionDropdown(false)
        setMentionFilter("")
      }
    }
    if (showMentionDropdown) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showMentionDropdown])

  // Auto-scroll dropdown to keep selected item visible
  useEffect(() => {
    if (!showMentionDropdown || !mentionDropdownRef.current) return
    const dropdown = mentionDropdownRef.current
    const selectedItem = dropdown.querySelector(`[data-mention-index="${mentionDropdownIndex}"]`) as HTMLElement | null
    if (selectedItem) {
      selectedItem.scrollIntoView({ block: "nearest", behavior: "smooth" })
    }
  }, [mentionDropdownIndex, showMentionDropdown])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const el = listRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages])

  const discardPreview = useCallback(() => {
    if (!preview) return
    try {
      preview.undo()
    } finally {
      setPreview(null)
    }
  }, [preview])

  // Keep a ref so we can safely revert on unmount only (not whenever preview state changes).
  useEffect(() => {
    previewRef.current = preview
  }, [preview])

  // If the panel is closed/unmounted while previewing changes, revert them.
  useEffect(() => {
    return () => {
      if (previewRef.current) {
        try {
          previewRef.current.undo()
        } catch {
          // noop
        }
      }
    }
  }, [])

  // --- Multi-tab session management callbacks ---

  const switchToSession = useCallback((targetId: number) => {
    if (targetId === activeSessionId) return
    if (isSending || isApplying) return

    // Discard any active preview
    if (previewRef.current) {
      try { previewRef.current.undo() } catch { /* noop */ }
      setPreview(null)
    }

    // Save current session state
    sessionsStore.current[activeSessionId] = {
      messages: [...messagesRef.current],
      input: inputRef.current,
      mentions: [...mentionsRef.current],
    }

    // Restore target session state
    const target = sessionsStore.current[targetId]
    if (target) {
      setMessages(target.messages)
      setInput(target.input)
      setMentions(target.mentions)
    } else {
      setMessages([{
        id: 0,
        role: "assistant",
        content: t("Tell me what to change in your product or pricing plan, and I can apply it for you."),
      }])
      setInput("")
      setMentions([])
    }

    // Reset transient UI state
    setShowMentionDropdown(false)
    setMentionFilter("")
    setMentionDropdownIndex(0)
    setHighlightedMentionIndex(null)
    setHighlightedDraftReference(false)
    setActiveSessionId(targetId)
    setTimeout(() => textareaRef.current?.focus(), 0)
  }, [activeSessionId, isSending, isApplying, t])

  const addNewSession = useCallback(() => {
    if (isSending || isApplying) return

    const newId = nextSessionIdRef.current++
    const newLabel = `Chat ${newId}`

    // Discard any active preview
    if (previewRef.current) {
      try { previewRef.current.undo() } catch { /* noop */ }
      setPreview(null)
    }

    // Save current session
    sessionsStore.current[activeSessionId] = {
      messages: [...messagesRef.current],
      input: inputRef.current,
      mentions: [...mentionsRef.current],
    }

    // Add new session
    setSessionIds((prev) => [...prev, newId])
    setSessionLabels((prev) => ({ ...prev, [newId]: newLabel }))

    // Initialize new session state
    setMessages([{
      id: 0,
      role: "assistant",
      content: t("Tell me what to change in your product or pricing plan, and I can apply it for you."),
    }])
    setInput("")
    setMentions([])
    setShowMentionDropdown(false)
    setMentionFilter("")
    setMentionDropdownIndex(0)
    setHighlightedMentionIndex(null)
    setHighlightedDraftReference(false)

    setActiveSessionId(newId)
    setTimeout(() => textareaRef.current?.focus(), 0)
  }, [activeSessionId, isSending, isApplying, t])

  const closeSession = useCallback((targetId: number) => {
    if (sessionIds.length <= 1) return
    // Block closing the active session while sending/applying
    if (targetId === activeSessionId && (isSending || isApplying)) return

    if (targetId === activeSessionId) {
      // Discard any active preview
      if (previewRef.current) {
        try { previewRef.current.undo() } catch { /* noop */ }
        setPreview(null)
      }

      // Switch to adjacent session
      const idx = sessionIds.indexOf(targetId)
      const nextIdx = idx === 0 ? 1 : idx - 1
      const nextId = sessionIds[nextIdx]

      const target = sessionsStore.current[nextId]
      if (target) {
        setMessages(target.messages)
        setInput(target.input)
        setMentions(target.mentions)
      }

      setShowMentionDropdown(false)
      setMentionFilter("")
      setHighlightedMentionIndex(null)
      setHighlightedDraftReference(false)
      setActiveSessionId(nextId)
    }

    setSessionIds((prev) => prev.filter((id) => id !== targetId))
    setSessionLabels((prev) => {
      const next = { ...prev }
      delete next[targetId]
      return next
    })
    delete sessionsStore.current[targetId]
  }, [sessionIds, activeSessionId, isSending, isApplying])

  useEffect(() => {
    // When a reference is set (via object-map or form sparkle), focus the composer.
    // Important: don't refocus the composer when only the reference *label* is changing
    // (e.g. while the user types in a form field and we keep the label in sync).
    const prev = lastDraftReferenceRef.current
    lastDraftReferenceRef.current = draftReference ?? null

    if (!draftReference) return
    const shouldFocus = !prev || prev.kind !== draftReference.kind
    if (!shouldFocus) return

    const t = window.setTimeout(() => textareaRef.current?.focus(), 0)
    return () => window.clearTimeout(t)
  }, [draftReference])

  // If the draft reference changes, clear any previous highlight state.
  useEffect(() => {
    setHighlightedDraftReference(false)
  }, [draftReference])

  // Resize textarea based on content (3-8 lines)
  const resizeInput = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const lineHeight = 18
    const minLines = 3
    const maxLines = 8
    const minHeight = lineHeight * minLines
    const maxHeight = lineHeight * maxLines

    textarea.style.height = `${minHeight}px`
    const scrollHeight = textarea.scrollHeight
    const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight)
    textarea.style.height = `${newHeight}px`
  }, [])

  useEffect(() => {
    resizeInput()
  }, [input, resizeInput])

  // Initialize textarea height on mount
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      const lineHeight = 18
      const minLines = 3
      textarea.style.height = `${lineHeight * minLines}px`
    }
  }, [])

  const handleApplyActions = async (messageId: number, actions: AssistantAction[]) => {
    if (!onApplyActions && !onPreviewActions) return
    if (isApplying) return

    setIsApplying(true)
    onBeginApply?.(actions)
    try {
      // Only allow one preview at a time; revert any previous preview before applying a new one.
      if (preview) {
        discardPreview()
      }

      const delay = typeof applyDelayMs === "number" && applyDelayMs > 0 ? applyDelayMs : 0
      if (delay) {
        await new Promise((resolve) => setTimeout(resolve, delay))
      }

      // Prefer preview flow when available (side panel should behave like scoped AI preview).
      if (onPreviewActions) {
        const result = onPreviewActions(actions)
        setPreview({ messageId, undo: result.undo, applied: result.applied, errors: result.errors })
        // Keep the UI consistent: show Keep/Discard once preview is ready.
        // (Callers may have intentionally hidden actions until this point.)
        setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, actions } : m)))

        if (result.errors.length > 0) {
          setMessages((prev) => [
            ...prev,
            {
              id: nextMessageId(),
              role: "assistant",
              content: `Previewed ${result.applied} changes. Errors: ${result.errors.join(", ")}`,
            },
          ])
        }
        return
      }

      if (!onApplyActions) return
      const result = onApplyActions(actions)

      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, actionsApplied: true } : m)))

      const summary = summarizeActions(actions)
      const summarySuffix = summary ? ` — ${summary}` : ""
      const errorSuffix = result.errors.length > 0 ? `\n\nErrors: ${result.errors.join(", ")}` : ""
      setMessages((prev) => [
        ...prev,
        {
          id: nextMessageId(),
          role: "assistant",
          content: `Applied ${result.applied} change${result.applied === 1 ? "" : "s"}${summarySuffix}.${errorSuffix}`,
        },
      ])
    } finally {
      onEndApply?.()
      setIsApplying(false)
    }
  }

  const previewActionsForMessage = useCallback(
    async (messageId: number, actions: AssistantAction[]) => {
      if (!onPreviewActions) return
      await handleApplyActions(messageId, actions)
    },
    [onPreviewActions]
  )

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
    // Auto-send after a brief delay
    setTimeout(() => {
      void sendMessageWithText(suggestion)
    }, 50)
  }

  const handleShowPricingFirst = (messageId: number) => {
    // Ask the assistant to describe the pricing it plans to apply, without applying actions.
    // Keep this deterministic so the user can trust what they'll see.
    const prompt =
      context?.mode === "plan"
        ? "Show me the pricing first (per provider + per model). Summarize tier ranges, unit prices, and flat fees."
        : "Show me the pricing first. Summarize the proposed unit prices / tiers / fees."
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, suggestions: undefined } : m)))
    void sendMessageWithText(prompt)
  }

  const sendMessageWithText = async (text: string) => {
    if (!isAssistantEnabled) {
      showToast(t("In this prototype, the assistant only works for setting up pricing plans."))
      return
    }
    const trimmedText = text.trim()
    // Allow sending if there's text, mentions, or a draft reference
    if (!trimmedText && mentions.length === 0 && !draftReference) return
    if (isSending) return

    // If there's an active preview, auto-confirm it before sending new message
    // (rather than discarding the user's work)
    if (preview) {
      const applied = preview.applied
      const errors = preview.errors
      const undo = preview.undo
      const summary = (() => {
        const m = messages.find((msg) => msg.id === preview.messageId)
        return m?.actions ? summarizeActions(m.actions) : null
      })()
      onConfirmPreview?.()
      setPreview(null)
      // Mark the previewed message as applied
      setMessages((prev) => prev.map((m) =>
        m.id === preview.messageId ? { ...m, actionsApplied: true } : m
      ))

      const summarySuffix = summary ? ` — ${summary}` : ""
      const errorSuffix = errors.length > 0 ? `\n\nErrors: ${errors.join(", ")}` : ""
      const appliedMessageId = nextMessageId()
      setMessages((prev) => [
        ...prev,
        {
          id: appliedMessageId,
          role: "assistant",
          content: `Applied ${applied} change${applied === 1 ? "" : "s"}${summarySuffix}.${errorSuffix}`,
          revertUndo: () => {
            try {
              undo()
              setMessages((curr) =>
                curr.map((msg) => (msg.id === appliedMessageId ? { ...msg, reverted: true } : msg))
              )
              setMessages((curr) => [
                ...curr,
                { id: nextMessageId(), role: "assistant", content: "Reverted those changes." },
              ])
            } catch (e) {
              const msg = e instanceof Error ? e.message : "Unknown error"
              setMessages((curr) => [
                ...curr,
                { id: nextMessageId(), role: "assistant", content: `Error reverting changes: ${msg}` },
              ])
            }
          },
        },
      ])
    }

    // Build full text with all references (draft + @ mentions)
    const allReferences: AssistantReference[] = [
      ...(draftReference ? [draftReference] : []),
      ...mentions,
    ]

    const referencePrefix = allReferences.length > 0
      ? allReferences.map(ref => {
          const baseRef = `${referenceKindLabel(ref.kind)}: ${ref.label}${ref.id ? ` (id: ${ref.id})` : ""}`
          // For account references, include the actual content so AI can use it
          if (ref.content) {
            return `${baseRef}\n  → ${ref.content}`
          }
          return baseRef
        }).join("\n") + "\n\n"
      : ""

    const fullText = referencePrefix + trimmedText

    const userMessage: ChatMessage = { id: nextMessageId(), role: "user", content: fullText }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setMentions([]) // Clear mentions after sending
    setHighlightedMentionIndex(null)
    setIsSending(true)
    if (draftReference) onConsumeDraftReference?.()

    // Auto-label tab from first user message
    if (messages.length <= 1) {
      const shortLabel = trimmedText.slice(0, 24) + (trimmedText.length > 24 ? "\u2026" : "")
      setSessionLabels((prev) => ({ ...prev, [activeSessionId]: shortLabel }))
    }

    try {
      const systemPrompt = buildSystemPrompt(context, fullText)
      const model = selectModel()
      const useStreaming = false // gpt-5-mini is fast enough without streaming

      // Compress conversation history to manage context window
      const historyMessages = messages.slice(1).map((m) => ({ role: m.role, content: m.content }))
      const compressedHistory = compressConversationHistory(historyMessages)

      const payloadMessages = [
        { role: "system" as const, content: systemPrompt },
        ...compressedHistory,
        { role: "user" as const, content: fullText },
      ]

      let rawContent = ""
      // Create message ID upfront for streaming (used later for preview targeting)
      const assistantMessageId = nextMessageId()

      if (useStreaming) {
        // Streaming request for complex operations
        setMessages((prev) => [...prev, { id: assistantMessageId, role: "assistant", content: "..." }])

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: payloadMessages, model, stream: true }),
        })

        if (!res.ok) {
          const err = await res.text().catch(() => `Request failed (${res.status})`)
          setMessages((prev) => prev.map(m => m.id === assistantMessageId ? { ...m, content: `Error: ${err}` } : m))
          return
        }

        const reader = res.body?.getReader()
        if (!reader) {
          setMessages((prev) => prev.map(m => m.id === assistantMessageId ? { ...m, content: "Error: No response" } : m))
          return
        }

        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split("\n").filter(line => line.startsWith("data:"))

          for (const line of lines) {
            const data = line.replace(/^data:\s*/, "").trim()
            if (!data) continue

            try {
              const parsed = JSON.parse(data)
              // Just wait for the final content - keep showing pulsing dot
              if (parsed.done && parsed.content) {
                rawContent = parsed.content
              }
            } catch {
              // Skip unparseable
            }
          }
        }
      } else {
        // Non-streaming request for simple operations
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: payloadMessages, model }),
        })
        const data = (await res.json().catch(() => null)) as Record<string, unknown> | null

        if (!res.ok) {
          const err = typeof data?.error === "string" ? data.error : `Request failed (${res.status})`
          setMessages((prev) => [...prev, { id: nextMessageId(), role: "assistant", content: `Error: ${err}` }])
          return
        }

        rawContent = typeof data?.content === "string" ? data.content : ""
      }

      const parsed = parseJsonContent(rawContent)
      const message = parsed?.message ?? rawContent
      const actions = orderActions(normalizeActions(parsed?.actions))
      const suggestions = Array.isArray(parsed?.suggestions)
        ? (parsed?.suggestions ?? []).filter((s): s is string => typeof s === "string").slice(0, 2)
        : []

      // Dev logging - always log for debugging
      const promptLength = systemPrompt.length
      console.log(`[Assistant] ━━━ Response received ━━━`)
      console.log(`[Assistant] System prompt: ${promptLength} chars (~${Math.ceil(promptLength/4)} tokens)`)
      console.log(`[Assistant] Context mode: ${context?.mode ?? 'unknown'}`)
      console.log(`[Assistant] Focus: ${context?.focus ? `${context.focus.kind}:${context.focus.id}:${context.focus.label}` : 'none'}`)
      console.log(`[Assistant] Actions: ${actions.length}`)
      actions.forEach((a, i) => console.log(`[Assistant]   [${i}] ${JSON.stringify(a)}`))
      console.log(`[Assistant] Message: ${message.slice(0, 150)}${message.length > 150 ? '...' : ''}`)

      // For streaming, use the assistantMessageId we created earlier
      // For non-streaming, create a new message ID
      const finalMessageId = useStreaming ? assistantMessageId : nextMessageId()

      if (useStreaming) {
        // Update the streaming message with final content (match by ID)
        setMessages((prev) => prev.map(m =>
          m.id === assistantMessageId
            ? {
                ...m,
                content: message || "(empty response)",
                actions: actions.length > 0 && !onPreviewActions ? actions : undefined,
                suggestions: actions.length > 0 && onPreviewActions ? undefined : suggestions.length > 0 ? suggestions : undefined,
              }
            : m
        ))
      } else {
        // Create new message for non-streaming
        setMessages((prev) => [
          ...prev,
          {
            id: finalMessageId,
            role: "assistant",
            content: message || "(empty response)",
            actions: actions.length > 0 && !onPreviewActions ? actions : undefined,
            suggestions: actions.length > 0 && onPreviewActions ? undefined : suggestions.length > 0 ? suggestions : undefined,
          },
        ])
      }

      // If the host provides preview hooks, auto-preview changes (object-map behavior),
      // while keeping the panel in a loading state until preview is ready.
      if (actions.length > 0 && onPreviewActions) {
        await previewActionsForMessage(finalMessageId, actions)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error"
      setMessages((prev) => [...prev, { id: nextMessageId(), role: "assistant", content: `Error: ${msg}` }])
    } finally {
      setIsSending(false)
    }
  }

  const sendMessage = async () => {
    await sendMessageWithText(input)
  }

  useEffect(() => {
    const prompt = (initialUserMessage ?? "").trim()
    if (!prompt) return
    if (lastConsumedInitialUserMessageRef.current === prompt) return
    if (isSending) return
    lastConsumedInitialUserMessageRef.current = prompt
    onConsumeInitialUserMessage?.()
    void sendMessageWithText(prompt)
  }, [initialUserMessage, isSending, onConsumeInitialUserMessage])

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current != null) {
        window.clearTimeout(toastTimeoutRef.current)
      }
    }
  }, [])

  return (
    <section className="relative flex h-full flex-col overflow-hidden bg-[#ffffff]">
      <header className="flex items-center justify-between px-4 py-3">
        <div className="h-[6px] w-[44px] rounded-full bg-[#D8DEE4]" aria-hidden="true" />
        <button
          type="button"
          className="flex items-center justify-center rounded-[6px] p-2 text-[#474E5A] hover:bg-[#EBEEF1] transition-colors"
          aria-label="Close assistant"
          onClick={() => {
            if (preview) discardPreview()
            onClose()
          }}
        >
          <CloseIcon />
        </button>
      </header>

      {/* Chat session tabs */}
      <div className="flex items-center gap-[6px] overflow-x-auto px-4 pb-[6px]" style={{ scrollbarWidth: "none" }}>
        {sessionIds.map((id) => {
          const isActive = id === activeSessionId
          const label = sessionLabels[id] || `Chat ${id}`
          return (
            <div
              key={id}
              className={`group relative flex items-center gap-[4px] rounded-[6px] border px-[8px] py-[4px] text-[12px] font-[500] cursor-pointer shrink-0 transition-colors ${
                isActive
                  ? "border-[#353A44] bg-[#353A44] text-white"
                  : "border-[#D8DEE4] text-[#596171] hover:border-[#B6C0CD] hover:text-[#353A44]"
              } ${isSending || isApplying ? "pointer-events-none opacity-60" : ""}`}
              onClick={() => switchToSession(id)}
            >
              <span className="truncate max-w-[120px]">{label}</span>
              {sessionIds.length > 1 && (
                <button
                  type="button"
                  className={`flex size-[14px] shrink-0 items-center justify-center rounded-full transition-opacity ${
                    isActive
                      ? "opacity-60 hover:opacity-100 hover:bg-[rgba(255,255,255,0.2)]"
                      : "opacity-0 group-hover:opacity-100 hover:bg-[rgba(0,0,0,0.08)]"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation()
                    closeSession(id)
                  }}
                  aria-label={`Close ${label}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1.5 1.5L6.5 6.5M1.5 6.5L6.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                </button>
              )}
            </div>
          )
        })}
        <button
          type="button"
          className={`flex size-[24px] shrink-0 items-center justify-center rounded-[6px] border border-dashed border-[#D8DEE4] text-[#6C7688] hover:border-[#B6C0CD] hover:text-[#353A44] transition-colors ${
            isSending || isApplying ? "pointer-events-none opacity-60" : ""
          }`}
          onClick={addNewSession}
          aria-label="New chat"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M5 1V9M1 5H9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto pb-4">
        <div className="flex flex-col">
          {messages.map((m) => (
            <div key={m.id} className="px-[24px] py-[4px]">
              {m.role === "user" ? (
                <div className="rounded-[6px] border border-[#D8DEE4] bg-[#F5F6F8] px-[16px] py-[6px] text-[13px] font-[400] leading-[1.6] text-[#596171] shadow-[inset_0_0.5px_0_0_rgba(255,255,255,0.7)]">
                  <div className="whitespace-pre-wrap overflow-hidden text-ellipsis">{renderMessageContent(m.content)}</div>
                </div>
              ) : (
                <div>
                  <div className="flex gap-[8px] items-start px-[16px] py-[6px]">
                    {/* Dot icon aligned to first line of text */}
                    <div className="flex shrink-0 items-center justify-center pt-[6px]">
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="4" cy="4" r="3.5" fill="#596171" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0 text-[13px] font-[400] leading-[1.6] text-[#353A44]">
                      <div className="whitespace-pre-wrap">{m.content}</div>
                      {m.revertUndo ? (
                        <button
                          type="button"
                          disabled={m.reverted}
                          className="mt-2 inline-flex items-center gap-[6px] text-[12px] font-[500] leading-[16px] text-[#474E5A] hover:underline disabled:opacity-50 disabled:hover:no-underline"
                          onClick={() => {
                            if (m.reverted) return
                            m.revertUndo?.()
                          }}
                        >
                          <RevertIcon className="text-[#474E5A]" />
                          <span>Revert</span>
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {/* Action confirmation */}
                  {m.actions && m.actions.length > 0 && !m.actionsApplied && (
                    <div className="mt-1 ml-[16px] rounded-[6px] bg-[#F5F6F8] px-3 py-2">
                      <p className="text-[12px] text-[#6C7688]">
                        {(() => {
                          const totalChanges = countTotalChanges(m.actions!)
                          const summary = summarizeActions(m.actions!)
                          return summary
                            ? `${totalChanges} change${totalChanges === 1 ? "" : "s"} to apply — ${summary}`
                            : `${totalChanges} change${totalChanges === 1 ? "" : "s"} to apply.`
                        })()}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {preview?.messageId === m.id && onPreviewActions ? (
                          <>
                            <button
                              type="button"
                              className="min-w-[110px] flex-1 rounded-[6px] bg-white px-3 py-[6px] text-[12px] font-[500] text-[#353A44] hover:bg-[#F5F6F8] transition-colors"
                              disabled={isApplying}
                              onClick={() => {
                                discardPreview()
                              }}
                            >
                              Discard
                            </button>
                            <button
                              type="button"
                              className="min-w-[110px] flex-1 rounded-[6px] bg-[#635BFF] px-3 py-[6px] text-[12px] font-[500] text-white hover:bg-[#5851DB] transition-colors"
                              disabled={isApplying}
                              onClick={() => {
                                onConfirmPreview?.()
                                const applied = preview?.applied ?? m.actions?.length ?? 0
                                const errors = preview?.errors ?? []
                                const undo = preview?.undo
                                const summary = m.actions ? summarizeActions(m.actions) : null
                                setPreview(null)
                                setMessages((prev) => prev.map((msg) => (msg.id === m.id ? { ...msg, actionsApplied: true } : msg)))

                                const summarySuffix = summary ? ` — ${summary}` : ""
                                const errorSuffix = errors.length > 0 ? `\n\nErrors: ${errors.join(", ")}` : ""
                                const appliedMessageId = nextMessageId()
                                setMessages((prev) => [
                                  ...prev,
                                  {
                                    id: appliedMessageId,
                                    role: "assistant",
                                    content: `Applied ${applied} change${applied === 1 ? "" : "s"}${summarySuffix}.${errorSuffix}`,
                                    revertUndo: undo
                                      ? () => {
                                          try {
                                            undo()
                                            setMessages((curr) =>
                                              curr.map((msg) => (msg.id === appliedMessageId ? { ...msg, reverted: true } : msg))
                                            )
                                            setMessages((curr) => [
                                              ...curr,
                                              { id: nextMessageId(), role: "assistant", content: "Reverted those changes." },
                                            ])
                                          } catch (e) {
                                            const msg = e instanceof Error ? e.message : "Unknown error"
                                            setMessages((curr) => [
                                              ...curr,
                                              { id: nextMessageId(), role: "assistant", content: `Error reverting changes: ${msg}` },
                                            ])
                                          }
                                        }
                                      : undefined,
                                  },
                                ])
                              }}
                            >
                              Keep
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="min-w-[110px] flex-1 rounded-[6px] bg-[#635BFF] px-3 py-[6px] text-[12px] font-[500] text-white hover:bg-[#5851DB] transition-colors"
                              disabled={isApplying}
                              onClick={() => void handleApplyActions(m.id, m.actions!)}
                            >
                              Apply
                            </button>
                            <button
                              type="button"
                              className="min-w-[110px] flex-1 rounded-[6px] bg-white px-3 py-[6px] text-[12px] font-[500] text-[#353A44] hover:bg-[#F5F6F8] transition-colors"
                              disabled={isApplying}
                              onClick={() => handleShowPricingFirst(m.id)}
                            >
                              Show pricing
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Suggestion buttons (only when there is no pending apply block) */}
                  {(!m.actions || m.actions.length === 0) && m.suggestions && m.suggestions.length > 0 && !m.actionsApplied && (
                    <div className="mt-1 ml-[16px] flex flex-wrap gap-2">
                      {m.suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="rounded-[6px] border border-[#D8DEE4] bg-white px-3 py-[6px] text-[12px] font-[500] text-[#353A44] hover:bg-[#F5F6F8] hover:border-[#B6C0CD] transition-colors"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Thinking indicator — sparkle icon + text in accent color */}
          {(isSending || isApplying) && (
            <div className="flex gap-[8px] items-start px-[40px] py-[10px]">
              <div className="flex shrink-0 items-center justify-center pt-[6px]">
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-[pulse-sparkle_1.5s_ease-in-out_infinite]">
                  <path d="M4 0L4.8 3.2L8 4L4.8 4.8L4 8L3.2 4.8L0 4L3.2 3.2L4 0Z" fill="#635BFF" />
                </svg>
              </div>
              <span className="text-[13px] font-[400] leading-[1.6] text-[#635BFF] animate-[pulse-sparkle_1.5s_ease-in-out_infinite]">
                {isApplying ? "Applying…" : "Thinking…"}
              </span>
              <style jsx>{`
                @keyframes pulse-sparkle {
                  0%, 100% { opacity: 0.5; }
                  50% { opacity: 1; }
                }
              `}</style>
            </div>
          )}
        </div>
      </div>

      <footer className="px-[24px] py-[4px]">
        <div className="relative">
          {/* @ Mention dropdown */}
          {showMentionDropdown && filteredMentions.length > 0 && (
            <div
              ref={mentionDropdownRef}
              className="absolute bottom-full left-0 right-0 mb-1 max-h-[240px] overflow-y-auto rounded-[8px] border border-[#EBEEF1] bg-white py-1 shadow-[0_4px_12px_rgba(0,0,0,0.12)]"
            >
              {/* Existing objects only */}
              {filteredMentions.map((obj, idx) => (
                <button
                  key={`${obj.kind}-${obj.id ?? "none"}-${idx}`}
                  type="button"
                  data-mention-index={idx}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] font-[500] transition-colors ${
                    idx === mentionDropdownIndex
                      ? "bg-[#F0F2F5] text-[#353A44]"
                      : "text-[#596171] hover:bg-[#F5F6F8]"
                  }`}
                  onClick={() => handleSelectMention(obj)}
                  onMouseEnter={() => setMentionDropdownIndex(idx)}
                >
                  <span className="flex size-[16px] shrink-0 items-center justify-center">
                    {renderReferenceIcon(obj.kind, 16)}
                  </span>
                  <span className="truncate">{obj.label}</span>
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-[6px]">
            {/* Pills row: draft reference + @ mentions */}
            {(draftReference || mentions.length > 0) && (
              <div className="flex flex-wrap gap-[6px]">
                {draftReference && (
                  <div
                    className={`inline-flex w-fit items-center gap-[6px] rounded-[6px] px-[8px] py-[6px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] transition-all ${
                      highlightedDraftReference
                        ? "bg-[#635BFF] text-white ring-2 ring-[#635BFF] ring-offset-1"
                        : "bg-[#EBEEF1] text-[#353A44]"
                    }`}
                  >
                    <span className="flex size-[12px] shrink-0 items-center justify-center">
                      {renderReferenceIcon(draftReference.kind)}
                    </span>
                    <span className="whitespace-nowrap">{draftReference.label}</span>
                    <button
                      type="button"
                      aria-label={t("Remove reference")}
                      className="flex size-[14px] items-center justify-center rounded-full hover:bg-[#00000015] transition-colors"
                      onClick={handleRemoveDraftReference}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1.5 1.5L6.5 6.5M1.5 6.5L6.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                )}
                {mentions.map((mention, idx) => (
                  <ContentTooltip key={idx} content={mention.content}>
                    <div
                      className={`inline-flex w-fit items-center gap-[6px] rounded-[6px] px-[8px] py-[6px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] transition-all ${
                        highlightedMentionIndex === idx
                          ? "bg-[#635BFF] text-white ring-2 ring-[#635BFF] ring-offset-1"
                          : "bg-[#EBEEF1] text-[#353A44]"
                      }`}
                    >
                      <span className="flex size-[12px] shrink-0 items-center justify-center">
                        {renderReferenceIcon(mention.kind)}
                      </span>
                      <span className="whitespace-nowrap">{mention.label}</span>
                      <button
                        type="button"
                        aria-label={t("Remove reference")}
                        className="flex size-[14px] items-center justify-center rounded-full hover:bg-[#00000015] transition-colors"
                        onClick={() => handleRemoveMention(idx)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8" fill="none">
                          <path d="M1.5 1.5L6.5 6.5M1.5 6.5L6.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                  </ContentTooltip>
                ))}
              </div>
            )}
            <div className="border-t border-[#EBEEF1] px-[16px] py-[6px]">
              <textarea
                ref={textareaRef}
                className="w-full resize-none bg-transparent text-[13px] font-[400] leading-[1.6] text-[#353A44] placeholder:text-[#6C7688] outline-none"
                style={{ height: 40 }}
                placeholder={
                  !isAssistantEnabled
                    ? t("In this prototype, the assistant only works for setting up pricing plans.")
                    : (mentions.length > 0 || draftReference ? t("Ask about these objects…") : t("Ask a follow up or hit / for options"))
                }
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>
        </div>
        {toastMessage ? (
          <div className="pointer-events-none absolute bottom-[16px] left-[16px] right-[16px] z-[9999]">
            <div className="mx-auto w-fit max-w-full rounded-[10px] bg-[#1F2432] px-3 py-2 text-[12px] font-[600] leading-[16px] text-white shadow-[0_12px_32px_rgba(28,32,40,0.28)]">
              {toastMessage}
            </div>
          </div>
        ) : null}
      </footer>
    </section>
  )
}
