"use client"

import type { ReactNode } from "react"

/** Mock of the inline "Get started" wizard form (left panel content). */
export function MockWizardForm({
  disabled = false,
  loading = false,
  onSubmit,
}: {
  disabled?: boolean
  loading?: boolean
  onSubmit: () => void
}) {
  return (
    <div
      className="flex h-full w-full flex-col bg-white pt-[16px]"
      style={{
        opacity: disabled ? 0.55 : 1,
        pointerEvents: disabled ? "none" : "auto",
        transition: "opacity 200ms ease-out",
      }}
      aria-busy={loading || undefined}
    >
      <div className="flex flex-col gap-[2px] px-[16px] pb-[12px]">
        <p className="text-[14px] font-[500] leading-[20px] tracking-[-0.15px] text-[#1A2C44]">
          Get started
        </p>
        <p className="text-[12px] font-[400] leading-[16px] text-[#50617A]">
          Create a new pricing plan
        </p>
      </div>
      <div className="flex flex-col gap-[12px] px-[16px]">
        <Field label="Plan name" placeholder="e.g. Starter" />
        <FieldRow
          label="Subscription fee"
          left={<MockInput placeholder="$ 0" />}
          right={<MockSelect label="Monthly" />}
        />
        <FieldRow
          label="Credit grant"
          left={<MockInput placeholder="$ 0" />}
          right={<MockSelect label="Monthly" />}
        />
        <Field
          label="What usage will customers be billed for?"
          placeholder="e.g. Credits, API calls, Bandwidth"
        />
        <button
          type="button"
          onClick={onSubmit}
          className="mt-[4px] flex h-[34px] w-full items-center justify-center rounded-[6px] bg-[#A99CFE] text-[12px] font-[600] text-white transition-colors hover:bg-[#8A77F5]"
        >
          {loading ? (
            <span className="flex items-center gap-[6px]">
              <Spinner />
              Get started
            </span>
          ) : (
            "Get started"
          )}
        </button>
      </div>
    </div>
  )
}

/** Mock of the destination "Pricing plan" details form. */
export function MockDestinationForm({ showPanelHeader = true }: { showPanelHeader?: boolean }) {
  return (
    <div className="flex h-full w-full flex-col bg-white">
      {showPanelHeader && (
        <div className="px-[16px] pt-[12px] pb-[8px]">
          <p className="text-[14px] font-[500] leading-[20px] tracking-[-0.15px] text-[#1A2C44]">
            Pricing plan
          </p>
        </div>
      )}
      <div className="flex flex-col gap-[12px] px-[16px] pt-[8px]">
        <Field label="Display name" placeholder="e.g. Pro plan" />
        <Field label="Currency" placeholder="🇺🇸 USD" hasChevron />
        <Field label="Include tax in prices" placeholder="Included in prices" hasChevron />
        <div className="mt-[4px] flex items-center justify-between rounded-[6px] border border-transparent px-[2px] py-[4px]">
          <p className="text-[13px] font-[600] text-[#1A2C44]">Advanced settings</p>
          <ChevronDown />
        </div>
      </div>
    </div>
  )
}

/** Skeleton loader matching the destination form layout. */
export function MockSkeletonForm({ showPanelHeader = true }: { showPanelHeader?: boolean }) {
  const sLight =
    "bg-[length:200%_100%] bg-[linear-gradient(90deg,#F5F6F8_25%,#FAFBFC_50%,#F5F6F8_75%)] animate-[shimmer_2s_linear_infinite]"
  const sDark =
    "bg-[length:200%_100%] bg-[linear-gradient(90deg,#EBEEF1_25%,#F5F6F8_50%,#EBEEF1_75%)] animate-[shimmer_2s_linear_infinite]"
  return (
    <div className="flex h-full w-full flex-col bg-white" aria-hidden="true">
      {showPanelHeader && (
        <div className="px-[16px] pt-[12px] pb-[8px]">
          <div className={`h-[14px] w-[80px] rounded-[40px] ${sDark}`} />
        </div>
      )}
      <div className="flex flex-col gap-[12px] px-[16px] pt-[8px]">
        <SkeletonField sLight={sLight} labelW={86} />
        <SkeletonField sLight={sLight} labelW={56} />
        <SkeletonField sLight={sLight} labelW={132} />
        <div className={`mt-[4px] h-[16px] w-[110px] rounded-[40px] ${sLight}`} />
      </div>
    </div>
  )
}

function SkeletonField({ sLight, labelW }: { sLight: string; labelW: number }) {
  return (
    <div className="flex flex-col gap-[4px]">
      <div className={`h-[10px] w-[${labelW}px] rounded-[40px] ${sLight}`} style={{ width: labelW }} />
      <div className={`h-[30px] w-full rounded-[6px] ${sLight}`} />
    </div>
  )
}

function Field({
  label,
  placeholder,
  hasChevron,
}: {
  label: string
  placeholder: string
  hasChevron?: boolean
}) {
  return (
    <div className="flex flex-col gap-[4px]">
      <p className="text-[12px] font-[600] leading-[16px] text-[#1A2C44]">{label}</p>
      <div className="flex h-[30px] w-full items-center justify-between rounded-[6px] border border-[#D4DEE9] bg-white px-[10px]">
        <p className="text-[12px] font-[400] text-[#8C95A6]">{placeholder}</p>
        {hasChevron && <ChevronDown />}
      </div>
    </div>
  )
}

function FieldRow({
  label,
  left,
  right,
}: {
  label: string
  left: ReactNode
  right: ReactNode
}) {
  return (
    <div className="flex flex-col gap-[4px]">
      <p className="text-[12px] font-[600] leading-[16px] text-[#1A2C44]">{label}</p>
      <div className="flex w-full">
        <div className="flex-1">{left}</div>
        <div className="w-[110px]">{right}</div>
      </div>
    </div>
  )
}

function MockInput({ placeholder }: { placeholder: string }) {
  return (
    <div className="flex h-[30px] w-full items-center rounded-l-[6px] border border-[#D4DEE9] bg-white px-[10px]">
      <p className="text-[12px] font-[400] text-[#8C95A6]">{placeholder}</p>
    </div>
  )
}

function MockSelect({ label }: { label: string }) {
  return (
    <div className="flex h-[30px] w-full items-center justify-between rounded-r-[6px] border-y border-r border-[#D4DEE9] bg-white px-[10px]">
      <p className="text-[12px] font-[400] text-[#1A2C44]">{label}</p>
      <ChevronDown />
    </div>
  )
}

function ChevronDown() {
  return (
    <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
      <path
        d="M1 1L5 5L9 1"
        stroke="#8C95A6"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Spinner() {
  return (
    <svg
      className="animate-spin"
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
    >
      <circle cx="6" cy="6" r="4.5" stroke="white" strokeOpacity="0.35" strokeWidth="1.5" />
      <path
        d="M10.5 6a4.5 4.5 0 0 0-4.5-4.5"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function VariantFrame({
  title,
  description,
  onReplay,
  children,
}: {
  title: string
  description: string
  onReplay: () => void
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-[10px] rounded-[10px] border border-[#EBEEF1] bg-white p-[14px]">
      <div className="flex items-start justify-between gap-[12px]">
        <div className="flex flex-col">
          <p className="text-[13px] font-[600] tracking-[-0.15px] text-[#1A2C44]">{title}</p>
          <p className="text-[12px] leading-[16px] text-[#3C4F69]">{description}</p>
        </div>
        <button
          type="button"
          onClick={onReplay}
          className="shrink-0 rounded-[6px] border border-[#1A2C44] bg-[#1A2C44] px-[10px] py-[5px] text-[12px] font-[500] text-white hover:bg-[#2C3E5C]"
        >
          ▶ Play
        </button>
      </div>
      <div className="relative h-[460px] w-full overflow-hidden rounded-[8px] border border-[#EBEEF1] bg-white">
        {children}
      </div>
    </div>
  )
}
