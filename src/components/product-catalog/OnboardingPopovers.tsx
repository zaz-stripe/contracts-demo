'use client'

import type { RefObject } from "react"
import { useCallback, useEffect, useState } from "react"
import { createPortal } from "react-dom"

type OnboardingPopoversProps = {
  t: (key: string) => string
  showGetStarted: boolean
  onDismissGetStarted: () => void
  showNavHint: boolean
  onDismissNavHint: () => void
  hamburgerButtonRef?: RefObject<HTMLButtonElement | null>
  formAddButtonRef?: RefObject<HTMLButtonElement | null>
}

function useAnchorPosition(ref: RefObject<HTMLElement | null> | undefined, isVisible: boolean) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  const measure = useCallback(() => {
    if (!isVisible || !ref?.current) {
      setPos(null)
      return
    }
    const rect = ref.current.getBoundingClientRect()
    // Use the parent header bar's bottom for consistent vertical alignment across tooltips
    const headerBar = ref.current.parentElement
    const top = (headerBar ? headerBar.getBoundingClientRect().bottom : rect.bottom) - 8
    setPos({ top, left: rect.left + rect.width / 2 })
  }, [isVisible, ref])

  useEffect(() => {
    if (!isVisible) {
      setPos(null)
      return
    }
    // Poll until the anchor ref is populated. The target button may not be in
    // the DOM yet if the panel is still behind a skeleton screen (up to ~2s).
    const interval = setInterval(() => {
      if (ref?.current) {
        clearInterval(interval)
        measure()
      }
    }, 50)
    // Safety net: stop after 6 seconds
    const timeout = setTimeout(() => clearInterval(interval), 6000)
    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [isVisible, ref, measure])

  return pos
}

export function OnboardingPopovers({
  t,
  showGetStarted,
  onDismissGetStarted,
  showNavHint,
  onDismissNavHint,
  hamburgerButtonRef,
  formAddButtonRef,
}: OnboardingPopoversProps) {
  const _showGetStarted = false
  const _showNavHint = false
  const getStartedPos = useAnchorPosition(formAddButtonRef, _showGetStarted)
  const navHintPos = useAnchorPosition(hamburgerButtonRef, _showNavHint)

  // Dismiss "Get Started" on any click outside the popover
  useEffect(() => {
    if (!_showGetStarted) return
    const handler = () => onDismissGetStarted()
    // Delay listener to avoid immediate dismiss from the click that opened the modal
    const timer = setTimeout(() => document.addEventListener("click", handler), 300)
    return () => {
      clearTimeout(timer)
      document.removeEventListener("click", handler)
    }
  }, [showGetStarted, onDismissGetStarted])

  return (
    <>
      {/* "Get Started" popover — points to the + add button */}
      {_showGetStarted && getStartedPos && createPortal(
        <div
          className="fixed z-[9999]"
          style={{
            top: getStartedPos.top,
            // "+" button is near the right of the 320px form panel; popover starts 26px left of button center
            left: getStartedPos.left - 26,
          }}
        >
          {/* Arrow — center at 26px from left = center of the + button */}
          <div className="ml-[20px] h-0 w-0 border-x-[6px] border-b-[6px] border-x-transparent border-b-[#1A1F2E]" />
          <div className="w-[253px] rounded-[8px] bg-[#1A1F2E] px-[16px] py-[12px] shadow-[0_15px_35px_rgba(48,49,61,0.08),0_5px_15px_rgba(0,0,0,0.12)]">
            <p className="text-[14px] font-[500] leading-[20px] tracking-[-0.15px] text-[#C9CED8]">
              {t("Get started")}
            </p>
            <p className="mt-[2px] text-[12px] font-[400] leading-[16px] text-[#C9CED8]">
              {t("Add your first item to your pricing plan.")}
            </p>
            <button
              type="button"
              className="mt-[8px] flex h-[28px] items-center rounded-[6px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.08)] px-[10px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#C9CED8] transition-colors hover:bg-[rgba(255,255,255,0.14)]"
              onClick={onDismissGetStarted}
            >
              {t("Got it")}
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* "Pricing Plan Navigation" popover — points to hamburger, shown after second item added (if nav not yet opened) */}
      {_showNavHint && navHintPos && createPortal(
        <div
          className="fixed z-[9999]"
          style={{
            top: navHintPos.top,
            // hamburger center is ~26px from panel left; popover left at ~5px → subtract 21px
            left: navHintPos.left - 21,
          }}
        >
          {/* Arrow — center at 21px from left = center of the hamburger button */}
          <div className="ml-[15px] h-0 w-0 border-x-[6px] border-b-[6px] border-x-transparent border-b-[#1A1F2E]" />
          <div className="w-[253px] rounded-[8px] bg-[#1A1F2E] px-[16px] py-[12px] shadow-[0_15px_35px_rgba(48,49,61,0.08),0_5px_15px_rgba(0,0,0,0.12)]">
            <p className="text-[14px] font-[500] leading-[20px] tracking-[-0.15px] text-[#C9CED8]">
              {t("Pricing plan navigation")}
            </p>
            <p className="mt-[2px] text-[12px] font-[400] leading-[16px] text-[#C9CED8]">
              {t("Open the side nav at any time to see everything in your pricing plan.")}
            </p>
            <button
              type="button"
              className="mt-[8px] flex h-[28px] items-center rounded-[6px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.08)] px-[10px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#C9CED8] transition-colors hover:bg-[rgba(255,255,255,0.14)]"
              onClick={onDismissNavHint}
            >
              {t("Got it")}
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
