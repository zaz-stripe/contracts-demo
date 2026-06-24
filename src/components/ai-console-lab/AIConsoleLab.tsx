"use client"

import { useState } from "react"
import VariantSwitcher from "./VariantSwitcher"
import InlineGhosting from "./variants/InlineGhosting"
import CommandBar from "./variants/CommandBar"
import SidePanelChat from "./variants/SidePanelChat"
import GuidedNegotiation from "./variants/GuidedNegotiation"
import ConsolePanel from "./variants/ConsolePanel"
import { type AIVariant } from "./types"

export default function AIConsoleLab() {
  const [variant, setVariant] = useState<AIVariant>("inline-ghosting")

  return (
    <div
      className="h-screen flex flex-col bg-white"
      style={{
        fontFamily:
          '"SF Pro Text", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <header className="h-12 border-b border-gray-200 bg-white flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <a href="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            ← Back
          </a>
          <span className="text-gray-200">|</span>
          <h1 className="text-sm font-semibold text-gray-900">AI Console Lab</h1>
          <span className="text-gray-300">·</span>
          <span className="text-xs text-gray-400">New contract</span>
        </div>
        <VariantSwitcher current={variant} onChange={setVariant} />
      </header>

      <div className="flex-1 overflow-hidden relative">
        {variant === "inline-ghosting" && <InlineGhosting />}
        {variant === "command-bar" && <CommandBar />}
        {variant === "side-panel-chat" && <SidePanelChat />}
        {variant === "guided-negotiation" && <GuidedNegotiation />}
        {variant === "console-panel" && <ConsolePanel />}
      </div>
    </div>
  )
}
