"use client"

import { useState, useRef, useEffect } from "react"
import { Sparkles, X, Send, Loader2, RotateCcw } from "lucide-react"
import ContractEditorBase from "../ContractEditorBase"
import {
  DEFAULT_STATE,
  formatCurrency,
  contractTotal,
  type ContractState,
} from "../types"

type Message = {
  id: number
  role: "user" | "assistant"
  content: string
}

type Action =
  | { type: "set_field"; path: string; value: string | number }
  | { type: "add_line"; product: string; price: number; qty: number; startDate: string; endDate: string }
  | { type: "remove_line"; id: string }
  | { type: "update_line"; id: string; field: string; value: string | number }

const buildSystem = (state: ContractState) => `You are a Stripe contracts assistant helping configure enterprise deals.

Current contract:
${JSON.stringify(state, null, 2)}

You can answer questions AND make changes. When making changes, include an "actions" array.
Return JSON: {
  "message": "Plain English explanation (1-3 sentences)",
  "actions": [
    {"type": "set_field", "path": "customer.name", "value": "..."},
    {"type": "set_field", "path": "discount", "value": 15},
    {"type": "add_line", "product": "...", "price": 5000, "qty": 1, "startDate": "...", "endDate": "..."},
    {"type": "update_line", "id": "...", "field": "price", "value": 8000},
    {"type": "remove_line", "id": "..."}
  ]
}
If no changes needed, return empty actions array.`

const STARTERS = [
  "What's the total contract value?",
  "Add an Enterprise plan at $10k/mo for 100 seats",
  "What discount is typical for a 2-year deal?",
  "Set customer to Acme Corp, billing@example.com",
]

export default function SidePanelChat() {
  const [state, setState] = useState<ContractState>(DEFAULT_STATE)
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const idRef = useRef(1)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  async function send() {
    if (!input.trim() || loading) return
    const userMsg: Message = { id: idRef.current++, role: "user", content: input }
    const history = [...messages, userMsg]
    setMessages(history)
    setInput("")
    setLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: buildSystem(state) },
            ...history.map((m) => ({ role: m.role, content: m.content })),
          ],
        }),
      })
      const data = await res.json()
      const parsed = JSON.parse(data.content ?? "{}") as {
        message?: string
        actions?: Action[]
      }
      if (parsed.actions?.length) applyActions(parsed.actions)
      setMessages((prev) => [
        ...prev,
        { id: idRef.current++, role: "assistant", content: parsed.message ?? "Done." },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: idRef.current++, role: "assistant", content: "Something went wrong." },
      ])
    }
    setLoading(false)
  }

  function applyActions(actions: Action[]) {
    setState((prev) => {
      let next = { ...prev }
      for (const action of actions) {
        if (action.type === "set_field") {
          const parts = action.path.split(".")
          if (parts[0] === "customer") {
            next = { ...next, customer: { ...next.customer, [parts[1]]: String(action.value) } }
          } else if (action.path === "discount") {
            next = { ...next, discount: Number(action.value) }
          } else if (["currency", "startDate", "endDate"].includes(action.path)) {
            next = { ...next, [action.path]: String(action.value) }
          }
        } else if (action.type === "add_line") {
          next = {
            ...next,
            planLines: [
              ...next.planLines,
              {
                id: crypto.randomUUID(),
                product: action.product,
                price: action.price,
                qty: action.qty,
                startDate: action.startDate,
                endDate: action.endDate,
              },
            ],
          }
        } else if (action.type === "update_line") {
          next = {
            ...next,
            planLines: next.planLines.map((l) =>
              l.id === action.id ? { ...l, [action.field]: action.value } : l
            ),
          }
        } else if (action.type === "remove_line") {
          next = {
            ...next,
            planLines: next.planLines.filter((l) => l.id !== action.id),
          }
        }
      }
      return next
    })
  }

  const total = contractTotal(state)

  return (
    <div className="relative h-full flex flex-col">
      {/* Explainer */}
      <div className="flex-shrink-0 bg-blue-50 border-b border-blue-100 px-6 py-2.5 flex items-center justify-between">
        <span className="text-xs text-blue-700">
          <strong>V3 · Side panel chat</strong> — Contract-aware assistant. Ask questions or give
          instructions to update the form.
        </span>
        {!open && (
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 bg-white border border-blue-200 rounded-full px-3 py-1 shadow-sm"
          >
            <Sparkles size={11} />
            Open assistant
          </button>
        )}
      </div>

      <div className={`flex-1 flex overflow-hidden`}>
        {/* Editor */}
        <div className={`flex flex-col transition-all duration-200 ${open ? "flex-1" : "w-full"}`}>
          <ContractEditorBase state={state} onChange={setState} />
        </div>

        {/* Panel */}
        {open && (
          <div className="w-80 flex-shrink-0 border-l border-gray-200 bg-white flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Sparkles size={13} className="text-blue-500" />
                <span className="text-sm font-semibold text-gray-800">Assistant</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  {formatCurrency(total, state.currency)}
                </span>
                <button
                  onClick={() => {
                    setMessages([])
                    setInput("")
                  }}
                  className="text-gray-300 hover:text-gray-500"
                  title="Clear chat"
                >
                  <RotateCcw size={13} />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="text-gray-300 hover:text-gray-500 ml-1"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-400 font-medium">Try asking:</p>
                  {STARTERS.map((s) => (
                    <button
                      key={s}
                      className="block w-full text-left text-xs text-gray-600 hover:bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 transition-colors"
                      onClick={() => setInput(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                      m.role === "user"
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-xl px-3 py-2.5">
                    <Loader2 size={12} className="animate-spin text-gray-400" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="p-3 border-t border-gray-100">
              <div className="flex items-end gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-200 focus-within:border-blue-300 transition-colors">
                <textarea
                  ref={textareaRef}
                  className="flex-1 text-xs bg-transparent outline-none resize-none placeholder-gray-400 min-h-[28px] max-h-24 leading-relaxed"
                  placeholder="Ask about this contract…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      send()
                    }
                  }}
                  rows={1}
                />
                <button
                  onClick={send}
                  disabled={!input.trim() || loading}
                  className="text-blue-500 hover:text-blue-700 disabled:text-gray-300 transition-colors flex-shrink-0"
                >
                  <Send size={13} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating trigger when closed */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="absolute bottom-6 right-6 flex items-center gap-2 bg-gray-900 text-white text-xs font-medium px-4 py-2.5 rounded-full shadow-lg hover:bg-gray-800 transition-colors"
        >
          <Sparkles size={13} />
          Ask assistant
        </button>
      )}
    </div>
  )
}
