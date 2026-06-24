"use client"

import { useState, useRef, useEffect } from "react"
import { Terminal, ChevronDown, ChevronUp, Send, Loader2, Copy, Check } from "lucide-react"
import ContractEditorBase from "../ContractEditorBase"
import { DEFAULT_STATE, type ContractState } from "../types"

type Entry = {
  id: number
  type: "prompt" | "response" | "error" | "patch"
  content: string
  timestamp: string
}

const PANEL_HEIGHT = 260

const SYSTEM_PROMPT = `You are a contract state console. You receive a JSON contract state and a prompt.

When asked to read/query: answer in plain English.
When asked to modify: apply the changes and explain what you did.

Return JSON:
{
  "response": "Plain English explanation",
  "patch": { ...partial ContractState fields to merge } or null
}

ContractState shape: { customer: {name, email}, currency, startDate, endDate, planLines: [{id, product, price, qty, startDate, endDate}], discount }`

export default function ConsolePanel() {
  const [state, setState] = useState<ContractState>(DEFAULT_STATE)
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<"console" | "state">("console")
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [entries, setEntries] = useState<Entry[]>([])
  const [copied, setCopied] = useState(false)
  const idRef = useRef(1)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [entries, open])

  function ts() {
    const d = new Date()
    return [d.getHours(), d.getMinutes(), d.getSeconds()]
      .map((n) => String(n).padStart(2, "0"))
      .join(":")
  }

  function push(type: Entry["type"], content: string) {
    setEntries((prev) => [...prev, { id: idRef.current++, type, content, timestamp: ts() }])
  }

  async function run() {
    if (!prompt.trim() || loading) return
    const p = prompt
    setPrompt("")
    push("prompt", p)
    setLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `${SYSTEM_PROMPT}\n\nCurrent state:\n${JSON.stringify(state, null, 2)}`,
            },
            { role: "user", content: p },
          ],
        }),
      })
      const data = await res.json()
      const parsed = JSON.parse(data.content ?? "{}") as {
        response?: string
        patch?: Partial<ContractState>
      }
      if (parsed.patch) {
        setState((s) => mergeState(s, parsed.patch!))
        push("patch", `Applied patch: ${Object.keys(parsed.patch).join(", ")}`)
      }
      push("response", parsed.response ?? "OK.")
    } catch (e) {
      push("error", String(e))
    }
    setLoading(false)
  }

  function copyState() {
    navigator.clipboard.writeText(JSON.stringify(state, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="relative h-full flex flex-col">
      {/* Explainer */}
      <div className="flex-shrink-0 bg-gray-900/5 border-b border-gray-200 px-6 py-2.5">
        <span className="text-xs text-gray-600">
          <strong>V5 · Console</strong> — Live contract state + a prompt console. Click the bar at
          the bottom or{" "}
          <button
            onClick={() => setOpen(true)}
            className="underline hover:no-underline"
          >
            open console
          </button>
          .
        </span>
      </div>

      {/* Editor, shrinks when console is open */}
      <div
        className="flex-1 overflow-hidden flex flex-col transition-all duration-200"
        style={{ paddingBottom: open ? PANEL_HEIGHT : 0 }}
      >
        <ContractEditorBase state={state} onChange={setState} />
      </div>

      {/* Console panel — fixed to bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-gray-950 flex flex-col border-t border-gray-700 transition-all duration-200"
        style={{ height: open ? PANEL_HEIGHT : 36 }}
      >
        {/* Header bar */}
        <div
          className="flex items-center justify-between px-4 h-9 border-b border-gray-800 cursor-pointer flex-shrink-0 select-none"
          onClick={() => setOpen((o) => !o)}
        >
          <div className="flex items-center gap-2">
            <Terminal size={12} className="text-green-400" />
            <span className="text-xs font-mono text-gray-400">contract.state</span>
            {!open && (
              <span className="text-[11px] text-gray-600 font-mono ml-2">
                {state.customer.name || "unnamed"} · {state.planLines.length} line
                {state.planLines.length !== 1 ? "s" : ""} · {state.currency}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {open && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setTab("console")
                  }}
                  className={`text-[11px] px-2 py-0.5 rounded transition-colors ${
                    tab === "console"
                      ? "bg-gray-700 text-gray-200"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  Console
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setTab("state")
                  }}
                  className={`text-[11px] px-2 py-0.5 rounded transition-colors ${
                    tab === "state"
                      ? "bg-gray-700 text-gray-200"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  State
                </button>
              </>
            )}
            {open ? (
              <ChevronDown size={12} className="text-gray-500" />
            ) : (
              <ChevronUp size={12} className="text-gray-500" />
            )}
          </div>
        </div>

        {/* Content */}
        {open && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {tab === "state" ? (
              <div className="flex-1 overflow-auto p-4 relative">
                <button
                  onClick={copyState}
                  className="absolute top-3 right-3 flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-gray-300 transition-colors bg-gray-800 border border-gray-700 rounded px-2 py-1"
                >
                  {copied ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
                  {copied ? "Copied" : "Copy"}
                </button>
                <pre className="text-xs font-mono text-green-400 leading-relaxed whitespace-pre-wrap">
                  {JSON.stringify(state, null, 2)}
                </pre>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-auto p-3 space-y-1 font-mono text-xs">
                  {entries.length === 0 && (
                    <div className="text-gray-600">
                      <span className="text-green-400">$</span> Ready. Try:{" "}
                      <button
                        className="text-gray-500 hover:text-gray-300 underline"
                        onClick={() => setPrompt("what's the total contract value?")}
                      >
                        what&apos;s the total contract value?
                      </button>
                    </div>
                  )}
                  {entries.map((e) => (
                    <div key={e.id} className="leading-relaxed">
                      <span className="text-gray-700 select-none">{e.timestamp} </span>
                      {e.type === "prompt" && (
                        <span className="text-blue-400">▶ {e.content}</span>
                      )}
                      {e.type === "response" && (
                        <span className="text-gray-300 whitespace-pre-wrap">{e.content}</span>
                      )}
                      {e.type === "patch" && (
                        <span className="text-yellow-400 italic">{e.content}</span>
                      )}
                      {e.type === "error" && (
                        <span className="text-red-400">{e.content}</span>
                      )}
                    </div>
                  ))}
                  {loading && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Loader2 size={10} className="animate-spin" />
                      <span>Processing…</span>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>
                <div className="flex items-center gap-2 border-t border-gray-800 px-3 py-2">
                  <span className="text-green-400 font-mono text-xs flex-shrink-0">$</span>
                  <input
                    className="flex-1 bg-transparent text-xs font-mono text-gray-200 outline-none placeholder-gray-600"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") run()
                    }}
                    placeholder="set discount to 20%, what's the total…"
                    disabled={loading}
                  />
                  <button
                    onClick={run}
                    disabled={!prompt.trim() || loading}
                    className="text-gray-500 hover:text-gray-300 disabled:opacity-30 transition-colors"
                  >
                    <Send size={12} />
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function mergeState(base: ContractState, patch: Partial<ContractState>): ContractState {
  const next = { ...base, ...patch }
  if (patch.customer) next.customer = { ...base.customer, ...patch.customer }
  return next
}
