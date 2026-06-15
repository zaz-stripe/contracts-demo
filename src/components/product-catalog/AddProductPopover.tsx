'use client'

import type { RefObject } from "react"
import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

import { AiSparkleIcon, PricingPlanIcon, SingleProductIcon } from "@/components/ProductCatalogIcons"
import { cn } from "@/lib/utils"

export type PopoverPosition = { top: number; left: number }

type PromptStarter = {
  id: string
  label: string
  prompt: string
}

const PROMPT_STARTERS: PromptStarter[] = [
  {
    id: "ai-saas-multi-model",
    label: "AI app with monthly fee + usage",
    prompt:
      "Create a pricing plan for an AI SaaS product that charges a $99/month platform fee plus usage-based pricing per model.\n\nInclude rates for:\n- Gemini 2.0 Flash\n- GPT-4o\n- Claude 3.5 Sonnet\n\nUsage should be priced per 1M tokens with volume discounts (graduated tiers). Use clear names/lookup keys and sensible default tier thresholds (e.g. 1M / 10M / 100M).",
  },
  {
    id: "api-payg-graduated",
    label: "Pay-as-you-go API pricing",
    prompt:
      "Create a pay-as-you-go developer API pricing plan with no base fee.\n\nBill per request with graduated tiers:\n- First 1,000,000 requests: $0.005 per request\n- Next 9,000,000: $0.003 per request\n- Over 10,000,000: $0.001 per request\n\nUse clear names and make sure price modelling is enabled.",
  },
  {
    id: "credits-plus-overage",
    label: "Monthly credits + overage",
    prompt:
      "Create a credits-based pricing plan:\n- $200/month subscription\n- Includes a monthly credit grant of $100 in usage credits (expires monthly)\n- Overage usage is billed at $0.01 per unit\n\nName the credit grant and usage rate clearly and make the preview total make sense.",
  },
]

type AddProductPopoverProps = {
  t: (key: string) => string
  position: PopoverPosition
  popoverRef: RefObject<HTMLDivElement | null>
  promptRef: RefObject<HTMLTextAreaElement | null>

  isPromptMode: boolean
  promptText: string
  isRoutingPrompt: boolean

  onChangePromptText: (next: string) => void
  onCancelPromptMode: () => void
  onEnterPromptMode: () => void
  onSendPrompt: () => void
  onCreateSingleProduct: () => void
  onCreatePricingPlan: () => void
}

export function AddProductPopover({
  t,
  position,
  popoverRef,
  promptRef,
  isPromptMode,
  promptText,
  isRoutingPrompt,
  onChangePromptText,
  onCancelPromptMode,
  onEnterPromptMode,
  onSendPrompt,
  onCreateSingleProduct,
  onCreatePricingPlan,
}: AddProductPopoverProps) {
  const [isPromptStartersOpen, setIsPromptStartersOpen] = useState(false)
  const promptStartersButtonRef = useRef<HTMLButtonElement | null>(null)
  const promptStartersPopoverRef = useRef<HTMLDivElement | null>(null)
  const [viewportClampOffset, setViewportClampOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  // Close the starters popover when clicking elsewhere (inside or outside the parent popover).
  useEffect(() => {
    if (!isPromptStartersOpen) return
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (promptStartersPopoverRef.current?.contains(target)) return
      if (promptStartersButtonRef.current?.contains(target)) return
      setIsPromptStartersOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [isPromptStartersOpen])

  // Reset internal state when exiting prompt mode.
  useEffect(() => {
    if (!isPromptMode && isPromptStartersOpen) setIsPromptStartersOpen(false)
  }, [isPromptMode, isPromptStartersOpen])

  // Reset the viewport clamp offset when position or prompt mode changes so we recalculate from fresh.
  const prevPositionRef = useRef({ top: position.top, left: position.left, isPromptMode })
  useEffect(() => {
    const prev = prevPositionRef.current
    if (prev.top !== position.top || prev.left !== position.left || prev.isPromptMode !== isPromptMode) {
      setViewportClampOffset({ x: 0, y: 0 })
      prevPositionRef.current = { top: position.top, left: position.left, isPromptMode }
    }
  }, [position.top, position.left, isPromptMode])

  // Final safety clamp: ensure the popover is fully visible in the viewport even if the caller's
  // anchor math is slightly off (e.g. due to scrollbars, zoom, or surrounding panels).
  useLayoutEffect(() => {
    const el = popoverRef.current
    if (!el) return

    const margin = 16
    const viewportW = typeof document !== "undefined" ? document.documentElement.clientWidth : 1440
    const viewportH = typeof document !== "undefined" ? document.documentElement.clientHeight : 900

    const r = el.getBoundingClientRect()
    // Compute *additional* adjustment needed from the CURRENT position (which already includes
    // any existing clamp translate). Then add it to the stored clamp offset so we don't oscillate.
    let addX = 0
    let addY = 0

    // Clamp horizontally.
    const overflowRight = r.right - (viewportW - margin)
    if (overflowRight > 0) addX -= overflowRight
    const overflowLeft = margin - (r.left + addX)
    if (overflowLeft > 0) addX += overflowLeft

    // Clamp vertically.
    const overflowBottom = r.bottom - (viewportH - margin)
    if (overflowBottom > 0) addY -= overflowBottom
    const overflowTop = margin - (r.top + addY)
    if (overflowTop > 0) addY += overflowTop

    // Snap tiny adjustments to 0 to avoid sub-pixel jitter.
    if (Math.abs(addX) < 0.5) addX = 0
    if (Math.abs(addY) < 0.5) addY = 0

    const nextX = Math.round((viewportClampOffset.x + addX) * 2) / 2
    const nextY = Math.round((viewportClampOffset.y + addY) * 2) / 2

    if (nextX !== viewportClampOffset.x || nextY !== viewportClampOffset.y) {
      setViewportClampOffset({ x: nextX, y: nextY })
    }
  }, [isPromptMode, position.top, position.left, viewportClampOffset.x, viewportClampOffset.y])

  const content = (
    <div
      ref={popoverRef}
      className={cn(
        "fixed z-50 w-[320px] rounded-[12px] bg-white shadow-[0px_15px_35px_0px_rgba(48,49,61,0.08),0px_5px_15px_0px_rgba(0,0,0,0.12)]",
        isPromptMode ? "border border-[#EBEEF1] px-3 py-2" : "p-[12px]"
      )}
      style={{
        top: position.top,
        left: position.left,
        transform:
          viewportClampOffset.x !== 0 || viewportClampOffset.y !== 0
            ? `translate(${viewportClampOffset.x}px, ${viewportClampOffset.y}px)`
            : undefined,
      }}
    >
      <div className={isPromptMode ? "flex h-[180px] flex-col" : "flex flex-col gap-[12px]"}>
        {isPromptMode ? (
          <>
            <textarea
              ref={promptRef}
              className="w-full flex-1 resize-none bg-transparent text-[13px] font-[500] text-[#353A44] placeholder:text-[#818DA0] outline-none"
              placeholder={t("Ask the assistant…")}
              value={promptText}
              onChange={(e) => onChangePromptText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  onSendPrompt()
                }
              }}
            />
            <div className="flex items-center justify-between gap-2 pt-2">
              <div className="relative">
                <button
                  ref={promptStartersButtonRef}
                  type="button"
                  className={cn(
                    "inline-flex items-center rounded-[6px] border border-[#D8DEE4] bg-white px-3 py-[6px]",
                    "text-[13px] font-[500] text-[#353A44] shadow-[0_1px_1px_rgba(33,37,44,0.16)]",
                    "hover:bg-[#F5F6F8] transition-colors",
                    isPromptStartersOpen && "bg-[#F5F6F8]"
                  )}
                  aria-haspopup="menu"
                  aria-expanded={isPromptStartersOpen}
                  onClick={() => setIsPromptStartersOpen((prev) => !prev)}
                >
                  {t("Prompt starters")}
                </button>

                {isPromptStartersOpen ? (
                  <div
                    ref={promptStartersPopoverRef}
                    role="menu"
                    aria-label={t("Prompt starters")}
                    className={cn(
                      // Open downward so it doesn't escape above the viewport (the anchored popover is near the top).
                      "absolute left-0 top-[40px] z-50",
                      "w-max overflow-hidden rounded-[10px] border border-[#EBEEF1] bg-white",
                      "shadow-[0px_15px_35px_0px_rgba(48,49,61,0.08),0px_5px_15px_0px_rgba(0,0,0,0.12)]"
                    )}
                  >
                    <div className="max-h-[260px] overflow-y-auto p-2">
                      {PROMPT_STARTERS.map((starter) => (
                        <button
                          key={starter.id}
                          type="button"
                          role="menuitem"
                          className={cn(
                            "flex w-full items-center rounded-[8px] px-3 py-2 text-left",
                            "text-[13px] font-[500] leading-[18px] tracking-[-0.024px] text-[#353A44]",
                            "hover:bg-[#F5F6F8] transition-colors"
                          )}
                          title={starter.label}
                          onClick={() => {
                            onChangePromptText(starter.prompt)
                            setIsPromptStartersOpen(false)
                            // Focus input and put cursor at end so the user can quickly tweak.
                            window.requestAnimationFrame(() => {
                              const el = promptRef.current
                              el?.focus()
                              try {
                                el?.setSelectionRange(starter.prompt.length, starter.prompt.length)
                              } catch {
                                // ignore selection errors
                              }
                            })
                          }}
                        >
                          <span className="truncate">{starter.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  className="rounded-[6px] px-3 py-[6px] text-[13px] font-[500] text-[#353A44] hover:bg-[#F5F6F8] transition-colors"
                  onClick={onCancelPromptMode}
                >
                  {t("Cancel")}
                </button>
                <button
                  type="button"
                  className="rounded-[6px] bg-[#675DFF] px-3 py-[6px] text-[13px] font-[500] text-white shadow-[0_1px_1px_rgba(47,14,99,0.32)] hover:bg-[#5B52F0] transition-colors disabled:opacity-50"
                  disabled={promptText.trim() === "" || isRoutingPrompt}
                  onClick={onSendPrompt}
                >
                  {isRoutingPrompt ? t("Starting…") : t("Send")}
                </button>
              </div>
            </div>
          </>
        ) : null}

        {!isPromptMode ? (
          <>
            <button
              type="button"
              className="flex items-center gap-[12px] rounded-[6px] p-[4px] hover:bg-[#F5F6F8] transition-colors"
              onClick={onCreateSingleProduct}
            >
              <div className="flex h-[44px] w-[44px] items-center justify-center rounded-[6px] bg-[#F5F6F8]">
                <SingleProductIcon />
              </div>
              <div className="flex flex-col items-start gap-[2px] text-left">
                <span className="text-[14px] font-[500] leading-[16px] tracking-[-0.028px] text-[#353A44]">
                  {t("Product or service")}
                </span>
                <span className="text-[12px] font-[400] leading-[16px] tracking-[-0.024px] text-[#353A44]">
                  {t("Sell a physical or digital product.")}
                </span>
              </div>
            </button>
            <button
              type="button"
              className="flex items-center gap-[12px] rounded-[6px] p-[4px] hover:bg-[#F5F6F8] transition-colors"
              onClick={onCreatePricingPlan}
              data-coachmark="add-plan"
            >
              <div className="flex h-[44px] w-[44px] items-center justify-center rounded-[6px] bg-[#F5F6F8]">
                <PricingPlanIcon />
              </div>
              <div className="flex flex-col items-start gap-[2px] text-left">
                <span className="text-[14px] font-[500] leading-[16px] tracking-[-0.028px] text-[#353A44]">
                  {t("Pricing plan")}
                </span>
                <span className="text-[12px] font-[400] leading-[16px] tracking-[-0.024px] text-[#353A44]">
                  {t("Usage-based or tiered billing model.")}
                </span>
              </div>
            </button>
            <button
              type="button"
              className="flex items-center gap-[12px] rounded-[6px] p-[4px] hover:bg-[#F5F6F8] transition-colors"
              onClick={onEnterPromptMode}
            >
              <div className="flex h-[44px] w-[44px] items-center justify-center rounded-[6px] bg-[#F5F6F8]">
                <AiSparkleIcon />
              </div>
              <div className="flex flex-col items-start gap-[2px] text-left">
                <span className="text-[14px] font-[500] leading-[16px] tracking-[-0.028px] text-[#353A44]">
                  {t("Start with a prompt")}
                </span>
                <span className="text-[12px] font-[400] leading-[16px] tracking-[-0.024px] text-[#353A44]">
                  {t("Draft a setup with Stripe Assistant.")}
                </span>
              </div>
            </button>
          </>
        ) : null}
      </div>
    </div>
  )

  // Portal to body so the popover can't be clipped by parent overflow/stacking contexts.
  return typeof document !== "undefined" ? createPortal(content, document.body) : null
}


