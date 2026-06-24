"use client"

import { useState } from "react"
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronRight,
  RefreshCw,
  XCircle,
} from "lucide-react"
import ContractEditorBase from "../ContractEditorBase"
import { DEFAULT_STATE, chatJSON, type ContractState } from "../types"

type Severity = "ok" | "warning" | "info"

type ReviewStep = {
  id: string
  field: string
  severity: Severity
  question: string
  recommendation: string
  actionLabel?: string
  patch?: Partial<ContractState>
}

type Phase = "idle" | "loading" | "reviewing" | "done"

const SYSTEM_PROMPT = `You are a senior enterprise deal reviewer at Stripe. Review this contract draft and return 3-6 concise review steps.

Each step: {id, field, severity ("ok"|"warning"|"info"), question, recommendation, actionLabel?, patch?}
- "patch" is a partial ContractState to apply if user accepts (e.g. {"discount": 15} or {"customer": {"name":"...", "email":"..."}})
- "actionLabel" is the accept button label (e.g. "Apply 15% discount")
- Focus on: missing customer info, pricing vs list price, discount levels, contract duration, missing lines

Return JSON: {"steps": [...]}`

const SEVERITY_ICONS = {
  ok: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
}

const SEVERITY_COLORS = {
  ok: "text-green-500",
  warning: "text-amber-500",
  info: "text-blue-500",
}

const SEVERITY_BG = {
  ok: "bg-green-50 border-green-100",
  warning: "bg-amber-50 border-amber-100",
  info: "bg-blue-50 border-blue-100",
}

export default function GuidedNegotiation() {
  const [state, setState] = useState<ContractState>(DEFAULT_STATE)
  const [phase, setPhase] = useState<Phase>("idle")
  const [steps, setSteps] = useState<ReviewStep[]>([])
  const [current, setCurrent] = useState(0)
  const [accepted, setAccepted] = useState<Set<string>>(new Set())
  const [skipped, setSkipped] = useState<Set<string>>(new Set())

  async function startReview() {
    setPhase("loading")
    const result = await chatJSON<{ steps: ReviewStep[] }>(
      SYSTEM_PROMPT,
      `Review this contract:\n${JSON.stringify(state, null, 2)}`,
      { steps: [] }
    )
    if (!result.steps?.length) {
      setPhase("idle")
      return
    }
    setSteps(result.steps)
    setCurrent(0)
    setAccepted(new Set())
    setSkipped(new Set())
    setPhase("reviewing")
  }

  function accept(step: ReviewStep) {
    if (step.patch) setState((s) => deepMerge(s, step.patch!))
    setAccepted((prev) => new Set([...prev, step.id]))
    advance()
  }

  function skip(step: ReviewStep) {
    setSkipped((prev) => new Set([...prev, step.id]))
    advance()
  }

  function advance() {
    if (current + 1 >= steps.length) {
      setPhase("done")
    } else {
      setCurrent((i) => i + 1)
    }
  }

  const step = steps[current]
  const done = accepted.size + skipped.size
  const progress = steps.length ? (done / steps.length) * 100 : 0
  const Icon = step ? SEVERITY_ICONS[step.severity] : null

  return (
    <div className="relative h-full flex flex-col">
      {/* Explainer */}
      <div className="flex-shrink-0 bg-green-50 border-b border-green-100 px-6 py-2.5">
        <span className="text-xs text-green-800">
          <strong>V4 · Guided negotiation</strong> — Fill out the contract, then click{" "}
          <strong>Review deal</strong> and the AI will walk you through it step by step.
        </span>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <ContractEditorBase state={state} onChange={setState} />
      </div>

      {/* Review panel */}
      {phase === "idle" && (
        <div className="flex-shrink-0 border-t border-gray-200 bg-white px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-800">Ready to review?</p>
            <p className="text-xs text-gray-400 mt-0.5">
              AI will walk through your deal line by line
            </p>
          </div>
          <button
            onClick={startReview}
            className="flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
          >
            <Sparkles size={14} />
            Review deal
          </button>
        </div>
      )}

      {phase === "loading" && (
        <div className="flex-shrink-0 border-t border-gray-200 bg-white px-6 py-5 flex items-center justify-center gap-3">
          <Loader2 size={15} className="animate-spin text-gray-400" />
          <span className="text-sm text-gray-500">Reviewing your deal…</span>
        </div>
      )}

      {phase === "reviewing" && step && Icon && (
        <div className="flex-shrink-0 border-t border-gray-200 bg-white">
          {/* Progress bar */}
          <div className="h-0.5 bg-gray-100">
            <div
              className="h-full bg-blue-400 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className={`border-b ${SEVERITY_BG[step.severity]} px-6 py-4`}>
            <div className="flex items-start gap-3">
              <Icon
                size={18}
                className={`${SEVERITY_COLORS[step.severity]} mt-0.5 flex-shrink-0`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  {step.field}
                </p>
                <p className="text-sm font-semibold text-gray-900 mb-1">{step.question}</p>
                <p className="text-sm text-gray-600">{step.recommendation}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0 items-center mt-0.5">
                <button
                  onClick={() => skip(step)}
                  className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 border border-gray-200 rounded-lg bg-white transition-colors"
                >
                  Skip
                </button>
                <button
                  onClick={() => accept(step)}
                  className="text-xs text-white bg-gray-900 hover:bg-gray-800 px-3 py-1.5 rounded-lg transition-colors font-medium"
                >
                  {step.actionLabel ?? "Got it"}
                </button>
              </div>
            </div>

            {/* Step dots */}
            <div className="flex gap-1 mt-3">
              {steps.map((s, i) => (
                <div
                  key={s.id}
                  className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                    accepted.has(s.id)
                      ? "bg-green-400"
                      : skipped.has(s.id)
                      ? "bg-gray-200"
                      : i === current
                      ? "bg-blue-400"
                      : "bg-gray-100"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {phase === "done" && (
        <div className="flex-shrink-0 border-t border-gray-200 bg-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={18} className="text-green-500" />
            <div>
              <p className="text-sm font-semibold text-gray-800">Review complete</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {accepted.size} applied · {skipped.size} skipped
              </p>
            </div>
          </div>
          <button
            onClick={startReview}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 px-3 py-2 border border-gray-200 rounded-lg transition-colors"
          >
            <RefreshCw size={13} />
            Re-review
          </button>
        </div>
      )}
    </div>
  )
}

function deepMerge<T extends object>(target: T, source: Partial<T>): T {
  const result = { ...target }
  for (const key of Object.keys(source) as (keyof T)[]) {
    const sv = source[key]
    const tv = target[key]
    if (sv !== null && typeof sv === "object" && !Array.isArray(sv) && typeof tv === "object") {
      result[key] = deepMerge(tv as object, sv as object) as T[typeof key]
    } else if (sv !== undefined) {
      result[key] = sv as T[typeof key]
    }
  }
  return result
}
