'use client'

type NoPreviewStateProps = {
  /** e.g. "Customer", "Product" — shown in the title line */
  objectLabel?: string
  variant?: "default" | "review"
  /** Override the default helper line under the title */
  hint?: string
}

export function NoPreviewState({ objectLabel, variant = "default", hint }: NoPreviewStateProps) {
  if (variant === "review") {
    return (
      <div className="flex h-full min-h-[200px] flex-col items-start justify-start p-[24px]">
        <p className="text-[12px] font-[600] uppercase tracking-[0.5px] text-[#6C7688]">Preview</p>
        <p className="mt-[8px] max-w-[320px] text-[13px] font-[500] leading-[18px] text-[#353A44]">
          No live preview during review
        </p>
        <p className="mt-[6px] max-w-[320px] text-[12px] leading-[16px] text-[#6C7688]">
          Go back to editing to update objects or see the invoice preview.
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-[200px] flex-col items-start justify-start p-[24px]">
      <p className="text-[12px] font-[600] uppercase tracking-[0.5px] text-[#6C7688]">Preview</p>
      <p className="mt-[8px] max-w-[320px] text-[13px] font-[500] leading-[18px] text-[#353A44]">
        {objectLabel ? `No preview for ${objectLabel}` : "No preview for this object"}
      </p>
      <p className="mt-[6px] max-w-[320px] text-[12px] leading-[16px] text-[#6C7688]">
        {hint ??
          "Edits happen in the form on the left. A composed invoice preview appears when you select the invoice."}
      </p>
    </div>
  )
}
