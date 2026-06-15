'use client'

import { useRef, useEffect } from "react"
import type { ValidationError } from "./useWorkflowState"
import type { WorkflowConfig } from "./workflowConfig"

type ValidationPanelProps = {
  errors: ValidationError[]
  config: WorkflowConfig
  onNavigateToError: (objectId: string) => void
  onDismiss: () => void
}

export function ValidationPanel({ errors, config, onNavigateToError, onDismiss }: ValidationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  // Click outside to dismiss
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onDismiss()
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [onDismiss])

  if (errors.length === 0) return null

  // Group errors by object
  const grouped = new Map<string, { label: string; kind: string; fields: string[] }>()
  for (const err of errors) {
    const existing = grouped.get(err.objectId)
    if (existing) {
      existing.fields.push(err.field)
    } else {
      // Find the kind from the workflow objects via the error's objectLabel
      const kindEntry = Object.entries(config.objectKinds).find(
        ([, v]) => v.label === err.objectLabel
      )
      grouped.set(err.objectId, {
        label: err.objectLabel,
        kind: kindEntry?.[0] ?? "",
        fields: [err.field],
      })
    }
  }

  const totalFields = errors.length

  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex items-start justify-end px-[16px] pt-[48px]">
      <div
        ref={panelRef}
        className="pointer-events-auto inline-flex flex-col rounded-[12px] border border-[#EBEEF1] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.04)]"
      >
        <div className="flex items-center justify-between border-b border-[#EBEEF1] px-[16px] pt-[12px] pb-[11px]">
          <p className="text-[14px] leading-[20px] text-[#1A2C44]">
            <span className="font-[600]">{totalFields} {totalFields === 1 ? "field" : "fields"}</span>
            {" "}<span className="font-[400]">need attention</span>
          </p>
          <button
            type="button"
            className="ml-[12px] text-[#9CA3B0] transition-colors hover:text-[#6C7688]"
            onClick={onDismiss}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="flex flex-col px-[8px] py-[8px] gap-[2px]">
          {Array.from(grouped.entries()).map(([objectId, { label, fields }]) => (
            <button
              key={objectId}
              type="button"
              className="flex items-center gap-[8px] rounded-[6px] px-[10px] py-[6px] text-left transition-colors hover:bg-[#F7F5FD]"
              onClick={() => {
                onNavigateToError(objectId)
                onDismiss()
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                <circle cx="7" cy="7" r="6" stroke="#DF1B41" strokeWidth="1.5" />
                <path d="M7 4V7.5" stroke="#DF1B41" strokeWidth="1.2" strokeLinecap="round" />
                <circle cx="7" cy="9.75" r="0.75" fill="#DF1B41" />
              </svg>
              <div>
                <p className="text-[12px] font-[400] leading-[16px] text-[#1A2C44]">{label}</p>
                <p className="text-[11px] font-[400] leading-[14px] text-[#9CA3B0]">
                  {fields.join(", ")}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
