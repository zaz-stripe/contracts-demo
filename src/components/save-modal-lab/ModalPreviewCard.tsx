import type { ReactNode } from "react"

/** Frames a modal variant as a static card so all variants can sit in a grid.
 *  The variants render their own modal chrome inside `children`. When the
 *  scenario is for a brand-new plan, the card swaps the variant for an
 *  empty-state arguing that no save modal should appear at all. */
export function ModalPreviewCard({
  label,
  tradeoff,
  isNewPlan,
  children,
  highlight = false,
}: {
  label: string
  tradeoff: string
  isNewPlan: boolean
  children: ReactNode
  /** Visually emphasise this card (used for the recommended hybrid). */
  highlight?: boolean
}) {
  return (
    <div
      className={`flex flex-col rounded-[10px] border p-[16px] ${
        highlight ? "border-[#A3D2FB] bg-[#F4F9FE]" : "border-[#EBEEF1] bg-[#F5F6F8]"
      }`}
    >
      <div className="mb-[12px]">
        <p
          className={`text-[12px] font-[600] leading-[16px] tracking-[-0.024px] ${
            highlight ? "text-[#0055A0]" : "text-[#1A2C44]"
          }`}
        >
          {label}
        </p>
        <p className="mt-[2px] text-[11px] font-[400] leading-[16px] text-[#6C7688]">{tradeoff}</p>
      </div>
      <div className="flex flex-1 items-start justify-center pt-[8px]">
        <div className="w-[400px]">{isNewPlan ? <NewPlanEmptyState /> : children}</div>
      </div>
    </div>
  )
}

function NewPlanEmptyState() {
  return (
    <div className="flex w-[400px] items-start gap-[8px] rounded-[8px] border border-dashed border-[#D8DEE4] bg-white px-[14px] py-[12px]">
      <span className="mt-[1px] flex-shrink-0">
        <InfoIcon />
      </span>
      <div>
        <p className="text-[12px] font-[600] leading-[16px] text-[#1A2C44]">
          No save modal needed for new plans
        </p>
        <p className="mt-[2px] text-[11px] font-[400] leading-[14px] text-[#6C7688]">
          Nothing exists yet to version against. The plan saves directly without confirmation.
        </p>
      </div>
    </div>
  )
}

function InfoIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 6C12 9.31371 9.31371 12 6 12C2.68629 12 0 9.31371 0 6C0 2.68629 2.68629 0 6 0C9.31371 0 12 2.68629 12 6ZM6 5C6.41421 5 6.75 5.33579 6.75 5.75V8.25C6.75 8.66421 6.41421 9 6 9C5.58579 9 5.25 8.66421 5.25 8.25V5.75C5.25 5.33579 5.58579 5 6 5ZM6 4.25C6.41421 4.25 6.75 3.91421 6.75 3.5C6.75 3.08579 6.41421 2.75 6 2.75C5.58579 2.75 5.25 3.08579 5.25 3.5C5.25 3.91421 5.58579 4.25 6 4.25Z"
        fill="#0073E6"
      />
    </svg>
  )
}
