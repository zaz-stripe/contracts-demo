'use client'

import type { ReactNode } from "react"
import { FORM_LABEL_TEXT_CLASSES } from "@/components/formStyles"

type FormRowProps = {
  label?: string
  /** @deprecated Helper text is now shown in the field description bar */
  helperText?: ReactNode
  /** Contextual hint shown below the label during first-time setup. */
  hint?: ReactNode
  /** URL for a "Docs" link shown next to the label. */
  docsUrl?: string
  /** Optional action element rendered next to the label (e.g. a link). */
  labelAction?: ReactNode
  /**
   * Layout for the row:
   * - inline: label on the left, control area on the right (default)
   * - stacked: label on top, control area below
   */
  layout?: "inline" | "stacked"
  /**
   * Optional fixed width for the right-side control area (default: 160px).
   * Pass null to allow the control to size naturally.
   */
  rightWidthPx?: number | null
  /**
   * Optional override for the outer row container classes.
   * Useful when the parent already handles horizontal padding.
   */
  containerClassName?: string
  /**
   * Field description ID from FIELD_DESCRIPTIONS.
   * When provided, renders an info icon next to the label with a tooltip showing the description.
   */
  fieldDescriptionId?: string
  children: ReactNode
}

export function FormRow({
  label,
  hint,
  docsUrl,
  labelAction,
  layout = "stacked",
  rightWidthPx = null,
  containerClassName,
  fieldDescriptionId,
  children,
}: FormRowProps) {
  const hasLabel = Boolean(label)
  const isStacked = layout === "stacked"
  const isInline = layout === "inline"

  return (
    <div
      className={
        containerClassName ??
        (isStacked
          ? "flex w-full min-w-0 flex-col items-start gap-[4px] px-4"
          : "flex w-full min-w-0 items-center justify-between gap-4 px-4")
      }
    >
      {hasLabel ? (
        <div className={isStacked ? "min-w-0" : "min-w-0 shrink-0"}>
          {labelAction ? (
            <span className="inline-flex items-baseline gap-[6px]">
              <span className={FORM_LABEL_TEXT_CLASSES}>
                {label}
                {docsUrl && (
                  <>
                    {" · "}
                    <a href={docsUrl} target="_blank" rel="noopener noreferrer" className="font-[400] text-[#533AFD] hover:underline">Docs</a>
                  </>
                )}
              </span>
              {labelAction}
            </span>
          ) : (
            <span className={FORM_LABEL_TEXT_CLASSES}>
              {label}
              {docsUrl && (
                <>
                  {" · "}
                  <a href={docsUrl} target="_blank" rel="noopener noreferrer" className="font-[400] text-[#533AFD] hover:underline">Docs</a>
                </>
              )}
            </span>
          )}
          {hint}
        </div>
      ) : null}
      <div
        className={
          isStacked
            ? "w-full min-w-0 [&>*]:w-full [&>*]:min-w-0"
            : hasLabel
              ? "flex flex-1 justify-end"
              : "flex w-full justify-start"
        }
        style={isInline && rightWidthPx != null ? { width: `${rightWidthPx}px`, flex: "none" } : undefined}
      >
        {children}
      </div>
    </div>
  )
}

