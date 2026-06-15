"use client"

import { useEffect, useRef, useState } from "react"
import type { ValidationErrorObject } from "@/components/product-catalog/PlanForm/validatePlanForm"
import { CatalogObjectGlyph } from "@/components/product-catalog/iconography"

type ValidationAttentionPanelProps = {
  t: (key: string) => string
  objects: ValidationErrorObject[]
  onNavigateToObject: (obj: ValidationErrorObject) => void
  onDismiss?: () => void
}

/**
 * After navigating to an error object, focus the first input
 * whose field has a visible validation error (FieldError component).
 */
function focusFirstErrorInput() {
  requestAnimationFrame(() => {
    const panel = document.querySelector("[data-form-panel]")
    if (!panel) return
    // FieldError renders a wrapper div containing a span with text-[#DF1B41].
    // Walk up from that error indicator to find the enclosing field, then focus its input.
    const errorIndicator = panel.querySelector(".text-\\[\\#DF1B41\\]")
    if (errorIndicator) {
      // The error div is a sibling of the input within a shared parent container
      const fieldContainer = errorIndicator.closest("div")?.parentElement
      if (fieldContainer) {
        const input = fieldContainer.querySelector<HTMLElement>(
          "input:not([type='hidden']), textarea, select"
        )
        if (input) {
          input.focus()
          return
        }
      }
    }
    // Fallback: focus first input in the panel
    const input = panel.querySelector<HTMLElement>(
      "input:not([type='hidden']), textarea, select"
    )
    input?.focus()
  })
}

export function ValidationAttentionPanel({ t, objects, onNavigateToObject, onDismiss }: ValidationAttentionPanelProps) {
  const count = objects.length
  const panelRef = useRef<HTMLDivElement>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const selectedIndexRef = useRef(0)

  // Navigate to the first error object on mount
  useEffect(() => {
    if (objects.length > 0) {
      onNavigateToObject(objects[0])
    }
    // Only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keyboard handler for arrow navigation, enter, and escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        const next = (selectedIndexRef.current + 1) % objects.length
        selectedIndexRef.current = next
        setSelectedIndex(next)
        onNavigateToObject(objects[next])
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        const next = (selectedIndexRef.current - 1 + objects.length) % objects.length
        selectedIndexRef.current = next
        setSelectedIndex(next)
        onNavigateToObject(objects[next])
      } else if (e.key === "Enter") {
        e.preventDefault()
        const obj = objects[selectedIndexRef.current]
        if (obj) {
          onNavigateToObject(obj)
          focusFirstErrorInput()
          onDismiss?.()
        }
      } else if (e.key === "Escape") {
        e.preventDefault()
        onDismiss?.()
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [objects, onNavigateToObject, onDismiss])

  // Click outside to dismiss
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onDismiss?.()
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [onDismiss])

  const handleClick = (obj: ValidationErrorObject) => {
    onNavigateToObject(obj)
    focusFirstErrorInput()
    onDismiss?.()
  }

  return (
    <div ref={panelRef} className="inline-flex flex-col rounded-[12px] border border-[#EBEEF1] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="px-[16px] pt-[12px] pb-[11px] border-b border-[#EBEEF1]">
        <p className="text-[14px] leading-[20px] text-[#1A2C44]">
          <span className="font-[600]">{count} {count === 1 ? t("form") : t("forms")}</span>
          {" "}<span className="font-[400]">{t("need attention")}</span>
        </p>
      </div>
      <div className="flex flex-col px-[8px] py-[8px] gap-[2px]">
        {objects.map((obj, i) => {
          const isSelected = i === selectedIndex
          return (
            <button
              key={`${obj.nodeType}:${obj.nodeId ?? "root"}`}
              type="button"
              className={`flex items-center gap-[8px] rounded-[6px] px-[10px] py-[6px] text-left text-[12px] font-[400] leading-[16px] text-[#1A2C44] transition-colors ${
                isSelected ? "bg-[#F7F5FD]" : "hover:bg-[#F7F5FD]"
              }`}
              onClick={() => handleClick(obj)}
              onMouseEnter={() => {
                setSelectedIndex(i)
                onNavigateToObject(obj)
              }}
              tabIndex={-1}
            >
              <CatalogObjectGlyph kind={obj.nodeType === "priceGroup" ? "rateCard" : obj.nodeType} />
              <span className="min-w-0 truncate">{obj.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
