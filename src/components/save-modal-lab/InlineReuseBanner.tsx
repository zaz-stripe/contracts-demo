import { KindGlyph, KIND_LABELS } from "./KindGlyph"
import type { ComponentKind } from "./scenarioTypes"

/** Inline banner shown contextually inside the editor form when the user
 *  modifies a reused component's pricing. Appears proactively rather than
 *  at save-time, so the user knows the implication before they're done. */
export function InlineReuseBanner({
  componentName,
  otherPlanCount,
  kind,
}: {
  componentName: string
  otherPlanCount: number
  kind: ComponentKind
}) {
  return (
    <div className="flex items-start gap-[8px] rounded-[6px] border border-[#A3D2FB] bg-[#EAF4FE] px-[10px] py-[8px]">
      <span className="mt-[1px] flex-shrink-0">
        <InfoIcon />
      </span>
      <div className="flex flex-col gap-[2px]">
        <p className="text-[12px] font-[600] leading-[16px] text-[#0055A0]">
          Changing the price will create a new version of this {KIND_LABELS[kind].toLowerCase()}.
        </p>
        <p className="flex items-center gap-[4px] text-[11px] font-[400] leading-[14px] text-[#0055A0]">
          <KindGlyph kind={kind} color="#0055A0" />
          <span className="font-[500]">{componentName}</span>
          <span aria-hidden="true">·</span>
          <span>
            The {otherPlanCount} other plan{otherPlanCount === 1 ? "" : "s"} using this component won&apos;t be affected.
          </span>
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
