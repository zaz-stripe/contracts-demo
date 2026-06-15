'use client'

// Gradient shimmer — animates background-position for a smooth, constant-speed sweep.
// Light variant (base #F5F6F8)
const sLight =
  "bg-[length:200%_100%] bg-[linear-gradient(90deg,#F5F6F8_25%,#FAFBFC_50%,#F5F6F8_75%)] animate-[shimmer_2s_linear_infinite]"
// Dark variant (base #EBEEF1)
const sDark =
  "bg-[length:200%_100%] bg-[linear-gradient(90deg,#EBEEF1_25%,#F5F6F8_50%,#EBEEF1_75%)] animate-[shimmer_2s_linear_infinite]"

/** Skeleton header matching the initial plan creation view. */
export function PlanFormSkeletonHeader() {
  return (
    <div className="flex items-center justify-between border-b border-[#ECF1F6] bg-white px-[16px] py-[12px]" aria-hidden="true">
      <div className="flex items-center gap-[8px]">
        <div className={`h-[14px] w-[90px] rounded-[40px] ${sDark}`} />
        <div className={`h-[24px] w-[24px] rounded-[6px] ${sLight}`} />
      </div>
    </div>
  )
}

/**
 * Skeleton loading state for the initial pricing plan creation form.
 * Mirrors the compact "Get started" form on the left and the empty preview
 * canvas on the right.
 */
export function PlanFormSkeleton() {
  return (
    <div className="flex h-full w-full bg-[#F5F6F8]" aria-hidden="true">
      <div className="flex w-full shrink-0 flex-col bg-white sm:w-[320px] sm:border-r sm:border-[#EBEEF1]">
        <div className="flex flex-col pt-[16px] pb-[16px]">
          <div className="flex flex-col gap-[2px] px-4 pb-[12px]">
            <div className="flex h-[20px] items-center">
              <div className={`h-[14px] w-[118px] rounded-[40px] ${sDark}`} />
            </div>
            <div className="flex h-[16px] items-center">
              <div className={`h-[10px] w-[164px] rounded-[40px] ${sLight}`} />
            </div>
          </div>

          <div className="flex flex-col gap-[12px]">
            <div className="flex w-full min-w-0 flex-col items-start gap-[4px] px-4">
              <div className="flex h-[16px] items-center">
                <div className={`h-[10px] w-[58px] rounded-[40px] ${sLight}`} />
              </div>
              <div className={`h-[30px] w-full rounded-[6px] ${sLight}`} />
            </div>

            <div className="flex w-full min-w-0 flex-col items-start gap-[4px] px-4">
              <div className="flex h-[16px] items-center">
                <div className={`h-[10px] w-[88px] rounded-[40px] ${sLight}`} />
              </div>
              <div className="flex w-full">
                <div className={`h-[30px] flex-1 rounded-l-[6px] ${sLight}`} />
                <div className={`h-[30px] w-[132px] rounded-r-[6px] ${sLight}`} />
              </div>
            </div>

            <div className="flex w-full min-w-0 flex-col items-start gap-[4px] px-4">
              <div className="flex h-[16px] items-center">
                <div className={`h-[10px] w-[74px] rounded-[40px] ${sLight}`} />
              </div>
              <div className="flex w-full">
                <div className={`h-[30px] flex-1 rounded-l-[6px] ${sLight}`} />
                <div className={`h-[30px] w-[132px] rounded-r-[6px] ${sLight}`} />
              </div>
            </div>

            <div className="flex w-full min-w-0 flex-col items-start gap-[4px] px-4">
              <div className="flex h-[16px] items-center">
                <div className={`h-[10px] w-[198px] rounded-[40px] ${sLight}`} />
              </div>
              <div className={`h-[34px] w-full rounded-[6px] ${sLight}`} />
              <div className="mt-[2px] flex h-[16px] items-center">
                <div className={`h-[8px] w-[108px] rounded-[40px] ${sLight}`} />
              </div>
            </div>

            <div className="px-4">
              <div className={`h-[34px] w-full rounded-[6px] ${sLight}`} />
            </div>
          </div>
        </div>
      </div>

      <div
        className="hidden min-w-0 flex-1 overflow-hidden sm:block"
        style={{
          background: "var(--neutral-25, #F4F7FA)",
          boxShadow: "0 0 16px 0 rgba(0, 0, 0, 0.02) inset, 0 0 39px 0 rgba(0, 0, 0, 0.01) inset, 0 0 77px 0 rgba(0, 0, 0, 0.03) inset",
        }}
      >
        <div className="flex min-h-full flex-col items-center px-[24px]">
          <div className="min-h-[120px] flex-1" />
          <div className="flex w-full shrink-0 justify-center">
            <div className="w-full max-w-[432px] overflow-hidden rounded-[12px] border border-[#D4DEE9] bg-white">
              <div className="flex flex-col gap-[16px] border-b border-[#D4DEE9] p-[24px]">
                <div className={`h-[20px] w-[112px] rounded-[40px] ${sDark}`} />
                <div className="flex flex-col gap-[6px]">
                  <div className={`h-[14px] w-[96px] rounded-[40px] ${sLight}`} />
                  <div className={`h-[10px] w-[188px] rounded-[40px] ${sLight}`} />
                </div>
              </div>
              <div className="flex flex-col gap-[6px] px-[24px] py-[16px]">
                <div className={`h-[14px] w-[42px] rounded-[40px] ${sLight}`} />
                <div className={`h-[10px] w-[132px] rounded-[40px] ${sLight}`} />
              </div>
            </div>
          </div>
          <div className="min-h-[40px] flex-1" />
        </div>
      </div>
    </div>
  )
}

/** Lightweight form-only skeleton shown during add-item transitions. */
export function PlanFormTransitionSkeleton() {
  return (
    <div className="flex h-full w-full flex-col bg-white" aria-hidden="true">
      {/* Title */}
      <div className="border-b border-[#EBEEF1] px-[16px] py-[14px]">
        <div className={`h-[14px] w-[80px] rounded-[40px] ${sDark}`} />
      </div>
      {/* Form fields */}
      <div className="flex flex-col gap-[12px] px-[16px] py-[16px]">
        <div className="flex flex-col gap-[4px]">
          <div className={`h-[10px] w-[110px] rounded-[40px] ${sLight}`} />
          <div className={`h-[30px] w-full rounded-[6px] ${sLight}`} />
        </div>
        <div className="flex flex-col gap-[4px]">
          <div className={`h-[10px] w-[70px] rounded-[40px] ${sLight}`} />
          <div className={`h-[30px] w-full rounded-[6px] ${sLight}`} />
        </div>
        <div className="flex flex-col gap-[4px]">
          <div className={`h-[10px] w-[90px] rounded-[40px] ${sLight}`} />
          <div className={`h-[30px] w-full rounded-[6px] ${sLight}`} />
        </div>
      </div>
    </div>
  )
}

/** Lightweight sidebar-only skeleton shown during add-item transitions. */
export function PlanSidebarTransitionSkeleton() {
  return (
    <div className="flex h-full w-full flex-col bg-[#151921]" aria-hidden="true">
      {/* Filter bar */}
      <div className="px-[12px] py-[10px]">
        <div className="h-[32px] w-full rounded-[6px] bg-[#1E2330]" />
      </div>
      {/* Nav items */}
      <div className="flex flex-col gap-[2px] px-[8px]">
        <div className="h-[28px] w-full rounded-[6px] bg-[#1E2330]" />
        <div className="ml-[16px] h-[28px] w-[calc(100%-16px)] rounded-[6px] bg-[#1A1F2B]" />
        <div className="ml-[32px] h-[28px] w-[calc(100%-32px)] rounded-[6px] bg-[#1A1F2B]" />
      </div>
    </div>
  )
}
