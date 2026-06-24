"use client"

import { useState } from "react"
import { ChevronDown, Check } from "lucide-react"
import { VARIANTS, type AIVariant } from "./types"

interface Props {
  current: AIVariant
  onChange: (v: AIVariant) => void
}

export default function VariantSwitcher({ current, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const active = VARIANTS.find((v) => v.id === current)!

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 h-8 bg-white border border-gray-200 rounded-full pl-2.5 pr-3 text-xs text-gray-700 hover:border-gray-300 shadow-sm transition-colors"
      >
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-900 text-white text-[10px] font-semibold flex-shrink-0">
          {active.badge}
        </span>
        <span className="font-medium">{active.label}</span>
        <ChevronDown size={11} className="text-gray-400 ml-0.5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 z-50 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden w-64">
            <div className="px-3 py-2 border-b border-gray-100">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                AI mode
              </p>
            </div>
            {VARIANTS.map((v, i) => (
              <button
                key={v.id}
                onClick={() => {
                  onChange(v.id)
                  setOpen(false)
                }}
                className={`w-full text-left px-3 py-2.5 flex items-start gap-3 hover:bg-gray-50 transition-colors ${
                  i > 0 ? "border-t border-gray-50" : ""
                } ${current === v.id ? "bg-blue-50/60" : ""}`}
              >
                <span
                  className={`mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-semibold flex-shrink-0 ${
                    current === v.id
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {v.badge}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm font-medium ${
                        current === v.id ? "text-blue-600" : "text-gray-800"
                      }`}
                    >
                      {v.label}
                    </span>
                    {current === v.id && (
                      <Check size={12} className="text-blue-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 leading-snug">
                    {v.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
