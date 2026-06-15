'use client'

import { useEffect } from "react"

type AutosizeOpts = {
  isEnabled: boolean
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  value: string
  lineHeightPx?: number
  minLines?: number
  maxLines?: number
}

export function useAutosizeTextarea({
  isEnabled,
  textareaRef,
  value,
  lineHeightPx = 18,
  minLines = 3,
  maxLines = 8,
}: AutosizeOpts) {
  useEffect(() => {
    if (!isEnabled) return
    const textarea = textareaRef.current
    if (!textarea) return

    const minHeight = lineHeightPx * minLines
    const maxHeight = lineHeightPx * maxLines

    textarea.style.height = `${minHeight}px`
    const nextHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight)
    textarea.style.height = `${nextHeight}px`
  }, [isEnabled, lineHeightPx, maxLines, minLines, textareaRef, value])
}


