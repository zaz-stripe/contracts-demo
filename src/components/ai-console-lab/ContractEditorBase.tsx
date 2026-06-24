"use client"

import { Plus, Trash2 } from "lucide-react"
import {
  type ContractState,
  type PlanLine,
  PRODUCTS,
  CURRENCIES,
  monthsBetween,
  formatCurrency,
  contractTotal,
} from "./types"

export interface GhostSuggestions {
  [fieldId: string]: string
}

interface Props {
  state: ContractState
  onChange: (state: ContractState) => void
  ghostSuggestions?: GhostSuggestions
  activeGhostField?: string
  onFieldFocus?: (fieldId: string, currentValue: string) => void
  onFieldBlur?: (fieldId: string) => void
  onAcceptGhost?: (fieldId: string) => void
}

export default function ContractEditorBase({
  state,
  onChange,
  ghostSuggestions = {},
  activeGhostField,
  onFieldFocus,
  onFieldBlur,
  onAcceptGhost,
}: Props) {
  function updateCustomer(field: keyof typeof state.customer, value: string) {
    onChange({ ...state, customer: { ...state.customer, [field]: value } })
  }

  function updateLine(id: string, field: keyof PlanLine, value: string | number) {
    onChange({
      ...state,
      planLines: state.planLines.map((l) =>
        l.id === id ? { ...l, [field]: value } : l
      ),
    })
  }

  function addLine() {
    const line: PlanLine = {
      id: crypto.randomUUID(),
      product: "",
      price: 0,
      qty: 1,
      startDate: state.startDate,
      endDate: state.endDate,
    }
    onChange({ ...state, planLines: [...state.planLines, line] })
  }

  function removeLine(id: string) {
    onChange({ ...state, planLines: state.planLines.filter((l) => l.id !== id) })
  }

  const total = contractTotal(state)

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-2xl mx-auto py-10 px-8 space-y-8">
        {/* Customer */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Customer
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <GhostField
              label="Name"
              fieldId="customer.name"
              value={state.customer.name}
              onChange={(v) => updateCustomer("name", v)}
              placeholder="Acme Corporation"
              ghost={ghostSuggestions["customer.name"]}
              isActive={activeGhostField === "customer.name"}
              onFocus={onFieldFocus}
              onBlur={onFieldBlur}
              onAccept={onAcceptGhost}
            />
            <GhostField
              label="Email"
              fieldId="customer.email"
              value={state.customer.email}
              onChange={(v) => updateCustomer("email", v)}
              placeholder="billing@example.com"
              ghost={ghostSuggestions["customer.email"]}
              isActive={activeGhostField === "customer.email"}
              onFocus={onFieldFocus}
              onBlur={onFieldBlur}
              onAccept={onAcceptGhost}
            />
          </div>
        </section>

        {/* Contract terms */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Contract terms
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Currency</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                value={state.currency}
                onChange={(e) => onChange({ ...state, currency: e.target.value })}
              >
                {CURRENCIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <GhostField
              label="Start date"
              fieldId="startDate"
              type="date"
              value={state.startDate}
              onChange={(v) => onChange({ ...state, startDate: v })}
              ghost={ghostSuggestions["startDate"]}
              isActive={activeGhostField === "startDate"}
              onFocus={onFieldFocus}
              onBlur={onFieldBlur}
              onAccept={onAcceptGhost}
            />
            <GhostField
              label="End date"
              fieldId="endDate"
              type="date"
              value={state.endDate}
              onChange={(v) => onChange({ ...state, endDate: v })}
              ghost={ghostSuggestions["endDate"]}
              isActive={activeGhostField === "endDate"}
              onFocus={onFieldFocus}
              onBlur={onFieldBlur}
              onAccept={onAcceptGhost}
            />
          </div>
        </section>

        {/* Plan lines */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              Plan lines
            </h2>
            <button
              onClick={addLine}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              <Plus size={12} />
              Add line
            </button>
          </div>
          <div className="space-y-3">
            {state.planLines.map((line) => (
              <div
                key={line.id}
                className="rounded-lg border border-gray-100 bg-gray-50 p-4"
              >
                <div className="flex gap-3">
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5">Product</label>
                      <input
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                        value={line.product}
                        onChange={(e) => updateLine(line.id, "product", e.target.value)}
                        placeholder="Product name"
                        list={`products-${line.id}`}
                      />
                      <datalist id={`products-${line.id}`}>
                        {PRODUCTS.map((p) => (
                          <option key={p} value={p} />
                        ))}
                      </datalist>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1.5">$/mo</label>
                        <input
                          type="number"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                          value={line.price}
                          onChange={(e) => updateLine(line.id, "price", Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1.5">Qty</label>
                        <input
                          type="number"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                          value={line.qty}
                          onChange={(e) => updateLine(line.id, "qty", Number(e.target.value))}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5">Start date</label>
                      <input
                        type="date"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                        value={line.startDate}
                        onChange={(e) => updateLine(line.id, "startDate", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5">End date</label>
                      <input
                        type="date"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                        value={line.endDate}
                        onChange={(e) => updateLine(line.id, "endDate", e.target.value)}
                      />
                    </div>
                  </div>
                  {state.planLines.length > 1 && (
                    <button
                      onClick={() => removeLine(line.id)}
                      className="self-start mt-6 text-gray-300 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="mt-3 text-right text-xs text-gray-400">
                  {formatCurrency(
                    line.price * line.qty * monthsBetween(line.startDate, line.endDate),
                    state.currency
                  )}{" "}
                  total
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Discount + total */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              Discount
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={0}
              max={100}
              className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              value={state.discount}
              onChange={(e) => onChange({ ...state, discount: Number(e.target.value) })}
            />
            <span className="text-sm text-gray-500">%</span>
          </div>
        </section>

        {/* Total */}
        <div className="flex items-center justify-between py-4 border-t border-gray-200">
          <span className="text-sm text-gray-500">Estimated contract value</span>
          <span className="text-2xl font-semibold text-gray-900">
            {formatCurrency(total, state.currency)}
          </span>
        </div>
      </div>
    </div>
  )
}

function GhostField({
  label,
  fieldId,
  value,
  onChange,
  type = "text",
  placeholder,
  ghost,
  isActive,
  onFocus,
  onBlur,
  onAccept,
}: {
  label: string
  fieldId: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  ghost?: string
  isActive?: boolean
  onFocus?: (fieldId: string, value: string) => void
  onBlur?: (fieldId: string) => void
  onAccept?: (fieldId: string) => void
}) {
  const showGhost = isActive && ghost

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Tab" && showGhost && onAccept) {
      e.preventDefault()
      onAccept(fieldId)
    }
  }

  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={type}
          className={`w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors ${
            showGhost ? "border-blue-400" : "border-gray-200 focus:border-blue-400"
          }`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => onFocus?.(fieldId, value)}
          onBlur={() => setTimeout(() => onBlur?.(fieldId), 150)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
        />
        {showGhost && type === "text" && (
          <div className="absolute inset-0 px-3 py-2 text-sm pointer-events-none flex items-center">
            <span className="invisible whitespace-pre">{value}</span>
            <span className="text-gray-400">{ghost.slice(value.length)}</span>
            <span className="ml-2 text-[10px] text-gray-300 border border-gray-200 rounded px-1 py-0.5 bg-white">
              Tab ↹
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
