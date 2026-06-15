'use client'

import { useState } from "react"
import { deriveFlowEdges, type FlowEdge, type WorkflowConfig } from "./workflowConfig"

type Suggestion = {
  actionLabel: string
  reason: string
  onClick: () => void
}

type NextObjectSuggestionsProps = {
  suggestions: Suggestion[]
  config?: WorkflowConfig
}

function InfoIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0" style={{ width: 11.5, height: 11.5 }}>
      <path fillRule="evenodd" clipRule="evenodd" d="M8.5 1.5H3C2.17157 1.5 1.5 2.17157 1.5 3V8.5C1.5 9.32843 2.17157 10 3 10H8.5C9.32843 10 10 9.32843 10 8.5V3C10 2.17157 9.32843 1.5 8.5 1.5ZM3 0C1.34315 0 0 1.34315 0 3V8.5C0 10.1569 1.34315 11.5 3 11.5H8.5C10.1569 11.5 11.5 10.1569 11.5 8.5V3C11.5 1.34315 10.1569 0 8.5 0H3Z" fill="#3C4F69"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M4.23182 6.24998C4.23182 5.86338 4.54522 5.54998 4.93182 5.54998H6.02273C6.40933 5.54998 6.72273 5.86338 6.72273 6.24998V8.24998C6.72273 8.63658 6.40933 8.94998 6.02273 8.94998C5.63613 8.94998 5.32273 8.63658 5.32273 8.24998V6.94998H4.93182C4.54522 6.94998 4.23182 6.63658 4.23182 6.24998Z" fill="#3C4F69"/>
      <path d="M4.74994 3.74999C4.74994 3.19858 5.19854 2.74999 5.74994 2.74999C6.30134 2.74999 6.74994 3.19858 6.74994 3.74999C6.74994 4.30139 6.30134 4.74999 5.74994 4.74999C5.19854 4.74999 4.74994 4.30139 4.74994 3.74999Z" fill="#3C4F69"/>
    </svg>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      className={`shrink-0 transition-transform duration-150 ${open ? "rotate-90" : ""}`}
    >
      <path d="M3.5 2L6.5 5L3.5 8" stroke="#6C7688" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg width="10" height="8" viewBox="0 0 10 8" fill="none" className="shrink-0 mt-[1px]">
      <path d="M1 4H8.5M8.5 4L5.5 1M8.5 4L5.5 7" stroke="#9CA3B0" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export { deriveFlowEdges, type FlowEdge }

function ConnectedFlowsPanel({ edges }: { edges: FlowEdge[] }) {
  const grouped = new Map<string, { toLabel: string; reason: string }[]>()
  for (const e of edges) {
    const list = grouped.get(e.fromLabel) ?? []
    list.push({ toLabel: e.toLabel, reason: e.reason })
    grouped.set(e.fromLabel, list)
  }

  return (
    <div className="flex flex-col gap-[8px]">
      {Array.from(grouped.entries()).map(([from, targets]) => (
        <div key={from} className="flex flex-col gap-[3px]">
          <p className="text-[11px] font-[600] leading-[14px] tracking-[-0.02px] text-[#3C4F69] uppercase">
            {from}
          </p>
          {targets.map((t, i) => (
            <div key={i} className="flex items-start gap-[6px] pl-[2px]">
              <ArrowRightIcon />
              <p className="text-[11px] font-[400] leading-[14px] text-[#6C7688]">
                <span className="font-[500] text-[#3C4F69]">{t.toLabel}</span>
                {" "}<span className="italic">{t.reason}</span>
              </p>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export function NextObjectSuggestions({ suggestions, config }: NextObjectSuggestionsProps) {
  const [showFlows, setShowFlows] = useState(false)

  if (suggestions.length === 0 && !config) return null

  const flowEdges = config ? deriveFlowEdges(config) : []
  const hasFlows = flowEdges.length > 0

  return (
    <div className="mt-[16px] flex flex-col gap-[8px]">
      {suggestions.length > 0 && (
        <div className="flex flex-col gap-[6px] rounded-[6px] bg-[#F4F7FA] px-[12px] py-[10px]">
          <div className="flex items-center gap-[8px] mb-[4px]">
            <InfoIcon />
            <p className="text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#1A2C44]">
              What&apos;s next?
            </p>
          </div>
          {suggestions.map((s, i) => (
            <p key={i} className="text-[12px] font-[400] leading-[16px] text-[#1A2C44]">
              <button
                type="button"
                className="font-[400] text-[#533AFD] hover:underline"
                onClick={s.onClick}
              >
                {s.actionLabel}
              </button>
              {" "}{s.reason}
            </p>
          ))}
        </div>
      )}

      {hasFlows && (
        <div className="rounded-[6px] border border-[#ECF1F6] bg-[#FAFBFC]">
          <button
            type="button"
            className="flex w-full items-center gap-[6px] px-[12px] py-[8px] text-[11px] font-[500] leading-[14px] text-[#6C7688] hover:text-[#3C4F69] transition-colors"
            onClick={() => setShowFlows(!showFlows)}
          >
            <ChevronIcon open={showFlows} />
            Connected flows
          </button>
          {showFlows && (
            <div className="border-t border-[#ECF1F6] px-[12px] py-[10px]">
              <ConnectedFlowsPanel edges={flowEdges} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
