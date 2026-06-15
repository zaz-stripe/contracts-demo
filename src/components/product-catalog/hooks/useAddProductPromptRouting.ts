'use client'

import { useCallback, useEffect, useState } from "react"

type Target = "product" | "plan"

export function useAddProductPromptRouting(opts: {
  isPopoverOpen: boolean
  setIsPopoverOpen: (next: boolean) => void

  onOpenCreateModal: () => void
  onOpenPricingPlanModal: () => void

  setIsAssistantOpen: (next: boolean) => void
  setAssistantSeedPrompt: (next: string | null) => void
  setIsPlanAssistantOpen: (next: boolean) => void
  setPlanAssistantSeedPrompt: (next: string | null) => void
}) {
  const {
    isPopoverOpen,
    setIsPopoverOpen,
    onOpenCreateModal,
    onOpenPricingPlanModal,
    setIsAssistantOpen,
    setAssistantSeedPrompt,
    setIsPlanAssistantOpen,
    setPlanAssistantSeedPrompt,
  } = opts

  const [promptMode, setPromptMode] = useState(false)
  const [promptText, setPromptText] = useState("")
  const [isRoutingPrompt, setIsRoutingPrompt] = useState(false)

  // Match prior behavior: whenever popover closes, reset prompt UI.
  useEffect(() => {
    if (isPopoverOpen) return
    setPromptMode(false)
    setPromptText("")
    setIsRoutingPrompt(false)
  }, [isPopoverOpen])

  const classifyPromptTarget = useCallback(async (prompt: string): Promise<Target> => {
    const trimmed = prompt.trim()
    if (!trimmed) return "product"

    const normalized = trimmed.toLowerCase()
    const compact = normalized.replace(/[^a-z0-9]/g, "")

    const heuristic: Target = (() => {
      if (compact.includes("pricingplan") || compact.includes("ratecard") || compact.includes("ratecards")) return "plan"
      if (compact.includes("aimodel") || compact.includes("aimodels") || compact.includes("multiplemodels")) return "plan"
      if (compact.includes("anthropic") || compact.includes("openai") || compact.includes("gemini") || compact.includes("claude")) return "plan"
      if (compact.includes("creditgrant") || compact.includes("subscriptionfee") || compact.includes("subscriptionfee")) return "plan"
      return "product"
    })()

    const hasStrongPlanSignal =
      heuristic === "plan" &&
      (compact.includes("ratecard") ||
        compact.includes("ratecards") ||
        compact.includes("pricingplan") ||
        compact.includes("anthropic") ||
        compact.includes("openai") ||
        compact.includes("gemini") ||
        compact.includes("claude") ||
        compact.includes("aimodels"))

    // If it's obviously a pricing plan request, don't risk mis-routing with an LLM call.
    if (hasStrongPlanSignal) return "plan"

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                'You are a router for a Stripe billing setup UI. Decide whether the user prompt is primarily about creating a SINGLE product/price/meter ("product") or configuring a pricing plan with rate cards/rates/credits ("plan"). Respond ONLY as JSON: {"target":"product"|"plan"}.',
            },
            { role: "user", content: trimmed },
          ],
        }),
      })
      const data = (await res.json().catch(() => null)) as { content?: string } | null
      const raw = typeof data?.content === "string" ? data.content : ""
      const parsed = JSON.parse(raw) as { target?: unknown }
      const target = typeof parsed?.target === "string" ? parsed.target : ""
      if (target === "product" || target === "plan") {
        // Guardrail: if the LLM says product but the prompt clearly indicates plan, prefer plan.
        if (target === "product" && hasStrongPlanSignal) return "plan"
        return target
      }
      return heuristic
    } catch {
      return heuristic
    }
  }, [])

  const startWithPrompt = useCallback(async () => {
    const prompt = promptText.trim()
    if (!prompt) return
    if (isRoutingPrompt) return
    setIsRoutingPrompt(true)
    try {
      const target = await classifyPromptTarget(prompt)
      setIsPopoverOpen(false)
      setPromptMode(false)
      setPromptText("")

      if (target === "plan") {
        onOpenPricingPlanModal()
        setIsPlanAssistantOpen(true)
        setPlanAssistantSeedPrompt(prompt)
        return
      }

      onOpenCreateModal()
      setIsAssistantOpen(true)
      setAssistantSeedPrompt(prompt)
    } finally {
      setIsRoutingPrompt(false)
    }
  }, [
    classifyPromptTarget,
    isRoutingPrompt,
    onOpenCreateModal,
    onOpenPricingPlanModal,
    promptText,
    setAssistantSeedPrompt,
    setIsAssistantOpen,
    setIsPlanAssistantOpen,
    setIsPopoverOpen,
    setPlanAssistantSeedPrompt,
  ])

  return {
    promptMode,
    setPromptMode,
    promptText,
    setPromptText,
    isRoutingPrompt,
    startWithPrompt,
  }
}



