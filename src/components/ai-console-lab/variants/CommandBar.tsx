"use client"

import { useState, useEffect, useRef } from "react"
import { Command, X, ArrowRight, Loader2, Sparkles } from "lucide-react"
import ContractEditorBase from "../ContractEditorBase"
import {
  DEFAULT_STATE,
  chatJSON,
  type ContractState,
  type PlanLine,
} from "../types"

const SYSTEM_PROMPT = `You are a Stripe contract form parser. Parse the instruction and return field updates.

Available fields:
- customer.name, customer.email
- currency (USD/EUR/GBP/JPY/AUD/CAD)
- startDate, endDate (YYYY-MM-DD)
- discount (number 0-100)
- planLines: array of {product, price (monthly number), qty, startDate, endDate}

Return JSON only:
{
  "updates": { "field.path": "value" },
  "addLines": [{ "product": "", "price": 0, "qty": 1, "startDate": "", "endDate": "" }],
  "removeLineIds": [],
  "message": "Plain English summary of what you changed"
}`

const SUGGESTIONS = [
  "Set customer to Acme Corp, billing@example.com",
  "Add Enterprise plan at $8,000/mo, 50 seats, Jan–Dec 2027",
  "Apply a 15% discount",
  "Change currency to EUR and end date to 2027-12-31",
]

type ParsedUpdate = {
  updates?: Record<string, string | number>
  addLines?: Omit<PlanLine, "id">[]
  removeLineIds?: string[]
  message?: string
}

export default function CommandBar() {
  const [state, setState] = useState<ContractState>(DEFAULT_STATE)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [resultMessage, setResultMessage] = useState<string>()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen(true)
      }
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
    if (!open) {
      setQuery("")
      setResultMessage(undefined)
    }
  }, [open])

  async function submit(e?: React.FormEvent) {
    e?.preventDefault()
    if (!query.trim() || loading) return
    setLoading(true)
    const parsed = await chatJSON<ParsedUpdate>(
      SYSTEM_PROMPT,
      `Current state: ${JSON.stringify(state)}\n\nInstruction: ${query}`,
      {}
    )
    applyParsed(parsed)
    setResultMessage(parsed.message ?? "Done.")
    setQuery("")
    setLoading(false)
    setTimeout(() => {
      setOpen(false)
      setResultMessage(undefined)
    }, 1800)
  }

  function applyParsed(parsed: ParsedUpdate) {
    setState((prev) => {
      let next = { ...prev }
      if (parsed.updates) {
        for (const [key, value] of Object.entries(parsed.updates)) {
          const parts = key.split(".")
          if (parts[0] === "customer") {
            next = { ...next, customer: { ...next.customer, [parts[1]]: String(value) } }
          } else if (key === "discount") {
            next = { ...next, discount: Number(value) }
          } else if (["currency", "startDate", "endDate"].includes(key)) {
            next = { ...next, [key]: String(value) }
          }
        }
      }
      if (parsed.addLines?.length) {
        next = {
          ...next,
          planLines: [
            ...next.planLines,
            ...parsed.addLines.map((l) => ({ ...l, id: crypto.randomUUID() })),
          ],
        }
      }
      if (parsed.removeLineIds?.length) {
        next = {
          ...next,
          planLines: next.planLines.filter(
            (l) => !parsed.removeLineIds!.includes(l.id)
          ),
        }
      }
      return next
    })
  }

  return (
    <div className="relative h-full flex flex-col">
      {/* Explainer + trigger */}
      <div className="flex-shrink-0 bg-violet-50 border-b border-violet-100 px-6 py-2.5 flex items-center justify-between">
        <span className="text-xs text-violet-700">
          <strong>V2 · Command bar</strong> — Press{" "}
          <kbd className="bg-violet-100 border border-violet-200 rounded px-1 text-[10px]">
            ⌘K
          </kbd>{" "}
          to open, then describe your change in plain English.
        </span>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 text-xs text-violet-600 hover:text-violet-800 bg-white border border-violet-200 rounded-full px-3 py-1 shadow-sm"
        >
          <Command size={11} />
          Open
          <kbd className="text-[10px] bg-violet-50 border border-violet-200 rounded px-1">
            ⌘K
          </kbd>
        </button>
      </div>

      <ContractEditorBase state={state} onChange={setState} />

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[18vh]">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 overflow-hidden">
            <form onSubmit={submit}>
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
                {loading ? (
                  <Loader2 size={16} className="text-violet-500 animate-spin flex-shrink-0" />
                ) : (
                  <Sparkles size={16} className="text-violet-500 flex-shrink-0" />
                )}
                <input
                  ref={inputRef}
                  className="flex-1 text-sm outline-none placeholder-gray-400 bg-transparent"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Add Enterprise plan, 500 seats, Jan–Dec 2027…"
                  disabled={loading}
                />
                {query && !loading && (
                  <button type="submit" className="text-violet-600 hover:text-violet-800">
                    <ArrowRight size={16} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-gray-300 hover:text-gray-500 ml-1"
                >
                  <X size={15} />
                </button>
              </div>
            </form>

            {resultMessage && (
              <div className="px-4 py-3 text-sm text-green-700 bg-green-50 border-t border-green-100 flex items-center gap-2">
                <span className="text-green-500">✓</span>
                {resultMessage}
              </div>
            )}

            {!resultMessage && !loading && (
              <div className="p-3">
                <p className="text-[11px] text-gray-400 px-1 mb-1.5 font-medium uppercase tracking-wide">
                  Try
                </p>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    className="block w-full text-left text-sm text-gray-600 hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors"
                    onClick={() => setQuery(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
