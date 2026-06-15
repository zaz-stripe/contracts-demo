import type { ReactNode } from "react"

/** Static, non-portaled chrome shared by all four variants. Mirrors the
 *  existing SaveVersionModal: 400px wide, 12px radius, white card, header
 *  with title + close icon, footer with Cancel + Confirm buttons. */
export function ModalShell({
  title,
  showDefaultToggle,
  isDefaultForNewSubscribers,
  onToggleDefault,
  children,
  confirmLabel = "Confirm",
}: {
  title: string
  showDefaultToggle: boolean
  isDefaultForNewSubscribers: boolean
  onToggleDefault: () => void
  children: ReactNode
  confirmLabel?: string
}) {
  return (
    <div
      className="w-[400px] rounded-[12px] border border-[#EBEEF1] bg-white shadow-[0_25px_80px_rgba(15,23,42,0.18)]"
      role="dialog"
      aria-modal="false"
      aria-label={title}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#EBEEF1] px-[16px] pt-[12px] pb-[11px]">
        <p className="text-[14px] font-[500] leading-[20px] tracking-[-0.15px] text-[#1A2C44]">
          {title}
        </p>
        <button
          type="button"
          className="flex items-center justify-center rounded-[6px] p-[8px] transition-colors hover:bg-[#F5F6F8]"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M0.248959 0.248959C0.580905 -0.0829864 1.1191 -0.0829864 1.45104 0.248959L5 3.79792L8.54896 0.248959C8.88091 -0.0829864 9.4191 -0.0829864 9.75104 0.248959C10.083 0.580905 10.083 1.1191 9.75104 1.45104L6.20208 5L9.75104 8.54896C10.083 8.88091 10.083 9.4191 9.75104 9.75104C9.4191 10.083 8.88091 10.083 8.54896 9.75104L5 6.20208L1.45104 9.75104C1.1191 10.083 0.580905 10.083 0.248959 9.75104C-0.0829864 9.4191 -0.0829864 8.88091 0.248959 8.54896L3.79792 5L0.248959 1.45104C-0.0829864 1.1191 -0.0829864 0.580905 0.248959 0.248959Z"
              fill="#474E5A"
            />
          </svg>
        </button>
      </div>

      {/* Name + default toggle */}
      <div className="border-b border-[#EBEEF1] px-[16px] py-[16px]">
        <div className={showDefaultToggle ? "mb-[16px]" : ""}>
          <label className="mb-[6px] block text-[12px] font-[500] leading-[16px] text-[#474E5A]">
            Name
          </label>
          <input
            type="text"
            defaultValue={defaultVersionName()}
            className="h-[32px] w-full rounded-[6px] border border-[#D8DEE4] bg-white p-[8px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] outline-none transition-all hover:border-[#B6C0CD] focus:border-[#A0D0F7] focus:shadow-[0_0_0_1.5px_#A0D0F7] placeholder:text-[#6C7688]"
          />
        </div>
        {showDefaultToggle && (
          <button type="button" className="flex items-center gap-[8px]" onClick={onToggleDefault}>
            <span
              className={`relative inline-flex h-[20px] w-[34px] shrink-0 items-center rounded-full transition-colors ${
                isDefaultForNewSubscribers ? "bg-[#675DFF]" : "bg-[#D8DEE4]"
              }`}
            >
              <span
                className={`inline-block h-[16px] w-[16px] rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.16)] transition-transform ${
                  isDefaultForNewSubscribers ? "translate-x-[16px]" : "translate-x-[2px]"
                }`}
              />
            </span>
            <span className="text-[12px] font-[500] leading-[16px] text-[#1A2C44]">
              New subscribers get this version
            </span>
          </button>
        )}
      </div>

      {/* Variant body */}
      {children}

      {/* Footer */}
      <div className="flex items-center justify-end gap-[8px] px-[16px] py-[12px]">
        <button
          type="button"
          className="flex h-[28px] items-center rounded-[6px] border border-[#D4DEE9] bg-white px-[10px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#273951] transition-colors hover:bg-[#F5F6F8]"
        >
          Cancel
        </button>
        <button
          type="button"
          className="flex h-[28px] items-center rounded-[6px] border border-[#533AFD] bg-[#675DFF] px-[10px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-white transition-colors hover:bg-[#5B52F0]"
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  )
}

function defaultVersionName(): string {
  const d = new Date()
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}
