'use client'

import { useCallback, useEffect, useRef, useState } from "react"

export function useModalPanelResize(opts: {
  initialFormPx: number
  initialChatPx: number
  isAssistantOpen: boolean
  leftPanelMinPx: number
  formPanelMinPx: number
  chatPanelMinPx: number
  chatPanelMaxPx: number
}) {
  const {
    initialFormPx,
    initialChatPx,
    isAssistantOpen,
    leftPanelMinPx,
    formPanelMinPx,
    chatPanelMinPx,
    chatPanelMaxPx,
  } = opts

  const [formPanelWidthPx, setFormPanelWidthPx] = useState(initialFormPx)
  const [chatPanelWidthPx, setChatPanelWidthPx] = useState(initialChatPx)
  const resizeContainerRef = useRef<HTMLDivElement | null>(null)
  const resizeStateRef = useRef<
    | null
    | {
        kind: "left" | "right"
        startX: number
        startForm: number
        startChat: number
        containerWidth: number
        assistantOpen: boolean
      }
  >(null)
  const [resizeKind, setResizeKind] = useState<null | "left" | "right">(null)

  const clampNumber = useCallback((value: number, min: number, max: number) => Math.min(max, Math.max(min, value)), [])

  const beginResize = useCallback(
    (kind: "left" | "right") =>
      (event: React.PointerEvent) => {
        if (typeof window === "undefined") return
        if (!resizeContainerRef.current) return
        event.preventDefault()
        const rect = resizeContainerRef.current.getBoundingClientRect()
        resizeStateRef.current = {
          kind,
          startX: event.clientX,
          startForm: formPanelWidthPx,
          startChat: chatPanelWidthPx,
          containerWidth: rect.width,
          assistantOpen: isAssistantOpen,
        }
        setResizeKind(kind)
      },
    [chatPanelWidthPx, formPanelWidthPx, isAssistantOpen]
  )

  useEffect(() => {
    if (resizeKind == null) return
    if (typeof window === "undefined") return

    const previousCursor = document.body.style.cursor
    const previousUserSelect = document.body.style.userSelect
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"

    const handleMove = (event: PointerEvent) => {
      const state = resizeStateRef.current
      if (!state) return
      const deltaX = event.clientX - state.startX

      if (state.kind === "left") {
        const reservedRight = state.assistantOpen ? state.startChat : 0
        const maxForm = state.containerWidth - reservedRight - leftPanelMinPx
        const nextForm = clampNumber(state.startForm - deltaX, formPanelMinPx, maxForm)
        setFormPanelWidthPx(Math.round(nextForm))
        return
      }

      // right divider only exists when assistant is open
      if (!state.assistantOpen) return

      const sum = state.startForm + state.startChat
      const minFormAllowed = Math.max(formPanelMinPx, sum - chatPanelMaxPx)
      const maxFormAllowed = sum - chatPanelMinPx
      const nextForm = clampNumber(state.startForm + deltaX, minFormAllowed, maxFormAllowed)
      const nextChat = sum - nextForm
      setFormPanelWidthPx(Math.round(nextForm))
      setChatPanelWidthPx(Math.round(nextChat))
    }

    const handleUp = () => {
      resizeStateRef.current = null
      setResizeKind(null)
    }

    window.addEventListener("pointermove", handleMove)
    window.addEventListener("pointerup", handleUp)

    return () => {
      window.removeEventListener("pointermove", handleMove)
      window.removeEventListener("pointerup", handleUp)
      document.body.style.cursor = previousCursor
      document.body.style.userSelect = previousUserSelect
    }
  }, [chatPanelMaxPx, chatPanelMinPx, clampNumber, formPanelMinPx, leftPanelMinPx, resizeKind])

  const resetPanelWidths = useCallback(() => {
    setFormPanelWidthPx(initialFormPx)
    setChatPanelWidthPx(initialChatPx)
  }, [initialChatPx, initialFormPx])

  return {
    formPanelWidthPx,
    chatPanelWidthPx,
    setFormPanelWidthPx,
    setChatPanelWidthPx,
    resizeContainerRef,
    beginResize,
    resetPanelWidths,
  }
}


