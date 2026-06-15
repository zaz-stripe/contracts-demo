/**
 * Focus an element by selector, optionally selecting text for inputs
 */
export function focusElement(selector: string): void {
  if (typeof document === "undefined") return
  const el = document.querySelector<HTMLElement>(selector)
  if (!el) return
  el.focus()
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    try {
      el.select()
    } catch {
      // ignore selection errors for non-text inputs
    }
  }
}

/**
 * Translation function placeholder
 */
export const t = (key: string) => key
